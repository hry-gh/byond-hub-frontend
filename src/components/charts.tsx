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
import { parseAsUTC } from "../utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type HistoryPoint = {
  timestamp: string;
  players: number;
};

type StatsData = {
  avg_players: number;
  max_players: number;
  min_players: number;
  total_records: number;
  weekday_averages: number[];
  hourly_averages: number[];
  history: HistoryPoint[];
};

export function StatsOverview({ stats }: { stats: StatsData }) {
  return (
    <div className="panel p-4">
      <div className="flex gap-8 flex-wrap">
        <div>
          <span className="stat">Avg Players </span>
          <span className="stat-value">{stats.avg_players.toFixed(1)}</span>
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
  );
}

export function PlayerHistoryChart({ history }: { history: HistoryPoint[] }) {
  const data = history.map((point) => {
    const date = parseAsUTC(point.timestamp);
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

  if (data.length === 0) return null;

  return (
    <div className="panel p-4">
      <h2 className="dim mb-3">Player History</h2>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
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
  );
}

export function PlayersByDayChart({
  weekdayAverages,
}: {
  weekdayAverages: number[];
}) {
  const data = weekdayAverages.map((avg, i) => ({
    day: WEEKDAYS[i],
    players: Math.round(avg * 10) / 10,
  }));

  return (
    <div className="panel p-4">
      <h2 className="dim mb-3">Players by Day</h2>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data}>
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
  );
}

export function PlayersByHourChart({
  hourlyAverages,
}: {
  hourlyAverages: number[];
}) {
  const offsetHours = -new Date().getTimezoneOffset() / 60;

  const data = hourlyAverages.map((_, i) => {
    const utcHour = (i - offsetHours + 24) % 24;
    const wholeHour = Math.floor(utcHour);
    const nextHour = (wholeHour + 1) % 24;
    const fraction = utcHour - wholeHour;

    const avg =
      fraction === 0
        ? hourlyAverages[wholeHour]
        : hourlyAverages[wholeHour] * (1 - fraction) +
          hourlyAverages[nextHour] * fraction;

    return {
      hour: `${i}:00`,
      players: Math.round(avg * 10) / 10,
    };
  });

  return (
    <div className="panel p-4">
      <h2 className="dim mb-3">Players by Hour</h2>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data}>
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
  );
}
