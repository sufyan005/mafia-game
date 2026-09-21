import { chatMessageInputSchema, detectiveInvestigateSchema, doctorSaveSchema, joinRoomSchema, startGameSchema, voteSchema, type ChatMessage, type Player, type Room } from "../shared/schema";

type Env = { ASSETS: Fetcher; ROOM: DurableObjectNamespace };
type Command = { event: string; data?: unknown };
type Stored = { room: Room; nightTarget?: string; deadline?: number };
const durations = { break: 5, night: 50, day: 90 } as const;

export default { async fetch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/health") return Response.json({ ok: true });
  if (url.pathname.startsWith("/ws/")) {
    const room = url.pathname.slice(4);
    if (room !== "room1" && room !== "room2") return new Response("Room not found", { status: 404 });
    return env.ROOM.get(env.ROOM.idFromName(room)).fetch(new Request(request, { headers: new Headers({ ...Object.fromEntries(request.headers), "X-Room": room }) }));
  }
  return env.ASSETS.fetch(request);
} };

export class RoomDurableObject {
  private room: Room = createRoom("room1");
  private nightTarget?: string;
  private deadline?: number;
  private loaded?: Promise<void>;
  private sockets = new Map<WebSocket, string>();
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    await this.load();
    const roomId = request.headers.get("X-Room");
    if (roomId && this.room.players.length === 0) this.room.id = roomId;
    if (request.headers.get("Upgrade") !== "websocket") return new Response("WebSocket required", { status: 426 });
    const pair = new WebSocketPair();
    const socket = pair[1];
    socket.accept(); this.sockets.set(socket, "");
    socket.addEventListener("message", event => void this.command(socket, String(event.data)));
    socket.addEventListener("close", () => void this.leave(socket));
    socket.addEventListener("error", () => void this.leave(socket));
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async alarm(): Promise<void> {
    await this.load();
    if (!this.room.phase || this.room.gameState === "ended") return;
    if (this.deadline && Date.now() < this.deadline) {
      this.room.timer = Math.ceil((this.deadline - Date.now()) / 1000);
      await this.save();
      this.broadcast("timer-update", { timer: this.room.timer });
      await this.state.storage.setAlarm(Date.now() + 1000);
      return;
    }
    if (this.room.phase === "break" && this.nightTarget !== undefined) { const target = this.nightTarget; this.nightTarget = undefined; await this.resolveNight(target); }
    else if (this.room.phase === "break") await this.phase("night");
    else if (this.room.phase === "night") { this.nightTarget = this.mafiaTarget(); await this.phase("break"); }
    else await this.resolveDay();
  }

