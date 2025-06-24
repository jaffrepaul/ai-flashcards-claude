'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Deck } from '@/types/database';
import { cn } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api-utils';

interface DeckCardProps {
  deck: Deck;
  className?: string;
  onDelete?: (deckId: string) => void;
}

export function DeckCard({ deck, className, onDelete }: DeckCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete "${deck.title}"? This will also delete all ${deck.card_count || 0} cards in this deck. This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      await authenticatedFetch(`/api/decks/${deck.id}`, {
        method: 'DELETE',
      });

      onDelete?.(deck.id);
    } catch (error) {
      console.error('Error deleting deck:', error);
      alert('Failed to delete deck. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link href={`/deck/${deck.id}`}>
      <div
        className={cn(
          'bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer relative group',
          className
        )}
      >
        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className='absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 z-10'
          title='Delete deck'
        >
          {isDeleting ? (
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
          ) : (
            '×'
          )}
        </button>

        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              {deck.title}
            </h3>

            {deck.description && (
              <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                {deck.description}
              </p>
            )}

            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4 text-sm text-gray-500'>
                <span>{deck.card_count || 0} cards</span>
                {deck.is_public && (
                  <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                    Public
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {deck.tags && deck.tags.length > 0 && (
          <div className='mt-4 flex flex-wrap gap-2'>
            {deck.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
              >
                {tag}
              </span>
            ))}
            {deck.tags.length > 3 && (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500'>
                +{deck.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className='mt-4 pt-4 border-t border-gray-100'>
          <div className='flex items-center justify-between text-xs text-gray-400'>
            <span>
              Created {new Date(deck.created_at).toLocaleDateString()}
            </span>
            <span>
              Updated {new Date(deck.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
