import { 
  nbaPlayers, 
  customStats, 
  users,
  type Player, 
  type InsertPlayer, 
  type CustomStat, 
  type InsertCustomStat,
  type User,
  type UpsertUser,
  type SaveCustomStat
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Player operations
  getAllPlayers(): Promise<Player[]>;
  getPlayerById(id: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined>;
  deleteAllPlayers(): Promise<void>;
  clearAllPlayers(): Promise<void>;
  
  // Custom stat operations
  getCustomStats(): Promise<CustomStat[]>;
  createCustomStat(stat: InsertCustomStat): Promise<CustomStat>;
  
  // User operations for authentication
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Saved custom stats operations
  saveCustomStat(stat: SaveCustomStat): Promise<CustomStat>;
  getUserCustomStats(userId: string): Promise<CustomStat[]>;
  deleteCustomStat(statId: number, userId: string): Promise<boolean>;
  updateCustomStat(statId: number, userId: string, updates: { name?: string; formula?: string; description?: string; isPublic?: boolean }): Promise<CustomStat | null>;
  removeDuplicateCustomStats(userId: string): Promise<number>;
  
  // Community stats operations
  getPublicCustomStats(): Promise<(CustomStat & { user: User })[]>;
  toggleStatVisibility(statId: number, userId: string, isPublic: boolean): Promise<CustomStat | null>;
}

export class DatabaseStorage implements IStorage {
  // Player operations
  async getAllPlayers(): Promise<Player[]> {
    return await db.select().from(nbaPlayers);
  }

  async getPlayerById(id: number): Promise<Player | undefined> {
    const [player] = await db.select().from(nbaPlayers).where(eq(nbaPlayers.id, id));
    return player || undefined;
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(nbaPlayers)
      .values(insertPlayer)
      .returning();
    return player;
  }

  async updatePlayer(id: number, playerUpdate: Partial<InsertPlayer>): Promise<Player | undefined> {
    const [player] = await db
      .update(nbaPlayers)
      .set(playerUpdate)
      .where(eq(nbaPlayers.id, id))
      .returning();
    return player || undefined;
  }

  async deleteAllPlayers(): Promise<void> {
    await db.delete(nbaPlayers);
  }

  async clearAllPlayers(): Promise<void> {
    await db.delete(nbaPlayers);
  }

  // Custom stat operations
  async getCustomStats(): Promise<CustomStat[]> {
    return await db.select().from(customStats);
  }

  async createCustomStat(insertCustomStat: InsertCustomStat): Promise<CustomStat> {
    const [customStat] = await db
      .insert(customStats)
      .values(insertCustomStat)
      .returning();
    return customStat;
  }

  // User operations for authentication
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Saved custom stats operations
  async saveCustomStat(stat: SaveCustomStat): Promise<CustomStat> {
    const insertData: any = { ...stat };
    if (stat.isPublic !== undefined) {
      insertData.isPublic = stat.isPublic ? 1 : 0;
    }
    
    const [savedStat] = await db
      .insert(customStats)
      .values(insertData)
      .returning();
    return savedStat;
  }

  async getUserCustomStats(userId: string): Promise<CustomStat[]> {
    return await db
      .select()
      .from(customStats)
      .where(eq(customStats.userId, userId));
  }

  async deleteCustomStat(statId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(customStats)
      .where(and(eq(customStats.id, statId), eq(customStats.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateCustomStat(statId: number, userId: string, updates: { name?: string; formula?: string; description?: string; isPublic?: boolean }): Promise<CustomStat | null> {
    const updateData: any = { ...updates };
    if (updates.isPublic !== undefined) {
      updateData.isPublic = updates.isPublic ? 1 : 0;
    }
    
    const [updatedStat] = await db
      .update(customStats)
      .set(updateData)
      .where(and(eq(customStats.id, statId), eq(customStats.userId, userId)))
      .returning();
    return updatedStat || null;
  }

  async removeDuplicateCustomStats(userId: string): Promise<number> {
    // Get all user's custom stats
    const userStats = await this.getUserCustomStats(userId);
    
    // Group by name + formula combination
    const statGroups = new Map<string, CustomStat[]>();
    userStats.forEach(stat => {
      const key = `${stat.name}|${stat.formula}`;
      if (!statGroups.has(key)) {
        statGroups.set(key, []);
      }
      statGroups.get(key)!.push(stat);
    });
    
    // Remove duplicates (keep the first one, delete the rest)
    let duplicatesRemoved = 0;
    for (const [key, stats] of Array.from(statGroups.entries())) {
      if (stats.length > 1) {
        // Sort by creation date and keep the first one
        stats.sort((a: CustomStat, b: CustomStat) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
        const toDelete = stats.slice(1); // Remove all except the first
        
        for (const stat of toDelete) {
          await db
            .delete(customStats)
            .where(and(eq(customStats.id, stat.id), eq(customStats.userId, userId)));
          duplicatesRemoved++;
        }
      }
    }
    
    return duplicatesRemoved;
  }

  // Community stats operations
  async getPublicCustomStats(): Promise<(CustomStat & { user: User })[]> {
    const result = await db
      .select({
        id: customStats.id,
        name: customStats.name,
        formula: customStats.formula,
        description: customStats.description,
        userId: customStats.userId,
        isPublic: customStats.isPublic,
        createdAt: customStats.createdAt,
        user: users
      })
      .from(customStats)
      .innerJoin(users, eq(customStats.userId, users.id))
      .where(eq(customStats.isPublic, 1))
      .orderBy(desc(customStats.createdAt));

    return result.map(row => ({
      id: row.id,
      name: row.name,
      formula: row.formula,
      description: row.description,
      userId: row.userId,
      isPublic: row.isPublic,
      createdAt: row.createdAt,
      user: row.user
    }));
  }

  async toggleStatVisibility(statId: number, userId: string, isPublic: boolean): Promise<CustomStat | null> {
    const [updatedStat] = await db
      .update(customStats)
      .set({ isPublic: isPublic ? 1 : 0 })
      .where(and(eq(customStats.id, statId), eq(customStats.userId, userId)))
      .returning();
    return updatedStat || null;
  }
}

export const storage = new DatabaseStorage();
