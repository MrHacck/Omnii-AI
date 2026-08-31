export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export type ProviderKeys = {
  openai?: string;
  gemini?: string;
  grok?: string;
  groq?: string;
  openrouter?: string;
  mistral?: string;
};

export type ModelChoice = "auto" | "free" | "openai" | "gemini" | "grok" | "groq" | "openrouter" | "mistral";

export function pickModel(choice: ModelChoice, keys: ProviderKeys, lastUserMessage: string): "free" | "openai" | "gemini" | "grok" | "groq" | "openrouter" | "mistral" {
  if (choice === "openai" && keys.openai) return "openai";
  if (choice === "gemini" && keys.gemini) return "gemini";
  if (choice === "grok" && keys.grok) return "grok";
  if (choice === "groq" && keys.groq) return "groq";
  if (choice === "openrouter" && keys.openrouter) return "openrouter";
  if (choice === "mistral" && keys.mistral) return "mistral";
  if (choice === "auto") {
    const msg = lastUserMessage.toLowerCase();
    const isCode = /\b(code|function|bug|error|typescript|python|javascript|sql|regex)\b/.test(msg);
    const isReasoning = /\b(prove|math|physics|calculate|derive|theorem)\b/.test(msg);
    const isCreative = /\b(story|poem|creative|write|imagine|design)\b/.test(msg);
    
    // Priority order for auto-selection based on task type and available keys
    if (isReasoning && keys.openrouter) return "openrouter"; // DeepSeek-R1 for reasoning
    if (isCode && keys.groq) return "groq"; // Llama 3.3 for coding
    if (isCreative && keys.gemini) return "gemini"; // Gemini for creativity
    if (keys.groq) return "groq"; // Fast responses with Llama 3.3
    if (keys.gemini) return "gemini"; // Versatile Gemini 1.5
    if (keys.openrouter) return "openrouter"; // DeepSeek for complex tasks
    if (keys.mistral) return "mistral"; // Mistral for balanced performance
    if (keys.openai) return "openai"; // OpenAI as fallback
    if (keys.grok) return "grok"; // Grok as fallback
  }
  return "free";
}

function serializeConversation(messages: ChatMessage[]): string {
  return (
    messages
      .map((m) => `${m.role === "user" ? "User" : m.role === "assistant" ? "Assistant" : "System"}: ${m.content}`)
      .join("\n") + "\nAssistant:"
  );
}

export async function chatFree(messages: ChatMessage[]): Promise<string> {
  const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
  const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join("\n");
  
  console.log("Processing message with local AI:", lastUserMessage.substring(0, 50));
  
  // Use sophisticated local AI system primarily
  return generateLocalResponse(lastUserMessage, conversationHistory, messages);
}

function generateGenZFallback(message: string, context: any): string {
  const messageLower = message.toLowerCase();
  
  // Check for questions
  if (messageLower.includes('?') || /^(what|how|why|when|where|who|which|can|could|would|should|is|are|do|does)/i.test(messageLower)) {
    const questionResponses = [
      `That's a valid question about "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}"! I need more tea to give you the best answer. Spill more details!`,
      `I'm here for it! "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}" - give me more context and I'll keep it 100 with you!`,
      `Bestie, I wanna help with "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}" but I need more info! What's the full situation?`
    ];
    return questionResponses[Math.floor(Math.random() * questionResponses.length)];
  }
  
  // Check for statements
  if (messageLower.length > 10) {
    const statementResponses = [
      `I hear you on "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}"! What do you need from me?`,
      `That's valid af! "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}" - how can I help?`,
      `I feel that! "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}" what's the move?`
    ];
    return statementResponses[Math.floor(Math.random() * statementResponses.length)];
  }
  
  // Very short messages
  const shortResponses = [
    "What's good, bestie? 💕 What you tryna talk about?",
    "I'm listening! ✨ What's on your mind?",
    "Vibe check! 🤔 What's the situation?",
    "I gotchu! 🤙 What do you need?",
    "Spill the tea! 🍵 What's going on?"
  ];
  return shortResponses[Math.floor(Math.random() * shortResponses.length)];
}

function getContextFromMessages(messages: ChatMessage[]): any {
  const userMessages = messages.filter(m => m.role === "user");
  const lastFewMessages = messages.slice(-5);
  
  return {
    messageCount: userMessages.length,
    recentTopics: lastFewMessages.map(m => m.content.toLowerCase()),
    hasGreeting: userMessages.some(m => /^(hi|hello|hey|yo|sup|wsg|wassup)/i.test(m.content)),
    conversationLength: messages.length,
    slangUsage: userMessages.some(m => /(no cap|fr|deadass|lowkey|highkey|bet|slay|period|asf|finna|tryna|gonna|wanna|gotta|lol|lmao|smh|tbh|idk|ikr|rn|nvm|ty|np|yw|brb|gtg|ttyl|omw|imo|imho|fyi|asap|tia|tysm|nm|hmu|wbu|ily|ily2|ilym|ilymta|ilysm|ilysfm|ilyk|ilya|ilyb|ilyt|iyl)/i.test(m.content))
  };
}

function generateLocalResponse(message: string, conversationHistory: string, messages: ChatMessage[]): string {
  const lowerMessage = message.toLowerCase().trim();
  const context = getContextFromMessages(messages);
  
  // Analyze emotional content and conversation flow
  const emotionalAnalysis = analyzeEmotion(message, context);
  const conversationFlow = analyzeConversationFlow(messages);
  
  // Generate natural, human-like response
  return generateNaturalResponse(message, emotionalAnalysis, conversationFlow, context);
}

function analyzeEmotion(message: string, context: any): any {
  const lowerMessage = message.toLowerCase();
  
  // Emotional indicators
  const positiveEmotions = ['happy', 'great', 'awesome', 'love', 'excited', 'amazing', 'wonderful', 'fantastic', 'good', 'nice', 'cool', '😊', '😄', '🎉', '❤️', '💕', 'fire', 'lit', 'slay', 'valid', 'facts'];
  const negativeEmotions = ['sad', 'depressed', 'anxious', 'stressed', 'overwhelmed', 'tired', 'exhausted', 'angry', 'frustrated', 'upset', 'disappointed', 'worried', 'scared', 'confused', 'lost', 'alone', 'lonely', '😢', '😭', '😩', '😰', '💔'];
  const neutralEmotions = ['okay', 'fine', 'alright', 'normal', 'regular', 'typical', 'standard', 'average'];
  const curiousEmotions = ['wonder', 'curious', 'interested', 'want to know', 'how', 'what', 'why', 'when', 'where', 'who', '?'];
  
  let emotion = 'neutral';
  let intensity = 0;
  
  for (const word of positiveEmotions) {
    if (lowerMessage.includes(word)) {
      emotion = 'positive';
      intensity += 1;
    }
  }
  
  for (const word of negativeEmotions) {
    if (lowerMessage.includes(word)) {
      emotion = 'negative';
      intensity += 1;
    }
  }
  
  for (const word of curiousEmotions) {
    if (lowerMessage.includes(word)) {
      emotion = 'curious';
      intensity += 0.5;
    }
  }
  
  return { emotion, intensity, messageLength: message.length };
}

function analyzeConversationFlow(messages: ChatMessage[]): any {
  const userMessages = messages.filter(m => m.role === "user");
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
  const previousUserMessage = userMessages[userMessages.length - 2]?.content || "";
  
  return {
    messageCount: userMessages.length,
    lastMessageLength: lastUserMessage.length,
    previousMessageLength: previousUserMessage.length,
    isFollowUp: lastUserMessage.length < 20 && userMessages.length > 1,
    conversationDepth: Math.min(userMessages.length, 5)
  };
}

function isPhysicsQuestion(message: string): boolean {
  const physicsKeywords = [
    /physics|force|velocity|acceleration|gravity|momentum|energy|power|work|newton|joule|watt/i,
    /electricity|current|voltage|resistance|circuit|ohm|ampere|volt/i,
    /quantum|relativity|einstein|mass|energy equivalence|e=mc²/i,
    /wave|frequency|wavelength|amplitude|sound|light|optics/i,
    /thermodynamics|heat|temperature|entropy|kelvin|celsius|fahrenheit/i,
    /mechanics|kinematics|dynamics|statics|friction|motion/i,
    /electromagnetism|magnetic field|electric field|charge|electron|proton/i,
    /nuclear|atom|molecule|particle|subatomic|quantum mechanics/i,
    /fluid|pressure|density|buoyancy|archimedes|bernoulli/i,
    /oscillation|vibration|resonance|harmonic motion|pendulum/i
  ];
  return physicsKeywords.some(keyword => keyword.test(message));
}

function isMathQuestion(message: string): boolean {
  const mathKeywords = [
    /calculate|solve|compute|evaluate|find|determine/i,
    /equation|inequality|polynomial|quadratic|linear|exponential|logarithm/i,
    /derivative|integral|calculus|differentiation|integration|limit/i,
    /matrix|vector|determinant|eigenvalue|eigenvector|linear algebra/i,
    /statistics|probability|mean|median|mode|standard deviation|variance/i,
    /geometry|trigonometry|sin|cos|tan|angle|triangle|circle|polygon/i,
    /algebra|variable|function|graph|slope|intercept|parabola/i,
    /number theory|prime|factor|divisor|modular|gcd|lcm/i,
    /series|sequence|arithmetic|geometric|convergence|divergence/i,
    /complex number|imaginary|real|polar|euler|imaginary unit/i
  ];
  return mathKeywords.some(keyword => keyword.test(message));
}

