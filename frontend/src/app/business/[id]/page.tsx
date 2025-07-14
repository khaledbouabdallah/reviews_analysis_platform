// src/app/business/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Building2, 
  MapPin, 
  Database, 
  Play, 
  BarChart3,
  Activity,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Brain,
  MessageSquare,
  TrendingUp,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { authService } from '@/services/auth';
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation';

interface Business {
  id: string;
  name: string;
  description?: string;
  segments?: string[];
  created_at: string;
  updated_at?: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  business_id: string;
  created_at: string;
}

interface Source {
  id: string;
  name: string;
  type: string;
  business_id: string;
  location_id?: string;
  created_at: string;
}

interface Job {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  url: string;
  source_id: string;
  total_reviews?: number;
  reviews_scraped?: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

interface DashboardSection {
  id: string;
  title: string;
  icon: any;
  component: string;
  collapsed: boolean;
  order: number;
}

const defaultSections: DashboardSection[] = [
  { id: 'locations', title: 'Locations', icon: MapPin, component: 'LocationsSection', collapsed: false, order: 0 },
  { id: 'sources', title: 'Sources', icon: Database, component: 'SourcesSection', collapsed: false, order: 1 },
  { id: 'jobs', title: 'Jobs & Scraping', icon: Play, component: 'JobsSection', collapsed: false, order: 2 },
  { id: 'analysis', title: 'Analysis Center', icon: Brain, component: 'AnalysisSection', collapsed: false, order: 3 },
  { id: 'statistics', title: 'Statistics', icon: BarChart3, component: 'StatisticsSection', collapsed: true, order: 4 },
  { id: 'activity', title: 'Recent Activity', icon: Activity, component: 'ActivitySection', collapsed: true, order: 5 }
];

export default function BusinessPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;

  // Core data state
  const [business, setBusiness] = useState<Business | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard customization state
  const [sections, setSections] = useState<DashboardSection[]>(defaultSections);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [businessForm, setBusinessForm] = useState({ name: '', description: '' });

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

