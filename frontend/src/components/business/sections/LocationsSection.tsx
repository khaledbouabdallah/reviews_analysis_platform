// src/components/business/sections/LocationsSection.tsx
'use client';

import { useState } from 'react';
import { MapPin, Plus, Edit, Trash2, Calendar } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
  business_id: string;
  created_at: string;
}

interface LocationsSectionProps {
  businessId: string;
  locations: Location[];
  onUpdate: () => void;
}

export function LocationsSection({ businessId, locations, onUpdate }: LocationsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">
            {locations.length} location{locations.length !== 1 ? 's' : ''} configured
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="group bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-medium">Add Location</span>
        </button>
      </div>

      {/* Content */}
      {locations.length === 0 ? (
        <div className="text-center py-12 animate-in fade-in duration-700">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-3xl" />
            <MapPin className="relative h-16 w-16 mx-auto text-emerald-500/60 animate-pulse" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
          <p className="text-gray-600 mb-6">Add your first location to start organizing your review sources</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-medium"
          >
            Add First Location
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {locations.slice(0, 3).map((location, index) => (
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
                      {location.address}
                    </p>

                    <div className="flex items-center space-x-2 text-xs text-gray-500 pl-9">
                      <Calendar className="h-3 w-3" />
                      <span>Added {formatDate(location.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 hover:scale-110">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

          ))}

          {locations.length > 3 && (
            <button className="w-full text-center py-4 text-emerald-600 hover:text-emerald-800 transition-colors font-medium hover:bg-white/30 rounded-xl">
              View all {locations.length} locations →
            </button>
          )}
        </div>
      )}

      {/* Quick tip */}
      <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl animate-in fade-in duration-700" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-600 text-sm font-bold">💡</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-emerald-800 mb-1">Pro Tip</h4>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Add specific locations to organize reviews by physical store, restaurant branch, or service area. This helps you track performance across different venues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
