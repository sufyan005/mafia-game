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
    return room.winner === 'mafia' ? '🔪' : '🛡️';
  };

  const getWinnerColor = () => {
    return room.winner === 'mafia'
      ? 'bg-red-500 text-white'
      : 'bg-green-500 text-white';
  };

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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="glass-card w-full max-w-md border-border/30">
        <CardContent className="p-8 text-foreground">
          <div className="text-center">
            <div className={`w-20 h-20 ${getWinnerColor()} rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/20`}>
              <span className="text-3xl">{getWinnerIcon()}</span>
            </div>

            <h2 className="text-2xl font-bold mb-2">{getWinnerTitle()}</h2>

            {isWinner && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-yellow-300 font-medium">🎉 Congratulations! You won! 🎉</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-6">
              {getWinnerDescription()}
            </p>

            {/* Winner List */}
            <Card className="glass-card border-border/30 mb-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Winners:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {winners.map(winner => (
                    <div
                      key={winner.id}
                      className="flex items-center space-x-3 justify-center text-sm"
                    >
                      <span className="text-lg">{getRoleIcon(winner.role)}</span>
                      <span className="font-medium">
                        {winner.id === player?.id ? 'You' : winner.displayName}
                      </span>
                      {winner.role && (
                        <span className="text-xs text-muted-foreground/70">
                          ({winner.role.charAt(0).toUpperCase() + winner.role.slice(1)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {canRestart ? (
              <Button
                onClick={onRestartGame}
                variant="ghost"
                className="w-full bg-primary/20 hover:bg-primary/30 text-foreground border border-primary/30"
              >
                Start New Game
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Waiting for room owner to start a new game...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
