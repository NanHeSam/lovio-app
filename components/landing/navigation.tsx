"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export default function LandingNavigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled || isMobileMenuOpen
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
          : "bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => scrollToSection("hero")}>
            <Image
              src="/lovio-icon.png"
              alt="Lovio logo"
              width={32}
              height={32}
              className="w-8 h-8"
              priority
            />
            <span className="text-lg font-bold text-[#7B61FF] ml-2 tracking-tight">
              Lovio
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("hero")}
              className="text-gray-700 hover:text-[#7B61FF] transition-colors duration-200 font-medium"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("problem-solution")}
              className="text-gray-700 hover:text-[#7B61FF] transition-colors duration-200 font-medium"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-gray-700 hover:text-[#7B61FF] transition-colors duration-200 font-medium"
            >
              How It Works
            </button>
            <Link
              href="/dashboard"
              className="bg-[#7B61FF] text-white px-6 py-2 rounded-full hover:bg-[#6B51E6] transition-colors duration-200 font-medium"
            >
              Start Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Link
              href="/dashboard"
              className="bg-[#7B61FF] text-white px-3 py-1.5 rounded-full hover:bg-[#6B51E6] transition-colors duration-200 font-medium text-xs"
            >
              Start
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-[#7B61FF] transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={() => scrollToSection("hero")}
                className="block w-full text-left text-gray-700 hover:text-[#7B61FF] transition-colors duration-200 font-medium py-2"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("problem-solution")}
                className="block w-full text-left text-gray-700 hover:text-[#7B61FF] transition-colors duration-200 font-medium py-2"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="block w-full text-left text-gray-700 hover:text-[#7B61FF] transition-colors duration-200 font-medium py-2"
              >
                How It Works
              </button>
              <Link
                href="/dashboard"
                className="block w-full bg-[#7B61FF] text-white px-6 py-3 rounded-full hover:bg-[#6B51E6] transition-colors duration-200 font-medium text-center mt-4"
              >
                Start Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}