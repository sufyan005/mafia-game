import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JoinRoomModalProps {
  onJoinRoom: (roomId: 'room1' | 'room2', displayName: string) => void;
}

export function JoinRoomModal({ onJoinRoom }: JoinRoomModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<'room1' | 'room2' | null>(null);

  const handleJoinRoom = () => {
    if (!displayName.trim() || !selectedRoom) return;

    onJoinRoom(selectedRoom, displayName.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="glass-card w-full max-w-md border-border/30">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            <span className="mr-2">🎭</span>
            Join Mafia Game
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display Name Input */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Your Display Name
            </label>
            <Input
              type="text"
              placeholder="Enter your name..."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={20}
              className="bg-secondary/30 border-border/30 focus:border-primary text-sm placeholder-muted-foreground/50"
            />
          </div>

          {/* Room Selection */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Select Room
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedRoom === 'room1' ? 'default' : 'outline'}
                className={`h-auto p-4 flex flex-col transition-all ${
                  selectedRoom === 'room1'
                    ? 'bg-primary/20 hover:bg-primary/30 border border-primary/40 text-foreground'
                    : 'bg-secondary/30 hover:bg-primary/20 border border-border/30 hover:border-primary/30 text-muted-foreground'
                }`}
                onClick={() => setSelectedRoom('room1')}
              >
                <div className="font-medium text-lg">Room 1</div>
                <div className="text-xs text-muted-foreground mt-1">Click to join</div>
              </Button>
              <Button
                variant={selectedRoom === 'room2' ? 'default' : 'outline'}
                className={`h-auto p-4 flex flex-col transition-all ${
                  selectedRoom === 'room2'
                    ? 'bg-primary/20 hover:bg-primary/30 border border-primary/40 text-foreground'
                    : 'bg-secondary/30 hover:bg-primary/20 border border-border/30 hover:border-primary/30 text-muted-foreground'
                }`}
                onClick={() => setSelectedRoom('room2')}
              >
                <div className="font-medium text-lg">Room 2</div>
                <div className="text-xs text-muted-foreground mt-1">Click to join</div>
              </Button>
            </div>
          </div>

          <Button
            onClick={handleJoinRoom}
            disabled={!displayName.trim() || !selectedRoom}
            variant="ghost"
            className="w-full bg-primary/20 hover:bg-primary/30 text-foreground border border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-secondary/30"
          >
            Join Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
