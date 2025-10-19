import React, { useEffect, useRef, useState } from "react";
import { useGameStore } from "../../../../lib/store/gameStore";
import { GameEvent, GameEventChoice, GameEventEffect } from "../../../../lib/types/gameEvents";

const getEffectIcon = (type: GameEventEffect['type']) => {
  switch (type) {
    case 'cash':
      return '💰';
    case 'reputation':
      return '⭐';
    default:
      return '';
  }
};

const getEffectColorClass = (type: GameEventEffect['type'], amount: number) => {
  if (type === 'reputation') {
    return amount > 0 ? 'text-green-700' : 'text-red-600'; // Darker green for reputation
  }
  return amount > 0 ? 'text-green-700' : 'text-red-600'; // Darker green for cash/cost
};

const formatEffect = (effect: GameEventEffect) => {
  let prefix = '';
  if (effect.type === 'cash') {
    prefix = '$';
  }
  const sign = effect.amount >= 0 ? '+' : '';
  return `${getEffectIcon(effect.type)} ${sign}${prefix}${Math.abs(effect.amount)}`;
};

const EventPopup: React.FC = () => {
  const currentEvent = useGameStore((state) => state.currentEvent);
  const setCurrentEvent = useGameStore((state) => state.setCurrentEvent);
  const [countdown, setCountdown] = useState(10); // Initial countdown for 10 seconds (changed from 4)

  const choiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const processChoice = React.useCallback((event: GameEvent, choice: GameEventChoice) => {
    const {
      applyReputationChange,
      recordEventRevenue,
      recordEventExpense,
    } = useGameStore.getState();

    console.log(`Event: ${event.title}, Choice made: ${choice.label}`);
    choice.effects.forEach((effect) => {
      switch (effect.type) {
        case "cash":
          if (effect.amount >= 0) {
            recordEventRevenue(effect.amount, effect.label ?? `${event.title} payout`);
            console.log(`  Recording Event Revenue: ${effect.amount}`);
          } else {
            recordEventExpense(Math.abs(effect.amount), effect.label ?? `${event.title} cost`);
            console.log(`  Recording Event Expense: ${effect.amount}`);
          }
          break;
        case "reputation":
          applyReputationChange(effect.amount);
          console.log(`  Applying Reputation Change: ${effect.amount}`);
          break;
      }
    });
    setCurrentEvent(null);
  }, [setCurrentEvent]);

  useEffect(() => {
    if (currentEvent) {
      if (choiceTimerRef.current) {
        clearTimeout(choiceTimerRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setCountdown(10); // Reset countdown for the new event (changed from 4)

      const defaultChoice = currentEvent.choices.find((choice) => choice.isDefault);

      if (defaultChoice) {
        choiceTimerRef.current = setTimeout(() => {
          processChoice(currentEvent, defaultChoice);
        }, 10000); // Auto-select default choice after 10 seconds (changed from 4000)

        intervalRef.current = setInterval(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
      }
    } else {
      if (choiceTimerRef.current) {
        clearTimeout(choiceTimerRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (choiceTimerRef.current) {
        clearTimeout(choiceTimerRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentEvent, setCurrentEvent, processChoice]);

  if (!currentEvent) return null;

  const handleUserChoice = (choice: GameEventChoice) => {
    if (choiceTimerRef.current) {
      clearTimeout(choiceTimerRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    processChoice(currentEvent, choice);
  };

  const eventTypeColorClass = currentEvent.category === 'opportunity' ? 'border-green-600 text-green-700' : 'border-red-400 text-red-600'; // Darker green border and text
  const eventIcon = currentEvent.category === 'opportunity' ? '✨' : '⚠️';
  const eventTitleColor = currentEvent.category === 'opportunity' ? 'text-green-800' : 'text-red-700'; // Darker green title

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4 w-full md:w-auto max-w-xl">
      <div className={`bg-white rounded-lg shadow-2xl p-6 md:p-8 relative border-t-4 ${eventTypeColorClass.split(' ')[0]}`}>
        <div className="flex items-center justify-center mb-4">
          <span className={`text-3xl mr-3 ${eventTypeColorClass.split(' ')[1]}`}>{eventIcon}</span>
          <h2 className={`text-3xl font-bold ${eventTitleColor} text-center`}>{currentEvent.title}</h2>
        </div>
        <p className="text-gray-700 text-center mb-6 text-sm md:text-base">{currentEvent.summary}</p>

        <div className="space-y-4">
          {currentEvent.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleUserChoice(choice)}
              className={`w-full text-left p-4 rounded-lg transition duration-200 border
                ${currentEvent.category === 'opportunity'
                  ? (choice.isDefault ? 'bg-green-100 hover:bg-green-200 border-green-300 text-green-900' : 'bg-green-300 hover:bg-green-400 border-green-500 text-green-900')
                  : (choice.isDefault ? 'bg-red-100 hover:bg-red-200 border-red-300 text-red-900' : 'bg-red-300 hover:bg-red-400 border-red-500 text-red-900')
                }
                flex flex-col items-start`}
            >
              <span className="font-bold text-lg mb-1">{choice.label}</span>
              <span className="text-gray-800 text-sm mb-2">{choice.description}</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {choice.effects.map((effect, index) => (
                  <span key={index} className={`text-sm ${getEffectColorClass(effect.type, effect.amount)}`}>
                    {formatEffect(effect)}
                  </span>
                ))}
              </div>
              {choice.isDefault && countdown > 0 && (
                <span className="mt-2 text-sm font-semibold text-gray-700 block animate-pulse">
                  Auto-selecting in {countdown}s...
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventPopup;
