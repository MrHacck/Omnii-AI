import { chatFree, chatGemini, chatGrok, chatOpenAI, chatGroq, chatOpenRouter, chatMistral, pickModel, type ChatMessage, type ModelChoice, type ProviderKeys } from "@/lib/providers";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages: ChatMessage[];
      model: ModelChoice;
      keys?: ProviderKeys;
    };
    
    console.log("Received request:", { model: body.model, messageCount: body.messages.length });
    
    const keys = {
      openai: body.keys?.openai || process.env.OPENAI_API_KEY || undefined,
      gemini: body.keys?.gemini || process.env.GEMINI_API_KEY || undefined,
      grok: body.keys?.grok || process.env.XAI_API_KEY || undefined,
      groq: body.keys?.groq || process.env.GROQ_API_KEY || undefined,
      openrouter: body.keys?.openrouter || process.env.OPENROUTER_API_KEY || undefined,
      mistral: body.keys?.mistral || process.env.MISTRAL_API_KEY || undefined,
    };
    
    console.log("Available keys:", { 
      hasOpenAI: !!keys.openai, 
      hasGemini: !!keys.gemini, 
      hasGrok: !!keys.grok,
      hasGroq: !!keys.groq,
      hasOpenRouter: !!keys.openrouter,
      hasMistral: !!keys.mistral
    });
    
    const lastUser = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const model = pickModel(body.model, keys, lastUser);
    
    console.log("Selected model:", model);
    
    let reply: string;
    if (model === "openai") {
      if (!keys.openai) throw new Error("OpenAI key required but not provided");
      reply = await chatOpenAI(body.messages, keys.openai!);
    }
    else if (model === "gemini") {
      if (!keys.gemini) throw new Error("Gemini key required but not provided");
      reply = await chatGemini(body.messages, keys.gemini!);
    }
    else if (model === "grok") {
      if (!keys.grok) throw new Error("Grok key required but not provided");
      reply = await chatGrok(body.messages, keys.grok!);
    }
    else if (model === "groq") {
      if (!keys.groq) throw new Error("Groq key required but not provided");
      reply = await chatGroq(body.messages, keys.groq!);
    }
    else if (model === "openrouter") {
      if (!keys.openrouter) throw new Error("OpenRouter key required but not provided");
      reply = await chatOpenRouter(body.messages, keys.openrouter!);
    }
    else if (model === "mistral") {
      if (!keys.mistral) throw new Error("Mistral key required but not provided");
      reply = await chatMistral(body.messages, keys.mistral!);
    }
    else {
      reply = await chatFree(body.messages);
    }
    
    console.log("API call successful, response length:", reply.length);
    return Response.json({ reply: reply.trim(), model });
  } catch (e) {
    console.error("API route error:", e);
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    
    // Provide a helpful fallback response
    const fallbackResponse = `I apologize, but I'm experiencing technical difficulties with the free AI service right now. 

${errorMessage}

To get reliable responses, please:
1. Add an API key in Settings (OpenAI, Gemini, or Grok)
2. Try again in a few moments
3. Or switch to a specific model that has an API key configured

The free service can be slow or unavailable during high traffic periods.`;
    
    return Response.json({ reply: fallbackResponse, model: "free" }, { status: 200 });
  }
}
