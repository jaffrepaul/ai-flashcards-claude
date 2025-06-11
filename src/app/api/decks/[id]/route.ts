import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  handleApiError,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { data: deck, error } = await supabase
      .from('decks')
      .select(
        `
        *,
        cards(*)
      `
      )
      .eq('id', params.id)
      .single();

    if (error || !deck) {
      return createErrorResponse('Deck not found', 404);
    }

    // Add card count
    const deckWithCount = {
      ...deck,
      card_count: deck.cards?.length || 0,
    };

    return createSuccessResponse({ deck: deckWithCount });
  } catch (error) {
    return handleApiError(error, 'GET /api/decks/[id]');
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { title, description, tags, isPublic, userId } = await request.json();

    if (!title) {
      return createErrorResponse('Title is required', 400);
    }

    // Verify ownership
    const { data: existingDeck, error: fetchError } = await supabase
      .from('decks')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingDeck) {
      return createErrorResponse('Deck not found', 404);
    }

    if (existingDeck.user_id !== userId) {
      return createErrorResponse('Unauthorized', 403);
    }

    const { data: deck, error } = await supabase
      .from('decks')
      .update({
        title,
        description,
        tags: tags || [],
        is_public: isPublic || false,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating deck:', error);
      return createErrorResponse('Failed to update deck', 500);
    }

    return createSuccessResponse({ deck });
  } catch (error) {
    return handleApiError(error, 'PUT /api/decks/[id]');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return createErrorResponse('userId is required', 400);
    }

    // Verify ownership
    const { data: existingDeck, error: fetchError } = await supabase
      .from('decks')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingDeck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    if (existingDeck.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase.from('decks').delete().eq('id', params.id);

    if (error) {
      console.error('Error deleting deck:', error);
      return createErrorResponse('Failed to delete deck', 500);
    }

    return createSuccessResponse({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/decks/[id]');
  }
}
