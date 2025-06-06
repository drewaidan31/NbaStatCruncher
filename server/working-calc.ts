import { evaluate } from "mathjs";

export const workingCalculateEndpoint = `
  // WORKING calculation endpoint
  app.post("/api/nba/calculate", async (req, res) => {
    try {
      const { formula } = req.body;
      
      if (!formula) {
        return res.status(400).json({ message: "Formula is required" });
      }

      const allPlayers = await storage.getAllPlayers();
      const results: any[] = [];

      for (const player of allPlayers) {
        try {
          // Fix problematic variable names for mathjs
          let cleanFormula = formula
            .replace(/3P_PCT/g, 'THREE_PCT')
            .replace(/3PA/g, 'THREE_PA')
            .replace(/3P/g, 'THREE_P');
          
          const context: any = {
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
            THREE_PA: Number(player.threePointAttempts) || 0,
            THREE_P: Number(player.threePointAttempts) || 0,
            MIN: Math.max(Number(player.minutesPerGame) || 0, 0.1),
            STL: Number(player.steals) || 0,
            BLK: Number(player.blocks) || 0,
            GP: Math.max(Number(player.gamesPlayed) || 0, 1),
            W_PCT: Number(player.winPercentage) || 0
          };

          const customStat = evaluate(cleanFormula, context);
          
          if (typeof customStat === 'number' && !isNaN(customStat) && isFinite(customStat)) {
            results.push({
              rank: 0,
              name: player.name,
              team: player.team,
              position: player.position,
              value: Math.round(customStat * 100) / 100,
              points: player.points,
              assists: player.assists,
              rebounds: player.rebounds,
              gamesPlayed: player.gamesPlayed
            });
          }
        } catch (err) {
          continue;
        }
      }

      results.sort((a, b) => b.value - a.value);
      results.forEach((result, index) => {
        result.rank = index + 1;
      });

      console.log(\`Returning \${results.length} results\`);
      res.json(results.slice(0, 100));
    } catch (error) {
      console.error("Calculation error:", error);
      res.status(500).json({ message: "Calculation failed" });
    }
  });
`;