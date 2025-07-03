import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import OnboardingForm from './components/OnboardingForm';

export default async function OnboardingPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Lovio! 👶
          </h1>
          <p className="text-gray-600">
            Let&apos;s set up your account and add your first child to get started.
          </p>
        </div>
        
        <OnboardingForm />
      </div>
    </div>
  );
}