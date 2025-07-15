// src/components/business/DashboardSections.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Database, 
  Play, 
  Brain, 
  BarChart3, 
  Activity,
  ChevronDown,
  ChevronUp,
  GripVertical
} from 'lucide-react';
import { LocationsSection } from './sections/LocationsSection';
import { SourcesSection } from './sections/SourcesSection';
import { JobsSection } from './sections/JobsSection';
import { AnalysisSection } from './sections/AnalysisSection';
import { StatisticsSection } from './sections/StatisticsSection';
import { ActivitySection } from './sections/ActivitySection';

interface DashboardSection {
  id: string;
  title: string;
  icon: 'MapPin' | 'Database' | 'Play' | 'Brain' | 'BarChart3' | 'Activity';
  component: string;
  collapsed: boolean;
  order: number;
}

const defaultSections: DashboardSection[] = [
  { id: 'locations', title: 'Locations', icon: 'MapPin', component: 'LocationsSection', collapsed: false, order: 0 },
  { id: 'sources', title: 'Sources', icon: 'Database', component: 'SourcesSection', collapsed: false, order: 1 },
  { id: 'jobs', title: 'Jobs & Scraping', icon: 'Play', component: 'JobsSection', collapsed: false, order: 2 },
  { id: 'analysis', title: 'Analysis Center', icon: 'Brain', component: 'AnalysisSection', collapsed: false, order: 3 },
  { id: 'statistics', title: 'Statistics', icon: 'BarChart3', component: 'StatisticsSection', collapsed: true, order: 4 },
  { id: 'activity', title: 'Recent Activity', icon: 'Activity', component: 'ActivitySection', collapsed: true, order: 5 }
];

interface DashboardSectionsProps {
  businessId: string;
  locations: any[];
  sources: any[];
  jobs: any[];
  onDataUpdate: () => void;
}

// Icon mapping - using the bulletproof solution
const iconMap = {
  'MapPin': MapPin,
  'Database': Database,
  'Play': Play,
  'Brain': Brain,
  'BarChart3': BarChart3,
  'Activity': Activity
} as const;