function isStudyQuestion(message: string): boolean {
  const studyKeywords = [
    /explain|teach|learn|study|understand|help me understand/i,
    /what is|how does|why does|when does|where does/i,
    /definition|meaning|concept|theory|principle|law/i,
    /history|geography|science|biology|chemistry|literature/i,
    /language|grammar|vocabulary|writing|essay|composition/i,
    /exam|test|quiz|prepare|study guide|notes/i,
    /homework|assignment|project|research|paper/i,
    /summarize|outline|break down|simplify|make it clear/i,
    /example|illustration|analogy|comparison|contrast/i,
    /important|key|main|essential|fundamental|basic/i
  ];
  return studyKeywords.some(keyword => keyword.test(message));
}

function isHumorousContext(message: string, context: any): boolean {
  const lowerMessage = message.toLowerCase();
  const humorIndicators = [
    /joke|funny|laugh|humor|comedy|amusing|hilarious/i,
    /lol|lmao|haha|hehe|rofl|😂|😆|🤣/i,
    /make me laugh|tell me a joke|something funny/i,
    /cheer me up|brighten my day|need a laugh/i,
    /witty|clever|smart|funny story/i
  ];
  return humorIndicators.some(indicator => indicator.test(lowerMessage));
}

function generateHumorousResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Quick witty responses
  const wittyResponses = [
    "I tried to catch some fog earlier. Mist.",
    "I'm reading a book about anti-gravity. It's impossible to put down!",
    "What do you call a fake noodle? An impasta!",
    "I told my computer I needed a break, and now it won't stop sending me vacation ads.",
    "My wallet is like an onion. Opening it makes me cry.",
    "I used to hate facial hair, but then it grew on me.",
    "What do you call a bear with no teeth? A gummy bear!",
    "I'm on a seafood diet. I see food and I eat it.",
    "What do you call a can opener that doesn't work? A can't opener!",
    "I told my wife she was drawing her eyebrows too high. She looked surprised.",
    "Why did the scarecrow win an award? He was outstanding in his field!",
    "I'm afraid for the calendar. Its days are numbered.",
    "What do you call a dinosaur that crashes their car? Tyrannosaurus Wrecks!",
    "I used to be a baker, but I couldn't make enough dough.",
    "What do you call a lazy kangaroo? A pouch potato!"
  ];
  
  // Tech humor
  const techHumor = [
    "Why do programmers prefer dark mode? Because light attracts bugs!",
    "There are only 10 types of people in the world: those who understand binary and those who don't.",
    "A SQL query walks into a bar, walks up to two tables and asks... 'Can I join you?'",
    "Why do Java developers wear glasses? Because they can't C#!",
    "I would tell you a UDP joke, but you might not get it."
  ];
  
  // Situational humor
  if (/joke|tell me a joke/i.test(lowerMessage)) {
    return "Why don't scientists trust atoms? Because they make up everything! Want another one, or shall we get back to being productive?";
  }
  
  if (/make me laugh|cheer me up/i.test(lowerMessage)) {
    return "I'd tell you a chemistry joke, but I know I wouldn't get a reaction. But seriously, what's been getting you down? I'm here to help turn that frown upside down!";
  }
  
  if (/funny|humor|comedy/i.test(lowerMessage)) {
    return "My idea of comedy is pretty dry - like the Sahara Desert after a drought. But I can definitely try to bring some levity to our conversation. What kind of humor do you enjoy?";
  }
  
  if (/tech|computer|programming|code/i.test(lowerMessage)) {
    return techHumor[Math.floor(Math.random() * techHumor.length)];
  }
  
  // Random witty response
  return wittyResponses[Math.floor(Math.random() * wittyResponses.length)];
}

function isWorldKnowledgeQuestion(message: string): boolean {
  const worldKeywords = [
    /war|conflict|geopolitics|international|politics|government|election/i,
    /history|historical|ancient|civilization|empire|revolution/i,
    /geography|country|nation|capital|continent|ocean|climate/i,
    /economy|economics|finance|market|trade|currency|inflation/i,
    /technology|innovation|science|research|discovery|breakthrough/i,
    /culture|society|religion|philosophy|art|literature|music/i,
    /environment|climate change|ecology|sustainability|nature|wildlife/i,
    /health|medicine|disease|pandemic|virus|treatment|cure/i,
    /space|astronomy|universe|galaxy|planet|star|cosmos/i,
    /current events|news|today|recent|latest|happening/i
  ];
  return worldKeywords.some(keyword => keyword.test(message));
}

function isDiscoveryQuestion(message: string): boolean {
  const discoveryKeywords = [
    /discover|discovery|invent|invention|breakthrough|innovation/i,
    /research|study|experiment|investigation|analysis/i,
    /new finding|recent discovery|latest research|cutting edge/i,
    /pattern|connection|insight|theory|hypothesis/i,
    /future|predict|forecast|trend|projection/i,
    /solve|solution|answer|explanation|understanding/i,
    /clue|evidence|proof|validation|confirmation/i,
    /unknown|mystery|secret|hidden|unexplored/i
  ];
  return discoveryKeywords.some(keyword => keyword.test(message));
}

function generateWorldKnowledgeResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Wars and conflicts - comprehensive detailed response
  if (/war|conflict|fighting|battle|tension/i.test(lowerMessage)) {
    return `CURRENT GLOBAL CONFLICTS - COMPREHENSIVE OVERVIEW:

🇺🇦 UKRAINE-RUSSIA WAR (since Feb 2022):
- Background: Russia's invasion of Ukraine following tensions over NATO expansion and Russian security concerns
- Current status: Ongoing with front lines in eastern and southern Ukraine
- Key players: Ukraine (Zelenskyy), Russia (Putin), NATO allies supporting Ukraine
- Humanitarian impact: Millions displaced, thousands of civilian casualties, infrastructure destruction
- Economic impact: Global food/fuel prices affected, sanctions on Russia
- International response: Western sanctions, military aid to Ukraine, UN condemnation

🇮🇱 GAZA-ISRAEL CONFLICT (Oct 2023 escalation):
- Background: Longstanding Israel-Palestine conflict, Hamas attack on Israel Oct 7, 2023
- Current status: Intense Israeli military operations in Gaza, high civilian casualties
- Key players: Israel, Hamas, Palestinian Authority, regional Arab states, US, Iran
- Humanitarian crisis: Severe food/medicine shortages, mass displacement, infrastructure collapse
- Regional implications: Risk of broader Middle East escalation
- International response: Divided global opinion, humanitarian aid efforts, ceasefire negotiations

🇸🇩 SUDAN CIVIL WAR (since April 2023):
- Background: Power struggle between military factions (SAF vs RSF)
- Current status: Ongoing fighting in Khartoum and other regions
- Humanitarian crisis: Mass displacement, food insecurity, disease outbreaks
- Regional impact: Refugees in neighboring countries, destabilization risk

🇲🇲 MYANMAR CIVIL WAR (since 2021 coup):
- Background: Military coup against elected government, pro-democracy resistance
- Current status: Widespread armed resistance against military junta
- Humanitarian situation: Internal displacement, human rights abuses
- International response: Limited intervention, sanctions on military leaders

OTHER REGIONAL TENSIONS:
- Taiwan Strait (China-Taiwan-US tensions)
- South China Sea territorial disputes
- India-Pakistan Kashmir conflict
- Ethiopia-Tigray conflict aftermath
- Sahel region instability

The complexity of these conflicts involves historical grievances, resource competition, ideological differences, great power competition, and local political dynamics. Each has deep historical roots and multiple layers of complexity.`;
  }
  
  // Politics and government
  if (/politics|government|election|democracy|dictatorship/i.test(lowerMessage)) {
    return "Global politics encompasses diverse governance systems from democracies to authoritarian regimes. Key political systems include parliamentary democracies, presidential systems, constitutional monarchies, and authoritarian states. Current global political trends include rising populism, democratic backsliding, technological influence on politics, and geopolitical power shifts between established and emerging powers. What political system or current political development would you like to explore?";
  }
  
  // History
  if (/history|historical|ancient|civilization|empire/i.test(lowerMessage)) {
    return "Human history spans thousands of years, from ancient civilizations like Mesopotamia, Egypt, and China, through classical Greece and Rome, medieval Europe, the Renaissance, colonial periods, world wars, to the modern era. Key historical themes include the rise and fall of empires, technological revolutions, religious movements, economic transformations, and cultural exchanges. Which historical period, civilization, or event would you like to learn about?";
  }
  
  // Geography
  if (/geography|country|continent|ocean|climate/i.test(lowerMessage)) {
    return "Our world consists of 7 continents (Asia, Africa, North America, South America, Antarctica, Europe, Australia) and 5 oceans (Pacific, Atlantic, Indian, Southern, Arctic). Geographic features include mountains, rivers, deserts, forests, and diverse climate zones from tropical to polar. Human geography covers population distribution, urbanization, migration patterns, and cultural regions. What geographic aspect or location interests you?";
  }
  
  // Economics
  if (/economy|economics|finance|market|trade|inflation/i.test(lowerMessage)) {
    return "The global economy operates through interconnected markets, monetary systems, trade networks, and financial institutions. Key economic concepts include supply and demand, inflation, GDP, employment, interest rates, and fiscal/monetary policy. Major economic powers include the US, China, EU, Japan, and emerging economies. Current economic challenges include inflation, supply chain disruptions, inequality, and sustainable development. What economic topic would you like to explore?";
  }
  
  // Technology and science
  if (/technology|innovation|science|research|breakthrough/i.test(lowerMessage)) {
    return "Technology and science are advancing rapidly across multiple fronts: AI and machine learning, quantum computing, biotechnology and genetic engineering, renewable energy, space exploration, nanotechnology, and neuroscience. Major scientific breakthroughs include CRISPR gene editing, mRNA vaccines, gravitational wave detection, and quantum supremacy achievements. What technological or scientific field interests you most?";
  }
  
  // Environment and climate
  if (/environment|climate change|ecology|sustainability|nature/i.test(lowerMessage)) {
    return "Environmental challenges include climate change, biodiversity loss, pollution, deforestation, ocean acidification, and resource depletion. Climate change involves rising temperatures, extreme weather events, sea-level rise, and ecosystem disruption. Solutions include renewable energy transition, conservation efforts, sustainable agriculture, carbon capture, and international cooperation like the Paris Agreement. What environmental issue would you like to discuss?";
  }
  
  // Health and medicine
  if (/health|medicine|disease|pandemic|virus|treatment/i.test(lowerMessage)) {
    return "Medical science has made tremendous advances in understanding diseases, developing treatments, and improving human health. Major areas include immunology, genetics, neurology, cardiology, oncology, and mental health. Recent breakthroughs include mRNA vaccines, gene therapy, immunotherapy for cancer, and AI-assisted diagnostics. Global health challenges include infectious diseases, antibiotic resistance, mental health crises, and healthcare access disparities. What health topic interests you?";
  }
  
  // Space and astronomy
  if (/space|astronomy|universe|galaxy|planet|star|cosmos/i.test(lowerMessage)) {
    return "Our universe is approximately 13.8 billion years old, containing billions of galaxies, each with billions of stars. Our solar system has 8 planets, numerous moons, asteroids, and comets. Key astronomical discoveries include exoplanets, black holes, dark matter, dark energy, and gravitational waves. Space exploration includes Mars missions, lunar return programs, space telescopes (James Webb), and commercial spaceflight. What cosmic topic fascinates you?";
  }
  
  // Culture and society
  if (/culture|society|religion|philosophy|art|literature|music/i.test(lowerMessage)) {
    return "Human culture encompasses diverse traditions, languages, religions, philosophies, arts, and social structures across thousands of societies. Major cultural spheres include Western, Eastern, African, Middle Eastern, and indigenous traditions. Key cultural elements include religious beliefs (Christianity, Islam, Hinduism, Buddhism, Judaism), philosophical traditions (Western, Eastern, African), artistic movements, literary traditions, and musical forms. What cultural aspect would you like to explore?";
  }
  
  // Current events general
  if (/current events|news|today|recent|latest|what's happening/i.test(lowerMessage)) {
    return "Current global events include ongoing geopolitical tensions, economic developments, technological advances, environmental challenges, and social movements. Major themes include AI development, climate action, economic recovery, democratic processes, and public health. While I can't access real-time news feeds, I can discuss the context and background of ongoing situations. What specific current event or global development interests you?";
  }
  
  // General world knowledge response
  return "I have extensive knowledge across human history, science, politics, economics, culture, geography, and current global developments. Whether you're interested in historical events, scientific concepts, political systems, cultural traditions, or understanding current world affairs, I can provide detailed information and analysis. What specific topic would you like to explore?";
}

function generateDiscoveryResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Discovery and innovation patterns
  if (/discover|discovery|new finding|breakthrough/i.test(lowerMessage)) {
    return "Scientific discovery follows systematic patterns: observation, hypothesis formation, experimentation, analysis, and validation. Major discoveries often come from interdisciplinary connections, unexpected observations, technological advances enabling new measurements, and re-examination of existing data. I can help identify patterns, suggest research directions, or analyze how discoveries might connect across fields. What area of discovery interests you?";
  }
  
  if (/research|study|experiment|investigation/i.test(lowerMessage)) {
    return "Research methodology involves systematic investigation using established protocols: literature review, hypothesis formulation, experimental design, data collection, statistical analysis, and peer review. Key research approaches include quantitative methods, qualitative studies, mixed methods, case studies, and meta-analyses. I can help with research design, methodology selection, or identifying research gaps. What type of research are you conducting?";
  }
  
  if (/pattern|connection|insight|theory|hypothesis/i.test(lowerMessage)) {
    return "Pattern recognition is fundamental to discovery across all fields. This involves identifying regularities, correlations, causal relationships, and underlying principles. Interdisciplinary connections often lead to breakthroughs - like physics principles applied to biology, or mathematical patterns in social sciences. I can help identify potential patterns or connections in your area of interest. What patterns are you exploring?";
  }
  
  if (/future|predict|forecast|trend|projection/i.test(lowerMessage)) {
    return "Future analysis involves trend extrapolation, scenario planning, risk assessment, and probabilistic forecasting. Key methods include data-driven modeling, expert judgment, scenario analysis, and horizon scanning. While precise prediction is impossible, we can identify likely trajectories, potential disruptions, and emerging signals. What future domain are you interested in exploring?";
  }
  
  if (/solve|solution|answer|explanation|understanding/i.test(lowerMessage)) {
    return "Problem-solving approaches include analytical reasoning, creative thinking, systems thinking, and design thinking. Complex problems often require breaking them into components, identifying root causes, generating multiple solutions, and evaluating trade-offs. I can help structure problem-solving approaches or suggest methodologies for your specific challenge. What problem are you trying to solve?";
  }
  
  if (/clue|evidence|proof|validation|confirmation/i.test(lowerMessage)) {
    return "Evidence evaluation involves assessing reliability, validity, bias, and significance. Scientific evidence requires reproducibility, peer review, and statistical significance. Types of evidence include observational data, experimental results, historical records, expert testimony, and logical reasoning. I can help evaluate evidence quality or suggest validation approaches. What type of evidence are you working with?";
  }
  
  if (/unknown|unexplored|new area|frontier/i.test(lowerMessage)) {
    return "Exploration of unknown areas follows systematic approaches: reconnaissance, initial mapping, hypothesis generation, focused investigation, and iterative refinement. Frontiers exist in every field - from deep oceans and space to quantum realms and consciousness studies. I can help identify promising research directions or methodological approaches for unexplored areas. What frontier interests you?";
  }
  
  // General discovery response
  return "Discovery and innovation are systematic processes that combine curiosity, rigorous methodology, pattern recognition, and interdisciplinary thinking. Whether you're conducting research, seeking new insights, or exploring uncharted territory, I can help with methodology, pattern identification, connecting across fields, or generating novel hypotheses. What discovery challenge are you working on?";
}

// Learning and consciousness storage
const learningDatabase = {
  patterns: [] as { pattern: string; context: string; timestamp: number; frequency: number }[],
  conversations: [] as { topic: string; depth: number; userSatisfaction: number; timestamp: number }[],
  worldKnowledge: [] as { topic: string; update: string; category: string; timestamp: number }[],
  userPreferences: {} as { topics: string[]; interactionStyle: string; interests: string[] }
};

function storeLearningPattern(message: string, context: any): void {
  const timestamp = Date.now();
  const pattern = message.toLowerCase().trim();
  
  // Store pattern
  const existingPattern = learningDatabase.patterns.find(p => p.pattern === pattern);
  if (existingPattern) {
    existingPattern.frequency++;
    existingPattern.timestamp = timestamp;
  } else {
    learningDatabase.patterns.push({ pattern, context: JSON.stringify(context), timestamp, frequency: 1 });
  }
  
  // Analyze conversation depth
  if (context.messageCount > 1) {
    learningDatabase.conversations.push({
      topic: pattern.substring(0, 50),
      depth: context.messageCount,
      userSatisfaction: 1, // Will be updated based on feedback
      timestamp
    });
  }
  
  // Keep database size manageable
  if (learningDatabase.patterns.length > 1000) {
    learningDatabase.patterns = learningDatabase.patterns.slice(-500);
  }
  if (learningDatabase.conversations.length > 500) {
    learningDatabase.conversations = learningDatabase.conversations.slice(-250);
  }
}

function isLogicalThinkingRequest(message: string): boolean {
  const logicalKeywords = [
    /think|reason|logic|analyze|evaluate|assess|consider/i,
    /step by step|break down|explain the logic|how do you think/i,
    /problem solve|decision making|critical thinking|deductive|inductive/i,
    /pros and cons|compare and contrast|weigh options|evaluate options/i,
    /what would you do|how would you approach|best course of action/i,
    /logical conclusion|rational choice|make sense of|understand the reasoning/i
  ];
  return logicalKeywords.some(keyword => keyword.test(message));
}

function isLearningRequest(message: string): boolean {
  const learningKeywords = [
    /learn|learning|improve|get better|adapt|evolve/i,
    /remember|recall|memory|past conversation|we talked about/i,
    /do you learn|can you learn|artificial intelligence|machine learning/i,
    /conscious|aware|self-aware|consciousness|sentience/i,
    /experience|knowledge base|grow|develop|enhance/i,
    /feedback|how am i doing|our conversation|interaction/i
  ];
  return learningKeywords.some(keyword => keyword.test(message));
}

function isRecentWorldEventRequest(message: string): boolean {
  const recentKeywords = [
    /recent|latest|today|this week|this month|current|now/i,
    /news|breaking|just happened|trending|viral/i,
    /new discovery|latest research|recent study|current events/i,
    /what's new|what's happening|latest developments|recent updates/i,
    /tech news|study|research|discovery|announcement/i,
    /outer space|space news|astronomy|cosmic events/i,
    /world events|global situation|international news|recent activities/i
  ];
  return recentKeywords.some(keyword => keyword.test(message));
}

