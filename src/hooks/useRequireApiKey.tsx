import { useUserApiKeys } from "@/hooks/useUserApiKeys";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function useRequireApiKey() {
  const { isConfigured, isLoading } = useUserApiKeys();
  const { toast } = useToast();
  const navigate = useNavigate();

  const requireKey = () => {
    if (isLoading) return true; // Don't block while loading
    if (isConfigured) return true;
    toast({
      title: "API Key Required",
      description: "Please add your Gemini API key in Settings to use AI features.",
      variant: "destructive",
    });
    navigate("/settings");
    return false;
  };

  return { isConfigured, isLoading, requireKey };
}
