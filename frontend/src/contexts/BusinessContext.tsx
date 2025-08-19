// src/contexts/BusinessContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Business } from '../services/business'
import { useBusinesses } from '../hooks/useBusinesses'

interface BusinessContextType {
    selectedBusiness: Business | null
    setSelectedBusiness: (business: Business | null) => void
    // React Query provides these now:
    businesses: Business[]
    isLoading: boolean
    error: Error | null
    hasBusinesses: boolean
    refreshBusinesses: () => void
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

interface BusinessProviderProps {
    children: ReactNode
}

export function BusinessProvider({ children }: BusinessProviderProps) {
    // ✅ LOCAL STATE: Just track which business is selected
    const [selectedBusiness, setSelectedBusinessState] = useState<Business | null>(null)

    // ✅ SERVER STATE: Let React Query handle data fetching
    const {
        data: businesses = [],
        isLoading,
        error,
        refetch: refreshBusinesses
    } = useBusinesses()

    // ✅ DERIVED STATE: Computed from React Query data
    const hasBusinesses = businesses.length > 0

    // Auto-select business when data loads
    useEffect(() => {
        if (businesses.length > 0 && !selectedBusiness) {
            // Try to restore from localStorage
            const savedBusinessId = localStorage.getItem('selectedBusinessId')

            if (savedBusinessId) {
                const savedBusiness = businesses.find(b => b.id === savedBusinessId)
                if (savedBusiness) {
                    setSelectedBusinessState(savedBusiness)
                    return
                }
            }

            // No saved selection or saved business not found, select first
            setSelectedBusinessState(businesses[0])
        }
    }, [businesses, selectedBusiness])

    // Update selection with localStorage persistence
    const setSelectedBusiness = (business: Business | null) => {
        setSelectedBusinessState(business)

        if (business) {
            localStorage.setItem('selectedBusinessId', business.id)
        } else {
            localStorage.removeItem('selectedBusinessId')
        }
    }

    return (
        <BusinessContext.Provider value={{
            selectedBusiness,
            setSelectedBusiness,
            businesses,        // From React Query
            isLoading,         // From React Query  
            error,             // From React Query
            hasBusinesses,     // Computed
            refreshBusinesses, // From React Query
        }}>
            {children}
        </BusinessContext.Provider>
    )
}

export function useBusiness() {
    const context = useContext(BusinessContext)
    if (context === undefined) {
        throw new Error('useBusiness must be used within a BusinessProvider')
    }
    return context
}