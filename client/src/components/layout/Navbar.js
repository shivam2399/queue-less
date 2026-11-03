'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Clock, Calendar, Store, LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-lg bg-surface border border-border flex items-center justify-center group-hover:border-primary transition-colors">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Queue<span className="text-primary">Less</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/businesses"
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                isActive('/businesses') ? 'text-primary' : 'text-muted'
              }`}
            >
              Explore Businesses
            </Link>

            {!loading && user && user.role === 'customer' && (
              <Link
                href="/appointments"
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  isActive('/appointments') ? 'text-primary' : 'text-muted'
                }`}
              >
                My Appointments
              </Link>
            )}

            {!loading && user && user.role === 'business_owner' && (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-foreground ${
                    isActive('/dashboard') ? 'text-primary' : 'text-muted'
                  }`}
                >
                  Queue Dashboard
                </Link>
                <Link
                  href="/dashboard/services"
                  className={`text-sm font-medium transition-colors hover:text-foreground ${
                    isActive('/dashboard/services') ? 'text-primary' : 'text-muted'
                  }`}
                >
                  Services
                </Link>
                <Link
                  href="/dashboard/business"
                  className={`text-sm font-medium transition-colors hover:text-foreground ${
                    isActive('/dashboard/business') ? 'text-primary' : 'text-muted'
                  }`}
                >
                  Settings
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-muted">
                      <UserIcon className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium text-foreground">{user.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-elevated text-subtle uppercase tracking-wider">
                        {user.role === 'business_owner' ? 'Owner' : 'Customer'}
                      </span>
                    </div>
                    <button
                      onClick={logout}
                      className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-danger hover:border-danger/40 transition-colors"
                      title="Log out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/login"
                      className="text-sm font-medium text-muted hover:text-foreground px-3 py-2 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="text-sm font-medium text-white bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg transition-colors shadow-sm"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface px-4 pt-3 pb-5 space-y-3">
          <Link
            href="/businesses"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium py-2 text-muted hover:text-foreground"
          >
            Explore Businesses
          </Link>

          {user && user.role === 'customer' && (
            <Link
              href="/appointments"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium py-2 text-muted hover:text-foreground"
            >
              My Appointments
            </Link>
          )}

          {user && user.role === 'business_owner' && (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium py-2 text-muted hover:text-foreground"
              >
                Queue Dashboard
              </Link>
              <Link
                href="/dashboard/services"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium py-2 text-muted hover:text-foreground"
              >
                Services
              </Link>
              <Link
                href="/dashboard/business"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium py-2 text-muted hover:text-foreground"
              >
                Settings
              </Link>
            </>
          )}

          <div className="pt-3 border-t border-border">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-1.5 text-xs text-danger font-medium px-3 py-1.5 rounded-lg border border-danger/30"
                >
                  <LogOut className="h-3.5 w-3.5" /> Log Out
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-medium rounded-lg bg-surface-elevated border border-border text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-medium rounded-lg bg-primary text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
