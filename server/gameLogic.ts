import { type Room, type Player } from "@shared/schema";
import { storage } from "./storage";
import { Server as SocketIOServer } from "socket.io";

export class GameLogic {
  private io: SocketIOServer;
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  startGame(roomId: string): boolean {
    const room = storage.getRoom(roomId);
    if (!room || room.players.length < 4 || room.players.length > 20) {
      return false;
    }

    // Assign roles randomly
    this.assignRoles(room);
    
    // Start night phase
    room.gameState = 'night';
    room.phase = 'night';
    room.timer = 50;
    room.nightVotes = {};
    room.dayVotes = {};
    room.doctorSave = undefined;
    room.detectiveInvestigation = undefined;
    
    storage.updateRoom(room);
    
    // Notify all players
    this.io.to(roomId).emit('game-started', {
      room,
      players: room.players,
    });
    
    // Send individual role information
    room.players.forEach(player => {
      this.io.to(player.id).emit('role-assigned', {
        role: player.role,
        teammates: player.role === 'mafia' ? 
          room.players.filter(p => p.role === 'mafia' && p.id !== player.id) : []
      });
    });
    
    this.startPhaseTimer(roomId);
    return true;
  }

  private assignRoles(room: Room): void {
    const players = [...room.players];
    const playerCount = players.length;
    
    // Calculate role distribution
    const mafiaCount = Math.floor(playerCount / 4) + 1; // At least 1 mafia, roughly 1/4 of players
    const doctorCount = 1;
    const detectiveCount = 1;
    const villagerCount = playerCount - mafiaCount - doctorCount - detectiveCount;
    
    const roles: string[] = [];
    for (let i = 0; i < mafiaCount; i++) roles.push('mafia');
    for (let i = 0; i < doctorCount; i++) roles.push('doctor');
    for (let i = 0; i < detectiveCount; i++) roles.push('detective');
    for (let i = 0; i < villagerCount; i++) roles.push('villager');
    
    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    
    // Assign roles to players
    players.forEach((player, index) => {
      player.role = roles[index] as 'mafia' | 'doctor' | 'detective' | 'villager';
      player.isAlive = true;
      storage.updatePlayer(player);
    });
  }

