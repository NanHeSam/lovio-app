'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddChildFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export default function AddChildForm({ onSuccess, onCancel, className = '' }: AddChildFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    gender: '' as 'male' | 'female' | '',
    avatarUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          birthDate: formData.birthDate,
          gender: formData.gender || null,
          avatarUrl: formData.avatarUrl || null,
        }),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          name: '',
          birthDate: '',
          gender: '',
          avatarUrl: '',
        });
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Refresh the page to show the new child
          router.refresh();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to add child. Please try again.');
      }
    } catch (error) {
      console.error('Error adding child:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="child-name" className="block text-sm font-medium text-gray-700 mb-1">
            Child&apos;s Name
          </label>
          <input
            type="text"
            id="child-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter child's name"
            required
          />
        </div>

        <div>
          <label htmlFor="child-birthDate" className="block text-sm font-medium text-gray-700 mb-1">
            Birth Date
          </label>
          <input
            type="date"
            id="child-birthDate"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="child-gender" className="block text-sm font-medium text-gray-700 mb-1">
            Gender (Optional)
          </label>
          <select
            id="child-gender"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | '' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label htmlFor="child-avatar" className="block text-sm font-medium text-gray-700 mb-1">
            Avatar URL (Optional)
          </label>
          <input
            type="url"
            id="child-avatar"
            value={formData.avatarUrl}
            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/child-avatar.jpg"
          />
        </div>

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !formData.name || !formData.birthDate}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding Child...' : 'Add Child'}
          </button>
        </div>
      </form>
    </div>
  );
}