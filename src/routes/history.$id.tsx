import { createFileRoute, Link, useParams } from "@tanstack/react-router";
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

export const Route = createFileRoute("/history/$id")({
  component: RouteComponent,
});

type Period = "day" | "week" | "month" | "year" | "all";

type Server = {
  world_id: number;
  name: string;
  description: string;
  status: string;
  players: number;
  updated_at: string;
};

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

function RouteComponent() {
  const { id } = useParams({ from: "/history/$id" });
  const [period, setPeriod] = useState<Period>("week");
  const [server, setServer] = useState<Server>();
  const [stats, setStats] = useState<ServerStats>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/servers/${id}`)
      .then((res) => res.json())
      .then((data) => setServer(data));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/servers/${id}/stats?period=${period}`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, [id, period]);

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-4">
        <Link to="/" className="text-sm">
          ← Back
        </Link>
        <h1 className="mt-4 mb-1">{server?.name ?? "Server History"}</h1>
        <p className="dim text-sm">{server?.players} players online</p>
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
                <Bar dataKey="players" fill="#99f" radius={[2, 2, 0, 0]} />
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
                <Bar dataKey="players" fill="#99f" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
