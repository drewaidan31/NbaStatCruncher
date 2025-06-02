import { useState } from "react";
import Header from "@/components/header";
import FormulaInput from "@/components/formula-input";
import SearchFilters from "@/components/search-filters";
import LeaderboardTable from "@/components/leaderboard-table";
import FormulaExamples from "@/components/formula-examples";
import Footer from "@/components/footer";

export default function Dashboard() {
  const [formula, setFormula] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedPosition, setSelectedPosition] = useState("all");

  return (
    <div className="bg-slate-900 text-slate-50 min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FormulaInput formula={formula} onFormulaChange={setFormula} />
        
        <SearchFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedTeam={selectedTeam}
          onTeamChange={setSelectedTeam}
          selectedPosition={selectedPosition}
          onPositionChange={setSelectedPosition}
        />
        
        <LeaderboardTable
          formula={formula}
          searchTerm={searchTerm}
          selectedTeam={selectedTeam}
          selectedPosition={selectedPosition}
        />
        
        <FormulaExamples onFormulaSelect={setFormula} />
      </main>
      
      <Footer />
    </div>
  );
}
