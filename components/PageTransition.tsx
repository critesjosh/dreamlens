'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Reset animation when pathname changes
    setIsVisible(false);

    // Small delay to ensure the fade-out happens before new content
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2',
        className
      )}
    >
      {displayChildren}
    </div>
  );
}
