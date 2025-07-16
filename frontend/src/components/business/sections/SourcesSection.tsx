// src/components/business/sections/SourcesSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { Database, Plus, Edit, Trash2, Calendar, Loader2, AlertCircle, MapPin, FileText, Link2, ExternalLink } from 'lucide-react';
import { Source, sourceService, SourceType } from '@/services/source';
import { Location, locationService } from '@/services/location';
import { AddSourceModal, EditSourceModal, DeleteSourceConfirmationModal } from '../modals/SourceModals';

interface SourcesSectionProps {
  businessId: string;
}

export function SourcesSection({ businessId }: SourcesSectionProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load sources and locations
  const loadSources = async () => {
    try {
      setError('');
      const data = await sourceService.getSourcesByBusiness(businessId);
      setSources(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading sources:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await locationService.getLocationsByBusiness(businessId);
      setLocations(data);
    } catch (err: any) {
      console.error('Error loading locations:', err);
      // Don't show error for locations since they're optional
    } finally {
      setLocationsLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      loadSources();
      loadLocations();
    }
  }, [businessId]);

  const handleEdit = (source: Source) => {
    setSelectedSource(source);
    setShowEditModal(true);
  };

  const handleDelete = (source: Source) => {
    setSelectedSource(source);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSource) return;

    setDeleteLoading(true);
    try {
      await sourceService.deleteSource(selectedSource.id);
      await loadSources(); // Refresh the list
      setShowDeleteModal(false);
      setSelectedSource(null);
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

  const getSourceTypeLabel = (type: SourceType) => {
    switch (type) {
      case 'google':
        return 'Google Maps';
      case 'csv':
        return 'CSV File';
      default:
        return 'Unknown';
    }
  };

  const getSourceTypeColor = (type: SourceType) => {
    switch (type) {
      case 'google':
        return 'from-blue-500 to-indigo-500';
      case 'csv':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const findLocationName = (locationId: string | null | undefined) => {
    if (!locationId) return null;
    return locations.find(loc => loc.id === locationId)?.name || 'Unknown Location';
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Fixed Header */}
      <div className="flex-shrink-0 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">
              {loading ? 'Loading sources...' : `${sources.length} source${sources.length !== 1 ? 's' : ''} configured`}
            </p>
            <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={loading || locationsLoading}
            className="group bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-medium">Add Source</span>
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
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-3 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading sources...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && sources.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-in fade-in duration-700">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-3xl" />
                <Database className="relative h-16 w-16 mx-auto text-purple-500/60 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sources yet</h3>
              <p className="text-gray-600 mb-6">Connect your first review source to start collecting customer feedback</p>
              <button
                onClick={() => setShowAddModal(true)}
                disabled={locationsLoading}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-medium disabled:opacity-50"
              >
                {locationsLoading ? 'Loading...' : 'Add First Source'}
              </button>
            </div>
          </div>
        )}

        {/* Sources List - Scrollable */}
        {!loading && sources.length > 0 && (
          <div
            className="h-full overflow-y-auto space-y-4 scrollable-container"

            tabIndex={0}
            role="region"
            aria-label="Sources list"
          >
            {sources.map((source, index) => {
              const SourceIcon = getSourceIcon(source.type);
              const locationName = findLocationName(source.location_id);

              return (
                <div
                  key={source.id}
                  className="group relative animate-in slide-in-from-left duration-500"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Card background */}
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:bg-white/70 group-hover:shadow-xl transition-all duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 bg-gradient-to-r ${getSourceTypeColor(source.type)} rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                            <SourceIcon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">
                              {source.name}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getSourceTypeColor(source.type)} text-white`}>
                                {getSourceTypeLabel(source.type)}
                              </span>
                              {locationName && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                  📍 {locationName}
                                </span>
                              )}
                              {!locationName && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  🌐 General
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pl-9 space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Link2 className="h-3 w-3" />
                            <span className="truncate" title={source.url}>
                              {truncateUrl(source.url)}
                            </span>
                            <button
                              onClick={() => window.open(source.url, '_blank')}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Open URL"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Added {formatDate(source.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={() => handleEdit(source)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Edit source"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(source)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Delete source"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Footer - Pro tip */}
      {!loading && (
        <div className="flex-shrink-0 pt-4">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 text-sm font-bold">💡</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-purple-800 mb-1">Pro Tip</h4>
                <p className="text-xs text-purple-700 leading-relaxed">
                  Connect Google Maps for automatic review collection, or upload CSV files for bulk import.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddSourceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSourceCreated={loadSources}
        businessId={businessId}
        locations={locations}
      />

      <EditSourceModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSource(null);
        }}
        onSourceUpdated={loadSources}
        source={selectedSource}
        locations={locations}
      />

      <DeleteSourceConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSource(null);
        }}
        onConfirm={handleConfirmDelete}
        sourceName={selectedSource?.name || ''}
        loading={deleteLoading}
      />
    </div>
  );
}