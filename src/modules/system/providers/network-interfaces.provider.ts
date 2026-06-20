import { networkInterfaces } from 'node:os';

export const NETWORK_INTERFACES_READER = Symbol(
  'NETWORK_INTERFACES_READER',
);

export type NetworkInterfacesReader = typeof networkInterfaces;

export const networkInterfacesProvider = {
  provide: NETWORK_INTERFACES_READER,
  useValue: networkInterfaces,
};
