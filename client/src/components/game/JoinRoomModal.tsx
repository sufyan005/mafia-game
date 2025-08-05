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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="bg-game-secondary w-full max-w-md mx-4 border-gray-600">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Join Mafia Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Display Name
            </label>
            <Input
              type="text"
              placeholder="Enter your name..."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={20}
              className="bg-gray-700 border-gray-600 focus:border-game-primary"
            />
          </div>
          
          {/* Room Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Room
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedRoom === 'room1' ? 'default' : 'outline'}
                className={`h-auto p-4 flex flex-col ${
                  selectedRoom === 'room1' 
                    ? 'bg-game-primary hover:bg-purple-700' 
                    : 'bg-gray-700 hover:bg-game-primary border-gray-600 hover:border-game-primary'
                }`}
                onClick={() => setSelectedRoom('room1')}
              >
                <div className="font-medium">Room 1</div>
                <div className="text-sm text-gray-400">Click to join</div>
              </Button>
              <Button
                variant={selectedRoom === 'room2' ? 'default' : 'outline'}
                className={`h-auto p-4 flex flex-col ${
                  selectedRoom === 'room2' 
                    ? 'bg-game-primary hover:bg-purple-700' 
                    : 'bg-gray-700 hover:bg-game-primary border-gray-600 hover:border-game-primary'
                }`}
                onClick={() => setSelectedRoom('room2')}
              >
                <div className="font-medium">Room 2</div>
                <div className="text-sm text-gray-400">Click to join</div>
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={handleJoinRoom}
            disabled={!displayName.trim() || !selectedRoom}
            className="w-full bg-game-primary hover:bg-purple-700"
          >
            Join Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
