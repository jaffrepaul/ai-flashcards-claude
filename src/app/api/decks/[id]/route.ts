import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';
import { withAuth, requireAuth } from '@/lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authenticatedRequest = await withAuth(request);
    const user = requireAuth(authenticatedRequest);

    const { data: deck, error } = await supabaseServer
      .from('decks')
      .select('*, cards(*)')
      .eq('id', params.id)
      .eq('user_id', user.id)
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
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse('Authentication required', 401);
    }
    console.error('Error in GET /api/decks/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authenticatedRequest = await withAuth(request);
    const user = requireAuth(authenticatedRequest);
    const { title, description, tags, isPublic } = await request.json();

    if (!title) {
      return createErrorResponse('Title is required', 400);
    }

    // Verify ownership
    const { data: existingDeck, error: fetchError } = await supabaseServer
      .from('decks')
      .select('user_id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingDeck) {
      return createErrorResponse('Deck not found', 404);
    }

    const { data: deck, error } = await supabaseServer
      .from('decks')
      .update({
        title,
        description,
        tags: tags || [],
        is_public: isPublic || false,
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating deck:', error);
      return createErrorResponse('Failed to update deck', 500);
    }

    return createSuccessResponse({ deck });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse('Authentication required', 401);
    }
    console.error('Error in PUT /api/decks/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authenticatedRequest = await withAuth(request);
    const user = requireAuth(authenticatedRequest);

    // First, delete all cards in the deck
    const { error: cardsDeleteError } = await supabaseServer
      .from('cards')
      .delete()
      .eq('deck_id', params.id);

    if (cardsDeleteError) {
      console.error('Error deleting cards:', cardsDeleteError);
      return createErrorResponse('Failed to delete deck cards', 500);
    }

    // Then delete the deck
    const { error: deckDeleteError } = await supabaseServer
      .from('decks')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (deckDeleteError) {
      console.error('Error deleting deck:', deckDeleteError);
      return createErrorResponse('Failed to delete deck', 500);
    }

    return createSuccessResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse('Authentication required', 401);
    }
    console.error('Error in DELETE /api/decks/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
