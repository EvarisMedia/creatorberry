import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Loader2, 
  Palette, 
  Mic, 
  Globe,
  Sparkles,
  Check
} from "lucide-react";

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

const toneOptions = [
  { value: "professional", label: "Professional", description: "Polished and authoritative" },
  { value: "conversational", label: "Conversational", description: "Friendly and approachable" },
  { value: "bold", label: "Bold", description: "Direct and impactful" },
  { value: "opinionated", label: "Opinionated", description: "Strong takes and hot takes" },
];

const emojiOptions = [
  { value: "none", label: "None", description: "No emojis" },
  { value: "minimal", label: "Minimal", description: "1-2 per post" },
  { value: "moderate", label: "Moderate", description: "3-5 per post" },
];

const writingStyles = [
  { value: "short_punchy", label: "Short & Punchy", description: "Quick, impactful lines" },
  { value: "long_form", label: "Long-form", description: "Deep, detailed insights" },
  { value: "story_driven", label: "Story-driven", description: "Narrative-based content" },
];

const CreateBrand = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Form state
  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [secondaryColor, setSecondaryColor] = useState("#FFFFFF");
  const [timezone, setTimezone] = useState("UTC");
  const [tone, setTone] = useState("professional");
  const [emojiUsage, setEmojiUsage] = useState("minimal");
  const [writingStyle, setWritingStyle] = useState("short_punchy");
  
  // Brand Knowledge
  const [about, setAbout] = useState("");
  const [coreBeliefs, setCoreBeliefs] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
    if (!isLoading && user && !profile?.is_approved) {
      navigate("/pending-approval");
    }
  }, [user, profile, isLoading, navigate]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo must be less than 5MB");
        return;
      }
      setLogoFile(file);
      setLogoUrl(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user) return null;
    
    setUploadingLogo(true);
    const fileExt = logoFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from("brand-logos")
      .upload(fileName, logoFile);
    
    setUploadingLogo(false);
    
    if (error) {
      toast.error("Failed to upload logo");
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from("brand-logos")
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (!brandName.trim()) {
      toast.error("Brand name is required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          finalLogoUrl = uploadedUrl;
        }
      }
      
      const { data, error } = await supabase
        .from("brands")
        .insert({
          user_id: user.id,
          name: brandName,
          logo_url: finalLogoUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          timezone,
          tone: tone as "professional" | "conversational" | "bold" | "opinionated",
          emoji_usage: emojiUsage as "none" | "minimal" | "moderate",
          writing_style: writingStyle as "short_punchy" | "long_form" | "story_driven",
          about: about || null,
          core_beliefs: coreBeliefs || null,
          target_audience: targetAudience || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Brand created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to create brand");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-foreground">
        <div className="container px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground" />
            <span className="font-bold">Creator OS</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="container px-4 py-12 max-w-3xl">
        {/* Progress */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-10 h-10 border-2 border-foreground font-mono text-sm transition-colors ${
                  s === step 
                    ? "bg-foreground text-primary-foreground" 
                    : s < step 
                    ? "bg-foreground text-primary-foreground"
                    : "bg-background"
                }`}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
          <div className="h-2 bg-secondary border-2 border-foreground">
            <div 
              className="h-full bg-foreground transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card className="border-2 border-foreground shadow-md">
            <CardHeader className="border-b-2 border-foreground">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-foreground flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle>Brand Basics</CardTitle>
                  <CardDescription>Name your brand and add a logo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name *</Label>
                <Input
                  id="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="My Personal Brand"
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Logo (Optional)</Label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 border-2 border-foreground flex items-center justify-center bg-secondary overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      <Button type="button" variant="outline" className="cursor-pointer" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </span>
                      </Button>
                    </label>
                    <p className="text-sm text-muted-foreground mt-2">
                      PNG, JPG up to 5MB. Square format recommended.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Step 2: Colors & Timezone */}
        {step === 2 && (
          <Card className="border-2 border-foreground shadow-md">
            <CardHeader className="border-b-2 border-foreground">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-foreground flex items-center justify-center">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle>Colors & Location</CardTitle>
                  <CardDescription>Define your brand colors and timezone</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 border-2 border-foreground cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-12 font-mono uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-12 border-2 border-foreground cursor-pointer"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-12 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
              
              {/* Color Preview */}
              <div className="p-4 border-2 border-foreground">
                <p className="text-sm text-muted-foreground mb-2">Preview</p>
                <div className="flex gap-2">
                  <div 
                    className="flex-1 h-16 border-2 border-foreground flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: primaryColor, color: secondaryColor }}
                  >
                    Primary
                  </div>
                  <div 
                    className="flex-1 h-16 border-2 border-foreground flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: secondaryColor, color: primaryColor }}
                  >
                    Secondary
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Timezone
                </Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Step 3: Voice & Tone */}
        {step === 3 && (
          <Card className="border-2 border-foreground shadow-md">
            <CardHeader className="border-b-2 border-foreground">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-foreground flex items-center justify-center">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle>Brand Voice</CardTitle>
                  <CardDescription>Define how your content should sound</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label>Tone</Label>
                <div className="grid grid-cols-2 gap-3">
                  {toneOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTone(option.value)}
                      className={`p-4 border-2 border-foreground text-left transition-all ${
                        tone === option.value 
                          ? "bg-foreground text-primary-foreground shadow-sm" 
                          : "hover:bg-secondary"
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className={`text-sm ${tone === option.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Emoji Usage</Label>
                <div className="grid grid-cols-3 gap-3">
                  {emojiOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEmojiUsage(option.value)}
                      className={`p-4 border-2 border-foreground text-left transition-all ${
                        emojiUsage === option.value 
                          ? "bg-foreground text-primary-foreground shadow-sm" 
                          : "hover:bg-secondary"
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className={`text-sm ${emojiUsage === option.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Writing Style</Label>
                <div className="grid grid-cols-3 gap-3">
                  {writingStyles.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setWritingStyle(option.value)}
                      className={`p-4 border-2 border-foreground text-left transition-all ${
                        writingStyle === option.value 
                          ? "bg-foreground text-primary-foreground shadow-sm" 
                          : "hover:bg-secondary"
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className={`text-sm ${writingStyle === option.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Step 4: Brand Knowledge */}
        {step === 4 && (
          <Card className="border-2 border-foreground shadow-md">
            <CardHeader className="border-b-2 border-foreground">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-foreground flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle>Brand Knowledge</CardTitle>
                  <CardDescription>Help AI understand your brand better (optional)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="about">About Your Brand</Label>
                <Textarea
                  id="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="What does your brand stand for? What's your mission?"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="coreBeliefs">Core Beliefs & Opinions</Label>
                <Textarea
                  id="coreBeliefs"
                  value={coreBeliefs}
                  onChange={(e) => setCoreBeliefs(e.target.value)}
                  placeholder="What strong opinions do you hold? What do you believe that others might not?"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Textarea
                  id="targetAudience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Who are you trying to reach? What are their pain points?"
                  rows={3}
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                You can add more details later including signature frameworks, offers, and services.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
            className="shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {step < 4 ? (
            <Button onClick={nextStep} className="shadow-sm">
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || uploadingLogo}
              className="shadow-sm"
            >
              {(isSubmitting || uploadingLogo) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create Brand
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateBrand;
