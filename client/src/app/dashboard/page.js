'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { subscribeToQueue } from '../../lib/socket';
import {
  Users,
  Play,
  CheckCircle2,
  Pause,
  AlertTriangle,
  UserX,
  PlusCircle,
  Eye,
  RefreshCw,
  Clock,
  Store,
  Settings,
  Calendar
} from 'lucide-react';

export default function OwnerDashboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [snapshot, setSnapshot] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Load owned businesses
  useEffect(() => {
    async function loadBusinesses() {
      try {
        const res = await api.get('/businesses/mine');
        const list = res.data.businesses || [];
        setBusinesses(list);
        if (list.length > 0 && !selectedBusinessId) {
          setSelectedBusinessId(String(list[0].id));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (user && user.role === 'business_owner') {
      loadBusinesses();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, selectedBusinessId]);

  // Load queue snapshot & appointments
  const loadQueueData = useCallback(async () => {
    if (!selectedBusinessId) return;
    try {
      const [snapRes, apptRes] = await Promise.all([
        api.get(`/businesses/${selectedBusinessId}/queue?date=${selectedDate}`),
        api.get(`/businesses/${selectedBusinessId}/appointments?date=${selectedDate}&limit=100`)
      ]);
      setSnapshot(snapRes.data);
      setAppointments(apptRes.data.items || []);
    } catch (err) {
      setError(err.message);
    }
  }, [selectedBusinessId, selectedDate]);

  useEffect(() => {
    if (selectedBusinessId) {
      loadQueueData();
    }
  }, [selectedBusinessId, selectedDate, loadQueueData]);

  // Real-time Socket.IO subscription
  useEffect(() => {
    if (!selectedBusinessId || !selectedDate) return;

    const unsubscribe = subscribeToQueue(selectedBusinessId, selectedDate, () => {
      // Re-fetch authoritative snapshot whenever event arrives
      loadQueueData();
    });

    return () => {
      unsubscribe();
    };
  }, [selectedBusinessId, selectedDate, loadQueueData]);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Operational Actions
  const handleCallNext = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post(`/businesses/${selectedBusinessId}/queue/call-next`, {
        date: selectedDate
      });
      showNotification(`Now serving Token #${res.data.appointment.tokenNumber} (${res.data.appointment.customer?.name || 'Customer'})`);
      await loadQueueData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteCurrent = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post(`/businesses/${selectedBusinessId}/queue/complete-current`, {
        date: selectedDate
      });
      showNotification(`Token #${res.data.appointment.tokenNumber} marked as Completed`);
      await loadQueueData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkNoShow = async (appointmentId, tokenNumber) => {
    if (!confirm(`Mark Token #${tokenNumber} as No-Show?`)) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/businesses/${selectedBusinessId}/queue/appointments/${appointmentId}/no-show`);
      showNotification(`Token #${tokenNumber} marked as No-Show`);
      await loadQueueData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePause = async () => {
    if (!snapshot) return;
    setActionLoading(true);
    setError(null);
    try {
      const newStatus = !snapshot.isPaused;
      await api.patch(`/businesses/${selectedBusinessId}/queue/pause`, {
        isPaused: newStatus,
        date: selectedDate
      });
      showNotification(newStatus ? 'Queue is now PAUSED' : 'Queue is now ACTIVE');
      await loadQueueData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 w-full animate-pulse space-y-6">
        <div className="h-10 bg-surface rounded w-64"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-surface rounded-xl"></div>)}
        </div>
        <div className="h-64 bg-surface rounded-2xl"></div>
      </div>
    );
  }

  if (!user || user.role !== 'business_owner') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Owner Access Required</h2>
        <p className="text-xs text-muted">You must be logged in as a business owner to access this control dashboard.</p>
        <Link href="/login" className="inline-block py-2.5 px-6 rounded-lg bg-primary text-white text-xs font-semibold">
          Sign In as Owner
        </Link>
      </div>
    );
  }

  // If owner hasn't created a business yet
  if (businesses.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-8 rounded-2xl bg-surface border border-border space-y-4 shadow-xl">
          <Store className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Create Your Business Profile</h2>
          <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
            You don&apos;t have any registered business yet. Set up your clinic, salon, or service center name, address, and operating hours to launch your digital queue.
          </p>
          <Link
            href="/dashboard/business"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Business Profile</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentBusiness = businesses.find(b => String(b.id) === String(selectedBusinessId));
  const waitingList = appointments.filter(a => a.status === 'waiting');
  const servingAppt = appointments.find(a => a.status === 'serving');
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled' || a.status === 'no_show').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight">{currentBusiness?.name}</h1>
            {snapshot?.isPaused ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-warning/10 text-warning border border-warning/30 flex items-center gap-1 uppercase tracking-wider">
                <Pause className="h-3 w-3" /> Paused
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/30 flex items-center gap-1 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping"></span> Live Queue
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5">{currentBusiness?.address} • Operating timezone: {currentBusiness?.timezone}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs">
            <Calendar className="h-3.5 w-3.5 text-muted" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none text-xs"
            />
          </div>

          <Link
            href={`/queue/${selectedBusinessId}?date=${selectedDate}`}
            target="_blank"
            className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Open Public Screen"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Public Display</span>
          </Link>

          <button
            onClick={loadQueueData}
            className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground text-xs transition-colors"
            title="Refresh Snapshot"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs underline font-semibold">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-success/10 border border-success/30 text-success text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Now Serving</p>
          <p className="text-3xl font-mono font-black text-primary mt-1">
            {snapshot?.currentServingToken ? `#${snapshot.currentServingToken}` : 'None'}
          </p>
          <p className="text-[10px] text-subtle mt-1 truncate">
            {servingAppt?.customer?.name ? `Patient/Client: ${servingAppt.customer.name}` : 'Queue Idle'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Waiting in Line</p>
          <p className="text-3xl font-mono font-black text-info mt-1">{waitingList.length}</p>
          <p className="text-[10px] text-subtle mt-1">~{snapshot?.estimatedWaitMinutes || 0}m est. total wait</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Completed Today</p>
          <p className="text-3xl font-mono font-black text-success mt-1">{completedCount}</p>
          <p className="text-[10px] text-subtle mt-1">Appointments served</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Cancelled / No-Show</p>
          <p className="text-3xl font-mono font-black text-muted mt-1">{cancelledCount}</p>
          <p className="text-[10px] text-subtle mt-1">Released slots</p>
        </div>
      </div>

      {/* Primary Action Controls Card */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Queue Operations</h2>
          <span className="text-xs text-muted">Atomic transactional actions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Call Next Button */}
          <button
            onClick={handleCallNext}
            disabled={actionLoading || snapshot?.isPaused || servingAppt !== undefined || waitingList.length === 0}
            className="py-4 px-6 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-colors shadow-lg shadow-primary/20"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>Call Next Customer</span>
          </button>

          {/* Complete Current Button */}
          <button
            onClick={handleCompleteCurrent}
            disabled={actionLoading || !servingAppt}
            className="py-4 px-6 rounded-xl bg-success hover:bg-success/90 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-colors shadow-lg shadow-success/20"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>Complete Current</span>
          </button>

          {/* Pause / Resume Button */}
          <button
            onClick={handleTogglePause}
            disabled={actionLoading}
            className={`py-4 px-6 rounded-xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-colors ${
              snapshot?.isPaused
                ? 'bg-success/10 border-success/30 text-success hover:bg-success/20'
                : 'bg-warning/10 border-warning/30 text-warning hover:bg-warning/20'
            }`}
          >
            {snapshot?.isPaused ? (
              <>
                <Play className="h-5 w-5 fill-current" />
                <span>Resume Queue</span>
              </>
            ) : (
              <>
                <Pause className="h-5 w-5" />
                <span>Pause Queue</span>
              </>
            )}
          </button>
        </div>

        {servingAppt && (
          <p className="text-xs text-subtle text-center pt-2">
            <strong>Note:</strong> Token #{servingAppt.tokenNumber} is currently serving. Complete or mark it as no-show before calling the next token.
          </p>
        )}
      </div>

      {/* Waiting List Table */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">Waiting Queue</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-elevated text-muted">
              {waitingList.length}
            </span>
          </div>
          <span className="text-xs text-muted">Ordered by allocated token</span>
        </div>

        {waitingList.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted border border-dashed border-border rounded-xl">
            No customers currently waiting in the queue for this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Token</th>
                  <th className="py-3 px-3">Customer Name</th>
                  <th className="py-3 px-3">Service</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {waitingList.map((appt) => (
                  <tr key={appt.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-primary">#{appt.tokenNumber}</td>
                    <td className="py-3 px-3 font-semibold text-foreground">
                      {appt.customer?.name || 'Walk-in Customer'}
                      <span className="block text-[10px] text-muted font-normal">{appt.customer?.email}</span>
                    </td>
                    <td className="py-3 px-3 text-muted">{appt.service?.name}</td>
                    <td className="py-3 px-3 text-subtle">~{appt.service?.durationMinutes} mins</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleMarkNoShow(appt.id, appt.tokenNumber)}
                        className="py-1 px-2.5 rounded-lg bg-surface-elevated hover:bg-danger/20 border border-border hover:border-danger/30 text-muted hover:text-danger font-medium transition-colors"
                      >
                        No-Show
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
