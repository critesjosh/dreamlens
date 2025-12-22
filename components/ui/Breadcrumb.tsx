'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm text-muted-foreground', className)}
    >
      <ol className="flex items-center gap-1">
        <li>
          <Link
            href="/"
            className="flex items-center hover:text-foreground transition-colors p-1 -m-1 rounded"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors px-1 py-0.5 -mx-1 rounded truncate max-w-[150px]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="text-foreground font-medium truncate max-w-[200px]"
                aria-current="page"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
