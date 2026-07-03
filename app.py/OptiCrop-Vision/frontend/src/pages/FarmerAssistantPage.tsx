import React, { useState, useRef, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Bot, User as UserIcon, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: string;
}

export const FarmerAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState('english');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Hello ${user?.full_name || 'Farmer'}! I am your AI Agriculture Assistant. Ask me about crops, diseases, fertilizers, weather, or soil.`,
        }
      ]);
    }
  }, [user, messages.length]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const data = await fetchApi('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userText,
          language: language,
        }),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-resp',
          sender: 'assistant',
          text: data.response,
          source: data.source,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-err',
          sender: 'assistant',
          text: `Error connecting to assistant: ${error.message}. Please try again later.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-[fade-in_0.4s_ease-out]">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
            <Bot className="text-emerald-400" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">AI Assistant</h1>
            <p className="text-slate-400">Multilingual agricultural advisory guidance.</p>
          </div>
        </div>
        
        <div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 outline-none"
          >
            <option value="english">English</option>
            <option value="telugu">Telugu</option>
            <option value="hindi">Hindi</option>
          </select>
        </div>
      </div>

      <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
        <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-amber-200/80">
          <strong>Advisory Only:</strong> The AI cannot guarantee yields, forecast exact future prices, or confirm diseases with 100% certainty without lab verification. Always consult a local agricultural expert for serious issues.
        </p>
      </div>

      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden border border-white/10 relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                  msg.sender === 'user' 
                    ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' 
                    : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                }`}>
                  {msg.sender === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div className={`p-4 rounded-2xl text-sm md:text-base leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-sm'
                    : 'bg-slate-800/60 border border-slate-700 text-slate-200 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  
                  {msg.source && (
                    <div className="mt-2 text-[10px] uppercase tracking-wider font-semibold text-slate-500 flex justify-end">
                      {msg.source === 'fallback' ? (
                        <span className="text-amber-500/70">Fallback FAQ Engine</span>
                      ) : msg.source === 'groq' ? (
                        <span className="text-orange-400/80">Powered by Groq</span>
                      ) : msg.source === 'openrouter' ? (
                        <span className="text-blue-400/80">Powered by OpenRouter</span>
                      ) : msg.source === 'nvidia' ? (
                        <span className="text-green-400/80">Powered by NVIDIA</span>
                      ) : (
                        <span className="text-emerald-500/70">Powered by Gemini AI</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mt-1">
                  <Bot size={16} />
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-400 rounded-tl-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-slate-900/50">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about crops, fertilizers, diseases..."
              className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block w-full p-3.5 outline-none placeholder:text-slate-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send size={18} />
              <span className="hidden md:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
