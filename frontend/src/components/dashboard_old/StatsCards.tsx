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
      bgColor: 'from-blue-500/10 to-blue-600/10',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Total Locations',
      value: stats.totalLocations,
      icon: MapPin,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-500/10 to-teal-500/10',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Total Reviews',
      value: stats.totalReviews,
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10',
      change: '+23%',
      changeType: 'positive' as const,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative group animate-pulse">
            {/* Card background */}
            <div className="absolute inset-0 bg-white/50 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg" />
            <div className="relative p-6">
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="group relative animate-in slide-in-from-bottom duration-500"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Glassmorphic background with enhanced effects */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl group-hover:shadow-2xl transition-all duration-500" />
          <div className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />

          <div className="relative p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${card.color} rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
                <div className={`relative p-3 bg-gradient-to-r ${card.color} rounded-xl group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${card.changeType === 'positive'
                  ? 'bg-green-100/80 text-green-700 group-hover:bg-green-200/80'
                  : 'bg-red-100/80 text-red-700 group-hover:bg-red-200/80'
                }`}>
                <TrendingUp className="h-3 w-3" />
                <span>{card.change}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300 origin-left">
                {card.value.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                {card.title}
              </div>
            </div>

            {/* Animated progress bar */}
            <div className="mt-4 w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${card.color} rounded-full transition-all duration-1000 ease-out`}
                style={{
                  width: `${Math.min(100, (card.value / Math.max(...cards.map(c => c.value))) * 100)}%`,
                  animationDelay: `${0.5 + index * 0.2}s`
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}