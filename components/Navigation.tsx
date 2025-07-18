'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Home, Activity, Key, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Home,
    },
    {
      href: '/activities',
      label: 'Activities',
      icon: Activity,
    },
    {
      href: '/dashboard/api-keys',
      label: 'iOS Shortcuts',
      icon: Key,
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: User,
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 relative z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <span className="text-2xl">👶</span>
                <span className="text-xl font-bold text-gray-900">Lovio</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:flex sm:items-center sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop User Menu */}
            <div className="hidden sm:flex sm:items-center">
              <UserButton />
            </div>

            {/* Mobile Menu Button and User Button */}
            <div className="flex items-center sm:hidden space-x-3">
              <UserButton />
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          {/* Background overlay */}
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 z-30"
            onClick={closeMobileMenu}
          />
          
          {/* Sliding menu panel */}
          <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40 transform transition-transform duration-200 ease-in-out">
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
