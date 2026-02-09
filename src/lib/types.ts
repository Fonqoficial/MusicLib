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
      tags: {
        Row: Tag
        Insert: Omit<Tag, 'id'>
        Update: Partial<Omit<Tag, 'id'>>
      }
      score_tags: {
        Row: ScoreTag
        Insert: ScoreTag
        Update: Partial<ScoreTag>
      }
      user_roles: {
        Row: UserRole
        Insert: Omit<UserRole, 'created_at'>
        Update: Partial<Omit<UserRole, 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export interface Composer {
  id: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  nationality: string | null;
  bio: string | null;
  imagen_url: string | null;
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

export interface Tag {
  id: string
  name: string
}

export interface ScoreTag {
  score_id: string
  tag_id: string
}

export interface UserRole {
  user_id: string
  role: string // 'admin' | 'user' | etc.
  created_at: string
}