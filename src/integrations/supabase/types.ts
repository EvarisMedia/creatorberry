export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      audience_personas: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          brand_id: string
          content_habits: string | null
          created_at: string
          desires: string[] | null
          id: string
          interests: string[] | null
          is_primary: boolean | null
          location: string | null
          name: string
          pain_points: string[] | null
          preferred_format: string | null
          preferred_video_length: string | null
          psychographics: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          brand_id: string
          content_habits?: string | null
          created_at?: string
          desires?: string[] | null
          id?: string
          interests?: string[] | null
          is_primary?: boolean | null
          location?: string | null
          name: string
          pain_points?: string[] | null
          preferred_format?: string | null
          preferred_video_length?: string | null
          psychographics?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          brand_id?: string
          content_habits?: string | null
          created_at?: string
          desires?: string[] | null
          id?: string
          interests?: string[] | null
          is_primary?: boolean | null
          location?: string | null
          name?: string
          pain_points?: string[] | null
          preferred_format?: string | null
          preferred_video_length?: string | null
          psychographics?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audience_personas_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          brand_id: string
          content_themes: string[] | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          name: string
          pin_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id: string
          content_themes?: string[] | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          name: string
          pin_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          content_themes?: string[] | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          name?: string
          pin_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          about: string | null
          catchphrases: string[] | null
          channel_description: string | null
          channel_handle: string | null
          content_goals: string[] | null
          content_style: string | null
          core_beliefs: string | null
          created_at: string
          emoji_usage: Database["public"]["Enums"]["emoji_usage"] | null
          id: string
          layout_rules: Json | null
          logo_url: string | null
          logo_watermark_enabled: boolean | null
          name: string
          niche: string | null
          offers_services: string | null
          opinions: string | null
          pin_design_style: string | null
          primary_color: string | null
          primary_keywords: string[] | null
          sample_transcripts: string[] | null
          secondary_color: string | null
          signature_frameworks: string | null
          target_audience: string | null
          timezone: string | null
          tone: Database["public"]["Enums"]["brand_tone"] | null
          updated_at: string
          user_id: string
          vocabulary_preferences: string[] | null
          writing_style: Database["public"]["Enums"]["writing_style"] | null
        }
        Insert: {
          about?: string | null
          catchphrases?: string[] | null
          channel_description?: string | null
          channel_handle?: string | null
          content_goals?: string[] | null
          content_style?: string | null
          core_beliefs?: string | null
          created_at?: string
          emoji_usage?: Database["public"]["Enums"]["emoji_usage"] | null
          id?: string
          layout_rules?: Json | null
          logo_url?: string | null
          logo_watermark_enabled?: boolean | null
          name: string
          niche?: string | null
          offers_services?: string | null
          opinions?: string | null
          pin_design_style?: string | null
          primary_color?: string | null
          primary_keywords?: string[] | null
          sample_transcripts?: string[] | null
          secondary_color?: string | null
          signature_frameworks?: string | null
          target_audience?: string | null
          timezone?: string | null
          tone?: Database["public"]["Enums"]["brand_tone"] | null
          updated_at?: string
          user_id: string
          vocabulary_preferences?: string[] | null
          writing_style?: Database["public"]["Enums"]["writing_style"] | null
        }
        Update: {
          about?: string | null
          catchphrases?: string[] | null
          channel_description?: string | null
          channel_handle?: string | null
          content_goals?: string[] | null
          content_style?: string | null
          core_beliefs?: string | null
          created_at?: string
          emoji_usage?: Database["public"]["Enums"]["emoji_usage"] | null
          id?: string
          layout_rules?: Json | null
          logo_url?: string | null
          logo_watermark_enabled?: boolean | null
          name?: string
          niche?: string | null
          offers_services?: string | null
          opinions?: string | null
          pin_design_style?: string | null
          primary_color?: string | null
          primary_keywords?: string[] | null
          sample_transcripts?: string[] | null
          secondary_color?: string | null
          signature_frameworks?: string | null
          target_audience?: string | null
          timezone?: string | null
          tone?: Database["public"]["Enums"]["brand_tone"] | null
          updated_at?: string
          user_id?: string
          vocabulary_preferences?: string[] | null
          writing_style?: Database["public"]["Enums"]["writing_style"] | null
        }
        Relationships: []
      }
      carousel_jobs: {
        Row: {
          brand_id: string
          completed_slides: number
          created_at: string
          error: string | null
          generated_images: Json
          id: string
          post_id: string | null
          slides_data: Json
          status: string
          style: string
          total_slides: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id: string
          completed_slides?: number
          created_at?: string
          error?: string | null
          generated_images?: Json
          id?: string
          post_id?: string | null
          slides_data?: Json
          status?: string
          style?: string
          total_slides?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          completed_slides?: number
          created_at?: string
          error?: string | null
          generated_images?: Json
          id?: string
          post_id?: string | null
          slides_data?: Json
          status?: string
          style?: string
          total_slides?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carousel_jobs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carousel_jobs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "generated_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sources: {
        Row: {
          board_id: string | null
          brand_id: string
          content: string | null
          created_at: string
          funnel_stage: Database["public"]["Enums"]["funnel_stage"]
          id: string
          is_active: boolean
          last_fetched_at: string | null
          name: string
          priority: Database["public"]["Enums"]["priority_level"]
          source_type: Database["public"]["Enums"]["source_type"]
          topic: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          board_id?: string | null
          brand_id: string
          content?: string | null
          created_at?: string
          funnel_stage?: Database["public"]["Enums"]["funnel_stage"]
          id?: string
          is_active?: boolean
          last_fetched_at?: string | null
          name: string
          priority?: Database["public"]["Enums"]["priority_level"]
          source_type: Database["public"]["Enums"]["source_type"]
          topic?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          board_id?: string | null
          brand_id?: string
          content?: string | null
          created_at?: string
          funnel_stage?: Database["public"]["Enums"]["funnel_stage"]
          id?: string
          is_active?: boolean
          last_fetched_at?: string | null
          name?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          source_type?: Database["public"]["Enums"]["source_type"]
          topic?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_sources_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sources_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      expanded_content: {
        Row: {
          brand_id: string
          content: string
          created_at: string
          id: string
          mode: string
          outline_section_id: string
          style: string | null
          tone: string | null
          updated_at: string
          user_id: string
          version: number | null
          word_count: number | null
        }
        Insert: {
          brand_id: string
          content: string
          created_at?: string
          id?: string
          mode: string
          outline_section_id: string
          style?: string | null
          tone?: string | null
          updated_at?: string
          user_id: string
          version?: number | null
          word_count?: number | null
        }
        Update: {
          brand_id?: string
          content?: string
          created_at?: string
          id?: string
          mode?: string
          outline_section_id?: string
          style?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string
          version?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expanded_content_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expanded_content_outline_section_id_fkey"
            columns: ["outline_section_id"]
            isOneToOne: false
            referencedRelation: "outline_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_images: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          image_type: string
          image_url: string
          post_id: string | null
          prompt: string
          quote_text: string | null
          style: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          image_type?: string
          image_url: string
          post_id?: string | null
          prompt: string
          quote_text?: string | null
          style?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          image_type?: string
          image_url?: string
          post_id?: string | null
          prompt?: string
          quote_text?: string | null
          style?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "generated_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_posts: {
        Row: {
          body: string
          brand_id: string
          carousel_slides: Json | null
          created_at: string
          cta: string | null
          full_content: string
          hook: string
          id: string
          media_format: string | null
          post_length: Database["public"]["Enums"]["post_length"]
          post_type: Database["public"]["Enums"]["post_type"]
          published_at: string | null
          scheduled_at: string | null
          source_context: string | null
          source_id: string | null
          status: Database["public"]["Enums"]["post_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          brand_id: string
          carousel_slides?: Json | null
          created_at?: string
          cta?: string | null
          full_content: string
          hook: string
          id?: string
          media_format?: string | null
          post_length?: Database["public"]["Enums"]["post_length"]
          post_type: Database["public"]["Enums"]["post_type"]
          published_at?: string | null
          scheduled_at?: string | null
          source_context?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          brand_id?: string
          carousel_slides?: Json | null
          created_at?: string
          cta?: string | null
          full_content?: string
          hook?: string
          id?: string
          media_format?: string | null
          post_length?: Database["public"]["Enums"]["post_length"]
          post_type?: Database["public"]["Enums"]["post_type"]
          published_at?: string | null
          scheduled_at?: string | null
          source_context?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_posts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      hook_variations: {
        Row: {
          created_at: string
          hook_text: string
          hook_type: string | null
          id: string
          is_selected: boolean | null
          pattern_interrupt: string | null
          performance_notes: string | null
          script_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hook_text: string
          hook_type?: string | null
          id?: string
          is_selected?: boolean | null
          pattern_interrupt?: string | null
          performance_notes?: string | null
          script_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          hook_text?: string
          hook_type?: string | null
          id?: string
          is_selected?: boolean | null
          pattern_interrupt?: string | null
          performance_notes?: string | null
          script_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hook_variations_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      kdp_metadata: {
        Row: {
          asin: string | null
          brand_id: string
          categories: string[] | null
          created_at: string
          description: string | null
          ebook_price: number | null
          id: string
          keywords: string[] | null
          pricing_analysis: Json | null
          print_price: number | null
          product_outline_id: string
          royalty_tier: string | null
          status: string
          subtitle: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asin?: string | null
          brand_id: string
          categories?: string[] | null
          created_at?: string
          description?: string | null
          ebook_price?: number | null
          id?: string
          keywords?: string[] | null
          pricing_analysis?: Json | null
          print_price?: number | null
          product_outline_id: string
          royalty_tier?: string | null
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asin?: string | null
          brand_id?: string
          categories?: string[] | null
          created_at?: string
          description?: string | null
          ebook_price?: number | null
          id?: string
          keywords?: string[] | null
          pricing_analysis?: Json | null
          print_price?: number | null
          product_outline_id?: string
          royalty_tier?: string | null
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kdp_metadata_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kdp_metadata_product_outline_id_fkey"
            columns: ["product_outline_id"]
            isOneToOne: false
            referencedRelation: "product_outlines"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_assets: {
        Row: {
          asset_type: string
          brand_id: string
          content: Json
          created_at: string
          id: string
          product_outline_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type?: string
          brand_id: string
          content?: Json
          created_at?: string
          id?: string
          product_outline_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          brand_id?: string
          content?: Json
          created_at?: string
          id?: string
          product_outline_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_assets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_assets_product_outline_id_fkey"
            columns: ["product_outline_id"]
            isOneToOne: false
            referencedRelation: "product_outlines"
            referencedColumns: ["id"]
          },
        ]
      }
      outline_sections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          outline_id: string
          section_number: number
          sort_order: number
          subsections: Json | null
          title: string
          updated_at: string
          word_count_target: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          outline_id: string
          section_number?: number
          sort_order?: number
          subsections?: Json | null
          title: string
          updated_at?: string
          word_count_target?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          outline_id?: string
          section_number?: number
          sort_order?: number
          subsections?: Json | null
          title?: string
          updated_at?: string
          word_count_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "outline_sections_outline_id_fkey"
            columns: ["outline_id"]
            isOneToOne: false
            referencedRelation: "product_outlines"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_templates: {
        Row: {
          brand_id: string | null
          color_emphasis: string | null
          created_at: string
          cta_type: string | null
          description: string | null
          description_template: string | null
          headline_template: string | null
          id: string
          is_default: boolean | null
          keywords: string[] | null
          layout_style: string | null
          name: string
          pin_type: string | null
          title_template: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          color_emphasis?: string | null
          created_at?: string
          cta_type?: string | null
          description?: string | null
          description_template?: string | null
          headline_template?: string | null
          id?: string
          is_default?: boolean | null
          keywords?: string[] | null
          layout_style?: string | null
          name: string
          pin_type?: string | null
          title_template?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string | null
          color_emphasis?: string | null
          created_at?: string
          cta_type?: string | null
          description?: string | null
          description_template?: string | null
          headline_template?: string | null
          id?: string
          is_default?: boolean | null
          keywords?: string[] | null
          layout_style?: string | null
          name?: string
          pin_type?: string | null
          title_template?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_variations: {
        Row: {
          color_emphasis: string | null
          created_at: string
          description_variation: string | null
          headline: string | null
          id: string
          image_url: string | null
          is_selected: boolean | null
          layout_style: string | null
          pin_id: string
          user_id: string
        }
        Insert: {
          color_emphasis?: string | null
          created_at?: string
          description_variation?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          is_selected?: boolean | null
          layout_style?: string | null
          pin_id: string
          user_id: string
        }
        Update: {
          color_emphasis?: string | null
          created_at?: string
          description_variation?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          is_selected?: boolean | null
          layout_style?: string | null
          pin_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_variations_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
        ]
      }
      pins: {
        Row: {
          board_id: string | null
          brand_id: string
          created_at: string
          cta_type: string | null
          description: string | null
          destination_url: string | null
          id: string
          keywords: string[] | null
          pin_type: string | null
          published_at: string | null
          seo_score: number | null
          source_context: string | null
          source_id: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_id?: string | null
          brand_id: string
          created_at?: string
          cta_type?: string | null
          description?: string | null
          destination_url?: string | null
          id?: string
          keywords?: string[] | null
          pin_type?: string | null
          published_at?: string | null
          seo_score?: number | null
          source_context?: string | null
          source_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_id?: string | null
          brand_id?: string
          created_at?: string
          cta_type?: string | null
          description?: string | null
          destination_url?: string | null
          id?: string
          keywords?: string[] | null
          pin_type?: string | null
          published_at?: string | null
          seo_score?: number | null
          source_context?: string | null
          source_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pins_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pins_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pins_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      pmf_scores: {
        Row: {
          combined_score: number
          created_at: string
          demand_score: number
          fit_score: number
          gap_score: number
          id: string
          product_idea_id: string
          reasoning: Json | null
          urgency_score: number
        }
        Insert: {
          combined_score?: number
          created_at?: string
          demand_score?: number
          fit_score?: number
          gap_score?: number
          id?: string
          product_idea_id: string
          reasoning?: Json | null
          urgency_score?: number
        }
        Update: {
          combined_score?: number
          created_at?: string
          demand_score?: number
          fit_score?: number
          gap_score?: number
          id?: string
          product_idea_id?: string
          reasoning?: Json | null
          urgency_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "pmf_scores_product_idea_id_fkey"
            columns: ["product_idea_id"]
            isOneToOne: false
            referencedRelation: "product_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      product_exports: {
        Row: {
          brand_id: string
          created_at: string
          error: string | null
          export_settings: Json | null
          file_size: number | null
          file_url: string | null
          format: string
          id: string
          product_outline_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          error?: string | null
          export_settings?: Json | null
          file_size?: number | null
          file_url?: string | null
          format: string
          id?: string
          product_outline_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          error?: string | null
          export_settings?: Json | null
          file_size?: number | null
          file_url?: string | null
          format?: string
          id?: string
          product_outline_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_exports_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_exports_product_outline_id_fkey"
            columns: ["product_outline_id"]
            isOneToOne: false
            referencedRelation: "product_outlines"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ideas: {
        Row: {
          brand_id: string
          created_at: string
          description: string
          format: string
          id: string
          source_context: string | null
          status: string
          target_audience: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          description: string
          format?: string
          id?: string
          source_context?: string | null
          status?: string
          target_audience?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string
          format?: string
          id?: string
          source_context?: string | null
          status?: string
          target_audience?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ideas_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      product_outlines: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          product_idea_id: string
          status: string
          structure: Json
          title: string
          total_word_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          product_idea_id: string
          status?: string
          structure?: Json
          title: string
          total_word_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          product_idea_id?: string
          status?: string
          structure?: Json
          title?: string
          total_word_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_outlines_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_outlines_product_idea_id_fkey"
            columns: ["product_idea_id"]
            isOneToOne: false
            referencedRelation: "product_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_approved: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_pages: {
        Row: {
          brand_id: string
          created_at: string
          cta_text: string | null
          cta_url: string | null
          framework: string
          headline: string
          id: string
          product_outline_id: string | null
          sections: Json
          status: string
          subheadline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          framework?: string
          headline?: string
          id?: string
          product_outline_id?: string | null
          sections?: Json
          status?: string
          subheadline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          framework?: string
          headline?: string
          id?: string
          product_outline_id?: string | null
          sections?: Json
          status?: string
          subheadline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_pages_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_pages_product_outline_id_fkey"
            columns: ["product_outline_id"]
            isOneToOne: false
            referencedRelation: "product_outlines"
            referencedColumns: ["id"]
          },
        ]
      }
      script_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          structure: Json
          template_type: Database["public"]["Enums"]["script_template_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          structure?: Json
          template_type?: Database["public"]["Enums"]["script_template_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          structure?: Json
          template_type?: Database["public"]["Enums"]["script_template_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      scripts: {
        Row: {
          b_roll_notes: string | null
          brand_id: string
          chapter_markers: Json | null
          created_at: string
          estimated_word_count: number | null
          full_script: string | null
          hook: string | null
          id: string
          research_context: string | null
          sections: Json
          seo_description: string | null
          seo_tags: string[] | null
          seo_title: string | null
          spark_id: string | null
          status: Database["public"]["Enums"]["script_status"]
          target_length_minutes: number | null
          template_id: string | null
          thumbnail_brief: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          b_roll_notes?: string | null
          brand_id: string
          chapter_markers?: Json | null
          created_at?: string
          estimated_word_count?: number | null
          full_script?: string | null
          hook?: string | null
          id?: string
          research_context?: string | null
          sections?: Json
          seo_description?: string | null
          seo_tags?: string[] | null
          seo_title?: string | null
          spark_id?: string | null
          status?: Database["public"]["Enums"]["script_status"]
          target_length_minutes?: number | null
          template_id?: string | null
          thumbnail_brief?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          b_roll_notes?: string | null
          brand_id?: string
          chapter_markers?: Json | null
          created_at?: string
          estimated_word_count?: number | null
          full_script?: string | null
          hook?: string | null
          id?: string
          research_context?: string | null
          sections?: Json
          seo_description?: string | null
          seo_tags?: string[] | null
          seo_title?: string | null
          spark_id?: string | null
          status?: Database["public"]["Enums"]["script_status"]
          target_length_minutes?: number | null
          template_id?: string | null
          thumbnail_brief?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scripts_spark_id_fkey"
            columns: ["spark_id"]
            isOneToOne: false
            referencedRelation: "video_sparks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scripts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "script_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      training_library: {
        Row: {
          category: string
          chunk_index: number | null
          content: string
          content_embedding: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          source_file: string | null
          subcategory: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          chunk_index?: number | null
          content: string
          content_embedding?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          source_file?: string | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          chunk_index?: number | null
          content?: string
          content_embedding?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          source_file?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trend_alerts: {
        Row: {
          alert_type: string
          brand_id: string
          created_at: string
          description: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          source_id: string | null
          spark_id: string | null
          title: string
          user_id: string
          velocity_score: number | null
        }
        Insert: {
          alert_type: string
          brand_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          source_id?: string | null
          spark_id?: string | null
          title: string
          user_id: string
          velocity_score?: number | null
        }
        Update: {
          alert_type?: string
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          source_id?: string | null
          spark_id?: string | null
          title?: string
          user_id?: string
          velocity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trend_alerts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trend_alerts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trend_alerts_spark_id_fkey"
            columns: ["spark_id"]
            isOneToOne: false
            referencedRelation: "video_sparks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          ai_creativity_level: number | null
          always_include_cta: boolean | null
          auto_generate_from_rss: boolean | null
          auto_generate_images: boolean | null
          auto_schedule_approved: boolean | null
          content_freshness_days: number | null
          created_at: string | null
          default_image_style: string | null
          default_image_type: string | null
          default_media_format: string | null
          default_post_length: string | null
          default_post_type: string | null
          default_posts_per_source: number | null
          email_notifications: boolean | null
          enabled_post_types: string[] | null
          generate_mixed_types: boolean | null
          id: string
          include_weekends: boolean | null
          max_items_per_fetch: number | null
          new_source_content_alerts: boolean | null
          posts_per_week_goal: number | null
          preferred_posting_times: string[] | null
          rss_refresh_hours: number | null
          scheduled_post_reminder_hours: number | null
          updated_at: string | null
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          ai_creativity_level?: number | null
          always_include_cta?: boolean | null
          auto_generate_from_rss?: boolean | null
          auto_generate_images?: boolean | null
          auto_schedule_approved?: boolean | null
          content_freshness_days?: number | null
          created_at?: string | null
          default_image_style?: string | null
          default_image_type?: string | null
          default_media_format?: string | null
          default_post_length?: string | null
          default_post_type?: string | null
          default_posts_per_source?: number | null
          email_notifications?: boolean | null
          enabled_post_types?: string[] | null
          generate_mixed_types?: boolean | null
          id?: string
          include_weekends?: boolean | null
          max_items_per_fetch?: number | null
          new_source_content_alerts?: boolean | null
          posts_per_week_goal?: number | null
          preferred_posting_times?: string[] | null
          rss_refresh_hours?: number | null
          scheduled_post_reminder_hours?: number | null
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          ai_creativity_level?: number | null
          always_include_cta?: boolean | null
          auto_generate_from_rss?: boolean | null
          auto_generate_images?: boolean | null
          auto_schedule_approved?: boolean | null
          content_freshness_days?: number | null
          created_at?: string | null
          default_image_style?: string | null
          default_image_type?: string | null
          default_media_format?: string | null
          default_post_length?: string | null
          default_post_type?: string | null
          default_posts_per_source?: number | null
          email_notifications?: boolean | null
          enabled_post_types?: string[] | null
          generate_mixed_types?: boolean | null
          id?: string
          include_weekends?: boolean | null
          max_items_per_fetch?: number | null
          new_source_content_alerts?: boolean | null
          posts_per_week_goal?: number | null
          preferred_posting_times?: string[] | null
          rss_refresh_hours?: number | null
          scheduled_post_reminder_hours?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      video_sparks: {
        Row: {
          ai_analysis: Json | null
          brand_id: string
          combined_score: number | null
          competition_level: string | null
          created_at: string
          id: string
          outlier_score: number | null
          source_excerpt: string | null
          source_id: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["spark_status"]
          suggested_angle: string | null
          title: string
          updated_at: string
          user_id: string
          velocity_score: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          brand_id: string
          combined_score?: number | null
          competition_level?: string | null
          created_at?: string
          id?: string
          outlier_score?: number | null
          source_excerpt?: string | null
          source_id?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["spark_status"]
          suggested_angle?: string | null
          title: string
          updated_at?: string
          user_id: string
          velocity_score?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          brand_id?: string
          combined_score?: number | null
          competition_level?: string | null
          created_at?: string
          id?: string
          outlier_score?: number | null
          source_excerpt?: string | null
          source_id?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["spark_status"]
          suggested_angle?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          velocity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_sparks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sparks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_profiles: {
        Row: {
          analyzed_transcripts: number | null
          brand_id: string
          created_at: string
          humor_style: string | null
          id: string
          is_active: boolean | null
          name: string
          sentence_structure: string | null
          signature_expressions: string[] | null
          transition_phrases: string[] | null
          updated_at: string
          user_id: string
          vocabulary_style: string | null
          voice_dna: Json | null
        }
        Insert: {
          analyzed_transcripts?: number | null
          brand_id: string
          created_at?: string
          humor_style?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sentence_structure?: string | null
          signature_expressions?: string[] | null
          transition_phrases?: string[] | null
          updated_at?: string
          user_id: string
          vocabulary_style?: string | null
          voice_dna?: Json | null
        }
        Update: {
          analyzed_transcripts?: number | null
          brand_id?: string
          created_at?: string
          humor_style?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sentence_structure?: string | null
          signature_expressions?: string[] | null
          transition_phrases?: string[] | null
          updated_at?: string
          user_id?: string
          vocabulary_style?: string | null
          voice_dna?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      match_training_content: {
        Args: {
          filter_category?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          id: string
          similarity: number
          subcategory: string
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      brand_tone: "professional" | "conversational" | "bold" | "opinionated"
      emoji_usage: "none" | "minimal" | "moderate"
      funnel_stage: "awareness" | "authority" | "conversion"
      post_length: "short" | "medium" | "long"
      post_status: "draft" | "edited" | "approved" | "scheduled" | "published"
      post_type:
        | "educational_breakdown"
        | "opinion_contrarian"
        | "founder_story"
        | "case_study"
        | "framework_post"
        | "trend_reaction"
        | "lesson_learned"
        | "how_to_tactical"
        | "myth_busting"
        | "future_prediction"
        | "listicle"
        | "quick_tip"
      priority_level: "low" | "medium" | "high"
      script_status:
        | "draft"
        | "in_progress"
        | "review"
        | "completed"
        | "published"
      script_template_type:
        | "documentary"
        | "tutorial"
        | "storytime"
        | "listicle"
        | "reaction"
        | "custom"
      source_type: "rss_feed" | "blog_url" | "manual_idea"
      spark_status: "new" | "saved" | "scripting" | "completed" | "dismissed"
      writing_style: "short_punchy" | "long_form" | "story_driven"
      youtube_source_type:
        | "rss_feed"
        | "blog_url"
        | "document"
        | "idea_seed"
        | "competitor_video"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      brand_tone: ["professional", "conversational", "bold", "opinionated"],
      emoji_usage: ["none", "minimal", "moderate"],
      funnel_stage: ["awareness", "authority", "conversion"],
      post_length: ["short", "medium", "long"],
      post_status: ["draft", "edited", "approved", "scheduled", "published"],
      post_type: [
        "educational_breakdown",
        "opinion_contrarian",
        "founder_story",
        "case_study",
        "framework_post",
        "trend_reaction",
        "lesson_learned",
        "how_to_tactical",
        "myth_busting",
        "future_prediction",
        "listicle",
        "quick_tip",
      ],
      priority_level: ["low", "medium", "high"],
      script_status: [
        "draft",
        "in_progress",
        "review",
        "completed",
        "published",
      ],
      script_template_type: [
        "documentary",
        "tutorial",
        "storytime",
        "listicle",
        "reaction",
        "custom",
      ],
      source_type: ["rss_feed", "blog_url", "manual_idea"],
      spark_status: ["new", "saved", "scripting", "completed", "dismissed"],
      writing_style: ["short_punchy", "long_form", "story_driven"],
      youtube_source_type: [
        "rss_feed",
        "blog_url",
        "document",
        "idea_seed",
        "competitor_video",
      ],
    },
  },
} as const
