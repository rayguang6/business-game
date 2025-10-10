import React from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "../../../../lib/store/gameStore";

const GameOverPopup: React.FC = () => {
  const isGameOver = useGameStore((state) => state.isGameOver);
  const gameOverReason = useGameStore((state) => state.gameOverReason);
  const resetAllGame = useGameStore((state) => state.resetAllGame);
  const router = useRouter();

  if (!isGameOver) return null;

  const handleRestart = () => {
    // Simple restart - reload the page
    window.location.reload();
  };

  const handleGoHome = () => {
    // Reset all game state and navigate home (same as quit game)
    resetAllGame();
    router.push('/');
  };

  const getGameOverMessage = () => {
    if (gameOverReason === 'cash') {
      return {
        title: '💸 Out of Cash!',
        message: 'Your business has run out of money. You need to manage your finances better to stay afloat.',
        icon: '💰',
        color: 'red'
      };
    } else if (gameOverReason === 'reputation') {
      return {
        title: '⭐ Reputation Ruined!',
        message: 'Your reputation has hit rock bottom. Customers no longer trust your business.',
        icon: '😞',
        color: 'orange'
      };
    }
    return {
      title: '❌ Game Over',
      message: 'Your business has failed.',
      icon: '🚫',
      color: 'red'
    };
  };

  const { title, message, icon } = getGameOverMessage();

  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-6xl mb-4">{icon}</div>
          <h2 className="text-3xl font-bold text-red-600 mb-4">{title}</h2>
          <p className="text-gray-700 mb-8 text-lg">{message}</p>

          <div className="space-y-3">
            <button
              onClick={handleRestart}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 text-lg"
            >
              🔄 Try Again
            </button>
            <button
              onClick={handleGoHome}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 text-lg"
            >
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOverPopup;

