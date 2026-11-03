'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertCircle, ArrowRight, User, Store } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'business_owner' ? 'business_owner' : 'customer';

  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const user = await register({ name, email, password, role });
      if (user.role === 'business_owner') {
        router.push('/dashboard');
      } else {
        router.push('/businesses');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <div className="inline-flex h-11 w-11 rounded-xl bg-surface border border-border items-center justify-center text-primary mb-3">
          <Clock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create your QueueLess account</h1>
        <p className="text-xs text-muted mt-1">Get started in less than a minute</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Type Selection */}
        <div>
          <label className="block text-xs font-medium text-muted mb-2">
            Select Account Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                role === 'customer'
                  ? 'bg-primary/10 border-primary text-foreground'
                  : 'bg-surface border-border text-muted hover:border-border/80'
              }`}
            >
              <User className={`h-5 w-5 mb-2 ${role === 'customer' ? 'text-primary' : 'text-subtle'}`} />
              <div>
                <p className="text-xs font-semibold">Customer</p>
                <p className="text-[10px] text-muted mt-0.5">Book visits & track queues</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('business_owner')}
              className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                role === 'business_owner'
                  ? 'bg-primary/10 border-primary text-foreground'
                  : 'bg-surface border-border text-muted hover:border-border/80'
              }`}
            >
              <Store className={`h-5 w-5 mb-2 ${role === 'business_owner' ? 'text-primary' : 'text-subtle'}`} />
              <div>
                <p className="text-xs font-semibold">Business Owner</p>
                <p className="text-[10px] text-muted mt-0.5">Manage daily queue & services</p>
              </div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Asha Patel"
            className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-subtle transition-colors"
          />
        </div>

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
            placeholder="asha@example.com"
            className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-subtle transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="password">
            Password (min. 8 characters)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
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
            <span>Creating account...</span>
          ) : (
            <>
              <span>Complete Registration</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-center text-xs text-muted">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
