/**
 * Schéma Supabase — régénéré depuis le projet distant le 2026-05-13.
 *
 * Pour régénérer :
 *   supabase gen types typescript --project-id gnspmcqebsjcfjkxjzeb --schema public
 *
 * Les types CUSTOM Speetch (en bas du fichier) sont à PRÉSERVER lors
 * des régénérations futures.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          client_email: string | null;
          content: Json;
          created_at: string;
          full_name: string | null;
          id: string;
          is_owner: boolean;
          is_published: boolean;
          password_hash: string | null;
          password_salt: string | null;
          project_type: string | null;
          slug: string | null;
          subtitle: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          client_email?: string | null;
          content?: Json;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          is_owner?: boolean;
          is_published?: boolean;
          password_hash?: string | null;
          password_salt?: string | null;
          project_type?: string | null;
          slug?: string | null;
          subtitle?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          client_email?: string | null;
          content?: Json;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          is_owner?: boolean;
          is_published?: boolean;
          password_hash?: string | null;
          password_salt?: string | null;
          project_type?: string | null;
          slug?: string | null;
          subtitle?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          content: Json;
          created_at: string;
          delivery_date: string | null;
          id: string;
          is_published: boolean;
          name: string;
          position: number;
          profile_id: string;
          project_type: string | null;
          slug: string;
          subtitle: string | null;
          updated_at: string;
        };
        Insert: {
          content?: Json;
          created_at?: string;
          delivery_date?: string | null;
          id?: string;
          is_published?: boolean;
          name: string;
          position?: number;
          profile_id: string;
          project_type?: string | null;
          slug: string;
          subtitle?: string | null;
          updated_at?: string;
        };
        Update: {
          content?: Json;
          created_at?: string;
          delivery_date?: string | null;
          id?: string;
          is_published?: boolean;
          name?: string;
          position?: number;
          profile_id?: string;
          project_type?: string | null;
          slug?: string;
          subtitle?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          content: Json;
          created_at: string;
          id: string;
          is_published: boolean;
          name: string;
          position: number;
          project_id: string;
          slug: string;
          template_id: string;
          updated_at: string;
        };
        Insert: {
          content?: Json;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          name: string;
          position?: number;
          project_id: string;
          slug: string;
          template_id: string;
          updated_at?: string;
        };
        Update: {
          content?: Json;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          name?: string;
          position?: number;
          project_id?: string;
          slug?: string;
          template_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pages_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      page_templates: {
        Row: {
          created_at: string;
          default_content: Json;
          description: string | null;
          id: string;
          label: string;
          project_type: string | null;
          source_html: string | null;
          tagline: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_content?: Json;
          description?: string | null;
          id?: string;
          label: string;
          project_type?: string | null;
          source_html?: string | null;
          tagline?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_content?: Json;
          description?: string | null;
          id?: string;
          label?: string;
          project_type?: string | null;
          source_html?: string | null;
          tagline?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      client_spaces: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          full_name: string | null;
          id: string | null;
          projects: Json | null;
          slug: string | null;
        };
        Relationships: [];
      };
      client_pages: {
        Row: {
          client_name: string | null;
          client_slug: string | null;
          delivery_date: string | null;
          page_content: Json | null;
          page_created_at: string | null;
          page_id: string | null;
          page_name: string | null;
          page_position: number | null;
          page_slug: string | null;
          page_updated_at: string | null;
          profile_id: string | null;
          project_id: string | null;
          project_name: string | null;
          project_slug: string | null;
          project_type: string | null;
          template_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema =
  DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

// ============================================================================
// Custom Speetch types — à PRÉSERVER lors des régénérations
// ============================================================================

/**
 * Contenu d'un projet (legacy — n'est plus rendu publiquement depuis
 * 2026-05-13, où le rendu public est passé sur les `pages`). Conservé pour
 * la compat des données existantes en BDD.
 */
