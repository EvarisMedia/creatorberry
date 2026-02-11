import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/components/ui/sonner";

export interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface CopilotConversation {
  id: string;
  user_id: string;
  brand_id: string;
  title: string;
  messages: CopilotMessage[];
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useCopilot(brandId: string | null) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<CopilotConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<CopilotConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user || !brandId) {
      setConversations([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("copilot_conversations")
      .select("*")
      .eq("brand_id", brandId)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
    } else {
      const mapped = (data || []).map((d: any) => ({
        ...d,
        messages: (d.messages || []) as CopilotMessage[],
        context: (d.context || {}) as Record<string, any>,
      }));
      setConversations(mapped);
    }
    setIsLoading(false);
  }, [user, brandId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = async (title?: string): Promise<CopilotConversation | null> => {
    if (!user || !brandId) return null;

    const { data, error } = await supabase
      .from("copilot_conversations")
      .insert({
        user_id: user.id,
        brand_id: brandId,
        title: title || "New Conversation",
        messages: [] as any,
        context: {} as any,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create conversation");
      console.error(error);
      return null;
    }

    const convo: CopilotConversation = {
      ...data,
      messages: [],
      context: {},
    };
    setConversations((prev) => [convo, ...prev]);
    setActiveConversation(convo);
    return convo;
  };

  const sendMessage = async (
    content: string,
    brandContext?: Record<string, any>,
    currentPage?: string,
    productContext?: Record<string, any>
  ) => {
    if (!user || !brandId || !content.trim()) return;

    let convo = activeConversation;
    if (!convo) {
      convo = await createConversation(content.slice(0, 50));
      if (!convo) return;
    }

    const userMessage: CopilotMessage = {
      role: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...convo.messages, userMessage];
    setActiveConversation({ ...convo, messages: updatedMessages });

    setIsSending(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("copilot-chat", {
        body: {
          messages: updatedMessages,
          brandContext,
          currentPage,
          productContext,
        },
      });

      if (fnError) throw fnError;

      const assistantMessage: CopilotMessage = {
        role: "assistant",
        content: fnData.reply,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];

      // Auto-title from first message
      const title = convo.messages.length === 0 ? content.slice(0, 60) : convo.title;

      await supabase
        .from("copilot_conversations")
        .update({
          messages: finalMessages as any,
          title,
        })
        .eq("id", convo.id);

      const updatedConvo = { ...convo, messages: finalMessages, title };
      setActiveConversation(updatedConvo);
      setConversations((prev) =>
        prev.map((c) => (c.id === convo!.id ? updatedConvo : c))
      );
    } catch (error: any) {
      console.error("Copilot error:", error);
      toast.error("Failed to get AI response");
    } finally {
      setIsSending(false);
    }
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase
      .from("copilot_conversations")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete conversation");
      return;
    }

    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversation?.id === id) {
      setActiveConversation(null);
    }
  };

  const selectConversation = (convo: CopilotConversation | null) => {
    setActiveConversation(convo);
  };

  const startNewConversation = () => {
    setActiveConversation(null);
  };

  return {
    conversations,
    activeConversation,
    isLoading,
    isSending,
    sendMessage,
    createConversation,
    deleteConversation,
    selectConversation,
    startNewConversation,
  };
}
