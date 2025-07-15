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
  GripVertical,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

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

// Icon mapping
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

  // Render section content (inline for now to avoid import issues)
  const renderSectionContent = (section: DashboardSection) => {
    if (section.collapsed) return null;

    switch (section.component) {
      case 'LocationsSection':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  {locations.length} location{locations.length !== 1 ? 's' : ''} configured
                </p>
                <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
              </div>

              <button className="group bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2">
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-medium">Add Location</span>
              </button>
            </div>

            {locations.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-16 w-16 mx-auto text-emerald-500/60 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
                <p className="text-gray-600">Add your first location to start organizing your review sources</p>
              </div>
            ) : (
              <div className="space-y-4">
                {locations.slice(0, 3).map((location, index) => (
                  <div key={location.id} className="group relative">
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:bg-white/70 transition-all duration-300" />
                    <div className="relative p-6 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{location.name}</h4>
                        <p className="text-sm text-gray-600">{location.address}</p>
                      </div>
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'SourcesSection':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  {sources.length} source{sources.length !== 1 ? 's' : ''} configured
                </p>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
              </div>

              <button className="group bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2">
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-medium">Add Source</span>
              </button>
            </div>

            {sources.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-16 w-16 mx-auto text-blue-500/60 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sources configured</h3>
                <p className="text-gray-600">Connect Google Maps or upload CSV files to start collecting reviews</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sources.slice(0, 3).map((source, index) => (
                  <div key={source.id} className="group relative">
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:bg-white/70 transition-all duration-300" />
                    <div className="relative p-6 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{source.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{source.type}</p>
                      </div>
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'JobsSection':
        const runningJobs = jobs.filter(job => job.status === 'running');

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  {runningJobs.length} running • {jobs.length} total jobs
                </p>
                <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              </div>

              <button className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2">
                <Play className="h-4 w-4" />
                <span className="font-medium">Start Job</span>
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <Play className="h-16 w-16 mx-auto text-purple-500/60 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No scraping jobs yet</h3>
                <p className="text-gray-600">Start your first job to begin collecting reviews</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.slice(0, 3).map((job, index) => (
                  <div key={job.id} className="group relative">
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:bg-white/70 transition-all duration-300" />
                    <div className="relative p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{job.name}</h4>
                          <p className="text-sm text-gray-600">Job #{job.id.slice(0, 8)}</p>
                        </div>

                        <div className={`px-3 py-1 rounded-full flex items-center space-x-2 text-white text-sm font-medium ${
                          job.status === 'running' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                          job.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          job.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                          'bg-gradient-to-r from-gray-500 to-slate-500'
                        }`}>
                          {job.status === 'running' ? <Clock className="h-4 w-4 animate-spin" /> :
                           job.status === 'completed' ? <CheckCircle className="h-4 w-4" /> :
                           <Clock className="h-4 w-4" />}
                          <span className="capitalize">{job.status}</span>
                        </div>
                      </div>

                      {job.status === 'completed' && job.reviews_scraped && (
                        <p className="text-sm text-green-600 font-medium">
                          ✅ {job.reviews_scraped} reviews collected
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Section content coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {sections.map((section, index) => {
        const IconComponent = iconMap[section.icon];
        const isDraggedOver = dragOverSection === section.id;
        const isDragged = draggedSection === section.id;

        // Safety check - if icon is not found, use a default
        const SafeIcon = IconComponent || BarChart3;

        return (
          <div
            key={section.id}
            draggable
            onDragStart={(e) => handleDragStart(e, section.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, section.id)}
            onDrop={(e) => handleDrop(e, section.id)}
            className={`group relative transition-all duration-500 transform ${
              isDraggedOver ? 'scale-105 rotate-1' : ''
            } ${
              isDragged ? 'scale-95 rotate-2 z-50' : ''
            }`}
            style={{
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
                <div className="p-6">
                  {renderSectionContent(section)}
                </div>
              )}

              {/* Collapsed State - Show Icon Only */}
              {section.collapsed && (
                <div className="p-6 flex items-center justify-center">
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
