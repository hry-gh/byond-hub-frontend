import { createFileRoute, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL } from "../api";

export const Route = createFileRoute("/")({ component: App });

const setCookie = (name: string, value: string) => {
  if (typeof window !== "undefined" && "cookieStore" in window) {
    window.cookieStore.set(name, value);
  } else {
    // biome-ignore lint/suspicious/noDocumentCookie: we try to do it properly above
    document.cookie = `${name}=${value}; path=/`;
  }
};

type GameServer = {
  world_id: number;
  name: string;
  description: string;
  status: string;
  players: number;
  updated_at: string;
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

  useEffect(() => {
    setCookie("showStatus", JSON.stringify(showStatus));
  }, [showStatus]);

  useEffect(() => {
    fetch(`${API_URL}/servers`)
      .then((data) => data.json().then((json) => setData(json)))
      .finally(() => setLoading(false));
  }, []);

  const totalPlayers =
    data?.reduce((total, server) => total + server.players, 0) ?? 0;

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
            {loading ? "—" : (data?.length ?? 0)}
          </span>
        </div>
        <div>
          <span className="stat">Players </span>
          <span className="stat-value">{loading ? "—" : totalPlayers}</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer w-fit text-sm">
          <input
            type="checkbox"
            checked={showStatus}
            onChange={(e) => setShowStatus(e.target.checked)}
          />
          <span className="dim">Show hub status</span>
        </label>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="panel p-4 dim">Loading servers...</div>
        ) : data?.length === 0 ? (
          <div className="panel p-4 dim">No servers online</div>
        ) : (
          data
            ?.sort((a, b) => b.players - a.players)
            .map((server, index) => (
              <div
                key={server.world_id}
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
                      <span>{server.name}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="players flex items-center gap-1">
                    <Users size={14} />
                    {server.players}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      to="/history/$id"
                      params={{ id: server.world_id.toString() }}
                      className="btn"
                    >
                      History
                    </Link>
                    <a
                      href={`byond://BYOND.world.${server.world_id}`}
                      className="btn btn-primary"
                    >
                      Connect
                    </a>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
