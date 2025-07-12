// src/components/dashboard/StatsCards.tsx
'use client';

import { Building2, MapPin, MessageSquare, TrendingUp } from 'lucide-react';
import { DashboardStats } from '@/services/dashboard';

interface StatsCardsProps {
  stats: DashboardStats;
  loading?: boolean;
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Businesses',
      value: stats.totalBusinesses,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Total Locations',
      value: stats.totalLocations,
      icon: MapPin,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Total Reviews',
      value: stats.totalReviews,
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      change: '+23%',
      changeType: 'positive' as const,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${card.bgColor}`}>
              <card.icon className={`h-6 w-6 text-transparent bg-clip-text bg-gradient-to-r ${card.color}`} />
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              card.changeType === 'positive' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <TrendingUp className="h-3 w-3" />
              <span>{card.change}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900">
              {card.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              {card.title}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}