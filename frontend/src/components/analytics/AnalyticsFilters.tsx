// frontend/src/components/analytics/AnalyticsFilters.tsx
import React from 'react';
import { MapPin, Eye, RotateCcw, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { SentimentLabel } from '@/services/review';
import { AnalyticsFilters as FiltersType } from '@/types/analytics';

interface AnalyticsFiltersProps {
  filters: FiltersType;
  setFilters: React.Dispatch<React.SetStateAction<FiltersType>>;
  locations: any[];
  onReset: () => void;
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  setFilters,
  locations,
  onReset
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DatePickerWithRange
        value={filters.dateRange}
        onChange={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
      />
      
      {locations.length > 0 && (
        <Select
          value={filters.locationId || 'all'}
          onValueChange={(value) => setFilters(prev => ({ 
            ...prev, 
            locationId: value === 'all' ? null : value 
          }))}
        >
          <SelectTrigger className="w-40">
            <MapPin className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(location => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      <Select
        value={filters.sentiment}
        onValueChange={(value) => setFilters(prev => ({ 
          ...prev, 
          sentiment: value as SentimentLabel | 'all'
        }))}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Sentiment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="positive">Positive</SelectItem>
          <SelectItem value="negative">Negative</SelectItem>
          <SelectItem value="neutral">Neutral</SelectItem>
        </SelectContent>
      </Select>

      {/* Analysis Status Filter */}
      <Select
        value={filters.hasAnalysis === 'all' ? 'all' : filters.hasAnalysis ? 'analyzed' : 'unanalyzed'}
        onValueChange={(value) => setFilters(prev => ({ 
          ...prev, 
          hasAnalysis: value === 'all' ? 'all' : value === 'analyzed' 
        }))}
      >
        <SelectTrigger className="w-40">
          <Brain className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Analysis Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Reviews</SelectItem>
          <SelectItem value="analyzed">Analyzed Only</SelectItem>
          <SelectItem value="unanalyzed">Unanalyzed Only</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="includeSpam"
          checked={filters.includeSpam}
          onCheckedChange={(checked) => 
            setFilters(prev => ({ ...prev, includeSpam: checked as boolean }))
          }
        />
        <label htmlFor="includeSpam" className="text-sm font-medium">
          Include Spam
        </label>
      </div>

      {locations.length > 1 && (
        <Select
          value={filters.compareLocation || 'none'}
          onValueChange={(value) => setFilters(prev => ({ 
            ...prev, 
            compareLocation: value === 'none' ? null : value 
          }))}
        >
          <SelectTrigger className="w-40">
            <Eye className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Compare" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Comparison</SelectItem>
            {locations
              .filter(loc => loc.id !== filters.locationId)
              .map(location => (
                <SelectItem key={location.id} value={location.id}>
                  Compare {location.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
      
      <Button 
        onClick={onReset} 
        variant="outline" 
        size="sm"
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
    </div>
  );
};