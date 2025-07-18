import { IOS_SHORTCUT_URL } from '@/lib/constants';

interface IOSShortcutDownloadProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export default function IOSShortcutDownload({ 
  variant = 'default', 
  className = '' 
}: IOSShortcutDownloadProps) {
  const shortcutUrl = IOS_SHORTCUT_URL;
  
  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-purple-900 mb-1">
              📱 iOS Shortcut
            </h3>
            <p className="text-purple-800 text-xs">
              Quick activity logging from your iPhone
            </p>
          </div>
          
          <a
            href={shortcutUrl}
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
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            📱 iOS Shortcut
          </h3>
          <p className="text-purple-800 text-sm mb-4">
            Download our iOS Shortcut to quickly log activities from your iPhone or iPad. 
            The shortcut integrates with your API key for seamless data synchronization.
          </p>
          
          <div className="space-y-3 text-sm text-purple-700">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Quick activity logging from your home screen</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Voice commands for hands-free logging</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Automatic sync with your Lovio dashboard</span>
            </div>
          </div>
        </div>
        
        <div className="ml-6">
          <a
            href={shortcutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download Shortcut
          </a>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-purple-100 rounded-lg">
        <h4 className="text-sm font-semibold text-purple-900 mb-2">Setup Instructions:</h4>
        <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
          <li>Click "Download Shortcut" above</li>
          <li>Open the link on your iOS device</li>
          <li>Tap "Get Shortcut" in the Shortcuts app</li>
          <li>Add the shortcut to your home screen for quick access</li>
          <li>The shortcut will automatically use your API key for authentication</li>
        </ol>
      </div>
    </div>
  );
} 
