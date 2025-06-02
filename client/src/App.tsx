import { useState } from "react";

export default function App() {
  const [formula, setFormula] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLeaderboard([]);
    setLoading(true);

    const url = `/api/leaderboard?formula=${encodeURIComponent(formula)}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Server error");
      } else {
        setLeaderboard(data);
      }
    } catch (e) {
      console.error(e);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-screen-md mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">NBA Custom Stats (2024–25)</h1>

      <form onSubmit={handleSubmit} className="mb-6">
        <label className="block font-medium mb-2">
          Enter a formula (use PTS, AST, REB, TOV, PLUS_MINUS):
        </label>
        <input
          type="text"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="e.g. (PTS + AST + REB) / TOV * PLUS_MINUS"
          className="w-full border border-gray-300 p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading || !formula.trim()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Computing…" : "Run"}
        </button>
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {leaderboard.length > 0 && (
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b px-4 py-2">Rank</th>
              <th className="border-b px-4 py-2">Player</th>
              <th className="border-b px-4 py-2">Team</th>
              <th className="border-b px-4 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((p, i) => (
              <tr key={`${p.name}-${i}`} className="hover:bg-gray-100">
                <td className="border-b px-4 py-2">{i + 1}</td>
                <td className="border-b px-4 py-2">{p.name}</td>
                <td className="border-b px-4 py-2">{p.team}</td>
                <td className="border-b px-4 py-2">{p.score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
