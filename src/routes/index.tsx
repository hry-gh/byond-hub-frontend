import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Shield, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "../api";
import type { GameServer } from "../types";
import {
  formatDuration,
  formatRelativeTime,
  formatShuttleTimer,
  parseAsUTC,
} from "../utils";

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

function SettingsDropdown({
  showStatus,
  setShowStatus,
  show18Plus,
  setShow18Plus,
  showOffline,
  setShowOffline,
}: {
  showStatus: boolean;
  setShowStatus: (v: boolean) => void;
  show18Plus: boolean;
  setShow18Plus: (v: boolean) => void;
  showOffline: boolean;
  setShowOffline: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn flex items-center gap-2"
      >
        <Settings size={16} />
        <span>Filters</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 panel p-3 space-y-2 z-10 min-w-48 !bg-light">
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
          <label className="flex items-center gap-2 cursor-pointer w-fit text-sm">
            <input
              type="checkbox"
              checked={showOffline}
              onChange={(e) => setShowOffline(e.target.checked)}
            />
            <span className="dim">Show offline servers</span>
          </label>
        </div>
      )}
    </div>
  );
}

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
  const [showOffline, setShowOffline] = useState(() => {
    if (typeof document === "undefined") return false;
    const saved = document.cookie
      .split("; ")
      .find((row) => row.startsWith("showOffline="))
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
    setCookie("showOffline", JSON.stringify(showOffline));
  }, [showOffline]);

  useEffect(() => {
    fetch(`${API_URL}/servers`)
      .then((data) => data.json().then((json) => setData(json)))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = data?.filter(
    (server) =>
      (show18Plus || !server.status.includes("18+")) &&
      (showOffline || server.online),
  );

  const totalPlayers =
    data?.filter((server) => server.online).reduce((total, server) => total + server.players, 0) ?? 0;

  const lastUpdated = filteredData?.length
    ? new Date(
        Math.max(
          ...filteredData.map((s) => parseAsUTC(s.updated_at).getTime()),
        ),
      )
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2">
          <img src="/ss13.png" alt="" width={24} height={24} />
          SS13 Hub
        </h1>
        <div className="flex items-center gap-2">
          <Link to="/stats" className="btn">
            Global
          </Link>
          <SettingsDropdown
            showStatus={showStatus}
            setShowStatus={setShowStatus}
            show18Plus={show18Plus}
            setShow18Plus={setShow18Plus}
            showOffline={showOffline}
            setShowOffline={setShowOffline}
          />
        </div>
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

      <div className="space-y-2">
        {loading ? (
          <div className="panel p-4 dim">Loading servers...</div>
        ) : filteredData?.length === 0 ? (
          <div className="panel p-4 dim">No servers online</div>
        ) : (
          filteredData
            ?.sort((a, b) => {
              // Offline servers go to the bottom
              if (a.online !== b.online) return a.online ? -1 : 1;
              // Then sort by player count
              return b.players - a.players;
            })
            .map((server, index) => {
              const [ip, port] = server.address.split(":");
              return (
                <div
                  key={server.address}
                  className="server-row p-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="rank">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      {showStatus ? (
                        <span
                          // biome-ignore lint/security/noDangerouslySetInnerHtml: mostly sanitised by the BYOND hub
                          dangerouslySetInnerHTML={{ __html: server.status }}
                        />
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-start gap-x-2 gap-y-1">
                            {server.topic_status?.version?.includes("/tg/") && (
                              <img
                                src="/tgstation.png"
                                alt=""
                                width={16}
                                height={16}
                                className="mt-0.5 shrink-0"
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
                                className="mt-0.5 shrink-0"
                              />
                            )}
                            <span>
                              <span className="font-bold">{server.name}</span>
                              {server.status.includes("18+") && (
                                <span className="text-xs px-1.5 h-5 ml-2 rounded bg-red-900 text-red-200 inline-flex items-center align-middle">
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
                                    className="text-xs px-1.5 h-5 ml-1 rounded bg-indigo-900 text-indigo-200 hover:bg-indigo-800 inline-flex items-center align-middle"
                                    title="Discord"
                                  >
                                    <FontAwesomeIcon icon={faDiscord} />
                                  </a>
                                ) : null;
                              })()}
                            </span>
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
                              {server.topic_status.shuttle_mode &&
                                server.topic_status.shuttle_mode !== "idle" && (
                                  <div className="dim text-sm">
                                    Shuttle:{" "}
                                    <span className="text-yellow-400">
                                      {server.topic_status.shuttle_mode}
                                    </span>
                                    {server.topic_status.shuttle_timer !=
                                      null &&
                                      server.topic_status.shuttle_timer > 0 && (
                                        <span className="text-yellow-400">
                                          {" "}
                                          (
                                          {formatShuttleTimer(
                                            server.topic_status.shuttle_timer,
                                          )}
                                          )
                                        </span>
                                      )}
                                  </div>
                                )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 shrink-0">
                    {server.online && (
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
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
                    )}
                    {!server.online && (
                      <span className="dim text-sm">Offline</span>
                    )}
                    <div className="flex gap-2">
                      <Link
                        to="/s/$ip/$port"
                        params={{ ip, port }}
                        className="btn"
                      >
                        Info
                      </Link>
                      {server.online ? (
                        <a
                          href={`byond://${server.topic_status?.public_address ?? server.address}`}
                          className="btn btn-primary hidden sm:block"
                        >
                          Connect
                        </a>
                      ) : (
                        <span className="btn btn-disabled hidden sm:block opacity-50 cursor-not-allowed">
                          Connect
                        </span>
                      )}
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
