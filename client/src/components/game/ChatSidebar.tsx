import { useState, useEffect, useRef } from "react";
import { type Room, type Player, type ChatMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    
    // Show public messages during day phase
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
      return "fas fa-comments text-red-400";
    } else if (canSendPublicChat) {
      return "fas fa-comments text-blue-400";
    } else {
      return "fas fa-comments text-gray-400";
    }
  };

  const getChatBadge = () => {
    if (canSendMafiaChat) {
      return <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">Private</span>;
    } else if (canSendPublicChat) {
      return <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Public</span>;
    } else {
      return <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">Disabled</span>;
    }
  };

  return (
    <div className="w-full lg:w-80 bg-game-dark border-l border-gray-600 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center">
            <i className={getChatIcon() + " mr-2"}></i>
            {getChatTitle()}
          </h3>
          {getChatBadge()}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <i className="fas fa-comments text-4xl mb-2"></i>
            <p>No messages yet...</p>
            {!canSendAnyChat && (
              <p className="text-sm mt-2">Chat is disabled during this phase</p>
            )}
          </div>
        ) : (
          filteredMessages.map(msg => (
            <div key={msg.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.type === 'mafia' ? 'bg-red-600' : 
                msg.sender === player.id ? 'bg-purple-600' : 'bg-blue-600'
              }`}>
                <i className="fas fa-user text-white text-xs"></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${
                    msg.type === 'mafia' ? 'text-red-300' :
                    msg.sender === player.id ? 'text-purple-300' : 'text-blue-300'
                  }`}>
                    {msg.sender === player.id ? 'You' : msg.senderName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-600">
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
            className="flex-1 bg-gray-700 border-gray-600 focus:border-primary"
          />
          <Button 
            type="submit"
            disabled={!canSendAnyChat || !message.trim()}
            className={`transition-colors ${
              canSendMafiaChat ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </form>
      </div>
    </div>
  );
}
