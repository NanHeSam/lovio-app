'use client';

import { useState } from 'react';
import { Send, Loader2, Bot, MessageCircle, X } from 'lucide-react';
import { useChat } from 'ai/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AIChatInputProps {
  userId: string;
  childId: string;
  onSuccess?: (message: string) => void;
  onNeedsClarification?: (message: string, context: any) => void;
}

export default function AIChatInput({ 
  userId, 
  childId, 
  onSuccess, 
  onNeedsClarification 
}: AIChatInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useChat({
    api: '/api/chat',
    body: {
      userId,
      childId,
      deviceTime: new Date().toISOString(),
    },
    onFinish: (message) => {
      // Check if this was a successful mutation
      if (message.toolInvocations?.some(tool => 
        ['startActivity', 'logActivity', 'updateActivity'].includes(tool.toolName) && 
        tool.state === 'result' && 
        !('error' in tool.result)
      )) {
        onSuccess?.(message.content);
        setMessages([]); // Clear messages after successful action
        setInput('');
      } else if (message.content.includes('?') || message.content.toLowerCase().includes('clarify')) {
        // AI is asking for clarification
        onNeedsClarification?.(message.content, { messages, userId, childId });
      }
    }
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isExpanded) {
    return (
      <Card className="hover:shadow-md transition-all duration-200 border-dashed border-2 border-gray-300 hover:border-blue-400">
        <CardContent className="p-4">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center gap-3 text-left text-gray-600 hover:text-blue-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <div>
              <div className="font-medium">Ask AI Assistant</div>
              <div className="text-sm text-gray-500">
                "Baby started sleeping", "When did baby last eat?"
              </div>
            </div>
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Bot className="w-5 h-5" />
            <span className="text-lg font-bold">AI Assistant</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Messages */}
        {messages.length > 0 && (
          <div className="mb-4 max-h-48 overflow-y-auto space-y-3 border rounded-lg p-3 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={`flex gap-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>

                {/* Tool calls */}
                {message.toolInvocations && message.toolInvocations.length > 0 && (
                  <div className="ml-2 space-y-1">
                    {message.toolInvocations.map((tool, index) => (
                      <div
                        key={index}
                        className="text-xs bg-blue-50 border border-blue-200 rounded p-2"
                      >
                        <div className="flex items-center gap-1 text-blue-700 font-medium">
                          {tool.state === 'call' && <Loader2 className="w-3 h-3 animate-spin" />}
                          {tool.state === 'result' && !('error' in tool.result) && '✅'}
                          {tool.state === 'result' && 'error' in tool.result && '❌'}
                          <span>{getToolDisplayName(tool.toolName)}</span>
                        </div>
                        {tool.state === 'result' && 'error' in tool.result && (
                          <div className="text-red-600 mt-1">
                            {String(tool.result.error)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="bg-white border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything about baby's activities..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          {messages.length === 0 && (
            <div className="text-xs text-gray-500">
              <div className="font-medium mb-1">Try asking:</div>
              <div className="space-y-1">
                <div>• "Baby started sleeping 10 minutes ago"</div>
                <div>• "When did baby last eat?"</div>
                <div>• "Diaper change with poop"</div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function getToolDisplayName(toolName: string): string {
  const displayNames: Record<string, string> = {
    parseUserTime: 'Parsing time',
    getDailySummary: 'Getting daily summary',
    getRecentActivities: 'Checking recent activities',
    startActivity: 'Starting activity',
    logActivity: 'Logging activity',
    updateActivity: 'Updating activity',
  };
  
  return displayNames[toolName] || toolName;
}