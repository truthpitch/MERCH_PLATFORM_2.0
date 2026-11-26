// Reads a social setting from the environment. Hosting panels sometimes store a value with the
// quotes from .env.example included ("abc" instead of abc), which would make Meta reject the
// app ID or secret; surrounding spaces and quotes are removed.
export function envValue(name: string): string {
  return (process.env[name] ?? "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
}
