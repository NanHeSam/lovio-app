import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ApiKeyManager from '@/components/dashboard/ApiKeyManager';
import IOSShortcutDownload from '@/components/dashboard/IOSShortcutDownload';
import { IOS_SHORTCUT_URL } from '@/lib/constants';

export default async function ApiKeysPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">iOS Shortcuts</h1>
          <p className="text-gray-600 mt-2">
            Set up your iOS Shortcut for quick activity logging from your iPhone or iPad
          </p>
        </div>

        {/* Step-by-Step Setup Guide */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            📱 iOS Shortcut Setup Guide
          </h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Generate or regenerate an API key</h3>
                <p className="text-gray-600 text-sm">Use the API key manager below to create your key</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Download the iOS Shortcut</h3>
                    <p className="text-gray-600 text-sm">Click the download button to get the shortcut</p>
                  </div>
                  <a
                    href={IOS_SHORTCUT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download
                  </a>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Copy your API key</h3>
                <p className="text-gray-600 text-sm">Copy the API key from the manager below (you'll need it for the next step)</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Open the shortcut on your phone</h3>
                <p className="text-gray-600 text-sm">The shortcut will prompt you to enter your API key</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                5
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Paste your API key</h3>
                <p className="text-gray-600 text-sm">Paste the API key you copied in step 3</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Key Manager */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your API Key
            </h2>
            <p className="text-gray-600 text-sm">
              Generate or regenerate your API key here. Keep it secure and don't share it publicly.
            </p>
          </div>
          
          <div className="p-6">
            <ApiKeyManager />
          </div>
        </div>

        {/* iOS Shortcut Download Section */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <IOSShortcutDownload />
          </div>
        </div>
      </div>
    </div>
  );
}
