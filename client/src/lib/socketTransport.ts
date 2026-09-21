import { io } from 'socket.io-client';

type EventHandler = (...args: any[]) => void;

export type GameSocket = {
  id?: string;
  on: (event: string, handler: EventHandler) => GameSocket;
  emit: (event: string, data?: unknown) => GameSocket;
  disconnect: () => GameSocket;
  onAny?: (handler: (event: string, ...args: any[]) => void) => GameSocket;
};

class CloudflareSocket implements GameSocket {
  id = '';
  private socket: WebSocket | null = null;
  private roomId: 'room1' | 'room2' = 'room1';
  private handlers = new Map<string, Set<EventHandler>>();
  private anyHandlers = new Set<(event: string, ...args: any[]) => void>();
  private pendingJoin?: { room: 'room1' | 'room2'; data: unknown };

  constructor() {
    this.connect();
  }

  on(event: string, handler: EventHandler): this {
    const handlers = this.handlers.get(event) || new Set<EventHandler>();
    handlers.add(handler);
    this.handlers.set(event, handlers);
    return this;
  }

  onAny(handler: (event: string, ...args: any[]) => void): this {
    this.anyHandlers.add(handler);
    return this;
  }

  emit(event: string, data?: unknown): this {
    if (event === 'join-room' && data && typeof data === 'object' && 'room' in data) {
      const room = (data as { room: 'room1' | 'room2' }).room;
      if (room !== this.roomId) {
        this.pendingJoin = { room, data };
        this.disconnect();
        this.roomId = room;
        this.connect();
        return this;
      }
    }
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    }
    return this;
  }

  disconnect(): this {
    this.socket?.close();
    this.socket = null;
    return this;
  }

  private connect(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/${this.roomId}`);
    this.socket = socket;
    socket.addEventListener('open', () => {
      this.id = this.getClientId();
      this.dispatch('connect');
      if (this.pendingJoin) {
        const join = this.pendingJoin;
        this.pendingJoin = undefined;
        this.emit('join-room', join.data);
      }
    });
    socket.addEventListener('close', () => this.dispatch('disconnect'));
    socket.addEventListener('message', message => {
      try {
        const payload = JSON.parse(message.data as string) as { event: string; data: unknown };
        this.dispatch(payload.event, payload.data);
      } catch {
        this.dispatch('error', { message: 'Invalid server response' });
      }
    });
  }

  private getClientId(): string {
    const storageKey = 'mafia-client-id';
    const stored = window.localStorage.getItem(storageKey);
    if (stored) return stored;
    const id = crypto.randomUUID();
    window.localStorage.setItem(storageKey, id);
    return id;
  }

  private dispatch(event: string, ...args: any[]): void {
    this.handlers.get(event)?.forEach(handler => handler(...args));
    this.anyHandlers.forEach(handler => handler(event, ...args));
  }
}

export function createGameSocket(): GameSocket {
  if (import.meta.env.VITE_CLOUDFLARE === 'true') return new CloudflareSocket();
  return io({ autoConnect: true });
}
