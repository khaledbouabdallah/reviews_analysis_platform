// src/components/business/sections/LocationsSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { Location, locationService } from '@/services/location';
import { AddLocationModal, EditLocationModal, DeleteConfirmationModal } from '../modals/LocationModals';

interface LocationsSectionProps {
  businessId: string;
}

export function LocationsSection({ businessId }: LocationsSectionProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load locations
  const loadLocations = async () => {
    try {
      setError('');
      const data = await locationService.getLocationsByBusiness(businessId);
      setLocations(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      loadLocations();
    }
  }, [businessId]);

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setShowEditModal(true);
  };

  const handleDelete = (location: Location) => {
    setSelectedLocation(location);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLocation) return;

    setDeleteLoading(true);
    try {
      await locationService.deleteLocation(selectedLocation.id);
      await loadLocations(); // Refresh the list
      setShowDeleteModal(false);
      setSelectedLocation(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full max-h-96 section-container">
      {/* Fixed Header */}
      <div className="flex-shrink-0 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">
              {loading ? 'Loading locations...' : `${locations.length} location${locations.length !== 1 ? 's' : ''} configured`}
            </p>
            <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={loading}
            className="group bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-medium">Add Location</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-3 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading locations...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && locations.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-in fade-in duration-700">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-3xl" />
                <MapPin className="relative h-16 w-16 mx-auto text-emerald-500/60 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
              <p className="text-gray-600 mb-6">Add your first location to start organizing your review sources</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-medium"
              >
                Add First Location
              </button>
            </div>
          </div>
        )}

        {/* Locations List - Scrollable */}
        {!loading && locations.length > 0 && (
          <div
            className="scrollable-container space-y-4"
            style={{
              height: '200px', // Fixed height like the test
              overflowY: 'auto', // Only vertical scrolling
              overflowX: 'hidden', // Hide horizontal scrollbar
            }}
            tabIndex={0}
            role="region"
            aria-label="Locations list"
          >
            {locations.map((location, index) => (
              <div
                key={location.id}
                className="group relative animate-in slide-in-from-left duration-500"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Card background */}
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:bg-white/70 group-hover:shadow-xl transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors duration-300">
                          {location.name}
                        </h4>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed pl-9">
                        {location.adresse}
                      </p>

                      <div className="flex items-center space-x-2 text-xs text-gray-500 pl-9">
                        <Calendar className="h-3 w-3" />
                        <span>Added {formatDate(location.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={() => handleEdit(location)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Edit location"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(location)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Delete location"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Footer - Pro tip */}
      {!loading && (
        <div className="flex-shrink-0 pt-4">
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 text-sm font-bold">💡</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-emerald-800 mb-1">Pro Tip</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Add specific locations to organize reviews by physical store, restaurant branch, or service area.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddLocationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onLocationCreated={loadLocations}
        businessId={businessId}
      />

      <EditLocationModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLocation(null);
        }}
        onLocationUpdated={loadLocations}
        location={selectedLocation}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedLocation(null);
        }}
        onConfirm={handleConfirmDelete}
        locationName={selectedLocation?.name || ''}
        loading={deleteLoading}
      />
    </div>
  );
}