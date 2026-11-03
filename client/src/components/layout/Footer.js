import React from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-surface border border-border flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-bold tracking-tight">
              Queue<span className="text-primary">Less</span>
            </span>
            <span className="text-xs text-subtle ml-2">Smart Queue & Appointment SaaS</span>
          </div>

          <p className="text-xs text-muted text-center md:text-right">
            &copy; {new Date().getFullYear()} QueueLess MVP. Spend less time waiting.
          </p>
        </div>
      </div>
    </footer>
  );
}