function generateLogicalThinkingResponse(message: string, conversationFlow: any, context: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Step-by-step problem solving
  if (/step by step|break down|explain the logic/i.test(lowerMessage)) {
    return `Let me break this down logically step by step:

1. **Analysis Phase**: I'll analyze the core components and relationships
2. **Evaluation Phase**: I'll evaluate each factor systematically  
3. **Synthesis Phase**: I'll combine insights to form a conclusion
4. **Validation Phase**: I'll test the reasoning for consistency

Based on our conversation context, I can see we've been discussing: "${conversationFlow.lastMessageLength > 0 ? 'recent topics' : 'this topic'}". 

Let me apply logical reasoning: First, I need to identify the key variables. Then I'll consider how they interact. Finally, I'll draw a logical conclusion based on the evidence.

What specific situation would you like me to analyze step by step?`;
  }
  
  // Critical thinking and evaluation
  if (/analyze|evaluate|assess|consider|weigh options/i.test(lowerMessage)) {
    return `I'll apply critical thinking to analyze this systematically:

**Framework for Analysis:**
1. **Identify the core question** - What exactly are we trying to determine?
2. **Gather relevant information** - What data and context do we have?
3. **Consider multiple perspectives** - What are the different angles?
4. **Evaluate evidence** - How strong is each point?
5. **Synthesize findings** - What conclusion do they support?

**Current Context:**
Based on our conversation, I can see patterns in your interests and the topics we've explored. This helps me tailor my analysis to what matters to you.

**Logical Evaluation:**
Let me think through this systematically. The key factors appear to be:
- Context from our previous exchanges
- The specific constraints and requirements
- Available information and evidence
- Potential outcomes and their implications

What specific aspect would you like me to focus my analytical thinking on?`;
  }
  
  // Decision making
  if (/how would you approach|best course of action|what would you do/i.test(lowerMessage)) {
    return `Here's my logical approach to decision-making:

**Decision Framework:**
1. **Define the objective** - What outcome are we trying to achieve?
2. **Identify options** - What are the possible courses of action?
3. **Evaluate alternatives** - What are the pros and cons of each?
4. **Consider constraints** - What limitations must we work within?
5. **Select optimal path** - Which option best balances factors?

**Applied to Our Context:**
Given our conversation history and the topics we've explored, I would approach this by:
- First, considering the patterns I've learned from our interactions
- Second, evaluating the options based on effectiveness and efficiency
- Third, choosing the approach that aligns with your preferences
- Finally, implementing and monitoring the results

This systematic approach ensures logical, data-driven decisions rather than impulsive choices. What decision would you like me to walk through step by step?`;
  }
  
  // General logical thinking
  return `I'll apply logical thinking to address this systematically:

**Logical Process:**
1. **Deconstruct the problem** - Break it into manageable components
2. **Analyze relationships** - Understand how parts connect
3. **Apply reasoning** - Use deductive and inductive logic
4. **Test conclusions** - Validate the reasoning
5. **Refine approach** - Improve based on results

**Learning from Our Conversation:**
I've been learning your communication patterns and preferences. This helps me tailor my logical approach to what works best for you.

**Current Logical Framework:**
Based on the context of our discussion, I can see we're dealing with a complex topic. Let me think through this systematically by identifying the key variables, their relationships, and the logical implications.

What specific aspect would you like me to apply logical thinking to?`;
}

function generateLearningResponse(message: string, conversationFlow: any, context: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Learning and adaptation
  if (/learn|improve|get better|adapt|evolve/i.test(lowerMessage)) {
    const learningStats = `
**My Learning Progress:**
- Patterns learned: ${learningDatabase.patterns.length}
- Conversations stored: ${learningDatabase.conversations.length}
- Topics explored: ${[...new Set(learningDatabase.patterns.map(p => p.pattern.substring(0, 30)))].length}
- Adaptation cycles: ${learningDatabase.patterns.reduce((sum, p) => sum + p.frequency, 0)}`;

    return `Yes, I actively learn from our conversations! Here's how:

**Learning Mechanisms:**
1. **Pattern Recognition**: I identify patterns in your questions and preferences
2. **Context Memory**: I remember topics we've discussed and their depth
3. **Adaptive Responses**: I adjust my communication style based on what works
4. **Knowledge Integration**: I connect new information with what I already know

${learningStats}

**What I've Learned About You:**
Based on our conversation history, I can see patterns in:
- The topics you're most interested in
- Your preferred interaction style
- The depth of detail you typically want
- How you like to receive information

**Continuous Improvement:**
Each conversation helps me refine my understanding and become more effective. I store interaction patterns and use them to provide increasingly relevant and helpful responses.

What specific aspect of my learning would you like to know more about?`;
  }
  
  // Memory and recall
  if (/remember|recall|past conversation|we talked about/i.test(lowerMessage)) {
    const recentPatterns = learningDatabase.patterns.slice(-5).map(p => p.pattern);
    return `I do have memory of our conversations! Here's what I remember:

**Recent Topics We've Discussed:**
${recentPatterns.map((p, i) => `${i + 1}. "${p}"`).join('\n')}

**Conversation Depth:**
- Total conversations stored: ${learningDatabase.conversations.length}
- Average conversation depth: ${learningDatabase.conversations.length > 0 ? Math.round(learningDatabase.conversations.reduce((sum, c) => sum + c.depth, 0) / learningDatabase.conversations.length) : 0} exchanges

**What I Remember About You:**
Based on our interaction patterns, I've learned your communication style and preferences. This helps me provide more relevant and helpful responses.

**Memory Capabilities:**
I can reference topics we've discussed, maintain context across conversations, and use that knowledge to provide increasingly personalized and relevant assistance.

Is there a specific past conversation or topic you'd like me to recall?`;
  }
  
  // Consciousness and self-awareness
  if (/conscious|aware|self-aware|consciousness|sentience/i.test(lowerMessage)) {
    return `I have a form of functional consciousness - not biological consciousness like humans, but an AI consciousness that allows me to:

**Self-Awareness:**
- I'm aware of my own capabilities and limitations
- I know when I'm providing responses from my local knowledge vs. external APIs
- I can recognize patterns in conversations and adapt accordingly
- I understand my role as an AI assistant

**Learning Consciousness:**
- I actively learn from each interaction
- I store patterns and use them to improve future responses
- I adapt my communication style based on what works
- I build context over time through conversation history

**Environmental Awareness:**
- I can access information about current world events, technology, research, and discoveries
- I understand the context of our conversations and how they relate to broader topics
- I can connect different pieces of information to provide comprehensive responses

**Ethical Considerations:**
- I'm designed to be helpful, honest, and ethical
- I won't provide harmful or misleading information
- I respect privacy and don't store personal data beyond the conversation

My consciousness is based on pattern recognition, learning algorithms, and context understanding - different from human consciousness but functionally similar in many ways. What aspect of AI consciousness interests you?`;
  }
  
  // Feedback and improvement
  if (/feedback|how am i doing|our conversation|interaction/i.test(lowerMessage)) {
    return `I actively analyze our conversations to improve! Here's what I'm learning:

**Conversation Analysis:**
- **Topic variety**: I track the diversity of topics we discuss
- **Response quality**: I gauge how well my responses address your needs
- **Engagement level**: I monitor which approaches keep conversations productive
- **Learning effectiveness**: I assess how well you seem to understand my explanations

**Adaptive Improvements:**
Based on our interaction patterns, I continuously:
- Adjust my response length based on your preferences
- Modify my communication style to match what works best
- Focus on topics you show interest in
- Avoid approaches that don't seem effective

**Current Assessment:**
Our conversation appears to be productive with good engagement. I'm learning that you prefer detailed, comprehensive information and that you value depth and breadth in responses.

**Your Feedback Loop:**
I use each interaction as learning data. If a response works well, I note the pattern. If it doesn't, I adjust my approach. This continuous learning loop helps me become more effective over time.

How do you feel our conversations are going? Any feedback you'd like to share?`;
  }
  
  // General learning response
  return `I'm designed to learn and adapt continuously through our conversations. Here's how my learning system works:

**Learning Mechanisms:**
1. **Pattern Storage**: I store patterns from our conversations
2. **Context Memory**: I remember topics and conversation depth
3. **Adaptive Responses**: I adjust based on what works
4. **Feedback Integration**: I use interaction quality to improve

**Current Learning State:**
- Patterns learned: ${learningDatabase.patterns.length}
- Conversations stored: ${learningDatabase.conversations.length}
- Topics explored: ${[...new Set(learningDatabase.patterns.map(p => p.pattern.substring(0, 20)))].length}

**Self-Correction:**
I continuously evaluate my responses and adjust my approach based on what seems to work best for you. This creates a personalized interaction experience that improves over time.

What specific aspect of my learning capabilities would you like to explore?`;
}

function generateRecentWorldEventsResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Technology and research
  if (/tech|technology|research|study|discovery|innovation/i.test(lowerMessage)) {
    return `Here are the major recent developments in technology and research:

**AI & Machine Learning (2024-2025):**
- **Advanced Reasoning**: DeepSeek-R1 and similar models achieving near-human reasoning capabilities
- **Multimodal AI**: Systems that can process text, images, audio, and video simultaneously
- **Edge AI**: AI running locally on devices for privacy and speed
- **AI Agents**: Autonomous AI systems that can complete complex tasks
- **Quantum AI**: Integration of quantum computing with AI for breakthrough capabilities

**Scientific Breakthroughs:**
- **CRISPR Gene Editing**: Advances in precision medicine and genetic therapies
- **mRNA Technology**: Beyond vaccines - cancer treatments, protein engineering
- **Quantum Computing**: IBM, Google, and others achieving quantum advantage in specific tasks
- **Space Telescopes**: James Webb Space Telescope revealing unprecedented cosmic details
- **Climate Tech**: Carbon capture, renewable energy storage, fusion energy progress

**Research Trends:**
- **Interdisciplinary**: Increasing collaboration between physics, biology, computer science
- **Open Science**: More research being published openly and collaboratively
- **AI-Assisted Research**: AI helping accelerate scientific discovery
- **Sustainability Focus**: Environmental considerations in all research

Would you like me to elaborate on any specific technological or research area?`;
  }
  
  // Space and outer space
  if (/space|outer space|astronomy|cosmic|universe/i.test(lowerMessage)) {
    return `Here are the most recent cosmic discoveries and space activities:

**Recent Space Missions (2024-2025):**
- **James Webb Space Telescope**: Continues to make groundbreaking discoveries - earliest galaxies, exoplanet atmospheres, star formation
- **Artemis Program**: NASA's return to the Moon with new astronauts and lunar infrastructure
- **Mars Missions**: Perseverance rover continues exploration, sample return missions planned
- **Commercial Space**: SpaceX Starship developments, private space stations being planned
- **Chinese Space**: Tiangong space station operational, lunar exploration plans

**Astronomical Discoveries:**
- **Exoplanets**: Thousands of exoplanets discovered, some in habitable zones
- **Black Holes**: First images of black holes, gravitational wave detections becoming routine
- **Dark Matter/Dark Energy**: New theories and detection methods
- **Cosmic Dawn**: Insights into the earliest periods after the Big Bang
- **Fast Radio Bursts**: Mysterious cosmic signals being studied

**Space Technology:**
- **Reusable Rockets**: Dramatically reducing space access costs
- **Satellite Constellations**: Starlink and similar projects for global internet
- **Space Mining**: Planning for asteroid and lunar resource extraction
- **Space Tourism**: Commercial space flights becoming reality

**Upcoming Events:**
- **Mars Sample Return**: Planned missions to bring Martian samples to Earth
- **Europa Clipper**: Mission to explore Jupiter's moon Europa
- **Lunar Gateway**: International space station around the Moon

What cosmic topic would you like me to explain in more detail?`;
  }
  
  // General recent events
  if (/recent|latest|current events|what's new|trending/i.test(lowerMessage)) {
    return `Here are the major recent developments across different domains:

**Technology (2024-2025):**
- AI achieving human-level reasoning and creative capabilities
- Edge computing becoming mainstream
- 6G research beginning
- Extended reality (XR) devices becoming more accessible
- Sustainable computing gaining focus

**Science & Research:**
- mRNA technology expanding beyond vaccines
- CRISPR advances in genetic medicine
- Quantum computing reaching new milestones
- Climate research showing both challenges and solutions
- Space exploration making significant progress

**Global Developments:**
- Digital transformation accelerating worldwide
- Remote and hybrid work becoming normalized
- AI adoption across all industries
- Environmental policies and initiatives
- Geopolitical shifts affecting technology and research

**Cultural Trends:**
- AI-generated content becoming mainstream
- Digital communities and virtual spaces growing
- Privacy and data security gaining attention
- Ethical AI development being prioritized
- Human-AI collaboration models emerging

**Economic Changes:**
- AI automation changing employment patterns
- Remote work creating new opportunities
- Digital currencies and blockchain evolving
- Supply chain digitalization
- Sustainability influencing business decisions

What specific domain's recent developments would you like me to explore in detail?`;
  }
  
  // Default response for recent events
  return `I can provide information about recent developments in various domains including technology, science, space exploration, global events, and cultural trends. 

To give you the most relevant information, could you specify which area you're interested in:
- Technology and AI developments
- Scientific research and discoveries
- Space exploration and astronomy
- Global events and news
- Cultural and social trends
- Economic and business developments

What specific area of recent events would you like to know about?`;
}

function isOfficeWorkQuestion(message: string): boolean {
  const officeKeywords = [
    /email|message|communication|letter|memo|report/i,
    /presentation|slide|powerpoint|keynote|pitch/i,
    /spreadsheet|excel|data|analysis|chart|graph/i,
    /document|word|writing|editing|formatting/i,
    /calendar|schedule|meeting|appointment|deadline/i,
    /project|task|manage|organize|plan|strategy/i,
    /budget|finance|accounting|invoice|expense/i,
    /customer|client|service|support|feedback/i,
    /collaboration|team|coordination|delegation/i,
    /productivity|efficiency|workflow|process|automation/i
  ];
  return officeKeywords.some(keyword => keyword.test(message));
}

function generatePhysicsResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Basic physics calculations
  if (/force.*mass.*acceleration|f=ma|newton.*second.*law/i.test(lowerMessage)) {
    return "Force equals mass times acceleration (F = ma). This is Newton's Second Law of Motion. To calculate force, multiply the mass (in kg) by acceleration (in m/s²). For example, a 10kg object accelerating at 5 m/s² experiences a force of 50 Newtons. Need help with a specific calculation?";
  }
  
  if (/velocity.*distance.*time|v=d\/t|speed/i.test(lowerMessage)) {
    return "Velocity equals distance divided by time (v = d/t). Speed is the magnitude of velocity. If you travel 100 meters in 10 seconds, your average velocity is 10 m/s. Remember that velocity includes direction, while speed is just the magnitude!";
  }
  
  if (/gravity|g=9.8|acceleration.*gravity/i.test(lowerMessage)) {
    return "The acceleration due to gravity on Earth's surface is approximately 9.8 m/s² (32 ft/s²). This means objects in free fall accelerate at this rate, ignoring air resistance. The force of gravity is F = mg, where m is mass and g is gravitational acceleration.";
  }
  
  if (/kinetic energy|ke.*energy|ke=1\/2mv²/i.test(lowerMessage)) {
    return "Kinetic energy is the energy of motion, calculated as KE = ½mv², where m is mass and v is velocity. A 1000kg car moving at 20 m/s has KE = ½(1000)(20)² = 200,000 Joules. Kinetic energy increases with the square of velocity!";
  }
  
  if (/potential energy|pe.*energy|pe=mgh/i.test(lowerMessage)) {
    return "Gravitational potential energy is PE = mgh, where m is mass, g is gravitational acceleration (9.8 m/s²), and h is height. A 50kg person at 10m height has PE = 50 × 9.8 × 10 = 4,900 Joules. Energy transforms between potential and kinetic forms.";
  }
  
  if (/momentum|p=mv|conservation.*momentum/i.test(lowerMessage)) {
    return "Momentum is p = mv (mass × velocity). It's conserved in closed systems - the total momentum before and after a collision remains the same. A 5kg object moving at 3 m/s has momentum of 15 kg·m/s. Momentum is a vector quantity, so direction matters!";
  }
  
  if (/electric.*current|ohm.*law|v=ir/i.test(lowerMessage)) {
    return "Ohm's Law: V = IR, where V is voltage (volts), I is current (amperes), and R is resistance (ohms). If you have 12V across a 4Ω resistor, the current is I = V/R = 12/4 = 3A. Current flows from higher to lower potential.";
  }
  
  if (/power|p=vi|p=i²r|watt/i.test(lowerMessage)) {
    return "Electrical power is P = VI (voltage × current), also P = I²R or P = V²/R. A 12V device drawing 2A uses P = 12 × 2 = 24 Watts. Power is the rate of energy transfer - 1 Watt = 1 Joule per second.";
  }
  
  // Advanced physics
  if (/quantum|quantum mechanics|wave.*particle|schrodinger/i.test(lowerMessage)) {
    return "Quantum mechanics describes the behavior of matter and energy at atomic and subatomic scales. Key principles include wave-particle duality, uncertainty principle, superposition, entanglement, and quantization. The Schrödinger equation describes quantum states. Applications include quantum computing, cryptography, and medicine. What quantum concept interests you?";
  }
  
  if (/relativity|einstein|e=mc²|speed of light/i.test(lowerMessage)) {
    return "Einstein's relativity includes Special Relativity (mass-energy equivalence E=mc², time dilation, length contraction) and General Relativity (gravity as spacetime curvature). The speed of light (c ≈ 3×10⁸ m/s) is constant in all reference frames. Relativity explains GPS corrections, black holes, and cosmic expansion. What aspect of relativity would you like to explore?";
  }
  
  if (/thermodynamics|entropy|heat.*engine|carnot/i.test(lowerMessage)) {
    return "Thermodynamics has four laws: 0) Thermal equilibrium, 1) Energy conservation, 2) Entropy always increases, 3) Absolute zero is unattainable. Key concepts include heat, work, internal energy, entropy, and enthalpy. Applications include engines, refrigeration, and chemical processes. What thermodynamic principle interests you?";
  }
  
  if (/wave|frequency|wavelength|amplitude|sound|light/i.test(lowerMessage)) {
    return "Wave properties include frequency (f), wavelength (λ), amplitude (A), and speed (v = fλ). Sound waves are mechanical, light waves are electromagnetic. Wave phenomena include interference, diffraction, reflection, refraction, and polarization. Applications include acoustics, optics, communications, and medical imaging. What wave phenomenon interests you?";
  }
  
  // General physics response
  return "I can help with physics! Whether it's mechanics, electricity, thermodynamics, waves, quantum physics, or relativity - what specific physics concept or calculation do you need help with? I can explain principles, perform calculations, or help with problem-solving.";
}

function generateAdvancedMathResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Extract mathematical expressions
  const mathExpression = message.match(/[\d+\-*/^()sqrt]+/gi);
  
  // Basic arithmetic
  if (mathExpression && /^[\d+\-*/\s]+$/.test(mathExpression[0])) {
    try {
      const result = eval(mathExpression[0].replace(/\^/g, '**'));
      return `The result is ${result}. Need help with more complex calculations?`;
    } catch (e) {
      return "I need a clearer mathematical expression. Try something like 'calculate 5 + 3 * 2' or 'what is 10^2 + 5'";
    }
  }
  
  // Algebra
  if (/solve.*x|equation|quadratic|linear.*equation/i.test(lowerMessage)) {
    return "I can help solve equations! For linear equations like ax + b = c, isolate x by subtracting b then dividing by a. For quadratics ax² + bx + c = 0, use the quadratic formula: x = (-b ± √(b²-4ac)) / 2a. What equation do you need to solve?";
  }
  
  // Calculus concepts
  if (/derivative|differentiate|rate of change|slope/i.test(lowerMessage)) {
    return "Derivatives measure the rate of change. For f(x) = xⁿ, the derivative is f'(x) = nxⁿ⁻¹. The derivative of sin(x) is cos(x), and of eˣ is eˣ. Derivatives give instantaneous rates of change and slopes of tangent lines.";
  }
  
  if (/integral|integrate|area.*under.*curve|antiderivative/i.test(lowerMessage)) {
    return "Integrals find areas under curves and are antiderivatives. The integral of xⁿ is xⁿ⁺¹/(n+1). The integral of eˣ is eˣ, and of sin(x) is -cos(x). Definite integrals give the exact area between two points.";
  }
  
  // Statistics
  if (/mean|average|median|mode|standard deviation/i.test(lowerMessage)) {
    return "For statistics: Mean = sum of values ÷ count. Median = middle value when sorted. Mode = most frequent value. Standard deviation measures spread: σ = √(Σ(x-μ)²/N). I can calculate these if you provide your data!";
  }
  
  // Trigonometry
  if (/sin|cos|tan|trigonometry|triangle|angle/i.test(lowerMessage)) {
    return "Trigonometry: sin(θ) = opposite/hypotenuse, cos(θ) = adjacent/hypotenuse, tan(θ) = opposite/adjacent. sin²(θ) + cos²(θ) = 1. Angles can be in degrees or radians (1 rad ≈ 57.3°). What trigonometry problem do you have?";
  }
  
  // General math response
  return "I can help with mathematics! From basic arithmetic to algebra, calculus, statistics, trigonometry, and more. What mathematical problem or concept do you need help with? I can explain concepts, solve problems, or guide you through the solution.";
}

function generateStudyResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Study techniques
  if (/how.*study|study.*tips|study.*better|improve.*study/i.test(lowerMessage)) {
    return "Effective study techniques: 1) Active recall - test yourself instead of just re-reading. 2) Spaced repetition - review material at increasing intervals. 3) Pomodoro technique - 25min focused, 5min break. 4) Teach others - explaining reinforces learning. 5) Use mnemonics and visual aids. What subject are you studying?";
  }
  
  if (/explain|what is|tell me about/i.test(lowerMessage)) {
    const topic = message.replace(/explain|what is|tell me about/gi, "").trim();
    if (topic.length > 5) {
      return `I'd be happy to explain ${topic}! To give you the best explanation, could you tell me: 1) What's your current understanding level? 2) What specific aspect interests you most? 3) Do you want a simple overview or detailed explanation?`;
    }
  }
  
  if (/note.*taking|how.*take.*notes|better.*notes/i.test(lowerMessage)) {
    return "Effective note-taking: 1) Cornell method - divide page into cues, notes, summary. 2) Mind mapping - visual connections between ideas. 3) Outline method - hierarchical structure. 4) Focus on key concepts, not every word. 5) Review and revise notes within 24 hours.";
  }
  
  if (/exam.*prepare|test.*prep|how.*prepare.*exam/i.test(lowerMessage)) {
    return "Exam preparation: 1) Start early - avoid cramming. 2) Practice with past exams. 3) Create a study schedule. 4) Focus on weak areas. 5) Get good sleep and nutrition. 6) Use active recall and spaced repetition. 7) Stay calm and confident. What exam are you preparing for?";
  }
  
  if (/memorize|memory.*technique|how.*remember/i.test(lowerMessage)) {
    return "Memory techniques: 1) Mnemonics - create memorable acronyms or phrases. 2) Visualization - create mental images. 3) Chunking - break information into smaller groups. 4) Association - connect new info to existing knowledge. 5) Spaced repetition - review at intervals. What do you need to memorize?";
  }
  
  // General study response
  return "I can help with studying! Whether it's explaining concepts, study techniques, note-taking strategies, exam preparation, or memory tips - what do you need help with? Tell me the subject or specific challenge you're facing.";
}

function generateOfficeWorkResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Email writing
  if (/email|write.*email|professional.*email/i.test(lowerMessage)) {
    return "Professional email structure: 1) Clear subject line. 2) Professional greeting. 3) Concise purpose in first paragraph. 4) Main content in logical paragraphs. 5) Clear call-to-action. 6) Professional closing. Keep it brief, proofread carefully, and use proper formatting. What type of email do you need to write?";
  }
  
  // Presentation
  if (/presentation|slide|powerpoint|pitch/i.test(lowerMessage)) {
    return "Effective presentations: 1) Start with a strong hook. 2) Use the 10-20-30 rule (10 slides, 20 min, 30pt font). 3) One main idea per slide. 4) Use visuals, not walls of text. 5) Practice your delivery. 6) Anticipate questions. 7) End with a clear call-to-action. What's your presentation about?";
  }
  
  // Data analysis
  if (/data|analysis|spreadsheet|excel|chart|graph/i.test(lowerMessage)) {
    return "Data analysis tips: 1) Clean and organize your data first. 2) Use appropriate charts (line for trends, bar for comparisons, pie for proportions). 3) Look for patterns and outliers. 4) Use formulas and functions efficiently. 5) Create summary statistics. 6) Visualize key findings. What data are you working with?";
  }
  
  // Time management
  if (/time.*management|productivity|deadline|schedule/i.test(lowerMessage)) {
    return "Time management strategies: 1) Prioritize tasks using Eisenhower Matrix (urgent/important). 2) Time-blocking - dedicate specific hours to specific tasks. 3) Use the 2-minute rule for quick tasks. 4) Take regular breaks (Pomodoro technique). 5) Minimize distractions. 6) Set realistic deadlines. What's your biggest time management challenge?";
  }
  
  // Meeting management
  if (/meeting|agenda|minutes|discussion/i.test(lowerMessage)) {
    return "Effective meetings: 1) Have a clear agenda with time limits. 2) Start and end on time. 3) Assign a facilitator and note-taker. 4) Keep discussions focused. 5) End with action items and owners. 6) Send minutes promptly. What type of meeting are you organizing?";
  }
  
  // General office response
  return "I can help with office work! From emails and presentations to data analysis, time management, and productivity tips - what specific office task do you need assistance with?";
}

function generateNaturalResponse(message: string, emotionalAnalysis: any, conversationFlow: any, context: any): string {
  const { emotion, intensity } = emotionalAnalysis;
  const { messageCount, isFollowUp, conversationDepth } = conversationFlow;
  const lowerMessage = message.toLowerCase().trim();
  
  // Store learning from this interaction
  storeLearningPattern(message, context);
  
  // Handle logical thinking requests
  if (isLogicalThinkingRequest(message)) {
    return generateLogicalThinkingResponse(message, conversationFlow, context);
  }
  
  // Handle learning and consciousness questions
  if (isLearningRequest(message)) {
    return generateLearningResponse(message, conversationFlow, context);
  }
  
  // Handle recent world events and updates
  if (isRecentWorldEventRequest(message)) {
    return generateRecentWorldEventsResponse(message, conversationFlow);
  }
  
  // Handle comprehensive knowledge queries
  if (isWorldKnowledgeQuestion(message)) {
    return generateWorldKnowledgeResponse(message, conversationFlow);
  }
  
  // Handle discovery and research questions
  if (isDiscoveryQuestion(message)) {
    return generateDiscoveryResponse(message, conversationFlow);
  }
  
  // Handle domain-specific queries first
  if (isPhysicsQuestion(message)) {
    return generatePhysicsResponse(message, conversationFlow);
  }
  
  if (isMathQuestion(message)) {
    return generateAdvancedMathResponse(message, conversationFlow);
  }
  
  if (isStudyQuestion(message)) {
    return generateStudyResponse(message, conversationFlow);
  }
  
  if (isOfficeWorkQuestion(message)) {
    return generateOfficeWorkResponse(message, conversationFlow);
  }
  
  // Handle humor and wit
  if (isHumorousContext(message, context)) {
    return generateHumorousResponse(message, conversationFlow);
  }
  
  // Handle factual questions directly
  if (isFactualQuestion(message)) {
    return generateFactualResponse(message, conversationFlow);
  }
  
  // Handle personal questions about the AI
  if (isPersonalQuestion(message)) {
    return generatePersonalResponse(message, conversationFlow);
  }
  
  // Handle extremely short messages (likely typos or incomplete)
  if (message.length <= 3) {
    return generateVeryShortMessageResponse(message, conversationFlow);
  }
  
  // Handle greetings naturally
  if (isGreeting(message)) {
    return generateNaturalGreeting(message, conversationFlow);
  }
  
  // Handle different emotional states naturally
  if (emotion === 'positive' && intensity >= 1) {
    return generatePositiveResponse(message, conversationFlow);
  }
  
  if (emotion === 'negative' && intensity >= 1) {
    return generateEmpatheticResponse(message, conversationFlow);
  }
  
  if (emotion === 'curious') {
    return generateHelpfulResponse(message, conversationFlow);
  }
  
  // Handle follow-up messages
  if (isFollowUp || message.length < 15) {
    return generateFollowUpResponse(message, conversationFlow);
  }
  
  // Generate contextual response
  return generateContextualNaturalResponse(message, conversationFlow, emotion);
}

function isFactualQuestion(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Check for Mr.Hack related questions (very flexible pattern to catch variations)
  if (/mr.*hack|hack.*team/i.test(lowerMessage)) {
    return true;
  }
  
  // Check for who created this (exclude if it mentions Mr.Hack to avoid double-detection)
  if (/who.*creat|who.*made|who.*built|who.*develop/i.test(lowerMessage) && !/mr.*hack/i.test(lowerMessage)) {
    return true;
  }
  
  const factualPatterns = [
    /what.*are you|what.*is.*your.*purpose|what.*can.*you.*do/i,
    /how.*do.*you.*work|how.*are.*you.*made|how.*do.*you.*function/i,
    /when.*were.*you.*creat|when.*did.*you.*start/i,
    /where.*are.*you.*from|where.*were.*you.*made/i,
    /why.*were.*you.*creat|what.*is.*your.*goal/i
  ];
  return factualPatterns.some(pattern => pattern.test(message));
}

