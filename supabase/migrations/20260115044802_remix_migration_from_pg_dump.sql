CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: brand_tone; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.brand_tone AS ENUM (
    'professional',
    'conversational',
    'bold',
    'opinionated'
);


--
-- Name: emoji_usage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.emoji_usage AS ENUM (
    'none',
    'minimal',
    'moderate'
);


--
-- Name: funnel_stage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.funnel_stage AS ENUM (
    'awareness',
    'authority',
    'conversion'
);


--
-- Name: post_length; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.post_length AS ENUM (
    'short',
    'medium',
    'long'
);


--
-- Name: post_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.post_status AS ENUM (
    'draft',
    'edited',
    'approved',
    'scheduled',
    'published'
);


--
-- Name: post_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.post_type AS ENUM (
    'educational_breakdown',
    'opinion_contrarian',
    'founder_story',
    'case_study',
    'framework_post',
    'trend_reaction',
    'lesson_learned',
    'how_to_tactical',
    'myth_busting',
    'future_prediction',
    'listicle',
    'quick_tip'
);


--
-- Name: priority_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.priority_level AS ENUM (
    'low',
    'medium',
    'high'
);


--
-- Name: script_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.script_status AS ENUM (
    'draft',
    'in_progress',
    'review',
    'completed',
    'published'
);


--
-- Name: script_template_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.script_template_type AS ENUM (
    'documentary',
    'tutorial',
    'storytime',
    'listicle',
    'reaction',
    'custom'
);


--
-- Name: source_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.source_type AS ENUM (
    'rss_feed',
    'blog_url',
    'manual_idea'
);


--
-- Name: spark_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.spark_status AS ENUM (
    'new',
    'saved',
    'scripting',
    'completed',
    'dismissed'
);


--
-- Name: writing_style; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.writing_style AS ENUM (
    'short_punchy',
    'long_form',
    'story_driven'
);


--
-- Name: youtube_source_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.youtube_source_type AS ENUM (
    'rss_feed',
    'blog_url',
    'document',
    'idea_seed',
    'competitor_video'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  is_first_user boolean;
BEGIN
  -- Check if this is the first user
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;
  
  -- Insert profile (auto-approve if first user)
  INSERT INTO public.profiles (user_id, email, full_name, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    is_first_user
  );
  
  -- Create role (admin if first user, otherwise user)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_first_user THEN 'admin'::app_role ELSE 'user'::app_role END);
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_user_approved(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_user_approved(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT is_approved FROM public.profiles WHERE user_id = _user_id),
    false
  )
$$;


--
-- Name: match_training_content(public.vector, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.match_training_content(query_embedding public.vector, match_count integer DEFAULT 10, filter_category text DEFAULT NULL::text) RETURNS TABLE(id uuid, category text, subcategory text, title text, content text, similarity double precision)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.category,
    t.subcategory,
    t.title,
    t.content,
    1 - (t.content_embedding <=> query_embedding) AS similarity
  FROM public.training_library t
  WHERE t.is_active = true
    AND (filter_category IS NULL OR t.category = filter_category)
  ORDER BY t.content_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


--
-- Name: update_ai_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_ai_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: ai_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    setting_value text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: audience_personas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audience_personas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    name text NOT NULL,
    avatar_url text,
    age_range text,
    location text,
    interests text[],
    pain_points text[],
    desires text[],
    content_habits text,
    preferred_video_length text,
    preferred_format text,
    psychographics jsonb,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    logo_url text,
    primary_color text DEFAULT '#000000'::text,
    secondary_color text DEFAULT '#FFFFFF'::text,
    timezone text DEFAULT 'UTC'::text,
    tone public.brand_tone DEFAULT 'professional'::public.brand_tone,
    emoji_usage public.emoji_usage DEFAULT 'minimal'::public.emoji_usage,
    writing_style public.writing_style DEFAULT 'short_punchy'::public.writing_style,
    about text,
    core_beliefs text,
    opinions text,
    signature_frameworks text,
    offers_services text,
    target_audience text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    channel_handle text,
    channel_description text,
    niche text,
    content_style text,
    vocabulary_preferences text[],
    catchphrases text[],
    sample_transcripts text[]
);


