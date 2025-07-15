// src/components/business/BusinessHeader.tsx
'use client';

import { useState } from 'react';
import { Edit, MapPin, Database, Play } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  description?: string;
  segments?: string[];
  created_at: string;
  updated_at?: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  business_id: string;
  created_at: string;
}

interface Source {
  id: string;
  name: string;
  type: string;
  business_id: string;
  location_id?: string;
  created_at: string;
}

interface Job {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

interface BusinessHeaderProps {
  business: Business;
  locations: Location[];
  sources: Source[];
  jobs: Job[];
  onBusinessUpdate: () => void;
}

export function BusinessHeader({
  business,
  locations,
  sources,
  jobs,
  onBusinessUpdate
}: BusinessHeaderProps) {
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [businessForm, setBusinessForm] = useState({
    name: business.name,
    description: business.description || ''
  });

  const handleBusinessUpdate = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(businessForm),
      });

      if (!response.ok) throw new Error('Failed to update business');

      setEditingBusiness(false);
      onBusinessUpdate();
    } catch (err: any) {
      console.error('Error updating business:', err);
    }
  };

  const stats = [
    {
      title: 'Locations',
      value: locations.length,
      icon: MapPin,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-500/10 to-teal-500/10'
    },
    {
      title: 'Sources',
      value: sources.length,
      icon: Database,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10'
    },
    {
      title: 'Active Jobs',
      value: jobs.filter(job => job.status === 'running').length,
      icon: Play,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10'
    }
  ];

  return (
    <div className="relative mb-8 group">
      {/* Glassmorphic background with enhanced effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/60 to-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl transform group-hover:scale-[1.01] transition-all duration-700" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl opacity-60" />

      <div className="relative p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            {editingBusiness ? (
              <div className="space-y-6 animate-in slide-in-from-left duration-500">
                <div className="relative">
                  <input
                    type="text"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                    className="text-4xl font-bold bg-transparent border-b-2 border-gradient-to-r from-blue-500 to-purple-500 focus:outline-none focus:border-purple-600 transition-all duration-300 text-gray-900 w-full"
                    placeholder="Business name..."
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 focus-within:w-full" />
                </div>

                <div className="relative">
                  <textarea
                    value={businessForm.description}
                    onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                    placeholder="Business description..."
                    className="w-full bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl p-6 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 resize-none text-gray-700 placeholder-gray-500"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleBusinessUpdate}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl font-semibold"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditingBusiness(false);
                      setBusinessForm({ name: business.name, description: business.description || '' });
                    }}
                    className="bg-white/50 hover:bg-white/70 text-gray-800 px-8 py-3 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/30 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-6 group/header">
                  <div className="relative">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent group-hover/header:from-blue-600 group-hover/header:to-purple-600 transition-all duration-500">
                      {business.name}
                    </h1>
                    <div className="absolute -bottom-2 left-0 w-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 group-hover/header:w-full transition-all duration-700 rounded-full" />
                  </div>

                  <button
                    onClick={() => setEditingBusiness(true)}
                    className="group/edit p-3 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-transparent hover:border-white/30"
                  >
                    <Edit className="h-5 w-5 group-hover/edit:rotate-12 transition-transform duration-300" />
                  </button>
                </div>

                {business.description && (
                  <p className="text-gray-700 text-lg leading-relaxed max-w-3xl animate-in fade-in duration-700" style={{ animationDelay: '0.2s' }}>
                    {business.description}
                  </p>
                )}

                {business.segments && business.segments.length > 0 && (
                  <div className="flex flex-wrap gap-3 animate-in fade-in duration-700" style={{ animationDelay: '0.4s' }}>
                    {business.segments.map((segment: string, index: number) => (
                      <span
                        key={segment}
                        className="px-4 py-2 bg-gradient-to-r from-blue-100/80 to-purple-100/80 text-blue-800 rounded-full text-sm font-medium backdrop-blur-sm border border-blue-200/50 hover:scale-105 transition-all duration-300 animate-in slide-in-from-bottom"
                        style={{ animationDelay: `${0.1 * index}s` }}
                      >
                        {segment}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Animated Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className="group/stat relative animate-in slide-in-from-bottom duration-700"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              {/* Card background with glassmorphism */}
              <div className="absolute inset-0 bg-white/30 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg group-hover/stat:shadow-2xl transition-all duration-500" />
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} rounded-2xl opacity-0 group-hover/stat:opacity-100 transition-all duration-500`} />

              <div className="relative p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 group-hover/stat:text-gray-700 transition-colors">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 group-hover/stat:scale-110 transition-transform duration-300 origin-left">
                      {stat.value}
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl bg-gradient-to-r ${stat.color} group-hover/stat:scale-110 group-hover/stat:rotate-12 transition-all duration-500 shadow-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Animated progress bar */}
                <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{
                      width: `${Math.min(100, (stat.value / 10) * 100)}%`,
                      animationDelay: `${0.5 + index * 0.2}s`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
