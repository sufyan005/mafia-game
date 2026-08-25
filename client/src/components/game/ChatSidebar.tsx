import { useState, useEffect, useRef } from "react";
import { type Room, type Player, type ChatMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ChatSidebarProps {
  room: Room | null;
  player: Player | null;
  chatMessages: ChatMessage[];
  gameState: {
    phase?: string;
    role?: string;
  };
  onSendMessage: (message: string, type: 'public' | 'mafia') => void;
}

export function ChatSidebar({
  room,
  player,
  chatMessages,
  gameState,
  onSendMessage
}: ChatSidebarProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  if (!room || !player) {
    return null;
  }

  const canSendMafiaChat = gameState.role === 'mafia' && gameState.phase === 'night' && player.isAlive;
  const canSendPublicChat = gameState.phase === 'day' && player.isAlive;
  const canSendAnyChat = canSendMafiaChat || canSendPublicChat;

  const currentChatType = canSendMafiaChat ? 'mafia' : 'public';
  const filteredMessages = chatMessages.filter(msg => {
    if (msg.room !== room.id) return false;

    // Show mafia messages only to mafia members during night
    if (msg.type === 'mafia') {
      return gameState.role === 'mafia';
    }

    // Show public messages
    if (msg.type === 'public') {
      return true;
    }

    return false;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !canSendAnyChat) return;

    onSendMessage(message.trim(), currentChatType);
    setMessage("");
  };

  const getChatTitle = () => {
    if (canSendMafiaChat) {
      return "Mafia Chat";
    } else if (canSendPublicChat) {
      return "Town Chat";
    } else {
      return "Chat (Disabled)";
    }
  };

  const getChatIcon = () => {
    if (canSendMafiaChat) {
      return "🔪";
    } else if (canSendPublicChat) {
      return "💬";
    } else {
      return "💬";
    }
  };

  const getChatBadge = () => {
    if (canSendMafiaChat) {
      return <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">Private</span>;
    } else if (canSendPublicChat) {
      return <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">Public</span>;
    } else {
      return <span className="text-xs bg-gray-500/20 text-muted-foreground px-2 py-1 rounded border border-gray-500/30">Disabled</span>;
    }
  };

  const getAvatarColor = (msg: ChatMessage) => {
    if (msg.type === 'mafia') {
      return 'bg-red-500/20 border border-red-500/30';
    }
    return msg.sender === player.id
      ? 'bg-primary/20 border border-primary/30'
      : 'bg-blue-500/20 border border-blue-500/30';
  };

  const getTextColor = (msg: ChatMessage) => {
    if (msg.type === 'mafia') {
      return 'text-red-300';
    }
    return msg.sender === player.id ? 'text-primary' : 'text-blue-300';
  };

  return (
    <div className="w-full lg:w-80 glass-card border-l border-border/30 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center text-sm text-muted-foreground">
            <span className="mr-2 text-lg">{getChatIcon()}</span>
            {getChatTitle()}
          </h3>
          {getChatBadge()}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-muted-foreground/50 py-8">
            <span className="text-3xl mb-2 block">💬</span>
            <p className="text-sm">No messages yet...</p>
            {!canSendAnyChat && (
              <p className="text-xs mt-2">Chat is disabled during this phase</p>
            )}
          </div>
        ) : (
          filteredMessages.map(msg => (
            <div key={msg.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarColor(msg)}`}>
                <span className="text-xs font-medium text-foreground">
                  {msg.senderName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`font-medium text-sm ${getTextColor(msg)}`}>
                    {msg.sender === player.id ? 'You' : msg.senderName}
                  </span>
                  <span className="text-xs text-muted-foreground/50">
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-border/30">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            type="text"
            placeholder={
              canSendMafiaChat ? "Send a message to your team..." :
              canSendPublicChat ? "Send a public message..." :
              "Chat disabled"
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!canSendAnyChat}
            className="flex-1 bg-secondary/30 border-border/30 focus:border-primary text-sm placeholder-muted-foreground/50"
          />
          <Button
            type="submit"
            disabled={!canSendAnyChat || !message.trim()}
            variant="ghost"
            className={`transition-colors ${
              canSendMafiaChat
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                : 'bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30'
            }`}
          >
            <span>➤</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
