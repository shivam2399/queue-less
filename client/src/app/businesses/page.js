'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { Search, MapPin, Clock, ArrowRight, Store, Eye } from 'lucide-react';

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBusinesses = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = query ? `/businesses?search=${encodeURIComponent(query)}` : '/businesses';
      const res = await api.get(endpoint);
      setBusinesses(res.data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBusinesses(search);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Explore Businesses</h1>
          <p className="text-sm text-muted mt-1">Discover verified local clinics, salons, and services</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, service or city..."
              className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-subtle transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-surface hover:bg-surface-elevated border border-border text-sm font-medium rounded-lg transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => fetchBusinesses(search)}
            className="text-xs underline hover:no-underline font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-surface border border-border animate-pulse space-y-4">
              <div className="h-5 bg-surface-elevated rounded w-2/3"></div>
              <div className="h-4 bg-surface-elevated rounded w-full"></div>
              <div className="h-4 bg-surface-elevated rounded w-1/2"></div>
              <div className="h-9 bg-surface-elevated rounded w-full mt-4"></div>
            </div>
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-2xl bg-surface border border-border max-w-md mx-auto">
          <Store className="h-10 w-10 text-muted mx-auto mb-3" />
          <h3 className="text-base font-semibold">No businesses found</h3>
          <p className="text-xs text-muted mt-1">Try adjusting your search terms or view all active listings.</p>
          <button
            onClick={() => {
              setSearch('');
              fetchBusinesses('');
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs font-medium transition-colors"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="p-6 rounded-2xl bg-surface border border-border hover:border-border/80 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {business.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-success/10 text-success border border-success/20 uppercase tracking-wider">
                    Active
                  </span>
                </div>

                <p className="text-xs text-muted line-clamp-2 mb-4 leading-relaxed">
                  {business.description || 'Standard outpatient consultations and appointments.'}
                </p>

                <div className="space-y-2 text-xs text-subtle mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <span className="truncate">{business.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <span>{business.openingTime} – {business.closingTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-border/60">
                <Link
                  href={`/queue/${business.id}`}
                  className="p-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-muted hover:text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  title="View Public Queue"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Live Queue</span>
                </Link>

                <Link
                  href={`/businesses/${business.id}`}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Book Appointment</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
