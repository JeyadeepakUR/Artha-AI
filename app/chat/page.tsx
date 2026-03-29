'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout, TopBar } from '@/components/Layout';
import { useAppStore } from '@/lib/store';
import { Bot, Loader2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

export default function ChatScreen() {
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const authUser = useAppStore((state) => state.authUser);
  const userProfile = useAppStore((state) => state.userProfile);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `Hi ${userProfile?.name || 'there'}! I'm your financial mentor. Ask me anything about retirement planning, investments, tax optimization, or financial health. What's on your mind?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const thinkingStages = ['Reading your profile context', 'Running financial reasoning', 'Writing response'];

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!authUser) {
      router.replace('/auth/login?next=/chat');
      return;
    }

    if (!userProfile) {
      router.replace('/onboarding');
    }
  }, [hasHydrated, authUser, userProfile, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!loading) {
      setThinkingStage(0);
      return;
    }

    const interval = setInterval(() => {
      setThinkingStage((prev) => (prev + 1) % thinkingStages.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [loading, thinkingStages.length]);

  const handleSendMessage = async () => {
    if (!input.trim() || !userProfile) return;

    const userMessage = input;
    setInput('');

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add assistant message
        setMessages((prev) => [...prev, { role: 'assistant', content: data.assistantMessage }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <TopBar title="Money Mentor AI" />
        <main className="flex-1 overflow-y-auto px-8 py-6 max-w-4xl mx-auto w-full pb-32">
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'flex-col items-end' : 'items-start gap-3'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-xl max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-white border border-outline-variant/20 shadow-sm rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-primary prose-strong:text-on-surface prose-code:rounded prose-code:bg-surface-container-low prose-code:px-1 prose-code:py-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && <span className="text-[10px] text-on-surface-variant mt-1">{new Date().toLocaleTimeString()}</span>}
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="bg-white p-4 rounded-xl rounded-tl-sm border border-outline-variant/20 min-w-[240px]">
                  <p className="text-sm font-semibold text-primary/90">{thinkingStages[thinkingStage]}...</p>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 rounded bg-surface-container-low animate-pulse"></div>
                    <div className="h-2 w-5/6 rounded bg-surface-container-low animate-pulse"></div>
                    <div className="h-2 w-3/4 rounded bg-surface-container-low animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <div className="p-4 bg-white border-t border-outline-variant/20 sticky bottom-0">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your mentor..."
              className="flex-1 bg-surface-container-low border-none rounded-md px-4 py-3 focus:ring-1 focus:ring-primary"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-primary text-white w-12 rounded-md flex items-center justify-center hover:opacity-90 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