  private startPhaseTimer(roomId: string): void {
    const existingTimer = this.timers.get(roomId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    const timer = setInterval(() => {
      const room = storage.getRoom(roomId);
      if (!room || room.gameState === 'ended') {
        clearInterval(timer);
        this.timers.delete(roomId);
        return;
      }

      room.timer--;
      storage.updateRoom(room);
      
      this.io.to(roomId).emit('timer-update', { timer: room.timer });

      if (room.timer <= 0) {
        clearInterval(timer);
        this.timers.delete(roomId);
        this.endPhase(roomId);
      }
    }, 1000);

    this.timers.set(roomId, timer);
  }

  private endPhase(roomId: string): void {
    const room = storage.getRoom(roomId);
    if (!room) return;

    if (room.phase === 'night') {
      this.endNightPhase(roomId);
    } else if (room.phase === 'day') {
      this.endDayPhase(roomId);
    } else if (room.phase === 'break') {
      this.endBreakPhase(roomId);
    }
  }

  private endNightPhase(roomId: string): void {
    const room = storage.getRoom(roomId);
    if (!room) return;

    // Process night actions
    const mafiaTarget = this.getMafiaConsensusTarget(room);
    const doctorSave = room.doctorSave;
    
    // Start break phase
    room.gameState = 'break';
    room.phase = 'break';
    room.timer = 5;
    
    storage.updateRoom(room);
    
    this.io.to(roomId).emit('phase-change', {
      phase: 'break',
      timer: 5,
    });

    // Process elimination after break
    setTimeout(() => {
      this.processNightElimination(roomId, mafiaTarget, doctorSave);
    }, 5000);
    
    this.startPhaseTimer(roomId);
  }

  private processNightElimination(roomId: string, mafiaTarget?: string, doctorSave?: string): void {
    const room = storage.getRoom(roomId);
    if (!room) return;

    let eliminatedPlayer: Player | undefined;
    
    if (mafiaTarget && mafiaTarget !== doctorSave) {
      // Someone was killed
      const player = room.players.find(p => p.id === mafiaTarget);
      if (player) {
        player.isAlive = false;
        eliminatedPlayer = player;
        storage.updatePlayer(player);
        
        room.gameEvents.push({
          type: 'elimination',
          message: `${player.displayName} was eliminated during the night`,
          timestamp: Date.now(),
        });
      }
    } else if (mafiaTarget && mafiaTarget === doctorSave) {
      // Someone was saved
      room.gameEvents.push({
        type: 'save',
        message: 'Someone was saved by the doctor',
        timestamp: Date.now(),
      });
    }

    storage.updateRoom(room);

    if (eliminatedPlayer) {
      this.io.to(roomId).emit('player-eliminated', {
        player: eliminatedPlayer,
        reason: 'night',
      });
    }

    // Check win conditions
    if (this.checkWinConditions(roomId)) {
      return;
    }

    // Start day phase
    this.startDayPhase(roomId);
  }

  private startDayPhase(roomId: string): void {
    const room = storage.getRoom(roomId);
    if (!room) return;

    room.gameState = 'day';
    room.phase = 'day';
    room.timer = 90;
    room.dayVotes = {};
    
    storage.updateRoom(room);
    
    this.io.to(roomId).emit('phase-change', {
      phase: 'day',
      timer: 90,
    });
    
    this.startPhaseTimer(roomId);
  }

  private endDayPhase(roomId: string): void {
    const room = storage.getRoom(roomId);
    if (!room) return;

    // Count votes
    const voteCount: Record<string, number> = {};
    const alivePlayers = room.players.filter(p => p.isAlive);
    
    alivePlayers.forEach(player => {
      const vote = room.dayVotes[player.id];
      if (vote) {
        voteCount[vote] = (voteCount[vote] || 0) + 1;
      }
    });

    // Find player with most votes
    let maxVotes = 0;
    let eliminatedPlayerId: string | undefined;
    let isTie = false;
    
    Object.entries(voteCount).forEach(([playerId, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminatedPlayerId = playerId;
        isTie = false;
      } else if (votes === maxVotes && maxVotes > 0) {
        isTie = true;
      }
    });

    let eliminatedPlayer: Player | undefined;
    
    if (!isTie && eliminatedPlayerId) {
      const player = room.players.find(p => p.id === eliminatedPlayerId);
      if (player) {
        player.isAlive = false;
        eliminatedPlayer = player;
        storage.updatePlayer(player);
        
        room.gameEvents.push({
          type: 'elimination',
          message: `${player.displayName} was voted out`,
          timestamp: Date.now(),
        });
      }
    } else {
      room.gameEvents.push({
        type: 'no-elimination',
        message: 'No one was eliminated due to a tie vote',
        timestamp: Date.now(),
      });
    }

    storage.updateRoom(room);

    if (eliminatedPlayer) {
      this.io.to(roomId).emit('player-eliminated', {
        player: eliminatedPlayer,
        reason: 'day',
        votes: voteCount,
      });
    } else {
      this.io.to(roomId).emit('no-elimination', {
        reason: isTie ? 'tie' : 'no-votes',
        votes: voteCount,
      });
    }

    // Check win conditions
    if (this.checkWinConditions(roomId)) {
      return;
    }

    // Start next night phase
    this.startNightPhase(roomId);
  }

  private startNightPhase(roomId: string): void {
    const room = storage.getRoom(roomId);
    if (!room) return;

    room.gameState = 'night';
    room.phase = 'night';
    room.timer = 50;
    room.nightVotes = {};
    room.doctorSave = undefined;
    room.detectiveInvestigation = undefined;
    
    storage.updateRoom(room);
    
    this.io.to(roomId).emit('phase-change', {
      phase: 'night',
      timer: 50,
    });
    
    this.startPhaseTimer(roomId);
  }

  private endBreakPhase(roomId: string): void {
    // Break phase is handled by the processNightElimination timeout
    // This method exists for completeness but shouldn't be called
  }

  private getMafiaConsensusTarget(room: Room): string | undefined {
    const mafiaPlayers = room.players.filter(p => p.role === 'mafia' && p.isAlive);
    if (mafiaPlayers.length === 0) return undefined;

    // Count mafia votes
    const voteCount: Record<string, number> = {};
    mafiaPlayers.forEach(player => {
      const vote = room.nightVotes[player.id];
      if (vote) {
        voteCount[vote] = (voteCount[vote] || 0) + 1;
      }
    });

    // Check if all mafia voted for the same target
    const totalMafiaCount = mafiaPlayers.length;
    for (const [target, votes] of Object.entries(voteCount)) {
      if (votes === totalMafiaCount) {
        return target;
      }
    }

    return undefined;
  }

  private checkWinConditions(roomId: string): boolean {
    const room = storage.getRoom(roomId);
    if (!room) return false;

    const alivePlayers = room.players.filter(p => p.isAlive);
    const aliveMafia = alivePlayers.filter(p => p.role === 'mafia');
    const aliveCivilians = alivePlayers.filter(p => p.role !== 'mafia');

    let winner: string | undefined;

    if (aliveMafia.length === 0) {
      winner = 'civilians';
    } else if (aliveMafia.length >= aliveCivilians.length) {
      winner = 'mafia';
    }

    if (winner) {
      room.gameState = 'ended';
      room.winner = winner;
      storage.updateRoom(room);

      // Clear timer
      const timer = this.timers.get(roomId);
      if (timer) {
        clearInterval(timer);
        this.timers.delete(roomId);
      }

      this.io.to(roomId).emit('game-over', {
        winner,
        winners: winner === 'mafia' ? 
          room.players.filter(p => p.role === 'mafia') :
          room.players.filter(p => p.role !== 'mafia'),
        room,
      });

      return true;
    }

    return false;
  }

  submitVote(playerId: string, target: string, phase: 'night' | 'day'): boolean {
    const player = storage.getPlayer(playerId);
    if (!player || !player.isAlive) return false;

    const room = storage.getRoom(player.room);
    if (!room || room.phase !== phase) return false;

    if (phase === 'night') {
      // Only mafia can vote at night
      if (player.role !== 'mafia') return false;
      room.nightVotes[playerId] = target;
    } else {
      // Anyone can vote during day
      room.dayVotes[playerId] = target;
    }

    storage.updateRoom(room);
    
    this.io.to(player.room).emit('vote-cast', {
      voter: playerId,
      voterName: player.displayName,
      target,
      phase,
    });

    return true;
  }

  submitDoctorSave(playerId: string, target: string): boolean {
    const player = storage.getPlayer(playerId);
    if (!player || !player.isAlive || player.role !== 'doctor') return false;

    const room = storage.getRoom(player.room);
    if (!room || room.phase !== 'night') return false;

    room.doctorSave = target;
    storage.updateRoom(room);

    this.io.to(playerId).emit('action-confirmed', {
      action: 'save',
      target,
    });

    return true;
  }

  submitDetectiveInvestigation(playerId: string, target: string): boolean {
    const player = storage.getPlayer(playerId);
    if (!player || !player.isAlive || player.role !== 'detective') return false;

    const room = storage.getRoom(player.room);
    if (!room || room.phase !== 'night') return false;

    const targetPlayer = room.players.find(p => p.id === target);
    if (!targetPlayer) return false;

    room.detectiveInvestigation = target;
    storage.updateRoom(room);

    const isMafia = targetPlayer.role === 'mafia';
    
    this.io.to(playerId).emit('investigation-result', {
      target: target,
      targetName: targetPlayer.displayName,
      isMafia,
    });

    return true;
  }

  restartGame(roomId: string, playerId: string): boolean {
    const room = storage.getRoom(roomId);
    if (!room) return false;

    const player = storage.getPlayer(playerId);
    if (!player || !player.isOwner) return false;

    // Reset game state
    room.gameState = 'waiting';
    room.phase = undefined;
    room.timer = 0;
    room.nightVotes = {};
    room.dayVotes = {};
    room.doctorSave = undefined;
    room.detectiveInvestigation = undefined;
    room.gameEvents = [];
    room.winner = undefined;

    // Reset all players
    room.players.forEach(p => {
      p.role = undefined;
      p.isAlive = true;
      p.votes = {};
      storage.updatePlayer(p);
    });

    storage.updateRoom(room);

    // Clear any existing timer
    const timer = this.timers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(roomId);
    }

    this.io.to(roomId).emit('game-restarted', { room });

    return true;
  }
}
