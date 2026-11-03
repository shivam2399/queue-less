'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { MapPin, Clock, Phone, ArrowLeft, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';

export default function BusinessDetailPage() {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBusiness() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/businesses/${businessId}`);
        setBusiness(res.data.business);
      } catch (err) {
        setError(err.message || 'Failed to load business details');
      } finally {
        setLoading(false);
      }
    }
    if (businessId) {
      loadBusiness();
    }
  }, [businessId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 w-full animate-pulse space-y-6">
        <div className="h-6 bg-surface rounded w-24"></div>
        <div className="h-10 bg-surface rounded w-2/3"></div>
        <div className="h-24 bg-surface rounded"></div>
        <div className="h-48 bg-surface rounded"></div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-sm text-danger mb-4">{error || 'Business not found'}</p>
        <Link
          href="/businesses"
          className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Businesses
        </Link>
      </div>
    );
  }

  const services = business.services || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8">
      {/* Back link */}
      <Link
        href="/businesses"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>All Businesses</span>
      </Link>

      {/* Business Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{business.name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-success/10 text-success border border-success/20 uppercase tracking-wider">
                Active
              </span>
            </div>
            <p className="text-sm text-muted max-w-2xl leading-relaxed">
              {business.description || 'Verified local service provider.'}
            </p>
          </div>

          <Link
            href={`/queue/${business.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-border text-xs font-semibold text-foreground transition-colors shrink-0"
          >
            <Eye className="h-4 w-4 text-primary" />
            <span>View Live Queue</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/60 text-xs text-subtle">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted shrink-0" />
            <span className="truncate">{business.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted shrink-0" />
            <span>{business.openingTime} – {business.closingTime}</span>
          </div>
          {business.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted shrink-0" />
              <span>{business.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Available Services */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Available Services</h2>
          <span className="text-xs text-muted">{services.length} services offered</span>
        </div>

        {services.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface border border-border text-center text-xs text-muted">
            No active services are currently listed for this business.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-5 rounded-xl bg-surface border border-border hover:border-border/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="text-sm font-bold text-foreground">{service.name}</h3>
                  </div>
                  {service.description && (
                    <p className="text-xs text-muted pl-6">{service.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-subtle pl-6 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> ~{service.durationMinutes} mins
                    </span>
                    <span className="font-semibold text-foreground">
                      ₹{parseFloat(service.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/book/${business.id}?serviceId=${service.id}`}
                  className="px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors self-start sm:self-center shrink-0"
                >
                  <span>Select & Book</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
