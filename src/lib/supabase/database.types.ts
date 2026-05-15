/**
 * Hand-authored shape of the Supabase schema until you wire up
 *   `supabase gen types typescript --linked > src/lib/supabase/database.types.ts`
 * which will overwrite this file with the canonical version.
 *
 * Keep this in sync with the SQL in /supabase/migrations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };

      dashboards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          is_default: boolean;
          grid_config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["dashboards"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dashboards"]["Row"]>;
      };

      widget_instances: {
        Row: {
          id: string;
          dashboard_id: string;
          type: string;
          pos_x: number;
          pos_y: number;
          width: number;
          height: number;
          config: Json;
          z_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["widget_instances"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["widget_instances"]["Row"]>;
      };

      tasks: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          completed: boolean;
          priority: number;
          due_at: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tasks"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
      };

      notes: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          color_index: number;
          pos_x: number;
          pos_y: number;
          pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notes"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Row"]>;
      };

      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          url: string;
          icon: string | null;
          group_name: string | null;
          position: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bookmarks"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookmarks"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
