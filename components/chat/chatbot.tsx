'use client';

import { useChat } from 'ai/react';
import { Send, Bot, User, Loader2, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChatbotProps {
  userId: string;
  childId?: string;
}

export function Chatbot({ userId, childId }: ChatbotProps) {
  const [mounted, setMounted] = useState(false);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      userId,
      childId,
      deviceTime: new Date().toISOString(), // UTC time for consistency
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-t-lg border-b">
          <Bot className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="font-semibold text-gray-900">Baby Tracking Assistant</h2>
            <p className="text-sm text-gray-600">Ask me about your baby&apos;s activities</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-t-lg border-b">
        <Bot className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="font-semibold text-gray-900">Baby Tracking Assistant</h2>
          <p className="text-sm text-gray-600">Ask me about your baby&apos;s activities</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Hi there! 👋</p>
            <p className="text-sm">I can help you track your baby&apos;s activities. Try asking:</p>
            <ul className="text-sm mt-2 space-y-1 text-left max-w-xs mx-auto">
              <li>• &ldquo;Is my baby sleeping?&rdquo;</li>
              <li>• &ldquo;When did baby last eat?&rdquo;</li>
              <li>• &ldquo;Show me today&apos;s summary&rdquo;</li>
              <li>• &ldquo;Start sleep tracking&rdquo;</li>
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex gap-3 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>

            {/* Tool calls visualization */}
            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="ml-11 space-y-2">
                {message.toolInvocations.map((toolInvocation, index) => (
                  <div
                    key={index}
                    className="text-xs bg-orange-50 border border-orange-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 text-orange-700 font-medium mb-1">
                      <Wrench className="w-3 h-3" />
                      {getToolDisplayName(toolInvocation.toolName)}
                    </div>
                    
                    {toolInvocation.state === 'call' && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Running...</span>
                      </div>
                    )}
                    
                    {toolInvocation.state === 'result' && (
                      <div className="text-orange-600">
                        <details className="cursor-pointer">
                          <summary className="hover:text-orange-700">
                            ✅ Completed - Click to see details
                          </summary>
                          <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(toolInvocation.result, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                    
                    {toolInvocation.state === 'result' && 'error' in toolInvocation && (
                      <div className="text-red-600">
                        ❌ Error: {String(toolInvocation.error)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me about your baby&apos;s activities..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function getToolDisplayName(toolName: string): string {
  const displayNames: Record<string, string> = {
    checkActiveSessions: 'Checking current activities',
    getDailySummary: 'Getting daily summary',
    getRecentActivities: 'Getting recent activities',
    getLastActivity: 'Finding last activity',
    startActivity: 'Starting activity',
    endActivity: 'Ending activity',
    logDiaperChange: 'Logging diaper change',
  };
  
  return displayNames[toolName] || toolName;
}
