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



export default function DashboardPage() {
  const router = useRouter();
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
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all dashboard data in parallel
      const [statsData, businessesData, activitiesData, statusData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getBusinessesWithStats(),
        dashboardService.getRecentActivity(),
        dashboardService.getSystemStatus(),
      ]);

      setStats(statsData);
      setBusinesses(businessesData);
      setActivities(activitiesData);
      setSystemStatus(statusData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // If there's an auth error, the service will redirect to login
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with your businesses.
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} loading={loading} />




        {/* Business Grid - Full Width */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Businesses</h2>
          <div className="text-sm text-gray-500">
            {!loading && businesses.length > 0 && (
              <span>{businesses.length} business{businesses.length !== 1 ? 'es' : ''}</span>
            )}
          </div>
        </div>
        <BusinessGrid
          businesses={businesses}
          loading={loading}
          onBusinessCreated={loadDashboardData}
        />
      </div>

        {/* Recent Activity - Full width */}
        <div className="mb-8">
          <RecentActivity activities={activities} loading={loading} />
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            ReviewsAI Dashboard • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </main>
    </div>
  );
}
