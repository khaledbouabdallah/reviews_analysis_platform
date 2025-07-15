// src/components/business/sections/SourcesSection.tsx
'use client';

import { useState } from 'react';
import { Database, Plus, Edit, Trash2 } from 'lucide-react';

interface Source {
  id: string;
  name: string;
  type: string;
  business_id: string;
  location_id?: string;
  created_at: string;
}

interface SourcesSectionProps {
  businessId: string;
  sources: Source[];
  locations: any[];
  onUpdate: () => void;
}

export function SourcesSection({ businessId, sources, locations, onUpdate }: SourcesSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">
            {sources.length} source{sources.length !== 1 ? 's' : ''} configured
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
        </div>
        
        <button className="group bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2">
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-medium">Add Source</span>
        </button>
      </div>
      
      {sources.length === 0 ? (
        <div className="text-center py-12 animate-in fade-in duration-700">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl" />
            <Database className="relative h-16 w-16 mx-auto text-blue-500/60 animate-pulse" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sources configured</h3>
          <p className="text-gray-600 mb-6">Connect Google Maps or upload CSV files to start collecting reviews</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sources.slice(0, 3).map((source, index) => (
            <div 
              key={source.id} 
              className="group relative animate-in slide-in-from-left duration-500"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:bg-white/70 group-hover:shadow-xl transition-all duration-300" />
              
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <Database className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                        {source.name}
                      </h4>
                      <p className="text-sm text-gray-600 capitalize">{source.type}</p>
                      {source.location_id && (
                        <p className="text-xs text-gray-500">
                          📍 {locations.find(l => l.id === source.location_id)?.name || 'Unknown location'}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110">
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
        </div>
      )}
    </div>
  );
}