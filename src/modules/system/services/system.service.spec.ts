import type { NetworkInterfaceInfo } from 'node:os';
import type { NetworkInterfacesReader } from '../providers/network-interfaces.provider';
import { SystemService } from './system.service';

const networkAddress = (
  address: string,
  internal = false,
): NetworkInterfaceInfo => ({
  address,
  netmask: '255.255.255.0',
  family: 'IPv4',
  mac: '00:00:00:00:00:00',
  internal,
  cidr: `${address}/24`,
});

describe('SystemService', () => {
  it('prioriza um endereço IPv4 privado da rede local', () => {
    const readNetworkInterfaces = jest.fn(() => ({
      vpn: [networkAddress('203.0.113.10')],
      ethernet: [networkAddress('192.168.1.25')],
    })) as NetworkInterfacesReader;
    const service = new SystemService(readNetworkInterfaces);

    expect(service.getLocalIp()).toBe('192.168.1.25');
  });

  it('usa o primeiro IPv4 externo quando não encontra endereço privado', () => {
    const readNetworkInterfaces = jest.fn(() => ({
      ethernet: [networkAddress('203.0.113.10')],
    })) as NetworkInterfacesReader;
    const service = new SystemService(readNetworkInterfaces);

    expect(service.getLocalIp()).toBe('203.0.113.10');
  });

  it('usa loopback quando não encontra endereço utilizável', () => {
    const readNetworkInterfaces = jest.fn(() => ({
      loopback: [networkAddress('127.0.0.1', true)],
    })) as NetworkInterfacesReader;
    const service = new SystemService(readNetworkInterfaces);

    expect(service.getLocalIp()).toBe('127.0.0.1');
  });

  it('usa loopback quando a leitura das interfaces falha', () => {
    const readNetworkInterfaces = jest.fn(() => {
      throw new Error('interfaces indisponíveis');
    }) as NetworkInterfacesReader;
    const service = new SystemService(readNetworkInterfaces);

    expect(service.getLocalIp()).toBe('127.0.0.1');
  });

  it('valida a porta configurada', () => {
    const service = new SystemService(jest.fn(() => ({})));

    expect(service.getPort('4000')).toBe(4000);
    expect(service.getPort('0')).toBe(3000);
    expect(service.getPort('invalid')).toBe(3000);
  });

  it('retorna o status básico do sistema', () => {
    const readNetworkInterfaces = jest.fn(() => ({
      ethernet: [networkAddress('10.0.0.20')],
    })) as NetworkInterfacesReader;
    const service = new SystemService(readNetworkInterfaces);

    expect(service.getStatus(3456)).toEqual(
      expect.objectContaining({
        application: 'Holyrics Voice Assistant',
        status: 'online',
        networkAvailable: true,
        localIp: '10.0.0.20',
        localUrl: 'http://10.0.0.20:3456',
        port: 3456,
      }),
    );
  });
});
