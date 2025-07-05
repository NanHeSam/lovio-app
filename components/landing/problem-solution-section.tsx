import Image from "next/image"

export default function ProblemSolutionSection() {
  return (
    <section className="py-20 px-4 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left: Image */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              <Image
                src="/mom-holding-baby.png"
                alt="Mother holding baby lovingly"
                width={500}
                height={600}
                className="w-full h-auto rounded-2xl shadow-lg"
                priority
              />
            </div>
          </div>
          {/* Right: Content */}
          <div className="flex-1 space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-black text-black leading-tight">
                Logging baby moments shouldn&apos;t slow you down.
              </h2>
              
              {/* Main paragraph */}
              <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
                Tired? Busy? Just say what happened—Lovio logs it for you. No taps. No fuss. Just presence.
              </p>
              
              {/* Optional poetic variant */}
              <div className="mt-8 p-6 bg-gradient-to-r from-[#FFE6F2] to-[#F2F6FF] rounded-2xl">
                <div className="space-y-3 text-lg md:text-xl text-gray-700 font-medium">
                  <p>Your hands are full.</p>
                  <p>Your memory&apos;s hazy.</p>
                  <p className="text-[#7B61FF] font-semibold">Lovio listens.</p>
                  <p className="text-[#7B61FF] font-semibold">You stay present.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
