'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { DeckCard } from '@/components/flashcards/DeckCard';
import { CreateDeckModal } from '@/components/flashcards/CreateDeckModal';
import { Deck } from '@/types/database';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDecks = useCallback(async () => {
    try {
      const response = await fetch(`/api/decks?userId=${user?.id}`);
      const data = await response.json();
      if (response.ok) {
        setDecks(data.decks || []);
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchDecks();
    }
  }, [user, fetchDecks]);

  const handleDeckCreated = (newDeck: Deck) => {
    setDecks([newDeck, ...decks]);
    setIsCreateModalOpen(false);
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

  if (!user) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              My Flashcard Decks
            </h1>
            <p className='mt-2 text-gray-600'>
              Create, study, and manage your AI-generated flashcard collections
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Create New Deck
          </Button>
        </div>

        {decks.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-6xl mb-4'>📚</div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No flashcard decks yet
            </h3>
            <p className='text-gray-500 mb-6'>
              Create your first deck to start learning with AI-generated
              flashcards
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Your First Deck
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {decks.map(deck => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}

        <CreateDeckModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onDeckCreated={handleDeckCreated}
        />
      </main>
    </div>
  );
}
