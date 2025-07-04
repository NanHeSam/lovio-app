'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Child } from '@/lib/db/types';

interface UserChild {
  child: Child;
  role: string | null;
  permissions: any;
  userChildId: string;
}

interface ProfileFormProps {
  user: User;
  userChildren: UserChild[];
}

export default function ProfileForm({ user, userChildren }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // User form state
  const [userForm, setUserForm] = useState({
    fullName: user.fullName || '',
    timezone: user.timezone || '',
    avatarUrl: user.avatarUrl || '',
  });

  // Children form state
  const [childrenForms, setChildrenForms] = useState(
    userChildren.map(uc => ({
      id: uc.child.id,
      name: uc.child.name,
      birthDate: uc.child.birthDate,
      gender: uc.child.gender || '',
      avatarUrl: uc.child.avatarUrl || '',
      role: uc.role || '',
    }))
  );

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        router.refresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChildSubmit = async (childId: string) => {
    const childForm = childrenForms.find(cf => cf.id === childId);
    if (!childForm) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: childForm.name,
          birthDate: childForm.birthDate,
          gender: childForm.gender || null,
          avatarUrl: childForm.avatarUrl || null,
        }),
      });

      if (response.ok) {
        setSuccess('Child information updated successfully!');
        router.refresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to update child information. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateChildForm = (childId: string, field: string, value: string) => {
    setChildrenForms(prev => 
      prev.map(cf => 
        cf.id === childId ? { ...cf, [field]: value } : cf
      )
    );
  };

  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* User Profile Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={userForm.fullName}
              onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone (Optional)
            </label>
            <select
              id="timezone"
              value={userForm.timezone}
              onChange={(e) => setUserForm({ ...userForm, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select timezone</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Shanghai">Shanghai</option>
              <option value="Australia/Sydney">Sydney</option>
            </select>
          </div>

          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Avatar URL (Optional)
            </label>
            <input
              type="url"
              id="avatarUrl"
              value={userForm.avatarUrl}
              onChange={(e) => setUserForm({ ...userForm, avatarUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Children Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Children Information</h2>
        
        {childrenForms.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-6xl mb-4">👶</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No children added yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first child to start tracking activities
            </p>
            <button 
              onClick={() => router.push('/onboarding')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Your First Child
            </button>
          </div>
        ) : (
          childrenForms.map((childForm) => (
            <div key={childForm.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {childForm.name || 'Child'} Information
                </h3>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  {childForm.avatarUrl ? (
                    <img 
                      src={childForm.avatarUrl} 
                      alt={childForm.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    '👶'
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor={`child-name-${childForm.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Child's Name
                  </label>
                  <input
                    type="text"
                    id={`child-name-${childForm.id}`}
                    value={childForm.name}
                    onChange={(e) => updateChildForm(childForm.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter child's name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor={`child-birthDate-${childForm.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    id={`child-birthDate-${childForm.id}`}
                    value={childForm.birthDate}
                    onChange={(e) => updateChildForm(childForm.id, 'birthDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor={`child-gender-${childForm.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Gender (Optional)
                  </label>
                  <select
                    id={`child-gender-${childForm.id}`}
                    value={childForm.gender}
                    onChange={(e) => updateChildForm(childForm.id, 'gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={`child-avatar-${childForm.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Avatar URL (Optional)
                  </label>
                  <input
                    type="url"
                    id={`child-avatar-${childForm.id}`}
                    value={childForm.avatarUrl}
                    onChange={(e) => updateChildForm(childForm.id, 'avatarUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/child-avatar.jpg"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleChildSubmit(childForm.id)}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : `Update ${childForm.name || 'Child'} Info`}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}