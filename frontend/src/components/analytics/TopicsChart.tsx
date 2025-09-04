// frontend/src/components/analytics/TopicsChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TopicData } from '@/types/analytics';

interface TopicsChartProps {
  data: TopicData[];
}

export const TopicsChart: React.FC<TopicsChartProps> = ({ data }) => {
  // Debug: Log the data to see what we're getting
  console.log('Topics Chart Data:', data);

  if (!data || data.length === 0) {
    return (
      <Card className="feature-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Top Discussion Topics
          </CardTitle>
          <CardDescription>Most frequently mentioned topics in reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No topics data available</p>
              <p className="text-xs">Topics appear after AI analysis is complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="feature-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Top Discussion Topics
        </CardTitle>
        <CardDescription>Most frequently mentioned topics in reviews ({data.length} topics found)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="topic" 
                type="category" 
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [value, 'Mentions']}
                labelFormatter={(topic) => `Topic: ${topic}`}
              />
              <Bar 
                dataKey="count" 
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Topic Details */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Total topics identified: {data.length} • 
            Total mentions: {data.reduce((sum, topic) => sum + topic.count, 0)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};