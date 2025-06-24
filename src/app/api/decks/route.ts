import { NextRequest } from 'next/server';
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
      return createErrorResponse('Failed to create deck', 500);
    }

    return createSuccessResponse({ deck }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse('Authentication required', 401);
    }
    console.error('Error in POST /api/decks:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
