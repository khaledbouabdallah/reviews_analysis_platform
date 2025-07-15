// src/components/business/modals/SourceModals.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Database, Loader2, AlertTriangle, Link, MapPin, FileText } from 'lucide-react';
import { Source, SourceCreate, SourceUpdate, SourceType, validateSourceUrl } from '@/services/source';
import { Location } from '@/services/location';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceCreated: () => void;
  businessId: string;
  locations: Location[];
}

export function AddSourceModal({ isOpen, onClose, onSourceCreated, businessId, locations }: AddSourceModalProps) {
  const [formData, setFormData] = useState<SourceCreate>({
    name: '',
    type: 'google',
    url: '',
    business_id: businessId,
    location_id: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setFormData({
        name: '',
        type: 'google',
        url: '',
        business_id: businessId,
        location_id: null,
      });
    }
  }, [isOpen, businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUrlError('');

    // Validate URL
    const urlValidation = validateSourceUrl(formData.url, formData.type);
    if (!urlValidation.valid) {
      setUrlError(urlValidation.error || 'Invalid URL');
      return;
    }

    setLoading(true);

    try {
      const { sourceService } = await import('@/services/source');
      await sourceService.createSource(formData);
      onSourceCreated();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: name === 'location_id' && value === '' ? null : value,
    }));

    // Clear URL error when user types
    if (name === 'url' || name === 'type') {
      setUrlError('');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setIsAnimating(false);
      setTimeout(() => {
        setFormData({
          name: '',
          type: 'google',
          url: '',
          business_id: businessId,
          location_id: null
        });
        setError('');
        setUrlError('');
        onClose();
      }, 200);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'google':
        return MapPin;
      case 'csv':
        return FileText;
      default:
        return Database;
    }
  };

  const SourceIcon = getSourceIcon(formData.type);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className={`fixed inset-0 transition-all duration-300 ease-out ${isAnimating ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-black/0'
          }`}
        onClick={handleClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-out ${isAnimating
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4'
            }`}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 rounded-3xl opacity-20 blur-sm" />

          <div className="relative bg-white rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-30 animate-pulse" />
                  <div className="relative p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl">
                    <SourceIcon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add New Source</h2>
                  <p className="text-sm text-gray-500 mt-1">Connect a review source to your business</p>
                </div>
              </div>

              <button
                onClick={handleClose}
                disabled={loading}
                className="group p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-50"
              >
                <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Source Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  placeholder="e.g., Main Google Reviews, Customer Feedback..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="block text-sm font-semibold text-gray-700">
                  Source Type
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  <option value="google">Google Maps Reviews</option>
                  <option value="csv">CSV File Upload</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="url" className="block text-sm font-semibold text-gray-700">
                  {formData.type === 'google' ? 'Google Maps URL' : 'CSV File Path'}
                </label>
                <div className="relative">
                  <input
                    id="url"
                    name="url"
                    type="url"
                    required
                    value={formData.url}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full px-4 py-4 pr-12 bg-gray-50 border-2 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg ${urlError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                      }`}
                    placeholder={
                      formData.type === 'google'
                        ? 'https://www.google.com/maps/place/YourBusiness/...'
                        : '/path/to/reviews.csv'
                    }
                  />
                  <Link className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {urlError && (
                  <p className="text-red-600 text-sm flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{urlError}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {formData.type === 'google'
                    ? 'Copy the URL from Google Maps when viewing the business reviews section'
                    : 'For now, provide the file path. File upload feature coming soon!'
                  }
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="location_id" className="block text-sm font-semibold text-gray-700">
                  Associated Location <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  id="location_id"
                  name="location_id"
                  value={formData.location_id || ''}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  <option value="">No specific location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Link this source to a specific location, or leave unassigned for general business reviews
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-6 py-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim() || !formData.url.trim() || !!urlError}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-3" />
                      <span className="animate-pulse">Adding...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-5 w-5 mr-3" />
                      Add Source
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceUpdated: () => void;
  source: Source | null;
  locations: Location[];
}

