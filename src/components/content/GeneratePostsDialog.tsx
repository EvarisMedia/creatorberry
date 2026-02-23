import { useState, useEffect } from "react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Sparkles, Loader2, Copy, Save, Check, BookOpen, Flame, User, BarChart, 
  Layers, TrendingUp, Lightbulb, ListChecks, AlertTriangle, Telescope, 
  List, Zap, FileText, Image, BarChart2, Newspaper 
} from "lucide-react";
import { useContentSources, ContentSource } from "@/hooks/useContentSources";
import { useGeneratedPosts, PostType, PostLength, MediaFormat, GeneratePostsInput, CarouselSlide } from "@/hooks/useGeneratedPosts";
import { useUserSettings } from "@/hooks/useUserSettings";
import { CarouselSlidesEditor } from "./CarouselSlidesEditor";
import { toast } from "sonner";

interface GeneratePostsDialogProps {
  brand: {
    id: string;
    name: string;
    tone: string | null;
    writing_style: string | null;
    emoji_usage: string | null;
    about: string | null;
    core_beliefs: string | null;
    opinions: string | null;
    signature_frameworks: string | null;
    target_audience: string | null;
    offers_services: string | null;
  };
}

const POST_TYPES: { value: PostType; label: string; icon: React.ElementType; description: string }[] = [
  { value: "educational_breakdown", label: "Educational", icon: BookOpen, description: "Teach a concept with clear steps" },
  { value: "opinion_contrarian", label: "Hot Take", icon: Flame, description: "Challenge conventional wisdom" },
  { value: "founder_story", label: "Behind the Scenes", icon: User, description: "Share authentic moments" },
  { value: "case_study", label: "Transformation", icon: BarChart, description: "Show before/after results" },
  { value: "framework_post", label: "Framework", icon: Layers, description: "Present a unique methodology" },
  { value: "trend_reaction", label: "Trend Reaction", icon: TrendingUp, description: "React to trending topics" },
  { value: "lesson_learned", label: "Lesson Learned", icon: Lightbulb, description: "Share wisdom from experience" },
  { value: "how_to_tactical", label: "Tutorial", icon: ListChecks, description: "Step-by-step guide" },
  { value: "myth_busting", label: "Myth Busting", icon: AlertTriangle, description: "Debunk misconceptions" },
  { value: "future_prediction", label: "Prediction", icon: Telescope, description: "Share industry predictions" },
  { value: "listicle", label: "Listicle", icon: List, description: "Numbered list of insights" },
  { value: "quick_tip", label: "Quick Tip", icon: Zap, description: "Single actionable insight" },
];

const MEDIA_FORMATS: { value: MediaFormat; label: string; icon: React.ElementType; description: string }[] = [
  { value: "text_only", label: "Caption Only", icon: FileText, description: "Feed post caption" },
  { value: "with_image", label: "With Image", icon: Image, description: "Post with visual" },
  { value: "carousel", label: "Carousel", icon: Layers, description: "Multi-slide post" },
  { value: "poll", label: "Reel Script", icon: BarChart2, description: "Viral Reel with hook" },
  { value: "article", label: "Long Caption", icon: Newspaper, description: "Story-driven caption" },
];

interface GeneratedPostPreview {
  hook: string;
  body: string;
  cta: string;
  postType?: PostType;
  pollOptions?: string[];
  carouselSlides?: CarouselSlide[];
}

