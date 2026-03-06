import "dotenv/config";
import { execSync } from "child_process";
import { createApp } from "./app";
import { pool } from "./db/postgres";
import { env } from "./config/env";

async function bootstrap() {
  await pool.query("SELECT 1");
  console.log("Database connected");

  // Automatically kill any process using the configured port
  try {
    execSync(`lsof -ti tcp:${env.PORT} | xargs kill -9`, { stdio: "ignore" });
    console.log(`✓ Freed up port ${env.PORT}`);
  } catch (err) {
    // Port is already free, continue
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`ATV API listening on port ${env.PORT}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
