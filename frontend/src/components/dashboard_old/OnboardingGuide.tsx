// src/components/dashboard/OnboardingGuide.tsx
'use client';

import { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Database, 
  Play, 
  CheckCircle, 
  ArrowRight,
  X,
  Plus
} from 'lucide-react';

interface OnboardingGuideProps {
  onCreateBusiness: () => void;
}

export function OnboardingGuide({ onCreateBusiness }: OnboardingGuideProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const steps = [
    {
      number: 1,
      title: 'Create Business',
      description: 'Add your business to start tracking reviews',
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      status: 'pending' as const,
      action: 'Start Here',
    },
    {
      number: 2,
      title: 'Add Location',
      description: 'Specify business locations (optional)',
      icon: MapPin,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
      status: 'upcoming' as const,
    },
    {
      number: 3,
      title: 'Add Source',
      description: 'Connect Google Maps or upload CSV files',
      icon: Database,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      status: 'upcoming' as const,
    },
    {
      number: 4,
      title: 'Start Scraping',
      description: 'Begin collecting and analyzing reviews',
      icon: Play,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
      status: 'upcoming' as const,
    },
  ];

  if (isDismissed) return null;

  return (
    <div className="relative">
      {/* Main onboarding card */}
      <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-xl" />
        
        {/* Dismiss button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all duration-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="relative z-10 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to ReviewsAI!</h2>
              <p className="text-gray-600">Let's get your review analysis up and running</p>
            </div>
          </div>
        </div>

        {/* Steps grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line for larger screens */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 -right-3 w-6 h-0.5 bg-gradient-to-r from-gray-300 to-transparent z-0" />
              )}
              
              <div className={`relative bg-gradient-to-r ${step.bgColor} border-2 ${step.borderColor} rounded-xl p-6 h-full transition-all duration-300 hover:shadow-lg ${
                step.status === 'pending' ? 'ring-2 ring-blue-500/20 shadow-lg scale-105' : ''
              }`}>
                {/* Step number */}
                <div className="flex items-center justify-between mb-4">
<div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
  {step.number}
</div>
                  
                  {step.status === 'pending' && (
                    <div className="flex items-center space-x-1 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span>Current</span>
                    </div>
                  )}
                </div>

                {/* Step content */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <step.icon className={`h-5 w-5 text-transparent bg-clip-text bg-gradient-to-r ${step.color}`} />
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                  
                  {step.action && (
                    <button
                      onClick={onCreateBusiness}
                      className={`mt-3 w-full px-4 py-2 bg-gradient-to-r ${step.color} hover:shadow-lg text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105 active:scale-95`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>{step.action}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom info */}
        <div className="relative z-10 p-6 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">Supported Sources</h4>
              <p className="text-xs text-gray-600">
                📍 <strong>Google Maps:</strong> Automatic review scraping • 📊 <strong>CSV Files:</strong> Upload existing data
              </p>
            </div>
          </div>
        </div>

        {/* Fun fact */}
        <div className="relative z-10 mt-6 text-center">
          <p className="text-xs text-gray-500">
            💡 <strong>Pro tip:</strong> You can create sources without locations for competitor analysis!
          </p>
        </div>
      </div>
    </div>
  );
}