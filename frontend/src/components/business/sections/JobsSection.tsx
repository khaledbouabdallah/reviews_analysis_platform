// src/components/business/sections/JobsSection.tsx
'use client';

import { Play, CheckCircle, AlertCircle, Clock, Loader2, X, Plus } from 'lucide-react';

interface Job {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  url: string;
  source_id: string;
  total_reviews?: number;
  reviews_scraped?: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

interface JobsSectionProps {
  businessId: string;
  jobs: Job[];
  sources: any[];
  onUpdate: () => void;
}

export function JobsSection({ businessId, jobs, sources, onUpdate }: JobsSectionProps) {
  const runningJobs = jobs.filter(job => job.status === 'running');
  const recentJobs = jobs.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'from-blue-500 to-cyan-500';
      case 'completed': return 'from-green-500 to-emerald-500';
      case 'failed': return 'from-red-500 to-pink-500';
      case 'cancelled': return 'from-gray-500 to-slate-500';
      default: return 'from-yellow-500 to-orange-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">
            {runningJobs.length} running • {jobs.length} total jobs
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
        </div>
        
        <button className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2">
          <Play className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
          <span className="font-medium">Start Job</span>
        </button>
      </div>
      
      {jobs.length === 0 ? (
        <div className="text-center py-12 animate-in fade-in duration-700">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-3xl" />
            <Play className="relative h-16 w-16 mx-auto text-purple-500/60 animate-pulse" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scraping jobs yet</h3>
          <p className="text-gray-600 mb-6">Start your first job to begin collecting reviews</p>
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-medium">
            Create First Job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recentJobs.map((job, index) => {
            const progress = job.total_reviews ? (job.reviews_scraped || 0) / job.total_reviews * 100 : 0;
            
            return (
              <div 
                key={job.id} 
                className="group relative animate-in slide-in-from-left duration-500"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:bg-white/70 group-hover:shadow-xl transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">
                        {job.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {sources.find(s => s.id === job.source_id)?.name || 'Unknown source'}
                      </p>
                    </div>
                    
                    <div className={`px-3 py-1 bg-gradient-to-r ${getStatusColor(job.status)} text-white rounded-full flex items-center space-x-2 group-hover:scale-105 transition-transform duration-300`}>
                      {getStatusIcon(job.status)}
                      <span className="text-sm font-medium capitalize">{job.status}</span>
                    </div>
                  </div>
                  
                  {job.status === 'running' && job.total_reviews && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{job.reviews_scraped || 0} / {job.total_reviews} reviews</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {job.status === 'completed' && (
                    <p className="text-sm text-green-600 font-medium">
                      ✅ {job.reviews_scraped || 0} reviews collected
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick actions tip */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl animate-in fade-in duration-700" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-purple-600 text-sm font-bold">⚡</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-purple-800 mb-1">Quick Actions</h4>
            <p className="text-xs text-purple-700 leading-relaxed">
              Schedule regular jobs to stay updated with new reviews, or run one-time jobs for competitive analysis and market research.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}