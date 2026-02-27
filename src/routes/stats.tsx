import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { API_URL } from "../api";
import {
  PlayerHistoryChart,
  PlayersByDayChart,
  PlayersByHourChart,
  StatsOverview,
} from "../components/charts";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

type Period = "day" | "week" | "month" | "year" | "all";

type HistoryPoint = {
  timestamp: string;
  players: number;
};

type GlobalStats = {
  period: Period;
  total_records: number;
  avg_players: number;
  max_players: number;
  min_players: number;
  weekday_averages: number[];
  hourly_averages: number[];
  history: HistoryPoint[];
};

function StatsPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [stats, setStats] = useState<GlobalStats>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/stats?period=${period}`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-4">
        <Link to="/" className="text-sm">
          &larr; Back
        </Link>
        <h1 className="mt-4 mb-1">Global Statistics</h1>
      </header>

      <div className="flex gap-2 mb-6">
        {(["day", "week", "month", "year", "all"] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`btn ${period === p ? "btn-primary" : ""}`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="panel p-4 dim">Loading stats...</div>
      ) : !stats ? (
        <div className="panel p-4 dim">No data available</div>
      ) : (
        <div className="space-y-6">
          <StatsOverview stats={stats} />
          <PlayerHistoryChart history={stats.history} />
          <PlayersByDayChart weekdayAverages={stats.weekday_averages} />
          <PlayersByHourChart hourlyAverages={stats.hourly_averages} />
        </div>
      )}
    </div>
  );
}
