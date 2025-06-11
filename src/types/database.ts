export type CardDifficulty = 'easy' | 'medium' | 'hard';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  tags?: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
  cards?: Card[];
  card_count?: number;
}

export interface Card {
  id: string;
  deck_id: string;
  front_content: string;
  back_content: string;
  difficulty: CardDifficulty;
  tags?: string[];
  created_at: string;
  updated_at: string;
}
