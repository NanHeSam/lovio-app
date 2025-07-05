import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-br from-[#7B61FF] via-[#9B7BFF] to-[#B89FFF]">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main CTA Content */}
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
            Ready to Turn Words into Memories?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-8">
            Join thousands of parents who are already capturing precious moments with just their voice.
          </p>
          
          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-bold text-white mb-2">No More Forgetting</h3>
              <p className="text-white/80 text-sm">Never miss tracking a feeding, diaper, or sleep again</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Logging</h3>
              <p className="text-white/80 text-sm">Speak naturally and watch Lovio understand perfectly</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">💝</div>
              <h3 className="text-lg font-bold text-white mb-2">Stay Present</h3>
              <p className="text-white/80 text-sm">Focus on your baby while Lovio handles the details</p>
            </div>
          </div>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
          <h3 className="text-2xl font-bold text-white mb-4">
            Start Tracking Today
          </h3>
          <p className="text-white/80 mb-6">
            Create your account and begin using Lovio immediately
          </p>
          <Link
            href="/dashboard"
            className="w-full rounded-full bg-white text-[#7B61FF] hover:bg-gray-50 hover:text-[#7B61FF] px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-300 ease-in-out focus:ring-2 focus:ring-white focus:ring-offset-2 border-2 border-white inline-block"
          >
            Get Started Free
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-white/70 text-sm mb-4">
            Built by first time dad trusted by my wife
          </p>
          <div className="flex justify-center items-center space-x-8 text-white/60">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔒</span>
              <span className="text-sm">Privacy First</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🤖</span>
              <span className="text-sm">Works with Alexa and Apple Shortcuts</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌟</span>
              <span className="text-sm">Free to Start</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}