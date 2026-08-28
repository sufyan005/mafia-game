import { type Room, type Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameBoardProps {
  room: Room | null;
  player: Player | null;
  gameState: {
    phase?: string;
    timer: number;
    role?: string;
    teammates?: Player[];
    investigationResult?: { target: string; targetName: string; isMafia: boolean };
  };
  gameEvents: Array<{ type: string; message: string; data: any; timestamp: number }>;
  onVote: (target: string, phase: 'night' | 'day') => void;
  onDoctorSave: (target: string) => void;
  onDetectiveInvestigate: (target: string) => void;
}

export function GameBoard({
  room,
  player,
  gameState,
  gameEvents: immediateEvents,
  onVote,
  onDoctorSave,
  onDetectiveInvestigate
}: GameBoardProps) {
  if (!room || !player || room.gameState === 'waiting') {
    const currentPlayers = room?.players.length || 0;
    const playersNeeded = Math.max(0, 4 - currentPlayers);
    const canStart = currentPlayers >= 4 && player?.isOwner;

    return (
      <div className="flex-1 p-4 sm:p-6 flex items-center justify-center">
        <Card className="glass-card">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎭</div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Waiting for game to start...</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {currentPlayers > 0 ? (
                <>
                  <span className="font-medium text-primary">{currentPlayers}</span> / 4 players joined
                  {playersNeeded > 0 && (
                    <span className="ml-2 text-muted-foreground">({playersNeeded} more needed)</span>
                  )}
                </>
              ) : (
                'The room owner can start the game when ready.'
              )}
            </p>
            {currentPlayers > 0 && playersNeeded > 0 && (
              <p className="text-muted-foreground/60 text-sm">
                Waiting for {playersNeeded} more player{playersNeeded === 1 ? '' : 's'} to join...
              </p>
            )}
            {canStart && (
              <p className="text-green-400 text-sm font-medium mt-2">
                ✓ Ready to start! Room owner can begin the game.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // During night, mafia cannot target their own teammates
  const alivePlayers = gameState.phase === 'night' && gameState.role === 'mafia'
    ? room.players.filter(p => p.isAlive && p.id !== player.id && p.role !== 'mafia')
    : room.players.filter(p => p.isAlive && p.id !== player.id);
  const canVote = player.isAlive;

  // Check if current player has already made their action
  const hasVoted = () => {
    if (gameState.phase === 'night') {
      if (gameState.role === 'mafia') {
        return Boolean(room.nightVotes && room.nightVotes[player.id]);
      } else if (gameState.role === 'doctor') {
        return Boolean(room.doctorSave !== undefined);
      } else if (gameState.role === 'detective') {
        return Boolean(room.detectiveInvestigation);
      }
    } else if (gameState.phase === 'day') {
      return Boolean(room.dayVotes && room.dayVotes[player.id]);
    }
    return false;
  };

  const getSelectedTarget = () => {
    if (gameState.phase === 'night') {
      if (gameState.role === 'mafia') {
        return room.nightVotes?.[player.id];
      } else if (gameState.role === 'doctor') {
        return room.doctorSave;
      } else if (gameState.role === 'detective') {
        return room.detectiveInvestigation;
      }
    } else if (gameState.phase === 'day') {
      return room.dayVotes?.[player.id];
    }
    return undefined;
  };

  const getRoleInfo = () => {
    switch (gameState.role) {
      case 'mafia':
        return {
          name: 'Mafia',
          icon: '🔪',
          description: 'Work with other Mafia to eliminate civilians',
          gradient: 'from-red-500/20 to-red-500/10',
          iconColor: 'text-red-400',
          borderColor: 'border-red-500/30',
        };
      case 'doctor':
        return {
          name: 'Doctor',
          icon: '🩺',
          description: 'Save one person each night (including yourself)',
          gradient: 'from-green-500/20 to-green-500/10',
          iconColor: 'text-green-400',
          borderColor: 'border-green-500/30',
        };
      case 'detective':
        return {
          name: 'Detective',
          icon: '🕵️',
          description: 'Investigate one person each night to learn their role',
          gradient: 'from-blue-500/20 to-blue-500/10',
          iconColor: 'text-blue-400',
          borderColor: 'border-blue-500/30',
        };
      case 'villager':
        return {
          name: 'Villager',
          icon: '👤',
          description: 'Help identify and vote out the Mafia',
          gradient: 'from-gray-500/20 to-gray-500/10',
          iconColor: 'text-gray-400',
          borderColor: 'border-gray-500/30',
        };
      default:
        return {
          name: 'Unknown',
          icon: '❓',
          description: 'Unknown role',
          gradient: 'from-gray-500/20 to-gray-500/10',
          iconColor: 'text-gray-400',
          borderColor: 'border-gray-500/30',
        };
    }
  };

  const roleInfo = getRoleInfo();

  const currentPlayer = room?.players.find(p => p.id === player?.id) || player;

  const handlePlayerAction = (targetId: string) => {
    if (!canVote || !gameState.phase) return;
    // Only block detective from changing once they've investigated this night
    if (gameState.role === 'detective' && hasVoted()) return;

    if (gameState.phase === 'night') {
      if (gameState.role === 'mafia') {
        onVote(targetId, 'night');
      } else if (gameState.role === 'doctor') {
        onDoctorSave(targetId);  // Doctor can change target anytime during night
      } else if (gameState.role === 'detective') {
        onDetectiveInvestigate(targetId);
      }
    } else if (gameState.phase === 'day') {
      onVote(targetId, 'day');
    }
  };

  const getActionButtonText = () => {
    if (gameState.phase === 'night') {
      switch (gameState.role) {
        case 'mafia':
          return 'Vote to Kill';
        case 'doctor':
          return 'Save Player';
        case 'detective':
          return 'Investigate';
        default:
          return 'Wait';
      }
    } else if (gameState.phase === 'day') {
      return 'Vote to Eliminate';
    }
    return 'No Action';
  };

  const getActionTitle = () => {
    if (gameState.phase === 'night') {
      switch (gameState.role) {
        case 'mafia':
          return 'Night Kill Vote';
        case 'doctor':
          return 'Doctor Save';
        case 'detective':
          return 'Detective Investigation';
        default:
          return 'Night Phase';
      }
    } else if (gameState.phase === 'day') {
      return 'Elimination Vote';
    }
    return 'Waiting';
  };

  const canTakeAction = () => {
    if (!canVote || !gameState.phase || !gameState.role) return false;

    if (gameState.phase === 'night') {
      return ['mafia', 'doctor', 'detective'].includes(gameState.role);
    } else if (gameState.phase === 'day') {
      return true;
    }

    return false;
  };

  return (
    <div className="flex-1 p-4 sm:p-6 h-full overflow-y-auto">
      {/* Role Card */}
      <Card className={`glass-card mb-4 sm:mb-6 ${roleInfo.borderColor} bg-gradient-to-r ${roleInfo.gradient}`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-secondary/50 border border-border/30">
                <span className="text-xl sm:text-2xl">{roleInfo.icon}</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground">Your Role</h2>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{roleInfo.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{roleInfo.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                currentPlayer.isAlive
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                <span className={`w-2 h-2 ${currentPlayer.isAlive ? 'bg-green-400' : 'bg-red-400'} rounded-full mr-1 sm:mr-2`}></span>
                {currentPlayer.isAlive ? 'Alive' : 'Dead'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teammates (for Mafia) */}
      {gameState.role === 'mafia' && gameState.teammates && gameState.teammates.length > 0 && (
        <Card className="glass-card mb-4 sm:mb-6 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <span className="mr-2">👥</span>
              Your Mafia Partners
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {gameState.teammates.map(teammate => (
                <div key={teammate.id} className="flex items-center space-x-3 p-2 bg-secondary/30 rounded-lg border border-border/20">
                  <span className="text-red-400">🔪</span>
                  <span className="font-medium text-foreground">{teammate.displayName}</span>
                  <span className={`text-xs ${teammate.isAlive ? 'text-green-400' : 'text-red-400'}`}>
                    {teammate.isAlive ? 'Alive' : 'Dead'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investigation Result */}
      {gameState.investigationResult && (
        <Card className={`glass-card mb-4 sm:mb-6 border-blue-500/30`}>
          <CardHeader>
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <span className="mr-2">🕵️</span>
              Investigation Result
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{gameState.investigationResult.targetName}</strong> is{' '}
              <span className={gameState.investigationResult.isMafia ? 'text-red-400' : 'text-green-400'}>
                {gameState.investigationResult.isMafia ? 'MAFIA' : 'NOT MAFIA'}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Area */}
      {canTakeAction() && alivePlayers.length > 0 && (
        <Card className="glass-card mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <span className="mr-2">🎯</span>
              {getActionTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm mb-3">
              {gameState.phase === 'night' && gameState.role === 'mafia' &&
                'Choose a player to eliminate (all Mafia must agree).'}
              {gameState.phase === 'night' && gameState.role === 'doctor' &&
                'Choose a player to save (can save yourself). Click to change selection.'}
              {gameState.phase === 'night' && gameState.role === 'detective' &&
                'Choose a player to investigate.'}
              {gameState.phase === 'day' &&
                'Vote to eliminate a player.'}
            </p>

            {hasVoted() && gameState.role === 'doctor' && gameState.phase === 'night' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3">
                <p className="text-green-400 text-sm">
                  ✓ Your action has been recorded. You can still change your selection.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {alivePlayers.map(targetPlayer => {
                const isSelected = getSelectedTarget() === targetPlayer.id;
                return (
                  <Button
                    key={targetPlayer.id}
                    variant="ghost"
                    disabled={hasVoted() && !(gameState.role === 'doctor' && gameState.phase === 'night')}
                    className={`h-auto p-3 sm:p-4 flex flex-col space-y-1 sm:space-y-2 transition-all touch-target ${
                      isSelected
                        ? 'bg-green-500/20 border border-green-500/50 hover:bg-green-500/30'
                        : 'hover:bg-secondary/50 border border-transparent hover:border-destructive/30'
                    }`}
                    onClick={() => handlePlayerAction(targetPlayer.id)}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-green-500' : 'bg-secondary/50 border border-border/30'
                    }`}>
                      <span className={`text-lg ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                        {targetPlayer.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground text-xs sm:text-sm">{targetPlayer.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {isSelected ? 'Selected' : 'Player'}
                      </p>
                    </div>
                  </Button>
                );
              })}

              {/* Add self-save option for doctor */}
              {gameState.phase === 'night' && gameState.role === 'doctor' && (() => {
                const isSelected = getSelectedTarget() === player.id;
                return (
                  <Button
                    variant="ghost"
                    disabled={gameState.phase !== 'night' || gameState.role !== 'doctor'}
                    className={`h-auto p-3 sm:p-4 flex flex-col space-y-1 sm:space-y-2 transition-all touch-target ${
                      isSelected
                        ? 'bg-green-500/20 border border-green-500/50 hover:bg-green-500/30'
                        : 'hover:bg-secondary/50 border border-transparent hover:border-destructive/30'
                    }`}
                    onClick={() => handlePlayerAction(player.id)}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-green-500' : 'bg-secondary/50 border border-border/30'
                    }`}>
                      <span className={`text-lg ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                        {player.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground text-xs sm:text-sm">Yourself</p>
                      <p className="text-xs text-muted-foreground">
                        {isSelected ? 'Selected' : 'Self-save'}
                      </p>
                    </div>
                  </Button>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Events */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
            <span className="mr-2">📰</span>
            Game Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3 max-h-[200px] sm:max-h-[250px] overflow-y-auto">
            {(() => {
              // Merge immediate events with room events, deduplicating by message + timestamp
              // Start with immediate events (they arrive first), then add server events not already present
              const mergedEvents = [...immediateEvents];
              const seen = new Set(
                immediateEvents.map(e => `${e.message}-${e.timestamp}`)
              );
              room.gameEvents.forEach(event => {
                const key = `${event.message}-${event.timestamp}`;
                if (!seen.has(key)) {
                  // room.gameEvents doesn't have 'data' field per schema, add it for consistency
                  mergedEvents.push({ ...event, data: null });
                  seen.add(key);
                }
              });
              // Sort by timestamp (newest last), then show all reversed (newest first)
              mergedEvents.sort((a, b) => a.timestamp - b.timestamp);
              const allEvents = mergedEvents.slice().reverse();

              if (allEvents.length === 0) {
                return <p className="text-muted-foreground text-center py-4 text-sm">No events yet...</p>;
              }

              return allEvents.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="flex items-start space-x-3 p-3 bg-secondary/20 rounded-lg border border-border/20">
                  <span className={`text-base mt-0.5 ${
                    event.type === 'elimination' ? 'text-red-400' :
                    event.type === 'save' ? 'text-green-400' :
                    'text-muted-foreground'
                  }`}>
                    {event.type === 'elimination' ? '💀' :
                     event.type === 'save' ? '🛡️' :
                     'ℹ️'}
                  </span>
                  <div>
                    <p className="font-medium text-sm text-foreground">{event.message}</p>
                    <p className="text-xs text-muted-foreground/70">
                      {new Date(event.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}