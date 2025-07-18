'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Child } from '@/lib/db/types';
import AddChildForm from '@/components/forms/AddChildForm';
import InviteParentForm from '@/components/forms/InviteParentForm';

interface UserChildWithDetails {
  child: Child;
  role: string | null;
  permissions: unknown;
  userChildId: string;
}

interface ProfileFormProps {
  user: User;
  userChildren: UserChildWithDetails[];
}

export default function ProfileForm({ user, userChildren }: ProfileFormProps) {
  const router = useRouter();
  
  // Separate state for user profile
  const [userState, setUserState] = useState({
    isLoading: false,
    error: null as string | null,
    success: null as string | null,
  });

  // Separate state for each child form
  const [childrenStates, setChildrenStates] = useState<Record<string, {
    isLoading: boolean;
    error: string | null;
    success: string | null;
  }>>(
    userChildren.reduce((acc, uc) => {
      acc[uc.child.id] = { isLoading: false, error: null, success: null };
      return acc;
    }, {} as Record<string, { isLoading: boolean; error: string | null; success: string | null }>)
  );

  // Modal states
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [inviteModalChild, setInviteModalChild] = useState<{ id: string; name: string } | null>(null);
  
  // User form state
  const [userForm, setUserForm] = useState({
    fullName: user.fullName || '',
    timezone: user.timezone || '',
  });

  // Children form state
  const [childrenForms, setChildrenForms] = useState(
    userChildren.map(uc => ({
      id: uc.child.id,
      name: uc.child.name,
      birthDate: uc.child.birthDate,
      gender: uc.child.gender || '',
      role: uc.role || '',
    }))
  );

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserState({ isLoading: true, error: null, success: null });

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        setUserState({ isLoading: false, error: null, success: 'Profile updated successfully!' });
        router.refresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setUserState({ 
          isLoading: false, 
          error: errorData.error || 'Failed to update profile. Please try again.', 
          success: null 
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setUserState({ 
        isLoading: false, 
        error: 'An unexpected error occurred. Please try again.', 
        success: null 
      });
    }
  };

  const handleChildSubmit = async (childId: string) => {
    const childForm = childrenForms.find(cf => cf.id === childId);
    if (!childForm) return;

    setChildrenStates(prev => ({
      ...prev,
      [childId]: { isLoading: true, error: null, success: null }
    }));

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
        }),
      });

      if (response.ok) {
        setChildrenStates(prev => ({
          ...prev,
          [childId]: { isLoading: false, error: null, success: 'Child information updated successfully!' }
        }));
        router.refresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setChildrenStates(prev => ({
          ...prev,
          [childId]: { 
            isLoading: false, 
            error: errorData.error || 'Failed to update child information. Please try again.',
            success: null 
          }
        }));
      }
    } catch (error) {
      console.error('Error:', error);
      setChildrenStates(prev => ({
        ...prev,
        [childId]: { 
          isLoading: false, 
          error: 'An unexpected error occurred. Please try again.',
          success: null 
        }
      }));
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
      {/* Global Success/Error Messages */}
      {userState.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {userState.success}
        </div>
      )}
      {userState.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {userState.error}
        </div>
      )}
      
      {/* Child-specific success/error messages */}
      {Object.entries(childrenStates).map(([childId, state]) => (
        <div key={`${childId}-messages`}>
          {state.success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {state.success}
            </div>
          )}
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {state.error}
            </div>
          )}
        </div>
      ))}

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


          <button
            type="submit"
            disabled={userState.isLoading}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {userState.isLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Children Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Children Information</h2>
          <button
            onClick={() => setShowAddChildModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
          >
            + Add Child
          </button>
        </div>
        
        {childrenForms.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-6xl mb-4">👶</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No children added yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first child to start tracking activities
            </p>
            <button 
              onClick={() => setShowAddChildModal(true)}
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setInviteModalChild({ id: childForm.id, name: childForm.name })}
                    className="bg-purple-600 text-white px-3 py-1 text-sm rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    Invite Parent
                  </button>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                    👶
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor={`child-name-${childForm.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Child&apos;s Name
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


                <button
                  type="button"
                  onClick={() => handleChildSubmit(childForm.id)}
                  disabled={childrenStates[childForm.id]?.isLoading || false}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {childrenStates[childForm.id]?.isLoading ? 'Updating...' : `Update ${childForm.name || 'Child'} Info`}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Child</h3>
              <AddChildForm
                onSuccess={() => {
                  setShowAddChildModal(false);
                  router.refresh();
                }}
                onCancel={() => setShowAddChildModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Invite Parent Modal */}
      {inviteModalChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Invite Parent/Guardian
              </h3>
              <InviteParentForm
                childId={inviteModalChild.id}
                childName={inviteModalChild.name}
                onSuccess={() => {
                  setInviteModalChild(null);
                }}
                onCancel={() => setInviteModalChild(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}