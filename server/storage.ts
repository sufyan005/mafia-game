import { type Player, type Room, type ChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Room operations
  getRoom(roomId: string): Room | undefined;
  createRoom(roomId: string): Room;
  updateRoom(room: Room): void;
  
  // Player operations
  getPlayer(playerId: string): Player | undefined;
  addPlayerToRoom(roomId: string, player: Player): void;
  removePlayerFromRoom(roomId: string, playerId: string): void;
  updatePlayer(player: Player): void;
  
  // Chat operations
  addChatMessage(message: ChatMessage): void;
  getChatMessages(roomId: string, type?: 'public' | 'mafia'): ChatMessage[];
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;
  private players: Map<string, Player>;
  private chatMessages: Map<string, ChatMessage[]>;

  constructor() {
    this.rooms = new Map();
    this.players = new Map();
    this.chatMessages = new Map();
    
    // Initialize the two hardcoded rooms
    this.createRoom('room1');
    this.createRoom('room2');
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  createRoom(roomId: string): Room {
    const room: Room = {
      id: roomId,
      players: [],
      gameState: 'waiting',
      timer: 0,
      nightVotes: {},
      dayVotes: {},
      gameEvents: [],
    };
    this.rooms.set(roomId, room);
    this.chatMessages.set(roomId, []);
    return room;
  }

  updateRoom(room: Room): void {
    this.rooms.set(room.id, room);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  addPlayerToRoom(roomId: string, player: Player): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    // Set as owner if first player
    if (room.players.length === 0) {
      player.isOwner = true;
    }

    room.players.push(player);
    this.players.set(player.id, player);
    this.updateRoom(room);
  }

  removePlayerFromRoom(roomId: string, playerId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const wasOwner = room.players[playerIndex].isOwner;
    room.players.splice(playerIndex, 1);
    this.players.delete(playerId);

    // Transfer ownership to next player if owner left
    if (wasOwner && room.players.length > 0) {
      room.players[0].isOwner = true;
      this.players.set(room.players[0].id, room.players[0]);
    }

    this.updateRoom(room);
  }

  updatePlayer(player: Player): void {
    this.players.set(player.id, player);
    
    // Update player in room as well
    const room = this.getRoom(player.room);
    if (room) {
      const playerIndex = room.players.findIndex(p => p.id === player.id);
      if (playerIndex !== -1) {
        room.players[playerIndex] = player;
        this.updateRoom(room);
      }
    }
  }

  addChatMessage(message: ChatMessage): void {
    const messages = this.chatMessages.get(message.room) || [];
    messages.push(message);
    this.chatMessages.set(message.room, messages);
  }

  getChatMessages(roomId: string, type?: 'public' | 'mafia'): ChatMessage[] {
    const messages = this.chatMessages.get(roomId) || [];
    if (type) {
      return messages.filter(m => m.type === type);
    }
    return messages;
  }
}

export const storage = new MemStorage();
