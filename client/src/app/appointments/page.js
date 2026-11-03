'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, MapPin, Eye, XCircle, AlertCircle, ArrowRight, Store } from 'lucide-react';

export default function MyAppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelModalAppt, setCancelModalAppt] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/appointments/mine?limit=50');
      setAppointments(res.data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleCancelConfirm = async () => {
    if (!cancelModalAppt) return;
    setCancellingId(cancelModalAppt.id);
    try {
      await api.patch(`/appointments/${cancelModalAppt.id}/cancel`);
      setCancelModalAppt(null);
      await fetchAppointments();
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'serving':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase animate-pulse">Now Serving</span>;
      case 'waiting':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-info/10 text-info border border-info/20 uppercase">In Queue</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-success/10 text-success border border-success/20 uppercase">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20 uppercase">Cancelled</span>;
      case 'no_show':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-warning/10 text-warning border border-warning/20 uppercase">No Show</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-elevated text-muted uppercase">{status}</span>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 w-full animate-pulse space-y-6">
        <div className="h-8 bg-surface rounded w-48"></div>
        <div className="h-28 bg-surface rounded"></div>
        <div className="h-28 bg-surface rounded"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Please Sign In</h2>
        <p className="text-xs text-muted">You need to be signed in to view your appointments.</p>
        <Link href="/login" className="inline-block py-2.5 px-6 rounded-lg bg-primary text-white text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-xs text-muted mt-1">Review your tokens, queue status, and visit history</p>
        </div>

        <Link
          href="/businesses"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <span>Book New Visit</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchAppointments} className="font-semibold underline">Retry</button>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="p-10 rounded-2xl bg-surface border border-border text-center max-w-md mx-auto space-y-3">
          <Calendar className="h-10 w-10 text-muted mx-auto" />
          <h3 className="text-base font-semibold">No appointments yet</h3>
          <p className="text-xs text-muted">Discover local clinics and salons to book your first digital queue token.</p>
          <Link
            href="/businesses"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs font-semibold mt-2"
          >
            <Store className="h-3.5 w-3.5 text-primary" />
            <span>Explore Businesses</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="p-5 rounded-xl bg-surface border border-border hover:border-border/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                {/* Token Badge */}
                <div className="h-14 w-14 rounded-xl bg-background border border-border flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] uppercase font-bold text-muted">Token</span>
                  <span className="text-xl font-mono font-black text-primary">#{appt.tokenNumber}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {appt.business?.name || 'Local Business'}
                    </h3>
                    {getStatusBadge(appt.status)}
                  </div>

                  <p className="text-xs text-muted">
                    {appt.service?.name} • ₹{parseFloat(appt.service?.price || 0).toFixed(2)}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-subtle pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted" /> {appt.appointmentDate}
                    </span>
                    {appt.status === 'waiting' && appt.estimatedWaitMinutes !== null && (
                      <span className="flex items-center gap-1 text-info">
                        <Clock className="h-3 w-3" /> ~{appt.estimatedWaitMinutes}m wait
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {appt.business && (
                  <Link
                    href={`/queue/${appt.business.id}?date=${appt.appointmentDate}`}
                    className="p-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs font-medium text-foreground flex items-center gap-1.5 transition-colors"
                    title="Live Queue"
                  >
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    <span>Track Live</span>
                  </Link>
                )}

                {appt.status === 'waiting' && (
                  <button
                    onClick={() => setCancelModalAppt(appt)}
                    className="p-2.5 rounded-lg bg-surface-elevated hover:bg-danger/20 border border-border hover:border-danger/30 text-xs font-medium text-muted hover:text-danger flex items-center gap-1.5 transition-colors"
                    title="Cancel Appointment"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="p-6 rounded-2xl bg-surface border border-border max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-foreground">Cancel Appointment?</h3>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to cancel Token #{cancelModalAppt.tokenNumber} for {cancelModalAppt.business?.name}?
              This action cannot be undone and your place in the queue will be released.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCancelModalAppt(null)}
                disabled={cancellingId !== null}
                className="flex-1 py-2 px-3 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs font-semibold text-muted hover:text-foreground"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancellingId !== null}
                className="flex-1 py-2 px-3 rounded-lg bg-danger hover:bg-danger/80 text-white text-xs font-semibold"
              >
                {cancellingId ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
