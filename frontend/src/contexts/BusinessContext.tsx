// src/contexts/BusinessContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Business {
    id: string;
    name: string;
    // TODO: Add other business properties as needed
}

interface BusinessContextType {
    selectedBusiness: Business | null;
    businesses: Business[];
    setSelectedBusiness: (business: Business | null) => void;
    isLoading: boolean;
    hasBusinesses: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

// TODO: Replace with real API calls
const FAKE_BUSINESSES: Business[] = [
    { id: '1', name: 'Downtown Restaurant' },
    { id: '2', name: 'Tech Solutions Inc' },
    { id: '3', name: 'Coffee Shop Chain' },
];

interface BusinessProviderProps {
    children: ReactNode;
}

export function BusinessProvider({ children }: BusinessProviderProps) {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [selectedBusiness, setSelectedBusinessState] = useState<Business | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load businesses from API on mount
    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                setIsLoading(true);
                // TODO: Replace with real API call
                // const response = await fetch('/api/businesses');
                // const businessData = await response.json();

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 500));
                setBusinesses(FAKE_BUSINESSES);

                // Restore last selected business from localStorage
                const savedBusinessId = localStorage.getItem('selectedBusinessId');
                if (savedBusinessId && FAKE_BUSINESSES.length > 0) {
                    const savedBusiness = FAKE_BUSINESSES.find(b => b.id === savedBusinessId);
                    if (savedBusiness) {
                        setSelectedBusinessState(savedBusiness);
                    } else {
                        // If saved business not found, select first business
                        setSelectedBusinessState(FAKE_BUSINESSES[0]);
                    }
                } else if (FAKE_BUSINESSES.length > 0) {
                    // No saved selection, select first business
                    setSelectedBusinessState(FAKE_BUSINESSES[0]);
                }
            } catch (error) {
                console.error('Failed to fetch businesses:', error);
                setBusinesses([]);
            } finally {
                setIsLoading(false);
            }
        };

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
            isLoading,
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