--
-- Name: carousel_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carousel_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    total_slides integer DEFAULT 0 NOT NULL,
    completed_slides integer DEFAULT 0 NOT NULL,
    slides_data jsonb DEFAULT '[]'::jsonb NOT NULL,
    generated_images jsonb DEFAULT '[]'::jsonb NOT NULL,
    style text DEFAULT 'infographic'::text NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    post_id uuid,
    CONSTRAINT carousel_jobs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: content_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_id uuid NOT NULL,
    user_id uuid NOT NULL,
    source_type public.source_type NOT NULL,
    name text NOT NULL,
    url text,
    content text,
    topic text,
    funnel_stage public.funnel_stage DEFAULT 'awareness'::public.funnel_stage NOT NULL,
    priority public.priority_level DEFAULT 'medium'::public.priority_level NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_fetched_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: generated_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    post_id uuid,
    image_url text NOT NULL,
    prompt text NOT NULL,
    image_type text DEFAULT 'quote_card'::text NOT NULL,
    quote_text text,
    style text DEFAULT 'modern'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: generated_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_id uuid NOT NULL,
    source_id uuid,
    user_id uuid NOT NULL,
    post_type public.post_type NOT NULL,
    hook text NOT NULL,
    body text NOT NULL,
    cta text,
    full_content text NOT NULL,
    post_length public.post_length DEFAULT 'medium'::public.post_length NOT NULL,
    status public.post_status DEFAULT 'draft'::public.post_status NOT NULL,
    source_context text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    scheduled_at timestamp with time zone,
    published_at timestamp with time zone,
    media_format text DEFAULT 'text_only'::text,
    carousel_slides jsonb
);


