'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Home, Activity, User } from 'lucide-react';

/**
 * Renders the main navigation bar with links to dashboard, activities, and profile, adapting layout for desktop and mobile views.
 *
 * Displays navigation links with active state highlighting based on the current path, a brand logo, and a user menu button.
 */
export default function Navigation() {
  const pathname = usePathname();

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
      href: '/profile',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">👶</span>
              <span className="text-xl font-bold text-gray-900">Lovio</span>
            </Link>
          </div>

          {/* Navigation Links */}
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

          {/* User Menu */}
          <div className="flex items-center">
            <UserButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
    </nav>
  );
}