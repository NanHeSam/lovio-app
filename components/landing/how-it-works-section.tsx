export default function HowItWorksSection() {
  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-br from-[#FFE6F2] via-[#FCF9FF] to-[#F2F6FF]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-6 leading-tight">
            How It Works
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Simply speak to Lovio and watch your baby&apos;s moments become lasting memories
          </p>
        </div>

        {/* Three Cases */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Case 1 */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4 text-center">😴</div>
            <h3 className="text-xl font-bold text-black mb-4 text-center">
              Log Sleep Instantly
            </h3>
            <div className="space-y-3">
              <div className="bg-[#7B61FF]/10 rounded-lg p-3">
                <p className="text-sm font-medium text-[#7B61FF] mb-1">You say:</p>
                <p className="text-gray-800 italic">&ldquo;Lovio, baby started sleeping&rdquo;</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm font-medium text-green-700 mb-1">Lovio logs:</p>
                <p className="text-gray-800">Sleep started at 8:00pm</p>
              </div>
            </div>
          </div>

          {/* Case 2 */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4 text-center">🍼</div>
            <h3 className="text-xl font-bold text-black mb-4 text-center">
              Smart Context Tracking
            </h3>
            <div className="space-y-3">
              <div className="bg-[#7B61FF]/10 rounded-lg p-3">
                <p className="text-sm font-medium text-[#7B61FF] mb-1">You say:</p>
                <p className="text-gray-800 italic">&ldquo;Lovio, baby woke up 3 min ago and started feeding&rdquo;</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm font-medium text-green-700 mb-1">Lovio records:</p>
                <p className="text-gray-800">Sleep: 8:00pm - 10:00pm<br/>Feeding: Started 10:00pm</p>
              </div>
            </div>
          </div>

          {/* Case 3 */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4 text-center">💭</div>
            <h3 className="text-xl font-bold text-black mb-4 text-center">
              Instant Memory Recall
            </h3>
            <div className="space-y-3">
              <div className="bg-[#7B61FF]/10 rounded-lg p-3">
                <p className="text-sm font-medium text-[#7B61FF] mb-1">You ask:</p>
                <p className="text-gray-800 italic">&ldquo;Lovio, when is the last feed?&rdquo;</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm font-medium text-green-700 mb-1">Lovio responds:</p>
                <p className="text-gray-800">&ldquo;Your last feeding was 2 hours and 27 minutes ago&rdquo;</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call out */}
        <div className="text-center">
          <div className="inline-block bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg">
            <p className="text-2xl md:text-3xl font-bold text-[#7B61FF] italic">
              &ldquo;Your words become memories.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}