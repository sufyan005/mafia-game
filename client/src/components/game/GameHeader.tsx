import { type Room, type Player } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface GameHeaderProps {
  room: Room | null;
  gameState: {
    phase?: string;
    timer: number;
  };
  player: Player | null;
  onEndGame: () => void;
  onToggleChat?: () => void;
  onTogglePlayers?: () => void;
  showMobileChat?: boolean;
  showMobilePlayers?: boolean;
}

export function GameHeader({ room, gameState, player, onEndGame, onToggleChat, onTogglePlayers, showMobileChat, showMobilePlayers }: GameHeaderProps) {
  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseDisplay = () => {
    if (!gameState.phase) return "Waiting for game to start";

    switch (gameState.phase) {
      case 'night':
        return "Night Phase";
      case 'day':
        return "Day Phase";
      case 'break':
        return "Break";
      default:
        return "Game Phase";
    }
  };

  const getPhaseColor = () => {
    switch (gameState.phase) {
      case 'night':
        return 'bg-blue-400';
      case 'day':
        return 'bg-amber-300';
      case 'break':
        return 'bg-purple-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <header className="border-b border-border/30 px-3 py-2 lg:px-6 lg:py-4 glass-light">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-primary flex items-center">
              <span className="mr-2 w-6 h-6 flex items-center justify-center">🎭</span>
              Mafia
            </h1>
            {room && (
              <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary/30">
                {room.id === 'room1' ? 'Room 1' : 'Room 2'}
              </div>
            )}
          </div>

          {/* Mobile sidebar toggle buttons */}
          {room && onToggleChat && onTogglePlayers && room.players.length > 0 && (
            <div className="lg:hidden flex items-center gap-2">
              <Button
                onClick={onToggleChat}
                variant="ghost"
                size="sm"
                className={`touch-target ${showMobileChat ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary/30 text-foreground border border-border/30'}`}
                title="Toggle chat"
              >
                💬
              </Button>
              <Button
                onClick={onTogglePlayers}
                variant="ghost"
                size="sm"
                className={`touch-target ${showMobilePlayers ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary/30 text-foreground border border-border/30'}`}
                title="Toggle players"
              >
                👥
              </Button>
            </div>
          )}
        </div>

        {room && (gameState.phase || gameState.timer > 0) && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:ml-auto">
            {/* Phase Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-secondary/50 border border-border/30">
              <div className={`w-2 h-2 ${getPhaseColor()} rounded-full animate-pulse`}></div>
              <span className="text-sm font-medium text-muted-foreground">{getPhaseDisplay()}</span>
            </div>

            {/* Timer */}
            <div className="px-3 py-1 lg:px-4 lg:py-2 rounded-lg bg-secondary/50 border border-border/30 font-mono font-bold text-sm text-foreground">
              {formatTimer(gameState.timer)}
            </div>

            {/* End Game Button (owner only) */}
            {player?.isOwner && room.gameState !== 'waiting' && (
              <Button
                onClick={onEndGame}
                variant="ghost"
                size="sm"
                className="text-xs lg:text-sm text-destructive hover:bg-destructive/10 border border-destructive/30"
                title="End game immediately"
              >
                <span className="mr-1">⏹</span>
                <span className="hidden sm:inline">End Game</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
