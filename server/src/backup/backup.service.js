import fs from "fs-extra";
import path from "path";
import { exec } from "child_process";
import { uploadToCloud } from "../utils/cloud.service.js";

const BACKUP_DIR = path.join(process.cwd(), "backups");

export const createBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  await fs.ensureDir(BACKUP_DIR);

  console.log("Saving backup to:", filePath);

  return new Promise((resolve, reject) => {
    const dbUrl = process.env.DATABASE_URL.split("?")[0];

   const command = `pg_dump --clean --if-exists "${dbUrl}" -f "${filePath}"`;

    exec(command, async (error) => {
      if (error) return reject(error);
      await uploadToCloud(filePath, fileName);
      resolve(fileName); // return only filename ✅
    });
  });
};
export const restoreBackup = (file) => {
  return new Promise((resolve, reject) => {
    const dbUrl = process.env.DATABASE_URL.split("?")[0];
    const fullPath = path.join(process.cwd(), "backups", file);

    if (!fs.existsSync(fullPath)) {
      return reject(new Error("File not found"));
    }

    const command = `psql "${dbUrl}" -c "DROP SCHEMA public CASCADE;" && psql "${dbUrl}" -c "CREATE SCHEMA public;" && psql "${dbUrl}" -f "${fullPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return reject(error);
      }

      console.log("✅ FULL RESTORE DONE");
      resolve("Restore completed");
    });
  });
};
