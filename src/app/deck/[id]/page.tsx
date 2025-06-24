'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { FlashCard } from '@/components/flashcards/FlashCard';
import { CardFilter } from '@/components/flashcards/CardFilter';
import { QuizSession } from '@/components/flashcards/QuizSession';
import { Deck, Card } from '@/types/database';
import { authenticatedFetch } from '@/lib/api-utils';

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isStudying, setIsStudying] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    topic: '',
    content: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    cardCount: 10,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');

  const deckId = params.id as string;

  const fetchDeckAndCards = useCallback(async () => {
    try {
      const data = await authenticatedFetch(`/api/decks/${deckId}`);
      setDeck(data.deck);
      setCards(data.deck.cards || []);
      setFilteredCards(data.deck.cards || []);
    } catch (error) {
      console.error('Error fetching deck:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [deckId, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (deckId && user) {
      fetchDeckAndCards();
    }
  }, [deckId, user, fetchDeckAndCards]);

  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!generateForm.topic.trim()) return;

    setIsGenerating(true);
    setGenerationStatus('Preparing to generate cards...');

    try {
      setGenerationStatus('Calling AI to generate flashcards...');

      const data = await authenticatedFetch('/api/flashcards/generate', {
        method: 'POST',
        body: JSON.stringify({
          topic: generateForm.topic,
          content: generateForm.content,
          difficulty: generateForm.difficulty,
          cardCount: generateForm.cardCount,
          deckId: deckId,
        }),
      });

      setGenerationStatus('Saving cards to database...');

      const newCards = [...cards, ...data.cards];
      setCards(newCards);
      setFilteredCards(newCards);
      setIsGenerateModalOpen(false);
      setGenerateForm({
        topic: '',
        content: '',
        difficulty: 'medium',
        cardCount: 10,
      });

      showToast(
        `Successfully generated ${data.cards.length} flashcards!`,
        'success'
      );
    } catch (error) {
      console.error('Error generating cards:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate cards';
      showToast(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleCardSelect = (cardId: string, selected: boolean) => {
    const newSelected = new Set(selectedCards);
    if (selected) {
      newSelected.add(cardId);
    } else {
      newSelected.delete(cardId);
    }
    setSelectedCards(newSelected);
  };

  const handleCardDelete = async (cardId: string) => {
    try {
      await authenticatedFetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
      });

      const newCards = cards.filter(card => card.id !== cardId);
      setCards(newCards);
      setFilteredCards(newCards);
      setSelectedCards(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(cardId);
        return newSelected;
      });

      showToast('Card deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting card:', error);
      showToast('Failed to delete card', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCards.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCards.size} card${selectedCards.size > 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // Delete cards one by one (could be optimized with a bulk delete endpoint)
      const deletePromises = Array.from(selectedCards).map(cardId =>
        authenticatedFetch(`/api/cards/${cardId}`, {
          method: 'DELETE',
        })
      );

      await Promise.all(deletePromises);

      const newCards = cards.filter(card => !selectedCards.has(card.id));
      setCards(newCards);
      setFilteredCards(newCards);
      setSelectedCards(new Set());
      setIsSelectionMode(false);

      showToast(
        `Successfully deleted ${selectedCards.size} card${selectedCards.size > 1 ? 's' : ''}`,
        'success'
      );
    } catch (error) {
      console.error('Error bulk deleting cards:', error);
      showToast('Failed to delete some cards', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartStudy = () => {
    if (filteredCards.length === 0) {
      showToast(
        'No cards available to study. Generate some cards first!',
        'error'
      );
      return;
    }
    setIsStudying(true);
  };

  const handleStudyComplete = (results: any) => {
    setIsStudying(false);
    // Here you would typically save the study session results
    console.log('Study session completed:', results);
  };

  const handleStudyExit = () => {
    setIsStudying(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedCards(new Set());
    }
  };

  if (loading || isLoading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Header />
        <div className='flex items-center justify-center pt-20'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      </div>
    );
  }

  if (!user || !deck) {
    return null;
  }

  if (isStudying) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Header />
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <QuizSession
            cards={filteredCards}
            onComplete={handleStudyComplete}
            onExit={handleStudyExit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>{deck.title}</h1>
            {deck.description && (
              <p className='mt-2 text-gray-600'>{deck.description}</p>
            )}
            <div className='flex items-center mt-2 space-x-4 text-sm text-gray-500'>
              <span>
                {filteredCards.length} of {cards.length} cards
              </span>
              {deck.tags && deck.tags.length > 0 && (
                <div className='flex space-x-1'>
                  {deck.tags.map((tag, index) => (
                    <span
                      key={index}
                      className='px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs'
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className='flex space-x-3'>
            <Button
              variant='outline'
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant='outline'
              onClick={toggleSelectionMode}
              className={isSelectionMode ? 'bg-blue-50 border-blue-300' : ''}
            >
              {isSelectionMode ? 'Exit Selection' : 'Select Cards'}
            </Button>
            <Button
              variant='outline'
              onClick={() => setIsGenerateModalOpen(true)}
              disabled={isGenerating}
            >
              Generate Cards
            </Button>
            <Button onClick={handleStartStudy} disabled={isGenerating}>
              Start Studying
            </Button>
          </div>
        </div>

        {/* Selection Mode Actions */}
        {isSelectionMode && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <span className='text-sm font-medium text-blue-900'>
                  {selectedCards.size} card{selectedCards.size !== 1 ? 's' : ''}{' '}
                  selected
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setSelectedCards(
                      new Set(filteredCards.map(card => card.id))
                    )
                  }
                >
                  Select All
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setSelectedCards(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
              <Button
                variant='danger'
                size='sm'
                onClick={handleBulkDelete}
                loading={isDeleting}
                disabled={selectedCards.size === 0}
              >
                Delete Selected ({selectedCards.size})
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className='bg-white border border-gray-200 rounded-lg p-6 mb-6'>
            <CardFilter cards={cards} onFilterChange={setFilteredCards} />
          </div>
        )}

        {filteredCards.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-6xl mb-4'>📝</div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {cards.length === 0
                ? 'No cards in this deck yet'
                : 'No cards match your filters'}
            </h3>
            <p className='text-gray-500 mb-6'>
              {cards.length === 0
                ? 'Generate AI-powered flashcards to start learning'
                : 'Try adjusting your filters or clear them to see all cards'}
            </p>
            {cards.length === 0 && (
              <Button
                onClick={() => setIsGenerateModalOpen(true)}
                disabled={isGenerating}
              >
                Generate Your First Cards
              </Button>
            )}
            {cards.length > 0 && (
              <Button variant='outline' onClick={() => setShowFilters(false)}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredCards.map(card => (
              <FlashCard
                key={card.id}
                card={card}
                isSelectionMode={isSelectionMode}
                isSelected={selectedCards.has(card.id)}
                onSelect={handleCardSelect}
                onDelete={handleCardDelete}
              />
            ))}
          </div>
        )}

        <Modal
          isOpen={isGenerateModalOpen}
          onClose={() => !isGenerating && setIsGenerateModalOpen(false)}
          title='Generate AI Flashcards'
          className='max-w-lg'
        >
          <form onSubmit={handleGenerateCards} className='space-y-4'>
            {isGenerating && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
                <div className='flex items-center space-x-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                  <span className='text-sm text-blue-800 font-medium'>
                    {generationStatus}
                  </span>
                </div>
                <p className='text-xs text-blue-600 mt-1'>
                  This may take 10-30 seconds depending on the number of cards
                </p>
              </div>
            )}

            <Input
              label='Topic'
              value={generateForm.topic}
              onChange={e =>
                setGenerateForm({ ...generateForm, topic: e.target.value })
              }
              placeholder='What would you like to study?'
              required
              disabled={isGenerating}
            />

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Additional Content (optional)
              </label>
              <textarea
                value={generateForm.content}
                onChange={e =>
                  setGenerateForm({ ...generateForm, content: e.target.value })
                }
                placeholder='Paste notes, articles, or additional context here'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                rows={4}
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Difficulty Level
              </label>
              <select
                value={generateForm.difficulty}
                onChange={e =>
                  setGenerateForm({
                    ...generateForm,
                    difficulty: e.target.value as any,
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                disabled={isGenerating}
              >
                <option value='easy'>Easy</option>
                <option value='medium'>Medium</option>
                <option value='hard'>Hard</option>
              </select>
            </div>

            <Input
              label='Number of Cards'
              type='number'
              min='1'
              max='50'
              value={generateForm.cardCount}
              onChange={e =>
                setGenerateForm({
                  ...generateForm,
                  cardCount: parseInt(e.target.value),
                })
              }
              required
              disabled={isGenerating}
            />

            <div className='flex justify-end space-x-3 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsGenerateModalOpen(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button type='submit' loading={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Cards'}
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
