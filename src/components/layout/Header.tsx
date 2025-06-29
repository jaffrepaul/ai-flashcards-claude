'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className='bg-white shadow-sm border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center'>
            <Link href='/' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>AI</span>
              </div>
              <span className='font-semibold text-gray-900 text-lg'>
                FlashCards
              </span>
            </Link>
          </div>

          <nav className='hidden md:flex items-center space-x-8'>
            {user ? (
              <>{/* Dashboard functionality accessible from other pages */}</>
            ) : (
              <>{/* Features are shown on the homepage */}</>
            )}
          </nav>

          <div className='flex items-center space-x-4'>
            {user ? (
              <div className='flex items-center space-x-3'>
                <div className='text-sm text-gray-600'>{user.email}</div>
                <Button variant='outline' size='sm' onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className='flex items-center space-x-3'>
                <Link href='/auth'>
                  <Button variant='outline' size='sm'>
                    Sign In
                  </Button>
                </Link>
                <Link href='/auth'>
                  <Button size='sm'>Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