  // Authentication check
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadBusinessData();
  }, [router, businessId]);

  // Load all business data
  const loadBusinessData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const headers = authService.getAuthHeaders();

      // Load business data in parallel
      const [businessRes, locationsRes, sourcesRes, jobsRes] = await Promise.all([
        fetch(`${API_URL}/api/businesses/${businessId}`, { headers }),
        fetch(`${API_URL}/api/locations/business/${businessId}`, { headers }),
        fetch(`${API_URL}/api/sources/business/${businessId}`, { headers }),
        fetch(`${API_URL}/api/jobs/business/${businessId}`, { headers })
      ]);

      if (!businessRes.ok) throw new Error('Business not found');

      const [businessData, locationsData, sourcesData, jobsData] = await Promise.all([
        businessRes.json(),
        locationsRes.ok ? locationsRes.json() : [],
        sourcesRes.ok ? sourcesRes.json() : [],
        jobsRes.ok ? jobsRes.json() : []
      ]);

      setBusiness(businessData);
      setLocations(locationsData);
      setSources(sourcesData);
      setJobs(jobsData);
      setBusinessForm({ name: businessData.name, description: businessData.description || '' });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle drag end for sections reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newSections = Array.from(sections);
    const [reorderedSection] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, reorderedSection);

    // Update order property
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index
    }));

    setSections(updatedSections);
    saveDashboardPreferences(updatedSections);
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

  // Update business info
  const handleBusinessUpdate = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/businesses/${businessId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify(businessForm),
      });

      if (!response.ok) throw new Error('Failed to update business');

      const updatedBusiness = await response.json();
      setBusiness(updatedBusiness);
      setEditingBusiness(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <DashboardNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BusinessSkeleton />
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <DashboardNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* Business Header - Fixed */}
        <BusinessHeader 
          business={business}
          editingBusiness={editingBusiness}
          businessForm={businessForm}
          setBusinessForm={setBusinessForm}
          setEditingBusiness={setEditingBusiness}
          handleBusinessUpdate={handleBusinessUpdate}
          locations={locations}
          sources={sources}
          jobs={jobs}
        />

        {/* Draggable Sections */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard-sections">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {sections.map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all duration-200 ${
                          snapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl' : ''
                        }`}
                      >
                        <DashboardSection
                          section={section}
                          onToggle={() => toggleSection(section.id)}
                          dragHandleProps={provided.dragHandleProps}
                          businessId={businessId}
                          locations={locations}
                          sources={sources}
                          jobs={jobs}
                          onDataUpdate={loadBusinessData}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}

// Business Header Component
function BusinessHeader({ 
  business, 
  editingBusiness, 
  businessForm, 
  setBusinessForm, 
  setEditingBusiness, 
  handleBusinessUpdate,
  locations,
  sources,
  jobs
}: any) {
  return (
    <div className="relative mb-8 backdrop-blur-lg bg-white/80 border border-white/20 rounded-3xl p-8 shadow-xl">
      {/* Glassmorphic background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {editingBusiness ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={businessForm.name}
                  onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                  className="text-3xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <textarea
                  value={businessForm.description}
                  onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                  placeholder="Business description..."
                  className="w-full bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                  rows={3}
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleBusinessUpdate}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-xl transition-all transform hover:scale-105"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingBusiness(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
                  <button
                    onClick={() => setEditingBusiness(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-all"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
                {business.description && (
                  <p className="text-gray-600 mb-4">{business.description}</p>
                )}
                {business.segments && business.segments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {business.segments.map((segment: string) => (
                      <span
                        key={segment}
                        className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {segment}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Locations" 
            value={locations.length} 
            icon={MapPin} 
            color="from-green-500 to-emerald-500"
          />
          <StatCard 
            title="Sources" 
            value={sources.length} 
            icon={Database} 
            color="from-blue-500 to-cyan-500"
          />
          <StatCard 
            title="Active Jobs" 
            value={jobs.filter((job: Job) => job.status === 'running').length} 
            icon={Play} 
            color="from-purple-500 to-pink-500"
          />
        </div>
      </div>
    </div>
  );
}

// Reusable Stat Card
function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="backdrop-blur-sm bg-white/60 border border-white/20 rounded-2xl p-6 hover:bg-white/80 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Section Component
function DashboardSection({ section, onToggle, dragHandleProps, businessId, locations, sources, jobs, onDataUpdate }: any) {
  const Icon = section.icon;

  return (
    <div className={`backdrop-blur-lg bg-white/80 border border-white/20 rounded-2xl shadow-xl transition-all duration-300 ${
      section.collapsed ? 'col-span-1' : 'col-span-1'
    }`}>
      {/* Section Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/50 rounded-lg transition-colors"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
        >
          {section.collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>

      {/* Section Content */}
      {!section.collapsed && (
        <div className="p-6 animate-in slide-in-from-top-2 duration-300">
          {section.component === 'LocationsSection' && (
            <LocationsSection locations={locations} businessId={businessId} onUpdate={onDataUpdate} />
          )}
          {section.component === 'SourcesSection' && (
            <SourcesSection sources={sources} locations={locations} businessId={businessId} onUpdate={onDataUpdate} />
          )}
          {section.component === 'JobsSection' && (
            <JobsSection jobs={jobs} sources={sources} businessId={businessId} onUpdate={onDataUpdate} />
          )}
          {section.component === 'AnalysisSection' && (
            <AnalysisSection businessId={businessId} />
          )}
          {section.component === 'StatisticsSection' && (
            <StatisticsSection businessId={businessId} />
          )}
          {section.component === 'ActivitySection' && (
            <ActivitySection businessId={businessId} />
          )}
        </div>
      )}

      {/* Collapsed State - Show Icon Only */}
      {section.collapsed && (
        <div className="p-6 flex items-center justify-center">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      )}
    </div>
  );
}

// Individual Section Components
function LocationsSection({ locations, businessId, onUpdate }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">{locations.length} locations configured</p>
        <button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Location</span>
        </button>
      </div>
      
      {locations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No locations added yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.slice(0, 3).map((location: Location) => (
            <div key={location.id} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white/30">
              <div>
                <h4 className="font-medium text-gray-900">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.address}</p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {locations.length > 3 && (
            <button className="w-full text-center py-2 text-blue-600 hover:text-blue-800 transition-colors">
              View all {locations.length} locations
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SourcesSection({ sources, locations, businessId, onUpdate }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">{sources.length} sources configured</p>
        <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Source</span>
        </button>
      </div>
      
      {sources.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No sources added yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.slice(0, 3).map((source: Source) => (
            <div key={source.id} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white/30">
              <div>
                <h4 className="font-medium text-gray-900">{source.name}</h4>
                <p className="text-sm text-gray-600">{source.type}</p>
                {source.location_id && (
                  <p className="text-xs text-gray-500">
                    📍 {locations.find((l: Location) => l.id === source.location_id)?.name || 'Unknown location'}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function JobsSection({ jobs, sources, businessId, onUpdate }: any) {
  const runningJobs = jobs.filter((job: Job) => job.status === 'running');
  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">{runningJobs.length} running • {jobs.length} total jobs</p>
        <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2">
          <Play className="h-4 w-4" />
          <span>Start Job</span>
        </button>
      </div>
      
      {jobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No scraping jobs yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentJobs.map((job: Job) => (
            <JobCard key={job.id} job={job} sources={sources} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job, sources }: any) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'from-blue-500 to-cyan-500';
      case 'completed': return 'from-green-500 to-emerald-500';
      case 'failed': return 'from-red-500 to-pink-500';
      case 'cancelled': return 'from-gray-500 to-slate-500';
      default: return 'from-yellow-500 to-orange-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const progress = job.total_reviews ? (job.reviews_scraped || 0) / job.total_reviews * 100 : 0;

  return (
    <div className="p-4 bg-white/50 rounded-xl border border-white/30 hover:bg-white/70 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{job.name}</h4>
          <p className="text-sm text-gray-600">
            {sources.find((s: Source) => s.id === job.source_id)?.name || 'Unknown source'}
          </p>
        </div>
        <div className={`px-3 py-1 bg-gradient-to-r ${getStatusColor(job.status)} text-white rounded-full flex items-center space-x-2`}>
          {getStatusIcon(job.status)}
          <span className="text-sm font-medium capitalize">{job.status}</span>
        </div>
      </div>
      
      {job.status === 'running' && job.total_reviews && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{job.reviews_scraped || 0} / {job.total_reviews} reviews</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {job.status === 'completed' && (
        <p className="text-sm text-green-600 font-medium">
          ✅ {job.reviews_scraped || 0} reviews collected
        </p>
      )}
    </div>
  );
}

function AnalysisSection({ businessId }: any) {
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
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">Run AI analysis on your collected reviews</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysisOptions.map((option) => (
          <button
            key={option.id}
            className={`p-4 bg-gradient-to-r ${option.color} hover:shadow-lg text-white rounded-xl transition-all transform hover:scale-105 text-left group`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <option.icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold">{option.title}</h4>
            </div>
            <p className="text-sm opacity-90">{option.description}</p>
          </button>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="flex items-start space-x-3">
          <Brain className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Pro Tip</h4>
            <p className="text-sm text-yellow-700">Run sentiment analysis first, then segmentation for best results. AI summary works great after both are complete!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatisticsSection({ businessId }: any) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">Business insights and analytics</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white/50 rounded-xl border border-white/30">
          <h4 className="font-semibold text-gray-900 mb-2">Review Sentiment</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Positive</span>
              <span>68%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="w-[68%] h-full bg-green-500 rounded-full" />
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white/50 rounded-xl border border-white/30">
          <h4 className="font-semibold text-gray-900 mb-2">Monthly Trend</h4>
          <div className="flex items-end space-x-1 h-16">
            {[40, 65, 45, 80, 68, 75, 82].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-white/50 rounded-xl border border-white/30">
          <p className="text-2xl font-bold text-gray-900">4.2</p>
          <p className="text-sm text-gray-600">Avg Rating</p>
        </div>
        <div className="text-center p-4 bg-white/50 rounded-xl border border-white/30">
          <p className="text-2xl font-bold text-gray-900">247</p>
          <p className="text-sm text-gray-600">Total Reviews</p>
        </div>
        <div className="text-center p-4 bg-white/50 rounded-xl border border-white/30">
          <p className="text-2xl font-bold text-gray-900">+12%</p>
          <p className="text-sm text-gray-600">This Month</p>
        </div>
      </div>
    </div>
  );
}

function ActivitySection({ businessId }: any) {
  const activities = [
    { id: 1, action: 'Scraping completed', details: '23 new reviews from Google Maps', time: '2 hours ago', type: 'success' },
    { id: 2, action: 'Sentiment analysis started', details: 'Processing 247 reviews', time: '4 hours ago', type: 'info' },
    { id: 3, action: 'New source added', details: 'TripAdvisor reviews connected', time: '1 day ago', type: 'info' },
    { id: 4, action: 'Analysis complete', details: 'Segmentation finished', time: '2 days ago', type: 'success' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">Recent business activity</p>
      
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg border border-white/30">
            {getActivityIcon(activity.type)}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{activity.action}</p>
              <p className="text-sm text-gray-600">{activity.details}</p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full text-center py-2 text-blue-600 hover:text-blue-800 transition-colors font-medium">
        View All Activity
      </button>
    </div>
  );
}

// Business Skeleton Loader
function BusinessSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white/80 rounded-3xl p-8">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/60 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-16" />
                    <div className="h-6 bg-gray-200 rounded w-12" />
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-200 rounded" />
                <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                <div className="h-5 bg-gray-200 rounded w-24" />
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded" />
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}