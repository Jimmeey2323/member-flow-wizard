import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category to department/team mapping
const CATEGORY_ROUTING = {
  "Booking & Technology": { department: "IT/Tech Support", teamCode: "operations" },
  "Customer Service": { department: "Client Success", teamCode: "client-success" },
  "Health & Safety": { department: "Operations", teamCode: "facilities" },
  "Retail Management": { department: "Sales", teamCode: "sales" },
  "Community & Culture": { department: "HR", teamCode: "operations" },
  "Sales & Marketing": { department: "Sales", teamCode: "sales" },
  "Special Programs": { department: "Operations", teamCode: "operations" },
  "Miscellaneous": { department: "Operations", teamCode: "operations" },
  "Global": { department: "Management", teamCode: "management" },
};

// Subcategory-specific routing overrides
const SUBCATEGORY_ROUTING: Record<string, { department: string; priority?: string }> = {
  "Payment Processing": { department: "Finance", priority: "high" },
  "Injury During Class": { department: "HR", priority: "critical" },
  "Medical Disclosure": { department: "HR", priority: "high" },
  "Theft": { department: "Security", priority: "critical" },
  "Emergency": { department: "Management", priority: "critical" },
  "Staff Misconduct": { department: "HR", priority: "high" },
  "Discrimination": { department: "HR", priority: "high" },
};

async function callAI(messages: any[], responseFormat?: any) {
  // Prefer Lovable AI Gateway, fallback to OpenAI
  const apiKey = lovableApiKey || openAIApiKey;
  const apiUrl = lovableApiKey 
    ? 'https://ai.gateway.lovable.dev/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  
  if (!apiKey) {
    throw new Error('No AI API key configured');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: lovableApiKey ? 'google/gemini-2.5-flash' : 'gpt-4o-mini',
      messages,
      ...(responseFormat && { response_format: responseFormat }),
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, description, title, category, subcategory, studioId } = body;

    // Handle title generation action
    if (action === 'generateTitle') {
      if (!description) {
        return new Response(JSON.stringify({ error: 'Description is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const systemPrompt = `You are a helpful assistant that generates concise, descriptive ticket titles for a fitness studio support system.
Generate a brief, clear title (max 60 characters) that summarizes the main issue from the description.
The title should be professional and actionable.
Respond with ONLY the title text, no quotes or additional formatting.`;

      const data = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a title for this ticket description:\n\n${description}` }
      ]);

      const generatedTitle = data.choices[0].message.content.trim();
      
      return new Response(JSON.stringify({ title: generatedTitle }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default action: routing analysis
    const systemPrompt = `You are an intelligent ticket routing assistant for a fitness studio chain. Analyze the ticket content and determine:
1. The most appropriate department to handle this ticket
2. Suggested priority level (critical, high, medium, low)
3. Any tags that should be applied
4. Whether this needs immediate escalation

Available departments: Operations, Facilities, Training, Sales, Client Success, Marketing, Finance, Management, IT/Tech Support, HR, Security

Priority guidelines:
- CRITICAL: Safety incidents, medical emergencies, theft, security breaches, major system outages
- HIGH: Payment issues, customer complaints, staff misconduct, urgent technical problems
- MEDIUM: General inquiries, booking issues, feedback, routine requests
- LOW: Feature requests, general feedback, non-urgent matters

Respond with a JSON object containing:
{
  "department": "string",
  "priority": "critical|high|medium|low",
  "suggestedTags": ["tag1", "tag2"],
  "needsEscalation": boolean,
  "escalationReason": "string or null",
  "routingConfidence": 0.0-1.0,
  "analysis": "brief explanation of routing decision"
}`;

    const userPrompt = `Analyze this ticket:
Title: ${title}
Description: ${description}
Category: ${category || 'Not specified'}
Subcategory: ${subcategory || 'Not specified'}
Studio: ${studioId || 'Not specified'}

Determine the best department, priority, and routing for this ticket.`;

    const data = await callAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      { type: "json_object" }
    );

    let aiResponse;
    try {
      aiResponse = JSON.parse(data.choices[0].message.content);
    } catch {
      // If JSON parsing fails, use defaults
      aiResponse = {
        department: "Operations",
        priority: "medium",
        suggestedTags: [],
        needsEscalation: false,
        routingConfidence: 0.5,
        analysis: "Auto-parsed response"
      };
    }

    // Apply subcategory overrides if applicable
    if (subcategory && SUBCATEGORY_ROUTING[subcategory]) {
      const override = SUBCATEGORY_ROUTING[subcategory];
      if (override.department) {
        aiResponse.department = override.department;
      }
      if (override.priority) {
        aiResponse.priority = override.priority;
      }
    }

    // Apply category defaults as fallback
    if (category && CATEGORY_ROUTING[category as keyof typeof CATEGORY_ROUTING]) {
      const categoryDefault = CATEGORY_ROUTING[category as keyof typeof CATEGORY_ROUTING];
      if (!aiResponse.department || aiResponse.routingConfidence < 0.7) {
        aiResponse.department = categoryDefault.department;
      }
    }

    console.log('AI Routing Result:', aiResponse);

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error('Error in analyze-ticket function:', errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      // Fallback routing
      department: "Operations",
      priority: "medium",
      suggestedTags: [],
      needsEscalation: false,
      routingConfidence: 0,
      analysis: "Auto-routing failed, using default assignment"
    }), {
      status: 200, // Return 200 with fallback to not break the flow
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
