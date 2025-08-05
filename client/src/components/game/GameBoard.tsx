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
  onVote: (target: string, phase: 'night' | 'day') => void;
  onDoctorSave: (target: string) => void;
  onDetectiveInvestigate: (target: string) => void;
}

export function GameBoard({ 
  room, 
  player, 
  gameState, 
  onVote, 
  onDoctorSave, 
  onDetectiveInvestigate 
}: GameBoardProps) {
  if (!room || !player || !gameState.role) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎭</div>
          <h2 className="text-2xl font-bold mb-2">Waiting for game to start...</h2>
          <p className="text-gray-400">The room owner can start the game when ready.</p>
        </div>
      </div>
    );
  }

  const alivePlayers = room.players.filter(p => p.isAlive && p.id !== player.id);
  const canVote = player.isAlive;
  
  const getRoleInfo = () => {
    switch (gameState.role) {
      case 'mafia':
        return {
          name: 'Mafia',
          icon: 'fas fa-user-secret',
          description: 'Work with other Mafia to eliminate civilians',
          color: 'from-red-900 to-red-700',
          iconColor: 'text-red-300',
        };
      case 'doctor':
        return {
          name: 'Doctor',
          icon: 'fas fa-user-md',
          description: 'Save one person each night (including yourself)',
          color: 'from-green-900 to-green-700',
          iconColor: 'text-green-300',
        };
      case 'detective':
        return {
          name: 'Detective',
          icon: 'fas fa-search',
          description: 'Investigate one person each night to learn their role',
          color: 'from-blue-900 to-blue-700',
          iconColor: 'text-blue-300',
        };
      case 'villager':
        return {
          name: 'Villager',
          icon: 'fas fa-user',
          description: 'Help identify and vote out the Mafia',
          color: 'from-gray-900 to-gray-700',
          iconColor: 'text-gray-300',
        };
      default:
        return {
          name: 'Unknown',
          icon: 'fas fa-question',
          description: 'Unknown role',
          color: 'from-gray-900 to-gray-700',
          iconColor: 'text-gray-300',
        };
    }
  };

  const roleInfo = getRoleInfo();

  const handlePlayerAction = (targetId: string) => {
    if (!canVote || !gameState.phase) return;

    if (gameState.phase === 'night') {
      if (gameState.role === 'mafia') {
        onVote(targetId, 'night');
      } else if (gameState.role === 'doctor') {
        onDoctorSave(targetId);
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
    if (!canVote || !gameState.phase) return false;
    
    if (gameState.phase === 'night') {
      return ['mafia', 'doctor', 'detective'].includes(gameState.role!);
    } else if (gameState.phase === 'day') {
      return true;
    }
    
    return false;
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Role Card */}
      <Card className={`bg-gradient-to-r ${roleInfo.color} border-opacity-50 mb-6`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Role</h2>
              <div className="flex items-center space-x-3">
                <i className={`${roleInfo.icon} text-3xl ${roleInfo.iconColor}`}></i>
                <div>
                  <p className="text-xl font-semibold text-white">{roleInfo.name}</p>
                  <p className="text-gray-300 text-sm">{roleInfo.description}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                player.isAlive ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'
              }`}>
                <i className={`fas ${player.isAlive ? 'fa-heart' : 'fa-skull'} mr-1`}></i>
                {player.isAlive ? 'Alive' : 'Dead'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teammates (for Mafia) */}
      {gameState.role === 'mafia' && gameState.teammates && gameState.teammates.length > 0 && (
        <Card className="bg-game-dark mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-users mr-2 text-red-400"></i>
              Your Mafia Partners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gameState.teammates.map(teammate => (
                <div key={teammate.id} className="flex items-center space-x-3 p-2 bg-red-900 bg-opacity-30 rounded">
                  <i className="fas fa-user-secret text-red-400"></i>
                  <span className="font-medium">{teammate.displayName}</span>
                  <span className={`text-sm ${teammate.isAlive ? 'text-green-400' : 'text-red-400'}`}>
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
        <Card className="bg-blue-900 border-blue-500 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-search mr-2 text-blue-400"></i>
              Investigation Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-200">
              <strong>{gameState.investigationResult.targetName}</strong> is{' '}
              <span className={gameState.investigationResult.isMafia ? 'text-red-400' : 'text-green-400'}>
                {gameState.investigationResult.isMafia ? 'MAFIA' : 'NOT MAFIA'}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Area */}
      {canTakeAction() && alivePlayers.length > 0 && (
        <Card className="bg-game-dark mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-crosshairs mr-2 text-red-400"></i>
              {getActionTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              {gameState.phase === 'night' && gameState.role === 'mafia' && 
                'Choose a player to eliminate (all Mafia must agree):'}
              {gameState.phase === 'night' && gameState.role === 'doctor' && 
                'Choose a player to save (can save yourself):'}
              {gameState.phase === 'night' && gameState.role === 'detective' && 
                'Choose a player to investigate:'}
              {gameState.phase === 'day' && 
                'Vote to eliminate a player:'}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {alivePlayers.map(targetPlayer => (
                <Button
                  key={targetPlayer.id}
                  variant="outline"
                  className="bg-gray-700 hover:bg-red-600 border-gray-600 hover:border-red-500 h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => handlePlayerAction(targetPlayer.id)}
                >
                  <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-gray-300"></i>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{targetPlayer.displayName}</p>
                    <p className="text-xs text-gray-400">Player</p>
                  </div>
                </Button>
              ))}
              
              {/* Add self-save option for doctor */}
              {gameState.phase === 'night' && gameState.role === 'doctor' && (
                <Button
                  variant="outline"
                  className="bg-gray-700 hover:bg-green-600 border-gray-600 hover:border-green-500 h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => handlePlayerAction(player.id)}
                >
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-white"></i>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Yourself</p>
                    <p className="text-xs text-gray-400">Self-save</p>
                  </div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Events */}
      <Card className="bg-game-dark">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-newspaper mr-2 text-game-info"></i>
            Game Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {room.gameEvents.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No events yet...</p>
            ) : (
              room.gameEvents.slice(-5).reverse().map((event, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                  <i className={`fas ${
                    event.type === 'elimination' ? 'fa-skull text-red-400' :
                    event.type === 'save' ? 'fa-shield-alt text-green-400' :
                    'fa-info-circle text-blue-400'
                  } mt-1`}></i>
                  <div>
                    <p className="font-medium">{event.message}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
