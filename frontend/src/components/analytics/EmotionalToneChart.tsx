// frontend/src/components/analytics/EmotionalToneChart.tsx
import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmotionalToneData } from '@/types/analytics';

interface EmotionalToneChartProps {
  data: EmotionalToneData[];
}

export const EmotionalToneChart: React.FC<EmotionalToneChartProps> = ({ data }) => {
  return (
    <Card className="feature-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Emotional Tone Analysis
        </CardTitle>
        <CardDescription>Distribution of emotional tones detected in reviews</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="tone" />
              <PolarRadiusAxis />
              <Radar 
                name="Emotional Tone" 
                dataKey="count" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3} 
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};