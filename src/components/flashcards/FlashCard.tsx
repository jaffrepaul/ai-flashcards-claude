'use client';

import { useState } from 'react';
import { Card } from '@/types/database';
import { cn } from '@/lib/utils';

interface FlashCardProps {
  card: Card;
  onAnswer?: (isCorrect: boolean) => void;
  showAnswerButtons?: boolean;
  className?: string;
}

export function FlashCard({
  card,
  onAnswer,
  showAnswerButtons = false,
  className,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (isCorrect: boolean) => {
    onAnswer?.(isCorrect);
    setIsFlipped(false);
  };

  const difficultyColors = {
    easy: 'border-green-200 bg-green-50',
    medium: 'border-yellow-200 bg-yellow-50',
    hard: 'border-red-200 bg-red-50',
  };

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div className="relative perspective-1000">
        <div
          className={cn(
            'relative w-full h-64 transition-transform duration-700 transform-style-preserve-3d cursor-pointer',
            isFlipped && 'rotate-y-180'
          )}
          onClick={handleFlip}
        >
          {/* Front of card */}
          <div
            className={cn(
              'absolute inset-0 backface-hidden rounded-lg border-2 p-6 flex items-center justify-center text-center shadow-lg',
              difficultyColors[card.difficulty],
              'bg-white border-gray-200'
            )}
          >
            <div>
              <div className="text-lg font-medium text-gray-900 mb-2">
                {card.front_content}
              </div>
              <div className="text-sm text-gray-500">
                Click to reveal answer
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div
            className={cn(
              'absolute inset-0 backface-hidden rotate-y-180 rounded-lg border-2 p-6 flex flex-col items-center justify-center text-center shadow-lg',
              difficultyColors[card.difficulty]
            )}
          >
            <div className="flex-1 flex items-center justify-center">
              <div className="text-lg text-gray-900">{card.back_content}</div>
            </div>

            {showAnswerButtons && (
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnswer(false);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Incorrect
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnswer(true);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Correct
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card metadata */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span
          className={cn('px-2 py-1 rounded-full text-xs font-medium', {
            'bg-green-100 text-green-800': card.difficulty === 'easy',
            'bg-yellow-100 text-yellow-800': card.difficulty === 'medium',
            'bg-red-100 text-red-800': card.difficulty === 'hard',
          })}
        >
          {card.difficulty}
        </span>

        {card.tags && card.tags.length > 0 && (
          <div className="flex space-x-1">
            {card.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
            {card.tags.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{card.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
