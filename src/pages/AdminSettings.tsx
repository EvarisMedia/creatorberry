import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAISettings, AI_MODELS, SETTING_KEYS } from "@/hooks/useAISettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  Users,
  Brain,
  Settings,
  LogOut,
  Loader2,
  MessageSquare,
  Image,
  Database,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Brain, label: "AI Training", href: "/admin/training" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

interface ModelConfigCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  settingKey: string;
  models: typeof AI_MODELS.text_generation;
  currentValue: string | undefined;
  onUpdate: (value: string) => void;
  isUpdating: boolean;
  lastUpdated?: string;
}

function ModelConfigCard({
  title,
  description,
  icon,
  models,
  currentValue,
  onUpdate,
  isUpdating,
  lastUpdated,
}: ModelConfigCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={currentValue}
          onValueChange={onUpdate}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                <div className="flex flex-col">
                  <span>{model.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin, isLoading: authLoading } = useAuth();
  const { settings, isLoading, updateSetting, getSettingValue, getSetting } = useAISettings();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    navigate("/dashboard");
    return null;
  }

  const handleUpdateSetting = (key: string) => (value: string) => {
    updateSetting.mutate({ key, value });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>

          <nav className="flex-1 px-4">
            {sidebarItems.map((item) => (
              <Button
                key={item.href}
                variant={item.href === "/admin/settings" ? "secondary" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={() => navigate(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || "Admin"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">AI Model Configuration</h1>
            <p className="text-muted-foreground mt-1">
              Configure which AI models to use for different tasks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModelConfigCard
              title="Post Generation"
              description="Model used for generating LinkedIn posts"
              icon={<MessageSquare className="h-5 w-5 text-primary" />}
              settingKey={SETTING_KEYS.POST_GENERATION}
              models={AI_MODELS.text_generation}
              currentValue={getSettingValue(SETTING_KEYS.POST_GENERATION)}
              onUpdate={handleUpdateSetting(SETTING_KEYS.POST_GENERATION)}
              isUpdating={updateSetting.isPending}
              lastUpdated={getSetting(SETTING_KEYS.POST_GENERATION)?.updated_at}
            />

            <ModelConfigCard
              title="Image Generation"
              description="Model used for generating branded images"
              icon={<Image className="h-5 w-5 text-primary" />}
              settingKey={SETTING_KEYS.IMAGE_GENERATION}
              models={AI_MODELS.image_generation}
              currentValue={getSettingValue(SETTING_KEYS.IMAGE_GENERATION)}
              onUpdate={handleUpdateSetting(SETTING_KEYS.IMAGE_GENERATION)}
              isUpdating={updateSetting.isPending}
              lastUpdated={getSetting(SETTING_KEYS.IMAGE_GENERATION)?.updated_at}
            />

            <ModelConfigCard
              title="Embeddings"
              description="Model used for generating vector embeddings"
              icon={<Database className="h-5 w-5 text-primary" />}
              settingKey={SETTING_KEYS.EMBEDDINGS}
              models={AI_MODELS.embeddings}
              currentValue={getSettingValue(SETTING_KEYS.EMBEDDINGS)}
              onUpdate={handleUpdateSetting(SETTING_KEYS.EMBEDDINGS)}
              isUpdating={updateSetting.isPending}
              lastUpdated={getSetting(SETTING_KEYS.EMBEDDINGS)?.updated_at}
            />

            <ModelConfigCard
              title="Document Processing"
              description="Model used for processing training documents"
              icon={<FileText className="h-5 w-5 text-primary" />}
              settingKey={SETTING_KEYS.DOCUMENT_PROCESSING}
              models={AI_MODELS.text_generation}
              currentValue={getSettingValue(SETTING_KEYS.DOCUMENT_PROCESSING)}
              onUpdate={handleUpdateSetting(SETTING_KEYS.DOCUMENT_PROCESSING)}
              isUpdating={updateSetting.isPending}
              lastUpdated={getSetting(SETTING_KEYS.DOCUMENT_PROCESSING)?.updated_at}
            />
          </div>

          {/* Model Info */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Available Models</CardTitle>
              <CardDescription>
                Overview of all available AI models and their characteristics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Text Generation Models</h3>
                  <div className="grid gap-2">
                    {AI_MODELS.text_generation.map((model) => (
                      <div
                        key={model.value}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="font-medium text-sm">{model.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Image Generation Models</h3>
                  <div className="grid gap-2">
                    {AI_MODELS.image_generation.map((model) => (
                      <div
                        key={model.value}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="font-medium text-sm">{model.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
