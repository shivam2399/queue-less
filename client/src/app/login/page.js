'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertCircle, ArrowRight, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login({ email, password });
      if (user.role === 'business_owner') {
        router.push('/dashboard');
      } else {
        router.push('/appointments');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex h-11 w-11 rounded-xl bg-surface border border-border items-center justify-center text-primary mb-3">
            <Clock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to QueueLess</h1>
          <p className="text-xs text-muted mt-1">Manage your appointments or business queue</p>
        </div>

        {/* Demo Account Quick-Fill Buttons */}
        <div className="p-3 rounded-xl bg-surface border border-border space-y-2">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Quick Fill Demo Accounts</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('owner@queueless.com', 'Password123!')}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs text-foreground font-medium text-left transition-colors"
            >
              <span className="block text-primary font-bold">Business Owner</span>
              <span className="text-[10px] text-muted">owner@queueless.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('customer@queueless.com', 'Password123!')}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs text-foreground font-medium text-left transition-colors"
            >
              <span className="block text-primary font-bold">Customer</span>
              <span className="text-[10px] text-muted">customer@queueless.com</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-subtle transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-muted" htmlFor="password">
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-subtle transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
