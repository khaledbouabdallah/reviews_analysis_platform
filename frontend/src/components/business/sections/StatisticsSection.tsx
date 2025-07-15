// src/components/business/sections/StatisticsSection.tsx
'use client';

import { TrendingUp, Star, BarChart } from 'lucide-react';

interface StatisticsSectionProps {
  businessId: string;
}

export function StatisticsSection({ businessId }: StatisticsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600">Business insights and analytics</p>
        <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group relative animate-in slide-in-from-left duration-500">
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:bg-white/70 transition-all duration-300" />
          <div className="relative p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">Review Sentiment</h4>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">Positive</span>
                <span className="font-bold">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="w-[68%] h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out" />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-yellow-600 font-medium">Neutral</span>
                <span className="font-bold">22%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="w-[22%] h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-1000 ease-out" style={{ animationDelay: '0.2s' }} />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-red-600 font-medium">Negative</span>
                <span className="font-bold">10%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="w-[10%] h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-1000 ease-out" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="group relative animate-in slide-in-from-right duration-500" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:bg-white/70 transition-all duration-300" />
          <div className="relative p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <BarChart className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">Monthly Trend</h4>
            </div>

            <div className="flex items-end space-x-2 h-20 mb-4">
              {[40, 65, 45, 80, 68, 75, 82].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg opacity-80 hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600 text-center">Last 7 months</p>
          </div>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Avg Rating', value: '4.2', icon: Star, color: 'from-yellow-500 to-orange-500' },
          { label: 'Total Reviews', value: '247', icon: BarChart, color: 'from-blue-500 to-indigo-500' },
          { label: 'This Month', value: '+12%', icon: TrendingUp, color: 'from-green-500 to-emerald-500' }
        ].map((metric, index) => (
          <div
            key={metric.label}
            className="group relative text-center animate-in slide-in-from-bottom duration-500"
            style={{ animationDelay: `${0.4 + index * 0.1}s` }}
          >
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:bg-white/70 group-hover:shadow-lg transition-all duration-300" />
            <div className="relative p-4">
              <div className="flex justify-center mb-2">
                <div className={`p-2 bg-gradient-to-r ${metric.color} rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                  <metric.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">
                {metric.value}
              </p>
              <p className="text-sm text-gray-600">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
