'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Users, ShieldCheck, Sparkles, CheckCircle, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-medium text-primary mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Real-time appointment & walk-in queue management</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
          Book ahead. Know your turn. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">
            Skip the waiting room.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          QueueLess gives local clinics, salons, and repair centers a transparent digital queue.
          Customers book a service, receive an authoritative token, and track live progress from anywhere.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/businesses"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-base transition-colors shadow-lg shadow-primary/20"
          >
            <span>Explore Businesses</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          {!user && (
            <Link
              href="/register?role=business_owner"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface border border-border hover:border-primary/50 text-foreground font-medium text-base transition-colors"
            >
              <Store className="h-4 w-4 text-muted" />
              <span>For Business Owners</span>
            </Link>
          )}

          {user && user.role === 'business_owner' && (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface border border-border hover:border-primary/50 text-foreground font-medium text-base transition-colors"
            >
              <span>Go to Owner Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Demo Credentials Box */}
        <div className="mt-12 p-4 max-w-xl mx-auto rounded-xl bg-surface border border-border/80 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-border/50 mb-3">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> Deterministic Demo Accounts
            </span>
            <span className="text-[11px] text-muted">Ready to test immediately</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-background border border-border">
              <p className="font-semibold text-foreground">Business Owner Account</p>
              <p className="text-muted mt-0.5">owner@queueless.com</p>
              <p className="text-subtle mt-0.5 font-mono">Password123!</p>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border">
              <p className="font-semibold text-foreground">Customer Account</p>
              <p className="text-muted mt-0.5">customer@queueless.com</p>
              <p className="text-subtle mt-0.5 font-mono">Password123!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="w-full border-y border-border bg-surface/30 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">How QueueLess Works</h2>
            <p className="text-muted text-sm mt-2">Zero hardware setup, fully mobile-friendly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-border hover:border-border/80 transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-primary mb-4 font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Discover & Book</h3>
              <p className="text-sm text-muted leading-relaxed">
                Find local clinics, salons, or service centers. Select your service, view durations and pricing, and book instantly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border hover:border-border/80 transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-primary mb-4 font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Receive Authoritative Token</h3>
              <p className="text-sm text-muted leading-relaxed">
                Our transactional backend locks the daily queue to allocate sequential, collision-free tokens with realistic wait estimates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border hover:border-border/80 transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-primary mb-4 font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Queue Tracking</h3>
              <p className="text-sm text-muted leading-relaxed">
                Follow your turn in real time via live Socket.IO updates without waiting physically in crowded waiting areas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Architecture */}
      <section className="w-full max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-8">Architected for Correctness & Data Integrity</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <ShieldCheck className="h-5 w-5 text-success mb-2" />
            <p className="font-semibold text-sm">Transactional</p>
            <p className="text-xs text-muted mt-1">Database-enforced token allocations with row locking.</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <Clock className="h-5 w-5 text-info mb-2" />
            <p className="font-semibold text-sm">Real-Time Sync</p>
            <p className="text-xs text-muted mt-1">Socket.IO rooms emit minimal payloads post-commit.</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <Users className="h-5 w-5 text-primary mb-2" />
            <p className="font-semibold text-sm">Privacy-First</p>
            <p className="text-xs text-muted mt-1">Zero customer PII exposed on public queue displays.</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <Store className="h-5 w-5 text-warning mb-2" />
            <p className="font-semibold text-sm">Owner Controls</p>
            <p className="text-xs text-muted mt-1">One-click Call Next, Complete, and Pause management.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
