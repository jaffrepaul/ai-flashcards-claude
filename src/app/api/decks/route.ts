import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/server-utils';
import {
  handleApiError,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api-utils';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isPublic = searchParams.get('public') === 'true';

    let query = supabase
      .from('decks')
      .select(
        `
        *,
        cards(count)
      `
      )
      .order('updated_at', { ascending: false });

    if (isPublic) {
      query = query.eq('is_public', true);
    } else if (userId) {
      query = query.eq('user_id', userId);
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
      cards: undefined, // Remove the nested cards object
    }));

    return createSuccessResponse({ decks: transformedDecks });
  } catch (error) {
    return handleApiError(error, 'GET /api/decks');
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseServer = createSupabaseServerClient(request);

    // Debug: Log the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');

    // Try to get the current user by making a simple query that requires authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser();

    console.log('Auth result:', { user: !!user, authError });

    if (authError || !user) {
      // If direct auth fails, try a different approach - check if we can access user data
      console.log('Direct auth failed, trying alternative approach...');

      // Try to get the user ID from the profiles table (this will work if RLS allows it)
      const { data: profile, error: profileError } = await supabaseServer
        .from('profiles')
        .select('id')
        .limit(1);

      console.log('Profile check result:', { profile, profileError });

      if (profileError || !profile || profile.length === 0) {
        Sentry.captureException(new Error('User not authenticated'), {
          tags: {
            component: 'api/decks',
            operation: 'create_deck',
            type: 'authentication_error',
          },
          extra: {
            authError,
            profileError,
            hasUser: !!user,
            authHeaderPresent: !!authHeader,
          },
        });
        return createErrorResponse('Authentication required', 401);
      }

      // If we can access profile data, we're authenticated
      console.log('Authentication successful via profile check');
    }

    const { title, description, tags, isPublic } = await request.json();

    if (!title) {
      const error = new Error('Missing required field: title');
      Sentry.captureException(error, {
        tags: {
          component: 'api/decks',
          operation: 'create_deck',
          type: 'validation_error',
        },
        extra: {
          requestBody: { title, description, tags, isPublic },
          userId: user?.id,
        },
      });
      return createErrorResponse('Missing required field: title', 400);
    }

    // Use the user ID from the auth result, or get it from the profile if auth.getUser() failed
    const userId =
      user?.id ||
      (await supabaseServer.from('profiles').select('id').limit(1).single())
        ?.data?.id;

    if (!userId) {
      return createErrorResponse('Could not determine user ID', 401);
    }

    const { data: deck, error } = await supabaseServer
      .from('decks')
      .insert({
        title,
        description,
        tags: tags || [],
        is_public: isPublic || false,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating deck:', error);

      const sentryError = new Error(`Database error: ${error.message}`);
      sentryError.name = 'DeckCreationDatabaseError';

      Sentry.captureException(sentryError, {
        tags: {
          component: 'api/decks',
          operation: 'create_deck',
          type: 'database_error',
        },
        extra: {
          supabaseError: error,
          requestBody: { title, description, tags, isPublic },
          userId,
        },
      });

      return createErrorResponse('Failed to create deck', 500);
    }

    return createSuccessResponse({ deck }, 201);
  } catch (error) {
    const sentryError =
      error instanceof Error ? error : new Error(String(error));
    sentryError.name = 'DeckCreationUnexpectedError';

    Sentry.captureException(sentryError, {
      tags: {
        component: 'api/decks',
        operation: 'create_deck',
        type: 'unexpected_error',
      },
      extra: {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      },
    });

    return handleApiError(error, 'POST /api/decks');
  }
}
