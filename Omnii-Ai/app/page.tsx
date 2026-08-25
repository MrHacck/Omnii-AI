"use client";

import { useEffect, useRef, useState } from "react";
import { imageUrl, type ChatMessage, type ModelChoice } from "@/lib/providers";

type Tab = "chat" | "images" | "settings";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<(ChatMessage & { model?: string })[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<ModelChoice>("auto");
  const [speak, setSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [grokKey, setGrokKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [mistralKey, setMistralKey] = useState("");
  const [imgPrompt, setImgPrompt] = useState("");
  const [images, setImages] = useState<{ prompt: string; url: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setOpenaiKey(localStorage.getItem("openai_key") ?? "");
    setGeminiKey(localStorage.getItem("gemini_key") ?? "");
    setGrokKey(localStorage.getItem("grok_key") ?? "");
    setGroqKey(localStorage.getItem("groq_key") ?? "");
    setOpenrouterKey(localStorage.getItem("openrouter_key") ?? "");
    setMistralKey(localStorage.getItem("mistral_key") ?? "");
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function saveKeys() {
    localStorage.setItem("openai_key", openaiKey);
    localStorage.setItem("gemini_key", geminiKey);
    localStorage.setItem("grok_key", grokKey);
    localStorage.setItem("groq_key", groqKey);
    localStorage.setItem("openrouter_key", openrouterKey);
    localStorage.setItem("mistral_key", mistralKey);
    setTab("chat");
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          model,
          keys: { 
            openai: openaiKey || undefined, 
            gemini: geminiKey || undefined, 
            grok: grokKey || undefined,
            groq: groqKey || undefined,
            openrouter: openrouterKey || undefined,
            mistral: mistralKey || undefined
          },
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      const reply: string = data.reply ?? `Error: ${data.error}`;
      setMessages((m: (ChatMessage & { model?: string })[]) => [...m, { role: "assistant", content: reply, model: data.model }]);
      if (speak && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(reply);
        
        // Get available voices and select the best one
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Samantha') || 
          voice.name.includes('Daniel') ||
          voice.name.includes('Microsoft') ||
          voice.lang.startsWith('en')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        // Natural speech parameters
        utterance.rate = 0.95; // Slightly slower for better clarity
        utterance.pitch = 1.0; // Natural pitch
        utterance.volume = 1.0; // Full volume
        
        // Add natural pauses for punctuation
        utterance.text = reply
          .replace(/\./g, '. ')
          .replace(/\?/g, '? ')
          .replace(/!/g, '! ')
          .replace(/,/g, ', ');
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
      console.error("Chat error:", errorMessage);
      setMessages((m: (ChatMessage & { model?: string })[]) => [...m, { role: "assistant", content: `Error: ${errorMessage}` }]);
    } finally {
      setLoading(false);
    }
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const rec = new Ctor();
    
    // Enhanced speech recognition settings for better accuracy
    rec.lang = "en-US";
    rec.interimResults = false; // Simplified for better compatibility
    
    rec.onresult = (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => {
      const transcript = e.results[0][0].transcript;
      setListening(false);
      void send(transcript);
    };
    
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  function generateImage() {
    const p = imgPrompt.trim();
    if (!p) return;
    setImages((imgs: { prompt: string; url: string }[]) => [{ prompt: p, url: imageUrl(p) }, ...imgs]);
    setImgPrompt("");
  }

  const modelLabel: Record<string, string> = {
    free: "Omni AI (Local)",
    openai: "GPT-4o-mini",
    gemini: "Gemini Flash",
    grok: "Grok 4.6",
  };

  return (
    <div className="flex h-screen flex-col text-white heavenly-bg relative overflow-hidden">
      {/* Floating Particles */}
      <div className="particle" style={{ width: '300px', height: '300px', top: '10%', left: '10%', animationDelay: '0s' }}></div>
      <div className="particle" style={{ width: '200px', height: '200px', top: '60%', left: '80%', animationDelay: '2s' }}></div>
      <div className="particle" style={{ width: '250px', height: '250px', top: '80%', left: '20%', animationDelay: '4s' }}></div>
      <div className="particle" style={{ width: '180px', height: '180px', top: '30%', left: '70%', animationDelay: '1s' }}></div>
      <div className="particle" style={{ width: '220px', height: '220px', top: '50%', left: '40%', animationDelay: '3s' }}></div>
      <header className="flex items-center justify-between glass-strong px-6 py-4 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 ethereal-glow hover-lift">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white text-glow">
              Omni AI
            </h1>
            <p className="text-xs text-gray-400">Heavenly Intelligence</p>
          </div>
        </div>
        <nav className="flex gap-2 glass rounded-xl p-1.5">
          {(["chat", "images", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-5 py-2.5 text-sm font-medium capitalize transition-all duration-300 rounded-lg button-3d ${
                tab === t
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white ethereal-glow"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      {tab === "chat" && (
        <main className="flex flex-1 flex-col overflow-hidden relative z-5">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {messages.length === 0 && (
              <div className="mt-32 flex flex-col items-center justify-center text-center">
                <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-fuchsia-500/30 ethereal-glow hover-lift">
                  <svg className="h-10 w-10 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-semibold text-white text-glow mb-4">Welcome to Omni AI</h2>
                <p className="mt-4 max-w-lg text-sm text-gray-300 leading-relaxed">
                  Experience heavenly intelligence with our ethereal AI assistant. Engage in beautiful conversations, create stunning images, and explore the future of artificial intelligence.
                </p>
                <div className="mt-10 flex gap-4">
                  <button
                    onClick={() => setTab("settings")}
                    className="rounded-xl glass-strong px-6 py-3 text-sm font-medium text-white hover-lift shimmer"
                  >
                    ✨ Setup API Keys
                  </button>
                  <button
                    onClick={() => setTab("images")}
                    className="rounded-xl glass px-6 py-3 text-sm font-medium text-gray-300 hover-lift"
                  >
                    🎨 Create Images
                  </button>
                </div>
              </div>
            )}
            {messages.map((m: ChatMessage & { model?: string }, i: number) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} message-animate`}>
                <div className={`max-w-[85%] space-y-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`rounded-2xl px-6 py-4 text-sm leading-relaxed message-3d ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white ethereal-glow hover-lift"
                      : "glass-strong text-gray-100 border border-white/20 hover-lift"
                  }`}>
                    {m.content}
                  </div>
                  {m.model && (
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-[11px] text-gray-500 font-medium">
                        {modelLabel[m.model] ?? m.model}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-4 text-sm text-gray-400 glass rounded-2xl px-6 py-4 w-fit hover-lift">
                <div className="flex gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 typing-dot" />
                  <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 typing-dot" />
                  <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 typing-dot" />
                </div>
                <span className="text-gray-300">Omni AI is thinking</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="flex items-center gap-4 glass-strong px-6 py-5 z-10">
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as ModelChoice)}
                className="appearance-none rounded-xl border border-white/10 glass px-4 py-3 pr-10 text-sm font-medium text-gray-200 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all cursor-pointer hover:bg-white/10 [&>option]:bg-gray-900 [&>option]:text-gray-200"
                aria-label="Model"
              >
                <option value="auto">Auto Select (Best AI)</option>
                <option value="free">Omni AI (Local)</option>
                <option value="gemini">Gemini 1.5 Pro/Flash</option>
                <option value="groq">Llama 3.3 70B (Fast)</option>
                <option value="openrouter">DeepSeek-R1 (Reasoning)</option>
                <option value="mistral">Mistral Large</option>
                <option value="openai">OpenAI</option>
                <option value="grok">Grok</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Send a message to Omni AI..."
                className="w-full rounded-xl border border-white/10 glass px-5 py-3 pr-12 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all backdrop-blur-sm input-3d"
              />
              {input && (
                <button
                  onClick={() => setInput("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={toggleMic}
              title="Voice input"
              className={`rounded-xl border px-4 py-3 transition-all duration-300 hover-lift ${
                listening
                  ? "border-red-500/50 bg-red-500/10 text-red-400 ethereal-glow"
                  : "border-white/10 glass text-gray-400 hover:text-gray-200 hover:bg-white/10"
              }`}
            >
              {listening ? (
                <svg className="h-5 w-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-gray-200 transition-colors">
              <div className="relative">
                <input type="checkbox" checked={speak} onChange={(e) => setSpeak(e.target.checked)} className="sr-only" />
                <div className={`h-6 w-10 rounded-full transition-colors ${speak ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'glass'}`}>
                  <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform ${speak ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
              <span>Speak</span>
            </label>
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-medium text-white ethereal-glow hover-lift shimmer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </main>
      )}

      {tab === "images" && (
        <main className="flex-1 overflow-y-auto px-6 py-6 relative z-5">
          <div className="mx-auto flex max-w-2xl gap-4 mb-8">
            <div className="flex-1 relative">
              <input
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateImage()}
                placeholder="Describe your imagination..."
                className="w-full rounded-xl border border-white/10 glass px-5 py-4 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all backdrop-blur-sm input-3d"
              />
            </div>
            <button
              onClick={generateImage}
              className="rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-8 py-4 text-sm font-medium text-white ethereal-glow hover-lift shimmer"
            >
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Generate
              </span>
            </button>
          </div>
          {images.length === 0 && (
            <div className="mt-20 flex flex-col items-center justify-center text-center">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-fuchsia-500/30 ethereal-glow hover-lift">
                <svg className="h-10 w-10 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white text-glow mb-3">Create Ethereal Images</h3>
              <p className="text-sm text-gray-300">Describe anything you can imagine and watch it come to life in stunning detail</p>
            </div>
          )}
          <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img: { prompt: string; url: string }, i: number) => (
              <figure key={i} className="group relative overflow-hidden rounded-2xl glass border border-white/20 transition-all duration-500 hover:scale-[1.03] hover:border-violet-500/50 hover-lift">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <figcaption className="absolute bottom-0 left-0 right-0 p-5 text-sm text-gray-200 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <p className="line-clamp-2">{img.prompt}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </main>
      )}

      {tab === "settings" && (
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 relative z-5">
          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-white text-glow mb-3">Settings</h2>
            <p className="text-sm text-gray-300">Configure your heavenly AI experience with custom API keys</p>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl glass-strong border border-white/20 p-8 hover-lift">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-2">API Keys</h3>
                <p className="text-sm text-gray-300">
                  Add your API keys to unlock premium AI models. Keys are stored locally in your browser with heavenly security.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <span className="text-blue-400">●</span>
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full rounded-xl border border-white/10 glass px-5 py-4 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all backdrop-blur-sm input-3d"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <span className="text-violet-400">●</span>
                    Google Gemini API Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIza..."
                      className="w-full rounded-xl border border-white/10 glass px-5 py-4 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all backdrop-blur-sm input-3d"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <span className="text-orange-400">●</span>
                    xAI Grok API Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={grokKey}
                      onChange={(e) => setGrokKey(e.target.value)}
                      placeholder="xai-..."
                      className="w-full rounded-xl border border-white/10 glass px-5 py-4 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all backdrop-blur-sm input-3d"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <span className="text-green-400">●</span>
                    Groq API Key (Llama 3.3 70B)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full rounded-xl border border-white/10 glass px-5 py-4 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all backdrop-blur-sm input-3d"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <span className="text-purple-400">●</span>
                    OpenRouter API Key (DeepSeek-R1)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={openrouterKey}
                      onChange={(e) => setOpenrouterKey(e.target.value)}
                      placeholder="sk-or-..."
                      className="w-full rounded-xl border border-white/10 glass px-5 py-4 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all backdrop-blur-sm input-3d"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <span className="text-pink-400">●</span>
                    Mistral API Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={mistralKey}
                      onChange={(e) => setMistralKey(e.target.value)}
                      placeholder="Mistral API Key"
                      className="w-full rounded-xl border border-white/10 glass px-5 py-4 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30 transition-all backdrop-blur-sm input-3d"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={saveKeys}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-8 py-4 text-sm font-medium text-white ethereal-glow hover-lift shimmer"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setOpenaiKey("");
                    setGeminiKey("");
                    setGrokKey("");
                  }}
                  className="rounded-xl glass border border-white/20 px-8 py-4 text-sm font-medium text-gray-300 backdrop-blur-sm transition-all hover:bg-white/10 hover-lift"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="rounded-2xl glass-strong border border-white/20 p-8 hover-lift">
              <h3 className="text-xl font-semibold text-white mb-4">About Omni AI</h3>
              <div className="space-y-4 text-sm text-gray-300">
                <p><strong className="text-white">Local Model:</strong> Works without any API keys using our heavenly local AI system</p>
                <p><strong className="text-white">Premium Models:</strong> Add API keys for GPT-4o-mini, Gemini Flash, and Grok 4.6 for enhanced capabilities</p>
                <p><strong className="text-white">Privacy:</strong> Your API keys are stored locally in your browser's localStorage with ethereal security</p>
                <p><strong className="text-white">Experience:</strong> Enjoy buttery smooth conversations with our intelligent local AI system</p>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
