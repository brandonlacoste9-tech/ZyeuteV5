/**
 * BUSINESS REPOSITORY
 * 
 * Placeholder for Planexo business profile operations.
 * TODO: Implement business CRUD operations once Planexo business schema is defined
 */

// TODO: Define business types based on Planexo requirements
export interface Business {
  id: string;
  userId: string; // Owner of the business
  name: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  // Add more fields as needed
}

export interface InsertBusiness {
  userId: string;
  name: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
}

export class BusinessRepository {
  // TODO: Implement once business schema is created
  async getById(id: string): Promise<Business | undefined> {
    throw new Error("Not yet implemented - business schema needed");
  }

  async getByUserId(userId: string): Promise<Business | undefined> {
    throw new Error("Not yet implemented - business schema needed");
  }

  async create(business: InsertBusiness): Promise<Business> {
    throw new Error("Not yet implemented - business schema needed");
  }

  async update(id: string, updates: Partial<Business>): Promise<Business | undefined> {
    throw new Error("Not yet implemented - business schema needed");
  }
}

export const businessRepository = new BusinessRepository();
