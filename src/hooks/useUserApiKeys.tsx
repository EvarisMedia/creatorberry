import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UserApiKeys {
  id?: string;
  gemini_api_key: string | null;
  preferred_text_model: string;
  preferred_image_model: string;
}

const DEFAULT_KEYS: UserApiKeys = {
  gemini_api_key: null,
  preferred_text_model: "gemini-2.5-flash",
  preferred_image_model: "gemini-2.0-flash-exp-image-generation",
};

export function useUserApiKeys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<UserApiKeys>(DEFAULT_KEYS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchKeys();
  }, [user]);

  const fetchKeys = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_api_keys" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setKeys({
          id: (data as any).id,
          gemini_api_key: (data as any).gemini_api_key,
          preferred_text_model: (data as any).preferred_text_model || DEFAULT_KEYS.preferred_text_model,
          preferred_image_model: (data as any).preferred_image_model || DEFAULT_KEYS.preferred_image_model,
        });
      }
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const maskedKey = keys.gemini_api_key
    ? `${"•".repeat(Math.max(0, keys.gemini_api_key.length - 4))}${keys.gemini_api_key.slice(-4)}`
    : null;

  const saveKeys = async (updates: Partial<UserApiKeys>) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        ...updates,
      };

      if (keys.id) {
        const { error } = await supabase
          .from("user_api_keys" as any)
          .update(payload)
          .eq("id", keys.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_api_keys" as any)
          .insert(payload);
        if (error) throw error;
      }

      await fetchKeys();
      toast({ title: "Settings saved", description: "Your AI configuration has been updated." });
    } catch (err) {
      console.error("Failed to save API keys:", err);
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (!keys.gemini_api_key) {
      toast({ title: "No API key", description: "Please save your Gemini API key first.", variant: "destructive" });
      return false;
    }
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-api-key", {
        body: { apiKey: keys.gemini_api_key },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Connection successful", description: "Your Gemini API key is valid." });
        return true;
      } else {
        toast({ title: "Connection failed", description: data?.error || "Invalid API key.", variant: "destructive" });
        return false;
      }
    } catch (err) {
      toast({ title: "Test failed", description: "Could not verify the API key.", variant: "destructive" });
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  return {
    keys,
    maskedKey,
    isLoading,
    isSaving,
    isTesting,
    isConfigured: !!keys.gemini_api_key,
    saveKeys,
    testConnection,
  };
}
