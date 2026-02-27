import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API_URL } from "../api";
import type { GameServer } from "../types";

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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatDuration = (deciseconds: number) => {
  const totalSeconds = Math.floor(deciseconds / 10);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
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

  const weekdayData = stats?.weekday_averages.map((avg, i) => ({
    day: WEEKDAYS[i],
    players: Math.round(avg * 10) / 10,
  }));

  const hourlyData = stats?.hourly_averages.map((avg, i) => ({
    hour: `${i}:00`,
    players: Math.round(avg * 10) / 10,
  }));

  const historyData = stats?.history.map((point) => {
    const date = new Date(point.timestamp);
    return {
      time: date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      players: Math.round(point.players),
    };
  });

  const ts = server?.topic_status;
  const mapName = ts?.map_name ?? ts?.map;
  const hasTopicInfo =
    ts?.mode ||
    mapName ||
    ts?.round_id ||
    ts?.round_duration != null ||
    ts?.security_level;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-4">
        <Link to="/" className="text-sm">
          ← Back
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
          <div className="panel p-4">
            <div className="flex gap-8 flex-wrap">
              <div>
                <span className="stat">Avg Players </span>
                <span className="stat-value">
                  {stats.avg_players.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="stat">Max </span>
                <span className="stat-value">{stats.max_players}</span>
              </div>
              <div>
                <span className="stat">Min </span>
                <span className="stat-value">{stats.min_players}</span>
              </div>
              <div>
                <span className="stat">Records </span>
                <span className="stat-value">
                  {stats.total_records.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {historyData && historyData.length > 0 && (
            <div className="panel p-4">
              <h2 className="dim mb-3">Player History</h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={historyData}>
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#646464", fontSize: 10 }}
                    axisLine={{ stroke: "#393639" }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={50}
                  />
                  <YAxis
                    tick={{ fill: "#646464", fontSize: 12 }}
                    axisLine={{ stroke: "#393639" }}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ stroke: "#99f", strokeWidth: 1 }}
                    contentStyle={{
                      background: "#161618",
                      border: "1px solid #393639",
                      borderRadius: 5,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#d4d4d4" }}
                    itemStyle={{ color: "#99f" }}
                    formatter={(value) => [`${value} players`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="players"
                    stroke="#99f"
                    fill="#99f"
                    fillOpacity={0.2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="panel p-4">
            <h2 className="dim mb-3">Players by Day</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weekdayData}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#646464", fontSize: 12 }}
                  axisLine={{ stroke: "#393639" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#646464", fontSize: 12 }}
                  axisLine={{ stroke: "#393639" }}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: "rgba(153, 153, 255, 0.1)" }}
                  contentStyle={{
                    background: "#161618",
                    border: "1px solid #393639",
                    borderRadius: 5,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#d4d4d4" }}
                  itemStyle={{ color: "#99f" }}
                  formatter={(value) => [`${value} players`, "Avg"]}
                />
                <Bar
                  dataKey="players"
                  fill="#99f"
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel p-4">
            <h2 className="dim mb-3">Players by Hour</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={hourlyData}>
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "#646464", fontSize: 10 }}
                  axisLine={{ stroke: "#393639" }}
                  tickLine={false}
                  interval={5}
                />
                <YAxis
                  tick={{ fill: "#646464", fontSize: 12 }}
                  axisLine={{ stroke: "#393639" }}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: "rgba(153, 153, 255, 0.1)" }}
                  contentStyle={{
                    background: "#161618",
                    border: "1px solid #393639",
                    borderRadius: 5,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#d4d4d4" }}
                  itemStyle={{ color: "#99f" }}
                  formatter={(value) => [`${value} players`, "Avg"]}
                />
                <Bar
                  dataKey="players"
                  fill="#99f"
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
