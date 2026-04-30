export const logError = (message: string, error?: unknown): void => {
  if (error === undefined) {
    console.error(message);
    return;
  }
  console.error(message, error);
};
