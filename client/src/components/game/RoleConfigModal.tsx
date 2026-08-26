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

  const maxMafia = Math.floor(playerCount / 2);
  const maxDoctors = Math.min(5, playerCount - mafiaCount - 1);
  const maxDetectives = Math.min(5, playerCount - mafiaCount - doctorCount);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="glass-card w-full max-w-md border-border/30 max-h-[90vh] flex flex-col">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            Configure Game Roles
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Total Players: {playerCount}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 overflow-y-auto">
          {/* Mafia Count */}
          <div>
            <Label className="text-sm text-muted-foreground mb-1 block">
              Mafia Members (1-{maxMafia})
            </Label>
            <Input
              type="number"
              min={1}
              max={maxMafia}
              value={mafiaCount}
              onChange={(e) => setMafiaCount(Math.max(1, Math.min(maxMafia, parseInt(e.target.value) || 1)))}
              className="bg-secondary/30 border-border/30 focus:border-red-400 text-sm placeholder-muted-foreground/50"
            />
          </div>

          {/* Doctor Count */}
          <div>
            <Label className="text-sm text-muted-foreground mb-1 block">
              Doctors (0-{maxDoctors})
            </Label>
            <Input
              type="number"
              min={0}
              max={maxDoctors}
              value={doctorCount}
              onChange={(e) => setDoctorCount(Math.max(0, Math.min(maxDoctors, parseInt(e.target.value) || 0)))}
              className="bg-secondary/30 border-border/30 focus:border-green-400 text-sm placeholder-muted-foreground/50"
            />
          </div>

          {/* Detective Count */}
          <div>
            <Label className="text-sm text-muted-foreground mb-1 block">
              Detectives (0-{maxDetectives})
            </Label>
            <Input
              type="number"
              min={0}
              max={maxDetectives}
              value={detectiveCount}
              onChange={(e) => setDetectiveCount(Math.max(0, Math.min(maxDetectives, parseInt(e.target.value) || 0)))}
              className="bg-secondary/30 border-border/30 focus:border-blue-400 text-sm placeholder-muted-foreground/50"
            />
          </div>

          {/* Role Summary */}
          <Card className="glass-card border-border/30">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 text-sm text-muted-foreground">Role Distribution:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-red-400">Mafia:</span>
                  <span className="font-medium text-foreground">{mafiaCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-400">Doctors:</span>
                  <span className="font-medium text-foreground">{doctorCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-400">Detectives:</span>
                  <span className="font-medium text-foreground">{detectiveCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Villagers:</span>
                  <span className="font-medium text-foreground">{villagerCount}</span>
                </div>
                <div className="border-t border-border/30 my-2"></div>
                <div className="flex justify-between items-center font-medium">
                  <span>Total:</span>
                  <span className={totalSpecialRoles + villagerCount === playerCount ? 'text-green-400' : 'text-red-400'}>
                    {totalSpecialRoles + villagerCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isValid && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-300 text-xs">
                {totalSpecialRoles > playerCount
                  ? "Too many special roles for the number of players!"
                  : villagerCount < 1
                  ? "Need at least 1 villager!"
                  : "Invalid configuration"}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
            <Button
              onClick={onCancel}
              variant="ghost"
              className="flex-1 bg-secondary/30 hover:bg-secondary/40 text-foreground border border-border/30 touch-target"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              variant="ghost"
              className={`flex-1 transition-colors touch-target ${
                isValid
                  ? 'bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30'
                  : 'bg-secondary/30 text-muted-foreground cursor-not-allowed border border-border/30'
              }`}
            >
              Start Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
