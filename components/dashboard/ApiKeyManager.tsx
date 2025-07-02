'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';

interface ApiKeyInfo {
  hasApiKey: boolean;
  createdAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
}

export default function ApiKeyManager() {
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch API key info on component mount
  useEffect(() => {
    fetchApiKeyInfo();
  }, []);

  const fetchApiKeyInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/api-key');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch API key info');
      }
      
      setApiKeyInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const regenerateApiKey = async () => {
    try {
      setActionLoading('regenerate');
      setError(null);
      
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate API key');
      }
      
      setNewApiKey(data.apiKey);
      setShowApiKey(true);
      
      // Refresh the API key info
      await fetchApiKeyInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const revokeApiKey = async () => {
    if (!confirm('Are you sure you want to revoke your API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading('revoke');
      setError(null);
      
      const response = await fetch('/api/user/api-key', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke API key');
      }
      
      setNewApiKey(null);
      
      // Refresh the API key info
      await fetchApiKeyInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
        <button
          onClick={fetchApiKeyInfo}
          className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New API Key Display */}
      {newApiKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-green-900">
              🎉 New API Key Generated
            </h3>
            <button
              onClick={() => setNewApiKey(null)}
              className="text-green-600 hover:text-green-700"
            >
              ✕
            </button>
          </div>
          
          <p className="text-green-700 text-sm mb-3">
            Save this key now - you won't be able to see it again!
          </p>
          
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-green-100 rounded px-3 py-2 font-mono text-sm">
              {showApiKey ? newApiKey : '••••••••••••••••••••••••••••••••'}
            </div>
            
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="p-2 text-green-600 hover:text-green-700"
              title={showApiKey ? 'Hide API key' : 'Show API key'}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => copyToClipboard(newApiKey)}
              className="p-2 text-green-600 hover:text-green-700"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          
          {copied && (
            <p className="text-green-600 text-sm mt-2">✓ Copied to clipboard!</p>
          )}
        </div>
      )}

      {/* API Key Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">API Key Status</h3>
          <div className="flex items-center space-x-2">
            {apiKeyInfo?.hasApiKey && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                apiKeyInfo.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {apiKeyInfo.isActive ? 'Active' : 'Revoked'}
              </span>
            )}
          </div>
        </div>

        {apiKeyInfo?.hasApiKey ? (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-900">{formatDate(apiKeyInfo.createdAt)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Last Used</label>
                <p className="text-sm text-gray-900">{formatDate(apiKeyInfo.lastUsedAt)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              No API key found. Generate one to start using the API.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          onClick={regenerateApiKey}
          disabled={actionLoading === 'regenerate'}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {actionLoading === 'regenerate' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {apiKeyInfo?.hasApiKey ? 'Regenerate API Key' : 'Generate API Key'}
        </button>

        {apiKeyInfo?.hasApiKey && apiKeyInfo.isActive && (
          <button
            onClick={revokeApiKey}
            disabled={actionLoading === 'revoke'}
            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === 'revoke' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Revoke API Key
          </button>
        )}
      </div>
    </div>
  );
}