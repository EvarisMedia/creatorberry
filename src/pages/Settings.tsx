import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useUserSettings, ALL_POST_TYPES, ALL_MEDIA_FORMATS } from "@/hooks/useUserSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserApiKeys } from "@/hooks/useUserApiKeys";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  FileText,
  Rss,
  Image,
  Calendar,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  LogOut,
  ChevronDown,
  Shield,
  Loader2,
  User,
  Bell,
  Save,
  Sparkles,
  Clock,
  ImageIcon,
  Shuffle,
  Key,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: FileText, label: "Content", href: "/content" },
  { icon: Rss, label: "Sources", href: "/sources" },
  { icon: Image, label: "Images", href: "/images" },
  { icon: Calendar, label: "Schedule", href: "/schedule" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: SettingsIcon, label: "Settings", href: "/settings", active: true },
];

const POST_LENGTHS = [
  { value: "short", label: "Short (~100 words)" },
  { value: "medium", label: "Medium (~200 words)" },
  { value: "long", label: "Long (~300 words)" },
];

const IMAGE_STYLES = [
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "elegant", label: "Elegant" },
  { value: "playful", label: "Playful" },
];

const IMAGE_TYPES = [
  { value: "quote_card", label: "Quote Card" },
  { value: "visual", label: "Visual" },
  { value: "banner", label: "Banner" },
];

const RSS_REFRESH_OPTIONS = [
  { value: "1", label: "Every hour" },
  { value: "6", label: "Every 6 hours" },
  { value: "12", label: "Every 12 hours" },
  { value: "24", label: "Every 24 hours" },
  { value: "48", label: "Every 48 hours" },
];

const FRESHNESS_OPTIONS = [
  { value: "1", label: "1 day" },
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
];

const POSTING_TIMES = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

