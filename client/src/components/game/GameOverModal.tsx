import { type Room, type Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameOverModalProps {
  room: Room;
  player: Player | null;
  onRestartGame: () => void;
}

export function GameOverModal({ room, player, onRestartGame }: GameOverModalProps) {
  const winners = room.winner === 'mafia' 
    ? room.players.filter(p => p.role === 'mafia')
    : room.players.filter(p => p.role !== 'mafia');

  const isWinner = player && winners.some(w => w.id === player.id);
  const canRestart = player?.isOwner;

  const getWinnerTitle = () => {
    return room.winner === 'mafia' ? 'Mafia Wins!' : 'Civilians Win!';
  };

  const getWinnerDescription = () => {
    if (room.winner === 'mafia') {
      return 'The Mafia successfully eliminated enough civilians to take control of the town.';
    } else {
      return 'The civilians successfully identified and eliminated all the Mafia members.';
    }
  };

  const getWinnerIcon = () => {
    return room.winner === 'mafia' ? 'fas fa-mask' : 'fas fa-shield-alt';
  };

  const getWinnerColor = () => {
    return room.winner === 'mafia' ? 'bg-red-600' : 'bg-green-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="bg-game-secondary w-full max-w-md mx-4 border-gray-600">
        <CardContent className="p-8">
          <div className="text-center">
            <div className={`w-16 h-16 ${getWinnerColor()} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <i className={`${getWinnerIcon()} text-white text-2xl`}></i>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{getWinnerTitle()}</h2>
            
            {isWinner && (
              <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-3 mb-4">
                <p className="text-yellow-200 font-medium">🎉 Congratulations! You won! 🎉</p>
              </div>
            )}
            
            <p className="text-gray-300 mb-6">
              {getWinnerDescription()}
            </p>
            
            {/* Winner List */}
            <Card className="bg-game-dark mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Winners:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {winners.map(winner => (
                    <div key={winner.id} className="flex items-center space-x-2 justify-center">
                      <i className={`fas ${
                        winner.role === 'mafia' ? 'fa-mask text-red-400' :
                        winner.role === 'doctor' ? 'fa-user-md text-green-400' :
                        winner.role === 'detective' ? 'fa-search text-blue-400' :
                        'fa-user text-gray-400'
                      }`}></i>
                      <span>
                        {winner.id === player?.id ? 'You' : winner.displayName}
                        {winner.role && ` (${winner.role.charAt(0).toUpperCase() + winner.role.slice(1)})`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {canRestart ? (
              <Button 
                onClick={onRestartGame}
                className="w-full bg-game-primary hover:bg-purple-700"
              >
                Start New Game
              </Button>
            ) : (
              <p className="text-sm text-gray-400">
                Waiting for room owner to start a new game...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
