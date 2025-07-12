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
import { QuickActions } from '@/components/dashboard/QuickActions';
// import { SystemStatus } from '@/components/dashboard/SystemStatus';

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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Businesses - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Businesses</h2>
              <BusinessGrid businesses={businesses} loading={loading} />
            </div>
          </div>

          {/* Sidebar - Takes 1 column on large screens */}
          <div className="space-y-6">
            <QuickActions />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
              <p className="text-sm text-gray-600">All systems operational</p>
            </div>
          </div>
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