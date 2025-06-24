'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-full items-center justify-center p-4'>
        <div
          className='fixed inset-0 bg-black bg-opacity-25 transition-opacity'
          onClick={onClose}
        />
        <div
          className={cn(
            'relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden',
            className
          )}
        >
          {title && (
            <div className='flex items-center justify-between p-6 border-b border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
              <button
                onClick={onClose}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
          )}
          <div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
