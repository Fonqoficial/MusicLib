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