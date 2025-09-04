// frontend/src/components/analytics/UrgencyChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UrgencyData } from '@/types/analytics';

interface UrgencyChartProps {
  data: UrgencyData[];
}

export const UrgencyChart: React.FC<UrgencyChartProps> = ({ data }) => {
  return (
    <Card className="feature-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Urgency Level Distribution
        </CardTitle>
        <CardDescription>Priority levels for customer service response</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};