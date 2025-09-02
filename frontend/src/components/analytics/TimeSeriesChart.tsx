// frontend/src/components/analytics/TimeSeriesChart.tsx
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimeSeriesData } from '@/types/analytics';

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  grouping: 'day' | 'week' | 'month';
}

type MetricType = 'sentiment' | 'ratings' | 'volume';

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, grouping }) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('sentiment');

  const getChartTitle = () => {
    switch (activeMetric) {
      case 'sentiment': return 'Sentiment Trends Over Time';
      case 'ratings': return 'Average Ratings Over Time';
      case 'volume': return 'Review Volume Over Time';
    }
  };

  const getChartDescription = () => {
    const frequency = grouping === 'day' ? 'Daily' : grouping === 'week' ? 'Weekly' : 'Monthly';
    switch (activeMetric) {
      case 'sentiment': return `${frequency} sentiment breakdown of reviews`;
      case 'ratings': return `${frequency} average ratings trend`;
      case 'volume': return `${frequency} review volume trends`;
    }
  };

  const renderSentimentChart = () => (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="displayDate" 
        tick={{ fontSize: 12 }}
        angle={grouping === 'day' ? -45 : 0}
        textAnchor={grouping === 'day' ? 'end' : 'middle'}
        height={grouping === 'day' ? 80 : 60}
      />
      <YAxis />
      <Tooltip 
        labelFormatter={(value) => `Period: ${value}`}
        formatter={(value: number, name: string) => [value, name]}
      />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="total" 
        stroke="#3b82f6" 
        strokeWidth={2}
        name="Total Reviews"
        dot={{ r: 4 }}
      />
      <Line 
        type="monotone" 
        dataKey="positive" 
        stroke="#22c55e" 
        strokeWidth={2}
        name="Positive"
        dot={{ r: 3 }}
      />
      <Line 
        type="monotone" 
        dataKey="negative" 
        stroke="#ef4444" 
        strokeWidth={2}
        name="Negative"
        dot={{ r: 3 }}
      />
      <Line 
        type="monotone" 
        dataKey="neutral" 
        stroke="#6b7280" 
        strokeWidth={2}
        name="Neutral"
        dot={{ r: 3 }}
      />
    </LineChart>
  );

  const renderRatingsChart = () => (
    <LineChart data={data.filter(d => d.avgRating > 0)}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="displayDate" 
        tick={{ fontSize: 12 }}
        angle={grouping === 'day' ? -45 : 0}
        textAnchor={grouping === 'day' ? 'end' : 'middle'}
        height={grouping === 'day' ? 80 : 60}
      />
      <YAxis 
        domain={[1, 5]} 
        tickCount={5}
      />
      <Tooltip 
        labelFormatter={(value) => `Period: ${value}`}
        formatter={(value: number, name: string) => {
          if (name === 'Average Rating') return [`★ ${value}`, name];
          return [value, name];
        }}
      />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="avgRating" 
        stroke="#f59e0b" 
        strokeWidth={3}
        name="Average Rating"
        dot={{ r: 5, fill: "#f59e0b" }}
      />
      <Line 
        type="monotone" 
        dataKey="ratingCount" 
        stroke="#8b5cf6" 
        strokeWidth={2}
        name="Reviews with Ratings"
        dot={{ r: 3 }}
        yAxisId="right"
      />
    </LineChart>
  );

  const renderVolumeChart = () => (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="displayDate" 
        tick={{ fontSize: 12 }}
        angle={grouping === 'day' ? -45 : 0}
        textAnchor={grouping === 'day' ? 'end' : 'middle'}
        height={grouping === 'day' ? 80 : 60}
      />
      <YAxis />
      <Tooltip 
        labelFormatter={(value) => `Period: ${value}`}
        formatter={(value: number) => [value, 'Reviews']}
      />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="total" 
        stroke="#3b82f6" 
        strokeWidth={3}
        name="Total Reviews"
        dot={{ r: 5 }}
        fill="url(#colorGradient)"
      />
      <defs>
        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
        </linearGradient>
      </defs>
    </LineChart>
  );

  const renderChart = () => {
    switch (activeMetric) {
      case 'sentiment': return renderSentimentChart();
      case 'ratings': return renderRatingsChart();
      case 'volume': return renderVolumeChart();
    }
  };

  return (
    <Card className="feature-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {getChartTitle()}
            </CardTitle>
            <CardDescription>{getChartDescription()}</CardDescription>
          </div>
          
          {/* Metric Selector */}
          <div className="flex gap-2">
            <Button
              variant={activeMetric === 'sentiment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMetric('sentiment')}
              className="text-xs"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Sentiment
            </Button>
            <Button
              variant={activeMetric === 'ratings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMetric('ratings')}
              className="text-xs"
            >
              <Star className="h-3 w-3 mr-1" />
              Ratings
            </Button>
            <Button
              variant={activeMetric === 'volume' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveMetric('volume')}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Volume
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {/* Data Summary */}
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>
              Showing {data.length} {grouping === 'day' ? 'days' : grouping === 'week' ? 'weeks' : 'months'}
            </span>
            <span>
              Total Reviews: {data.reduce((sum, d) => sum + d.total, 0)}
            </span>
            {activeMetric === 'ratings' && (
              <span>
                Avg Rating: ★ {(data.reduce((sum, d) => sum + (d.avgRating * d.ratingCount), 0) / 
                  data.reduce((sum, d) => sum + d.ratingCount, 0) || 0).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};