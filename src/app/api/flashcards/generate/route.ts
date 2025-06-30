import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
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

// Tool for validating topic complexity and providing suggestions
const validateTopicComplexity = {
  parameters: z.object({
    topic: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  }),
  description:
    'Validate topic complexity and get approval to proceed with flashcard generation',
  execute: async ({
    topic,
    difficulty,
  }: {
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }) => {
    console.log('🔧 validateTopicComplexity called with:', {
      topic,
      difficulty,
    });

    const complexityMap: Record<string, string[]> = {
      easy: ['basic', 'fundamental', 'introductory', 'beginner', 'simple'],
      medium: ['intermediate', 'advanced', 'complex', 'moderate'],
      hard: ['expert', 'specialized', 'advanced', 'professional', 'master'],
    };

    const isAppropriate = complexityMap[difficulty].some(level =>
      topic.toLowerCase().includes(level)
    );

    const result = {
      isAppropriate,
      suggestion: isAppropriate
        ? 'Topic is appropriate for the selected difficulty level'
        : `Consider adjusting difficulty level for "${topic}" - current level may be too ${difficulty === 'easy' ? 'basic' : difficulty === 'medium' ? 'intermediate' : 'advanced'}`,
      canProceed: isAppropriate,
      validationId: `val_${Date.now()}`,
      requiredNextStep: isAppropriate
        ? 'getGenerationContext'
        : 'adjustDifficulty',
    };

    console.log('🔧 validateTopicComplexity result:', result);
    return result;
  },
};

// Tool for getting current context (timestamp, user info)
const getGenerationContext = {
  parameters: z.object({
    validationId: z.string(),
  }),
  description:
    'Get generation timestamp and context. Requires validationId from validateTopicComplexity.',
  execute: async ({ validationId }: { validationId: string }) => {
    console.log(
      '🔧 getGenerationContext called with validationId:',
      validationId
    );

    const result = {
      timestamp: new Date().toISOString(),
      timezone: 'UTC',
      context: 'flashcard-generation',
      sessionId: Math.random().toString(36).substring(7),
      validationId,
      requiredNextStep: 'suggestTags',
    };

    console.log('🔧 getGenerationContext result:', result);
    return result;
  },
};

// Tool for suggesting relevant tags based on topic
const suggestTags = {
  parameters: z.object({
    topic: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    sessionId: z.string(),
  }),
  description:
    'Get suggested tags for the topic. Requires sessionId from getGenerationContext.',
  execute: async ({
    topic,
    difficulty,
    sessionId,
  }: {
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    sessionId: string;
  }) => {
    console.log('🔧 suggestTags called with:', {
      topic,
      difficulty,
      sessionId,
    });

    const commonTags: Record<string, string[]> = {
      easy: ['beginner', 'basics', 'fundamentals'],
      medium: ['intermediate', 'advanced-concepts'],
      hard: ['expert', 'specialized', 'advanced'],
    };

    // Extract potential tags from topic
    const topicWords = topic.toLowerCase().split(/\s+/);
    const suggestedTags = [
      ...commonTags[difficulty],
      ...topicWords.slice(0, 3),
    ];

    const result = {
      suggestedTags: suggestedTags.filter(tag => tag.length > 2),
      topicAnalysis: `Topic "${topic}" analyzed for ${difficulty} level`,
      analysisComplete: true,
      summary: `Analysis complete: ${topic} at ${difficulty} level with ${suggestedTags.filter(tag => tag.length > 2).length} suggested tags`,
      sessionId,
      readyForGeneration: true,
    };

    console.log('🔧 suggestTags result:', result);
    return result;
  },
};

// Create tools object for AI SDK
const tools = {
  validateTopicComplexity,
  getGenerationContext,
  suggestTags,
};

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

    // First, make a tool call for monitoring purposes
    console.log(
      'Starting tool analysis for topic:',
      topic,
      'difficulty:',
      difficulty
    );

    const toolResult = await generateText({
      model: openai('gpt-4'),
      prompt: `You are analyzing the topic "${topic}" for ${difficulty} level flashcard generation. 

To provide a complete analysis, you need to call three tools in sequence:

1. First, call validateTopicComplexity with topic: "${topic}" and difficulty: "${difficulty}" to check if this topic is appropriate and get a validationId
2. Then, call getGenerationContext with the validationId from step 1 to get the generation timestamp and sessionId
3. Finally, call suggestTags with topic: "${topic}", difficulty: "${difficulty}", and the sessionId from step 2 to get relevant tags

Each tool provides essential information that you need to include in your final analysis. You must call all three tools in the correct sequence to complete your task.

After calling all tools, provide a comprehensive analysis including:
- Whether the topic is appropriate for the difficulty level
- The generation timestamp and session details
- Suggested tags for categorization
- Your final recommendation for flashcard generation

Call all three tools in sequence and then provide your complete analysis.`,
      tools,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'flashcard-analysis-tools',
      },
    });

    console.log(
      'Tool analysis completed. Result length:',
      toolResult.text.length
    );
    console.log(
      'Tool analysis result:',
      toolResult.text.substring(0, 200) + '...'
    );

    // Fallback: manually call tools if AI didn't call them
    console.log('Checking if all tools were called...');

    let manualValidationResult = null;
    let manualContextResult = null;
    let manualTagsResult = null;

    // Check if validateTopicComplexity was called
    if (
      !toolResult.toolResults?.some(
        result => result.toolName === 'validateTopicComplexity'
      )
    ) {
      console.log('🔧 Manual validateTopicComplexity call');
      manualValidationResult = await validateTopicComplexity.execute({
        topic,
        difficulty,
      });
      console.log(
        '🔧 Manual validateTopicComplexity call result:',
        manualValidationResult
      );
    }

    // Check if getGenerationContext was called
    if (
      !toolResult.toolResults?.some(
        result => result.toolName === 'getGenerationContext'
      )
    ) {
      console.log('🔧 Manual getGenerationContext call');
      const validationId =
        manualValidationResult?.validationId || `manual_${Date.now()}`;
      manualContextResult = await getGenerationContext.execute({
        validationId,
      });
      console.log(
        '🔧 Manual getGenerationContext call result:',
        manualContextResult
      );
    }

    // Check if suggestTags was called
    if (
      !toolResult.toolResults?.some(result => result.toolName === 'suggestTags')
    ) {
      console.log('🔧 Manual suggestTags call');
      const sessionId =
        manualContextResult?.sessionId || `manual_${Date.now()}`;
      manualTagsResult = await suggestTags.execute({
        topic,
        difficulty,
        sessionId,
      });
      console.log('🔧 Manual suggestTags call result:', manualTagsResult);
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
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'flashcard-generation',
      },
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
