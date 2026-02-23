import { useState, useRef, useEffect } from "react";
import { useRequireApiKey } from "@/hooks/useRequireApiKey";
import { Bot, Send, Plus, Trash2, MessageSquare, X, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCopilot, CopilotConversation } from "@/hooks/useCopilot";
import { Brand } from "@/hooks/useBrands";
import { cn } from "@/lib/utils";

interface CopilotChatProps {
  brand: Brand | null;
  currentPage?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CopilotChat({ brand, currentPage, isOpen, onClose }: CopilotChatProps) {
  const {
    conversations,
    activeConversation,
    isSending,
    sendMessage,
    deleteConversation,
    selectConversation,
    startNewConversation,
  } = useCopilot(brand?.id || null);

  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { requireKey } = useRequireApiKey();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    if (!requireKey()) return;
    const msg = input;
    setInput("");
    setShowHistory(false);
    await sendMessage(
      msg,
      brand
        ? {
            name: brand.name,
            target_audience: brand.target_audience,
            tone: brand.tone,
            about: brand.about,
            offers_services: brand.offers_services,
          }
        : undefined,
      currentPage
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const messages = activeConversation?.messages || [];

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        {showHistory ? (
          <>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-sm">Chat History</span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium text-sm">AI Copilot</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-1">
          {!showHistory && (
            <>
              <button
                onClick={() => setShowHistory(true)}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
                title="Chat history"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={startNewConversation}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
                title="New conversation"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showHistory ? (
        /* History View */
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No conversations yet
              </p>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent group text-sm",
                    activeConversation?.id === convo.id && "bg-accent"
                  )}
                >
                  <div
                    className="flex-1 truncate"
                    onClick={() => {
                      selectConversation(convo);
                      setShowHistory(false);
                    }}
                  >
                    {convo.title}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(convo.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      ) : (
        /* Chat View */
        <>
          <ScrollArea className="flex-1 p-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-sm mb-1">AI Copilot</h3>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Ask me about product ideas, content strategy, copywriting, or anything else!
                </p>
                <div className="mt-4 space-y-1.5 w-full">
                  {[
                    "Help me brainstorm product ideas",
                    "How can I improve my sales page?",
                    "Suggest a launch strategy",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                      }}
                      className="w-full text-left text-xs p-2 rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the AI Copilot..."
                className="text-xs h-8"
                disabled={isSending}
              />
              <Button
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || isSending}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
