import { io } from 'socket.io-client';

type EventHandler = (...args: any[]) => void;

export type GameSocket = {
  id?: string;
  on: (event: string, handler: EventHandler) => GameSocket;
  emit: (event: string, data?: unknown) => GameSocket;
  disconnect: () => GameSocket;
  onAny?: (handler: (event: string, ...args: any[]) => void) => GameSocket;
};

class SocketIoGameSocket implements GameSocket {
  private socket = io({ autoConnect: true });
  private joinData?: unknown;

  constructor() {
    this.socket.on('connect', () => {
      if (this.joinData) this.socket.emit('join-room', this.joinData);
    });
  }

  get id(): string | undefined {
    return this.socket.id;
  }

  on(event: string, handler: EventHandler): this {
    this.socket.on(event, handler);
    return this;
  }

  onAny(handler: (event: string, ...args: any[]) => void): this {
    this.socket.onAny(handler);
    return this;
  }

  emit(event: string, data?: unknown): this {
    if (event === 'join-room') this.joinData = data;
    this.socket.emit(event, data);
    return this;
  }

  disconnect(): this {
    this.socket.disconnect();
    return this;
  }
}

class CloudflareSocket implements GameSocket {
  id = '';
  private socket: WebSocket | null = null;
  private roomId: 'room1' | 'room2' = 'room1';
  private handlers = new Map<string, Set<EventHandler>>();
  private anyHandlers = new Set<(event: string, ...args: any[]) => void>();
  private clientId = crypto.randomUUID();
  private joinData?: { room: 'room1' | 'room2'; data: unknown };
  private roomSyncTimer?: ReturnType<typeof setInterval>;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private manuallyDisconnected = false;

  constructor() {
    queueMicrotask(() => this.connect());
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
      this.joinData = { room, data };
      if (!this.roomSyncTimer) {
        this.roomSyncTimer = setInterval(() => this.emit('get-room-state'), 1000);
      }
      if (room !== this.roomId) {
        this.disconnect();
        this.manuallyDisconnected = false;
        this.roomId = room;
        this.connect();
        return this;
      }
      if (this.socket?.readyState !== WebSocket.OPEN) {
        if (!this.reconnectTimer) this.connect();
        return this;
      }
    }
    if (this.socket?.readyState === WebSocket.OPEN) {
      const payload = event === 'join-room' && data && typeof data === 'object'
        ? { ...data, clientId: this.getClientId() }
        : data;
      this.socket.send(JSON.stringify({ event, data: payload }));
    }
    return this;
  }

  disconnect(): this {
    this.manuallyDisconnected = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.roomSyncTimer) clearInterval(this.roomSyncTimer);
    this.roomSyncTimer = undefined;
    this.socket?.close();
    this.socket = null;
    return this;
  }

  private connect(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/${this.roomId}`);
    this.socket = socket;
    this.manuallyDisconnected = false;
    socket.addEventListener('open', () => {
      this.id = this.getClientId();
      this.dispatch('connect');
      if (this.joinData) {
        socket.send(JSON.stringify({ event: 'join-room', data: { ...(this.joinData.data as object), clientId: this.getClientId() } }));
      }
    });
    socket.addEventListener('close', () => {
      if (this.socket !== socket) return;
      this.dispatch('disconnect');
      if (!this.manuallyDisconnected) {
        this.reconnectTimer = setTimeout(() => this.connect(), 1000);
      }
    });
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
    return this.clientId;
  }

  private dispatch(event: string, ...args: any[]): void {
    this.handlers.get(event)?.forEach(handler => handler(...args));
    this.anyHandlers.forEach(handler => handler(event, ...args));
  }
}

export function createGameSocket(): GameSocket {
  const isCloudflareHost = window.location.hostname.endsWith('.workers.dev');
  if (import.meta.env.VITE_CLOUDFLARE === 'true' || isCloudflareHost) return new CloudflareSocket();
  return new SocketIoGameSocket();
}
