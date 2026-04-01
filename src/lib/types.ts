export interface Database {
  public: {
    Tables: {
      composers: {
        Row: Composer;
        Insert: Omit<Composer, 'id' | 'created_at'>;
        Update: Partial<Omit<Composer, 'id' | 'created_at'>>;
      };
      scores: {
        Row: Score;
        Insert: Omit<Score, 'id' | 'created_at' | 'updated_at' | 'views' | 'downloads'>;
        Update: Partial<Omit<Score, 'id' | 'created_at'>>;
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'user';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role?: 'admin' | 'user';
        };
        Update: {
          role?: 'admin' | 'user';
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
        };
      };
    };
  };
}

export interface Composer {
  id: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  nationality: string | null;
  bio: string | null;
  created_at: string;
}

export interface Score {
  id: string;
  title: string;
  composer_id: string;
  instrument: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  genre: string | null;
  year_composed: number | null;
  duration_minutes: number | null;
  pdf_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
  views: number;
  downloads: number;
  created_at: string;
  updated_at: string;
}

export interface ScoreWithComposer extends Score {
  composer: Composer;
}