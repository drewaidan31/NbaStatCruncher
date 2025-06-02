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
import { eq } from "drizzle-orm";

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
}

export class MemStorage implements IStorage {
  private players: Map<number, Player>;
  private customStatsList: Map<number, CustomStat>;
  private currentPlayerId: number;
  private currentCustomStatId: number;

  constructor() {
    this.players = new Map();
    this.customStatsList = new Map();
    this.currentPlayerId = 1;
    this.currentCustomStatId = 1;
  }

  async getAllPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async getPlayerById(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.currentPlayerId++;
    const player: Player = { ...insertPlayer, id };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: number, playerUpdate: Partial<InsertPlayer>): Promise<Player | undefined> {
    const existingPlayer = this.players.get(id);
    if (!existingPlayer) {
      return undefined;
    }
    
    const updatedPlayer: Player = { ...existingPlayer, ...playerUpdate };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  async deleteAllPlayers(): Promise<void> {
    this.players.clear();
    this.currentPlayerId = 1;
  }

  async getCustomStats(): Promise<CustomStat[]> {
    return Array.from(this.customStatsList.values());
  }

  async createCustomStat(insertCustomStat: InsertCustomStat): Promise<CustomStat> {
    const id = this.currentCustomStatId++;
    const customStat: CustomStat = { 
      ...insertCustomStat, 
      id,
      createdAt: new Date().toISOString()
    };
    this.customStatsList.set(id, customStat);
    return customStat;
  }
}

export const storage = new MemStorage();
