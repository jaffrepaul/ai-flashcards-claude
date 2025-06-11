import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  handleApiError,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deckId');

    if (!deckId) {
      return createErrorResponse('deckId is required', 400);
    }

    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching cards:', error);
      return createErrorResponse('Failed to fetch cards', 500);
    }

    return createSuccessResponse({ cards });
  } catch (error) {
    return handleApiError(error, 'GET /api/cards');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { deckId, frontContent, backContent, difficulty, tags } =
      await request.json();

    if (!deckId || !frontContent || !backContent) {
      return createErrorResponse(
        'Missing required fields: deckId, frontContent, backContent',
        400
      );
    }

    // Verify deck exists and user has access
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('id')
      .eq('id', deckId)
      .single();

    if (deckError || !deck) {
      return createErrorResponse('Deck not found', 404);
    }

    const { data: card, error } = await supabase
      .from('cards')
      .insert({
        deck_id: deckId,
        front_content: frontContent,
        back_content: backContent,
        difficulty: difficulty || 'medium',
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating card:', error);
      return createErrorResponse('Failed to create card', 500);
    }

    return createSuccessResponse({ card }, 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/cards');
  }
}