--
-- Name: hook_variations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hook_variations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    script_id uuid NOT NULL,
    user_id uuid NOT NULL,
    hook_text text NOT NULL,
    hook_type text,
    pattern_interrupt text,
    is_selected boolean DEFAULT false,
    performance_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT hook_variations_hook_type_check CHECK ((hook_type = ANY (ARRAY['question'::text, 'statement'::text, 'story'::text, 'statistic'::text, 'controversy'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    is_approved boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: script_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.script_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    description text,
    template_type public.script_template_type DEFAULT 'custom'::public.script_template_type NOT NULL,
    structure jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: scripts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scripts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    spark_id uuid,
    template_id uuid,
    title text NOT NULL,
    hook text,
    sections jsonb DEFAULT '[]'::jsonb NOT NULL,
    full_script text,
    target_length_minutes integer DEFAULT 10,
    estimated_word_count integer,
    research_context text,
    b_roll_notes text,
    status public.script_status DEFAULT 'draft'::public.script_status NOT NULL,
    seo_title text,
    seo_description text,
    seo_tags text[],
    chapter_markers jsonb,
    thumbnail_brief jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: training_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_library (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category text NOT NULL,
    subcategory text,
    title text NOT NULL,
    content text NOT NULL,
    content_embedding public.vector(768),
    source_file text,
    chunk_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: trend_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trend_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    source_id uuid,
    spark_id uuid,
    alert_type text NOT NULL,
    title text NOT NULL,
    description text,
    velocity_score integer,
    is_read boolean DEFAULT false,
    is_dismissed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT trend_alerts_alert_type_check CHECK ((alert_type = ANY (ARRAY['velocity_spike'::text, 'outlier_detected'::text, 'trending_topic'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    default_posts_per_source integer DEFAULT 3,
    default_post_length text DEFAULT 'medium'::text,
    default_post_type text DEFAULT 'educational_breakdown'::text,
    ai_creativity_level numeric(2,1) DEFAULT 0.8,
    always_include_cta boolean DEFAULT true,
    preferred_posting_times text[] DEFAULT ARRAY['09:00'::text],
    posts_per_week_goal integer DEFAULT 5,
    auto_schedule_approved boolean DEFAULT false,
    include_weekends boolean DEFAULT false,
    rss_refresh_hours integer DEFAULT 24,
    max_items_per_fetch integer DEFAULT 10,
    auto_generate_from_rss boolean DEFAULT false,
    content_freshness_days integer DEFAULT 7,
    default_image_style text DEFAULT 'modern'::text,
    default_image_type text DEFAULT 'quote_card'::text,
    auto_generate_images boolean DEFAULT false,
    email_notifications boolean DEFAULT true,
    weekly_digest boolean DEFAULT true,
    scheduled_post_reminder_hours integer DEFAULT 1,
    new_source_content_alerts boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    enabled_post_types text[] DEFAULT ARRAY['educational_breakdown'::text, 'opinion_contrarian'::text, 'founder_story'::text, 'case_study'::text, 'framework_post'::text, 'trend_reaction'::text, 'lesson_learned'::text, 'how_to_tactical'::text, 'myth_busting'::text, 'future_prediction'::text, 'listicle'::text, 'quick_tip'::text],
    default_media_format text DEFAULT 'text_only'::text,
    generate_mixed_types boolean DEFAULT false
);


--
-- Name: video_sparks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_sparks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    source_id uuid,
    title text NOT NULL,
    suggested_angle text,
    source_excerpt text,
    source_url text,
    velocity_score integer DEFAULT 0,
    outlier_score integer DEFAULT 0,
    combined_score integer GENERATED ALWAYS AS (((velocity_score + outlier_score) / 2)) STORED,
    competition_level text,
    status public.spark_status DEFAULT 'new'::public.spark_status NOT NULL,
    ai_analysis jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT video_sparks_competition_level_check CHECK ((competition_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT video_sparks_outlier_score_check CHECK (((outlier_score >= 0) AND (outlier_score <= 100))),
    CONSTRAINT video_sparks_velocity_score_check CHECK (((velocity_score >= 0) AND (velocity_score <= 100)))
);


--
-- Name: voice_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voice_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    name text DEFAULT 'Default Voice'::text NOT NULL,
    sentence_structure text,
    vocabulary_style text,
    humor_style text,
    transition_phrases text[],
    signature_expressions text[],
    analyzed_transcripts integer DEFAULT 0,
    voice_dna jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_settings ai_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_settings
    ADD CONSTRAINT ai_settings_pkey PRIMARY KEY (id);


--
-- Name: ai_settings ai_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_settings
    ADD CONSTRAINT ai_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: audience_personas audience_personas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audience_personas
    ADD CONSTRAINT audience_personas_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: carousel_jobs carousel_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carousel_jobs
    ADD CONSTRAINT carousel_jobs_pkey PRIMARY KEY (id);


--
-- Name: content_sources content_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_sources
    ADD CONSTRAINT content_sources_pkey PRIMARY KEY (id);


--
-- Name: generated_images generated_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_images
    ADD CONSTRAINT generated_images_pkey PRIMARY KEY (id);


--
-- Name: generated_posts generated_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_posts
    ADD CONSTRAINT generated_posts_pkey PRIMARY KEY (id);


--
-- Name: hook_variations hook_variations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hook_variations
    ADD CONSTRAINT hook_variations_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: script_templates script_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.script_templates
    ADD CONSTRAINT script_templates_pkey PRIMARY KEY (id);


--
-- Name: scripts scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scripts
    ADD CONSTRAINT scripts_pkey PRIMARY KEY (id);


--
-- Name: training_library training_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_library
    ADD CONSTRAINT training_library_pkey PRIMARY KEY (id);


--
-- Name: trend_alerts trend_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trend_alerts
    ADD CONSTRAINT trend_alerts_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);


--
-- Name: video_sparks video_sparks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_sparks
    ADD CONSTRAINT video_sparks_pkey PRIMARY KEY (id);


--
-- Name: voice_profiles voice_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_profiles
    ADD CONSTRAINT voice_profiles_pkey PRIMARY KEY (id);


--
-- Name: idx_audience_personas_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audience_personas_brand_id ON public.audience_personas USING btree (brand_id);


--
-- Name: idx_carousel_jobs_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carousel_jobs_post_id ON public.carousel_jobs USING btree (post_id);


--
-- Name: idx_content_sources_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_sources_brand_id ON public.content_sources USING btree (brand_id);


--
-- Name: idx_content_sources_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_sources_user_id ON public.content_sources USING btree (user_id);


--
-- Name: idx_generated_posts_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_posts_brand_id ON public.generated_posts USING btree (brand_id);


--
-- Name: idx_generated_posts_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_posts_scheduled_at ON public.generated_posts USING btree (scheduled_at) WHERE (scheduled_at IS NOT NULL);


--
-- Name: idx_generated_posts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_posts_status ON public.generated_posts USING btree (status);


--
-- Name: idx_generated_posts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_posts_user_id ON public.generated_posts USING btree (user_id);


--
-- Name: idx_scripts_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scripts_brand_id ON public.scripts USING btree (brand_id);


--
-- Name: idx_scripts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scripts_status ON public.scripts USING btree (status);


--
-- Name: idx_trend_alerts_user_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trend_alerts_user_unread ON public.trend_alerts USING btree (user_id, is_read) WHERE (is_read = false);


--
-- Name: idx_video_sparks_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_sparks_brand_id ON public.video_sparks USING btree (brand_id);


--
-- Name: idx_video_sparks_combined_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_sparks_combined_score ON public.video_sparks USING btree (combined_score DESC);


--
-- Name: idx_video_sparks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_sparks_status ON public.video_sparks USING btree (status);


--
-- Name: idx_voice_profiles_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_voice_profiles_brand_id ON public.voice_profiles USING btree (brand_id);


--
-- Name: training_library_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_library_category_idx ON public.training_library USING btree (category);


--
-- Name: training_library_embedding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_library_embedding_idx ON public.training_library USING ivfflat (content_embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: training_library_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_library_is_active_idx ON public.training_library USING btree (is_active);


--
-- Name: ai_settings update_ai_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON public.ai_settings FOR EACH ROW EXECUTE FUNCTION public.update_ai_settings_updated_at();


--
-- Name: audience_personas update_audience_personas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_audience_personas_updated_at BEFORE UPDATE ON public.audience_personas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: brands update_brands_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: carousel_jobs update_carousel_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_carousel_jobs_updated_at BEFORE UPDATE ON public.carousel_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: content_sources update_content_sources_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_content_sources_updated_at BEFORE UPDATE ON public.content_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: generated_images update_generated_images_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_generated_images_updated_at BEFORE UPDATE ON public.generated_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: generated_posts update_generated_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_generated_posts_updated_at BEFORE UPDATE ON public.generated_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: script_templates update_script_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_script_templates_updated_at BEFORE UPDATE ON public.script_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scripts update_scripts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON public.scripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: training_library update_training_library_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_training_library_updated_at BEFORE UPDATE ON public.training_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_settings update_user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: video_sparks update_video_sparks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_video_sparks_updated_at BEFORE UPDATE ON public.video_sparks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: voice_profiles update_voice_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_voice_profiles_updated_at BEFORE UPDATE ON public.voice_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_settings ai_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_settings
    ADD CONSTRAINT ai_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: audience_personas audience_personas_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audience_personas
    ADD CONSTRAINT audience_personas_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: audience_personas audience_personas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audience_personas
    ADD CONSTRAINT audience_personas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: brands brands_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: carousel_jobs carousel_jobs_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carousel_jobs
    ADD CONSTRAINT carousel_jobs_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: carousel_jobs carousel_jobs_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carousel_jobs
    ADD CONSTRAINT carousel_jobs_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.generated_posts(id) ON DELETE SET NULL;


--
-- Name: content_sources content_sources_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_sources
    ADD CONSTRAINT content_sources_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: generated_images generated_images_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_images
    ADD CONSTRAINT generated_images_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: generated_images generated_images_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_images
    ADD CONSTRAINT generated_images_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.generated_posts(id) ON DELETE SET NULL;


--
-- Name: generated_posts generated_posts_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_posts
    ADD CONSTRAINT generated_posts_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: generated_posts generated_posts_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_posts
    ADD CONSTRAINT generated_posts_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.content_sources(id) ON DELETE SET NULL;


--
-- Name: hook_variations hook_variations_script_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hook_variations
    ADD CONSTRAINT hook_variations_script_id_fkey FOREIGN KEY (script_id) REFERENCES public.scripts(id) ON DELETE CASCADE;


--
-- Name: hook_variations hook_variations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hook_variations
    ADD CONSTRAINT hook_variations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: script_templates script_templates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.script_templates
    ADD CONSTRAINT script_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: scripts scripts_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scripts
    ADD CONSTRAINT scripts_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: scripts scripts_spark_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scripts
    ADD CONSTRAINT scripts_spark_id_fkey FOREIGN KEY (spark_id) REFERENCES public.video_sparks(id) ON DELETE SET NULL;


--
-- Name: scripts scripts_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scripts
    ADD CONSTRAINT scripts_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.script_templates(id) ON DELETE SET NULL;


--
-- Name: scripts scripts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scripts
    ADD CONSTRAINT scripts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: training_library training_library_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_library
    ADD CONSTRAINT training_library_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: trend_alerts trend_alerts_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trend_alerts
    ADD CONSTRAINT trend_alerts_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: trend_alerts trend_alerts_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trend_alerts
    ADD CONSTRAINT trend_alerts_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.content_sources(id) ON DELETE SET NULL;


--
-- Name: trend_alerts trend_alerts_spark_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trend_alerts
    ADD CONSTRAINT trend_alerts_spark_id_fkey FOREIGN KEY (spark_id) REFERENCES public.video_sparks(id) ON DELETE SET NULL;


--
-- Name: trend_alerts trend_alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trend_alerts
    ADD CONSTRAINT trend_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: video_sparks video_sparks_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_sparks
    ADD CONSTRAINT video_sparks_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: video_sparks video_sparks_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_sparks
    ADD CONSTRAINT video_sparks_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.content_sources(id) ON DELETE SET NULL;


--
-- Name: video_sparks video_sparks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_sparks
    ADD CONSTRAINT video_sparks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: voice_profiles voice_profiles_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_profiles
    ADD CONSTRAINT voice_profiles_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: voice_profiles voice_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_profiles
    ADD CONSTRAINT voice_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: training_library Admins can manage training library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage training library" ON public.training_library USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ai_settings Admins can update ai_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update ai_settings" ON public.ai_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update any profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: brands Admins can view all brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all brands" ON public.brands FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: generated_posts Admins can view all posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all posts" ON public.generated_posts FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: content_sources Admins can view all sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all sources" ON public.content_sources FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Allow insert for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated users" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: training_library Authenticated users can read active training; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read active training" ON public.training_library FOR SELECT USING (((auth.role() = 'authenticated'::text) AND (is_active = true)));


--
-- Name: ai_settings Authenticated users can read ai_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read ai_settings" ON public.ai_settings FOR SELECT TO authenticated USING (true);


--
-- Name: brands Users can create own brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own brands" ON public.brands FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: generated_posts Users can create own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own posts" ON public.generated_posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: content_sources Users can create own sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own sources" ON public.content_sources FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: trend_alerts Users can create their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own alerts" ON public.trend_alerts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: carousel_jobs Users can create their own carousel jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own carousel jobs" ON public.carousel_jobs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: hook_variations Users can create their own hooks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own hooks" ON public.hook_variations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: generated_images Users can create their own images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own images" ON public.generated_images FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: audience_personas Users can create their own personas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own personas" ON public.audience_personas FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: scripts Users can create their own scripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own scripts" ON public.scripts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: video_sparks Users can create their own sparks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own sparks" ON public.video_sparks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: script_templates Users can create their own templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own templates" ON public.script_templates FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (is_system = false)));


--
-- Name: voice_profiles Users can create their own voice profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own voice profiles" ON public.voice_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: brands Users can delete own brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own brands" ON public.brands FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: generated_posts Users can delete own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own posts" ON public.generated_posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: content_sources Users can delete own sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own sources" ON public.content_sources FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: trend_alerts Users can delete their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own alerts" ON public.trend_alerts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: carousel_jobs Users can delete their own carousel jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own carousel jobs" ON public.carousel_jobs FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: hook_variations Users can delete their own hooks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own hooks" ON public.hook_variations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: generated_images Users can delete their own images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own images" ON public.generated_images FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: audience_personas Users can delete their own personas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own personas" ON public.audience_personas FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: scripts Users can delete their own scripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own scripts" ON public.scripts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: video_sparks Users can delete their own sparks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own sparks" ON public.video_sparks FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: script_templates Users can delete their own templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own templates" ON public.script_templates FOR DELETE USING (((auth.uid() = user_id) AND (is_system = false)));


--
-- Name: voice_profiles Users can delete their own voice profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own voice profiles" ON public.voice_profiles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_settings Users can insert own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: brands Users can update own brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own brands" ON public.brands FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: generated_posts Users can update own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own posts" ON public.generated_posts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_settings Users can update own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: content_sources Users can update own sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own sources" ON public.content_sources FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: trend_alerts Users can update their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own alerts" ON public.trend_alerts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: carousel_jobs Users can update their own carousel jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own carousel jobs" ON public.carousel_jobs FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: hook_variations Users can update their own hooks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own hooks" ON public.hook_variations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: generated_images Users can update their own images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own images" ON public.generated_images FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: audience_personas Users can update their own personas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own personas" ON public.audience_personas FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: scripts Users can update their own scripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own scripts" ON public.scripts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: video_sparks Users can update their own sparks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own sparks" ON public.video_sparks FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: script_templates Users can update their own templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own templates" ON public.script_templates FOR UPDATE USING (((auth.uid() = user_id) AND (is_system = false)));


--
-- Name: voice_profiles Users can update their own voice profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own voice profiles" ON public.voice_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: brands Users can view own brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own brands" ON public.brands FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: generated_posts Users can view own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own posts" ON public.generated_posts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_settings Users can view own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: content_sources Users can view own sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sources" ON public.content_sources FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: script_templates Users can view system templates and their own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view system templates and their own" ON public.script_templates FOR SELECT USING (((is_system = true) OR (auth.uid() = user_id)));


--
-- Name: trend_alerts Users can view their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own alerts" ON public.trend_alerts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: carousel_jobs Users can view their own carousel jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own carousel jobs" ON public.carousel_jobs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: hook_variations Users can view their own hooks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own hooks" ON public.hook_variations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: generated_images Users can view their own images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own images" ON public.generated_images FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audience_personas Users can view their own personas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own personas" ON public.audience_personas FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: scripts Users can view their own scripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own scripts" ON public.scripts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: video_sparks Users can view their own sparks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sparks" ON public.video_sparks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: voice_profiles Users can view their own voice profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own voice profiles" ON public.voice_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: audience_personas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audience_personas ENABLE ROW LEVEL SECURITY;

--
-- Name: brands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

--
-- Name: carousel_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.carousel_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: content_sources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: generated_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

--
-- Name: generated_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: hook_variations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hook_variations ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: script_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.script_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: scripts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

--
-- Name: training_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.training_library ENABLE ROW LEVEL SECURITY;

--
-- Name: trend_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trend_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: video_sparks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_sparks ENABLE ROW LEVEL SECURITY;

--
-- Name: voice_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;