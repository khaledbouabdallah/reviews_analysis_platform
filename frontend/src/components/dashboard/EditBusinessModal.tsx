// src/components/dashboard/EditBusinessModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Loader2, Plus, Tag } from 'lucide-react';
import { BusinessWithStats, dashboardService } from '@/services/dashboard';

interface EditBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBusinessUpdated: () => void;
  business: BusinessWithStats | null;
}

interface BusinessFormData {
  name: string;
  description: string;
  segments: string[];
}

export function EditBusinessModal({ isOpen, onClose, onBusinessUpdated, business }: EditBusinessModalProps) {
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    segments: [],
  });
  const [newSegment, setNewSegment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Pre-fill form when business data is available
  useEffect(() => {
    if (business && isOpen) {
      setFormData({
        name: business.name,
        description: business.description || '',
        segments: business.segments || [],
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
    // Prepare the data to send
    const businessData = {
      name: formData.name,
      description: formData.description || undefined, // Don't send empty string
      segments: formData.segments.length > 0 ? formData.segments : undefined, // Don't send empty array
    };

    // Use the dashboardService instead of direct fetch
    await dashboardService.updateBusiness(business.id, businessData);

    // Success!
    onBusinessUpdated(); // Refresh the dashboard data
    handleClose(); // Close the modal
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSegment = () => {
    if (newSegment.trim() && !formData.segments.includes(newSegment.trim())) {
      setFormData({
        ...formData,
        segments: [...formData.segments, newSegment.trim()],
      });
      setNewSegment('');
    }
  };

  const handleRemoveSegment = (segmentToRemove: string) => {
    setFormData({
      ...formData,
      segments: formData.segments.filter(segment => segment !== segmentToRemove),
    });
  };

  const handleSegmentKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSegment();
    }
  };

  const handleClose = () => {
    if (!loading) {
      setIsAnimating(false);
      // Wait for animation to complete before actually closing
      setTimeout(() => {
        setFormData({ name: '', description: '', segments: [] });
        setNewSegment('');
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

  // Check if form has changes
  const hasChanges = business && (
    formData.name !== business.name ||
    formData.description !== (business.description || '') ||
    JSON.stringify(formData.segments) !== JSON.stringify(business.segments || [])
  );

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
          className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-out ${
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
                  <p className="text-sm text-gray-500 mt-1">Update your business information and segments</p>
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
              {/* Business Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Business Name <span className="text-red-500">*</span>
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

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
                  Business Description
                </label>
                <div className="relative">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    placeholder="Describe your business (optional)..."
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 pl-1">
                  Help AI understand your business better for more accurate review analysis
                </p>
              </div>

              {/* Segments */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Review Segments
                </label>
                
                {/* Segments Input */}
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newSegment}
                      onChange={(e) => setNewSegment(e.target.value)}
                      onKeyPress={handleSegmentKeyPress}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50"
                      placeholder="Add segment (e.g., food_quality, service, ambiance)..."
                    />
                    <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSegment}
                    disabled={loading || !newSegment.trim()}
                    className="px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 flex items-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Segments List */}
                {formData.segments.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    {formData.segments.map((segment, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full"
                      >
                        {segment}
                        <button
                          type="button"
                          onClick={() => handleRemoveSegment(segment)}
                          disabled={loading}
                          className="ml-2 text-orange-600 hover:text-orange-800 disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 pl-1">
                  Update segments for AI to classify reviews (e.g., food_quality, service_speed, cleanliness)
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
                  disabled={loading || !formData.name.trim() || !hasChanges}
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
                  🏷️ Only the display information will be updated<br/>
                  🤖 New segments will apply to future review analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}