// src/app/business/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { authService } from '@/services/auth';
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation';
import { BusinessHeader, DashboardSections, BusinessSkeleton, } from '@/components/business';
import { BusinessStorageService } from '@/services/businessStorage';
import '@/styles/business-page.css';

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
  reviews_handled?: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

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

  // Authentication check
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      // **CHANGED: Made authentication check async**
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        router.push('/login');
        return;
      }
      loadBusinessData();
    };

    checkAuthAndLoad();
  }, [router, businessId]);

  useEffect(() => {
    // Save the current business ID when page loads
    if (businessId) {
      BusinessStorageService.setCurrentBusiness(businessId);
    }
  }, [businessId]);

  // Load all business data
  const loadBusinessData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // **CHANGED: Removed authService.getAuthHeaders() and added credentials: 'include'**
      const fetchOptions = {
        credentials: 'include' as RequestCredentials, // **NEW: Required for httpOnly cookies**
      };

      // Load business data in parallel
      const [businessRes, locationsRes, sourcesRes, jobsRes] = await Promise.all([
        fetch(`${API_URL}/api/businesses/${businessId}`, fetchOptions),
        fetch(`${API_URL}/api/locations/business/${businessId}`, fetchOptions),
        fetch(`${API_URL}/api/sources/business/${businessId}`, fetchOptions),
        fetch(`${API_URL}/api/jobs/business/${businessId}`, fetchOptions)
      ]);

      // **NEW: Handle 401 authentication errors**
      if (businessRes.status === 401 || locationsRes.status === 401 ||
        sourcesRes.status === 401 || jobsRes.status === 401) {
        await authService.logout();
        router.push('/login');
        return;
      }

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

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <DashboardNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BusinessSkeleton />
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <DashboardNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12 animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/10 rounded-full blur-3xl" />
              <AlertCircle className="relative h-16 w-16 text-red-500 mx-auto mb-6 animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Business Not Found</h2>
            <p className="text-gray-600 mb-8 text-lg">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center mx-auto"
            >
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <DashboardNavigation />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="group flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-all duration-300 hover:bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Business Header */}
        <div className="animate-in slide-in-from-top duration-700">
          <BusinessHeader
            business={business}
            locations={locations}
            sources={sources}
            jobs={jobs}
            onBusinessUpdate={loadBusinessData}
          />
        </div>

        {/* Dashboard Sections */}
        <div className="animate-in slide-in-from-bottom duration-700" style={{ animationDelay: '0.2s' }}>
          <DashboardSections
            businessId={businessId}
            locations={locations}
            sources={sources}
            jobs={jobs}
            onDataUpdate={loadBusinessData}
          />
        </div>
      </div>
    </div>
  );
}