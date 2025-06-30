import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase-admin';
import { withAuth, requireAuth } from '@/lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

const FlashcardSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string().describe('The question or prompt for the flashcard'),
      back: z.string().describe('The answer or explanation for the flashcard'),
      difficulty: z
        .enum(['easy', 'medium', 'hard'])
        .describe('The difficulty level of the card'),
      tags: z
        .array(z.string())
        .optional()
        .describe('Relevant tags for the card'),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return createErrorResponse('OpenAI API key not configured', 500);
    }

    const { topic, content, difficulty, cardCount, deckId } =
      await request.json();

    if (!topic || !cardCount || !deckId) {
      return createErrorResponse(
        'Missing required fields: topic, cardCount, deckId',
        400
      );
    }

    const authenticatedRequest = await withAuth(request);
    const user = requireAuth(authenticatedRequest);

    // Verify deck ownership
    const { data: deck, error: deckError } = await supabaseServer
      .from('decks')
      .select('user_id')
      .eq('id', deckId)
      .eq('user_id', user.id)
      .single();

    if (deckError || !deck) {
      return createErrorResponse('Deck not found', 404);
    }

    const prompt = `Generate ${cardCount} flashcards about "${topic}".
${content ? `Additional context: ${content}` : ''}

Create high-quality flashcards that:
- Have clear, concise questions on the front
- Provide accurate, helpful answers on the back
- Are appropriate for ${difficulty} difficulty level
- Include relevant tags for categorization
- Avoid yes/no questions
- Focus on understanding and recall

Make the questions engaging and educational.`;

    const { object } = await generateObject({
      model: openai('gpt-4'),
      schema: FlashcardSchema,
      prompt,
    });

    // Insert cards into database
    const cardsToInsert = object.cards.map(card => ({
      deck_id: deckId,
      front_content: card.front,
      back_content: card.back,
      difficulty: card.difficulty,
      tags: card.tags || [],
    }));

    const { data: insertedCards, error: insertError } = await supabaseServer
      .from('cards')
      .insert(cardsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting cards:', insertError);
      return createErrorResponse('Failed to save generated cards', 500);
    }

    return createSuccessResponse({
      success: true,
      cards: insertedCards,
      count: insertedCards.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse('Authentication required', 401);
    }

    console.error('Error generating flashcards:', error);
    return createErrorResponse('Failed to generate flashcards', 500);
  }
}
