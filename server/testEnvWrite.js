import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, ".env");

const key = "RELAY";
const value = "true";

let env = fs.readFileSync(envPath, "utf8");

const regex = new RegExp(`^${key}=.*$`, "m");

if (regex.test(env)) {
  env = env.replace(regex, `${key}=${value}`);
  console.log(`Updated ${key}`);
} else {
  env += `\n${key}=${value}\n`;
  console.log(`Added ${key}`);
}

fs.writeFileSync(envPath, env);

console.log("Done!");