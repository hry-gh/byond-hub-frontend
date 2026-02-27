import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL } from "../api";
import type { GameServer } from "../types";

export const Route = createFileRoute("/")({ component: App });

const setCookie = (name: string, value: string) => {
  if (typeof window !== "undefined" && "cookieStore" in window) {
    window.cookieStore.set(name, value);
  } else {
    // biome-ignore lint/suspicious/noDocumentCookie: we try to do it properly above
    document.cookie = `${name}=${value}; path=/`;
  }
};

const extractDiscordUrl = (status: string): string | null => {
  const match = status.match(
    /<a\s+[^>]*href=["']([^"']*discord[^"']*)["'][^>]*>|<a\s+[^>]*href=["']([^"']*)["'][^>]*>[^<]*discord[^<]*<\/a>/i,
  );
  if (match) {
    return match[1] || match[2] || null;
  }
  return null;
};

function App() {
  const [data, setData] = useState<GameServer[]>();
  const [loading, setLoading] = useState(true);
  const [showStatus, setShowStatus] = useState(() => {
    if (typeof document === "undefined") return false;
    const saved = document.cookie
      .split("; ")
      .find((row) => row.startsWith("showStatus="))
      ?.split("=")[1];
    return saved ? JSON.parse(saved) : false;
  });
  const [show18Plus, setShow18Plus] = useState(() => {
    if (typeof document === "undefined") return false;
    const saved = document.cookie
      .split("; ")
      .find((row) => row.startsWith("show18Plus="))
      ?.split("=")[1];
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    setCookie("showStatus", JSON.stringify(showStatus));
  }, [showStatus]);

  useEffect(() => {
    setCookie("show18Plus", JSON.stringify(show18Plus));
  }, [show18Plus]);

  useEffect(() => {
    fetch(`${API_URL}/servers`)
      .then((data) => data.json().then((json) => setData(json)))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = data?.filter(
    (server) => show18Plus || !server.status.includes("18+"),
  );

  const totalPlayers =
    filteredData?.reduce((total, server) => total + server.players, 0) ?? 0;

  const lastUpdated = filteredData?.length
    ? new Date(
        Math.max(...filteredData.map((s) => new Date(s.updated_at).getTime())),
      )
    : null;

  const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatDuration = (deciseconds: number) => {
    const totalSeconds = Math.floor(deciseconds / 10);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-4">
        <h1 className="flex items-center gap-2">
          <img src="/ss13.png" alt="" width={24} height={24} />
          SS13 Hub
        </h1>
      </header>

      <div className="flex gap-8 mb-4">
        <div>
          <span className="stat">Servers </span>
          <span className="stat-value">
            {loading ? "—" : (filteredData?.length ?? 0)}
          </span>
        </div>
        <div>
          <span className="stat">Players </span>
          <span className="stat-value">{loading ? "—" : totalPlayers}</span>
        </div>
        <div>
          <span className="stat">Updated </span>
          <span className="stat-value">
            {loading
              ? "—"
              : lastUpdated
                ? formatRelativeTime(lastUpdated)
                : "—"}
          </span>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer w-fit text-sm">
          <input
            type="checkbox"
            checked={showStatus}
            onChange={(e) => setShowStatus(e.target.checked)}
          />
          <span className="dim">Show hub status</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer w-fit text-sm">
          <input
            type="checkbox"
            checked={show18Plus}
            onChange={(e) => setShow18Plus(e.target.checked)}
          />
          <span className="dim">Show 18+ servers</span>
        </label>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="panel p-4 dim">Loading servers...</div>
        ) : filteredData?.length === 0 ? (
          <div className="panel p-4 dim">No servers online</div>
        ) : (
          filteredData
            ?.sort((a, b) => b.players - a.players)
            .map((server, index) => {
              const [ip, port] = server.address.split(":");
              return (
                <div
                  key={server.address}
                  className="server-row p-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="rank">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      {showStatus ? (
                        <span
                          // biome-ignore lint/security/noDangerouslySetInnerHtml: mostly sanitised by the BYOND hub
                          dangerouslySetInnerHTML={{ __html: server.status }}
                        />
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
                            {server.topic_status?.version?.includes("/tg/") && (
                              <img
                                src="/tgstation.png"
                                alt=""
                                width={16}
                                height={16}
                              />
                            )}
                            {server.topic_status?.version?.includes(
                              "Goonstation 13",
                            ) && (
                              <img
                                src="/goonstation.png"
                                alt=""
                                width={16}
                                height={16}
                              />
                            )}
                            <span className="font-bold">{server.name}</span>
                            {(server.status.includes("18+") ||
                              extractDiscordUrl(server.status)) && (
                              <span className="flex items-center gap-1 shrink-0">
                                {server.status.includes("18+") && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-900 text-red-200">
                                    18+
                                  </span>
                                )}
                                {(() => {
                                  const discordUrl = extractDiscordUrl(
                                    server.status,
                                  );
                                  return discordUrl ? (
                                    <a
                                      href={discordUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs px-1.5 py-0.5 rounded bg-indigo-900 text-indigo-200 hover:bg-indigo-800"
                                      title="Discord"
                                    >
                                      <FontAwesomeIcon icon={faDiscord} />
                                    </a>
                                  ) : null;
                                })()}
                              </span>
                            )}
                          </div>
                          {server.topic_status && (
                            <>
                              {(server.topic_status.mode ||
                                server.topic_status.map_name ||
                                server.topic_status.map) && (
                                <div className="dim text-sm">
                                  {[
                                    server.topic_status.mode &&
                                      server.topic_status.mode
                                        .charAt(0)
                                        .toUpperCase() +
                                        server.topic_status.mode.slice(1),
                                    server.topic_status.map_name ??
                                      server.topic_status.map,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </div>
                              )}
                              {(server.topic_status.round_id ||
                                server.topic_status.round_duration != null ||
                                server.topic_status.security_level) && (
                                <div className="dim text-sm">
                                  {[
                                    server.topic_status.round_id &&
                                      `#${server.topic_status.round_id}`,
                                    server.topic_status.round_duration !=
                                      null &&
                                      formatDuration(
                                        server.topic_status.round_duration,
                                      ),
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                  {server.topic_status.security_level &&
                                    server.topic_status.security_level !==
                                      "no_warning" && (
                                      <>
                                        {(server.topic_status.round_id ||
                                          server.topic_status.round_duration !=
                                            null) &&
                                          " · "}
                                        <span
                                          style={{
                                            color:
                                              server.topic_status
                                                .security_level === "red"
                                                ? "#f87171"
                                                : server.topic_status
                                                      .security_level === "blue"
                                                  ? "#60a5fa"
                                                  : "#4ade80",
                                          }}
                                        >
                                          {server.topic_status.security_level
                                            .charAt(0)
                                            .toUpperCase() +
                                            server.topic_status.security_level.slice(
                                              1,
                                            )}
                                        </span>
                                      </>
                                    )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <span className="players flex items-center gap-1">
                        <Users size={14} />
                        {server.players}
                        {server.topic_status?.popcap != null &&
                          server.topic_status.popcap !== "" &&
                          `/${server.topic_status.popcap}`}
                      </span>
                      {server.topic_status?.admins != null &&
                        server.topic_status.admins !== "" &&
                        server.topic_status.admins !== 0 && (
                          <span className="players flex items-center gap-1">
                            <Shield size={14} />
                            {server.topic_status.admins}
                          </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to="/s/$ip/$port"
                        params={{ ip, port }}
                        className="btn"
                      >
                        Info
                      </Link>
                      <a
                        href={`byond://${server.topic_status?.public_address ?? server.address}`}
                        className="btn btn-primary hidden sm:block"
                      >
                        Connect
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
