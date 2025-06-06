// Simple working calculation endpoint
import { evaluate } from "mathjs";

export function setupCalculationEndpoint(app: any, storage: any) {
  app.post("/api/custom-stats/calculate", async (req: any, res: any) => {
    try {
      const { formula } = req.body;
      
      if (!formula) {
        return res.status(400).json({ message: "Formula is required" });
      }

      console.log("Processing formula:", formula);

      const allPlayers = await storage.getAllPlayers();
      const results: any[] = [];

      for (const player of allPlayers) {
        try {
          const context = {
            PTS: Number(player.points) || 0,
            AST: Number(player.assists) || 0,
            REB: Number(player.rebounds) || 0,
            TOV: Number(player.turnovers) || 0,
            PLUS_MINUS: Number(player.plusMinus) || 0,
            FG_PCT: Number(player.fieldGoalPercentage) || 0,
            FGA: Math.max(Number(player.fieldGoalAttempts) || 0, 0.1),
            FT_PCT: Number(player.freeThrowPercentage) || 0,
            FTA: Number(player.freeThrowAttempts) || 0,
            THREE_PCT: Number(player.threePointPercentage) || 0,
            '3P_PCT': Number(player.threePointPercentage) || 0,
            '3PA': Number(player.threePointAttempts) || 0,
            MIN: Math.max(Number(player.minutesPerGame) || 0, 0.1),
            STL: Number(player.steals) || 0,
            BLK: Number(player.blocks) || 0,
            GP: Math.max(Number(player.gamesPlayed) || 0, 1),
            W_PCT: Number(player.winPercentage) || 0
          };

          const customStat = evaluate(formula, context);
          
          if (typeof customStat === 'number' && !isNaN(customStat) && isFinite(customStat)) {
            results.push({
              playerId: player.playerId,
              name: player.name,
              team: player.team,
              customStat: Math.round(customStat * 100) / 100,
              points: player.points,
              assists: player.assists,
              rebounds: player.rebounds,
              rank: 0
            });
          }
        } catch (err) {
          continue;
        }
      }

      results.sort((a, b) => b.customStat - a.customStat);
      results.forEach((result, index) => {
        result.rank = index + 1;
      });

      console.log(`Returning ${results.length} results`);
      res.json(results.slice(0, 100));
    } catch (error) {
      console.error("Calculation error:", error);
      res.status(500).json({ message: "Calculation failed" });
    }
  });
}