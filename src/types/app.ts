// Types for application-specific interfaces

export interface FlashcardGenerationRequest {
  topic: string;
  content?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cardCount: number;
  tags?: string[];
}

export interface FlashcardGenerationResponse {
  cards: {
    front: string;
    back: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags?: string[];
  }[];
}

export interface QuizResults {
  totalCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number;
  cardResults: Array<{
    cardId: string;
    isCorrect: boolean;
    timeSpent: number;
  }>;
}
