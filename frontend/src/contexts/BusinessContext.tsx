// src/contexts/BusinessContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { businessService, Business } from '../services/business';

interface BusinessContextType {
    selectedBusiness: Business | null;
    businesses: Business[];
    setSelectedBusiness: (business: Business | null) => void;
    refreshBusinesses: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
    hasBusinesses: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

interface BusinessProviderProps {
    children: ReactNode;
}

export function BusinessProvider({ children }: BusinessProviderProps) {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [selectedBusiness, setSelectedBusinessState] = useState<Business | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // **CHANGED: Use businessService instead of fake data**
    const fetchBusinesses = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const businessData = await businessService.getBusinesses();
            setBusinesses(businessData);

            // Restore last selected business from localStorage
            const savedBusinessId = localStorage.getItem('selectedBusinessId');
            if (savedBusinessId && businessData.length > 0) {
                const savedBusiness = businessData.find(b => b.id === savedBusinessId);
                if (savedBusiness) {
                    setSelectedBusinessState(savedBusiness);
                } else {
                    // If saved business not found, select first business
                    setSelectedBusinessState(businessData[0]);
                }
            } else if (businessData.length > 0) {
                // No saved selection, select first business
                setSelectedBusinessState(businessData[0]);
            }
        } catch (err) {
            console.error('Failed to fetch businesses:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch businesses');
            setBusinesses([]);
        } finally {
            setIsLoading(false);
        }
    };

    // **CHANGED: Expose refresh function for external use**
    const refreshBusinesses = async () => {
        await fetchBusinesses();
    };

    // Load businesses on mount
    useEffect(() => {
        fetchBusinesses();
    }, []);

    const setSelectedBusiness = (business: Business | null) => {
        setSelectedBusinessState(business);
        // Save to localStorage for persistence
        if (business) {
            localStorage.setItem('selectedBusinessId', business.id);
        } else {
            localStorage.removeItem('selectedBusinessId');
        }
    };

    const hasBusinesses = businesses.length > 0;

    return (
        <BusinessContext.Provider value={{
            selectedBusiness,
            businesses,
            setSelectedBusiness,
            refreshBusinesses, // **NEW: Allow external refresh**
            isLoading,
            error, // **NEW: Expose error state**
            hasBusinesses
        }}>
            {children}
        </BusinessContext.Provider>
    );
}

export function useBusiness() {
    const context = useContext(BusinessContext);
    if (context === undefined) {
        throw new Error('useBusiness must be used within a BusinessProvider');
    }
    return context;
}