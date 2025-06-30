import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseServer } from '@/lib/supabase-admin';
import { withAuth, requireAuth } from '@/lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';

    const authenticatedRequest = await withAuth(request);
    const user = requireAuth(authenticatedRequest);

    let query = supabaseServer
      .from('decks')
      .select('*, cards(count)')
      .order('updated_at', { ascending: false });

    if (isPublic) {
      query = query.eq('is_public', true);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data: decks, error } = await query;

    if (error) {
      console.error('Error fetching decks:', error);
      return createErrorResponse('Failed to fetch decks', 500);
    }

    // Transform the data to include card count
    const transformedDecks = decks?.map(deck => ({
      ...deck,
      card_count: deck.cards?.[0]?.count || 0,
      cards: undefined,
    }));

    return createSuccessResponse({ decks: transformedDecks });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse('Authentication required', 401);
    }
    console.error('Error in GET /api/decks:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticatedRequest = await withAuth(request);
    const user = requireAuth(authenticatedRequest);

    const { title, description, tags, isPublic } = await request.json();

    if (!title) {
      return createErrorResponse('Missing required field: title', 400);
    }

    const { data: deck, error } = await supabaseServer
      .from('decks')
      .insert({
        title,
        description,
        tags: tags || [],
        is_public: isPublic || false,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating deck:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2),
      });

      // Explicitly capture the error with Sentry
      Sentry.captureException(error, {
        tags: {
          route: 'POST /api/decks',
          operation: 'create_deck',
          error_type: 'database_error',
        },
        extra: {
          user_id: user.id,
          deck_data: { title, description, tags, isPublic },
          supabase_error: error,
          table_name: 'deck',
          error_message: error.message,
          error_code: error.code,
          error_details: error.details,
          error_hint: error.hint,
        },
      });

      return createErrorResponse('Failed to create deck', 500);
    }

    return createSuccessResponse({ deck }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse('Authentication required', 401);
    }
    console.error('Error in POST /api/decks:', error);

    // Explicitly capture any other errors with Sentry
    Sentry.captureException(error, {
      tags: {
        route: 'POST /api/decks',
        error_type: 'unexpected_error',
      },
      extra: {
        error_message: error instanceof Error ? error.message : 'Unknown error',
        user_id: 'unknown',
      },
    });

    return createErrorResponse('Internal server error', 500);
  }
}
