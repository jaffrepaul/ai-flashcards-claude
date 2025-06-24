'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Deck } from '@/types/database';
import * as Sentry from '@sentry/nextjs';

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckCreated: (deck: Deck) => void;
}

export function CreateDeckModal({
  isOpen,
  onClose,
  onDeckCreated,
}: CreateDeckModalProps) {
  const [newDeck, setNewDeck] = useState({
    title: '',
    description: '',
    tags: '',
    isPublic: false,
  });

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();

    // Test Sentry capture
    Sentry.captureMessage(
      'Testing Sentry capture from CreateDeckModal',
      'info'
    );

    if (!newDeck.title.trim()) return;

    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newDeck.title,
          description: newDeck.description,
          tags: newDeck.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          isPublic: newDeck.isPublic,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorData = null;

        try {
          errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }

        // Create a more detailed error for Sentry
        const error = new Error(errorMessage);
        error.name = 'DeckCreationError';

        Sentry.captureException(error, {
          tags: {
            component: 'CreateDeckModal',
            operation: 'create_deck',
            status: response.status.toString(),
            endpoint: '/api/decks',
          },
          extra: {
            status: response.status,
            statusText: response.statusText,
            deckData: newDeck,
            url: '/api/decks',
            errorData,
            responseHeaders: Object.fromEntries(response.headers.entries()),
          },
          level: 'error',
        });

        alert(`Failed to create deck: ${errorMessage}`);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        onDeckCreated(data.deck);
        onClose();
        setNewDeck({ title: '', description: '', tags: '', isPublic: false });
      }
    } catch (error) {
      // Ensure error is properly captured with context
      const sentryError =
        error instanceof Error ? error : new Error(String(error));
      sentryError.name = 'DeckCreationNetworkError';

      Sentry.captureException(sentryError, {
        tags: {
          component: 'CreateDeckModal',
          operation: 'create_deck',
          type: 'network_error',
        },
        extra: {
          deckData: newDeck,
          url: '/api/decks',
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        },
        level: 'error',
      });

      console.error('Error creating deck:', error);
      alert(
        'Failed to create deck. Please check your connection and try again.'
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Deck"
      className="max-w-lg"
    >
      <form onSubmit={handleCreateDeck} className="space-y-4">
        <Input
          label="Deck Title"
          value={newDeck.title}
          onChange={(e) => setNewDeck({ ...newDeck, title: e.target.value })}
          placeholder="Enter a title for your deck"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            value={newDeck.description}
            onChange={(e) =>
              setNewDeck({ ...newDeck, description: e.target.value })
            }
            placeholder="Describe what this deck is about"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        <Input
          label="Tags (optional)"
          value={newDeck.tags}
          onChange={(e) => setNewDeck({ ...newDeck, tags: e.target.value })}
          placeholder="math, science, history (comma separated)"
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={newDeck.isPublic}
            onChange={(e) =>
              setNewDeck({ ...newDeck, isPublic: e.target.checked })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
            Make this deck public (others can view and copy it)
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create Deck</Button>
        </div>

        {/* Test button for Sentry - remove in production */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              Sentry.captureException(
                new Error('Test error from CreateDeckModal'),
                {
                  tags: {
                    component: 'CreateDeckModal',
                    operation: 'test_error',
                    type: 'manual_test',
                  },
                  extra: {
                    testData:
                      'This is a test error to verify Sentry is working',
                  },
                }
              );
              alert('Test error sent to Sentry! Check your Sentry dashboard.');
            }}
            className="text-xs"
          >
            Test Sentry Error
          </Button>
        </div>
      </form>
    </Modal>
  );
}
