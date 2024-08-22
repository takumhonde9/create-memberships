export const createResponseMessage = (
  state: 'Success' | 'Failure',
  message: string,
): string => `[${state}]: ${message}.`;
