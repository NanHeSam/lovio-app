import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ApiKeyManager from '@/components/dashboard/ApiKeyManager';

export default async function ApiKeysPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600 mt-2">
            Manage your API keys for programmatic access to your data
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your API Key
            </h2>
            <p className="text-gray-600 text-sm">
              Use this API key to authenticate requests to the Lovio API. Keep it secure and don't share it publicly.
            </p>
          </div>
          
          <div className="p-6">
            <ApiKeyManager />
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🔐 API Key Usage
          </h3>
          <div className="space-y-3 text-sm text-blue-800">
            <p>
              <strong>Authentication:</strong> Include your API key in the Authorization header:
            </p>
            <div className="bg-blue-100 rounded p-3 font-mono text-xs">
              Authorization: Bearer your_api_key_here
            </div>
            <p>
              <strong>Base URL:</strong> All API requests should be made to:
            </p>
            <div className="bg-blue-100 rounded p-3 font-mono text-xs">
              {process.env.NODE_ENV === 'production' 
                ? 'https://your-domain.com/api' 
                : 'http://localhost:3000/api'
              }
            </div>
            <p>
              <strong>Example Request:</strong>
            </p>
            <div className="bg-blue-100 rounded p-3 font-mono text-xs">
              curl -H "Authorization: Bearer your_api_key_here" \<br />
              &nbsp;&nbsp;&nbsp;&nbsp;{process.env.NODE_ENV === 'production' 
                ? 'https://your-domain.com' 
                : 'http://localhost:3000'
              }/api/activities
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}