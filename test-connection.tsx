import { useState, useEffect } from "react";

export default function TestConnection() {
  const [status, setStatus] = useState("Testing...");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch("/api/nba/players", {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        });
        
        if (response.ok) {
          const players = await response.json();
          setData(players);
          setStatus(`Success! Loaded ${players.length} NBA players`);
        } else {
          setStatus(`Error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        setStatus(`Network Error: ${error.message}`);
        console.error("Connection test failed:", error);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-6 bg-slate-800 text-white">
      <h2 className="text-xl font-bold mb-4">Connection Test</h2>
      <p className="mb-4">Status: {status}</p>
      {data && (
        <div>
          <h3 className="text-lg font-semibold mb-2">NBA Players:</h3>
          {data.slice(0, 3).map((player: any) => (
            <div key={player.id} className="mb-2 p-2 bg-slate-700 rounded">
              <div className="font-medium">{player.name}</div>
              <div className="text-sm text-slate-300">{player.team} - {player.position}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}