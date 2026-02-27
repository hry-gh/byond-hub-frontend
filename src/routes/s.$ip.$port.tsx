import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL } from "../api";
import {
  PlayerHistoryChart,
  PlayersByDayChart,
  PlayersByHourChart,
  StatsOverview,
} from "../components/charts";
import type { GameServer } from "../types";
import { formatDuration, formatShuttleTimer } from "../utils";

export const Route = createFileRoute("/s/$ip/$port")({
  component: RouteComponent,
});

type Period = "day" | "week" | "month" | "year" | "all";

type HistoryPoint = {
  timestamp: string;
  players: number;
};

type ServerStats = {
  period: Period;
  total_records: number;
  avg_players: number;
  max_players: number;
  min_players: number;
  weekday_averages: number[];
  hourly_averages: number[];
  history: HistoryPoint[];
};

const securityColors = {
  red: "#f87171",
  blue: "#60a5fa",
  green: "#4ade80",
  no_warning: "#4ade80",
};

function RouteComponent() {
  const { ip, port } = useParams({ from: "/s/$ip/$port" });
  const [period, setPeriod] = useState<Period>("week");
  const [server, setServer] = useState<GameServer>();
  const [stats, setStats] = useState<ServerStats>();
  const [initialLoading, setInitialLoading] = useState(true);
  const [showFullTopic, setShowFullTopic] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/servers/${ip}/${port}`)
      .then((res) => res.json())
      .then((data) => setServer(data));
  }, [ip, port]);

  useEffect(() => {
    fetch(`${API_URL}/servers/${ip}/${port}/stats?period=${period}`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .finally(() => setInitialLoading(false));
  }, [ip, port, period]);

  const ts = server?.topic_status;
  const mapName = ts?.map_name ?? ts?.map;
  const hasTopicInfo =
    ts?.mode ||
    mapName ||
    ts?.round_id ||
    ts?.round_duration != null ||
    ts?.security_level;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-4">
        <Link to="/" className="text-sm">
          &larr; Back
        </Link>
        <h1 className="mt-4 mb-1">{server?.name ?? "Server Info"}</h1>
        <p className="dim text-sm">
          {server?.players}
          {server?.topic_status?.popcap != null &&
            server.topic_status.popcap !== "" &&
            `/${server.topic_status.popcap}`}{" "}
          players online
        </p>
        {server?.topic_status?.admins != null &&
          server.topic_status.admins !== "" &&
          server.topic_status.admins !== 0 && (
            <p className="dim text-sm flex items-center gap-1">
              <Shield size={14} />
              {server.topic_status.admins} admins online
            </p>
          )}
      </header>

      {hasTopicInfo && ts && (
        <div className="panel p-4 mb-6 relative">
          <div className="flex gap-x-8 gap-y-2 flex-wrap pr-6 items-center">
            {ts.version?.includes("/tg/") && (
              <img
                src="/tgstation.png"
                alt="TG Station"
                width={24}
                height={24}
              />
            )}
            {ts.version?.includes("Goonstation 13") && (
              <img
                src="/goonstation.png"
                alt="Goonstation"
                width={24}
                height={24}
              />
            )}
            {ts.mode && (
              <div>
                <span className="stat">Mode </span>
                <span className="stat-value">
                  {ts.mode.charAt(0).toUpperCase() + ts.mode.slice(1)}
                </span>
              </div>
            )}
            {mapName && (
              <div>
                <span className="stat">Map </span>
                <span className="stat-value">{mapName}</span>
              </div>
            )}
            {ts.round_id && (
              <div>
                <span className="stat">Round </span>
                <span className="stat-value">#{ts.round_id}</span>
              </div>
            )}
            {ts.round_duration != null && (
              <div>
                <span className="stat">Duration </span>
                <span className="stat-value">
                  {formatDuration(ts.round_duration)}
                </span>
              </div>
            )}
            {ts.security_level && (
              <div>
                <span className="stat">Security </span>
                <span
                  className="stat-value"
                  style={{ color: securityColors[ts.security_level] }}
                >
                  {ts.security_level === "no_warning"
                    ? "Green"
                    : ts.security_level.charAt(0).toUpperCase() +
                      ts.security_level.slice(1)}
                </span>
              </div>
            )}
            {ts.shuttle_mode && ts.shuttle_mode !== "idle" && (
              <div>
                <span className="stat">Shuttle </span>
                <span className="stat-value text-yellow-400">
                  {ts.shuttle_mode}
                  {ts.shuttle_timer != null && ts.shuttle_timer > 0 && (
                    <span> ({formatShuttleTimer(ts.shuttle_timer)})</span>
                  )}
                </span>
              </div>
            )}
          </div>
          {showFullTopic && (
            <pre className="mt-3 p-3 bg-black/30 rounded text-xs overflow-x-auto">
              {JSON.stringify(ts, null, 2)}
            </pre>
          )}
          <button
            type="button"
            className="absolute top-4 right-4 dim hover:text-white transition-colors"
            onClick={() => setShowFullTopic(!showFullTopic)}
          >
            {showFullTopic ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      )}

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

      {initialLoading ? (
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
