import cron from "node-cron";
import { createBackup } from "./backup.service.js";

export function startBackupScheduler() {

  // Daily backup at 1 AM
  cron.schedule("0 1 * * *", async () => {
    try {
      console.log("📦 Running database backup...");

      const file = await createBackup();

      console.log("✅ Backup created:", file);

    } catch (err) {
      console.error("❌ Backup failed:", err.message);
    }
  });

}