/**
 * Runs once when the server starts, before any request is handled.
 * Applies the idempotent schema sync so new columns/tables (bookings seats, operating hours,
 * company wallet ledger, ...) exist before the first API call touches them after a deploy.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { ensureDatabaseSchema } = await import("./lib/db-schema-sync");
    const result = await ensureDatabaseSchema();
    console.log("[Startup] Database schema sync:", result.message);
  } catch (error) {
    // Never block startup: routes still call ensureDatabaseSchema lazily where it matters
    console.warn("[Startup] Database schema sync failed:", error);
  }
}
