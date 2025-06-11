'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { FlashCard } from '@/components/flashcards/FlashCard';
import { QuizSession } from '@/components/flashcards/QuizSession';
import { Deck, Card } from '@/types/database';

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isStudying, setIsStudying] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    topic: '',
    content: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    cardCount: 10,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const deckId = params.id as string;

  const fetchDeckAndCards = useCallback(async () => {
    try {
      const response = await fetch(`/api/decks/${deckId}`);
      const data = await response.json();

      if (response.ok) {
        setDeck(data.deck);
        setCards(data.deck.cards || []);
      } else {
        router.push('/dashboard');
      }
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

  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!generateForm.topic.trim()) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: generateForm.topic,
          content: generateForm.content,
          difficulty: generateForm.difficulty,
          cardCount: generateForm.cardCount,
          deckId: deckId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCards([...cards, ...data.cards]);
        setIsGenerateModalOpen(false);
        setGenerateForm({
          topic: '',
          content: '',
          difficulty: 'medium',
          cardCount: 10,
        });
      } else {
        alert('Failed to generate cards: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating cards:', error);
      alert('Failed to generate cards');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartStudy = () => {
    if (cards.length === 0) {
      alert('No cards available to study. Generate some cards first!');
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user || !deck) {
    return null;
  }

  if (isStudying) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <QuizSession
            cards={cards}
            onComplete={handleStudyComplete}
            onExit={handleStudyExit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{deck.title}</h1>
            {deck.description && (
              <p className="mt-2 text-gray-600">{deck.description}</p>
            )}
            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
              <span>{cards.length} cards</span>
              {deck.tags && deck.tags.length > 0 && (
                <div className="flex space-x-1">
                  {deck.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsGenerateModalOpen(true)}
            >
              Generate Cards
            </Button>
            <Button onClick={handleStartStudy}>Start Studying</Button>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No cards in this deck yet
            </h3>
            <p className="text-gray-500 mb-6">
              Generate AI-powered flashcards to start learning
            </p>
            <Button onClick={() => setIsGenerateModalOpen(true)}>
              Generate Your First Cards
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <FlashCard key={card.id} card={card} />
            ))}
          </div>
        )}

        <Modal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          title="Generate AI Flashcards"
          className="max-w-lg"
        >
          <form onSubmit={handleGenerateCards} className="space-y-4">
            <Input
              label="Topic"
              value={generateForm.topic}
              onChange={(e) =>
                setGenerateForm({ ...generateForm, topic: e.target.value })
              }
              placeholder="What would you like to study?"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Content (optional)
              </label>
              <textarea
                value={generateForm.content}
                onChange={(e) =>
                  setGenerateForm({ ...generateForm, content: e.target.value })
                }
                placeholder="Paste notes, articles, or additional context here"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={generateForm.difficulty}
                onChange={(e) =>
                  setGenerateForm({
                    ...generateForm,
                    difficulty: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <Input
              label="Number of Cards"
              type="number"
              min="1"
              max="50"
              value={generateForm.cardCount}
              onChange={(e) =>
                setGenerateForm({
                  ...generateForm,
                  cardCount: parseInt(e.target.value),
                })
              }
              required
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGenerateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isGenerating}>
                Generate Cards
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
