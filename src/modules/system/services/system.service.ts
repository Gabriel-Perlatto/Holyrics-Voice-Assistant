import { Inject, Injectable, Logger } from '@nestjs/common';
import type { NetworkInterfaceInfo } from 'node:os';
import type { SystemStatus } from '../interfaces/system-status.interface';
import {
  NETWORK_INTERFACES_READER,
  type NetworkInterfacesReader,
} from '../providers/network-interfaces.provider';

const DEFAULT_PORT = 3000;
const LOOPBACK_IP = '127.0.0.1';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(
    @Inject(NETWORK_INTERFACES_READER)
    private readonly readNetworkInterfaces: NetworkInterfacesReader,
  ) {}

  getPort(portValue = process.env.PORT): number {
    const port = Number(portValue);

    return Number.isInteger(port) && port > 0 && port <= 65_535
      ? port
      : DEFAULT_PORT;
  }

  getLocalIp(): string {
    try {
      const addresses = Object.values(this.readNetworkInterfaces())
        .flatMap((network) => network ?? [])
        .filter(this.isUsableIpv4Address);

      return (
        addresses.find(({ address }) => this.isPrivateIpv4(address))
          ?.address ??
        addresses[0]?.address ??
        LOOPBACK_IP
      );
    } catch {
      this.logger.warn(
        'Não foi possível detectar o IP da rede local. Usando 127.0.0.1.',
      );

      return LOOPBACK_IP;
    }
  }

  getLocalUrl(port = this.getPort()): string {
    return `http://${this.getLocalIp()}:${port}`;
  }

  getStatus(port = this.getPort()): SystemStatus {
    const localIp = this.getLocalIp();

    return {
      application: 'Holyrics Voice Assistant',
      status: 'online',
      networkAvailable: localIp !== LOOPBACK_IP,
      localIp,
      localUrl: `http://${localIp}:${port}`,
      port,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  private readonly isUsableIpv4Address = (
    network: NetworkInterfaceInfo,
  ): boolean => network.family === 'IPv4' && !network.internal;

  private isPrivateIpv4(address: string): boolean {
    if (address.startsWith('10.') || address.startsWith('192.168.')) {
      return true;
    }

    const [firstOctet, secondOctet] = address
      .split('.')
      .map((octet) => Number(octet));

    return firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31;
  }
}