export type ProjectContent = {
  intro?: string;
  sections?: Array<{
    id: string;
    type: "text" | "image" | "video" | "embed" | "gallery";
    title?: string;
    body?: string;
    media?: Array<{
      url: string;
      caption?: string;
      width?: number;
      height?: number;
    }>;
    embedUrl?: string;
  }>;
  meta?: {
    project_name?: string;
    delivery_date?: string;
    notes?: string;
    /**
     * Style de rendu public.
     * - `"default"` / absent : rendu Speetch noir
     * - `"document"` : palette éditoriale crème/bordeaux/Playfair (templates HTML "édition libre")
     * - `"raw_html"` : reproduction fidèle — la page rend le HTML brut stocké dans `raw_html`
     *   dans un iframe sandbox. Pas d'édition section-par-section.
     * - `"fwa"` : rendu FWA Grade — palette noir/blanc cassé Speetch, typo monumentale,
     *   chapitres numérotés, scroll progress, custom cursor. Lit `PageContent.sections`
     *   comme du contenu éditorial structuré. Compatible avec l'éditeur PageEditor standard.
     * - `"deliverables"` : rendu galerie de livrables — chaque livrable est une
     *   ligne de la table `client_page_deliverables` rattachée à la page. Le
     *   contenu `sections` est ignoré. Le client peut commenter et changer le
     *   statut (pending/approved/changes_requested) par livrable.
     */
    style?: "default" | "document" | "raw_html" | "fwa" | "deliverables";
    /**
     * HTML brut conservé pour le mode reproduction fidèle (style="raw_html").
     * Le `<head>` + `<body>` complet du document uploadé.
     */
    raw_html?: string;
    /**
     * Surcharges de textes pour le mode raw_html. Map "texte original" →
     * "texte personnalisé". Appliquée par un script injecté dans le srcDoc
     * de l'iframe au DOMContentLoaded. Le matching se fait sur les nœuds
     * texte (après trim, hors `<script>`/`<style>`/`<title>`).
     */
    text_overrides?: Record<string, string>;
    /**
     * Surcharges d'images pour le mode raw_html. Map "src originale" →
     * "nouvelle URL". Appliquée par le même script.
     */
    image_overrides?: Record<string, string>;
  };
};

/**
 * Liste minimale d'une page publiée telle qu'elle apparaît dans
 * `client_spaces.projects[i].pages[]`.
 *
 * `lot_id` permet le regroupement par lot côté espace public. Il est
 * maintenu en miroir avec `client_contexts.lot_id` pour les pages snapshot
 * issues d'une note publiée (cf. `setContextLot` / `setContextPublishing`).
 */
export type PageInSpace = {
  id: string;
  name: string;
  slug: string;
  position: number;
  created_at: string;
  lot_id: string | null;
};

/**
 * Forme d'un lot tel qu'il apparaît dans `client_spaces.projects[i].lots[]`.
 * Le numéro affiché ("Lot 01", "Lot 02"…) est dérivé de l'index dans le
 * tableau (déjà trié par position côté vue).
 */
export type LotInSpace = {
  id: string;
  name: string | null;
  position: number;
};

/**
 * Forme d'un projet tel qu'il apparaît dans `client_spaces.projects[]`
 * (agrégat jsonb généré par la vue). Plus de `content` : le rendu public
 * passe désormais par la liste de `pages`.
 */
export type ProjectInSpace = {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  project_type: string | null;
  delivery_date: string | null;
  created_at: string;
  pages: PageInSpace[];
  lots: LotInSpace[];
};

/**
 * Contenu d'une page (rendu sur l'espace client public).
 * Même schéma que ProjectContent : on partage le vocabulaire de sections
 * pour qu'un même renderer puisse afficher les deux.
 */
export type PageContent = ProjectContent;

export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;
export type Project = Tables<"projects">;
export type ProjectInsert = TablesInsert<"projects">;
export type ProjectUpdate = TablesUpdate<"projects">;
export type Page = Tables<"pages">;
export type PageInsert = TablesInsert<"pages">;
export type PageUpdate = TablesUpdate<"pages">;
export type PageTemplateRow = Tables<"page_templates">;
export type PageTemplateInsert = TablesInsert<"page_templates">;
export type PageTemplateUpdate = TablesUpdate<"page_templates">;
export type ClientSpace = Tables<"client_spaces">;
export type ClientPage = Tables<"client_pages">;
