// frontend/src/components/analytics/TimeSeriesChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeSeriesData } from '@/types/analytics';

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data }) => {
  return (
    <Card className="feature-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Review Trends Over Time
        </CardTitle>
        <CardDescription>Daily review volume with sentiment breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Total Reviews"
              />
              <Line 
                type="monotone" 
                dataKey="positive" 
                stroke="#22c55e" 
                name="Positive"
              />
              <Line 
                type="monotone" 
                dataKey="negative" 
                stroke="#ef4444" 
                name="Negative"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};