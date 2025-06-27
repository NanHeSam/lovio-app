import { Chatbot } from '@/components/chat/chatbot';
import { TEST_USER_ID, TEST_CHILD_ID } from '@/lib/test-constants';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Baby Tracking Assistant
          </h1>
          <p className="text-gray-600">
            Chat with your AI assistant to track and monitor your baby&apos;s activities
          </p>
        </div>
        
        <div className="h-[600px]">
          <Chatbot userId={TEST_USER_ID} childId={TEST_CHILD_ID} />
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            This chatbot can help you track sleep, feeding, diaper changes, and more.
            <br />
            Try natural language like &ldquo;Is baby sleeping?&rdquo; or &ldquo;Log a diaper change&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}