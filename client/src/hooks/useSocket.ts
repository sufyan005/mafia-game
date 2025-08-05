import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { type Room, type Player, type ChatMessage } from '@shared/schema';

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
  const [player, setPlayer] = useState<Player | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameState, setGameState] = useState<{
    phase?: string;
    timer: number;
    role?: string;
    teammates?: Player[];
    investigationResult?: { target: string; targetName: string; isMafia: boolean };
  }>({ timer: 0 });

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
      },
      
      'player-left': (data) => {
        setRoom(data.room);
      },
      
      'game-started': (data) => {
        setRoom(data.room);
        setGameState(prev => ({
          ...prev,
          phase: data.room.phase,
          timer: data.room.timer
        }));
      },
      
      'room-updated': (data: { room: Room }) => {
        setRoom(data.room);
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
      },
      
      'phase-change': (data) => {
        setGameState(prev => ({
          ...prev,
          phase: data.phase,
          timer: data.timer,
        }));
      },
      
      'timer-update': (data) => {
        setGameState(prev => ({
          ...prev,
          timer: data.timer,
        }));
      },
      
      'player-eliminated': (data) => {
        // Room will be updated via other events
      },
      
      'game-over': (data) => {
        setRoom(data.room);
      },
      
      'game-restarted': (data) => {
        setRoom(data.room);
        setGameState({ timer: 0 });
        setChatMessages([]);
      },
      
      'investigation-result': (data) => {
        setGameState(prev => ({
          ...prev,
          investigationResult: data,
        }));
      },
      
      'chat-message': (message) => {
        setChatMessages(prev => [...prev, message]);
      },
      
      'error': (data) => {
        console.error('Socket error:', data.message);
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
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

  const getRoomStatus = (roomId: string) => {
    socketRef.current?.emit('get-room-status', roomId);
  };

  return {
    isConnected,
    room,
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
    getRoomStatus,
  };
}