  private async load(): Promise<void> { if (!this.loaded) this.loaded = this.state.storage.get<Stored>("game").then(value => { if (value) { this.room = value.room; this.nightTarget = value.nightTarget; this.deadline = value.deadline; } }); await this.loaded; }
  private save(): Promise<void> { return this.state.storage.put("game", { room: this.room, nightTarget: this.nightTarget, deadline: this.deadline }); }
  private send(socket: WebSocket, event: string, data: unknown): void { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ event, data })); }
  private broadcast(event: string, data: unknown): void { this.sockets.forEach(socket => this.send(socket, event, data)); }
  private toPlayer(id: string, event: string, data: unknown): void { this.sockets.forEach((socket, playerId) => { if (playerId === id) this.send(socket, event, data); }); }

  private async command(socket: WebSocket, raw: string): Promise<void> {
    try {
      const command = JSON.parse(raw) as Command;
      if (command.event === "join-room") return await this.join(socket, command.data);
      const player = this.room.players.find(item => item.id === this.sockets.get(socket));
      if (command.event === "get-room-status" && typeof command.data === "string") return this.send(socket, "room-status", { roomId: command.data, playerCount: this.room.players.length, gameState: this.room.gameState });
      if (!player) return this.send(socket, "error", { message: "Join a room first" });
      if (command.event === "start-game") return await this.start(player, command.data);
      if (command.event === "vote") return await this.vote(player, command.data);
      if (command.event === "doctor-save") return await this.doctorSave(player, command.data);
      if (command.event === "detective-investigate") return await this.investigate(player, command.data);
      if (command.event === "chat-message") return await this.chat(player, command.data);
      if (command.event === "restart-game" || command.event === "end-game") return await this.reset(player, command.event);
    } catch { this.send(socket, "error", { message: "Invalid request" }); }
  }

  private async join(socket: WebSocket, raw: unknown): Promise<void> { const data = joinRoomSchema.parse(raw); this.pruneDisconnectedPlayers(); if (data.room !== this.room.id || this.room.players.length >= 20 || this.room.gameState !== "waiting") return this.send(socket, "error", { message: "Cannot join room" }); const id = typeof (raw as { clientId?: unknown })?.clientId === "string" ? (raw as { clientId: string }).clientId : crypto.randomUUID(); const player: Player = { id, displayName: data.displayName, room: data.room, isAlive: true, isOwner: this.room.players.length === 0, votes: {} }; this.sockets.set(socket, id); this.room.players.push(player); await this.save(); this.send(socket, "joined-room", { room: this.room, player }); this.broadcast("player-joined", { player, room: this.room }); this.broadcast("room-updated", { room: this.room }); }

  private pruneDisconnectedPlayers(): void { const connectedIds = new Set([...this.sockets.entries()].filter(([socket]) => socket.readyState === WebSocket.OPEN).map(([, playerId]) => playerId).filter(Boolean)); this.room.players = this.room.players.filter(player => connectedIds.has(player.id)); if (this.room.players.length > 0 && !this.room.players.some(player => player.isOwner)) this.room.players[0].isOwner = true; }

  private async start(player: Player, raw: unknown): Promise<void> { const config = startGameSchema.parse(raw); if (!player.isOwner || this.room.players.length < 4 || config.mafiaCount + config.doctorCount + config.detectiveCount > this.room.players.length) return this.toPlayer(player.id, "error", { message: "Cannot start game" }); const roles: Player["role"][] = [...Array(config.mafiaCount).fill("mafia"), ...Array(config.doctorCount).fill("doctor"), ...Array(config.detectiveCount).fill("detective")]; while (roles.length < this.room.players.length) roles.push("villager"); for (let index = roles.length - 1; index > 0; index--) { const other = Math.floor(Math.random() * (index + 1)); [roles[index], roles[other]] = [roles[other], roles[index]]; } this.room.players.forEach((item, index) => { item.role = roles[index]; item.isAlive = true; }); this.room.roleConfig = config; this.room.gameState = "break"; this.room.phase = "break"; this.room.timer = durations.break; this.deadline = Date.now() + durations.break * 1000; this.room.nightVotes = {}; this.room.dayVotes = {}; this.room.gameEvents = []; await this.save(); this.broadcast("game-started", { room: this.room, players: this.room.players }); this.room.players.forEach(item => this.toPlayer(item.id, "role-assigned", { role: item.role, teammates: item.role === "mafia" ? this.room.players.filter(other => other.role === "mafia" && other.id !== item.id) : [] })); this.broadcast("phase-change", { phase: "break", timer: durations.break }); await this.state.storage.setAlarm(Date.now() + 1000); }

  private async phase(name: "break" | "night" | "day"): Promise<void> { this.room.phase = name; this.room.gameState = name; this.room.timer = durations[name]; this.deadline = Date.now() + durations[name] * 1000; if (name === "night") { this.room.nightVotes = {}; this.room.dayVotes = {}; this.room.doctorSave = undefined; this.room.detectiveInvestigation = undefined; } if (name === "day") this.room.dayVotes = {}; await this.save(); this.broadcast("phase-change", { phase: name, timer: durations[name] }); await this.state.storage.setAlarm(Date.now() + 1000); }
  private mafiaTarget(): string | undefined { const mafia = this.room.players.filter(item => item.role === "mafia" && item.isAlive); const counts: Record<string, number> = {}; mafia.forEach(item => { const target = this.room.nightVotes[item.id]; if (target) counts[target] = (counts[target] || 0) + 1; }); return Object.entries(counts).find(([, count]) => count === mafia.length)?.[0]; }
  private async resolveNight(target?: string): Promise<void> { const victim = target && target !== this.room.doctorSave ? this.room.players.find(item => item.id === target) : undefined; if (victim) { victim.isAlive = false; this.broadcast("player-eliminated", { player: victim, reason: "night", timestamp: Date.now() }); } await this.save(); this.broadcast("room-updated", { room: this.room }); if (!(await this.winner())) await this.phase("day"); }
  private async resolveDay(): Promise<void> { const counts: Record<string, number> = {}; this.room.players.filter(item => item.isAlive).forEach(item => { const target = this.room.dayVotes[item.id]; if (target) counts[target] = (counts[target] || 0) + 1; }); const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]); const tie = ordered.length > 1 && ordered[0][1] === ordered[1][1]; const victim = ordered[0] && !tie ? this.room.players.find(item => item.id === ordered[0][0]) : undefined; if (victim) { victim.isAlive = false; this.broadcast("player-eliminated", { player: victim, reason: "day", votes: counts, timestamp: Date.now() }); } else this.broadcast("no-elimination", { reason: tie ? "tie" : "no-votes", votes: counts, timestamp: Date.now() }); await this.save(); this.broadcast("room-updated", { room: this.room }); if (!(await this.winner())) await this.phase("night"); }
  private async winner(): Promise<boolean> { const alive = this.room.players.filter(item => item.isAlive); const mafia = alive.filter(item => item.role === "mafia"); const winner = mafia.length === 0 ? "civilians" : mafia.length >= alive.length - mafia.length ? "mafia" : undefined; if (!winner) return false; this.room.gameState = "ended"; this.room.winner = winner; this.deadline = undefined; await this.save(); await this.state.storage.deleteAlarm(); this.broadcast("game-over", { winner, winners: winner === "mafia" ? this.room.players.filter(item => item.role === "mafia") : this.room.players.filter(item => item.role !== "mafia"), room: this.room }); return true; }
  private async vote(player: Player, raw: unknown): Promise<void> { const { target, phase } = voteSchema.parse(raw); const targetPlayer = this.room.players.find(item => item.id === target); if (!player.isAlive || this.room.phase !== phase || !targetPlayer || (phase === "night" && (player.role !== "mafia" || targetPlayer.role === "mafia"))) return this.toPlayer(player.id, "error", { message: "Invalid vote" }); if (phase === "night") this.room.nightVotes[player.id] = target; else this.room.dayVotes[player.id] = target; await this.save(); this.broadcast("vote-cast", { voter: player.id, voterName: player.displayName, target: targetPlayer.displayName, phase }); if (phase === "day" && this.room.players.filter(item => item.isAlive).every(item => this.room.dayVotes[item.id])) { await this.state.storage.deleteAlarm(); await this.resolveDay(); } }
  private async doctorSave(player: Player, raw: unknown): Promise<void> { const { target } = doctorSaveSchema.parse(raw); if (!player.isAlive || player.role !== "doctor" || this.room.phase !== "night") return this.toPlayer(player.id, "error", { message: "Invalid save action" }); this.room.doctorSave = target; await this.save(); this.toPlayer(player.id, "action-confirmed", { action: "save", target }); }
  private async investigate(player: Player, raw: unknown): Promise<void> { const { target } = detectiveInvestigateSchema.parse(raw); const targetPlayer = this.room.players.find(item => item.id === target); if (!player.isAlive || player.role !== "detective" || this.room.phase !== "night" || this.room.detectiveInvestigation || !targetPlayer) return this.toPlayer(player.id, "error", { message: "Invalid investigation" }); this.room.detectiveInvestigation = target; await this.save(); this.toPlayer(player.id, "investigation-result", { target, targetName: targetPlayer.displayName, isMafia: targetPlayer.role === "mafia" }); }
  private async chat(player: Player, raw: unknown): Promise<void> { const { message, type } = chatMessageInputSchema.parse(raw); if ((type === "mafia" && (player.role !== "mafia" || this.room.phase !== "night")) || (type === "public" && this.room.phase !== "day")) return this.toPlayer(player.id, "error", { message: "Cannot send message" }); const chat: ChatMessage = { id: crypto.randomUUID(), sender: player.id, senderName: player.displayName, message, type, timestamp: Date.now(), room: this.room.id }; if (type === "mafia") this.room.players.filter(item => item.role === "mafia").forEach(item => this.toPlayer(item.id, "chat-message", chat)); else this.broadcast("chat-message", chat); }
  private async reset(player: Player, event: string): Promise<void> { if (!player.isOwner) return this.toPlayer(player.id, "error", { message: "Only room owner can reset the game" }); this.room.gameState = "waiting"; this.room.phase = undefined; this.room.timer = 0; this.room.nightVotes = {}; this.room.dayVotes = {}; this.room.doctorSave = undefined; this.room.detectiveInvestigation = undefined; this.room.gameEvents = []; this.room.winner = undefined; this.room.players.forEach(item => { item.role = undefined; item.isAlive = true; item.votes = {}; }); this.nightTarget = undefined; this.deadline = undefined; await this.save(); await this.state.storage.deleteAlarm(); this.broadcast(event === "restart-game" ? "game-restarted" : "game-ended", { room: this.room }); }
  private async leave(socket: WebSocket): Promise<void> { const id = this.sockets.get(socket); this.sockets.delete(socket); if (!id) return; const player = this.room.players.find(item => item.id === id); if (!player) return; this.room.players = this.room.players.filter(item => item.id !== id); if (player.isOwner && this.room.players[0]) this.room.players[0].isOwner = true; await this.save(); this.broadcast("player-left", { player, room: this.room }); this.broadcast("room-updated", { room: this.room }); }
}
function createRoom(id: string): Room { return { id, players: [], gameState: "waiting", timer: 0, nightVotes: {}, dayVotes: {}, gameEvents: [] }; }
