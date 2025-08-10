// src/components/business/modals/JobModals.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Play, Loader2, AlertTriangle, Clock, Database, CheckCircle, XCircle, RotateCcw, ExternalLink, Eye, Pause, RefreshCw, Upload } from 'lucide-react';
import { Job, JobCreate, JobUpdate, jobService, getJobProgress, getJobStatusColor, getJobStatusLabel, isJobActive, JobStatusResponse } from '@/services/job';
import { Source } from '@/services/source';
import { Location } from '@/services/location';


interface AddJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJobCreated: () => void;
    businessId: string;
    sources: Source[];
    locations: Location[];
}

export function AddJobModal({ isOpen, onClose, onJobCreated, businessId, sources, locations }: AddJobModalProps) {
    const [formData, setFormData] = useState<JobCreate>({
        name: '',
        job_type: 'scraping',
        url: '',
        business_id: businessId,
        location_id: null,
        source_id: '',
        source_type: 'google',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            setFormData({
                name: '',
                job_type: 'scraping',
                url: '',
                business_id: businessId,
                location_id: null,
                source_id: '',
                source_type: 'google',
            });
            setCsvFile(null);
        }
    }, [isOpen, businessId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (formData.job_type === 'csv_upload') {
                // Handle CSV upload
                if (!csvFile) {
                    throw new Error('Please select a CSV file');
                }

                const response = await jobService.uploadCSV(
                    csvFile,
                    formData.name || null,
                    businessId,
                    formData.location_id || null
                    // TODO: Add location_id, need refactor, scraping jobs shouldn't have source_id 
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'CSV upload failed');
                }

                const result = await response.json();
                console.log('CSV job created:', result);
            }

            onJobCreated();
            handleClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Reset CSV file when switching job types
        if (name === 'job_type') {
            setCsvFile(null);
        }

        // Auto-fill URL when source is selected
        if (name === 'source_id') {
            const selectedSource = sources.find(s => s.id === value);
            if (selectedSource) {
                setFormData(prev => ({
                    ...prev,
                    source_id: value,
                    source_type: selectedSource.type,
                    url: selectedSource.url,
                    location_id: selectedSource.location_id,
                }));
                return;
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: name === 'location_id' && value === '' ? null : value,
        }));
    };

    const handleClose = () => {
        if (!loading) {
            setIsAnimating(false);
            setTimeout(() => {
                setFormData({
                    name: '',
                    url: '',
                    business_id: businessId,
                    job_type: 'scraping',
                    location_id: null,
                    source_id: '',
                    source_type: 'google',
                });
                setError('');
                setCsvFile(null);
                onClose();
            }, 200);
        }
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const selectedSource = sources.find(s => s.id === formData.source_id);
    const selectedLocation = locations.find(l => l.id === formData.location_id);
    const isScrapingJob = formData.job_type === 'scraping';
    const isCsvJob = formData.job_type === 'csv_upload';

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className={`fixed inset-0 transition-all duration-300 ease-out ${isAnimating ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-black/0'
                    }`}
                onClick={handleClose}
            />

            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-out ${isAnimating
                        ? 'scale-100 opacity-100 translate-y-0'
                        : 'scale-95 opacity-0 translate-y-4'
                        }`}
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-3xl opacity-20 blur-sm" />

                    <div className="relative bg-white rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl blur opacity-30 animate-pulse" />
                                    <div className="relative p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl">
                                        {isCsvJob ? (
                                            <Upload className="h-7 w-7 text-white" />
                                        ) : (
                                            <Play className="h-7 w-7 text-white" />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Start New Job</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {isCsvJob ? 'Upload CSV reviews' : 'Launch a scraping job from your sources'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="group p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-50"
                            >
                                <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-200" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Job Type Selection */}
                            <div className="space-y-2">
                                <label htmlFor="job_type" className="block text-sm font-semibold text-gray-700">
                                    Job Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="job_type"
                                    name="job_type"
                                    required
                                    value={formData.job_type}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all duration-300 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                >
                                    <option value="scraping">Scraping Job</option>
                                    <option value="csv_upload">CSV Upload</option>
                                </select>
                            </div>

                            {/* Source Selection - Only for scraping jobs */}
                            {isScrapingJob && (
                                <div className="space-y-2">
                                    <label htmlFor="source_id" className="block text-sm font-semibold text-gray-700">
                                        Source to Scrape <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="source_id"
                                        name="source_id"
                                        required
                                        value={formData.source_id}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all duration-300 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                    >
                                        <option value="">Select a source to scrape</option>
                                        {sources.map((source) => (
                                            <option key={source.id} value={source.id}>
                                                {source.name} ({source.type.toUpperCase()})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedSource && (
                                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-700 mb-1">
                                                <strong>Source:</strong> {selectedSource.name}
                                            </p>
                                            <p className="text-sm text-blue-600 break-all">
                                                <strong>URL:</strong> {selectedSource.url}
                                            </p>
                                            {selectedLocation && (
                                                <p className="text-sm text-blue-600">
                                                    <strong>Location:</strong> {selectedLocation.name}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* CSV Upload Section - Only for CSV jobs */}
                            {isCsvJob && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        CSV File <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setCsvFile(file);
                                        }}
                                        disabled={loading}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-300"
                                    />
                                    {csvFile && (
                                        <p className="text-sm text-green-600">✓ {csvFile.name}</p>
                                    )}
                                </div>
                            )}

                            {/* Job Name */}
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                                    Job Name <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                    placeholder={isCsvJob ? "e.g., Monthly Review Import, Customer Feedback..." : "e.g., Weekly Review Collection, Competitor Analysis..."}
                                />
                                <p className="text-xs text-gray-500">
                                    {isCsvJob ?
                                        "Leave empty to auto-generate from file name and timestamp" :
                                        "Leave empty to auto-generate from source name and timestamp"
                                    }
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center space-x-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="flex-1 px-6 py-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || (isScrapingJob && !formData.source_id) || (isCsvJob && !csvFile)}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-3" />
                                            <span className="animate-pulse">
                                                {isCsvJob ? 'Uploading...' : 'Launching...'}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            {isCsvJob ? (
                                                <Upload className="h-5 w-5 mr-3" />
                                            ) : (
                                                <Play className="h-5 w-5 mr-3" />
                                            )}
                                            {isCsvJob ? 'Upload CSV' : 'Launch Job'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Info about auto-launch */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-green-600 text-sm font-bold">⚡</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-green-800 mb-1">
                                        {isCsvJob ? 'Instant Processing' : 'Auto-Launch Mode'}
                                    </h4>
                                    <p className="text-xs text-green-700 leading-relaxed">
                                        {isCsvJob ?
                                            'CSV files are processed immediately. You\'ll be able to track progress in real-time.' :
                                            'Jobs start automatically when created. You\'ll be able to track progress in real-time and cancel if needed.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Keep all the other modals unchanged - EditJobModal, JobDetailsModal, DeleteJobConfirmationModal
interface EditJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJobUpdated: () => void;
    job: Job | null;
}

export function EditJobModal({ isOpen, onClose, onJobUpdated, job }: EditJobModalProps) {
    const [formData, setFormData] = useState<JobUpdate>({
        name: '',
        url: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (job && isOpen) {
            setFormData({
                name: job.name || '',
                url: job.url,
            });
            setIsAnimating(true);
        }
    }, [job, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job) return;

        setError('');
        setLoading(true);

        try {
            await jobService.updateJob(job.id, formData);
            onJobUpdated();
            handleClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClose = () => {
        if (!loading) {
            setIsAnimating(false);
            setTimeout(() => {
                setFormData({ name: '', url: '' });
                setError('');
                onClose();
            }, 200);
        }
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !job) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className={`fixed inset-0 transition-all duration-300 ease-out ${isAnimating ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-black/0'
                    }`}
                onClick={handleClose}
            />

            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-out ${isAnimating
                        ? 'scale-100 opacity-100 translate-y-0'
                        : 'scale-95 opacity-0 translate-y-4'
                        }`}
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-3xl opacity-20 blur-sm" />

                    <div className="relative bg-white rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-30 animate-pulse" />
                                    <div className="relative p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                                        <Database className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Edit Job</h2>
                                    <p className="text-sm text-gray-500 mt-1">Update job information</p>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="group p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-50"
                            >
                                <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-200" />
                            </button>
                        </div>

                        {/* Job status info */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Current Status:</p>
                                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getJobStatusColor(job.status)}`}>
                                        {getJobStatusLabel(job.status)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Created</p>
                                    <p className="text-sm font-medium text-gray-700">
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                                    Job Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                    placeholder="e.g., Weekly Review Collection, Competitor Analysis..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="url" className="block text-sm font-semibold text-gray-700">
                                    Source URL
                                </label>
                                <input
                                    id="url"
                                    name="url"
                                    type="url"
                                    value={formData.url}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                    placeholder="https://..."
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center space-x-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="flex-1 px-6 py-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || (formData.name === job.name && formData.url === job.url)}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-3" />
                                            <span className="animate-pulse">Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Database className="h-5 w-5 mr-3" />
                                            Update Job
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface JobDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: Job | null;
    onRetry?: (job: Job) => void;
    onCancel?: (job: Job) => void;
}

export function JobDetailsModal({ isOpen, onClose, job, onRetry, onCancel }: JobDetailsModalProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (job && isOpen) {
            setIsAnimating(true);
            // Get latest job status
            jobService.getJobStatus(job.id)
                .then(setJobStatus)
                .catch(console.error);
        }
    }, [job, isOpen]);

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => {
            setJobStatus(null);
            onClose();
        }, 200);
    };

    const handleRetry = async () => {
        if (!job || !onRetry) return;
        setLoading(true);
        try {
            await onRetry(job);
            handleClose();
        } catch (error) {
            console.error('Retry failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!job || !onCancel) return;
        setLoading(true);
        try {
            await onCancel(job);
            handleClose();
        } catch (error) {
            console.error('Cancel failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReviews = () => {
        window.open(`/reviews?job_id=${job?.id}`, '_blank');
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !job) return null;

    const progress = getJobProgress(job);
    const duration = jobService.getJobDuration(job);
    const status = jobStatus || job;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className={`fixed inset-0 transition-all duration-300 ease-out ${isAnimating ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-black/0'
                    }`}
                onClick={handleClose}
            />

            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-out ${isAnimating
                        ? 'scale-100 opacity-100 translate-y-0'
                        : 'scale-95 opacity-0 translate-y-4'
                        }`}
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-sm" />

                    <div className="relative bg-white rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-30 animate-pulse" />
                                    <div className="relative p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl">
                                        <Eye className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
                                    <p className="text-sm text-gray-500 mt-1">{job.name || 'Unnamed Job'}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                className="group p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-200"
                            >
                                <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-200" />
                            </button>
                        </div>

                        {/* Status Overview */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold border ${getJobStatusColor(status.status)}`}>
                                    {status.status === 'running' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    {status.status === 'completed' && <CheckCircle className="h-4 w-4 mr-2" />}
                                    {status.status === 'failed' && <XCircle className="h-4 w-4 mr-2" />}
                                    {status.status === 'cancelled' && <Pause className="h-4 w-4 mr-2" />}
                                    {getJobStatusLabel(status.status)}
                                </div>

                                {duration && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {duration}
                                    </div>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {isJobActive(status.status) && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                                        <span>Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className="h-full bg-white/20 animate-pulse" />
                                        </div>
                                    </div>
                                    {status.reviews_handled !== undefined && status.total_reviews && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {status.reviews_handled} of {status.total_reviews} reviews scraped
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Completed Job Stats */}
                            {status.status === 'completed' && status.reviews_handled && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-green-800">
                                                ✅ {status.reviews_handled} reviews collected
                                            </p>
                                            <p className="text-sm text-green-600">Job completed successfully</p>
                                        </div>
                                        <button
                                            onClick={handleViewReviews}
                                            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View Reviews
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Failed Job Error */}
                            {status.status === 'failed' && status.error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex items-start space-x-3">
                                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-red-800 mb-1">Job Failed</p>
                                            <p className="text-sm text-red-700 break-words">{status.error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Job Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Information</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Job Type</p>
                                            <p className="text-gray-900 capitalize">{job.job_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Source Type</p>
                                            <p className="text-gray-900 capitalize">{job.source_type} Reviews</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Source URL</p>
                                            <p className="text-gray-900 break-all text-sm">{job.url}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Created</p>
                                            <p className="text-gray-900">{new Date(job.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Timing</h3>
                                    <div className="space-y-3">
                                        {job.started_at && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Started</p>
                                                <p className="text-gray-900">{new Date(job.started_at).toLocaleString()}</p>
                                            </div>
                                        )}
                                        {job.ended_at && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Ended</p>
                                                <p className="text-gray-900">{new Date(job.ended_at).toLocaleString()}</p>
                                            </div>
                                        )}
                                        {duration && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Duration</p>
                                                <p className="text-gray-900">{duration}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                Close
                            </button>

                            {/* View Reviews Button */}
                            {(status.status === 'completed' || status.status === 'partially_completed') && status.reviews_handled && (
                                <button
                                    onClick={handleViewReviews}
                                    className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                                >
                                    <ExternalLink className="h-5 w-5 mr-2" />
                                    View {status.reviews_handled} Reviews
                                </button>
                            )}

                            {/* Cancel Button */}
                            {isJobActive(status.status) && onCancel && (
                                <button
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    ) : (
                                        <Pause className="h-5 w-5 mr-2" />
                                    )}
                                    Cancel Job
                                </button>
                            )}

                            {/* Retry Button */}
                            {(status.status === 'failed' || status.status === 'cancelled') && onRetry && (
                                <button
                                    onClick={handleRetry}
                                    disabled={loading}
                                    className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    ) : (
                                        <RotateCcw className="h-5 w-5 mr-2" />
                                    )}
                                    Retry Job
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface DeleteJobConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    jobName: string;
    loading: boolean;
}

export function DeleteJobConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    jobName,
    loading
}: DeleteJobConfirmationModalProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        }
    }, [isOpen]);

    const handleClose = () => {
        if (!loading) {
            setIsAnimating(false);
            setTimeout(onClose, 200);
        }
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className={`fixed inset-0 transition-all duration-300 ease-out ${isAnimating ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-black/0'
                    }`}
                onClick={handleClose}
            />

            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out ${isAnimating
                        ? 'scale-100 opacity-100 translate-y-0'
                        : 'scale-95 opacity-0 translate-y-4'
                        }`}
                >
                    <div className="p-8 text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl" />
                            <div className="relative w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Job</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{jobName}</strong>?
                            This action cannot be undone and will permanently remove all job data and associated reviews.
                        </p>

                        <div className="flex space-x-4">
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center hover:scale-105 active:scale-95"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Job'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}