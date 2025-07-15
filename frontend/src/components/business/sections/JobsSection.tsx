// src/components/business/sections/JobsSection.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, MoreVertical, Play, Pause, RotateCcw, Trash2, Eye, ExternalLink, Clock, AlertTriangle, CheckCircle, XCircle, Loader2, Database, Calendar } from 'lucide-react';
import { Job, jobService, getJobProgress, getJobStatusColor, getJobStatusLabel, isJobActive, JobStatusResponse, JobCreateResponse } from '@/services/job';
import { Source } from '@/services/source';
import { Location } from '@/services/location';
import { AddJobModal, EditJobModal, JobDetailsModal, DeleteJobConfirmationModal } from '../modals/JobModals';

interface JobsSectionProps {
  businessId: string;
  sources: Source[];
  locations: Location[];
}

export function JobsSection({ businessId, sources, locations }: JobsSectionProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Real-time job status updates
  const [jobStatuses, setJobStatuses] = useState<Record<string, JobStatusResponse>>({});

  const fetchJobs = useCallback(async () => {
    try {
      setError('');
      const data = await jobService.getJobsByBusiness(businessId);
      setJobs(data);

      // Initialize real-time polling for active jobs
      data.forEach(job => {
        if (isJobActive(job.status)) {
          startJobPolling(job.id);
        }
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const startJobPolling = useCallback((jobId: string) => {
    if (jobService.isPolling(jobId)) return; // Already polling

    jobService.startPolling(
      jobId,
      (status: JobStatusResponse) => {
        setJobStatuses(prev => ({ ...prev, [jobId]: status }));

        // Update the job in the jobs array if status changed
        setJobs(prevJobs =>
          prevJobs.map(job =>
            job.id === jobId
              ? {
                ...job,
                status: status.status,
                total_reviews: status.total_reviews ?? job.total_reviews,
                reviews_scraped: status.reviews_scraped ?? job.reviews_scraped,
                started_at: status.started_at ?? job.started_at,
                ended_at: status.ended_at ?? job.ended_at,
                error: status.error ?? job.error
              }
              : job
          )
        );
      },
      () => {
        // Job completed, refresh jobs list
        fetchJobs();
      }
    );
  }, [fetchJobs]);

  useEffect(() => {
    fetchJobs();

    // Cleanup polling on unmount
    return () => {
      jobService.stopAllPolling();
    };
  }, [fetchJobs]);

  const handleJobCreated = useCallback(async () => {
    await fetchJobs();
    setIsAddModalOpen(false);
  }, [fetchJobs]);

  const handleJobUpdated = useCallback(async () => {
    await fetchJobs();
    setIsEditModalOpen(false);
    setSelectedJob(null);
  }, [fetchJobs]);

  const handleRetryJob = useCallback(async (job: Job) => {
    try {
      const response: JobCreateResponse = await jobService.retryJob(job);
      await fetchJobs();

      // Start polling for the new retry job
      if (response.id) {
        startJobPolling(response.id);
      }
    } catch (error: any) {
      setError(error.message);
    }
  }, [fetchJobs, startJobPolling]);

  const handleCancelJob = useCallback(async (job: Job) => {
    try {
      await jobService.cancelJob(job.id);
      jobService.stopPolling(job.id);
      await fetchJobs();
    } catch (error: any) {
      setError(error.message);
    }
  }, [fetchJobs]);

  const handleDeleteJob = useCallback(async () => {
    if (!selectedJob) return;

    setDeleteLoading(true);
    try {
      await jobService.deleteJob(selectedJob.id);
      jobService.stopPolling(selectedJob.id);
      await fetchJobs();
      setIsDeleteModalOpen(false);
      setSelectedJob(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedJob, fetchJobs]);

  const getJobSource = (job: Job) => {
    return sources.find(s => s.id === job.source_id);
  };

  const getJobLocation = (job: Job) => {
    if (!job.location_id) return null;
    return locations.find(l => l.id === job.location_id);
  };

  const getJobWithStatus = (job: Job): Job => {
    const status = jobStatuses[job.id];
    if (!status) return job;

    return {
      ...job,
      status: status.status,
      total_reviews: status.total_reviews ?? job.total_reviews,
      reviews_scraped: status.reviews_scraped ?? job.reviews_scraped,
      started_at: status.started_at ?? job.started_at,
      ended_at: status.ended_at ?? job.ended_at,
      error: status.error ?? job.error
    };
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm ||
      (job.name && job.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getJobSource(job)?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full max-h-96 section-container">
      {/* Fixed Header */}
      <div className="flex-shrink-0 space-y-4 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">
              {loading ? 'Loading jobs...' : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} total`}
            </p>
            <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full" />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={sources.length === 0}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-300 text-sm"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-300 text-sm min-w-[140px] appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="saving">Saving</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* No Sources Warning */}
        {sources.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-yellow-800 mb-1">No Sources Available</h3>
            <p className="text-xs text-yellow-700">
              You need to create at least one source before you can start scraping jobs.
            </p>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-3 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading jobs...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && sources.length > 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-in fade-in duration-700">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl" />
                <Play className="relative h-16 w-16 mx-auto text-blue-500/60 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
              <p className="text-gray-600 mb-6">Start your first scraping job to collect reviews from your sources</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-medium"
              >
                Launch First Job
              </button>
            </div>
          </div>
        )}

        {/* No Filtered Results */}
        {!loading && filteredJobs.length === 0 && jobs.length > 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Found</h3>
              <p className="text-gray-600">No jobs match your current search criteria.</p>
            </div>
          </div>
        )}

        {/* Jobs Table - Scrollable */}
        {!loading && filteredJobs.length > 0 && (
          <div
            className="table-scrollable border border-gray-200 rounded-xl"
            style={{
              height: '200px', // Fixed height
              overflowY: 'auto', // Only vertical scrolling
              overflowX: 'hidden' // Hide horizontal scrollbar
            }}
            tabIndex={0}
            role="region"
            aria-label="Jobs table"
          >
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">Job</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Source</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Progress</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Date</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredJobs.map((job) => {
                  const jobWithStatus = getJobWithStatus(job);
                  const source = getJobSource(job);
                  const location = getJobLocation(job);
                  const progress = getJobProgress(jobWithStatus);
                  const duration = jobService.getJobDuration(jobWithStatus);
                  const isActive = isJobActive(jobWithStatus.status);

                  return (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-3">
                        <div className="keyboard-focusable">
                          <div className="font-medium text-gray-900 mb-1">
                            {job.name || 'Unnamed Job'}
                          </div>
                          {location && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {location.name}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getJobStatusColor(jobWithStatus.status)}`}>
                          {isActive && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                          {jobWithStatus.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {jobWithStatus.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                          {getJobStatusLabel(jobWithStatus.status)}
                        </div>
                        {jobWithStatus.status === 'failed' && jobWithStatus.error && (
                          <div className="text-xs text-red-600 mt-1 truncate max-w-32" title={jobWithStatus.error}>
                            {jobWithStatus.error}
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Database className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 truncate max-w-32" title={source?.name}>
                            {source?.name || 'Unknown Source'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 capitalize">
                          {job.source_type}
                        </div>
                      </td>

                      <td className="p-3">
                        {isActive ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            {jobWithStatus.reviews_scraped !== undefined && jobWithStatus.total_reviews && (
                              <div className="text-xs text-gray-500">
                                {jobWithStatus.reviews_scraped}/{jobWithStatus.total_reviews}
                              </div>
                            )}
                          </div>
                        ) : jobWithStatus.status === 'completed' && jobWithStatus.reviews_scraped ? (
                          <div className="text-sm font-medium text-green-600">
                            {jobWithStatus.reviews_scraped} reviews
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="text-sm text-gray-900">
                          {formatDate(job.created_at)}
                        </div>
                        {duration && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {duration}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Quick Actions */}
                          {(jobWithStatus.status === 'completed' || jobWithStatus.status === 'partially_completed') && jobWithStatus.reviews_scraped && (
                            <button
                              onClick={() => window.open(`/reviews?job_id=${job.id}`, '_blank')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
                              title="View reviews"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          )}

                          {isActive && (
                            <button
                              onClick={() => handleCancelJob(job)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Cancel job"
                            >
                              <Pause className="h-4 w-4" />
                            </button>
                          )}

                          {(jobWithStatus.status === 'failed' || jobWithStatus.status === 'cancelled') && (
                            <button
                              onClick={() => handleRetryJob(job)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Retry job"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}

                          {/* More Actions Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setDropdownOpen(dropdownOpen === job.id ? null : job.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {dropdownOpen === job.id && (
                              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-2">
                                <button
                                  onClick={() => {
                                    setSelectedJob(job);
                                    setIsDetailsModalOpen(true);
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>View Details</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedJob(job);
                                    setIsEditModalOpen(true);
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <Database className="h-4 w-4" />
                                  <span>Edit Job</span>
                                </button>

                                <div className="border-t border-gray-200 my-2" />

                                <button
                                  onClick={() => {
                                    setSelectedJob(job);
                                    setIsDeleteModalOpen(true);
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete Job</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setDropdownOpen(null)}
        />
      )}

      {/* Stats Summary */}
      {!loading && jobs.length > 0 && (
        <div className="flex-shrink-0 pt-4">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {jobs.filter(j => isJobActive(getJobWithStatus(j).status)).length}
                </div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {jobs.filter(j => getJobWithStatus(j).status === 'completed').length}
                </div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  {jobs.filter(j => getJobWithStatus(j).status === 'failed').length}
                </div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-600">
                  {jobs.reduce((sum, j) => sum + (getJobWithStatus(j).reviews_scraped || 0), 0)}
                </div>
                <div className="text-xs text-gray-600">Total Reviews</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddJobModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onJobCreated={handleJobCreated}
        businessId={businessId}
        sources={sources}
        locations={locations}
      />

      <EditJobModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedJob(null);
        }}
        onJobUpdated={handleJobUpdated}
        job={selectedJob}
      />

      <JobDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedJob(null);
        }}
        job={selectedJob}
        onRetry={handleRetryJob}
        onCancel={handleCancelJob}
      />

      <DeleteJobConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedJob(null);
        }}
        onConfirm={handleDeleteJob}
        jobName={selectedJob?.name || 'Unnamed Job'}
        loading={deleteLoading}
      />
    </div>
  );
}