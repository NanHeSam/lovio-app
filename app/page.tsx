import Link from "next/link";
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function Home() {
  const { userId } = await auth();
  
  // If user is authenticated, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Navigation */}
      <nav className="w-full px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">Lovio</div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition-colors">How It Works</a>
          </div>
          <Link
            href="/dashboard"
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Talk to Lovio,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
              Track with Love
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The AI-powered family companion that understands your needs. 
            Simply speak naturally about your baby&apos;s activities, and Lovio 
            handles the rest with intelligent tracking and insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105"
            >
              Start Tracking Today
            </Link>
            <a
              href="#how-it-works"
              className="border border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-50 transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="features" className="px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Parenting is overwhelming enough
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Between diaper changes, feeding times, and sleep schedules, 
              the last thing you need is complicated tracking apps. 
              Lovio simplifies everything with natural conversation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50">
              <div className="text-4xl mb-4">😴</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sleep Tracking</h3>
              <p className="text-gray-600">
                &ldquo;Baby just fell asleep&rdquo; - Lovio instantly starts tracking sleep sessions 
                with smart conflict resolution for overlapping activities.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="text-4xl mb-4">🍼</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Feeding Logs</h3>
              <p className="text-gray-600">
                &ldquo;Started feeding at 3pm&rdquo; - Natural language processing understands 
                context and automatically logs feeding times and amounts.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-pink-50">
              <div className="text-4xl mb-4">🚼</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Diaper Changes</h3>
              <p className="text-gray-600">
                &ldquo;Diaper change - wet and dirty&rdquo; - Lovio captures all the details 
                you need without complicated forms or multiple taps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-6 py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Lovio Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to effortless baby tracking
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Speak Naturally</h3>
              <p className="text-gray-600">
                Just talk to Lovio like you would to a friend. 
                &ldquo;Baby started eating at 2:30pm&rdquo; or &ldquo;She&apos;s been sleeping for 2 hours&rdquo;
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Understanding</h3>
              <p className="text-gray-600">
                Lovio&apos;s AI processes your message, understands the context, 
                and automatically logs the activity with proper timestamps.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Instant Insights</h3>
              <p className="text-gray-600">
                Get real-time dashboards, pattern recognition, and helpful 
                reminders without any manual data entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Simplify Your Parenting Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of parents who&apos;ve discovered the joy of effortless baby tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-white text-pink-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-50 transition-colors"
            >
              Start Free Today
            </Link>
            <a
              href="#features"
              className="border border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">Lovio</div>
              <p className="text-gray-400">
                AI-powered family management for modern parents.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Lovio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
