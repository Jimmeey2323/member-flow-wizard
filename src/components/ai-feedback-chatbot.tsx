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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
}

interface AIFeedbackChatbotProps {
  onClose?: () => void;
  className?: string;
}

const SYSTEM_PROMPT = `You are a helpful assistant for collecting trainer feedback at a fitness studio.

When a user describes their experience with a trainer:
1. Extract key details: trainer name, class type, date, rating, specific feedback
2. Categorize the feedback: positive, constructive, or complaint
3. Identify relevant tags: technique, communication, punctuality, motivation, professionalism, safety
4. Suggest a priority: low (positive feedback), medium (constructive), high (complaints), critical (safety issues)
5. Generate a structured ticket title and description

Always be empathetic and professional. Ask clarifying questions if details are missing.

When you have enough information, respond with a JSON block in this format:
\`\`\`json
{
  "ready": true,
  "ticketData": {
    "title": "Trainer Feedback - [Trainer Name] - [Date]",
    "description": "Detailed description with all feedback points...",
    "category": "Customer Service",
    "subcategory": "Staff Professionalism", 
    "priority": "medium",
    "trainerName": "Name",
    "sentiment": "positive|neutral|negative",
    "tags": ["tag1", "tag2"]
  }
}
\`\`\`

If you need more information, respond normally with questions.`;

export function AIFeedbackChatbot({ onClose, className }: AIFeedbackChatbotProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm here to help you submit trainer feedback. Just tell me about your experience - which trainer, what class, and what happened. I'll help categorize it and create a ticket for you.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
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
      // Generate ticket number
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const day = now.getDate().toString().padStart(2, "0");
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      const ticketNumber = `TKT-${year}${month}${day}-${random}`;

      // Get category ID
      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .eq("name", ticketData.category)
        .single();

      // Get first studio as default
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
              feedbackType: "trainer-feedback",
              aiGenerated: true,
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const { data, error } = await supabase.functions.invoke("analyze-sentiment", {
        body: {
          title: "Trainer Feedback Chat",
          description: input.trim(),
          feedback: input.trim(),
          chatMode: true,
          conversationHistory: [
            ...conversationHistory,
            { role: "user", content: input.trim() },
          ],
          systemPrompt: SYSTEM_PROMPT,
        },
      });

      if (error) throw error;

      const aiContent = data?.chatResponse || data?.insights || 
        "I understand. Could you tell me more about the trainer and what happened?";

      // Check if AI is ready to create a ticket
      const ticketData = parseAIResponse(aiContent);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: ticketData 
          ? `Great! I've gathered all the information. Here's what I'll create:\n\n**Title:** ${ticketData.title}\n**Category:** ${ticketData.category}\n**Priority:** ${ticketData.priority}\n**Trainer:** ${ticketData.trainerName || "Not specified"}\n\nWould you like me to create this ticket?`
          : aiContent.replace(/```json[\s\S]*?```/g, "").trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If ticket data is ready, create the ticket
      if (ticketData) {
        try {
          const result = await createTicket(ticketData);
          
          const confirmationMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: `✅ Ticket created successfully!\n\n**Ticket Number:** ${result.ticketNumber}\n\nYour feedback has been recorded and will be reviewed by the team. Thank you for helping us improve!`,
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
              content: "I apologize, but I couldn't create the ticket. Please try again or submit feedback manually.",
              timestamp: new Date(),
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
          content: "I'm sorry, I encountered an error. Please try again or describe your feedback differently.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn("flex flex-col h-[600px] max-h-[80vh]", className)}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            AI Feedback Assistant
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Describe your trainer experience and I'll create a categorized feedback ticket
        </p>
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
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white text-xs">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
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
                          <span className="font-mono">{message.ticketCreated.ticketNumber}</span>
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
                  
                  <p className="text-xs mt-1 opacity-50">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
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
                    {isCreatingTicket ? "Creating ticket..." : "Thinking..."}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
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
            placeholder="Describe your experience with the trainer..."
            disabled={isLoading}
            className="flex-1 rounded-xl"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-xl px-4"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          <Sparkles className="h-3 w-3 inline mr-1" />
          AI will categorize and create a ticket from your feedback
        </p>
      </div>
    </Card>
  );
}
