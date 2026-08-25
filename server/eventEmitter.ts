import { Server as SocketIOServer } from "socket.io";
import { type Player } from "@shared/schema";

export interface GameEvent {
  type: string;
  message: string;
  data: any;
  timestamp: number;
  immediate?: boolean;
}

export class ImmediateEventEmitter {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  emit(roomId: string, event: GameEvent): void {
    if (event.immediate) {
      // Emit immediately without waiting for phase completion
      this.io.to(roomId).emit('immediate-game-event', event);
    }
  }

  emitElimination(roomId: string, player: Player, reason: string): void {
    const event: GameEvent = {
      type: 'elimination',
      message: `${player.displayName} has been eliminated`,
      data: { player, reason },
      timestamp: Date.now(),
      immediate: true
    };
    
    this.emit(roomId, event);
  }

  emitPhaseTransition(roomId: string, fromPhase: string, toPhase: string, timer: number): void {
    const event: GameEvent = {
      type: 'phase-transition',
      message: `Transitioning from ${fromPhase} to ${toPhase}`,
      data: { fromPhase, toPhase, timer },
      timestamp: Date.now(),
      immediate: true
    };
    
    this.emit(roomId, event);
  }
}
