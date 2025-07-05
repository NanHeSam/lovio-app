import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center bg-gradient-to-br from-[#FFE6F2] via-[#FCF9FF] to-[#F2F6FF] px-2 md:px-8 pt-16">
      <div className="flex flex-col md:flex-row items-center w-full max-w-7xl mx-auto gap-x-20">
        {/* Left: Text */}
        <div className="flex-1 flex flex-col items-start md:pt-32 pt-16 md:pl-20 pl-2">
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
        <div className="flex-1 flex justify-end items-end w-full mt-12 md:mt-0">
          <Image
            src="/man-holding-baby.png"
            alt="Parent holding baby and phone"
            width={800}
            height={600}
            className="w-full max-w-xl md:max-w-2xl h-auto"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </div>
    </section>
  );
}