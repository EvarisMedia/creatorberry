import { Link } from "react-router-dom";
import { AlertTriangle, Settings } from "lucide-react";
import { useUserApiKeys } from "@/hooks/useUserApiKeys";

export function ApiKeyGate() {
  const { isConfigured, isLoading } = useUserApiKeys();

  if (isLoading || isConfigured) return null;

  return (
    <div className="mx-6 mt-4 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <p className="text-sm text-foreground flex-1">
        <strong>API Key Required:</strong> Configure your Gemini API key to use AI features.
      </p>
      <Link
        to="/settings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
      >
        <Settings className="h-3.5 w-3.5" />
        Settings
      </Link>
    </div>
  );
}
