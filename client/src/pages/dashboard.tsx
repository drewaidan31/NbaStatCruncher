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
  const [selectedSeason, setSelectedSeason] = useState("all-time");

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

        {/* Season Selector */}
        <div className="mb-6">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <label htmlFor="season-select" className="block text-sm font-medium text-slate-300 mb-2">
              Select NBA Season:
            </label>
            <select
              id="season-select"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all-time">All-Time Leaders (1996-2025)</option>
              <option value="2024-25">2024-25 Season (Current)</option>
              <option value="2023-24">2023-24 Season</option>
              <option value="2022-23">2022-23 Season</option>
              <option value="2021-22">2021-22 Season</option>
              <option value="2020-21">2020-21 Season</option>
              <option value="2019-20">2019-20 Season</option>
              <option value="2018-19">2018-19 Season</option>
              <option value="2017-18">2017-18 Season</option>
              <option value="2016-17">2016-17 Season</option>
              <option value="2015-16">2015-16 Season</option>
              <option value="2014-15">2014-15 Season</option>
              <option value="2013-14">2013-14 Season</option>
              <option value="2012-13">2012-13 Season</option>
              <option value="2011-12">2011-12 Season</option>
              <option value="2010-11">2010-11 Season</option>
              <option value="2009-10">2009-10 Season</option>
              <option value="2008-09">2008-09 Season</option>
              <option value="2007-08">2007-08 Season</option>
              <option value="2006-07">2006-07 Season</option>
              <option value="2005-06">2005-06 Season</option>
              <option value="2004-05">2004-05 Season</option>
              <option value="2003-04">2003-04 Season</option>
              <option value="2002-03">2002-03 Season</option>
              <option value="2001-02">2001-02 Season</option>
              <option value="2000-01">2000-01 Season</option>
              <option value="1999-00">1999-00 Season</option>
              <option value="1998-99">1998-99 Season</option>
              <option value="1997-98">1997-98 Season</option>
              <option value="1996-97">1996-97 Season</option>
            </select>
          </div>
        </div>
        
        <LeaderboardTable
          formula={formula}
          searchTerm={searchTerm}
          selectedTeam={selectedTeam}
          selectedPosition={selectedPosition}
          selectedSeason={selectedSeason}
        />
        
        <FormulaExamples onFormulaSelect={setFormula} />
      </main>
      
      <Footer />
    </div>
  );
}
