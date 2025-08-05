import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { GameLogic } from "./gameLogic";
import { 
  joinRoomSchema, 
  voteSchema, 
  chatMessageInputSchema,
  doctorSaveSchema,
  detectiveInvestigateSchema,
  startGameSchema,
  type ChatMessage 
} from "@shared/schema";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const gameLogic = new GameLogic(io);

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Join room
    socket.on('join-room', (data) => {
      try {
        const { room, displayName } = joinRoomSchema.parse(data);
        
        const roomData = storage.getRoom(room);
        if (!roomData) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (roomData.players.length >= 20) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }

        // Check if game is in progress
        if (roomData.gameState !== 'waiting') {
          socket.emit('error', { message: 'Game already in progress' });
          return;
        }

        const player = {
          id: socket.id,
          displayName,
          room,
          isAlive: true,
          isOwner: false,
          votes: {},
        };

        storage.addPlayerToRoom(room, player);
        socket.join(room);

        const updatedRoom = storage.getRoom(room)!;
        
        // Send room state to new player
        socket.emit('joined-room', {
          room: updatedRoom,
          player,
        });

        // Notify other players
        socket.to(room).emit('player-joined', {
          player,
          room: updatedRoom,
        });

        console.log(`${displayName} joined ${room}`);
      } catch (error) {
        socket.emit('error', { message: 'Invalid join data' });
      }
    });

    // Start game
    socket.on('start-game', (data) => {
      try {
        const player = storage.getPlayer(socket.id);
        if (!player || !player.isOwner) {
          socket.emit('error', { message: 'Only room owner can start the game' });
          return;
        }

        const roleConfig = startGameSchema.parse(data);
        const success = gameLogic.startGame(player.room, roleConfig);
        if (!success) {
          socket.emit('error', { message: 'Cannot start game. Check player count and role configuration.' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Invalid role configuration' });
      }
    });

    // Vote
    socket.on('vote', (data) => {
      try {
        const { target, phase } = voteSchema.parse(data);
        const success = gameLogic.submitVote(socket.id, target, phase);
        
        if (!success) {
          socket.emit('error', { message: 'Invalid vote' });
        } else {
          const player = storage.getPlayer(socket.id);
          if (player) {
            const room = storage.getRoom(player.room);
            if (room) {
              io.to(player.room).emit('room-updated', { room });
            }
          }
        }
      } catch (error) {
        socket.emit('error', { message: 'Invalid vote data' });
      }
    });

    // Doctor save
    socket.on('doctor-save', (data) => {
      try {
        const { target } = doctorSaveSchema.parse(data);
        const success = gameLogic.submitDoctorSave(socket.id, target);
        
        if (!success) {
          socket.emit('error', { message: 'Invalid save action' });
        } else {
          const player = storage.getPlayer(socket.id);
          if (player) {
            const room = storage.getRoom(player.room);
            if (room) {
              io.to(player.room).emit('room-updated', { room });
            }
          }
        }
      } catch (error) {
        socket.emit('error', { message: 'Invalid save data' });
      }
    });

    // Detective investigate
    socket.on('detective-investigate', (data) => {
      try {
        const { target } = detectiveInvestigateSchema.parse(data);
        const success = gameLogic.submitDetectiveInvestigation(socket.id, target);
        
        if (!success) {
          socket.emit('error', { message: 'Invalid investigation' });
        } else {
          const player = storage.getPlayer(socket.id);
          if (player) {
            const room = storage.getRoom(player.room);
            if (room) {
              io.to(player.room).emit('room-updated', { room });
            }
          }
        }
      } catch (error) {
        socket.emit('error', { message: 'Invalid investigation data' });
      }
    });

    // Chat message
    socket.on('chat-message', (data) => {
      try {
        const { message, type } = chatMessageInputSchema.parse(data);
        const player = storage.getPlayer(socket.id);
        
        if (!player) {
          socket.emit('error', { message: 'Player not found' });
          return;
        }

        const room = storage.getRoom(player.room);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Validate chat permissions
        if (type === 'mafia') {
          if (player.role !== 'mafia' || room.phase !== 'night') {
            socket.emit('error', { message: 'Cannot send mafia message' });
            return;
          }
        } else if (type === 'public') {
          if (room.phase !== 'day') {
            socket.emit('error', { message: 'Cannot send public message' });
            return;
          }
        }

        const chatMessage: ChatMessage = {
          id: randomUUID(),
          sender: socket.id,
          senderName: player.displayName,
          message,
          type,
          timestamp: Date.now(),
          room: player.room,
        };

        storage.addChatMessage(chatMessage);

        if (type === 'mafia') {
          // Send only to mafia members
          const mafiaPlayers = room.players.filter(p => p.role === 'mafia');
          mafiaPlayers.forEach(p => {
            io.to(p.id).emit('chat-message', chatMessage);
          });
        } else {
          // Send to all players in room
          io.to(player.room).emit('chat-message', chatMessage);
        }
      } catch (error) {
        socket.emit('error', { message: 'Invalid message data' });
      }
    });

    // Restart game
    socket.on('restart-game', () => {
      const player = storage.getPlayer(socket.id);
      if (!player || !player.isOwner) {
        socket.emit('error', { message: 'Only room owner can restart the game' });
        return;
      }

      const success = gameLogic.restartGame(player.room, socket.id);
      if (!success) {
        socket.emit('error', { message: 'Cannot restart game' });
      }
    });

    // Get room status
    socket.on('get-room-status', (roomId: string) => {
      const room = storage.getRoom(roomId);
      if (room) {
        socket.emit('room-status', {
          roomId,
          playerCount: room.players.length,
          gameState: room.gameState,
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const player = storage.getPlayer(socket.id);
      if (player) {
        storage.removePlayerFromRoom(player.room, socket.id);
        
        const room = storage.getRoom(player.room);
        if (room) {
          socket.to(player.room).emit('player-left', {
            player,
            room,
          });
        }
        
        console.log(`${player.displayName} disconnected from ${player.room}`);
      }
    });
  });

  return httpServer;
}
