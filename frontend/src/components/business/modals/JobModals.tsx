// src/components/business/modals/JobModals.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Play, Loader2, AlertTriangle, Clock, Database, CheckCircle, XCircle, RotateCcw, ExternalLink, Eye, Pause, RefreshCw } from 'lucide-react';
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
        url: '',
        business_id: businessId,
        location_id: null,
        source_id: '',
        source_type: 'google',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            setFormData({
                name: '',
                url: '',
                business_id: businessId,
                location_id: null,
                source_id: '',
                source_type: 'google',
            });
        }
    }, [isOpen, businessId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await jobService.createJob(formData);
            console.log('Job created and launched:', response);
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
                    location_id: null,
                    source_id: '',
                    source_type: 'google',
                });
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

    if (!isOpen) return null;

    const selectedSource = sources.find(s => s.id === formData.source_id);
    const selectedLocation = locations.find(l => l.id === formData.location_id);

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
                                        <Play className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Start New Job</h2>
                                    <p className="text-sm text-gray-500 mt-1">Launch a scraping job from your sources</p>
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
                                    placeholder="e.g., Weekly Review Collection, Competitor Analysis..."
                                />
                                <p className="text-xs text-gray-500">
                                    Leave empty to auto-generate from source name and timestamp
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
                                    disabled={loading || !formData.source_id}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-3" />
                                            <span className="animate-pulse">Launching...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-5 w-5 mr-3" />
                                            Launch Job
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
                                    <h4 className="text-sm font-medium text-green-800 mb-1">Auto-Launch Mode</h4>
                                    <p className="text-xs text-green-700 leading-relaxed">
                                        Jobs start automatically when created. You'll be able to track progress in real-time and cancel if needed.
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
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400