// src/components/dashboard/QuickActions.tsx
'use client';

import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Play, 
  MessageSquare, 
  BarChart3, 
  ArrowRight,
  Zap
} from 'lucide-react';

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      id: 'add-business',
      title: 'Add New Business',
      description: 'Create a new business to track',
      icon: Plus,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      onClick: () => {
        // TODO: Open add business modal or navigate to form
        console.log('Add new business');
      },
    },
    {
      id: 'start-scraping',
      title: 'Start Scraping Job',
      description: 'Collect new reviews',
      icon: Play,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      onClick: () => {
        // TODO: Navigate to job creation or open modal
        console.log('Start scraping job');
      },
    },
    {
      id: 'view-reviews',
      title: 'View All Reviews',
      description: 'Browse collected reviews',
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      onClick: () => {
        router.push('/reviews');
      },
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Analyze review data',
      icon: BarChart3,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700',
      onClick: () => {
        // TODO: Navigate to analytics page
        console.log('View analytics');
      },
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Zap className="h-4 w-4" />
          <span>Fast</span>
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`w-full p-4 rounded-xl border ${action.borderColor} bg-gradient-to-r ${action.bgColor} hover:shadow-md transition-all duration-200 group`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        ))}
      </div>

      {/* Pro Tip */}
      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-yellow-600 text-sm font-bold">💡</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-yellow-800 mb-1">Pro Tip</h4>
            <p className="text-xs text-yellow-700">
              Set up regular scraping jobs to automatically collect new reviews and track competitor performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}