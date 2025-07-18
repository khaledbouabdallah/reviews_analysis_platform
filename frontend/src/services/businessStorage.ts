// src/services/businessStorage.ts
export class BusinessStorageService {
  private static readonly BUSINESS_KEY = 'selected_business_id';

  static setCurrentBusiness(businessId: string): void {
    sessionStorage.setItem(this.BUSINESS_KEY, businessId);
  }

  static getCurrentBusiness(): string | null {
    return sessionStorage.getItem(this.BUSINESS_KEY);
  }

  static clearCurrentBusiness(): void {
    sessionStorage.removeItem(this.BUSINESS_KEY);
  }
}

export const businessStorageService = new BusinessStorageService();