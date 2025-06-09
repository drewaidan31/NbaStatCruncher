export default function Footer() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <footer className="bg-slate-800 border-t border-slate-700 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-4">
              Data Source
            </h3>
            <p className="text-sm text-slate-400 mb-2">
              Powered by RapidAPI NBA Statistics
            </p>
            <p className="text-sm text-slate-400">
              Last updated:{" "}
              <span className="text-slate-300">{currentDate}</span>
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-4">About</h3>
            <p className="text-sm text-slate-400">
              NBA Formula Builder lets you create custom NBA statistics using
              mathematical formulas and compare players across unique metrics
              for the 2024-25 season.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-4">
              Features
            </h3>
            <div className="space-y-2">
              <div className="text-sm text-slate-400">✓ Real-time NBA data</div>
              <div className="text-sm text-slate-400">
                ✓ Custom formula creation
              </div>
              <div className="text-sm text-slate-400">
                ✓ Advanced filtering & sorting
              </div>
              <div className="text-sm text-slate-400">
                ✓ Interactive leaderboards
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-8 pt-6 text-center">
          <p className="text-sm text-slate-400">
            © 2024 NBA Formula Builder. Built with React, Node.js, and NBA API.
          </p>
        </div>
      </div>
    </footer>
  );
}
