import { pgTable, text, serial, real, integer, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const nbaPlayers = pgTable("nba_players", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().unique(),
  name: text("name").notNull(),
  team: text("team").notNull(),
  position: text("position").notNull(),
  gamesPlayed: integer("games_played").notNull().default(0),
  minutesPerGame: real("minutes_per_game").notNull().default(0),
  points: real("points").notNull().default(0),
  assists: real("assists").notNull().default(0),
  rebounds: real("rebounds").notNull().default(0),
  steals: real("steals").notNull().default(0),
  blocks: real("blocks").notNull().default(0),
  turnovers: real("turnovers").notNull().default(0),
  fieldGoalPercentage: real("field_goal_percentage").notNull().default(0),
  threePointPercentage: real("three_point_percentage").notNull().default(0),
  freeThrowPercentage: real("free_throw_percentage").notNull().default(0),
  plusMinus: real("plus_minus").notNull().default(0),
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for accounts
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customStats = pgTable("custom_stats", {
  id: serial("id").primaryKey(),
  formula: text("formula").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(nbaPlayers).omit({
  id: true,
});

export const insertCustomStatSchema = createInsertSchema(customStats).omit({
  id: true,
  createdAt: true,
});

export const upsertUserSchema = createInsertSchema(users);
export const saveCustomStatSchema = createInsertSchema(customStats).omit({
  id: true,
  createdAt: true,
});

export const formulaCalculationSchema = z.object({
  formula: z.string().min(1, "Formula is required"),
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof nbaPlayers.$inferSelect;
export type InsertCustomStat = z.infer<typeof insertCustomStatSchema>;
export type CustomStat = typeof customStats.$inferSelect;
export type FormulaCalculation = z.infer<typeof formulaCalculationSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type SaveCustomStat = z.infer<typeof saveCustomStatSchema>;

// NBA Stat mappings for formula parsing
export const NBA_STAT_MAPPINGS = {
  'PTS': 'points',
  'AST': 'assists', 
  'REB': 'rebounds',
  'TOV': 'turnovers',
  'PLUS_MINUS': 'plusMinus',
  'FG_PCT': 'fieldGoalPercentage',
  'FT_PCT': 'freeThrowPercentage',
  'THREE_PCT': 'threePointPercentage',
  'MIN': 'minutesPerGame',
  'MPG': 'minutesPerGame',
  'STL': 'steals',
  'BLK': 'blocks',
  'GP': 'gamesPlayed',
} as const;

export const NBA_STAT_DESCRIPTIONS = {
  'PTS': 'Points per game',
  'AST': 'Assists per game',
  'REB': 'Rebounds per game', 
  'TOV': 'Turnovers per game',
  'PLUS_MINUS': 'Plus/Minus',
  'FG_PCT': 'Field Goal Percentage',
  'FT_PCT': 'Free Throw Percentage',
  'THREE_PCT': 'Three Point Percentage',
  'MIN': 'Minutes per game',
  'MPG': 'Minutes per game',
  'STL': 'Steals per game',
  'BLK': 'Blocks per game',
  'GP': 'Games Played',
} as const;
