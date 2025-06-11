# AI FlashCards - Smart Learning with AI

An AI-powered flashcards application built with Next.js, TypeScript, Supabase, and OpenAI/Anthropic APIs. Features intelligent flashcard generation, spaced repetition learning, and comprehensive progress tracking.

## Features

- 🤖 **AI-Generated Flashcards**: Transform any topic into comprehensive flashcards using advanced AI
- 📚 **Spaced Repetition**: Scientifically-proven learning algorithm (SM-2) for optimal retention
- 🔄 **Progress Tracking**: Detailed analytics and insights into study patterns
- 👤 **User Authentication**: Secure login with Supabase Auth (email/password and OAuth)
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔍 **Interactive Study Sessions**: Engaging quiz mode with performance feedback

## Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Query** - Server state management with devtools

### Backend

- **Supabase** - PostgreSQL database with real-time features
- **Next.js API Routes** - Server-side API endpoints
- **Row Level Security (RLS)** - Database-level authorization

### AI Integration

- **OpenAI GPT-4** - Flashcard generation
- **Anthropic Claude** - Alternative AI provider
- **AI SDK** - Unified AI interface with schema validation

### Development Tools

- **ESLint + Prettier** - Code formatting and linting
- **Husky + lint-staged** - Git hooks for code quality
- **TypeScript** - Static type checking

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── flashcards/    # AI flashcard generation
│   │   ├── decks/         # Deck CRUD operations
│   │   └── cards/         # Card CRUD operations
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── deck/[id]/         # Deck detail pages
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── flashcards/        # Flashcard-specific components
│   ├── layout/            # Layout components
│   ├── providers/         # Context providers
│   └── ui/                # Reusable UI components
├── contexts/              # React Context definitions
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── spacedRepetition.ts # SM-2 algorithm implementation
│   ├── supabase.ts        # Supabase client configuration
│   └── utils.ts           # General utilities
└── types/                 # TypeScript type definitions
```

## Database Schema

### Core Tables

- **profiles** - User profile information
- **decks** - Flashcard deck collections
- **cards** - Individual flashcards
- **study_sessions** - Learning session tracking
- **card_reviews** - Spaced repetition data

### Key Features

- Row Level Security (RLS) for data protection
- Automatic user profile creation on signup
- Optimized queries with proper indexing
- Real-time subscriptions support

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI or Anthropic API key

### Installation

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd ai-flashcards-claude
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your environment variables:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AI API Keys
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

3. **Set up the database**

   ```bash
   # Run the SQL schema in your Supabase dashboard
   # File: database/schema.sql
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## Usage

### Creating Your First Deck

1. **Sign up** for a new account or **sign in** to an existing one
2. Navigate to the **Dashboard**
3. Click **"Create New Deck"**
4. Fill in deck details (title, description, tags)
5. Click **"Create Deck"**

### Generating AI Flashcards

1. Open a deck from your dashboard
2. Click **"Generate Cards"**
3. Enter a topic (e.g., "Spanish vocabulary", "JavaScript concepts")
4. Optionally add additional content or notes
5. Select difficulty level and number of cards
6. Click **"Generate Cards"**

### Studying with Spaced Repetition

1. Open a deck with cards
2. Click **"Start Studying"**
3. Review each flashcard and mark correct/incorrect
4. Complete the session to see your performance metrics
5. Return daily for optimal spaced repetition learning

## API Endpoints

### Flashcard Generation

- `POST /api/flashcards/generate` - Generate AI flashcards for a deck

### Deck Management

- `GET /api/decks` - Get user's decks
- `POST /api/decks` - Create a new deck
- `GET /api/decks/[id]` - Get deck details with cards
- `PUT /api/decks/[id]` - Update deck information
- `DELETE /api/decks/[id]` - Delete a deck

### Card Management

- `GET /api/cards` - Get cards for a deck
- `POST /api/cards` - Create a new card manually

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript compiler
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Environment Setup

- Configure Supabase production database
- Set up authentication providers (Google OAuth)
- Configure proper CORS settings
- Set up monitoring and error tracking

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- SM-2 spaced repetition algorithm by SuperMemo
- OpenAI and Anthropic for AI capabilities
- Supabase for backend infrastructure
- Next.js and Vercel for the development platform
