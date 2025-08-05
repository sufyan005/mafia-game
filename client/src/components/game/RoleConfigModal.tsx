import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface RoleConfigModalProps {
  playerCount: number;
  onStartGame: (config: { mafiaCount: number; doctorCount: number; detectiveCount: number }) => void;
  onCancel: () => void;
}

export function RoleConfigModal({ playerCount, onStartGame, onCancel }: RoleConfigModalProps) {
  const [mafiaCount, setMafiaCount] = useState(Math.max(1, Math.floor(playerCount / 4)));
  const [doctorCount, setDoctorCount] = useState(1);
  const [detectiveCount, setDetectiveCount] = useState(1);

  const totalSpecialRoles = mafiaCount + doctorCount + detectiveCount;
  const villagerCount = playerCount - totalSpecialRoles;
  const isValid = totalSpecialRoles <= playerCount && mafiaCount >= 1 && villagerCount >= 1;

  const handleSubmit = () => {
    if (isValid) {
      onStartGame({ mafiaCount, doctorCount, detectiveCount });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="bg-game-secondary w-full max-w-md mx-4 border-gray-600">
        <CardHeader>
          <CardTitle className="text-center text-xl">Configure Game Roles</CardTitle>
          <p className="text-center text-sm text-gray-400">
            Total Players: {playerCount}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mafia Count */}
          <div>
            <Label className="text-sm text-gray-300">
              Mafia Members (1-{Math.floor(playerCount / 2)})
            </Label>
            <Input
              type="number"
              min={1}
              max={Math.floor(playerCount / 2)}
              value={mafiaCount}
              onChange={(e) => setMafiaCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-gray-700 border-gray-600 focus:border-red-400 mt-1"
            />
          </div>

          {/* Doctor Count */}
          <div>
            <Label className="text-sm text-gray-300">
              Doctors (0-{Math.min(5, playerCount - mafiaCount - 1)})
            </Label>
            <Input
              type="number"
              min={0}
              max={Math.min(5, playerCount - mafiaCount - 1)}
              value={doctorCount}
              onChange={(e) => setDoctorCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-gray-700 border-gray-600 focus:border-green-400 mt-1"
            />
          </div>

          {/* Detective Count */}
          <div>
            <Label className="text-sm text-gray-300">
              Detectives (0-{Math.min(5, playerCount - mafiaCount - doctorCount)})
            </Label>
            <Input
              type="number"
              min={0}
              max={Math.min(5, playerCount - mafiaCount - doctorCount)}
              value={detectiveCount}
              onChange={(e) => setDetectiveCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-gray-700 border-gray-600 focus:border-blue-400 mt-1"
            />
          </div>

          {/* Role Summary */}
          <Card className="bg-game-dark">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Role Distribution:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-400">Mafia:</span>
                  <span>{mafiaCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Doctors:</span>
                  <span>{doctorCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-400">Detectives:</span>
                  <span>{detectiveCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Villagers:</span>
                  <span>{villagerCount}</span>
                </div>
                <hr className="border-gray-600 my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span className={totalSpecialRoles + villagerCount === playerCount ? 'text-green-400' : 'text-red-400'}>
                    {totalSpecialRoles + villagerCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isValid && (
            <div className="bg-red-900 border border-red-600 rounded p-3">
              <p className="text-red-200 text-sm">
                {totalSpecialRoles > playerCount 
                  ? "Too many special roles for the number of players!"
                  : villagerCount < 1 
                  ? "Need at least 1 villager!"
                  : "Invalid configuration"}
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button 
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isValid}
              className="flex-1 bg-game-primary hover:bg-purple-700"
            >
              Start Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}