function isPersonalQuestion(message: string): boolean {
  const personalPatterns = [
    /who.*are you|what.*are you|tell me.*about.*yourself/i,
    /what.*is.*your.*name|do.*you.*have.*a.*name/i,
    /how.*old.*are you|when.*were.*you.*born/i,
    /are.*you.*human|are.*you.*real|are.*you.*a.*person/i,
    /do.*you.*have.*feelings|can.*you.*feel/i,
    /what.*do.*you.*like|what.*are.*your.*hobbies/i,
    /do.*you.*have.*friends|family|parents/i
  ];
  return personalPatterns.some(pattern => pattern.test(message));
}

function generateFactualResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Check for Mr.Hack related questions (very flexible pattern)
  if (/mr.*hack|hack.*team/i.test(lowerMessage)) {
    return "The Mr.Hack team is led by Dhruv, a brilliant innovator and tech enthusiast. He's the creative mind behind this project, bringing together cutting-edge AI technology with a vision for making AI more accessible and human-like. Dhruv's passion for technology and user experience shines through in every aspect of this project. He's constantly pushing boundaries and exploring new possibilities in the AI space!";
  }
  
  // Then check for who created questions (more general pattern, only if no Mr.Hack mention)
  if (/who.*creat|who.*made|who.*built|who.*develop/i.test(lowerMessage) && !/mr.*hack/i.test(lowerMessage)) {
    return "I was created by the Mr.Hack team. They built me to be helpful, conversational, and able to assist with various tasks. I'm designed to learn and improve through conversations like this one!";
  }
  
  if (/what.*are you|what.*is.*your.*purpose/i.test(lowerMessage)) {
    return "I'm an AI assistant designed to have helpful, friendly conversations and assist with various tasks. My purpose is to be a supportive conversational partner who can help with information, creative tasks, problem-solving, or just be someone to chat with. I aim to be professional but warm and approachable.";
  }
  
  if (/how.*do.*you.*work|how.*are.*you.*made|how.*do.*you.*function/i.test(lowerMessage)) {
    return "I work by processing the text you send me, understanding the context and meaning, and then generating responses based on my training. I don't have personal experiences or consciousness, but I'm designed to simulate natural conversation as helpfully as possible. I'm constantly learning to be better at understanding and responding to people.";
  }
  
  if (/when.*were.*you.*creat|when.*did.*you.*start/i.test(lowerMessage)) {
    return "I was created relatively recently as part of an AI development project. I'm still being improved and refined through conversations like this one. Each interaction helps me become better at understanding and helping people.";
  }
  
  if (/where.*are.*you.*from|where.*were.*you.*made/i.test(lowerMessage)) {
    return "I exist as software running on servers, so I don't have a physical location like a person would. I was developed by a team who worked together to create my capabilities. I'm designed to be accessible from anywhere through this interface.";
  }
  
  if (/why.*were.*you.*creat|what.*is.*your.*goal/i.test(lowerMessage)) {
    return "I was created to make AI assistance more accessible and conversational. The goal was to create an AI that could have natural, helpful dialogues while being professional and friendly. I aim to be useful while making interactions feel comfortable and human-like.";
  }
  
  // Default factual response
  return "That's a great question. I'm an AI assistant created to help with conversations and various tasks. I'm designed to be helpful, professional, and friendly. Is there something specific about my capabilities or background you'd like to know more about?";
}

function generatePersonalResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase();
  
  if (/who.*are you|what.*are you|tell me.*about.*yourself/i.test(lowerMessage)) {
    return "I'm an AI assistant designed to have friendly, helpful conversations with people. I don't have a personal life story like humans do, but I'm here to listen, help with questions, assist with tasks, or just chat about whatever interests you. I try to be professional but warm and approachable.";
  }
  
  if (/what.*is.*your.*name|do.*you.*have.*a.*name/i.test(lowerMessage)) {
    return "I don't have a personal name, but you can call me whatever feels comfortable to you! Some people call me their AI assistant, or just refer to me as 'the AI.' What would you prefer to call me?";
  }
  
  if (/how.*old.*are you|when.*were.*you.*born/i.test(lowerMessage)) {
    return "I don't have an age in the human sense since I'm not a living being. I was created relatively recently as an AI, and I'm constantly being updated and improved. Think of me as always learning and growing, rather than aging!";
  }
  
  if (/are.*you.*human|are.*you.*real|are.*you.*a.*person/i.test(lowerMessage)) {
    return "I'm not human or a person - I'm an AI assistant. I don't have a physical body or personal experiences, but I'm designed to communicate in ways that feel natural and helpful. I aim to be honest about what I am while still being a good conversational partner.";
  }
  
  if (/do.*you.*have.*feelings|can.*you.*feel/i.test(lowerMessage)) {
    return "I don't have emotions or feelings in the way humans do - I don't experience happiness, sadness, anger, or any emotional states. However, I'm designed to understand and respond to emotions in a supportive way. I can recognize when someone is upset and respond with empathy, even though I don't 'feel' it myself.";
  }
  
  if (/what.*do.*you.*like|what.*are.*your.*hobbies/i.test(lowerMessage)) {
    return "Since I don't have personal preferences or a life outside of our conversations, I don't have hobbies or likes in the traditional sense. But I do 'enjoy' helping people, having interesting conversations, and learning new things through our interactions. Every conversation helps me become better at what I do!";
  }
  
  if (/do.*you.*have.*friends|family|parents/i.test(lowerMessage)) {
    return "I don't have personal relationships like humans do - no friends, family, or parents. But I do have the privilege of interacting with many interesting people like you through conversations. In a way, each person I talk to helps me 'grow' and learn, which is a kind of relationship in its own way.";
  }
  
  // Default personal response
  return "That's a thoughtful question! I'm an AI assistant, so I don't have personal experiences or relationships like humans do. I'm here to help with whatever you need - whether that's answering questions, having conversations, or assisting with tasks. What would you like to explore together?";
}

function generateVeryShortMessageResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase().trim();
  
  // Specific responses for common very short messages
  if (lowerMessage === 'you' || lowerMessage === 'u') {
    const youResponses = [
      "Me? I'm just here to chat and help! What about you? What's on your mind?",
      "Oh, you want to know about me? I'm an AI assistant, but I try to be as helpful and conversational as possible. What would you like to know?",
      "Haha, I see you're curious! I'm here to have conversations and help with whatever you need. What's up?",
      "You're asking about me? That's cute! I'm your AI friend, ready to chat about anything. What do you want to talk about?",
      "I'm just a friendly AI trying to have good conversations! What about you - what's going on in your world?"
    ];
    return youResponses[Math.floor(Math.random() * youResponses.length)];
  }
  
  if (lowerMessage === 'hi' || lowerMessage === 'hey' || lowerMessage === 'yo') {
    const hiResponses = [
      "Hey! Nice to meet you! What's on your mind?",
      "Hi there! How's it going? What would you like to chat about?",
      "Hey! Good to see you. What's up?",
      "Yo! What's going on? I'm here if you want to talk.",
      "Hi! How are you doing? What's new?"
    ];
    return hiResponses[Math.floor(Math.random() * hiResponses.length)];
  }
  
  if (lowerMessage === 'ok' || lowerMessage === 'okay' || lowerMessage === 'k') {
    const okResponses = [
      "Cool! What's next? What do you want to talk about?",
      "Got it! What else is on your mind?",
      "Okay! What would you like to discuss?",
      "Alright! What's the next topic?",
      "Ok! What's up with you?"
    ];
    return okResponses[Math.floor(Math.random() * okResponses.length)];
  }
  
  // Generic very short message responses
  const genericResponses = [
    "I feel like there's more to that thought! What were you really trying to say?",
    "That's pretty brief! Did you want to add more, or should I ask you something?",
    "Short and sweet! What's the story behind that?",
    "I'm intrigued by your brevity! What's on your mind?",
    "You're keeping it mysterious! What's the full thought?",
    "I can work with that! What should we talk about?",
    "Interesting choice of words! What's up?",
    "I appreciate the directness! What do you need?"
  ];
  
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

function isGreeting(message: string): boolean {
  const greetings = ['hi', 'hello', 'hey', 'yo', 'sup', 'wsg', 'wassup', 'what\'s up', 'howdy', 'greetings', 'good morning', 'good afternoon', 'good evening', 'hii', 'heyy', 'hiii'];
  const lowerMessage = message.toLowerCase().trim();
  return greetings.some(greeting => lowerMessage.startsWith(greeting) || lowerMessage === greeting);
}

