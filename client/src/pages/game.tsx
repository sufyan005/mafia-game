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
      <div className="min-h-screen bg-gradient-to-b from-[hsl(220,26%,8%)] to-[hsl(220,26%,5%)] text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Connecting to game server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(220,26%,8%)] to-[hsl(220,26%,5%)] text-foreground font-game">
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        {/* Main Game Area */}
        <main className="flex-1 flex flex-col">
          <GameHeader
            room={room}
            gameState={gameState}
            player={player}
            onEndGame={() => {
              if (window.confirm('Are you sure you want to end the game? All players will be returned to the lobby.')) {
                socket.endGame();
              }
            }}
          />

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <GameBoard
              room={room}
              player={player}
              gameState={gameState}
              gameEvents={socket.gameEvents}
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
