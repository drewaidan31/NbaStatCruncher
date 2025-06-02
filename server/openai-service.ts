import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateStatName(formula: string): Promise<{ name: string; description: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an NBA statistics expert who creates catchy, memorable names for custom basketball stats. 
          
          Given a formula using NBA stats (PTS=points, AST=assists, REB=rebounds, TOV=turnovers, STL=steals, BLK=blocks, FG_PCT=field goal %, THREE_PCT=3-point %, FT_PCT=free throw %, PLUS_MINUS=plus/minus, MIN=minutes), create:
          
          1. A short, catchy name (2-4 words max) that captures what the stat measures
          2. A brief description (1-2 sentences) explaining what it represents
          
          Make names creative but clear - think like ESPN stat names. Avoid generic terms like "Custom Stat" or "Player Rating".
          
          Respond with JSON in this exact format: { "name": "short catchy name", "description": "brief explanation" }`
        },
        {
          role: "user",
          content: `Create a name and description for this NBA stat formula: ${formula}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      name: result.name || "Custom Stat",
      description: result.description || "Custom basketball statistic"
    };
  } catch (error) {
    console.error("Error generating stat name:", error);
    return {
      name: "Custom Stat",
      description: "Custom basketball statistic"
    };
  }
}