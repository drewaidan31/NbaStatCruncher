import { pgTable, text, serial, real, integer, varchar, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core";
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
  fieldGoalAttempts: real("field_goal_attempts").notNull().default(0),
  threePointPercentage: real("three_point_percentage").notNull().default(0),
  threePointAttempts: real("three_point_attempts").notNull().default(0),
  freeThrowPercentage: real("free_throw_percentage").notNull().default(0),
  freeThrowAttempts: real("free_throw_attempts").notNull().default(0),
  plusMinus: real("plus_minus").notNull().default(0),
  winPercentage: real("win_percentage").notNull().default(0),
  currentSeason: text("current_season"),
  seasons: jsonb("seasons"),
  availableSeasons: text("available_seasons").array(),
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

// Favorite players table
export const favoritePlayers = pgTable("favorite_players", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  playerId: integer("player_id").notNull(),
  playerName: varchar("player_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("unique_user_player").on(table.userId, table.playerId),
]);

export const customStats = pgTable("custom_stats", {
  id: serial("id").primaryKey(),
  formula: text("formula").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id),
  isPublic: integer("is_public").default(0), // 0 = private, 1 = public
  createdAt: timestamp("created_at").defaultNow(),
});

// Player awards table
export const playerAwards = pgTable("player_awards", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  playerName: text("player_name").notNull(),
  season: text("season").notNull(),
  award: text("award").notNull(),
  winner: text("winner").notNull(), // TRUE/FALSE
  share: real("share"), // Voting share
  ptsWon: real("pts_won"), // Points won in voting
  ptsMax: real("pts_max"), // Maximum possible points
  first: real("first"), // First place votes
  team: text("team"),
  age: integer("age"),
});

// All-Star selections table
export const allStarSelections = pgTable("all_star_selections", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  team: text("team").notNull(),
  conference: text("conference").notNull(), // East/West or team captain name
  season: text("season").notNull(),
  replaced: text("replaced").notNull(), // TRUE/FALSE
});

// End of season teams (All-NBA, All-Defense, All-Rookie)
export const endOfSeasonTeams = pgTable("end_of_season_teams", {
  id: serial("id").primaryKey(),
  season: text("season").notNull(),
  type: text("type").notNull(), // All-NBA, All-Defense, All-Rookie
  team: text("team").notNull(), // 1st, 2nd, 3rd, ORV (other receiving votes)
  position: text("position"),
  playerName: text("player_name").notNull(),
  age: integer("age"),
  team_abbr: text("team_abbr"),
  ptsWon: integer("pts_won"),
  ptsMax: integer("pts_max"),
  share: real("share"),
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
}).extend({
  isPublic: z.boolean().optional(),
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
export type FavoritePlayer = typeof favoritePlayers.$inferSelect;
export type InsertFavoritePlayer = typeof favoritePlayers.$inferInsert;
export type PlayerAward = typeof playerAwards.$inferSelect;
export type AllStarSelection = typeof allStarSelections.$inferSelect;
export type EndOfSeasonTeam = typeof endOfSeasonTeams.$inferSelect;

// NBA Stat mappings for formula parsing
export const NBA_STAT_MAPPINGS = {
  'PTS': 'points',
  'AST': 'assists', 
  'REB': 'rebounds',
  'TOV': 'turnovers',
  'PLUS_MINUS': 'plusMinus',
  'FG_PCT': 'fieldGoalPercentage',
  'FGA': 'fieldGoalAttempts',
  'FT_PCT': 'freeThrowPercentage',
  'FTA': 'freeThrowAttempts',
  'THREE_PCT': 'threePointPercentage',
  '3PA': 'threePointAttempts',
  'MIN': 'minutesPerGame',
  'STL': 'steals',
  'BLK': 'blocks',
  'GP': 'gamesPlayed',
  'W_PCT': 'winPercentage',
} as const;

export const NBA_STAT_DESCRIPTIONS = {
  'PTS': 'Points per game',
  'AST': 'Assists per game',
  'REB': 'Rebounds per game', 
  'TOV': 'Turnovers per game',
  'PLUS_MINUS': 'Plus/Minus',
  'FG_PCT': 'Field Goal Percentage',
  'FGA': 'Field Goal Attempts per game',
  'FT_PCT': 'Free Throw Percentage',
  'FTA': 'Free Throw Attempts per game',
  'THREE_PCT': 'Three Point Percentage',
  '3PA': 'Three Point Attempts per game',
  'MIN': 'Minutes per game',
  'STL': 'Steals per game',
  'BLK': 'Blocks per game',
  'GP': 'Games Played',
  'W_PCT': 'Win Percentage when player plays',
} as const;
