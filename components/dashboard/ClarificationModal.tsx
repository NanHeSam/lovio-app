'use client';

import { useState } from 'react';
import { X, Bot, Send, Loader2 } from 'lucide-react';
import { useChat } from 'ai/react';
import { getLocalTimeWithTimezone } from '@/lib/utils/datetime';

interface ClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  context: {
    messages: any[];
    userId: string;
    childId: string;
  } | null;
  onSuccess?: (message: string) => void;
}

export default function ClarificationModal({
  isOpen,
  onClose,
  message,
  context,
  onSuccess
}: ClarificationModalProps) {

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/ai',
    body: {
      userId: context?.userId || '',
      childId: context?.childId || '',
      deviceTime: getLocalTimeWithTimezone(),
    },
    initialMessages: context?.messages || [], // Continue from where we left off
    onFinish: (message) => {
      // Check if this resolved the issue
      if (message.toolInvocations?.some(tool => 
        ['startActivity', 'logActivity', 'updateActivity'].includes(tool.toolName) && 
        tool.state === 'result' && 
        !('error' in tool.result)
      )) {
        onSuccess?.(message.content);
        onClose();
      }
    }
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  if (!isOpen || !context) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Need More Information</h3>
              <p className="text-sm text-gray-600">Please provide additional details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {/* AI's clarification request */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">AI Assistant:</p>
                <p className="text-sm text-blue-700 whitespace-pre-wrap">{message}</p>
              </div>
            </div>
          </div>

          {/* Follow-up conversation */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
            {messages.slice(context?.messages.length || 0).map((message) => (
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
                        : 'bg-gray-100 text-gray-900'
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
                        className="text-xs bg-green-50 border border-green-200 rounded p-2"
                      >
                        <div className="flex items-center gap-1 text-green-700 font-medium">
                          {tool.state === 'call' && <Loader2 className="w-3 h-3 animate-spin" />}
                          {tool.state === 'result' && !('error' in tool.result) && '✅'}
                          {tool.state === 'result' && 'error' in tool.result && '❌'}
                          <span>{tool.toolName}</span>
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
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleFormSubmit}>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Provide more details..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading}
                autoFocus
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

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
