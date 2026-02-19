/**
 * Database Schema Types for Football Fusion MVP
 * Using Supabase as the backend
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          wallet_address: string
          username: string
          email: string | null
          avatar_url: string | null
          favorite_team: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          wallet_address: string
          username: string
          email?: string | null
          avatar_url?: string | null
          favorite_team?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          username?: string
          email?: string | null
          avatar_url?: string | null
          favorite_team?: string | null
          updated_at?: string
        }
      }

      teams: {
        Row: {
          id: string
          user_id: string
          name: string
          formation: string
          total_value: number
          bank: number
          free_transfers: number
          total_points: number
          gameweek_points: number
          overall_rank: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          formation?: string
          total_value?: number
          bank?: number
          free_transfers?: number
          total_points?: number
          gameweek_points?: number
          overall_rank?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          formation?: string
          total_value?: number
          bank?: number
          free_transfers?: number
          total_points?: number
          gameweek_points?: number
          overall_rank?: number | null
          updated_at?: string
        }
      }

      team_players: {
        Row: {
          id: string
          team_id: string
          player_id: string
          position: 'GK' | 'DEF' | 'MID' | 'FWD'
          is_captain: boolean
          is_vice_captain: boolean
          is_benched: boolean
          bench_order: number | null
          purchase_price: number
          current_price: number
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          player_id: string
          position: 'GK' | 'DEF' | 'MID' | 'FWD'
          is_captain?: boolean
          is_vice_captain?: boolean
          is_benched?: boolean
          bench_order?: number | null
          purchase_price: number
          current_price: number
          created_at?: string
        }
        Update: {
          is_captain?: boolean
          is_vice_captain?: boolean
          is_benched?: boolean
          bench_order?: number | null
          current_price?: number
        }
      }

      tournaments: {
        Row: {
          id: string
          name: string
          description: string | null
          entry_fee: number
          prize_pool: number
          max_participants: number
          current_participants: number
          league_id: number
          status: 'upcoming' | 'live' | 'completed'
          start_date: string
          end_date: string
          gameweek_start: number
          gameweek_end: number
          created_by: string
          contract_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          entry_fee: number
          prize_pool?: number
          max_participants: number
          current_participants?: number
          league_id: number
          status?: 'upcoming' | 'live' | 'completed'
          start_date: string
          end_date: string
          gameweek_start: number
          gameweek_end: number
          created_by: string
          contract_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          current_participants?: number
          prize_pool?: number
          status?: 'upcoming' | 'live' | 'completed'
          updated_at?: string
        }
      }

      tournament_participants: {
        Row: {
          id: string
          tournament_id: string
          user_id: string
          team_id: string
          entry_paid: boolean
          total_points: number
          current_rank: number | null
          prize_won: number
          transaction_hash: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          user_id: string
          team_id: string
          entry_paid?: boolean
          total_points?: number
          current_rank?: number | null
          prize_won?: number
          transaction_hash?: string | null
          joined_at?: string
        }
        Update: {
          total_points?: number
          current_rank?: number | null
          prize_won?: number
          entry_paid?: boolean
        }
      }

      gameweeks: {
        Row: {
          id: number
          league_id: number
          name: string
          deadline: string
          is_finished: boolean
          is_current: boolean
          average_score: number | null
          highest_score: number | null
          created_at: string
        }
        Insert: {
          id: number
          league_id: number
          name: string
          deadline: string
          is_finished?: boolean
          is_current?: boolean
          average_score?: number | null
          highest_score?: number | null
          created_at?: string
        }
        Update: {
          is_finished?: boolean
          is_current?: boolean
          average_score?: number | null
          highest_score?: number | null
        }
      }

      player_gameweek_stats: {
        Row: {
          id: string
          player_id: string
          gameweek_id: number
          minutes: number
          goals: number
          assists: number
          clean_sheets: number
          goals_conceded: number
          own_goals: number
          penalties_saved: number
          penalties_missed: number
          yellow_cards: number
          red_cards: number
          saves: number
          bonus: number
          bps: number
          total_points: number
          selected_by_percent: number
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          gameweek_id: number
          minutes?: number
          goals?: number
          assists?: number
          clean_sheets?: number
          goals_conceded?: number
          own_goals?: number
          penalties_saved?: number
          penalties_missed?: number
          yellow_cards?: number
          red_cards?: number
          saves?: number
          bonus?: number
          bps?: number
          total_points?: number
          selected_by_percent?: number
          created_at?: string
        }
        Update: {
          minutes?: number
          goals?: number
          assists?: number
          total_points?: number
          bonus?: number
          bps?: number
        }
      }

      transfers: {
        Row: {
          id: string
          team_id: string
          gameweek_id: number
          player_in: string
          player_out: string
          transfer_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          gameweek_id: number
          player_in: string
          player_out: string
          transfer_cost?: number
          created_at?: string
        }
        Update: {}
      }

      chips: {
        Row: {
          id: string
          team_id: string
          gameweek_id: number
          chip_type: 'bench_boost' | 'triple_captain' | 'free_hit' | 'wildcard'
          used_at: string
        }
        Insert: {
          id?: string
          team_id: string
          gameweek_id: number
          chip_type: 'bench_boost' | 'triple_captain' | 'free_hit' | 'wildcard'
          used_at?: string
        }
        Update: {}
      }

      trivia_questions: {
        Row: {
          id: string
          question: string
          correct_answer: string
          incorrect_answers: string[]
          category: string
          difficulty: string
          times_served: number
          created_at: string
        }
        Insert: {
          id?: string
          question: string
          correct_answer: string
          incorrect_answers: string[]
          category: string
          difficulty: string
          times_served?: number
          created_at?: string
        }
        Update: {
          times_served?: number
        }
      }

      trivia_attempts: {
        Row: {
          id: string
          wallet_address: string
          score: number
          total_questions: number
          correct_answers: number
          time_taken_seconds: number | null
          category: string | null
          difficulty: string | null
          played_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          score: number
          total_questions?: number
          correct_answers?: number
          time_taken_seconds?: number | null
          category?: string | null
          difficulty?: string | null
          played_at?: string
        }
        Update: {}
      }

      trivia_leaderboard: {
        Row: {
          wallet_address: string
          username: string | null
          total_points: number
          games_played: number
          best_score: number
          total_correct: number
          total_answered: number
          current_streak: number
          updated_at: string
        }
        Insert: {
          wallet_address: string
          username?: string | null
          total_points?: number
          games_played?: number
          best_score?: number
          total_correct?: number
          total_answered?: number
          current_streak?: number
          updated_at?: string
        }
        Update: {
          username?: string | null
          total_points?: number
          games_played?: number
          best_score?: number
          total_correct?: number
          total_answered?: number
          current_streak?: number
          updated_at?: string
        }
      }

      team_gameweek_history: {
        Row: {
          id: string
          team_id: string
          gameweek_id: number
          points: number
          points_on_bench: number
          overall_rank: number | null
          gameweek_rank: number | null
          bank: number
          team_value: number
          transfers_made: number
          transfers_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          gameweek_id: number
          points: number
          points_on_bench?: number
          overall_rank?: number | null
          gameweek_rank?: number | null
          bank: number
          team_value: number
          transfers_made?: number
          transfers_cost?: number
          created_at?: string
        }
        Update: {
          points?: number
          overall_rank?: number | null
          gameweek_rank?: number | null
        }
      }
    }
    Views: {
      global_leaderboard: {
        Row: {
          user_id: string
          username: string
          wallet_address: string
          team_name: string
          total_points: number
          overall_rank: number
          gameweek_points: number
        }
      }
      tournament_leaderboard: {
        Row: {
          tournament_id: string
          user_id: string
          username: string
          team_name: string
          total_points: number
          current_rank: number
        }
      }
    }
    Functions: {
      calculate_team_value: {
        Args: { team_id: string }
        Returns: number
      }
      update_tournament_rankings: {
        Args: { tournament_id: string }
        Returns: void
      }
      auto_substitute_players: {
        Args: { team_id: string; gameweek_id: number }
        Returns: Json
      }
    }
  }
}
