// src/components/dashboard/SystemStatus.tsx
'use client';

import { 
  CheckCircle, 
  Clock, 
  Activity, 
  AlertCircle,
  Server
} from 'lucide-react';
import { SystemStatus as SystemStatusType } from '@/services/dashboard';

interface SystemStatusProps {
  status: SystemStatusType;
  loading?: boolean;
}

export function SystemStatus({ status, loading = false }: SystemStatusProps) {
  const formatLastScrapingTime = (timestamp?: string) => {
    if (!timestamp) return 'No recent jobs';
    
    const now = new Date();
    const scrapingTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - scrapingTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just completed';
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

  const getStatusInfo = (status: SystemStatusType['status']) => {
    switch (status) {
      case 'operational':
        return {
          icon: CheckCircle,
          text: 'All systems operational',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          dotColor: 'bg-green-500',
        };
      case 'maintenance':
        return {
          icon: Clock,
          text: 'Scheduled maintenance',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          dotColor: 'bg-yellow-500',
        };
      case 'issues':
        return {
          icon: AlertCircle,
          text: 'Some issues detected',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          dotColor: 'bg-red-500',
        };
      default:
        return {
          icon: CheckCircle,
          text: 'System status unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          dotColor: 'bg-gray-500',
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
          <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(status.status);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor} animate-pulse`}></div>
          <span className="text-sm text-gray-500">Live</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
              <statusInfo.icon className={`h-4 w-4 ${statusInfo.color}`} />
            </div>
            <span className="font-medium text-gray-900">System Health</span>
          </div>
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>

        {/* Last Scraping Job */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-gray-600">
            <Activity className="h-4 w-4" />
            <span className="text-sm">Last scraping job</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {formatLastScrapingTime(status.lastScrapingJob)}
          </span>
        </div>

        {/* Jobs Completed Today */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-gray-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Jobs completed today</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {status.jobsCompletedToday}
          </span>
        </div>

        {/* System Resources */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-gray-600">
            <Server className="h-4 w-4" />
            <span className="text-sm">Scraper capacity</span>
          </div>
          <span className="text-sm font-medium text-green-600">
            Available
          </span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <div className="text-xs text-gray-500">Uptime</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">2.3s</div>
            <div className="text-xs text-gray-500">Avg Response</div>
          </div>
        </div>
      </div>

      {status.status !== 'operational' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            {status.status === 'maintenance' 
              ? 'Scheduled maintenance in progress. Some features may be temporarily unavailable.'
              : 'We are experiencing some issues and working to resolve them quickly.'
            }
          </p>
        </div>
      )}
    </div>
  );
}