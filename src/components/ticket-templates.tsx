import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  CreditCard,
  Users,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Sparkles,
  UserX,
  Settings,
  Package,
  Headphones,
  Star,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface TicketTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  subcategory?: string;
  priority: string;
  suggestedTitle: string;
  suggestedDescription: string;
  tags: string[];
  color: string;
}

export const TICKET_TEMPLATES: TicketTemplate[] = [
  {
    id: "booking-issue",
    name: "Booking Failed",
    description: "Customer unable to book classes through app or website",
    icon: Calendar,
    category: "Booking & Technology",
    subcategory: "Class Booking",
    priority: "high",
    suggestedTitle: "Class Booking Issue - Unable to Complete Reservation",
    suggestedDescription: "Customer experienced issues while attempting to book a class. Error details: [describe error]. Device: [iOS/Android/Web]. Steps tried: [list attempts].",
    tags: ["booking", "technical", "app"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "payment-problem",
    name: "Payment Issue",
    description: "Problems with payment processing or billing",
    icon: CreditCard,
    category: "Booking & Technology",
    subcategory: "Payment Processing",
    priority: "high",
    suggestedTitle: "Payment Processing Error - Transaction Failed",
    suggestedDescription: "Customer encountered a payment issue. Amount: [amount]. Payment method: [card/UPI/other]. Error message received: [error]. Transaction ID (if any): [id].",
    tags: ["payment", "billing", "urgent"],
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "instructor-feedback",
    name: "Instructor Feedback",
    description: "Feedback or concern about instructor performance",
    icon: Star,
    category: "Customer Service",
    subcategory: "Staff Professionalism",
    priority: "medium",
    suggestedTitle: "Instructor Feedback - [Instructor Name]",
    suggestedDescription: "Customer feedback regarding instructor: [name]. Class attended: [class type]. Date: [date]. Nature of feedback: [positive/constructive]. Details: [specifics].",
    tags: ["instructor", "feedback", "class"],
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "membership-inquiry",
    name: "Membership Query",
    description: "Questions about memberships, packages, or pricing",
    icon: Users,
    category: "Sales & Marketing",
    subcategory: "Trial Class Experience",
    priority: "medium",
    suggestedTitle: "Membership Inquiry - [Package Type]",
    suggestedDescription: "Customer is inquiring about: [membership type]. Current status: [new/existing]. Specific questions: [list questions]. Preferred contact method: [email/phone].",
    tags: ["membership", "sales", "inquiry"],
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "safety-incident",
    name: "Safety Incident",
    description: "Report an injury or safety concern during class",
    icon: AlertTriangle,
    category: "Health & Safety",
    subcategory: "Injury During Class",
    priority: "critical",
    suggestedTitle: "Safety Incident Report - [Studio Location]",
    suggestedDescription: "URGENT: Safety incident occurred. Time: [time]. Location: [studio]. Type of incident: [injury/hazard]. Person(s) involved: [names]. Immediate action taken: [steps]. Medical attention: [required/not required].",
    tags: ["safety", "urgent", "incident"],
    color: "from-red-500 to-rose-500",
  },
  {
    id: "app-technical",
    name: "App Technical Issue",
    description: "Technical problems with mobile app or website",
    icon: Smartphone,
    category: "Booking & Technology",
    subcategory: "App Issues",
    priority: "medium",
    suggestedTitle: "Technical Issue - [App/Website] - [Brief Description]",
    suggestedDescription: "Technical issue reported. Platform: [iOS/Android/Web]. App version: [version]. Device: [model]. Issue description: [details]. Screenshot attached: [yes/no]. Reproducible: [yes/no].",
    tags: ["technical", "app", "bug"],
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "class-cancellation",
    name: "Class Cancellation",
    description: "Request or complaint about class cancellation",
    icon: Calendar,
    category: "Booking & Technology",
    subcategory: "Class Booking",
    priority: "medium",
    suggestedTitle: "Class Cancellation Request/Concern - [Date]",
    suggestedDescription: "Class cancellation matter. Class: [class name]. Scheduled date/time: [date/time]. Reason for cancellation: [reason]. Refund/credit requested: [yes/no]. Customer sentiment: [understanding/frustrated].",
    tags: ["cancellation", "booking", "refund"],
    color: "from-slate-500 to-gray-500",
  },
  {
    id: "front-desk",
    name: "Front Desk Issue",
    description: "Service quality at reception or front desk",
    icon: Headphones,
    category: "Customer Service",
    subcategory: "Front Desk Service",
    priority: "medium",
    suggestedTitle: "Front Desk Service Feedback - [Studio]",
    suggestedDescription: "Service feedback for front desk at [studio]. Staff member (if known): [name]. Date/time of visit: [date/time]. Nature of interaction: [check-in/inquiry/complaint]. Details: [specifics].",
    tags: ["service", "front-desk", "feedback"],
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "equipment-issue",
    name: "Equipment Problem",
    description: "Broken, missing, or malfunctioning equipment",
    icon: Settings,
    category: "Health & Safety",
    subcategory: "Equipment Safety",
    priority: "high",
    suggestedTitle: "Equipment Issue - [Equipment Type] at [Studio]",
    suggestedDescription: "Equipment issue reported. Equipment: [type/name]. Location: [studio/room]. Issue: [broken/missing/malfunction]. When noticed: [date/time]. Safety risk: [high/medium/low]. Immediate action needed: [yes/no].",
    tags: ["equipment", "maintenance", "safety"],
    color: "from-orange-500 to-red-500",
  },
  {
    id: "retail-product",
    name: "Retail/Product Issue",
    description: "Problems with retail purchases or product quality",
    icon: Package,
    category: "Retail Management",
    subcategory: "Product Quality",
    priority: "low",
    suggestedTitle: "Retail Product Issue - [Product Name]",
    suggestedDescription: "Product issue reported. Product: [name]. Purchase date: [date]. Receipt number: [number]. Issue: [defective/wrong size/quality]. Resolution requested: [exchange/refund]. Photos attached: [yes/no].",
    tags: ["retail", "product", "refund"],
    color: "from-violet-500 to-purple-500",
  },
];

interface TicketTemplatesProps {
  onSelectTemplate: (template: TicketTemplate) => void;
  selectedTemplateId?: string;
}

export function TicketTemplates({ onSelectTemplate, selectedTemplateId }: TicketTemplatesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Quick Start Templates</h3>
          <p className="text-sm text-muted-foreground">Select a template to pre-fill common ticket types</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {TICKET_TEMPLATES.map((template, index) => {
            const Icon = template.icon;
            const isSelected = selectedTemplateId === template.id;
            const isHovered = hoveredId === template.id;

            return (
              <motion.button
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => onSelectTemplate(template)}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  "group relative p-4 rounded-2xl text-left transition-all duration-300",
                  "border border-border/50 hover:border-primary/30",
                  "bg-card/50 hover:bg-card",
                  "hover:shadow-lg hover:shadow-primary/5",
                  isSelected && "ring-2 ring-primary border-primary bg-primary/5"
                )}
              >
                {/* Gradient overlay on hover */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
                    "bg-gradient-to-br",
                    template.color,
                    (isHovered || isSelected) && "opacity-5"
                  )}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300",
                      "bg-gradient-to-br",
                      template.color,
                      "shadow-lg",
                      isHovered && "scale-110"
                    )}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    {isSelected ? (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    ) : (
                      <ChevronRight className={cn(
                        "h-5 w-5 text-muted-foreground transition-all duration-300",
                        isHovered && "translate-x-1 text-primary"
                      )} />
                    )}
                  </div>

                  <h4 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                    {template.name}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {template.description}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant={template.priority === "critical" ? "destructive" : template.priority === "high" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {template.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