const REMINDER_OPTIONS = [
  { value: "0", label: "No reminder" },
  { value: "1", label: "1 hour before" },
  { value: "2", label: "2 hours before" },
  { value: "24", label: "1 day before" },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { brands, currentBrand, isLoading: brandsLoading, selectBrand } = useBrands();
  const { settings, isLoading: settingsLoading, updateSettings } = useUserSettings();
  const { toast } = useToast();

  const { keys, maskedKey, isConfigured, isSaving: isKeysSaving, isTesting, saveKeys, testConnection } = useUserApiKeys();

  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
    if (!isLoading && user && !profile?.is_approved) {
      navigate("/pending-approval");
    }
  }, [user, profile, isLoading, navigate]);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: string, value: unknown) => {
    updateSettings.mutate({ [key]: value });
  };

  const handleTogglePostType = (postType: string) => {
    const currentEnabled = settings.enabled_post_types || [];
    let newEnabled: string[];
    
    if (currentEnabled.includes(postType)) {
      if (currentEnabled.length === 1) return; // Keep at least one
      newEnabled = currentEnabled.filter(t => t !== postType);
    } else {
      newEnabled = [...currentEnabled, postType];
    }
    
    handleSettingChange("enabled_post_types", newEnabled);
  };

  if (isLoading || brandsLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r-2 border-foreground bg-background flex flex-col">
        <div className="p-4 border-b-2 border-foreground">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground" />
            <span className="font-bold">Creator OS</span>
          </Link>
        </div>

        <div className="p-4 border-b-2 border-foreground">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 border-2 border-foreground hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  {currentBrand?.logo_url ? (
                    <img
                      src={currentBrand.logo_url}
                      alt={currentBrand.name}
                      className="w-8 h-8 object-cover border border-foreground"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 flex items-center justify-center font-bold text-sm border border-foreground"
                      style={{ backgroundColor: currentBrand?.primary_color || "#000" }}
                    >
                      <span style={{ color: currentBrand?.secondary_color || "#FFF" }}>
                        {currentBrand?.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-medium text-sm truncate max-w-[120px]">
                      {currentBrand?.name || "No Brand"}
                    </div>
                    <div className="text-xs text-muted-foreground">Workspace</div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {brands.map((brand) => (
                <DropdownMenuItem
                  key={brand.id}
                  onClick={() => selectBrand(brand.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} className="w-6 h-6 object-cover" />
                    ) : (
                      <div
                        className="w-6 h-6 flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: brand.primary_color }}
                      >
                        <span style={{ color: brand.secondary_color }}>{brand.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="truncate">{brand.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/brands/new" className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Brand
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {sidebarItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                    item.active ? "bg-foreground text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-border">
              <Link
                to="/admin/users"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t-2 border-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-secondary border-2 border-foreground flex items-center justify-center font-bold text-sm">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="text-sm">
                <div className="font-medium">{profile?.full_name || "User"}</div>
                <div className="text-xs text-muted-foreground">Pro Plan</div>
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2 hover:bg-secondary transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="p-6 border-b-2 border-foreground">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </header>

        <div className="p-6 max-w-3xl space-y-6">
          {/* Profile Section */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="border-2 border-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="border-2 border-foreground bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label>Account Created</Label>
                <p className="text-sm text-muted-foreground">
                  {user?.created_at ? format(new Date(user.created_at), "MMMM d, yyyy") : "Unknown"}
                </p>
              </div>

              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* AI Configuration Section */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>
                Connect your own Gemini API key for AI features.{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline inline-flex items-center gap-1"
                >
                  Get a key <ExternalLink className="w-3 h-3" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key */}
              <div className="space-y-2">
                <Label>Gemini API Key</Label>
                {isConfigured && !showApiKeyInput ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 p-2 border-2 border-foreground bg-muted font-mono text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="truncate">{maskedKey}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApiKeyInput(true)}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      placeholder="AIza..."
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="border-2 border-foreground font-mono"
                    />
                    <Button
                      onClick={async () => {
                        if (!apiKeyInput.trim()) return;
                        await saveKeys({ gemini_api_key: apiKeyInput.trim() });
                        setApiKeyInput("");
                        setShowApiKeyInput(false);
                      }}
                      disabled={isKeysSaving || !apiKeyInput.trim()}
                    >
                      {isKeysSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    {showApiKeyInput && (
                      <Button variant="outline" size="sm" onClick={() => { setShowApiKeyInput(false); setApiKeyInput(""); }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Your key is stored securely and used to call Google Gemini directly.
                </p>
              </div>

              {/* Test connection */}
              {isConfigured && (
                <Button
                  variant="outline"
                  onClick={testConnection}
                  disabled={isTesting}
                  className="border-2 border-foreground"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </Button>
              )}

              {/* Model Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Text Model</Label>
                  <Select
                    value={keys.preferred_text_model}
                    onValueChange={(value) => saveKeys({ preferred_text_model: value })}
                  >
                    <SelectTrigger className="border-2 border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Best quality)</SelectItem>
                      <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Fastest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Image Model</Label>
                  <Select
                    value={keys.preferred_image_model}
                    onValueChange={(value) => saveKeys({ preferred_image_model: value })}
                  >
                    <SelectTrigger className="border-2 border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.5-flash-image-preview">Gemini 2.5 Flash Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!isConfigured && (
                <div className="flex items-start gap-2 p-3 bg-muted border-2 border-border">
                  <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    No API key configured. AI features will use the default system key with shared rate limits. Add your own key for unlimited usage.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Generation Section */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Content Generation
              </CardTitle>
              <CardDescription>Default settings for post generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Posts per Source</Label>
                  <span className="text-sm font-medium">{settings.default_posts_per_source}</span>
                </div>
                <Slider
                  value={[settings.default_posts_per_source]}
                  onValueChange={([value]) => handleSettingChange("default_posts_per_source", value)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Number of posts to generate from a single source</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Post Length</Label>
                  <Select
                    value={settings.default_post_length}
                    onValueChange={(value) => handleSettingChange("default_post_length", value)}
                  >
                    <SelectTrigger className="border-2 border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_LENGTHS.map((length) => (
                        <SelectItem key={length.value} value={length.value}>
                          {length.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Post Type</Label>
                  <Select
                    value={settings.default_post_type}
                    onValueChange={(value) => handleSettingChange("default_post_type", value)}
                  >
                    <SelectTrigger className="border-2 border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_POST_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Default Media Format</Label>
                <Select
                  value={settings.default_media_format || "text_only"}
                  onValueChange={(value) => handleSettingChange("default_media_format", value)}
                >
                  <SelectTrigger className="border-2 border-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_MEDIA_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label} - {format.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Instagram media format for generated posts</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>AI Creativity Level</Label>
                  <span className="text-sm font-medium">
                    {settings.ai_creativity_level <= 0.3 ? "Conservative" : 
                     settings.ai_creativity_level <= 0.6 ? "Balanced" : 
                     settings.ai_creativity_level <= 0.8 ? "Creative" : "Very Creative"}
                  </span>
                </div>
                <Slider
                  value={[settings.ai_creativity_level]}
                  onValueChange={([value]) => handleSettingChange("ai_creativity_level", value)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Higher creativity means more varied and unique content</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Always Include CTA</Label>
                  <p className="text-xs text-muted-foreground">Add call-to-action to all generated posts</p>
                </div>
                <Switch
                  checked={settings.always_include_cta}
                  onCheckedChange={(checked) => handleSettingChange("always_include_cta", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Multi-Type Generation Section */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="w-5 h-5" />
                Multi-Type Generation
              </CardTitle>
              <CardDescription>Configure mixed post type generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Generate Mixed Types by Default</Label>
                  <p className="text-xs text-muted-foreground">Generate one post per selected type instead of multiple of one type</p>
                </div>
                <Switch
                  checked={settings.generate_mixed_types || false}
                  onCheckedChange={(checked) => handleSettingChange("generate_mixed_types", checked)}
                />
              </div>

              <div className="space-y-3">
                <Label>Enabled Post Types</Label>
                <p className="text-xs text-muted-foreground">Select which post types to include when generating mixed types</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ALL_POST_TYPES.map((type) => {
                    const isEnabled = (settings.enabled_post_types || []).includes(type.value);
                    return (
                      <div
                        key={type.value}
                        onClick={() => handleTogglePostType(type.value)}
                        className={`p-3 border-2 cursor-pointer transition-all flex items-center gap-2 ${
                          isEnabled
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Checkbox checked={isEnabled} />
                        <span className="text-sm">{type.label}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(settings.enabled_post_types || []).length} of {ALL_POST_TYPES.length} types enabled
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Scheduling Preferences Section */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Scheduling Preferences
              </CardTitle>
              <CardDescription>Configure your posting schedule defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Preferred Posting Time</Label>
                <Select
                  value={settings.preferred_posting_times[0] || "09:00"}
                  onValueChange={(value) => handleSettingChange("preferred_posting_times", [value])}
                >
                  <SelectTrigger className="border-2 border-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSTING_TIMES.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Default time when scheduling posts</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Posts Per Week Goal</Label>
                  <span className="text-sm font-medium">{settings.posts_per_week_goal}</span>
                </div>
                <Slider
                  value={[settings.posts_per_week_goal]}
                  onValueChange={([value]) => handleSettingChange("posts_per_week_goal", value)}
                  min={1}
                  max={14}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Schedule Approved Posts</Label>
                  <p className="text-xs text-muted-foreground">Automatically schedule posts when approved</p>
                </div>
                <Switch
                  checked={settings.auto_schedule_approved}
                  onCheckedChange={(checked) => handleSettingChange("auto_schedule_approved", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Weekends</Label>
                  <p className="text-xs text-muted-foreground">Allow scheduling posts on weekends</p>
                </div>
                <Switch
                  checked={settings.include_weekends}
                  onCheckedChange={(checked) => handleSettingChange("include_weekends", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Source Management Section */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rss className="w-5 h-5" />
                Source Management
              </CardTitle>
              <CardDescription>Configure RSS and source fetching behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>RSS Refresh Interval</Label>
                  <Select
                    value={settings.rss_refresh_hours.toString()}
                    onValueChange={(value) => handleSettingChange("rss_refresh_hours", parseInt(value))}
                  >
                    <SelectTrigger className="border-2 border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RSS_REFRESH_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Content Freshness</Label>
                  <Select
                    value={settings.content_freshness_days.toString()}
                    onValueChange={(value) => handleSettingChange("content_freshness_days", parseInt(value))}
                  >
                    <SelectTrigger className="border-2 border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FRESHNESS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Only use content published within this period</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Max Items Per Fetch</Label>
                  <span className="text-sm font-medium">{settings.max_items_per_fetch}</span>
                </div>
                <Slider
                  value={[settings.max_items_per_fetch]}
                  onValueChange={([value]) => handleSettingChange("max_items_per_fetch", value)}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Generate from New RSS Items</Label>
                  <p className="text-xs text-muted-foreground">Automatically create posts when new content is fetched</p>
                </div>
                <Switch
                  checked={settings.auto_generate_from_rss}
                  onCheckedChange={(checked) => handleSettingChange("auto_generate_from_rss", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Image Preferences Section */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Image Preferences
              </CardTitle>
              <CardDescription>Default settings for image generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Image Style</Label>
                  <Select
                    value={settings.default_image_style}
                    onValueChange={(value) => handleSettingChange("default_image_style", value)}
                  >
                    <SelectTrigger className="border-2 border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Image Type</Label>
                  <Select
                    value={settings.default_image_type}
                    onValueChange={(value) => handleSettingChange("default_image_type", value)}
                  >
                    <SelectTrigger className="border-2 border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Generate Images</Label>
                  <p className="text-xs text-muted-foreground">Automatically create images when generating posts</p>
                </div>
                <Switch
                  checked={settings.auto_generate_images}
                  onCheckedChange={(checked) => handleSettingChange("auto_generate_images", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive email updates about your account</p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => handleSettingChange("email_notifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-xs text-muted-foreground">Receive a weekly summary of your content performance</p>
                </div>
                <Switch
                  checked={settings.weekly_digest}
                  onCheckedChange={(checked) => handleSettingChange("weekly_digest", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Scheduled Post Reminder</Label>
                <Select
                  value={settings.scheduled_post_reminder_hours.toString()}
                  onValueChange={(value) => handleSettingChange("scheduled_post_reminder_hours", parseInt(value))}
                >
                  <SelectTrigger className="border-2 border-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Get reminded before scheduled posts go live</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Source Content Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified when new content is fetched from sources</p>
                </div>
                <Switch
                  checked={settings.new_source_content_alerts}
                  onCheckedChange={(checked) => handleSettingChange("new_source_content_alerts", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Section */}
          <Card className="border-2 border-foreground">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Sign Out</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Sign out of your account on this device
                </p>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
