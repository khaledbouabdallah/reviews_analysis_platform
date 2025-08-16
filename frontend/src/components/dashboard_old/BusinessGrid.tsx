// src/components/dashboard/BusinessGrid.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  MapPin,
  Database,
  MessageSquare,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  Calendar
} from 'lucide-react';
import { BusinessWithStats, dashboardService } from '@/services/dashboard';
import { AddBusinessModal } from './AddBusinessModal';
import { EditBusinessModal } from './EditBusinessModal';
import { OnboardingGuide } from './OnboardingGuide';

interface BusinessGridProps {
  businesses: BusinessWithStats[];
  loading?: boolean;
  onBusinessCreated?: () => void;
}

export function BusinessGrid({ businesses, loading = false, onBusinessCreated }: BusinessGridProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessWithStats | null>(null);

  const handleAddBusiness = () => {
    setIsAddModalOpen(true);
  };

  const handleBusinessCreated = () => {
    if (onBusinessCreated) {
      onBusinessCreated();
    }
  };

  const handleViewBusiness = (businessId: string) => {
    router.push(`/business/${businessId}`);
  };

  const handleEditBusiness = (businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    if (business) {
      setSelectedBusiness(business);
      setIsEditModalOpen(true);
      setDropdownOpen(null);
    }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this business? This action cannot be undone.');

    if (!confirmed) return;

    try {
      await dashboardService.deleteBusiness(businessId);

      if (onBusinessCreated) {
        onBusinessCreated();
      }

      setDropdownOpen(null);
      console.log('Business deleted successfully!');
    } catch (error) {
      console.error('Failed to delete business:', error);
      alert('Failed to delete business. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative animate-pulse">
            {/* Glassmorphic background for skeleton */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-32 h-6 bg-gray-200 rounded"></div>
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-3">
                <div className="w-full h-4 bg-gray-200 rounded"></div>
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <>
        <OnboardingGuide onCreateBusiness={handleAddBusiness} />

        <AddBusinessModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onBusinessCreated={handleBusinessCreated}
        />
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.map((business, index) => (
        <div
          key={business.id}
          className="group relative animate-in slide-in-from-bottom duration-500"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Glassmorphic background with enhanced effects */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg group-hover:shadow-2xl transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-300">
                {business.name}
              </h3>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(dropdownOpen === business.id ? null : business.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen === business.id && (
                  <div className="absolute right-0 mt-1 w-40 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/40 py-1 z-50">
                    <button
                      onClick={() => {
                        handleViewBusiness(business.id);
                        setDropdownOpen(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-white/50 flex items-center space-x-2 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => {
                        handleEditBusiness(business.id);
                        setDropdownOpen(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-white/50 flex items-center space-x-2 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteBusiness(business.id);
                        setDropdownOpen(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50/50 flex items-center space-x-2 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="p-1 bg-emerald-100 rounded-lg">
                    <MapPin className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span>Locations</span>
                </div>
                <span className="font-medium text-gray-900 bg-white/50 px-2 py-1 rounded-lg">
                  {business.locationCount}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="p-1 bg-purple-100 rounded-lg">
                    <Database className="h-3 w-3 text-purple-600" />
                  </div>
                  <span>Sources</span>
                </div>
                <span className="font-medium text-gray-900 bg-white/50 px-2 py-1 rounded-lg">
                  {business.sourceCount}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-3 w-3 text-blue-600" />
                  </div>
                  <span>Reviews</span>
                </div>
                <span className="font-medium text-gray-900 bg-white/50 px-2 py-1 rounded-lg">
                  {business.reviewCount}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/20 pt-4 flex items-center justify-between">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>Created {formatDate(business.created_at)}</span>
              </div>
              <button
                onClick={() => handleViewBusiness(business.id)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105"
              >
                View →
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add New Business Card */}
      <div
        onClick={handleAddBusiness}
        className="group relative cursor-pointer animate-in slide-in-from-bottom duration-500"
        style={{ animationDelay: `${businesses.length * 0.1}s` }}
      >
        {/* Glassmorphic background */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-2xl border-2 border-dashed border-white/40 group-hover:border-white/60 group-hover:bg-white/30 transition-all duration-300" />

        <div className="relative p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
              <div className="relative w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:from-blue-600 group-hover:to-purple-600 rounded-xl flex items-center justify-center mx-auto transition-all duration-300 group-hover:scale-110">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2 group-hover:text-gray-900 transition-colors duration-300">
              Add New Business
            </h3>
            <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
              Create a new business to start tracking reviews
            </p>
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(null)}
        />
      )}

      {/* Modals */}
      <AddBusinessModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBusinessCreated={handleBusinessCreated}
      />

      <EditBusinessModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBusiness(null);
        }}
        onBusinessUpdated={handleBusinessCreated}
        business={selectedBusiness}
      />
    </div>
  );
}