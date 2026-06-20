export interface SystemStatus {
  application: string;
  status: 'online';
  networkAvailable: boolean;
  localIp: string;
  localUrl: string;
  port: number;
  uptimeSeconds: number;
  timestamp: string;
}
