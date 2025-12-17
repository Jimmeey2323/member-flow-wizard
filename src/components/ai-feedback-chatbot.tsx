import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Loader2,
  Sparkles,
  User,
  Bot,
  X,
  CheckCircle,
  AlertCircle,
  Ticket,
  Star,
  Lightbulb,
  Target,
  TrendingUp,
  Wand2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  ticketCreated?: {
    ticketNumber: string;
    title: string;
    category: string;
    priority: string;
  };
  suggestions?: string[];
  analysis?: {
    sentiment: string;
    priority: string;
    category: string;
    tags: string[];
  };
}

interface AIFeedbackChatbotProps {
  onClose?: () => void;
  onAutoFill?: (data: any) => void;
  className?: string;
}

const SYSTEM_PROMPT = `You are an advanced AI assistant for a fitness studio ticketing system. You help staff create tickets, analyze feedback, and provide intelligent recommendations.

Your capabilities:
1. **Feedback Collection**: Extract trainer names, class types, dates, ratings, and specific feedback
2. **Sentiment Analysis**: Categorize feedback as positive, constructive, or complaint
3. **Smart Tagging**: Identify relevant tags like technique, communication, punctuality, motivation, professionalism, safety
4. **Priority Assessment**: Suggest priority based on urgency and impact
5. **Auto-Fill**: Generate structured ticket data that can be auto-filled into forms
6. **Recommendations**: Provide actionable suggestions based on the feedback

When you have enough information to create a ticket, respond with a JSON block:
\`\`\`json
{
  "ready": true,
  "ticketData": {
    "title": "Clear, descriptive title",
    "description": "Formatted description with all details",
    "category": "Category name",
    "subcategory": "Subcategory if applicable", 
    "priority": "low|medium|high|critical",
    "trainerName": "Name if applicable",
    "sentiment": "positive|neutral|negative",
    "tags": ["tag1", "tag2"],
    "recommendations": ["recommendation1", "recommendation2"]
  }
}
\`\`\`

If more info is needed, ask focused questions. Be empathetic, professional, and efficient.`;

const QUICK_ACTIONS = [
  { label: "Report trainer feedback", icon: Star, prompt: "I want to submit feedback about a trainer" },
  { label: "Technical issue", icon: AlertCircle, prompt: "I'm experiencing a technical issue" },
  { label: "Customer complaint", icon: MessageCircle, prompt: "A customer has a complaint" },
  { label: "Suggest improvements", icon: Lightbulb, prompt: "I have suggestions for improvement" },
];

