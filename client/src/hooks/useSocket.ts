import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { type Room, type Player, type ChatMessage } from '@shared/schema';
import { useToast } from './use-toast';

interface SocketEvents {
  'joined-room': (data: { room: Room; player: Player }) => void;
  'player-joined': (data: { player: Player; room: Room }) => void;
  'player-left': (data: { player: Player; room: Room }) => void;
  'game-started': (data: { room: Room; players: Player[] }) => void;
  'role-assigned': (data: { role: string; teammates: Player[] }) => void;
  'phase-change': (data: { phase: string; timer: number }) => void;
  'timer-update': (data: { timer: number }) => void;
  'player-eliminated': (data: { player: Player; reason: string; votes?: Record<string, number> }) => void;
  'no-elimination': (data: { reason: string; votes: Record<string, number> }) => void;
  'game-over': (data: { winner: string; winners: Player[]; room: Room }) => void;
  'game-restarted': (data: { room: Room }) => void;
  'game-ended': (data: { room: Room }) => void;
  'vote-cast': (data: { voter: string; voterName: string; target: string; phase: string }) => void;
  'action-confirmed': (data: { action: string; target: string }) => void;
  'investigation-result': (data: { target: string; targetName: string; isMafia: boolean }) => void;
  'room-updated': (data: { room: Room }) => void;
  'chat-message': (message: ChatMessage) => void;
  'error': (data: { message: string }) => void;
  'room-status': (data: { roomId: string; playerCount: number; gameState: string }) => void;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [gameEvents, setGameEvents] = useState<Array<{ type: string; message: string; data: any; timestamp: number }>>([]);

  // Helper to append immediate events to gameEvents state
  const appendGameEvent = (event: { type: string; message: string; data: any; timestamp: number }) => {
    setGameEvents(prevEvents => [...prevEvents, event]);
  };

