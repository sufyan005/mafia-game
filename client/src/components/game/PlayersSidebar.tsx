import { useState } from "react";
import { type Room, type Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 1024;

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'mafia':
        return '🔪';
      case 'doctor':
        return '🩺';
      case 'detective':
        return '🕵️';
      case 'villager':
        return '👤';
      default:
        return '❓';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'mafia':
        return 'bg-red-500';
      case 'doctor':
        return 'bg-green-500';
      case 'detective':
        return 'bg-blue-500';
      case 'villager':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getGameStats = () => {
    const mafiaAlive = alivePlayers.filter(p => p.role === 'mafia').length;
    const civiliansAlive = alivePlayers.filter(p => p.role !== 'mafia').length;

    return { mafiaAlive, civiliansAlive };
  };

  const { mafiaAlive, civiliansAlive } = getGameStats();

  const currentPlayers = room.players.length;
  const playersNeeded = Math.max(0, 4 - currentPlayers);
  const isWaitingForPlayers = room.gameState === 'waiting' && currentPlayers < 4;

  return (
    <aside className="flex w-full lg:w-72 glass-card border-l border-border/30 flex-col h-full">
      {/* Players Header */}
      <div className="p-3 sm:p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center text-sm text-muted-foreground">
            <span className="mr-2">👥</span>
            Players ({room.players.length}/20)
          </h3>
          {canStartGame && (
            <Button
              onClick={() => setShowRoleConfig(true)}
              variant="ghost"
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs px-2 sm:px-3 py-1 touch-target"
            >
              <span className="hidden sm:inline">Start Game</span>
              <span className="sm:hidden">Start</span>
            </Button>
          )}
        </div>

        {/* Player count status for waiting state */}
        {room.gameState === 'waiting' && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={`font-medium ${
              currentPlayers >= 4 ? 'text-green-400' : 'text-primary'
            }`}>
              {currentPlayers >= 4
                ? '✓ Ready to start!'
                : `${currentPlayers}/4 players (${playersNeeded} more needed)`}
            </span>
            {player?.isOwner && currentPlayers >= 4 && (
              <span className="text-green-400 font-medium">Start game available</span>
            )}
          </div>
        )}
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="space-y-2">
          {/* Alive Players */}
          {alivePlayers.map(p => (
            <div
              key={p.id}
              className={`flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg transition-colors ${
                p.isOwner
                  ? 'bg-yellow-500/10 border border-yellow-500/30'
                  : 'bg-secondary/30 border border-transparent'
              }`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                p.isOwner
                  ? 'bg-yellow-500'
                  : p.id === player?.id
                  ? getRoleColor(p.role)
                  : 'bg-secondary'
              }`}>
                {p.id === player?.id ? (
                  <span className="text-white text-xs font-medium">
                    {getRoleIcon(p.role)}
                  </span>
                ) : p.isOwner ? (
                  <span className="text-yellow-900 text-xs">👑</span>
                ) : (
                  <span className="text-muted-foreground/50 text-xs">
                    {p.displayName?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${
                  p.isOwner ? 'text-yellow-300' : 'text-foreground'
                }`}>
                  {p.id === player?.id ? 'You' : p.displayName}
                </p>
                <p className={`text-xs ${
                  p.isOwner ? 'text-yellow-400/60' : 'text-muted-foreground/60'
                }`}>
                  {p.isOwner
                    ? 'Room Owner'
                    : (p.id === player?.id && p.role
                        ? p.role.charAt(0).toUpperCase() + p.role.slice(1)
                        : 'Player')}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className="text-xs text-green-400">Alive</span>
              </div>
            </div>
          ))}

          {/* Dead Players */}
          {deadPlayers.length > 0 && (
            <div className="border-t border-border/30 pt-2 sm:pt-3 mt-2 sm:mt-3">
              <h4 className="text-xs font-medium text-muted-foreground/60 mb-2 flex items-center">
                <span className="mr-2">💀</span>
                Eliminated ({deadPlayers.length})
              </h4>

              {deadPlayers.map(p => (
                <div
                  key={p.id}
                  className="flex items-center space-x-2 sm:space-x-3 p-2 bg-secondary/10 border border-transparent rounded-lg opacity-60"
                >
                  <div className="w-10 h-10 bg-gray-500/30 rounded-full flex items-center justify-center border border-border/20">
                    <span className="text-muted-foreground/40 text-xs">💀</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-muted-foreground/50">
                      {p.id === player?.id ? 'You' : p.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground/40">
                      {p.id === player?.id && p.role
                        ? p.role.charAt(0).toUpperCase() + p.role.slice(1)
                        : 'Player'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
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
        <div className="p-3 sm:p-4 border-t border-border/30">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-center">
            <Card className="glass-card border-green-500/20">
              <CardContent className="p-2 sm:p-3">
                <div className="text-xl sm:text-2xl font-bold text-green-400">{civiliansAlive}</div>
                <div className="text-xs text-muted-foreground/70">Civilians</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-red-500/20">
              <CardContent className="p-2 sm:p-3">
                <div className="text-xl sm:text-2xl font-bold text-red-400">{mafiaAlive}</div>
                <div className="text-xs text-muted-foreground/70">Mafia</div>
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
