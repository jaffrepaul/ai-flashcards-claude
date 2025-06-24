'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/types/database';

interface CardFilterProps {
  cards: Card[];
  onFilterChange: (filteredCards: Card[]) => void;
  className?: string;
}

export function CardFilter({
  cards,
  onFilterChange,
  className,
}: CardFilterProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState<string>('');

  // Extract all unique tags from cards
  useEffect(() => {
    const tags = new Set<string>();
    cards.forEach(card => {
      if (card.tags) {
        card.tags.forEach(tag => tags.add(tag));
      }
    });
    setAvailableTags(Array.from(tags).sort());
  }, [cards]);

  // Apply filters when selections change
  useEffect(() => {
    let filteredCards = cards;

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filteredCards = filteredCards.filter(
        card => card.difficulty === selectedDifficulty
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filteredCards = filteredCards.filter(
        card => card.tags && selectedTags.some(tag => card.tags!.includes(tag))
      );
    }

    onFilterChange(filteredCards);
  }, [cards, selectedTags, selectedDifficulty, onFilterChange]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleDifficultyToggle = (difficulty: string) => {
    setSelectedDifficulty(prev => (prev === difficulty ? 'all' : difficulty));
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedDifficulty('all');
    setTagSearch('');
  };

  const hasActiveFilters =
    selectedTags.length > 0 || selectedDifficulty !== 'all';

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 hover:bg-green-200',
    medium: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    hard: 'bg-red-100 text-red-800 hover:bg-red-200',
  };

  const selectedDifficultyColors = {
    easy: 'bg-green-500 text-white hover:bg-green-600',
    medium: 'bg-yellow-500 text-white hover:bg-yellow-600',
    hard: 'bg-red-500 text-white hover:bg-red-600',
  };

  // Filter tags based on search
  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Difficulty Filter */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Difficulty
        </label>
        <div className='flex space-x-2'>
          {(['easy', 'medium', 'hard'] as const).map(difficulty => (
            <button
              key={difficulty}
              onClick={() => handleDifficultyToggle(difficulty)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedDifficulty === difficulty
                  ? selectedDifficultyColors[difficulty]
                  : difficultyColors[difficulty]
              }`}
            >
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Tags ({availableTags.length} available)
          </label>

          {/* Tag Search */}
          <div className='mb-3'>
            <input
              type='text'
              placeholder='Search tags...'
              value={tagSearch}
              onChange={e => setTagSearch(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
            />
          </div>

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className='mb-3'>
              <div className='text-xs font-medium text-gray-600 mb-2'>
                Selected:
              </div>
              <div className='flex flex-wrap gap-2'>
                {selectedTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className='px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-1'
                  >
                    <span>{tag}</span>
                    <span className='text-xs'>×</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Available Tags */}
          <div className='max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50'>
            <div className='flex flex-wrap gap-2'>
              {filteredTags.length > 0 ? (
                filteredTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))
              ) : (
                <div className='text-sm text-gray-500 italic'>
                  {tagSearch
                    ? 'No tags match your search'
                    : 'No tags available'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className='text-sm text-blue-600 hover:text-blue-800 underline'
        >
          Clear all filters
        </button>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className='text-sm text-gray-600'>
          Showing{' '}
          {
            cards.filter(card => {
              if (
                selectedDifficulty !== 'all' &&
                card.difficulty !== selectedDifficulty
              )
                return false;
              if (
                selectedTags.length > 0 &&
                (!card.tags ||
                  !selectedTags.some(tag => card.tags!.includes(tag)))
              )
                return false;
              return true;
            }).length
          }{' '}
          of {cards.length} cards
        </div>
      )}
    </div>
  );
}
