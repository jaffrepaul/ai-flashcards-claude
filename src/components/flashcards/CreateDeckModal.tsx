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
  userId: string;
}

export function CreateDeckModal({
  isOpen,
  onClose,
  onDeckCreated,
  userId,
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
    Sentry.captureMessage('Testing Sentry capture from CreateDeckModal', 'info');

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
          userId,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }

        Sentry.captureException(new Error(errorMessage), {
          tags: {
            component: 'CreateDeckModal',
            operation: 'create_deck',
            status: response.status.toString()
          },
          extra: {
            status: response.status,
            statusText: response.statusText,
            deckData: newDeck,
            userId,
            url: '/api/decks'
          }
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
      Sentry.captureException(error, {
        tags: {
          component: 'CreateDeckModal',
          operation: 'create_deck',
          type: 'network_error'
        },
        extra: {
          deckData: newDeck,
          userId,
          url: '/api/decks'
        }
      });

      console.error('Error creating deck:', error);
      alert('Failed to create deck. Please check your connection and try again.');
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
      </form>
    </Modal>
  );
}
