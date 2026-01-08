/**
 * USER REPOSITORY
 * 
 * Centralizes all user-related database operations.
 * Uses the storage interface for now, but can be swapped to direct DB calls when needed.
 */

import { storage } from "../storage.js";
import type { User, InsertUser } from "../../shared/schema.js";

export class UserRepository {
  async getById(id: string): Promise<User | undefined> {
    return await storage.getUser(id);
  }

  async getByUsername(username: string): Promise<User | undefined> {
    return await storage.getUserByUsername(username);
  }

  async getByEmail(email: string): Promise<User | undefined> {
    return await storage.getUserByEmail(email);
  }

  async create(user: InsertUser & { id: string }): Promise<User> {
    return await storage.createUser(user);
  }

  async update(id: string, updates: Partial<User>): Promise<User | undefined> {
    return await storage.updateUser(id, updates);
  }

  async getHive(userId: string): Promise<string> {
    return await storage.getUserHive(userId);
  }
}

export const userRepository = new UserRepository();
