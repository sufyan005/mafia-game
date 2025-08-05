import { useState } from "react";
import { type Room, type Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleConfigModal } from "./RoleConfigModal";

interface PlayersSidebarProps {
  room: Room | null;
  player: Player | null;
  onStartGame: (config: { mafiaCount: number; doctorCount: number; detectiveCount: number }) => void;
}

export function PlayersSidebar({ room, player, onStartGame }: PlayersSidebarProps) {
  const [showRoleConfig, setShowRoleConfig] = useState(false);

  if (!room) {
    return null;
  }

  const alivePlayers = room.players.filter(p => p.isAlive);
  const deadPlayers = room.players.filter(p => !p.isAlive);
  const canStartGame = player?.isOwner && room.gameState === 'waiting' && room.players.length >= 4;

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'mafia':
        return 'fas fa-mask text-red-400';
      case 'doctor':
        return 'fas fa-user-md text-green-400';
      case 'detective':
        return 'fas fa-search text-blue-400';
      case 'villager':
        return 'fas fa-user text-gray-400';
      default:
        return 'fas fa-user text-gray-400';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'mafia':
        return 'bg-red-600';
      case 'doctor':
        return 'bg-green-600';
      case 'detective':
        return 'bg-blue-600';
      case 'villager':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getGameStats = () => {
    const mafiaAlive = alivePlayers.filter(p => p.role === 'mafia').length;
    const civiliansAlive = alivePlayers.filter(p => p.role !== 'mafia').length;
    
    return { mafiaAlive, civiliansAlive };
  };

  const { mafiaAlive, civiliansAlive } = getGameStats();

  return (
    <aside className="w-full lg:w-72 bg-game-secondary border-l border-gray-600 flex flex-col">
      {/* Players Header */}
      <div className="p-4 border-b border-gray-600">
        <h3 className="font-bold flex items-center justify-between">
          <span className="flex items-center">
            <i className="fas fa-users mr-2 text-game-primary"></i>
            Players ({room.players.length}/20)
          </span>
          {canStartGame && (
            <Button 
              onClick={() => setShowRoleConfig(true)}
              className="bg-game-primary hover:bg-purple-700 text-white px-3 py-1 text-sm"
            >
              Start Game
            </Button>
          )}
        </h3>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {/* Alive Players */}
          {alivePlayers.map(p => (
            <div key={p.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
              p.isOwner ? 'bg-yellow-900 border border-yellow-600' : 'bg-gray-700'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                p.isOwner ? 'bg-yellow-600' : p.id === player?.id ? getRoleColor(p.role) : 'bg-gray-600'
              }`}>
                <i className={p.isOwner ? 'fas fa-crown text-yellow-200' : p.id === player?.id ? getRoleIcon(p.role) : 'fas fa-user text-gray-400'}></i>
              </div>
              <div className="flex-1">
                <p className={`font-medium ${p.isOwner ? 'text-yellow-200' : 'text-white'}`}>
                  {p.id === player?.id ? 'You' : p.displayName}
                </p>
                <p className={`text-xs ${p.isOwner ? 'text-yellow-300' : 'text-gray-400'}`}>
                  {p.isOwner ? 'Room Owner' : (p.id === player?.id && p.role ? p.role.charAt(0).toUpperCase() + p.role.slice(1) : 'Player')}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-green-400">Alive</span>
              </div>
            </div>
          ))}

          {/* Dead Players */}
          {deadPlayers.length > 0 && (
            <div className="border-t border-gray-600 pt-3 mt-3">
              <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                <i className="fas fa-skull mr-2"></i>
                Eliminated ({deadPlayers.length})
              </h4>
              
              {deadPlayers.map(p => (
                <div key={p.id} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg opacity-60 mb-2">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-gray-400"></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-400">
                      {p.id === player?.id ? 'You' : p.displayName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.id === player?.id && p.role ? p.role.charAt(0).toUpperCase() + p.role.slice(1) : 'Player'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-xs text-red-400">Dead</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Game Stats */}
      {room.gameState !== 'waiting' && (
        <div className="p-4 border-t border-gray-600">
          <div className="grid grid-cols-2 gap-4 text-center">
            <Card className="bg-green-800">
              <CardContent className="p-3">
                <div className="text-lg font-bold text-green-200">{civiliansAlive}</div>
                <div className="text-xs text-green-300">Civilians</div>
              </CardContent>
            </Card>
            <Card className="bg-red-800">
              <CardContent className="p-3">
                <div className="text-lg font-bold text-red-200">{mafiaAlive}</div>
                <div className="text-xs text-red-300">Mafia</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Role Configuration Modal */}
      {showRoleConfig && (
        <RoleConfigModal
          playerCount={room.players.length}
          onStartGame={(config) => {
            onStartGame(config);
            setShowRoleConfig(false);
          }}
          onCancel={() => setShowRoleConfig(false)}
        />
      )}
    </aside>
  );
}
