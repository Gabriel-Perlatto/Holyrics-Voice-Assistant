export const HTTP_FETCH = Symbol('HTTP_FETCH');

export type HttpFetch = typeof fetch;

export const httpClientProvider = {
  provide: HTTP_FETCH,
  useValue: globalThis.fetch,
};
