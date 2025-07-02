import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getFirstChild } from '@/lib/db/queries';
import ActivitiesTable from '@/components/activities/ActivitiesTable';

export default async function ActivitiesPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Get the first child for this user (you might want to add child selection later)
  const child = await getFirstChild(userId);
  
  if (!child) {
    redirect('/onboarding');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Activities</h1>
        <p className="text-gray-600">View and manage all activities for {child.name}</p>
      </div>
      
      <ActivitiesTable childId={child.id} />
    </div>
  );
}