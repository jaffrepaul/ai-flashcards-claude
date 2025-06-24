import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';
import { withAuth, requireAuth } from '@/lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authenticatedRequest = await withAuth(request);
    const user = requireAuth(authenticatedRequest);

    // Verify card ownership through deck
    const { data: card, error: cardError } = await supabaseServer
      .from('cards')
      .select(
        `
        id,
        deck_id,
        decks!inner(user_id)
      `
      )
      .eq('id', params.id)
      .eq('decks.user_id', user.id)
      .single();

    if (cardError || !card) {
      return createErrorResponse('Card not found or access denied', 404);
    }

    // Delete the card
    const { error: deleteError } = await supabaseServer
      .from('cards')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting card:', deleteError);
      return createErrorResponse('Failed to delete card', 500);
    }

    return createSuccessResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse('Authentication required', 401);
    }
    console.error('Error in DELETE /api/cards/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
