// src/components/dashboard/EditBusinessModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Loader2 } from 'lucide-react';
import { BusinessWithStats, dashboardService } from '@/services/dashboard';

interface EditBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBusinessUpdated: () => void;
  business: BusinessWithStats | null;
}

interface BusinessFormData {
  name: string;
}

export function EditBusinessModal({ isOpen, onClose, onBusinessUpdated, business }: EditBusinessModalProps) {
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Pre-fill form when business data is available
  useEffect(() => {
    if (business && isOpen) {
      setFormData({
        name: business.name,
      });
    }
  }, [business, isOpen]);

  // Handle animations
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!business) return;
  
  setError('');
  setLoading(true);

  try {
    // Use the dashboardService instead of direct fetch
    await dashboardService.updateBusiness(business.id, formData);

    // Success!
    onBusinessUpdated(); // Refresh the dashboard data
    handleClose(); // Close the modal
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleClose = () => {
    if (!loading) {
      setIsAnimating(false);
      // Wait for animation to complete before actually closing
      setTimeout(() => {
        setFormData({ name: '' });
        setError('');
        onClose();
      }, 200);
    }
  };

  // Handle ESC key
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

  if (!isOpen || !business) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with subtle overlay */}
      <div 
        className={`fixed inset-0 transition-all duration-300 ease-out ${
          isAnimating ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-black/0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-out ${
            isAnimating 
              ? 'scale-100 opacity-100 translate-y-0' 
              : 'scale-95 opacity-0 translate-y-4'
          }`}
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)',
          }}
        >
          {/* Decorative gradient border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-yellow-500 to-red-500 rounded-3xl opacity-20 blur-sm" />
          
          <div className="relative bg-white rounded-3xl p-8">
            {/* Header with icon animation */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-30 animate-pulse" />
                  <div className="relative p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
                    Edit Business
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Update your business information</p>
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

            {/* Current business info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Currently editing:</p>
                  <p className="text-lg font-bold text-gray-900">{business.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(business.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Form with smooth focus animations */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Business Name
                </label>
                <div className="relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    placeholder="Enter your business name..."
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 pl-1">
                  This change will be reflected across your entire dashboard
                </p>
              </div>

              {/* Animated error message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Animated buttons */}
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
                  disabled={loading || !formData.name.trim() || formData.name === business.name}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-3" />
                      <span className="animate-pulse">Updating...</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="h-5 w-5 mr-3" />
                      Update Business
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Info panel */}
            <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 animate-pulse" />
              <div className="relative">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-bounce" />
                  <h4 className="text-sm font-bold text-orange-800">Good to know</h4>
                </div>
                <p className="text-xs text-orange-700 leading-relaxed">
                  🔄 Changes are instant across your dashboard<br/>
                  📊 All existing data remains unchanged<br/>
                  🏷️ Only the display name will be updated
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}