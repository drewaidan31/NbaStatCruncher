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
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Player operations
  getAllPlayers(): Promise<Player[]>;
  getPlayerById(id: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined>;
  deleteAllPlayers(): Promise<void>;
  
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
  updateCustomStat(statId: number, userId: string, updates: { name?: string; formula?: string; description?: string }): Promise<CustomStat | null>;
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
    const [savedStat] = await db
      .insert(customStats)
      .values(stat)
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

  async updateCustomStat(statId: number, userId: string, updates: { name?: string; formula?: string; description?: string }): Promise<CustomStat | null> {
    const [updatedStat] = await db
      .update(customStats)
      .set(updates)
      .where(and(eq(customStats.id, statId), eq(customStats.userId, userId)))
      .returning();
    return updatedStat || null;
  }
}

export const storage = new DatabaseStorage();
