import { redirect } from 'next/navigation';
import { getCurrentUserWithChildren } from '@/lib/auth';
import { db } from '@/lib/db';
import { userChildren, children } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import DashboardWrapper from '@/components/dashboard/DashboardWrapper';
import IOSShortcutDownload from '@/components/dashboard/IOSShortcutDownload';

export default async function DashboardPage() {
  const user = await getCurrentUserWithChildren();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Check if user has completed onboarding (has children)
  if (!user.hasChildren) {
    redirect('/onboarding');
  }

  // Get user's children
  const userChildrenData = await db
    .select({
      child: children,
      role: userChildren.role,
      permissions: userChildren.permissions,
    })
    .from(userChildren)
    .leftJoin(children, eq(userChildren.childId, children.id))
    .where(eq(userChildren.userId, user.id));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.fullName}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here&apos;s your family activity dashboard
          </p>
        </div>

        {userChildrenData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No children added yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start by adding your first child to begin tracking activities
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Add Your First Child
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {userChildrenData.map(({ child, role }) => {
              if (!child) return null;
              
              return (
                <div key={child.id} className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
                  {/* Child Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-center mb-4 sm:mb-0">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                        {child.avatarUrl ? (
                          <img 
                            src={child.avatarUrl} 
                            alt={child.name} 
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          '👶'
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {child.name}
                        </h3>
                        <p className="text-gray-600 text-sm capitalize">
                          {role || 'Parent'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:text-right space-y-1">
                      <div className="text-sm text-gray-600">
                        Born: <span className="font-medium text-gray-900">
                          {new Intl.DateTimeFormat('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'UTC'
                          }).format(new Date(child.birthDate + 'T00:00:00Z'))}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Gender: <span className="font-medium text-gray-900 capitalize">
                          {child.gender || 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Cards */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-6">
                      Recent Activities
                    </h4>
                    <DashboardWrapper childId={child.id} userId={user.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* iOS Shortcut Download Section */}
        <div className="mt-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <IOSShortcutDownload />
        </div>
      </div>
    </div>
  );
}
