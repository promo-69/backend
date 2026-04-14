import { AsyncLocalStorage } from 'node:async_hooks';

export const RequestContext = new AsyncLocalStorage<{ isTestingRequest: boolean }>();
