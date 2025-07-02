import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { ToastProvider } from '@/components/ui/toast';
import Navigation from '@/components/Navigation';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lovio - Baby Activity Tracking App",
  description: "Activity Tracking application for tracking baby's sleep, eat, and diaper changes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ToastProvider>
            <SignedOut>
              <header className="flex justify-end items-center p-4 gap-4 h-16">
                <SignInButton />
                <SignUpButton>
                  <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                    Sign Up
                  </button>
                </SignUpButton>
              </header>
              {children}
            </SignedOut>
            
            <SignedIn>
              <div className="min-h-screen bg-gray-50">
                <div className="fixed top-0 left-0 right-0 z-50">
                  <Navigation />
                </div>
                <div className="pt-16">
                  {children}
                </div>
              </div>
            </SignedIn>
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
