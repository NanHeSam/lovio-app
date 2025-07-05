import { redirect } from 'next/navigation';
import { getCurrentUserWithChildren } from '@/lib/auth';
import { db } from '@/lib/db';
import { userChildren, children } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ProfileForm from './components/ProfileForm';

export default async function ProfilePage() {
  const user = await getCurrentUserWithChildren();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Get user's children with full details
  const userChildrenData = await db
    .select({
      child: children,
      role: userChildren.role,
      permissions: userChildren.permissions,
      userChildId: userChildren.id,
    })
    .from(userChildren)
    .leftJoin(children, eq(userChildren.childId, children.id))
    .where(eq(userChildren.userId, user.id));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your personal information and your children&apos;s details
          </p>
        </div>

        <ProfileForm 
          user={user} 
          userChildren={userChildrenData.filter(uc => uc.child !== null).map(uc => ({
            child: uc.child!,
            role: uc.role,
            permissions: uc.permissions,
            userChildId: uc.userChildId,
          }))} 
        />
      </div>
    </div>
  );
}