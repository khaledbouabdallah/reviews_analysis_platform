// src/components/dashboard/RecentActivity.tsx
'use client';

import {
  Building2,
  CheckCircle,
  Database,
  Play,
  Clock,
  MessageSquare
} from 'lucide-react';
import { Activity } from '@/services/dashboard';

interface RecentActivityProps {
  activities: Activity[];
  loading?: boolean;
}

export function RecentActivity({ activities, loading = false }: RecentActivityProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'business_created':
        return Building2;
      case 'job_completed':
        return CheckCircle;
      case 'source_added':
        return Database;
      case 'scraping_started':
        return Play;
      default:
        return MessageSquare;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'business_created':
        return {
          bg: 'bg-blue-100/80',
          text: 'text-blue-600',
          gradient: 'from-blue-500 to-indigo-500'
        };
      case 'job_completed':
        return {
          bg: 'bg-green-100/80',
          text: 'text-green-600',
          gradient: 'from-green-500 to-emerald-500'
        };
      case 'source_added':
        return {
          bg: 'bg-purple-100/80',
          text: 'text-purple-600',
          gradient: 'from-purple-500 to-pink-500'
        };
      case 'scraping_started':
        return {
          bg: 'bg-orange-100/80',
          text: 'text-orange-600',
          gradient: 'from-orange-500 to-red-500'
        };
      default:
        return {
          bg: 'bg-gray-100/80',
          text: 'text-gray-600',
          gradient: 'from-gray-500 to-gray-600'
        };
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/40">
          <div className="relative">
            <Clock className="h-4 w-4" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span>Live</span>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gray-500/10 rounded-full blur-2xl" />
            <div className="relative w-16 h-16 bg-gray-100/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto border border-white/40">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <p className="text-gray-600">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const IconComponent = getActivityIcon(activity.type);
            const colors = getActivityColor(activity.type);

            return (
              <div
                key={activity.id}
                className="group relative animate-in slide-in-from-left duration-500"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Glassmorphic background */}
                <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:bg-white/50 group-hover:shadow-lg transition-all duration-300" />

                <div className="relative flex items-start space-x-4 p-4">
                  <div className="relative">
                    {/* Icon background blur effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300`} />
                    <div className={`relative p-2 ${colors.bg} backdrop-blur-sm border border-white/40 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-5 w-5 ${colors.text}`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-300 mb-1">
                      {activity.message}
                      {activity.businessName && (
                        <span className="font-semibold text-blue-600 ml-1 bg-blue-50/80 px-2 py-0.5 rounded-lg">
                          {activity.businessName}
                        </span>
                      )}
                    </p>

                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/20">
          <button className="w-full text-center py-3 text-blue-600 hover:text-blue-800 transition-all duration-300 font-medium hover:bg-white/30 rounded-xl group">
            <span className="group-hover:translate-x-1 transition-transform duration-300 inline-block">
              View all activity →
            </span>
          </button>
        </div>
      )}
    </div>
  );
}