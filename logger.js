import { Log as middlewareLog } from "@logging-middleware";

export async function Log(stack, level, pkg, message) {
  try {
    await middlewareLog(stack, level, pkg, message);
  } catch {
    // Silent failure, logging should never break the UI.
  }
}
