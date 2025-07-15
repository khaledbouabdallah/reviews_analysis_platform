// src/components/business/sections/AnalysisSection.tsx
'use client';

import { TrendingUp, BarChart3, MessageSquare, Brain } from 'lucide-react';

interface AnalysisSectionProps {
  businessId: string;
}

export function AnalysisSection({ businessId }: AnalysisSectionProps) {
  const analysisOptions = [
    {
      id: 'sentiment',
      title: 'Sentiment Analysis',
      description: 'Analyze positive/negative sentiment',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'segmentation',
      title: 'Review Segmentation',
      description: 'Classify reviews by business segments',
      icon: BarChart3,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'summary',
      title: 'AI Summary',
      description: 'Generate review summaries',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'chatbot',
      title: 'AI Chatbot',
      description: 'Chat with your reviews data',
      icon: Brain,
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600">AI-powered review analysis tools</p>
        <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysisOptions.map((option, index) => (
          <button
            key={option.id}
            className={`group relative p-6 bg-gradient-to-r ${option.color} hover:shadow-xl text-white rounded-2xl transition-all duration-500 transform hover:scale-105 text-left animate-in slide-in-from-bottom`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center space-x-4 mb-3">
              <option.icon className="h-8 w-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
              <h4 className="font-bold text-lg">{option.title}</h4>
            </div>
            <p className="text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-300">
              {option.description}
            </p>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        ))}
      </div>

      {/* Pro tip section */}
      <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl animate-in fade-in duration-700" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-start space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-lg" />
            <Brain className="relative h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-amber-800 mb-2">AI Analysis Pro Tips</h4>
            <p className="text-sm text-amber-700 leading-relaxed">
              🎯 Run sentiment analysis first, then segmentation for best results<br/>
              📊 AI summary works great after both analyses are complete<br/>
              💬 Use the chatbot to ask specific questions about your data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