export function GeneratePostsDialog({ brand }: GeneratePostsDialogProps) {
  const { settings } = useUserSettings();
  const { requireKey } = useRequireApiKey();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"config" | "results">("config");
  const [selectedSource, setSelectedSource] = useState<string>("none");
  const [postType, setPostType] = useState<PostType>(settings.default_post_type as PostType);
  const [postLength, setPostLength] = useState<PostLength>(settings.default_post_length as PostLength);
  const [numberOfPosts, setNumberOfPosts] = useState(settings.default_posts_per_source);
  const [mediaFormat, setMediaFormat] = useState<MediaFormat>((settings.default_media_format as MediaFormat) || "text_only");
  const [generateMixedTypes, setGenerateMixedTypes] = useState(settings.generate_mixed_types || false);
  const [selectedPostTypes, setSelectedPostTypes] = useState<PostType[]>(
    (settings.enabled_post_types as PostType[]) || POST_TYPES.map(t => t.value)
  );
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPostPreview[]>([]);
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [copiedPosts, setCopiedPosts] = useState<Set<number>>(new Set());

  // Update defaults when settings load
  useEffect(() => {
    if (settings.id) {
      setPostType(settings.default_post_type as PostType);
      setPostLength(settings.default_post_length as PostLength);
      setNumberOfPosts(settings.default_posts_per_source);
      setMediaFormat((settings.default_media_format as MediaFormat) || "text_only");
      setGenerateMixedTypes(settings.generate_mixed_types || false);
      if (settings.enabled_post_types?.length) {
        setSelectedPostTypes(settings.enabled_post_types as PostType[]);
      }
    }
  }, [settings.id, settings.default_post_type, settings.default_post_length, settings.default_posts_per_source, settings.default_media_format, settings.generate_mixed_types, settings.enabled_post_types]);

  const { sources } = useContentSources(brand.id);
  const { generatePosts, savePost } = useGeneratedPosts(brand.id);

  const handleTogglePostType = (type: PostType) => {
    setSelectedPostTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleGenerate = async () => {
    if (!requireKey()) return;
    const source = sources.find(s => s.id === selectedSource);

    const input: GeneratePostsInput = {
      brand,
      source: source ? {
        id: source.id,
        name: source.name,
        source_type: source.source_type,
        url: source.url,
        content: source.content,
        topic: source.topic,
        funnel_stage: source.funnel_stage,
      } : undefined,
      postType,
      postTypes: generateMixedTypes ? selectedPostTypes : undefined,
      postLength,
      numberOfPosts: generateMixedTypes ? selectedPostTypes.length : numberOfPosts,
      mediaFormat,
      generateMixedTypes,
      persistToDrafts: true, // Save drafts server-side
    };

    try {
      console.log("[generate] Starting generation with input:", input);
      const result = await generatePosts.mutateAsync(input);
      const posts = result.posts || [];
      console.log("[generate] Generation result:", { 
        postsCount: posts.length, 
        persisted: result.persisted,
        persistError: result.persistError 
      });
      
      setGeneratedPosts(posts);
      setStep("results");
      setCopiedPosts(new Set());

      if (posts.length === 0) {
        toast.warning("No posts were generated");
        return;
      }

      // Posts are already saved server-side when persisted=true
      if (result.persisted) {
        setSavedPosts(new Set(posts.map((_: any, i: number) => i)));
        toast.success(`Generated and saved ${posts.length} post${posts.length > 1 ? 's' : ''} to drafts`);
        
        if (result.persistError) {
          console.error("[generate] Persist error:", result.persistError);
          toast.warning("Some posts may not have saved correctly");
        }
      } else {
        // Fallback: posts weren't persisted server-side
        setSavedPosts(new Set());
        toast.success(`Generated ${posts.length} post${posts.length > 1 ? 's' : ''}`);
        console.warn("[generate] Posts were not persisted server-side");
      }
    } catch (error) {
      console.error("[generate] Generation failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate posts");
    }
  };

  const handleSaveAll = async () => {
    const source = sources.find(s => s.id === selectedSource);
    const unsavedIndices = generatedPosts.map((_, i) => i).filter(i => !savedPosts.has(i));
    
    if (unsavedIndices.length === 0) {
      toast.info("All posts are already saved");
      return;
    }

    setIsSavingAll(true);
    const newSavedIndices = new Set(savedPosts);
    const errors: string[] = [];

    for (const index of unsavedIndices) {
      const post = generatedPosts[index];
      try {
        await savePost.mutateAsync({
          brand_id: brand.id,
          source_id: source?.id,
          post_type: post.postType || postType,
          hook: post.hook,
          body: post.body,
          cta: post.cta,
          post_length: postLength,
          media_format: mediaFormat,
          carousel_slides: post.carouselSlides,
        });
        newSavedIndices.add(index);
        setSavedPosts(new Set(newSavedIndices));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`Failed to save post ${index + 1}:`, err);
        errors.push(`Post ${index + 1}: ${errorMsg}`);
        toast.error(`Failed to save post ${index + 1}: ${errorMsg}`);
      }
    }

    setIsSavingAll(false);
    const savedCount = newSavedIndices.size - savedPosts.size;
    if (savedCount > 0) {
      toast.success(`${savedCount} post${savedCount > 1 ? 's' : ''} saved to drafts`);
    }
  };

  const handleSavePost = async (post: GeneratedPostPreview, index: number) => {
    const source = sources.find(s => s.id === selectedSource);
    const actualPostType = post.postType || postType;

    await savePost.mutateAsync({
      brand_id: brand.id,
      source_id: source?.id,
      post_type: actualPostType,
      hook: post.hook,
      body: post.body,
      cta: post.cta,
      post_length: postLength,
      media_format: mediaFormat,
      carousel_slides: post.carouselSlides,
    });

    setSavedPosts(prev => new Set(prev).add(index));
  };

  const handleCopyPost = async (post: GeneratedPostPreview, index: number) => {
    let fullPost = `${post.hook}\n\n${post.body}${post.cta ? `\n\n${post.cta}` : ""}`;
    if (post.pollOptions?.length) {
      fullPost += `\n\n📊 Poll Options:\n${post.pollOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`;
    }
    await navigator.clipboard.writeText(fullPost);
    setCopiedPosts(prev => new Set(prev).add(index));
    toast.success("Copied to clipboard");
    setTimeout(() => {
      setCopiedPosts(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }, 2000);
  };

  const resetDialog = () => {
    setStep("config");
    setGeneratedPosts([]);
    setSavedPosts(new Set());
    setCopiedPosts(new Set());
    setIsSavingAll(false);
  };

  const getPostTypeLabel = (type: PostType) => {
    return POST_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Posts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {step === "config" ? "Generate Instagram Content" : "Generated Content"}
          </DialogTitle>
        </DialogHeader>

        {step === "config" ? (
          <div className="space-y-6">
            {/* Source Selection */}
            <div className="space-y-2">
              <Label>Content Source (Optional)</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a source for inspiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No source - Generate from brand voice</SelectItem>
                  {sources.filter(s => s.is_active).map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} ({source.source_type.replace("_", " ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a source to base the post on, or generate purely from your brand voice
              </p>
            </div>

            {/* Generate Mixed Types Toggle */}
            <div className="flex items-center justify-between p-4 border-2 border-border bg-secondary/20">
              <div className="space-y-0.5">
                <Label className="font-medium">Generate Mixed Types</Label>
                <p className="text-xs text-muted-foreground">Generate one post per selected type</p>
              </div>
              <Switch
                checked={generateMixedTypes}
                onCheckedChange={setGenerateMixedTypes}
              />
            </div>

            {/* Post Type Selection */}
            <div className="space-y-2">
              <Label>{generateMixedTypes ? "Select Post Types to Generate" : "Post Type"}</Label>
              
              {generateMixedTypes ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {POST_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedPostTypes.includes(type.value);
                    return (
                      <div
                        key={type.value}
                        onClick={() => handleTogglePostType(type.value)}
                        className={`p-3 border-2 cursor-pointer transition-all flex items-start gap-2 ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Checkbox 
                          checked={isSelected}
                          className="mt-0.5"
                        />
                        <div>
                          <Icon className="h-4 w-4 mb-1" />
                          <div className="text-xs font-medium">{type.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {POST_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setPostType(type.value)}
                        className={`p-3 border-2 text-left transition-all ${
                          postType === type.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <div className="text-xs font-medium">{type.label}</div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                {generateMixedTypes 
                  ? `${selectedPostTypes.length} types selected - will generate ${selectedPostTypes.length} posts`
                  : POST_TYPES.find(t => t.value === postType)?.description
                }
              </p>
            </div>

            {/* Media Format */}
            <div className="space-y-2">
              <Label>Media Format</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {MEDIA_FORMATS.map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.value}
                      type="button"
                      onClick={() => setMediaFormat(format.value)}
                      className={`p-3 border-2 text-center transition-all ${
                        mediaFormat === format.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-4 w-4 mx-auto mb-1" />
                      <div className="text-xs font-medium">{format.label}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {MEDIA_FORMATS.find(f => f.value === mediaFormat)?.description}
              </p>
            </div>

            {/* Post Length */}
            <div className="space-y-2">
              <Label>Post Length</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["short", "medium", "long"] as PostLength[]).map((length) => (
                  <button
                    key={length}
                    type="button"
                    onClick={() => setPostLength(length)}
                    className={`p-3 border-2 text-center capitalize transition-all ${
                      postLength === length
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {length}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Posts (only show when not mixed types) */}
            {!generateMixedTypes && (
              <div className="space-y-2">
                <Label>Number of Posts: {numberOfPosts}</Label>
                <Slider
                  value={[numberOfPosts]}
                  onValueChange={(v) => setNumberOfPosts(v[0])}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
            )}

            {/* Brand Voice Preview */}
            <Card className="bg-secondary/30">
              <CardContent className="p-4">
                <div className="text-xs font-medium mb-2">Brand Voice</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{brand.tone || "professional"}</Badge>
                  <Badge variant="outline">{brand.writing_style?.replace("_", " ") || "short punchy"}</Badge>
                  <Badge variant="outline">Emoji: {brand.emoji_usage || "minimal"}</Badge>
                  <Badge variant="secondary">{MEDIA_FORMATS.find(f => f.value === mediaFormat)?.label}</Badge>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full" 
              onClick={handleGenerate}
              disabled={generatePosts.isPending}
            >
              {generatePosts.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate {generateMixedTypes ? selectedPostTypes.length : numberOfPosts} Post{(generateMixedTypes ? selectedPostTypes.length : numberOfPosts) > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" onClick={resetDialog}>
                ← Generate More
              </Button>
              
              <div className="flex items-center gap-2">
                {isSavingAll && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                )}
                <Badge variant={savedPosts.size === generatedPosts.length ? "default" : "secondary"}>
                  {savedPosts.size}/{generatedPosts.length} saved
                </Badge>
                {savedPosts.size < generatedPosts.length && (
                  <Button 
                    size="sm" 
                    onClick={handleSaveAll}
                    disabled={isSavingAll}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save All
                  </Button>
                )}
              </div>
            </div>

            <Tabs defaultValue="0">
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                {generatedPosts.map((post, index) => (
                  <TabsTrigger key={index} value={index.toString()} className="flex items-center gap-1">
                    Post {index + 1}
                    {post.postType && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        {getPostTypeLabel(post.postType)}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {generatedPosts.map((post, index) => (
                <TabsContent key={index} value={index.toString()} className="space-y-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      {/* Post Type Badge */}
                      {post.postType && (
                        <Badge variant="outline">
                          {getPostTypeLabel(post.postType)}
                        </Badge>
                      )}

                      {/* Hook */}
                      <div>
                        <Label className="text-xs text-muted-foreground">HOOK</Label>
                        <p className="font-semibold text-lg">{post.hook}</p>
                      </div>

                      {/* Body */}
                      <div>
                        <Label className="text-xs text-muted-foreground">BODY</Label>
                        <p className="whitespace-pre-wrap">{post.body}</p>
                      </div>

                      {/* CTA */}
                      {post.cta && (
                        <div>
                          <Label className="text-xs text-muted-foreground">CTA</Label>
                          <p className="font-medium">{post.cta}</p>
                        </div>
                      )}

                      {/* Poll Options (for poll format) */}
                      {post.pollOptions && post.pollOptions.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">POLL OPTIONS</Label>
                          <div className="space-y-1 mt-1">
                            {post.pollOptions.map((option, i) => (
                              <div key={i} className="p-2 border border-border bg-secondary/20 text-sm">
                                {i + 1}. {option}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Carousel Slides (for carousel format) */}
                      {post.carouselSlides && post.carouselSlides.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <CarouselSlidesEditor 
                            slides={post.carouselSlides} 
                            readOnly={true}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleCopyPost(post, index)}
                      disabled={copiedPosts.has(index)}
                    >
                      {copiedPosts.has(index) ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleSavePost(post, index)}
                      disabled={savedPosts.has(index) || savePost.isPending}
                    >
                      {savedPosts.has(index) ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Saved
                        </>
                      ) : savePost.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save to Drafts
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
