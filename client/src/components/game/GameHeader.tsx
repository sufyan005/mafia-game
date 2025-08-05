import { type Room } from "@shared/schema";

interface GameHeaderProps {
  room: Room | null;
  gameState: {
    phase?: string;
    timer: number;
  };
}

export function GameHeader({ room, gameState }: GameHeaderProps) {
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
        return 'bg-blue-500';
      case 'day':
        return 'bg-yellow-500';
      case 'break':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <header className="bg-game-dark border-b border-gray-600 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-game-primary">
            <i className="fas fa-mask mr-2"></i>
            Mafia Game
          </h1>
          {room && (
            <div className="bg-game-primary text-white px-3 py-1 rounded-full text-sm font-medium">
              {room.id === 'room1' ? 'Room 1' : 'Room 2'}
            </div>
          )}
        </div>
        
        {room && gameState.phase && (
          <div className="flex items-center space-x-4">
            {/* Phase Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 ${getPhaseColor()} rounded-full animate-pulse`}></div>
              <span className="text-lg font-semibold">{getPhaseDisplay()}</span>
            </div>
            
            {/* Timer */}
            <div className="bg-game-warning text-game-dark px-4 py-2 rounded-lg font-bold text-xl">
              {formatTimer(gameState.timer)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
