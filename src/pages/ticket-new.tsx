import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  X,
  AlertCircle,
  Calendar,
  Clock,
  Plus,
  User,
  MapPin,
  FileText,
  Paperclip,
  Sparkles,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ClientSearch } from "@/components/client-search";
import { SessionSearch, type SelectedSession } from "@/components/session-search";
import { TicketTemplates, TICKET_TEMPLATES, type TicketTemplate } from "@/components/ticket-templates";
import {
  CATEGORIES,
  STUDIOS,
  TRAINERS,
  CLASSES,
  PRIORITIES,
} from "@/lib/constants";
import type { InsertTicket } from "@shared/schema";
import { cn } from "@/lib/utils";

const ticketFormSchema = z.object({
  studioId: z.string().min(1, "Please select a studio"),
  category: z.string().min(1, "Please select a category"),
  subcategory: z.string().optional(),
  priority: z.string().default("medium"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  customerMembershipId: z.string().optional(),
  customerStatus: z.string().optional(),
  clientMood: z.string().optional(),
  incidentDateTime: z.string().optional(),
  trainer: z.string().optional(),
  className: z.string().optional(),
  location: z.string().optional(),
  customerId: z.string().optional(),
  classTime: z.string().optional(),
  instructorContact: z.string().optional(),
  source: z.string().optional(),
  urgency: z.string().optional(),
  notes: z.string().optional(),
}).passthrough();

type TicketFormValues = z.infer<typeof ticketFormSchema>;

const steps = [
  { id: 1, name: "Template", description: "Choose a starting point" },
  { id: 2, name: "Details", description: "Issue information" },
  { id: 3, name: "Context", description: "Location & customer" },
  { id: 4, name: "Review", description: "Confirm & submit" },
];

export default function NewTicket() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [creationMode, setCreationMode] = useState<"template" | "manual">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<TicketTemplate | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showCustomerBlock, setShowCustomerBlock] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [selectedClients, setSelectedClients] = useState<any[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<SelectedSession[]>([]);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);

  useEffect(() => {
    const generateTicketNumber = () => {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `TKT-${year}${month}${day}-${random}`;
    };
    setTicketNumber(generateTicketNumber());
  }, []);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      studioId: "",
      category: "",
      subcategory: "",
      priority: "medium",
      title: "",
      description: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerMembershipId: "",
      customerStatus: "",
      clientMood: "",
      incidentDateTime: new Date().toISOString().slice(0, 16),
      trainer: "",
      className: "",
    },
  });

  const selectedCategory = form.watch("category");
  const selectedSubcategory = form.watch("subcategory");

  const categoryId = useMemo(() => {
    const category = CATEGORIES.find(c => c.name === selectedCategory);
    return category?.id;
  }, [selectedCategory]);

  const { data: subcategoriesData = [] } = useQuery({
    queryKey: ['/api/categories', categoryId, 'subcategories'],
    queryFn: async () => {
      if (!categoryId) return [];
      const response = await fetch(`/api/categories/${categoryId}/subcategories`);
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      return response.json();
    },
    enabled: !!categoryId
  });

  const { data: dynamicFieldsData = [] } = useQuery({
    queryKey: ['/api/categories', categoryId, 'fields', selectedSubcategory],
    queryFn: async () => {
      if (!categoryId) return [];
      const url = new URL(`/api/categories/${categoryId}/fields`, window.location.origin);
      if (selectedSubcategory && selectedSubcategory !== 'All') {
        url.searchParams.set('subcategoryId', selectedSubcategory);
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    },
    enabled: !!categoryId
  });

  const dynamicFields = useMemo(() => {
    if (!dynamicFieldsData) return [];
    const filtered = (dynamicFieldsData as any[])
      .filter((f: any) => !f.isHidden)
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return filtered;
  }, [dynamicFieldsData, selectedCategory, selectedSubcategory, categoryId]);

  const subcategories = subcategoriesData as Array<{ id: string; name: string; code?: string; }>;

  const { data: studiosData = [] } = useQuery({
    queryKey: ['/api/studios'],
    queryFn: async () => {
      const response = await fetch('/api/studios');
      if (!response.ok) throw new Error('Failed to fetch studios');
      return response.json();
    },
  });

  const studios = studiosData.length > 0 ? studiosData : STUDIOS;

  const showTrainerField = useMemo(() => {
    const cats = ["Class Experience", "Instructor Related"];
    return cats.includes(selectedCategory);
  }, [selectedCategory]);

  const showClassField = useMemo(() => {
    const cats = ["Class Experience", "Instructor Related", "Special Programs"];
    return cats.includes(selectedCategory);
  }, [selectedCategory]);

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormValues) => {
      const ticketData: Partial<InsertTicket> = {
        studioId: data.studioId,
        categoryId: categoryId,
        subcategoryId: data.subcategory || undefined,
        priority: data.priority,
        title: data.title,
        description: data.description,
        customerName: data.customerName || undefined,
        customerEmail: data.customerEmail || undefined,
        customerPhone: data.customerPhone || undefined,
        customerMembershipId: data.customerMembershipId || undefined,
        customerStatus: data.customerStatus || undefined,
        clientMood: data.clientMood || undefined,
        incidentDateTime: data.incidentDateTime && data.incidentDateTime.trim() !== ""
          ? new Date(data.incidentDateTime)
          : undefined,
        dynamicFieldData: (() => {
          const dyn: Record<string, any> = {};
          (dynamicFields || []).forEach((f: any) => {
            const key = f.uniqueId || f.label;
            const val = (data as any)[key];
            if (val !== undefined && val !== "") dyn[key] = val;
          });
          if ((data as any).trainer) dyn.trainer = (data as any).trainer;
          if ((data as any).className) dyn.className = (data as any).className;
          return dyn;
        })(),
      };
      return apiRequest("POST", "/api/tickets", ticketData).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Ticket created successfully",
        description: "Your ticket has been submitted and assigned.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      navigate("/tickets");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: TicketFormValues) => {
    try {
      setIsAnalyzingSentiment(true);
      
      let sentimentData = {
        sentiment: 'neutral',
        tags: ['support'],
        summary: 'Support ticket',
      };

      try {
        const sentimentResponse = await apiRequest('POST', '/api/analyze-sentiment', {
          title: data.title,
          description: data.description,
          clientMood: data.clientMood,
        });
        sentimentData = await sentimentResponse.json();
      } catch (error) {
        console.log('Sentiment analysis failed, using defaults:', error);
      }

      const enrichedData = {
        ...data,
        sentiment: sentimentData.sentiment,
        tags: sentimentData.tags,
        clientIds: selectedClients.map(c => (c.id !== undefined && c.id !== null) ? String(c.id) : c.id),
        sessionIds: selectedSessions.map(s => (s.id !== undefined && s.id !== null) ? String(s.id) : s.id),
        sessionNames: selectedSessions.map(s => s.name),
      };

      createTicketMutation.mutate(enrichedData);
    } catch (error) {
      console.error('Error in submission:', error);
      toast({
        title: "Error",
        description: "Failed to process ticket submission",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  const handleTemplateSelect = (template: TicketTemplate) => {
    setSelectedTemplate(template);
    form.setValue("category", template.category);
    form.setValue("priority", template.priority);
    form.setValue("title", template.suggestedTitle);
    form.setValue("description", template.suggestedDescription);
    if (template.subcategory) {
      const sub = subcategories.find(s => s.name === template.subcategory);
      if (sub) form.setValue("subcategory", sub.id);
    }
  };

  const handleClientSelect = (client: any) => {
    const isAlreadySelected = selectedClients.some(c => c.id === client.id);
    
    let updated: any[];
    if (isAlreadySelected) {
      updated = selectedClients.filter(c => c.id !== client.id);
    } else {
      updated = [...selectedClients, client];
      if (selectedClients.length === 0) {
        form.setValue("customerName", `${client.firstName || ''} ${client.lastName || ''}`.trim() || "");
        form.setValue("customerEmail", client.email || "");
        form.setValue("customerPhone", client.phone || "");
        form.setValue("customerMembershipId", client.id !== undefined && client.id !== null ? String(client.id) : "");
        form.setValue("customerStatus", client.membershipStatus || "");
      }
    }
    setSelectedClients(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/tickets")}
            className="rounded-xl hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text-accent">Create New Ticket</h1>
                <p className="text-sm text-muted-foreground">
                  Log and track customer feedback efficiently
                </p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-sm">
            {ticketNumber}
          </Badge>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: currentStep === step.id ? 1.1 : 1,
                          backgroundColor: currentStep >= step.id 
                            ? "hsl(var(--primary))" 
                            : "hsl(var(--muted))",
                        }}
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                          currentStep >= step.id 
                            ? "text-primary-foreground" 
                            : "text-muted-foreground"
                        )}
                      >
                        {currentStep > step.id ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          step.id
                        )}
                      </motion.div>
                      <span className={cn(
                        "text-xs mt-2 font-medium hidden sm:block",
                        currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                      )}>
                        {step.name}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "h-0.5 w-12 sm:w-24 mx-2",
                        currentStep > step.id ? "bg-primary" : "bg-muted"
                      )} />
                    )}
                  </div>
                ))}
              </div>
              <Progress value={progress} className="h-1" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Form Content */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Template Selection */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="glass-card">
                    <CardContent className="p-6">
                      <Tabs value={creationMode} onValueChange={(v) => setCreationMode(v as "template" | "manual")}>
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                          <TabsTrigger value="template" className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            Use Template
                          </TabsTrigger>
                          <TabsTrigger value="manual" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Start Fresh
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="template">
                          <TicketTemplates 
                            onSelectTemplate={handleTemplateSelect}
                            selectedTemplateId={selectedTemplate?.id}
                          />
                        </TabsContent>

                        <TabsContent value="manual">
                          <div className="text-center py-12">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                              <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Start from scratch</h3>
                            <p className="text-muted-foreground text-sm mb-6">
                              Create a custom ticket without using a template
                            </p>
                            <Button onClick={nextStep} className="rounded-xl">
                              Continue to Details
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 2: Issue Details */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        Issue Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {subcategories.length > 0 && (
                          <FormField
                            control={form.control}
                            name="subcategory"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subcategory</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-xl">
                                      <SelectValue placeholder="Select subcategory" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {subcategories.map((sub) => (
                                      <SelectItem key={sub.id} value={sub.id}>
                                        {sub.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority Level</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid grid-cols-2 md:grid-cols-4 gap-3"
                              >
                                {Object.entries(PRIORITIES).map(([value, config]) => (
                                  <label
                                    key={value}
                                    className={cn(
                                      "flex items-center justify-center p-3 rounded-xl cursor-pointer transition-all border-2",
                                      field.value === value
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/30"
                                    )}
                                  >
                                    <RadioGroupItem value={value} className="sr-only" />
                                    <span className={cn(
                                      "text-sm font-medium",
                                      field.value === value ? "text-primary" : "text-muted-foreground"
                                    )}>
                                      {config.label}
                                    </span>
                                  </label>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issue Title *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Brief summary of the issue"
                                className="rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Provide detailed information about the issue..."
                                className="min-h-32 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Dynamic Fields */}
                      {dynamicFields.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {dynamicFields.map((field: any) => {
                            const skipFields = ['Ticket ID', 'Date & Time Reported', 'Date & Time of Incident', 'Priority', 'Issue Title', 'Issue Description', 'Category', 'Sub Category'];
                            if (skipFields.includes(field.label)) return null;

                            const fieldTypeName = typeof field.fieldType === 'string' 
                              ? field.fieldType 
                              : (field.fieldType?.name || '');

                            return (
                              <FormField
                                key={field.uniqueId}
                                control={form.control}
                                name={field.uniqueId}
                                render={({ field: formField }) => (
                                  <FormItem>
                                    <FormLabel>{field.label}</FormLabel>
                                    <FormControl>
                                      {fieldTypeName === 'Dropdown' && field.options ? (
                                        <Select
                                          onValueChange={formField.onChange}
                                          value={(formField.value as string) || ''}
                                        >
                                          <SelectTrigger className="rounded-xl">
                                            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {(Array.isArray(field.options) 
                                              ? field.options 
                                              : field.options.split('|')
                                            )
                                              .map((opt: string) => opt.trim())
                                              .filter((opt: string) => opt.length > 0)
                                              .map((opt: string, idx: number) => (
                                                <SelectItem key={idx} value={opt}>
                                                  {opt}
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      ) : fieldTypeName === 'Textarea' || fieldTypeName === 'Long Text' ? (
                                        <Textarea
                                          placeholder={`Enter ${field.label.toLowerCase()}`}
                                          value={(formField.value as string) || ''}
                                          onChange={formField.onChange}
                                          className="rounded-xl"
                                        />
                                      ) : (
                                        <Input
                                          type={fieldTypeName === 'Email' ? 'email' : fieldTypeName === 'Phone' ? 'tel' : 'text'}
                                          placeholder={`Enter ${field.label.toLowerCase()}`}
                                          value={(formField.value as string) || ''}
                                          onChange={formField.onChange}
                                          className="rounded-xl"
                                        />
                                      )}
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Context (Location & Customer) */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-emerald-500" />
                        Location Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="studioId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Studio *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select studio" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {studios.map((studio: { id: string; name: string }) => (
                                    <SelectItem key={studio.id} value={studio.id}>
                                      {studio.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="incidentDateTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>When did this occur?</FormLabel>
                              <FormControl>
                                <Input
                                  type="datetime-local"
                                  className="rounded-xl"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-purple-500" />
                          Customer Information
                          {selectedClients.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {selectedClients.length} selected
                            </Badge>
                          )}
                        </CardTitle>
                        <Button
                          type="button"
                          variant={showCustomerBlock ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setShowCustomerBlock(!showCustomerBlock)}
                          className="rounded-xl"
                        >
                          {showCustomerBlock ? "Hide" : "Add Customer"}
                        </Button>
                      </div>
                    </CardHeader>
                    {showCustomerBlock && (
                      <CardContent className="space-y-6">
                        <ClientSearch
                          onClientSelect={handleClientSelect}
                          selectedClientId={selectedClients[0]?.id ? String(selectedClients[0].id) : undefined}
                        />

                        {selectedClients.length > 0 && (
                          <div className="space-y-2">
                            {selectedClients.map((client) => (
                              <div
                                key={client.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20"
                              >
                                <div>
                                  <div className="font-medium text-sm">
                                    {`${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {client.email} • {client.phone}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedClients(prev => prev.filter(c => c.id !== client.id))}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="customerName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Customer Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Name" className="rounded-xl" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="customerPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="Phone number" className="rounded-xl" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="customerEmail"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="Email address" className="rounded-xl" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* File Attachments */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Paperclip className="h-5 w-5 text-amber-500" />
                        Attachments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <p className="text-sm font-medium">Drop files here or click to upload</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Support: Images, PDF, Word (max 5 files)
                          </p>
                        </label>
                      </div>

                      {attachedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {attachedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm truncate max-w-xs">{file.name}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-emerald-500" />
                        Review Your Ticket
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Ticket ID</Label>
                            <p className="font-mono font-semibold">{ticketNumber}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Category</Label>
                            <p className="font-medium">{form.watch("category") || "Not selected"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Priority</Label>
                            <Badge className="mt-1">{form.watch("priority")}</Badge>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Studio</Label>
                            <p className="font-medium">
                              {studios.find((s: { id: string }) => s.id === form.watch("studioId"))?.name || "Not selected"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Title</Label>
                            <p className="font-medium">{form.watch("title") || "Not provided"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <p className="text-sm text-muted-foreground line-clamp-4">
                              {form.watch("description") || "Not provided"}
                            </p>
                          </div>
                          {selectedClients.length > 0 && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Customer</Label>
                              <p className="font-medium">
                                {`${selectedClients[0]?.firstName || ''} ${selectedClients[0]?.lastName || ''}`.trim()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {attachedFiles.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Attachments</Label>
                          <p className="text-sm">{attachedFiles.length} file(s) attached</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">AI Analysis Enabled</p>
                          <p className="text-xs text-muted-foreground">
                            Sentiment analysis and auto-tagging will be applied on submission
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between pt-4"
            >
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="rounded-xl"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-3">
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="rounded-xl"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending || isAnalyzingSentiment}
                    className="rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    {createTicketMutation.isPending || isAnalyzingSentiment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isAnalyzingSentiment ? "Analyzing..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          </form>
        </Form>
      </div>
    </div>
  );
}
