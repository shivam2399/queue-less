'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, Store, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function OwnerBusinessSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [existingBusiness, setExistingBusiness] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    openingTime: '09:00',
    closingTime: '18:00',
    timezone: 'Asia/Kolkata',
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBusiness() {
      try {
        const res = await api.get('/businesses/mine');
        const list = res.data.businesses || [];
        if (list.length > 0) {
          const b = list[0];
          setExistingBusiness(b);
          setFormData({
            name: b.name || '',
            description: b.description || '',
            address: b.address || '',
            phone: b.phone || '',
            openingTime: b.openingTime ? b.openingTime.substring(0, 5) : '09:00',
            closingTime: b.closingTime ? b.closingTime.substring(0, 5) : '18:00',
            timezone: b.timezone || 'Asia/Kolkata',
            isActive: b.isActive ?? true
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (user && user.role === 'business_owner') {
      loadBusiness();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (existingBusiness) {
        // Update existing business
        const res = await api.patch(`/businesses/${existingBusiness.id}`, formData);
        setExistingBusiness(res.data.business);
        setMessage('Business profile updated successfully!');
      } else {
        // Create new business
        const res = await api.post('/businesses', formData);
        setExistingBusiness(res.data.business);
        setMessage('Business profile created successfully! You can now manage your queue.');
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to save business settings');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 w-full animate-pulse space-y-6">
        <div className="h-8 bg-surface rounded w-48"></div>
        <div className="h-96 bg-surface rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 w-full space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Queue Dashboard</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Profile & Operating Hours</h1>
        <p className="text-xs text-muted mt-1">Configure your location, contact details, and daily schedule</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-3.5 rounded-xl bg-success/10 border border-success/30 text-success text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-surface border border-border space-y-5">
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="name">
            Business Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. City Care Clinic"
            className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-subtle"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your services, clinic specialities, or appointment instructions"
            className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-subtle"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="address">
            Address / Location
          </label>
          <input
            id="address"
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Plot 14, Commercial Complex, Sector 6, Bhilai"
            className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-subtle"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="phone">
            Phone Number (Optional)
          </label>
          <input
            id="phone"
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
            className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-subtle"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="openingTime">
              Opening Time (HH:MM)
            </label>
            <input
              id="openingTime"
              type="text"
              required
              pattern="^([01]\d|2[0-3]):([0-5]\d)$"
              value={formData.openingTime}
              onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
              placeholder="09:00"
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="closingTime">
              Closing Time (HH:MM)
            </label>
            <input
              id="closingTime"
              type="text"
              required
              pattern="^([01]\d|2[0-3]):([0-5]\d)$"
              value={formData.closingTime}
              onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
              placeholder="18:00"
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-sm text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="timezone">
            Timezone
          </label>
          <input
            id="timezone"
            type="text"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-sm text-foreground"
          />
        </div>

        {existingBusiness && (
          <div className="flex items-center gap-3 pt-2">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-xs text-muted">
              Business is Active (visible in public discovery and bookable)
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : existingBusiness ? 'Update Settings' : 'Create Business'}</span>
        </button>
      </form>
    </div>
  );
}
