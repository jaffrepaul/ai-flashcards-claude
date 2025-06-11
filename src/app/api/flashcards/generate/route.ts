import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

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
    const { topic, content, difficulty, cardCount, deckId } =
      await request.json();

    if (!topic || !cardCount || !deckId) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, cardCount, deckId' },
        { status: 400 }
      );
    }

    // Verify deck ownership
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('user_id')
      .eq('id', deckId)
      .single();

    if (deckError || !deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
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
    const cardsToInsert = object.cards.map((card) => ({
      deck_id: deckId,
      front_content: card.front,
      back_content: card.back,
      difficulty: card.difficulty,
      tags: card.tags || [],
    }));

    const { data: insertedCards, error: insertError } = await supabase
      .from('cards')
      .insert(cardsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting cards:', insertError);
      return NextResponse.json(
        { error: 'Failed to save generated cards' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cards: insertedCards,
      count: insertedCards.length,
    });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return NextResponse.json(
      { error: 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
}
