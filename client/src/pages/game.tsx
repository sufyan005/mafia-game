import { useSocket } from "@/hooks/useSocket";
import { GameHeader } from "@/components/game/GameHeader";
import { GameBoard } from "@/components/game/GameBoard";
import { ChatSidebar } from "@/components/game/ChatSidebar";
import { PlayersSidebar } from "@/components/game/PlayersSidebar";
import { JoinRoomModal } from "@/components/game/JoinRoomModal";
import { GameOverModal } from "@/components/game/GameOverModal";

export default function GamePage() {
  const socket = useSocket();
  const { room, player, gameState, isConnected } = socket;

  const showJoinModal = !room || !player;
  const showGameOverModal = room?.gameState === 'ended';

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-game-dark text-game-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-game-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Connecting to game server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-game-dark text-game-light font-game min-h-screen">
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        {/* Main Game Area */}
        <main className="flex-1 flex flex-col bg-game-secondary">
          <GameHeader room={room} gameState={gameState} />
          
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <GameBoard 
              room={room} 
              player={player} 
              gameState={gameState}
              onVote={socket.vote}
              onDoctorSave={socket.doctorSave}
              onDetectiveInvestigate={socket.detectiveInvestigate}
            />
            
            <ChatSidebar 
              room={room}
              player={player}
              chatMessages={socket.chatMessages}
              gameState={gameState}
              onSendMessage={socket.sendChatMessage}
            />
          </div>
        </main>

        {/* Players Sidebar */}
        <PlayersSidebar 
          room={room}
          player={player}
          onStartGame={socket.startGame}
        />
      </div>

      {/* Modals */}
      {showJoinModal && (
        <JoinRoomModal onJoinRoom={socket.joinRoom} />
      )}
      
      {showGameOverModal && room && (
        <GameOverModal 
          room={room}
          player={player}
          onRestartGame={socket.restartGame}
        />
      )}
    </div>
  );
}
