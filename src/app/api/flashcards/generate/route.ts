import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase-admin';
import { withAuth, requireAuth } from '@/lib/auth-middleware';

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
    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY environment variable');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { topic, content, difficulty, cardCount, deckId } =
      await request.json();

    console.log('Generate cards request:', {
      topic,
      content,
      difficulty,
      cardCount,
      deckId,
    });

    if (!topic || !cardCount || !deckId) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, cardCount, deckId' },
        { status: 400 }
      );
    }

    const authenticatedRequest = await withAuth(request);
    const user = requireAuth(authenticatedRequest);

    console.log('User authenticated:', user.id);

    // Verify deck ownership
    const { data: deck, error: deckError } = await supabaseServer
      .from('decks')
      .select('user_id')
      .eq('id', deckId)
      .eq('user_id', user.id)
      .single();

    if (deckError || !deck) {
      console.error('Deck not found or access denied:', {
        deckError,
        deckId,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    console.log('Deck verified, generating cards...');

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

    console.log('Calling OpenAI API...');

    const { object } = await generateObject({
      model: openai('gpt-4'),
      schema: FlashcardSchema,
      prompt,
    });

    console.log(
      'OpenAI response received, cards generated:',
      object.cards.length
    );

    // Insert cards into database
    const cardsToInsert = object.cards.map(card => ({
      deck_id: deckId,
      front_content: card.front,
      back_content: card.back,
      difficulty: card.difficulty,
      tags: card.tags || [],
    }));

    console.log('Inserting cards into database...');

    const { data: insertedCards, error: insertError } = await supabaseServer
      .from('cards')
      .insert(cardsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting cards:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to save generated cards',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    console.log('Cards inserted successfully:', insertedCards.length);

    return NextResponse.json({
      success: true,
      cards: insertedCards,
      count: insertedCards.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Error generating flashcards:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );

    return NextResponse.json(
      {
        error: 'Failed to generate flashcards',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
