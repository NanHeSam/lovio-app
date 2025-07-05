import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-[#FFE6F2] via-[#FCF9FF] to-[#F2F6FF] px-2 md:px-8 pt-16">
      <div className="container mx-auto max-w-7xl h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-center min-h-screen">
          {/* Left: Text */}
          <div className="flex flex-col items-start justify-center md:pt-32 pt-16 md:pl-20 pl-2">
            <h1 className="text-5xl md:text-6xl font-black text-black mb-6 leading-tight tracking-tight">
              Talk to Lovio,<br />Track with Love.
            </h1>
            <p className="text-lg md:text-xl text-[#555] font-normal mb-10 max-w-xl">
              Lovio captures feedings, diapers, and sleep the instant you say them—no taps, no fuss.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 rounded-full bg-[#7B61FF] text-white hover:bg-[#6B51E6] hover:text-white px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-300 ease-in-out focus:ring-2 focus:ring-[#7B61FF] focus:ring-offset-2 border-2 border-[#7B61FF]"
            >
              Start Tracking Now
            </Link>
          </div>
          {/* Right: Illustration */}
          <div className="flex justify-center items-center">
            <Image
              src="/man-holding-baby.png"
              alt="Parent holding baby and phone"
              width={1124}
              height={1536}
              className="w-full max-w-md md:max-w-lg h-auto"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}