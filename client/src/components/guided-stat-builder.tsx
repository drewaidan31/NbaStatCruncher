import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Wand2, Calculator, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface GuidedStatBuilderProps {
  onBack: () => void;
  onStatCreated?: () => void;
}

interface StatWeights {
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
  turnovers: number;
  fouls: number;
}

interface PlayerPreferences {
  playstyles: string[];
  teamSuccess: boolean;
  efficiency: boolean;
  durability: boolean;
  clutchPerformance: boolean;
  minimizeTO: boolean;
  rewardMinutes: boolean;
  emphasizeDefense: boolean;
  penalizeFouls: boolean;
}

export default function GuidedStatBuilder({ onBack, onStatCreated }: GuidedStatBuilderProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [statName, setStatName] = useState("");
  const [preferences, setPreferences] = useState<PlayerPreferences>({
    playstyles: [],
    teamSuccess: false,
    efficiency: false,
    durability: false,
    clutchPerformance: false,
    minimizeTO: false,
    rewardMinutes: false,
    emphasizeDefense: false,
    penalizeFouls: false
  });
  
  const [weights, setWeights] = useState<StatWeights>({
    points: 3,
    assists: 3,
    rebounds: 3,
    steals: 3,
    blocks: 3,
    fieldGoalPct: 3,
    threePointPct: 3,
    freeThrowPct: 3,
    turnovers: 3,
    fouls: 3
  });

  const [generatedFormula, setGeneratedFormula] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [previewResults, setPreviewResults] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const generateFormula = () => {
    let components: string[] = [];
    let efficiencyMultipliers: string[] = [];
    let archetypeComponents: string[] = [];

    // Helper function to format multipliers to one decimal place
    const formatMultiplier = (value: number): string => {
      return (Math.round(value * 10) / 10).toFixed(1);
    };

    // Core stat components with proper weighting (one decimal place)
    if (weights.points > 1) {
      const multiplier = weights.points * 0.4;
      components.push(`PTS * ${formatMultiplier(multiplier)}`);
    }

    if (weights.assists > 1) {
      const multiplier = weights.assists * 0.6;
      components.push(`AST * ${formatMultiplier(multiplier)}`);
    }

    if (weights.rebounds > 1) {
      const multiplier = weights.rebounds * 0.5;
      components.push(`REB * ${formatMultiplier(multiplier)}`);
    }

    if (weights.steals > 1) {
      const multiplier = weights.steals * 0.8;
      components.push(`STL * ${formatMultiplier(multiplier)}`);
    }

    if (weights.blocks > 1) {
      const multiplier = weights.blocks * 0.9;
      components.push(`BLK * ${formatMultiplier(multiplier)}`);
    }

    // Archetype-specific mechanics with specific formulas for each type
    if (preferences.playstyles.includes("outside-shooter")) {
      // Three-point shooting emphasis with 3PA/FGA rate
      if (weights.threePointPct >= 3) {
        archetypeComponents.push(`3PA * ${formatMultiplier(weights.threePointPct * 0.3)}`);
        archetypeComponents.push(`3P_PCT * ${formatMultiplier(weights.threePointPct)}`);
      }
      archetypeComponents.push("(3PA / FGA) * 3.0"); // Reward 3P attempt rate
    }
    
    if (preferences.playstyles.includes("slasher")) {
      // Reward attacking the rim with inside shots
      archetypeComponents.push("(FGA - 3PA) * 0.8"); // Inside attempts
      if (weights.freeThrowPct >= 3) {
        archetypeComponents.push(`FTA * ${formatMultiplier(weights.freeThrowPct * 0.4)}`);
      }
    }

    if (preferences.playstyles.includes("post-player")) {
      // Inside game emphasis with non-3P shots
      archetypeComponents.push("(FGA - 3PA) * 1.2"); // Inside shot reward
      if (weights.rebounds >= 4) {
        archetypeComponents.push(`REB * ${formatMultiplier(weights.rebounds * 0.4)}`);
      }
    }

    if (preferences.playstyles.includes("playmaker")) {
      // Advanced playmaking with assist ratios
      if (weights.assists >= 3) {
        archetypeComponents.push(`AST * ${formatMultiplier(weights.assists * 0.8)}`);
      }
      archetypeComponents.push("(AST / (TOV + 1)) * 2.0"); // AST/TO ratio
    }

    if (preferences.playstyles.includes("defensive-anchor")) {
      // Defensive impact with steal/block emphasis
      if (weights.steals >= 3) {
        archetypeComponents.push(`STL * ${formatMultiplier(weights.steals * 1.5)}`);
      }
      if (weights.blocks >= 3) {
        archetypeComponents.push(`BLK * ${formatMultiplier(weights.blocks * 1.8)}`);
      }
    }

    if (preferences.playstyles.includes("midrange-shooter")) {
      // Mid-range shooting with non-3P field goals
      if (weights.fieldGoalPct >= 3) {
        archetypeComponents.push(`FG_PCT * ${formatMultiplier(weights.fieldGoalPct * 2)}`);
      }
      archetypeComponents.push("(FGA - 3PA) * 0.6"); // Non-3P attempts
    }

    if (preferences.playstyles.includes("two-way-player")) {
      // Balanced offensive and defensive impact
      archetypeComponents.push("(STL + BLK) * 1.5");
      archetypeComponents.push("(PTS + AST) * 0.3");
    }

    if (preferences.playstyles.includes("energy")) {
      // High-energy hustle stats
      archetypeComponents.push("(STL + BLK + REB) * 0.4");
      archetypeComponents.push("(MIN / 36) * 2.0"); // Minutes played factor
    }

    if (preferences.playstyles.includes("floor-general")) {
      // Leadership and game management
      archetypeComponents.push("(AST * 2.0 - TOV) * 0.8");
      archetypeComponents.push("(W_PCT * 10)"); // Team success factor
    }

    // Build base formula
    let allComponents = [...components, ...archetypeComponents];
    
    // Ensure we have components
    if (allComponents.length === 0) {
      allComponents = ["PTS * 1.2", "AST * 1.8", "REB * 1.0"];
    }

    let formula = allComponents.join(" + ");

    // Apply only one efficiency multiplier to prevent overflow
    if (preferences.efficiency && weights.fieldGoalPct >= 3) {
      formula = `(${formula}) * (0.8 + FG_PCT * 0.2)`;
    } else if (weights.threePointPct >= 4 && preferences.playstyles.includes("outside-shooter")) {
      formula = `(${formula}) * (0.9 + 3P_PCT * 0.2)`;
    } else if (weights.freeThrowPct >= 4) {
      formula = `(${formula}) * (0.9 + FT_PCT * 0.1)`;
    }

    // Penalties with one decimal place formatting
    let penalties: string[] = [];
    if (weights.turnovers >= 4) {
      penalties.push(`TOV * ${formatMultiplier(weights.turnovers * 0.5)}`);
    } else if (weights.turnovers >= 2) {
      penalties.push("TOV * 0.8");
    }

    if (weights.fouls >= 4) {
      penalties.push(`PF * ${formatMultiplier(weights.fouls * 0.4)}`);
    } else if (weights.fouls >= 2) {
      penalties.push("PF * 0.5");
    }

    if (penalties.length > 0) {
      formula = `(${formula}) - (${penalties.join(" + ")})`;
    }

    // Advanced factors (simplified to prevent overflow)
    let advancedMultipliers: string[] = [];
    let advancedPenalties: string[] = [];

    if (preferences.teamSuccess) {
      advancedMultipliers.push("(0.9 + PLUS_MINUS / 200)");
    }

    if (preferences.durability) {
      advancedMultipliers.push("(GP / 82)");
    }

    if (preferences.clutchPerformance) {
      advancedMultipliers.push("(1 + PLUS_MINUS / 200)");
    }

    if (preferences.minimizeTO) {
      advancedPenalties.push("TOV * 1.5");
    }

    if (preferences.rewardMinutes) {
      advancedMultipliers.push("(MIN / 36)");
    }

    if (preferences.emphasizeDefense) {
      formula = `(${formula}) + (STL + BLK) * 2`;
    }

    if (preferences.penalizeFouls) {
      advancedPenalties.push("PF * 1.0");
    }

    // Apply one multiplier at a time to prevent overflow
    if (advancedMultipliers.length > 0) {
      formula = `(${formula}) * ${advancedMultipliers[0]}`;
    }

    // Apply penalties
    if (advancedPenalties.length > 0) {
      formula = `(${formula}) - (${advancedPenalties.join(" + ")})`;
    }

    return formula;
  };

  const calculatePreview = async () => {
    if (!generatedFormula) return;

    setIsCalculating(true);
    try {
      const response = await fetch("/api/custom-stats/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ formula: generatedFormula, season: "all-time" })
      });

      if (!response.ok) {
        throw new Error("Failed to calculate preview");
      }

      const results = await response.json();
      setPreviewResults(results.slice(0, 20)); // Show top 20
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to calculate preview",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCreateStat = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create custom stats",
        variant: "destructive"
      });
      return;
    }

    if (!statName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your stat",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/custom-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: statName,
          formula: generatedFormula,
          description: `Guided stat: ${preferences.playstyles.join(" + ")} player focus`
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create stat");
      }

      toast({
        title: "Success!",
        description: `Your custom stat "${statName}" has been created`,
      });

      onStatCreated?.();
      onBack();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create custom stat",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const nextStep = () => {
    if (step === 3) {
      const formula = generateFormula();
      setGeneratedFormula(formula);
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You need to be signed in to create custom stats
            </p>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-purple-500" />
          <div>
            <h1 className="text-2xl font-bold">Guided Stat Builder</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Create your perfect player metric in 4 simple steps
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= num
                  ? "bg-orange-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              {num}
            </div>
            {num < 4 && (
              <div
                className={`w-12 h-1 mx-2 ${
                  step > num ? "bg-orange-600" : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === 1 && "Step 1: Player Type"}
            {step === 2 && "Step 2: Stat Importance"}
            {step === 3 && "Step 3: Advanced Factors"}
            {step === 4 && "Step 4: Create Your Stat"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Player Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-slate-600 dark:text-slate-400">
                  What type of player do you value most? (Select up to 2)
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Choose 1-2 playing styles that best represent your ideal player
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: "outside-shooter", label: "Outside Shooter", desc: "Three-point specialists" },
                  { id: "slasher", label: "Slasher", desc: "Attacking the rim aggressively" },
                  { id: "post-player", label: "Post Player", desc: "Dominant in the paint" },
                  { id: "defensive-anchor", label: "Defensive Anchor", desc: "Rim protection and steals" },
                  { id: "midrange-shooter", label: "Midrange Shooter", desc: "Effective from 15-20 feet" },
                  { id: "playmaker", label: "Playmaker", desc: "Creating shots for teammates" }
                ].map((type) => {
                  const isSelected = preferences.playstyles.includes(type.id);
                  const canSelect = preferences.playstyles.length < 2 || isSelected;
                  
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        if (isSelected) {
                          setPreferences({ 
                            ...preferences, 
                            playstyles: preferences.playstyles.filter(p => p !== type.id)
                          });
                        } else if (canSelect) {
                          setPreferences({ 
                            ...preferences, 
                            playstyles: [...preferences.playstyles, type.id]
                          });
                        }
                      }}
                      disabled={!canSelect}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
                          : canSelect
                          ? "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          : "border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{type.label}</div>
                        {isSelected && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{type.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Stat Weights */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-slate-600 dark:text-slate-400">
                Rate how much you value each statistic (1 = Not important, 5 = Very important)
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(weights).map(([stat, value]) => (
                  <div key={stat} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="capitalize text-sm font-medium">
                        {stat.replace(/([A-Z])/g, ' $1').replace('Pct', '%')}
                      </Label>
                      <Badge variant="outline">{value}</Badge>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={(newValue) =>
                        setWeights({ ...weights, [stat]: newValue[0] })
                      }
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Not Important</span>
                      <span>Very Important</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Advanced Factors */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                Select additional factors that matter to you:
              </p>
              <div className="space-y-4">
                {[
                  {
                    id: "teamSuccess",
                    label: "Team Success",
                    desc: "Factor in team wins and overall team performance"
                  },
                  {
                    id: "efficiency",
                    label: "Shooting Efficiency",
                    desc: "Emphasize quality over quantity in scoring"
                  },
                  {
                    id: "durability",
                    label: "Durability",
                    desc: "Reward players who stay healthy and play more games"
                  },
                  {
                    id: "clutchPerformance",
                    label: "Plus/Minus Impact",
                    desc: "Consider overall impact on team performance"
                  },
                  {
                    id: "minimizeTO",
                    label: "Ball Security",
                    desc: "Heavily penalize turnovers and reward careful play"
                  },
                  {
                    id: "rewardMinutes",
                    label: "High Usage",
                    desc: "Favor players who carry heavy workloads"
                  },
                  {
                    id: "emphasizeDefense",
                    label: "Defensive Impact",
                    desc: "Boost steals and blocks significantly"
                  },
                  {
                    id: "penalizeFouls",
                    label: "Discipline",
                    desc: "Reduce value for players with excessive fouling"
                  }
                ].map((factor) => (
                  <div key={factor.id} className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Checkbox
                      id={factor.id}
                      checked={preferences[factor.id as keyof PlayerPreferences] as boolean}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          [factor.id]: checked
                        })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor={factor.id} className="font-medium cursor-pointer">
                        {factor.label}
                      </Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {factor.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Final Result */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="statName" className="text-sm font-medium">
                  Name Your Custom Stat
                </Label>
                <Input
                  id="statName"
                  value={statName}
                  onChange={(e) => setStatName(e.target.value)}
                  placeholder="e.g., My Perfect Player Rating"
                  className="mt-2"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Generated Formula
                </h3>
                <code className="text-sm bg-slate-100 dark:bg-slate-700 p-2 rounded block font-mono break-all">
                  {generatedFormula}
                </code>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  This formula reflects your preferences and can be used in any analysis tool
                </p>
              </div>

              {/* Preview Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={calculatePreview}
                  disabled={isCalculating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  {isCalculating ? "Calculating..." : "Preview Leaderboard"}
                </Button>
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewResults([]);
                  }}
                  disabled={!showPreview}
                  variant="ghost"
                  className="text-slate-600"
                >
                  Hide Preview
                </Button>
              </div>

              {/* Preview Results */}
              {showPreview && previewResults.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Top 20 Players Preview
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {previewResults.map((result, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-500 w-6">
                            #{index + 1}
                          </span>
                          <div>
                            <span className="font-medium">{result.player.name}</span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 ml-2">
                              {result.player.team} • {result.bestSeason}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-orange-600">
                          {result.customStat?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    This preview shows how your stat ranks current players. Save it to use in full analysis tools.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Your Player Profile
                </h3>
                <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <p>• Focus: {preferences.playstyles.map(style => style.replace(/-/g, ' ')).join(" + ")}</p>
                  {preferences.teamSuccess && <p>• Values team success</p>}
                  {preferences.efficiency && <p>• Emphasizes shooting efficiency</p>}
                  {preferences.durability && <p>• Rewards availability</p>}
                  {preferences.clutchPerformance && <p>• Considers overall impact</p>}
                  {preferences.minimizeTO && <p>• Penalizes turnovers heavily</p>}
                  {preferences.rewardMinutes && <p>• Favors high usage players</p>}
                  {preferences.emphasizeDefense && <p>• Boosts defensive stats</p>}
                  {preferences.penalizeFouls && <p>• Reduces value for fouling</p>}
                </div>
              </div>

              {/* Additional Options */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <h3 className="font-medium mb-3">What's Next?</h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p>• Save this stat to use in the main calculator and scatter plot analyzer</p>
                  <p>• Compare players across seasons using your custom formula</p>
                  <p>• Share your methodology with other basketball fans</p>
                  <p>• Create variations by adjusting weights and factors</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < 4 ? (
              <Button
                onClick={nextStep}
                disabled={step === 1 && preferences.playstyles.length === 0}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleCreateStat}
                disabled={!statName.trim() || isCreating}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCreating ? "Creating..." : "Create My Stat"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}