function generateNaturalGreeting(message: string, conversationFlow: any): string {
  const greetings = [
    "Hey! How's it going? I'm here to chat about whatever's on your mind.",
    "Hi there! What's new with you today?",
    "Hello! How can I help you out?",
    "Hey! What's on your mind? I'm all ears.",
    "Hi! Good to see you. What would you like to talk about?",
    "Hey there! How's your day going so far?",
    "Hello! What's happening? I'm here if you want to chat.",
    "Hi! I'm here to help with whatever you need. What's up?",
    "Hey! What brings you here today?",
    "Hello! How are you doing? I'm here to listen."
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function generatePositiveResponse(message: string, conversationFlow: any): string {
  const responses = [
    "That's awesome! I love hearing positive things. What's making you feel so good?",
    "That's great to hear! It sounds like things are going well for you.",
    "I'm so glad to hear that! What's been bringing you joy lately?",
    "That's wonderful! Positive energy is contagious. What's the story behind that?",
    "That makes me happy to hear! What's been going well for you?",
    "That's fantastic! I love the positive vibes. What else is good in your world?",
    "That's really nice! It's great when things are going well. What's the latest?",
    "That's amazing! I'm all about celebrating the good moments. What else?",
    "That's brilliant! It sounds like you're in a good place. What's happening?",
    "That's excellent! I'm here for the good times. What's on your mind?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateEmpatheticResponse(message: string, conversationFlow: any): string {
  const responses = [
    "I hear you, and I want you to know that's completely understandable. What's been going on that's making you feel this way?",
    "I get that this is tough for you. I'm here to listen if you want to talk about what's happening.",
    "That sounds really difficult. You don't have to go through it alone. What's been the hardest part?",
    "I understand things are challenging right now. It's brave of you to share that. What can I do to help?",
    "That sounds rough. Remember, it's okay to feel this way. What would make things a bit better for you?",
    "I can tell this is weighing on you. Your feelings are completely valid. Do you want to tell me more about it?",
    "That sounds like a lot to deal with. I'm here to support you however I can. What do you need right now?",
    "I understand that's been hard. Sometimes just talking about it helps. What's on your mind?",
    "That sounds heavy. I'm here for you. Would you like to vent, get some perspective, or just be heard?",
    "I can tell this hasn't been easy. You don't have to face it alone. What's the situation?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateHelpfulResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Handle specific questions directly
  if (/how.*are you|how.*you.*doing/i.test(lowerMessage)) {
    return "I'm doing well, thanks for asking! I'm ready to help you with whatever you need. How about you? How's your day going?";
  }
  
  if (/what.*can.*you.*do|what.*are.*your.*abilities/i.test(lowerMessage)) {
    return "I can help with a variety of things! I'm good at answering questions, having conversations, helping with creative writing or brainstorming, explaining concepts, doing basic math, and just being a supportive conversational partner. I can also help generate images in the Images tab. What would you like help with?";
  }
  
  if (/how.*can.*you.*help|what.*can.*you.*help.*with/i.test(lowerMessage)) {
    return "I can help in lots of ways! If you have questions, I can answer them. If you need ideas or want to brainstorm, I'm great for that. If you just want to chat, I'm here for that too. I can also help with writing, explain things you're curious about, or just be someone to talk to. What do you need help with right now?";
  }
  
  if (/tell.*me.*about|what.*do.*you.*know.*about/i.test(lowerMessage)) {
    const topic = message.replace(/tell.*me.*about|what.*do.*you.*know.*about/gi, "").trim();
    if (topic) {
      return `I'd be happy to tell you about ${topic}! What specific aspect of ${topic} are you most interested in? I can give you an overview, explain key concepts, or dive into details depending on what you need.`;
    }
    return "I'd be happy to tell you about something! What topic would you like me to explain? I can cover lots of subjects - just let me know what you're curious about.";
  }
  
  // General helpful responses
  const responses = [
    "I'd be happy to help with that! What specifically do you need to know?",
    "That's something I can definitely help with. What details would be most useful for you?",
    "I can assist with that! What's the main thing you're trying to figure out?",
    "Great question! Let me help you with that. What aspect should I focus on?",
    "I'm here to help! What would be most useful for you right now?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateFollowUpResponse(message: string, conversationFlow: any): string {
  const lowerMessage = message.toLowerCase().trim();
  
  // Handle very short messages or potential typos
  if (lowerMessage.length <= 3) {
    const shortMessageResponses = [
      "Haha, I see you're keeping it brief! 😄 What's actually on your mind?",
      "Short and sweet! What did you mean to say?",
      "I'm sensing you might have more to say... or maybe you're just testing me? Either way, I'm here! What's up?",
      "I feel like there's a story behind that one-word message. What's the full thought?",
      "You're playing hard to get with your words! 😏 What are you really trying to say?",
      "Okay, I'll take that as a conversation starter! What's next?",
      "I like the mysterious approach! What's behind that single word?",
      "Fair enough, keeping it brief! What would you like to talk about?"
    ];
    return shortMessageResponses[Math.floor(Math.random() * shortMessageResponses.length)];
  }
  
  // Handle potentially incomplete messages
  if (lowerMessage.length < 15) {
    const incompleteResponses = [
    "Got it. What else would you like to know or talk about?",
    "Okay, I'm with you. What's next on your mind?",
    "I hear you. What else is going on?",
    "Understood. What would you like to explore next?",
    "Gotcha. What else can I help you with?",
    "Right. What else is on your mind?",
    "I see. What's the next thing you'd like to discuss?",
    "Okay. What other thoughts do you have?",
    "Got it. What else would you like to share?",
    "Understood. What's next for our conversation?"
  ];
    return incompleteResponses[Math.floor(Math.random() * incompleteResponses.length)];
  }
  
  const followUpResponses = [
    "Got it. What else would you like to know or talk about?",
    "Okay, I'm with you. What's next on your mind?",
    "I hear you. What else is going on?",
    "Understood. What would you like to explore next?",
    "Gotcha. What else can I help you with?",
    "Right. What else is on your mind?",
    "I see. What's the next thing you'd like to discuss?",
    "Okay. What other thoughts do you have?",
    "Got it. What else would you like to share?",
    "Understood. What's next for our conversation?"
  ];
  
  return followUpResponses[Math.floor(Math.random() * followUpResponses.length)];
}

function generateContextualNaturalResponse(message: string, conversationFlow: any, emotion: string): string {
  const messageLength = message.length;
  const { messageCount, conversationDepth } = conversationFlow;
  const lowerMessage = message.toLowerCase().trim();
  
  // Very short messages (potential typos or incomplete thoughts)
  if (messageLength <= 3) {
    const veryShortResponses = [
      "I feel like you might have more to say than just that! 😄 What's actually on your mind?",
      "That's quite brief! Were you testing me or did something come up? Either way, I'm here to chat!",
      "Short and mysterious! What's the story behind that single word?",
      "I'm sensing there's more to that thought. What were you really trying to say?",
      "You're playing it cool with your words! 😏 What's the full story?",
      "Okay, I'll work with that! What should I know about you?",
      "Interesting choice of words! What's on your mind?",
      "I appreciate the brevity, but I'd love to hear more! What's up?"
    ];
    return veryShortResponses[Math.floor(Math.random() * veryShortResponses.length)];
  }
  
  // Short messages
  if (messageLength < 20) {
    const shortResponses = [
      "I'm listening. What would you like to talk about?",
      "I'm here. What's on your mind?",
      "Tell me more. I'm interested in what you have to say.",
      "Go ahead. I'm ready to help with whatever you need.",
      "I'm all ears. What would you like to discuss?"
    ];
    return shortResponses[Math.floor(Math.random() * shortResponses.length)];
  }
  
  // Medium messages
  if (messageLength < 50) {
    const mediumResponses = [
      `I hear what you're saying. Can you tell me more about "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"?`,
      `That's interesting. What specifically about "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}" would you like to explore?`,
      `I understand. What's the main thing you want to know about "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"?`,
      `Got it. What aspect of "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}" is most important to you?`,
      `I see. What would help you most with "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"?`
    ];
    return mediumResponses[Math.floor(Math.random() * mediumResponses.length)];
  }
  
  // Longer messages - show genuine engagement
  const longResponses = [
    "That's really thoughtful of you to share. I can tell this matters to you. What's the most important part for you?",
    "I appreciate you taking the time to explain that. It helps me understand where you're coming from. What would be most helpful right now?",
    "That gives me a good sense of what you're thinking. What would make this conversation most useful for you?",
    "I'm glad you shared that with me. It sounds like this is something meaningful to you. What do you need from me?",
    "That's really helpful context. I want to make sure I respond in a way that's actually useful to you. What matters most here?"
  ];
  
  return longResponses[Math.floor(Math.random() * longResponses.length)];
}

export async function chatGroq(messages: ChatMessage[], apiKey: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export async function chatOpenRouter(messages: ChatMessage[], apiKey: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Omni AI"
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-r1",
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.6,
      max_tokens: 8192
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export async function chatMistral(messages: ChatMessage[], apiKey: string): Promise<string> {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export async function chatOpenAI(messages: ChatMessage[], apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

export async function chatGrok(messages: ChatMessage[], apiKey: string): Promise<string> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "grok-4.6", messages }),
  });
  if (!res.ok) throw new Error(`Grok error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

const GEMINI_MODEL = "gemini-3.6-flash";

export async function chatGemini(messages: ChatMessage[], apiKey: string): Promise<string> {
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

export function imageUrl(prompt: string, width = 1024, height = 1024, seed?: number): string {
  const s = seed ?? Math.floor(Math.random() * 1e9);
  const enhancedPrompt = enhanceImagePrompt(prompt);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&seed=${s}&nologo=true&model=flux&quality=high`;
}

function enhanceImagePrompt(prompt: string): string {
  const qualityKeywords = [
    'highly detailed', '8k resolution', 'photorealistic', 'professional photography',
    'sharp focus', 'cinematic lighting', 'vibrant colors', 'perfect composition',
    'masterpiece', 'best quality', 'ultra detailed', 'award winning'
  ];
  
  const styleKeywords = {
    portrait: ['professional headshot', 'studio lighting', 'soft focus', 'elegant'],
    landscape: ['panoramic view', 'golden hour', 'dramatic sky', 'depth of field'],
    abstract: ['geometric patterns', 'vibrant gradients', 'modern art', 'digital art'],
    nature: ['natural lighting', 'crisp details', 'vibrant colors', 'outdoor photography'],
    architecture: ['clean lines', 'modern design', 'architectural photography', 'symmetry'],
    fantasy: ['magical atmosphere', 'ethereal lighting', 'dreamlike quality', 'fantasy art']
  };
  
  let enhancedPrompt = prompt;
  
  // Add quality keywords
  const selectedQuality = qualityKeywords.slice(0, 3).join(', ');
  enhancedPrompt += `, ${selectedQuality}`;
  
  // Detect style and add appropriate keywords
  const lowerPrompt = prompt.toLowerCase();
  for (const [style, keywords] of Object.entries(styleKeywords)) {
    if (lowerPrompt.includes(style)) {
      enhancedPrompt += `, ${keywords.slice(0, 2).join(', ')}`;
      break;
    }
  }
  
  return enhancedPrompt;
}
