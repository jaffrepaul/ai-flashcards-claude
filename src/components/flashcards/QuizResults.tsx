'use client';

import { Button } from '@/components/ui/Button';
import type { QuizResults } from '@/types/app';

interface QuizResultsProps {
  results: QuizResults;
  onComplete: () => void;
}

export function QuizResults({ results, onComplete }: QuizResultsProps) {
  const accuracy = (results.correctAnswers / results.totalCards) * 100;
  const averageTimePerCard = results.timeSpent / results.totalCards / 1000;

  return (
    <div className='max-w-md mx-auto bg-white rounded-lg shadow-lg p-8'>
      <div className='text-center'>
        <div className='mb-6'>
          <div className='w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4'>
            <svg
              className='w-10 h-10 text-green-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Quiz Complete!
          </h2>
          <p className='text-gray-600'>
            Great job! Here&apos;s how you performed:
          </p>
        </div>

        <div className='space-y-4 mb-8'>
          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='text-3xl font-bold text-gray-900'>
              {accuracy.toFixed(1)}%
            </div>
            <div className='text-sm text-gray-600'>Accuracy</div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='bg-green-50 rounded-lg p-4'>
              <div className='text-2xl font-bold text-green-600'>
                {results.correctAnswers}
              </div>
              <div className='text-sm text-gray-600'>Correct</div>
            </div>
            <div className='bg-red-50 rounded-lg p-4'>
              <div className='text-2xl font-bold text-red-600'>
                {results.incorrectAnswers}
              </div>
              <div className='text-sm text-gray-600'>Incorrect</div>
            </div>
          </div>

          <div className='bg-blue-50 rounded-lg p-4'>
            <div className='text-lg font-semibold text-blue-600'>
              {averageTimePerCard.toFixed(1)}s
            </div>
            <div className='text-sm text-gray-600'>Average per card</div>
          </div>
        </div>

        <div className='flex space-x-3'>
          <Button onClick={onComplete} className='flex-1'>
            Complete Session
          </Button>
        </div>
      </div>
    </div>
  );
}
