export type TopicStatus = {
  mode?: string;
  map_name?: string;
  map?: string;
  public_address?: string;
  round_id?: number;
  round_duration?: number;
  security_level?: "red" | "green" | "blue" | "no_warning";
  version?: string;
  popcap?: number | "";
  admins?: number | "";
};

export type GameServer = {
  address: string;
  world_id: number;
  name: string;
  description: string;
  status: string;
  topic_status?: TopicStatus;
  players: number;
  updated_at: string;
};