export function EditSourceModal({ isOpen, onClose, onSourceUpdated, source, locations }: EditSourceModalProps) {
  const [formData, setFormData] = useState<SourceUpdate>({
    name: '',
    type: 'google',
    url: '',
    location_id: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (source && isOpen) {
      setFormData({
        name: source.name,
        type: source.type,
        url: source.url,
        location_id: source.location_id,
      });
      setIsAnimating(true);
    }
  }, [source, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source) return;

    setError('');
    setUrlError('');

    // Validate URL if changed
    if (formData.url && formData.type) {
      const urlValidation = validateSourceUrl(formData.url, formData.type);
      if (!urlValidation.valid) {
        setUrlError(urlValidation.error || 'Invalid URL');
        return;
      }
    }

    setLoading(true);

    try {
      const { sourceService } = await import('@/services/source');
      await sourceService.updateSource(source.id, formData);
      onSourceUpdated();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: name === 'location_id' && value === '' ? null : value,
    }));

    // Clear URL error when user types
    if (name === 'url' || name === 'type') {
      setUrlError('');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setIsAnimating(false);
      setTimeout(() => {
        setFormData({ name: '', type: 'google', url: '', location_id: null });
        setError('');
        setUrlError('');
        onClose();
      }, 200);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !source) return null;

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'google':
        return MapPin;
      case 'csv':
        return FileText;
      default:
        return Database;
    }
  };

  const SourceIcon = getSourceIcon(formData.type || 'google');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className={`fixed inset-0 transition-all duration-300 ease-out ${isAnimating ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-black/0'
          }`}
        onClick={handleClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-out ${isAnimating
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4'
            }`}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 rounded-3xl opacity-20 blur-sm" />

          <div className="relative bg-white rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-30 animate-pulse" />
                  <div className="relative p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl">
                    <SourceIcon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Source</h2>
                  <p className="text-sm text-gray-500 mt-1">Update source information</p>
                </div>
              </div>

              <button
                onClick={handleClose}
                disabled={loading}
                className="group p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-50"
              >
                <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Source Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  placeholder="e.g., Main Google Reviews, Customer Feedback..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="block text-sm font-semibold text-gray-700">
                  Source Type
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  <option value="google">Google Maps Reviews</option>
                  <option value="csv">CSV File Upload</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="url" className="block text-sm font-semibold text-gray-700">
                  {formData.type === 'google' ? 'Google Maps URL' : 'CSV File Path'}
                </label>
                <div className="relative">
                  <input
                    id="url"
                    name="url"
                    type="url"
                    required
                    value={formData.url}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full px-4 py-4 pr-12 bg-gray-50 border-2 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg ${urlError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                      }`}
                    placeholder={
                      formData.type === 'google'
                        ? 'https://www.google.com/maps/place/YourBusiness/...'
                        : '/path/to/reviews.csv'
                    }
                  />
                  <Link className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {urlError && (
                  <p className="text-red-600 text-sm flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{urlError}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="location_id" className="block text-sm font-semibold text-gray-700">
                  Associated Location <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  id="location_id"
                  name="location_id"
                  value={formData.location_id || ''}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  <option value="">No specific location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-6 py-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name?.trim() || !formData.url?.trim() || !!urlError ||
                    (formData.name === source.name && formData.type === source.type && formData.url === source.url && formData.location_id === source.location_id)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-3" />
                      <span className="animate-pulse">Updating...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-5 w-5 mr-3" />
                      Update Source
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DeleteSourceConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sourceName: string;
  loading: boolean;
}

export function DeleteSourceConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  sourceName,
  loading
}: DeleteSourceConfirmationModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!loading) {
      setIsAnimating(false);
      setTimeout(onClose, 200);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className={`fixed inset-0 transition-all duration-300 ease-out ${isAnimating ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-black/0'
          }`}
        onClick={handleClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out ${isAnimating
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4'
            }`}
        >
          <div className="p-8 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl" />
              <div className="relative w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Source</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{sourceName}</strong>?
              This action cannot be undone and will also remove any associated jobs and reviews from this source.
            </p>

            <div className="flex space-x-4">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Source'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}