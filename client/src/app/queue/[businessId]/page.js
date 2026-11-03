'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { getSocket, subscribeToQueue } from '../../../lib/socket';
import { Clock, Users, ArrowLeft, RefreshCw, Wifi, WifiOff, Pause } from 'lucide-react';

function PublicQueueContent() {
  const { businessId } = useParams();
  const searchParams = useSearchParams();

  const [date, setDate] = useState(() => {
    return searchParams.get('date') || new Date().toISOString().split('T')[0];
  });

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await api.get(`/businesses/${businessId}/queue?date=${date}`);
      setSnapshot(res.data);
      setLastRefreshed(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch queue snapshot');
    } finally {
      setLoading(false);
    }
  }, [businessId, date]);

  // Initial fetch
  useEffect(() => {
    if (businessId && date) {
      fetchSnapshot();
    }
  }, [businessId, date, fetchSnapshot]);

  // Real-time subscription
  useEffect(() => {
    if (!businessId || !date) return;

    const s = getSocket();
    if (s) {
      setSocketConnected(s.connected);

      const onConnect = () => {
        setSocketConnected(true);
        fetchSnapshot(); // Refetch on reconnect
      };

      const onDisconnect = () => {
        setSocketConnected(false);
      };

      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);

      const unsubscribe = subscribeToQueue(businessId, date, () => {
        fetchSnapshot();
      });

      return () => {
        unsubscribe();
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
      };
    }
  }, [businessId, date, fetchSnapshot]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-pulse space-y-6">
        <div className="h-8 bg-surface rounded w-48 mx-auto"></div>
        <div className="h-64 bg-surface rounded-2xl"></div>
        <div className="h-24 bg-surface rounded-xl"></div>
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm text-danger">{error}</p>
        <button
          onClick={fetchSnapshot}
          className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8">
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/businesses/${businessId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Business</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Real-time Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-[11px]">
            {socketConnected ? (
              <>
                <span className="h-2 w-2 rounded-full bg-success animate-ping"></span>
                <span className="text-success font-medium">Live Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-warning" />
                <span className="text-warning font-medium">Reconnecting...</span>
              </>
            )}
          </div>

          <button
            onClick={fetchSnapshot}
            className="p-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-muted hover:text-foreground transition-colors"
            title="Refresh snapshot"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Display Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Public Queue Display</span>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">{snapshot?.businessName}</h1>
        <p className="text-xs text-muted">
          Date: <span className="font-semibold text-foreground">{snapshot?.date}</span>
          {lastRefreshed && <span className="ml-2 text-subtle">• Last synced at {lastRefreshed}</span>}
        </p>
      </div>

      {snapshot?.isPaused && (
        <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 text-warning text-xs font-semibold flex items-center justify-center gap-2">
          <Pause className="h-4 w-4" />
          <span>Queue is currently paused by the business. Tokens remain reserved.</span>
        </div>
      )}

      {/* Hero Display: CURRENT SERVING TOKEN */}
      <div className="p-8 sm:p-12 rounded-3xl bg-surface border border-border text-center space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-primary to-blue-400"></div>

        <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-muted">
          Now Serving
        </p>

        <div className="py-2">
          {snapshot?.currentServingToken ? (
            <p className="text-7xl sm:text-9xl font-mono font-black text-primary tracking-tighter drop-shadow-md">
              #{snapshot.currentServingToken}
            </p>
          ) : (
            <div className="py-6">
              <p className="text-2xl sm:text-3xl font-bold text-muted">Not Serving Anyone</p>
              <p className="text-xs text-subtle mt-1">Queue is currently waiting or idle</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-border/60 text-xs text-subtle">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted" />
            <span>Waiting: <strong className="text-foreground">{snapshot?.waitingCount || 0} customers</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted" />
            <span>Est. Wait: <strong className="text-foreground">~{snapshot?.estimatedWaitMinutes || 0} mins</strong></span>
          </div>
        </div>
      </div>

      {/* Next Up Tokens Grid */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Next in Line</h2>
          <span className="text-[11px] text-muted">{snapshot?.waitingCount || 0} total waiting</span>
        </div>

        {(!snapshot?.nextTokens || snapshot.nextTokens.length === 0) ? (
          <p className="text-xs text-subtle py-4 text-center">No customers waiting ahead.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {snapshot.nextTokens.map((tokenNum, index) => (
              <div
                key={tokenNum}
                className="p-3.5 rounded-xl bg-background border border-border text-center space-y-1"
              >
                <span className="text-[10px] text-subtle font-semibold uppercase">
                  {index === 0 ? 'Next' : `+${index + 1}`}
                </span>
                <p className="text-2xl font-mono font-bold text-foreground">#{tokenNum}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-subtle pt-2 border-t border-border/40 text-left">
          {snapshot?.estimateDisclaimer || 'Waiting time is an estimate and may change.'}
        </p>
      </div>

      {/* Book Your Turn CTA */}
      <div className="text-center pt-4">
        <Link
          href={`/book/${businessId}`}
          className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors shadow-lg shadow-primary/20"
        >
          <span>Need a visit? Book Your Token Here</span>
        </Link>
      </div>
    </div>
  );
}

export default function PublicQueuePage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-16 text-center text-xs text-muted">Loading live queue...</div>}>
      <PublicQueueContent />
    </Suspense>
  );
}
