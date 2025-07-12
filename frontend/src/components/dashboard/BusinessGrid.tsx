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
  onBusinessCreated?: () => void; // Add callback prop
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
      onBusinessCreated(); // Refresh dashboard data
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
    
    // Refresh the dashboard data
    if (onBusinessCreated) {
      onBusinessCreated();
    }
    
    // Close dropdown
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
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
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
      
      {/* Add Business Modal */}
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
      {businesses.map((business) => (
        <div
          key={business.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {business.name}
            </h3>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(dropdownOpen === business.id ? null : business.id)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen === business.id && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      handleViewBusiness(business.id);
                      setDropdownOpen(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => {
                      handleEditBusiness(business.id);
                      setDropdownOpen(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteBusiness(business.id);
                      setDropdownOpen(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
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
                <MapPin className="h-4 w-4" />
                <span>Locations</span>
              </div>
              <span className="font-medium text-gray-900">{business.locationCount}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <Database className="h-4 w-4" />
                <span>Sources</span>
              </div>
              <span className="font-medium text-gray-900">{business.sourceCount}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <MessageSquare className="h-4 w-4" />
                <span>Reviews</span>
              </div>
              <span className="font-medium text-gray-900">{business.reviewCount}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>Created {formatDate(business.created_at)}</span>
            </div>
            <button
              onClick={() => handleViewBusiness(business.id)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            >
              View →
            </button>
          </div>
        </div>
      ))}

      {/* Add New Business Card */}
      <div 
        onClick={handleAddBusiness}
        className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-gray-400 hover:bg-gray-100 transition-colors cursor-pointer group"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-200 group-hover:bg-gray-300 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
            <Plus className="h-6 w-6 text-gray-500 group-hover:text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Add New Business</h3>
          <p className="text-sm text-gray-500">Create a new business to start tracking reviews</p>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(null)}
        />
      )}

      {/* Add Business Modal */}
      <AddBusinessModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBusinessCreated={handleBusinessCreated}
      />

      {/* Edit Business Modal */}
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