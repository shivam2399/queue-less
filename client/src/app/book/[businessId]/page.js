'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, Clock, Calendar, CheckCircle, AlertCircle, ArrowRight, Eye, ShieldAlert } from 'lucide-react';

function BookingContent() {
  const { businessId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [business, setBusiness] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(searchParams.get('serviceId') || '');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.get(`/businesses/${businessId}`);
        setBusiness(res.data.business);
        if (!selectedServiceId && res.data.business.services?.length > 0) {
          setSelectedServiceId(String(res.data.business.services[0].id));
        }
      } catch (err) {
        setError(err.message || 'Failed to load business data');
      } finally {
        setLoading(false);
      }
    }
    if (businessId) {
      loadData();
    }
  }, [businessId, selectedServiceId]);

  const handleBook = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await api.post('/appointments', {
        businessId: Number(businessId),
        serviceId: Number(selectedServiceId),
        appointmentDate
      });

      setBookingResult(res.data.appointment);
    } catch (err) {
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-6 bg-surface rounded w-24"></div>
        <div className="h-8 bg-surface rounded w-2/3"></div>
        <div className="h-64 bg-surface rounded"></div>
      </div>
    );
  }

  // If user is not authenticated as customer
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-surface border border-border space-y-4">
          <ShieldAlert className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-lg font-bold">Sign In Required</h2>
          <p className="text-xs text-muted">
            You must be signed in with a customer account to book an appointment and receive a queue token.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href={`/login?redirect=/book/${businessId}`}
              className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold text-center"
            >
              Sign In
            </Link>
            <Link
              href={`/register?role=customer&redirect=/book/${businessId}`}
              className="flex-1 py-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs font-semibold text-center"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'business_owner') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-6 rounded-2xl bg-surface border border-border">
          <p className="text-sm font-semibold text-warning mb-2">Business Owner Account</p>
          <p className="text-xs text-muted mb-4">
            You are logged in as a business owner. Please use a customer account to book services, or navigate to your queue dashboard.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-primary text-white text-xs font-semibold"
          >
            Go to Owner Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Success Confirmation Screen
  if (bookingResult) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-8 rounded-2xl bg-surface border border-border space-y-6 shadow-xl">
          <div className="h-16 w-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center text-success mx-auto">
            <CheckCircle className="h-8 w-8" />
          </div>

          <div>
            <span className="text-xs font-semibold text-success uppercase tracking-wider">Booking Confirmed</span>
            <h1 className="text-2xl font-black text-foreground mt-1">{business?.name}</h1>
            <p className="text-xs text-muted mt-1">{bookingResult.service?.name}</p>
          </div>

          {/* Token Box */}
          <div className="p-6 rounded-xl bg-background border border-border text-center">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Your Queue Token</p>
            <p className="text-5xl font-mono font-black text-primary my-2">#{bookingResult.tokenNumber}</p>
            <div className="flex items-center justify-center gap-4 text-xs text-subtle mt-2 pt-2 border-t border-border/50">
              <span>Position: <strong>#{bookingResult.queuePosition}</strong></span>
              <span>•</span>
              <span>Est. Wait: <strong>~{bookingResult.estimatedWaitMinutes}m</strong></span>
            </div>
          </div>

          <p className="text-[11px] text-subtle leading-relaxed bg-surface-elevated p-3 rounded-lg border border-border/50 text-left">
            <strong>Policy note:</strong> Your token number guarantees your place in the daily queue. Waiting times are estimates based on service durations.
          </p>

          <div className="flex flex-col gap-2.5">
            <Link
              href={`/queue/${businessId}`}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20"
            >
              <Eye className="h-4 w-4" />
              <span>Track in Live Queue</span>
            </Link>

            <Link
              href="/appointments"
              className="w-full py-2.5 px-4 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-border text-xs font-semibold text-muted hover:text-foreground transition-colors"
            >
              View My Appointments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const services = business?.services || [];
  const selectedService = services.find(s => String(s.id) === String(selectedServiceId));
  const todayMin = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-xl mx-auto px-4 py-10 w-full space-y-6">
      <Link
        href={`/businesses/${businessId}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to {business?.name || 'Business'}</span>
      </Link>

      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Book a Visit</h1>
          <p className="text-xs text-muted mt-1">{business?.name} • {business?.address}</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleBook} className="space-y-5">
          {/* Service Picker */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Select Service
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-sm text-foreground"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (~{s.durationMinutes} mins) — ₹{parseFloat(s.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Appointment Date
            </label>
            <input
              type="date"
              required
              min={todayMin}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-sm text-foreground"
            />
          </div>

          {/* Summary Box */}
          {selectedService && (
            <div className="p-4 rounded-xl bg-background border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Selected Service:</span>
                <span className="font-semibold text-foreground">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Duration:</span>
                <span className="font-semibold text-foreground">~{selectedService.durationMinutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Price:</span>
                <span className="font-semibold text-foreground">₹{parseFloat(selectedService.price).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-border/50 text-[11px] text-subtle leading-relaxed">
                Tokens are sequentially allocated on the selected date. No advance payment required for MVP.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedServiceId}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20"
          >
            {submitting ? (
              <span>Allocating Queue Token...</span>
            ) : (
              <>
                <span>Confirm & Receive Token</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-16 text-center text-xs text-muted">Loading booking details...</div>}>
      <BookingContent />
    </Suspense>
  );
}
