export type ServerStatus = "online" | "busy" | "crowded" | "maintenance" | "offline";

export interface GameServer {
  id: string;
  name: string;
  code: string;
  region: string;
  location: string;
  status: ServerStatus;
  ccu: number;
  maxCcu: number;
  ping: number;
  ipAddress: string;
  port: number;
  engine: string;
  version: string;
  cpuLoad: number | null; // %
  ramUsage: number | null; // %
  uptime: string;
  uptimeHours: number;
  lastRestart: string;
  isNew?: boolean;
  createdAt?: string;
  maintenanceMessage?: string;
  scheduledMaintenance?: {
    startTime: string;
    endTime: string;
    reason: string;
  };
}

export interface ClientVersionInfo {
  currentVersion: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
  unityEngineVersion: string;
  patchBundleUrl: string;
  patchSizeMb: number;
  releaseDate: string;
  changelogNotes: string;
}

export interface SystemHealthMetrics {
  totalCcu: number;
  totalCapacity: number;
  averagePing: number;
  onlineServersCount: number;
  totalServersCount: number;
  maintenanceServersCount: number;
  apiGatewayStatus: "optimal" | "degraded" | "outage";
  apiGatewayLatency: number;
  apiUptime: string;
  databaseStatus: "optimal" | "degraded" | "outage";
  databaseLatency: number;
  redisCacheStatus: "connected" | "disconnected";
  redisMemoryUsage: string;
}

// 🛡️ XÓA TOÀN BỘ MOCK DATA: Khởi tạo mảng rỗng để không bao giờ chớp hiện dữ liệu ảo
export const initialServers: GameServer[] = [];

export const initialSystemHealth: SystemHealthMetrics = {
  totalCcu: 0,
  totalCapacity: 0,
  averagePing: 28,
  onlineServersCount: 0,
  totalServersCount: 0,
  maintenanceServersCount: 0,
  apiGatewayStatus: "optimal",
  apiGatewayLatency: 28,
  apiUptime: "99.99%",
  databaseStatus: "optimal",
  databaseLatency: 28,
  redisCacheStatus: "connected",
  redisMemoryUsage: "0 MB",
};
