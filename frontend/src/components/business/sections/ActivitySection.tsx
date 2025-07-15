// src/components/business/sections/ActivitySection.tsx
'use client';

import { CheckCircle, Activity, AlertCircle, Clock, Calendar } from 'lucide-react';

interface ActivitySectionProps {
  businessId: string;
}

export function ActivitySection({ businessId }: ActivitySectionProps) {
  const activities = [
    {
      id: 1,
      action: 'Scraping completed',
      details: '23 new reviews from Google Maps',
      time: '2 hours ago',
      type: 'success'
    },
    {
      id: 2,
      action: 'Sentiment analysis started',
      details: 'Processing 247 reviews',
      time: '4 hours ago',
      type: 'info'
    },
    {
      id: 3,
      action: 'New source added',
      details: 'TripAdvisor reviews connected',
      time: '1 day ago',
      type: 'info'
    },
    {
      id: 4,
      action: 'Analysis complete',
      details: 'Segmentation finished',
      time: '2 days ago',
      type: 'success'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'info': return Activity;
      case 'warning': return AlertCircle;
      default: return Clock;
    }
  };

  const getActivityColors = (type: string) => {
    switch (type) {
      case 'success': return { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' };
      case 'info': return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' };
      case 'warning': return { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600">Recent business activity</p>
        <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const IconComponent = getActivityIcon(activity.type);
          const colors = getActivityColors(activity.type);

          return (
            <div
              key={activity.id}
              className="group relative animate-in slide-in-from-left duration-500"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:bg-white/70 group-hover:shadow-lg transition-all duration-300" />

              <div className="relative flex items-start space-x-4 p-4">
                <div className={`p-2 ${colors.bg} ${colors.border} border rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`h-4 w-4 ${colors.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors duration-300">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{activity.details}</p>

                  <div className="flex items-center space-x-2 mt-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full text-center py-4 text-indigo-600 hover:text-indigo-800 transition-all duration-300 font-medium hover:bg-white/30 rounded-xl group">
        <span className="group-hover:translate-x-1 transition-transform duration-300 inline-block">
          View All Activity →
        </span>
      </button>
    </div>
  );
}
