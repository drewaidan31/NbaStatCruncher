// Quick test to debug the calculation endpoint
const testFormula = "PTS + AST";

fetch("http://localhost:5173/api/custom-stats/calculate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ formula: testFormula, season: "all-time" })
})
.then(response => {
  console.log("Response status:", response.status);
  return response.json();
})
.then(data => {
  console.log("Response data:", data);
  console.log("Number of results:", data.length);
})
.catch(error => {
  console.error("Error:", error);
});