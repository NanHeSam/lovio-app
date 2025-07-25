import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs'
import { ToastProvider } from '@/components/ui/toast';
import { Toaster } from 'sonner';
import Navigation from '@/components/Navigation';
import OnboardingRedirect from '@/components/OnboardingRedirect';
import QueryProvider from '@/components/providers/QueryProvider';
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
          <QueryProvider>
            <ToastProvider>
              <Toaster />
              <SignedOut>
                {children}
              </SignedOut>
              
              <SignedIn>
                <OnboardingRedirect />
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
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
