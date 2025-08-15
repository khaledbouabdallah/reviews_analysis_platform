// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { dashboardService, DashboardStats, BusinessWithStats, Activity, SystemStatus as SystemStatusType } from '@/services/dashboard';
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { BusinessGrid } from '@/components/dashboard/BusinessGrid';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import '@/styles/business-page.css';

export default function DashboardPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true); // **NEW: Auth loading state**
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    totalLocations: 0,
    totalReviews: 0,
  });
  const [businesses, setBusinesses] = useState<BusinessWithStats[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType>({
    status: 'operational',
    jobsCompletedToday: 0,
  });

  useEffect(() => {
    console.log('🚀 Dashboard useEffect triggered');

    // **CHANGED: Make authentication check async with detailed logging**
    const checkAuthAndLoad = async () => {
      try {
        console.log('🔍 Starting authentication check...');

        const isAuthenticated = await authService.isAuthenticated();
        console.log('🔍 Authentication result:', isAuthenticated);

        if (!isAuthenticated) {
          console.log('❌ User not authenticated, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('✅ User authenticated, proceeding to load dashboard');
        setAuthLoading(false); // **NEW: Mark auth complete**
        await loadDashboardData();

      } catch (error) {
        console.error('💥 Auth check failed with error:', error);
        router.push('/login');
      }
    };

    checkAuthAndLoad();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading dashboard data...');
      setLoading(true);

      // Load all dashboard data in parallel
      const [statsData, businessesData, activitiesData, statusData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getBusinessesWithStats(),
        dashboardService.getRecentActivity(),
        dashboardService.getSystemStatus(),
      ]);

      console.log('📊 Dashboard data loaded successfully');
      setStats(statsData);
      setBusinesses(businessesData);
      setActivities(activitiesData);
      setSystemStatus(statusData);
    } catch (error) {
      console.error('💥 Error loading dashboard data:', error);
      // If there's an auth error, the service will redirect to login
    } finally {
      setLoading(false);
    }
  };

  // **NEW: Show loading during auth check to prevent flash**
  if (authLoading) {
    console.log('⏳ Showing auth loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering dashboard page');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <DashboardNavigation />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-in slide-in-from-top duration-700">
          <div className="relative">
            {/* Glassmorphic background */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl opacity-60" />

            <div className="relative p-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
                Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Welcome back! Here's what's happening with your businesses.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 animate-in slide-in-from-left duration-700" style={{ animationDelay: '0.2s' }}>
          <StatsCards stats={stats} loading={loading} />
        </div>

        {/* Business Grid - Full Width */}
        <div className="mb-8 animate-in slide-in-from-bottom duration-700" style={{ animationDelay: '0.4s' }}>
          <div className="relative mb-6">
            {/* Glassmorphic background for header */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40" />
            <div className="relative flex items-center justify-between p-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Businesses</h2>
              <div className="text-sm text-gray-500">
                {!loading && businesses.length > 0 && (
                  <span className="bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/40">
                    {businesses.length} business{businesses.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <BusinessGrid
            businesses={businesses}
            loading={loading}
            onBusinessCreated={loadDashboardData}
          />
        </div>

        {/* Recent Activity - Full width */}
        <div className="mb-8 animate-in slide-in-from-right duration-700" style={{ animationDelay: '0.6s' }}>
          <div className="relative">
            {/* Enhanced glassmorphic styling for activity section */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl opacity-60" />

            <div className="relative">
              <RecentActivity activities={activities} loading={loading} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 animate-in fade-in duration-700" style={{ animationDelay: '0.8s' }}>
          <div className="relative">
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40" />
            <div className="relative p-6">
              <p className="text-gray-500 text-sm">
                ReviewsAI Dashboard • Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}