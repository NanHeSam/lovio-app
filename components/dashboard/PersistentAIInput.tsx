'use client';

import { Send, Loader2, Bot } from 'lucide-react';
import { useChat } from 'ai/react';
import { getLocalTimeWithTimezone } from '@/lib/utils';

interface PersistentAIInputProps {
  userId: string;
  childId: string;
  onSuccess?: (message: string) => void;
  onQueryResponse?: (message: string) => void;
  onNeedsClarification?: (message: string, context: any) => void;
}

export default function PersistentAIInput({ 
  userId, 
  childId, 
  onSuccess,
  onQueryResponse,
  onNeedsClarification 
}: PersistentAIInputProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useChat({
    api: '/api/ai',
    body: {
      userId,
      childId,
      deviceTime: getLocalTimeWithTimezone(),
    },
    onFinish: (message) => {
      const hasMutationTools = message.toolInvocations?.some(tool => 
        ['startActivity', 'logActivity', 'updateActivity'].includes(tool.toolName)
      );

      const hasSuccessfulMutation = message.toolInvocations?.some(tool => 
        ['startActivity', 'logActivity', 'updateActivity'].includes(tool.toolName) && 
        tool.state === 'result' && 
        !('error' in tool.result)
      );

      if (hasSuccessfulMutation) {
        // Successful mutation - show success toast
        onSuccess?.(message.content);
        setMessages([]); // Clear messages
        setInput('');
      } else if (message.content.includes('?') || message.content.toLowerCase().includes('clarify')) {
        // AI is asking for clarification
        onNeedsClarification?.(message.content, { messages, userId, childId });
      } else if (!hasMutationTools) {
        // This is a query/information request - show response in toast
        onQueryResponse?.(message.content);
        setMessages([]); // Clear messages
        setInput('');
      } else {
        // Failed mutation - show clarification modal
        onNeedsClarification?.(message.content, { messages, userId, childId });
      }
    }
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <form onSubmit={handleFormSubmit}>
          <div className="flex items-center gap-3">
            {/* AI Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <Bot className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>

            {/* Input */}
            <div className="flex-1">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything about baby's activities... (e.g., 'baby started sleeping', 'when did baby last eat?')"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>

          {/* Status indicator */}
          {isLoading && (
            <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing your request...</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}