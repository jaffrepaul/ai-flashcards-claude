'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/types/database';
import { QuizResults as QuizResultsType } from '@/types/app';
import { FlashCard } from './FlashCard';
import { QuizResults } from './QuizResults';
import { Button } from '@/components/ui/Button';

interface QuizSessionProps {
  cards: Card[];
  onComplete: (results: QuizResultsType) => void;
  onExit: () => void;
}

export function QuizSession({ cards, onComplete, onExit }: QuizSessionProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [results, setResults] = useState<QuizResultsType>({
    totalCards: cards.length,
    correctAnswers: 0,
    incorrectAnswers: 0,
    timeSpent: 0,
    cardResults: [],
  });
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [sessionStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  const currentCard = cards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  useEffect(() => {
    setCardStartTime(Date.now());
  }, [currentCardIndex]);

  const handleAnswer = (isCorrect: boolean) => {
    const timeSpent = Date.now() - cardStartTime;

    const cardResult = {
      cardId: currentCard.id,
      isCorrect,
      timeSpent,
    };

    const newResults = {
      ...results,
      correctAnswers: results.correctAnswers + (isCorrect ? 1 : 0),
      incorrectAnswers: results.incorrectAnswers + (isCorrect ? 0 : 1),
      cardResults: [...results.cardResults, cardResult],
    };

    setResults(newResults);

    if (currentCardIndex + 1 < cards.length) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      const totalTimeSpent = Date.now() - sessionStartTime;
      const finalResults = {
        ...newResults,
        timeSpent: totalTimeSpent,
      };
      setResults(finalResults);
      setIsComplete(true);
    }
  };

  const handleComplete = () => {
    onComplete(results);
  };

  if (isComplete) {
    return <QuizResults results={results} onComplete={handleComplete} />;
  }

  return (
    <div className='max-w-2xl mx-auto'>
      {/* Progress bar */}
      <div className='mb-6'>
        <div className='flex items-center justify-between text-sm text-gray-600 mb-2'>
          <span>
            Card {currentCardIndex + 1} of {cards.length}
          </span>
          <span>{progress.toFixed(0)}% Complete</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-blue-600 h-2 rounded-full transition-all duration-500'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current stats */}
      <div className='grid grid-cols-3 gap-4 mb-6'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-green-600'>
            {results.correctAnswers}
          </div>
          <div className='text-xs text-gray-600'>Correct</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-red-600'>
            {results.incorrectAnswers}
          </div>
          <div className='text-xs text-gray-600'>Incorrect</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-gray-600'>
            {currentCardIndex + 1}
          </div>
          <div className='text-xs text-gray-600'>Current</div>
        </div>
      </div>

      {/* Flash card */}
      <FlashCard
        card={currentCard}
        onAnswer={handleAnswer}
        showAnswerButtons={true}
        className='mb-6'
      />

      {/* Exit button */}
      <div className='text-center'>
        <Button variant='outline' onClick={onExit}>
          Exit Quiz
        </Button>
      </div>
    </div>
  );
}
