// src/components/business/modals/LocationModals.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { Location, LocationCreate, LocationUpdate } from '@/services/location';

interface AddLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLocationCreated: () => void;
    businessId: string;
}

export function AddLocationModal({ isOpen, onClose, onLocationCreated, businessId }: AddLocationModalProps) {
    const [formData, setFormData] = useState<LocationCreate>({
        name: '',
        adresse: '',
        business_id: businessId,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            setFormData({
                name: '',
                adresse: '',
                business_id: businessId,
            });
        }
    }, [isOpen, businessId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { locationService } = await import('@/services/location');
            await locationService.createLocation(formData);
            onLocationCreated();
            handleClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleClose = () => {
        if (!loading) {
            setIsAnimating(false);
            setTimeout(() => {
                setFormData({ name: '', adresse: '', business_id: businessId });
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
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-3xl opacity-20 blur-sm" />

                    <div className="relative bg-white rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-30 animate-pulse" />
                                    <div className="relative p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl">
                                        <MapPin className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Add New Location</h2>
                                    <p className="text-sm text-gray-500 mt-1">Set up a new business location</p>
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
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                                    Location Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                    placeholder="e.g., Downtown Store, Main Branch..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="adresse" className="block text-sm font-semibold text-gray-700">
                                    Address
                                </label>
                                <textarea
                                    id="adresse"
                                    name="adresse"
                                    required
                                    value={formData.adresse}
                                    onChange={handleChange}
                                    disabled={loading}
                                    rows={3}
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                                    placeholder="Enter the full address of this location..."
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
                                    disabled={loading || !formData.name.trim() || !formData.adresse.trim()}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-3" />
                                            <span className="animate-pulse">Adding...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="h-5 w-5 mr-3" />
                                            Add Location
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

interface EditLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLocationUpdated: () => void;
    location: Location | null;
}

export function EditLocationModal({ isOpen, onClose, onLocationUpdated, location }: EditLocationModalProps) {
    const [formData, setFormData] = useState<LocationUpdate>({
        name: '',
        adresse: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (location && isOpen) {
            setFormData({
                name: location.name,
                adresse: location.adresse,
            });
            setIsAnimating(true);
        }
    }, [location, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!location) return;

        setError('');
        setLoading(true);

        try {
            const { locationService } = await import('@/services/location');
            await locationService.updateLocation(location.id, formData);
            onLocationUpdated();
            handleClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleClose = () => {
        if (!loading) {
            setIsAnimating(false);
            setTimeout(() => {
                setFormData({ name: '', adresse: '' });
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

    if (!isOpen || !location) return null;

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
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-3xl opacity-20 blur-sm" />

                    <div className="relative bg-white rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-30 animate-pulse" />
                                    <div className="relative p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl">
                                        <MapPin className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Edit Location</h2>
                                    <p className="text-sm text-gray-500 mt-1">Update location information</p>
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
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                                    Location Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                    placeholder="e.g., Downtown Store, Main Branch..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="adresse" className="block text-sm font-semibold text-gray-700">
                                    Address
                                </label>
                                <textarea
                                    id="adresse"
                                    name="adresse"
                                    required
                                    value={formData.adresse}
                                    onChange={handleChange}
                                    disabled={loading}
                                    rows={3}
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                                    placeholder="Enter the full address of this location..."
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
                                    disabled={loading || !formData.name?.trim() || !formData.adresse?.trim() ||
                                        (formData.name === location.name && formData.adresse === location.adresse)}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-3" />
                                            <span className="animate-pulse">Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="h-5 w-5 mr-3" />
                                            Update Location
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

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    locationName: string;
    loading: boolean;
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    locationName,
    loading
}: DeleteConfirmationModalProps) {
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

                        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Location</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{locationName}</strong>?
                            This action cannot be undone and will also remove any associated sources and reviews.
                        </p>

                        <div className="flex space-x-4">
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Location'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}