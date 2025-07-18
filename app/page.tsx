import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import LandingNavigation from '@/components/landing/navigation';
import HeroSection from '@/components/landing/hero-section';
import ProblemSolutionSection from '@/components/landing/problem-solution-section';
import HowItWorksSection from '@/components/landing/how-it-works-section';
import CTASection from '@/components/landing/cta-section';

export default async function Home() {
  const { userId } = await auth();
  
  // If user is authenticated, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <main>
      <LandingNavigation />
      <div id="hero">
        <HeroSection />
      </div>
      <div id="problem-solution">
        <ProblemSolutionSection />
      </div>
      <div id="how-it-works">
        <HowItWorksSection />
      </div>
      <div id="cta">
        <CTASection />
      </div>
    </main>
  );
}
