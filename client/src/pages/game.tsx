import { useSocket } from "@/hooks/useSocket";
import { GameHeader } from "@/components/game/GameHeader";
import { GameBoard } from "@/components/game/GameBoard";
import { ChatSidebar } from "@/components/game/ChatSidebar";
import { PlayersSidebar } from "@/components/game/PlayersSidebar";
import { JoinRoomModal } from "@/components/game/JoinRoomModal";
import { GameOverModal } from "@/components/game/GameOverModal";
import { useState } from "react";

export default function GamePage() {
  const socket = useSocket();
  const { room, player, gameState, isConnected } = socket;
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showMobilePlayers, setShowMobilePlayers] = useState(false);

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
        {/* Mobile overlay sidebars */}
        {showMobileChat && room && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setShowMobileChat(false)}>
            <div className="h-full w-80 max-w-[80vw] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-2 bg-[hsl(220,26%,10%)] border-b border-border/30 flex-shrink-0">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">💬 Chat</span>
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/30"
                  aria-label="Close chat"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatSidebar
                  room={room}
                  player={player}
                  chatMessages={socket.chatMessages}
                  gameState={gameState}
                  onSendMessage={socket.sendChatMessage}
                />
              </div>
            </div>
          </div>
        )}

        {showMobilePlayers && room && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setShowMobilePlayers(false)}>
            <div className="h-full w-72 max-w-[80vw] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-2 bg-[hsl(220,26%,10%)] border-b border-border/30 flex-shrink-0">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">👥 Players</span>
                <button
                  onClick={() => setShowMobilePlayers(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/30"
                  aria-label="Close players"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <PlayersSidebar
                  room={room}
                  player={player}
                  onStartGame={socket.startGame}
                />
              </div>
            </div>
          </div>
        )}

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
            onToggleChat={() => setShowMobileChat(!showMobileChat)}
            onTogglePlayers={() => setShowMobilePlayers(!showMobilePlayers)}
            showMobileChat={showMobileChat}
            showMobilePlayers={showMobilePlayers}
          />

          <div className="flex-1 flex overflow-hidden">
            <GameBoard
              room={room}
              player={player}
              gameState={gameState}
              gameEvents={socket.gameEvents}
              onVote={socket.vote}
              onDoctorSave={socket.doctorSave}
              onDetectiveInvestigate={socket.detectiveInvestigate}
            />

            {/* Chat Sidebar - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:flex">
              <ChatSidebar
                room={room}
                player={player}
                chatMessages={socket.chatMessages}
                gameState={gameState}
                onSendMessage={socket.sendChatMessage}
              />
            </div>
          </div>
        </main>

        {/* Players Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:flex">
          <PlayersSidebar
            room={room}
            player={player}
            onStartGame={socket.startGame}
          />
        </div>

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