export function AIFeedbackChatbot({ onClose, onAutoFill, className }: AIFeedbackChatbotProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI assistant for the Physique 57 ticketing system. I can help you:\n\n• Create tickets from descriptions\n• Analyze feedback sentiment\n• Suggest categories and priorities\n• Auto-fill forms with structured data\n\nWhat would you like help with today?",
      timestamp: new Date(),
      suggestions: ["Submit trainer feedback", "Report an issue", "Create a ticket", "Get help"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parseAIResponse = (content: string) => {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.ready && parsed.ticketData) {
          return parsed.ticketData;
        }
      } catch (e) {
        console.error("Failed to parse AI JSON:", e);
      }
    }
    return null;
  };

  const createTicket = async (ticketData: any) => {
    setIsCreatingTicket(true);
    try {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const day = now.getDate().toString().padStart(2, "0");
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      const ticketNumber = `TKT-${year}${month}${day}-${random}`;

      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .eq("name", ticketData.category)
        .single();

      const { data: studios } = await supabase
        .from("studios")
        .select("id")
        .limit(1)
        .single();

      const { data: ticket, error } = await supabase
        .from("tickets")
        .insert([
          {
            ticketNumber,
            title: ticketData.title,
            description: ticketData.description,
            categoryId: categories?.id,
            studioId: studios?.id,
            priority: ticketData.priority || "medium",
            status: "new",
            source: "ai-chatbot",
            tags: ticketData.tags || [],
            reportedByUserId: user?.id,
            dynamicFieldData: {
              trainerName: ticketData.trainerName,
              sentiment: ticketData.sentiment,
              feedbackType: "ai-generated",
              aiGenerated: true,
              recommendations: ticketData.recommendations,
            },
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        ticketNumber,
        title: ticketData.title,
        category: ticketData.category,
        priority: ticketData.priority,
      };
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      throw error;
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleAutoFill = (ticketData: any) => {
    if (onAutoFill) {
      onAutoFill(ticketData);
      toast({
        title: "Form Auto-Filled",
        description: "The ticket form has been populated with AI-generated data.",
      });
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    setShowQuickActions(false);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const { data, error } = await supabase.functions.invoke("analyze-sentiment", {
        body: {
          title: "AI Chatbot Analysis",
          description: textToSend,
          feedback: textToSend,
          chatMode: true,
          conversationHistory: [
            ...conversationHistory,
            { role: "user", content: textToSend },
          ],
          systemPrompt: SYSTEM_PROMPT,
        },
      });

      if (error) throw error;

      const aiContent = data?.chatResponse || data?.insights || 
        "I understand. Could you provide more details about the situation?";

      const ticketData = parseAIResponse(aiContent);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: ticketData 
          ? `I've analyzed your input and prepared a ticket. Here's what I found:\n\n**Title:** ${ticketData.title}\n**Category:** ${ticketData.category}\n**Priority:** ${ticketData.priority}\n**Sentiment:** ${ticketData.sentiment || "Neutral"}\n\n${ticketData.recommendations?.length ? `**Recommendations:**\n${ticketData.recommendations.map((r: string) => `• ${r}`).join('\n')}\n\n` : ''}Would you like me to create this ticket or auto-fill the form?`
          : aiContent.replace(/```json[\s\S]*?```/g, "").trim(),
        timestamp: new Date(),
        analysis: ticketData ? {
          sentiment: ticketData.sentiment,
          priority: ticketData.priority,
          category: ticketData.category,
          tags: ticketData.tags,
        } : undefined,
        suggestions: ticketData ? ["Create Ticket", "Auto-Fill Form", "Modify Details"] : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If the user says "create" or "yes", auto-create
      if (ticketData && (textToSend.toLowerCase().includes("create") || textToSend.toLowerCase().includes("yes"))) {
        try {
          const result = await createTicket(ticketData);
          
          const confirmationMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: `✅ **Ticket Created Successfully!**\n\n**Ticket Number:** ${result.ticketNumber}\n**Status:** New\n\nYour feedback has been recorded and will be reviewed by the team. Is there anything else I can help you with?`,
            timestamp: new Date(),
            ticketCreated: result,
          };

          setMessages((prev) => [...prev, confirmationMessage]);

          toast({
            title: "Ticket Created",
            description: `Feedback ticket ${result.ticketNumber} has been created`,
          });
        } catch (ticketError) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 2).toString(),
              role: "assistant",
              content: "I apologize, but I couldn't create the ticket. Would you like to try again or use the auto-fill option instead?",
              timestamp: new Date(),
              suggestions: ["Try Again", "Auto-Fill Form", "Cancel"],
            },
          ]);
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I encountered an error processing your request. Please try rephrasing or provide more details.",
          timestamp: new Date(),
          suggestions: ["Try Again", "Start Over"],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === "Auto-Fill Form") {
      const lastAnalysis = messages.findLast(m => m.analysis);
      if (lastAnalysis?.analysis) {
        handleAutoFill(lastAnalysis.analysis);
      }
    } else if (suggestion === "Start Over") {
      setMessages([messages[0]]);
      setShowQuickActions(true);
    } else {
      sendMessage(suggestion);
    }
  };

  return (
    <Card className={cn("flex flex-col h-[650px] max-h-[85vh] border-primary/20 shadow-2xl", className)}>
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-semibold">AI Assistant</span>
              <p className="text-xs text-muted-foreground font-normal">Powered by Lovable AI</p>
            </div>
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0 ring-2 ring-purple-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white text-xs">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                    message.role === "user"
                      ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                      : "bg-muted/80 backdrop-blur-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  
                  {message.analysis && (
                    <div className="mt-3 p-3 bg-background/60 rounded-xl border border-border/50">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          <Target className="h-3 w-3 mr-1" />
                          {message.analysis.category}
                        </Badge>
                        <Badge variant={
                          message.analysis.priority === 'critical' ? 'destructive' :
                          message.analysis.priority === 'high' ? 'default' : 'secondary'
                        } className="text-xs">
                          {message.analysis.priority}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs",
                          message.analysis.sentiment === 'positive' ? 'border-emerald-500 text-emerald-600' :
                          message.analysis.sentiment === 'negative' ? 'border-red-500 text-red-600' : ''
                        )}>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {message.analysis.sentiment}
                        </Badge>
                      </div>
                      {message.analysis.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {message.analysis.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {message.ticketCreated && (
                    <div className="mt-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          Ticket Created
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-3 w-3" />
                          <span className="font-mono font-semibold">{message.ticketCreated.ticketNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {message.ticketCreated.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {message.ticketCreated.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant="outline"
                          className="text-xs rounded-lg h-7"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-[10px] mt-2 opacity-50">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white text-xs">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {isCreatingTicket ? "Creating ticket..." : "Analyzing..."}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                className="rounded-xl text-xs gap-1.5 hover:bg-primary/10 hover:border-primary/30"
                onClick={() => sendMessage(action.prompt)}
              >
                <action.icon className="h-3 w-3" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <div className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your issue or feedback..."
            disabled={isLoading}
            className="flex-1 rounded-xl bg-muted/50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-xl px-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Sparkles className="h-3 w-3 text-primary/60" />
          <p className="text-[10px] text-muted-foreground">
            AI-powered ticket creation & analysis
          </p>
        </div>
      </div>
    </Card>
  );
}