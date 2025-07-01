import { redirect } from 'next/navigation';
import { getCurrentUserWithChildren } from '@/lib/auth';
import { db } from '@/lib/db';
import { userChildren, children } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import FeedCard from '@/components/dashboard/FeedCard';
import SleepCard from '@/components/dashboard/SleepCard';
import DiaperCard from '@/components/dashboard/DiaperCard';
import { mockDashboardData } from '@/lib/mock-data';

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.fullName}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here&apos;s your family activity dashboard
          </p>
        </div>

        {userChildrenData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userChildrenData.map(({ child, role }) => {
              if (!child) return null;
              
              return (
                <div key={child.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center mb-4">
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
                      <h3 className="text-xl font-semibold text-gray-900">
                        {child.name}
                      </h3>
                      <p className="text-gray-600 text-sm capitalize">
                        {role || 'Parent'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Born:</span>
                      <span className="font-medium">
                        {new Intl.DateTimeFormat('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'UTC'
                        }).format(new Date(child.birthDate + 'T00:00:00Z'))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-medium capitalize">
                        {child.gender || 'Not specified'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Recent Activities
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <SleepCard 
                        activeSession={mockDashboardData.activeSleepSession.activeSessions.find(s => s.type === 'sleep')}
                        lastSleep={mockDashboardData.noActiveSessions.lastSleep}
                      />
                      <FeedCard 
                        activeSession={mockDashboardData.activeFeedSession.activeSessions.find(s => s.type === 'feed')}
                        lastFeed={mockDashboardData.noActiveSessions.lastFeed}
                      />
                      <DiaperCard 
                        lastDiaper={mockDashboardData.noActiveSessions.lastDiaper}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
