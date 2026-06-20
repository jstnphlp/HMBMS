export async function measure<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (process.env.NODE_ENV !== "development") {
    return fn();
  }

  const start = performance.now();
  try {
    return await fn();
  } finally {
    console.log(`[perf] ${label}: ${Math.round(performance.now() - start)}ms`);
  }
}