  const [player, setPlayer] = useState<Player | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameState, setGameState] = useState<{
    phase?: string;
    timer: number;
    role?: string;
    teammates?: Player[];
    investigationResult?: { target: string; targetName: string; isMafia: boolean };
  }>({ timer: 0 });
  const { toast } = useToast();

  useEffect(() => {
    const socket = io({
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    const handlers: Partial<SocketEvents> = {
      'joined-room': (data) => {
        setRoom(data.room);
        setPlayer(data.player);
      },
      
      'player-joined': (data) => {
        setRoom(data.room);
        toast({
          title: `${data.player.displayName} joined the game`,
          description: `Player count: ${data.room.players.length}`,
        });
      },
      
      'player-left': (data) => {
        setRoom(data.room);
        toast({
          title: `${data.player.displayName} left the game`,
          description: `Player count: ${data.room.players.length}`,
          variant: "destructive",
        });
      },
      
      'game-started': (data) => {
        setRoom(data.room);
        setGameState(prev => ({
          ...prev,
          phase: data.room.phase,
          timer: data.room.timer
        }));
        toast({
          title: "Game Started!",
          description: `Phase: ${data.room.phase}`,
          variant: "default",
        });
      },
      
      'room-updated': (data: { room: Room }) => {
        setRoom(data.room);
        // Also update the current player from the room's players
        // Use a ref-backed lookup to avoid stale closure issues
        const currentSocketId = socketRef.current?.id;
        if (currentSocketId) {
          const updatedPlayer = data.room.players.find(p => p.id === currentSocketId);
          if (updatedPlayer) {
            setPlayer(updatedPlayer);
          }
        }
        setGameState(prev => ({
          ...prev,
          phase: data.room.phase,
          timer: data.room.timer
        }));
      },
      
      'role-assigned': (data) => {
        setGameState(prev => ({
          ...prev,
          role: data.role,
          teammates: data.teammates,
        }));
        toast({
          title: "Role Assigned",
          description: `You are ${data.role}`,
          variant: "default",
        });
      },
      
      'timer-update': (data) => {
        setGameState(prev => ({
          ...prev,
          timer: data.timer,
        }));
      },
      
      'player-eliminated': (data) => {
        toast({
          title: "Player Eliminated!",
          description: `${data.player.displayName} has been eliminated. ${data.reason}`,
          variant: "destructive",
        });
        // Update room players state immediately
        setRoom(prevRoom => {
          if (!prevRoom) return prevRoom;
          const updatedPlayers = prevRoom.players.map(p =>
            p.id === data.player.id ? { ...p, isAlive: false } : p
          );
          return { ...prevRoom, players: updatedPlayers };
        });
        // Always append elimination event immediately
        appendGameEvent({
          type: 'elimination',
          message: `${data.player.displayName} has been eliminated. ${data.reason}`,
          data,
          timestamp: Date.now(),
        });
      },
      
      'no-elimination': (data) => {
        toast({
          title: "No Elimination",
          description: data.reason,
          variant: "default",
        });
        // Always append no-elimination event immediately
        appendGameEvent({
          type: 'no-elimination',
          message: `No elimination: ${data.reason}`,
          data,
          timestamp: Date.now(),
        });
      },
      
      'vote-cast': (data) => {
        if (data.phase !== 'night') {
          const targetPlayer = room?.players.find(p => p.id === data.target);
          const targetName = targetPlayer ? targetPlayer.displayName : data.target;
          const voterPlayer = room?.players.find(p => p.id === data.voter);
          const voterName = voterPlayer ? voterPlayer.displayName : data.voterName;
          toast({
            title: "Vote Cast",
            description: `${voterName} voted for ${targetName} during ${data.phase}`,
            variant: "default",
          });
        }
      },
      
      'phase-change': (data) => {
        setGameState(prev => ({
          ...prev,
          phase: data.phase,
          timer: data.timer
        }));
        // Phase change is shown in the GameHeader, no toast needed
      },
      
      'game-over': (data) => {
        setRoom(data.room);
        toast({
          title: "Game Over!",
          description: `${data.winner} wins!`,
          variant: "default",
        });
      },
      
      'game-restarted': (data) => {
        setRoom(data.room);
        setGameState({ timer: 0 });
        setChatMessages([]);
        toast({
          title: "Game Restarted",
          description: "A new game has begun!",
          variant: "default",
        });
      },

      'game-ended': (data) => {
        setRoom(data.room);
        setGameState({ timer: 0 });
        setChatMessages([]);
        toast({
          title: "Game Ended",
          description: "The room owner has ended the game.",
          variant: "default",
        });
      },
      
      'investigation-result': (data) => {
        setGameState(prev => ({
          ...prev,
          investigationResult: data,
        }));
        toast({
          title: "Investigation Result",
          description: `${data.targetName} is ${data.isMafia ? 'Mafia' : 'not Mafia'}`,
          variant: data.isMafia ? "destructive" : "default",
        });
      },
      
      'chat-message': (message) => {
        setChatMessages(prev => [...prev, message]);
      },
      
      'error': (data) => {
        console.error('Socket error:', data.message);
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Listen for immediate game events
    socket.on('immediate-game-event', (event: {
      type: string;
      message: string;
      data: any;
      timestamp: number;
    }) => {
      switch (event.type) {
        case 'elimination':
          toast({
            title: "Player Eliminated!",
            description: event.message,
            variant: "destructive",
          });
          // Always append elimination event immediately
          appendGameEvent({
            type: 'elimination',
            message: event.message,
            data: event.data,
            timestamp: event.timestamp,
          });
          break;
        case 'save':
          // Do not show toast for doctor save as per user request
          // Append save event to gameEvents to show in game event box immediately
          appendGameEvent({
            type: 'save',
            message: event.message,
            data: event.data,
            timestamp: event.timestamp,
          });
          break;
        case 'phase-transition':
          // Phase transition is shown in the GameHeader, no toast needed
          break;
        case 'player-action':
          toast({
            title: "Action Performed",
            description: event.message,
            variant: "default",
          });
          break;
        default:
          toast({
            title: "Game Event",
            description: event.message,
            variant: "default",
          });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = (roomId: 'room1' | 'room2', displayName: string) => {
    socketRef.current?.emit('join-room', { room: roomId, displayName });
  };

  const startGame = (config: { mafiaCount: number; doctorCount: number; detectiveCount: number }) => {
    socketRef.current?.emit('start-game', config);
  };

  const vote = (target: string, phase: 'night' | 'day') => {
    socketRef.current?.emit('vote', { target, phase });
  };

  const doctorSave = (target: string) => {
    socketRef.current?.emit('doctor-save', { target });
  };

  const detectiveInvestigate = (target: string) => {
    socketRef.current?.emit('detective-investigate', { target });
  };

  const sendChatMessage = (message: string, type: 'public' | 'mafia') => {
    socketRef.current?.emit('chat-message', { message, type });
  };

  const restartGame = () => {
    socketRef.current?.emit('restart-game');
  };

  const endGame = () => {
    socketRef.current?.emit('end-game');
  };

  const getRoomStatus = (roomId: string) => {
    socketRef.current?.emit('get-room-status', roomId);
  };

  return {
    isConnected,
    room,
    gameEvents,
    player,
    chatMessages,
    gameState,
    joinRoom,
    startGame,
    vote,
    doctorSave,
    detectiveInvestigate,
    sendChatMessage,
    restartGame,
    endGame,
    getRoomStatus,
  };
}
