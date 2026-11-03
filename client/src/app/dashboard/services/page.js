'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Edit2, Trash2, Clock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OwnerServicesPage() {
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: 20,
    price: 300
  });
  const [saving, setSaving] = useState(false);

  const fetchServices = async (businessId) => {
    try {
      const res = await api.get(`/businesses/${businessId}`);
      setServices(res.data.business.services || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadOwnerBusiness() {
      try {
        const res = await api.get('/businesses/mine');
        const list = res.data.businesses || [];
        setBusinesses(list);
        if (list.length > 0) {
          setSelectedBusinessId(String(list[0].id));
          await fetchServices(list[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    if (user && user.role === 'business_owner') {
      loadOwnerBusiness();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({ name: '', description: '', durationMinutes: 20, price: 300 });
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      durationMinutes: service.durationMinutes,
      price: service.price
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingService) {
        // PATCH
        await api.patch(`/services/${editingService.id}`, formData);
      } else {
        // POST
        await api.post(`/businesses/${selectedBusinessId}/services`, formData);
      }
      setModalOpen(false);
      await fetchServices(selectedBusinessId);
    } catch (err) {
      setError(err.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (serviceId, serviceName) => {
    if (!confirm(`Deactivate "${serviceName}"? New customers won't be able to book it, but existing booking history will be preserved.`)) return;

    try {
      await api.delete(`/services/${serviceId}`);
      await fetchServices(selectedBusinessId);
    } catch (err) {
      alert(err.message || 'Failed to deactivate service');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 w-full animate-pulse space-y-6">
        <div className="h-8 bg-surface rounded w-48"></div>
        <div className="h-32 bg-surface rounded"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Queue Dashboard</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Management</h1>
          <p className="text-xs text-muted mt-1">Configure offerings, appointment durations, and prices</p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs underline font-semibold">Dismiss</button>
        </div>
      )}

      {services.length === 0 ? (
        <div className="p-10 rounded-2xl bg-surface border border-border text-center max-w-md mx-auto space-y-3">
          <Clock className="h-10 w-10 text-muted mx-auto" />
          <h3 className="text-base font-semibold">No services configured</h3>
          <p className="text-xs text-muted">Add at least one service so customers can book into your queue.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold mt-2"
          >
            Add Service Now
          </button>
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
                  <span>~{service.durationMinutes} mins</span>
                  <span>₹{parseFloat(service.price).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => openEditModal(service)}
                  className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-muted hover:text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeactivate(service.id, service.name)}
                  className="p-2 rounded-lg bg-surface-elevated hover:bg-danger/20 border border-border hover:border-danger/30 text-muted hover:text-danger text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Deactivate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="p-6 rounded-2xl bg-surface border border-border max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-foreground">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. General Consultation"
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-xs text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief details about the service"
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-xs text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min={5}
                    required
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-xs text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-lg bg-surface-elevated border border-border focus:outline-none focus:border-primary text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="flex-1 py-2 px-3 rounded-lg bg-surface-elevated border border-border text-xs font-semibold text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
                >
                  {saving ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