export function DashboardSections({ 
  businessId, 
  locations, 
  sources, 
  jobs, 
  onDataUpdate 
}: DashboardSectionsProps) {
  const [sections, setSections] = useState<DashboardSection[]>(defaultSections);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  // Load dashboard preferences from localStorage
  useEffect(() => {
    const savedSections = localStorage.getItem(`business-dashboard-${businessId}`);
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections);
        setSections(parsed.sort((a: DashboardSection, b: DashboardSection) => a.order - b.order));
      } catch (e) {
        console.warn('Failed to parse saved dashboard layout');
      }
    }
  }, [businessId]);

  // Save dashboard preferences to localStorage
  const saveDashboardPreferences = (newSections: DashboardSection[]) => {
    localStorage.setItem(`business-dashboard-${businessId}`, JSON.stringify(newSections));
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', sectionId);
  };

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedSection(null);
    setDragOverSection(null);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(sectionId);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    
    if (!draggedSection || draggedSection === targetSectionId) {
      setDragOverSection(null);
      return;
    }

    const newSections = [...sections];
    const draggedIndex = newSections.findIndex(s => s.id === draggedSection);
    const targetIndex = newSections.findIndex(s => s.id === targetSectionId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged section and insert at target position
    const [draggedItem] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedItem);

    // Update order property
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index
    }));

    setSections(updatedSections);
    saveDashboardPreferences(updatedSections);
    setDragOverSection(null);
  };

  // Toggle section collapsed state
  const toggleSection = (sectionId: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, collapsed: !section.collapsed }
        : section
    );
    setSections(updatedSections);
    saveDashboardPreferences(updatedSections);
  };

  // Render section content
  const renderSectionContent = (section: DashboardSection) => {
    if (section.collapsed) return null;

    const commonProps = {
      businessId,
      locations,
      sources,
      jobs,
      onUpdate: onDataUpdate
    };

    switch (section.component) {
      case 'LocationsSection':
        return <LocationsSection {...commonProps} />;
      case 'SourcesSection':
        return <SourcesSection {...commonProps} />;
      case 'JobsSection':
        return <JobsSection {...commonProps} />;
      case 'AnalysisSection':
        return <AnalysisSection {...commonProps} />;
      case 'StatisticsSection':
        return <StatisticsSection {...commonProps} />;
      case 'ActivitySection':
        return <ActivitySection {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {sections.map((section, index) => {
        const IconComponent = iconMap[section.icon];
        const isDraggedOver = dragOverSection === section.id;
        const isDragged = draggedSection === section.id;

        // Debug: Let's see what's happening with icons
        console.log(`Section: ${section.id}, Icon: ${section.icon}, Component:`, IconComponent);

        // Safety check - if icon is not found, use a default based on section type
        const SafeIcon = IconComponent || (() => {
          switch (section.id) {
            case 'locations': return MapPin;
            case 'sources': return Database;
            case 'jobs': return Play;
            case 'analysis': return Brain;
            case 'statistics': return BarChart3;
            case 'activity': return Activity;
            default: return BarChart3;
          }
        })();

        return (
          <div
            key={section.id}
            draggable
            onDragStart={(e) => handleDragStart(e, section.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, section.id)}
            onDrop={(e) => handleDrop(e, section.id)}
            className={`group relative transition-all duration-500 transform animate-in slide-in-from-bottom ${
              section.collapsed ? 'col-span-1' : 'col-span-1'
            } ${
              isDraggedOver ? 'scale-105 rotate-1' : ''
            } ${
              isDragged ? 'scale-95 rotate-2 z-50' : ''
            }`}
            style={{ 
              animationDelay: `${index * 0.1}s`,
              cursor: 'move'
            }}
          >
            {/* Glassmorphic background */}
            <div className={`absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl group-hover:shadow-2xl transition-all duration-500 ${
              isDraggedOver ? 'bg-blue-500/20 border-blue-500/50 shadow-blue-500/25' : ''
            }`} />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl opacity-60" />
            
            <div className="relative">
              {/* Section Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="cursor-grab active:cursor-grabbing p-2 hover:bg-white/30 rounded-xl transition-all duration-300 group/drag">
                    <GripVertical className="h-5 w-5 text-gray-400 group-hover/drag:text-gray-600 group-hover/drag:scale-110 transition-all duration-300" />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                    <div className="relative p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl group-hover:scale-110 transition-all duration-300">
                      <SafeIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                    {section.title}
                  </h3>
                </div>
                
                <button
                  onClick={() => toggleSection(section.id)}
                  className="p-3 hover:bg-white/30 rounded-xl transition-all duration-300 group/toggle"
                >
                  {section.collapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-600 group-hover/toggle:text-gray-800 group-hover/toggle:scale-110 transition-all duration-300" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-600 group-hover/toggle:text-gray-800 group-hover/toggle:scale-110 transition-all duration-300" />
                  )}
                </button>
              </div>

              {/* Section Content */}
              {!section.collapsed && (
                <div className="p-6 animate-in slide-in-from-top duration-500">
                  {renderSectionContent(section)}
                </div>
              )}

              {/* Collapsed State - Show Icon Only */}
              {section.collapsed && (
                <div className="p-6 flex items-center justify-center animate-in fade-in duration-300">
                  <SafeIcon className="h-8 w-8 text-gray-400 group-hover:text-gray-600 group-hover:scale-125 transition-all duration-500" />
                </div>
              )}
            </div>

            {/* Drop indicator */}
            {isDraggedOver && draggedSection !== section.id && (
              <div className="absolute inset-0 border-4 border-dashed border-blue-500 rounded-3xl animate-pulse pointer-events-none" />
            )}
          </div>
        );
      })}
    </div>
  );
}