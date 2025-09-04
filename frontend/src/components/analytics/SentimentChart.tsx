// frontend/src/components/analytics/SentimentChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcessedAnalyticsData } from '@/types/analytics';

interface SentimentChartProps {
  mainData: ProcessedAnalyticsData | null;
  comparisonData: ProcessedAnalyticsData | null;
}

export const SentimentChart: React.FC<SentimentChartProps> = ({
  mainData,
  comparisonData
}) => {
  if (!mainData) return null;

  return (
    <Card className="feature-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Sentiment Distribution
        </CardTitle>
        <CardDescription>Overall sentiment breakdown of reviews</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mainData.sentimentData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value, percent }) => 
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {mainData.sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {comparisonData && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Comparison Data:</h4>
            <div className="flex gap-4 text-sm">
              {comparisonData.sentimentData.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};