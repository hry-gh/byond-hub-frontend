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
const TREND_WINDOW_BY_PERIOD = {
  day: 12,
  week: 6,
  month: 4,
  year: 7,
  all: 14,
};

type Period = keyof typeof TREND_WINDOW_BY_PERIOD;

type HistoryPoint = {
  timestamp: string;
  players: number;
};

type TimeDilationPoint = {
  timestamp: string;
  time_dilation: number;
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

function rollingAverage<T>(
  points: T[],
  getValue: (point: T) => number,
  windowSize: number,
) {
  return points.map((point, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const window = points.slice(start, index + 1);
    const values = window.map(getValue).filter(Number.isFinite);
    const trend =
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null;

    return { ...point, trend };
  });
}

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

export function PlayerHistoryChart({
  history,
  period,
}: {
  history: HistoryPoint[];
  period: Period;
}) {
  const trendWindow = TREND_WINDOW_BY_PERIOD[period];
  const data = rollingAverage(
    history.map((point) => {
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
    }),
    (point) => point.players,
    trendWindow,
  ).map((point) => ({
    ...point,
    trend: point.trend == null ? null : Math.round(point.trend * 10) / 10,
  }));

  if (data.length === 0) return null;

  const firstTrend = data.find((point) => point.trend != null)?.trend;
  const lastTrend = data.findLast((point) => point.trend != null)?.trend;
  const trendDelta =
    firstTrend == null || lastTrend == null
      ? null
      : Math.round((lastTrend - firstTrend) * 10) / 10;

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="dim">Player History</h2>
        {trendDelta != null && trendDelta !== 0 && (
          <span className="text-xs dim">
            Trend {trendDelta > 0 ? "+" : ""}
            {trendDelta} players
          </span>
        )}
      </div>
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
            formatter={(value, name) => [
              `${value} players`,
              name === "trend" ? "Trend" : "Players",
            ]}
          />
          <Area
            type="monotone"
            dataKey="players"
            stroke="#99f"
            fill="#99f"
            fillOpacity={0.18}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="trend"
            stroke="#f0b429"
            fill="transparent"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimeDilationChart({
  history,
  period,
}: {
  history: TimeDilationPoint[];
  period: Period;
}) {
  const trendWindow = TREND_WINDOW_BY_PERIOD[period];
  const data = rollingAverage(
    history.map((point) => {
      const date = parseAsUTC(point.timestamp);
      return {
        time: date.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        timeDilation: Math.round(point.time_dilation * 100) / 100,
      };
    }),
    (point) => point.timeDilation,
    trendWindow,
  ).map((point) => ({
    ...point,
    trend: point.trend == null ? null : Math.round(point.trend * 100) / 100,
  }));

  if (data.length === 0) return null;

  return (
    <div className="panel p-4">
      <h2 className="dim mb-3">Time Dilation</h2>
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
            cursor={{ stroke: "#4ade80", strokeWidth: 1 }}
            contentStyle={{
              background: "#161618",
              border: "1px solid #393639",
              borderRadius: 5,
              fontSize: 12,
            }}
            labelStyle={{ color: "#d4d4d4" }}
            formatter={(value, name) => [
              `${value}%`,
              name === "trend" ? "Trend" : "Time Dilation",
            ]}
          />
          <Area
            type="monotone"
            dataKey="timeDilation"
            stroke="#4ade80"
            fill="#4ade80"
            fillOpacity={0.2}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="trend"
            stroke="#f0b429"
            fill="transparent"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
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

    const dateForHour = new Date();
    dateForHour.setHours(i, 0, 0, 0);

    return {
      hour: dateForHour.toLocaleString(undefined, {
        hour: "numeric",
      }),
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
