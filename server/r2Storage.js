import dotenv from "dotenv";
dotenv.config();

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

console.log("Environment Check:");
console.log("R2_ENDPOINT:", process.env.R2_ENDPOINT);
console.log("R2_BUCKET:", process.env.R2_BUCKET);
console.log(
  "R2_ACCESS_KEY:",
  process.env.R2_ACCESS_KEY ? "Loaded" : "Missing"
);
console.log(
  "R2_SECRET_KEY:",
  process.env.R2_SECRET_KEY ? "Loaded" : "Missing"
);

const client = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

const bucket = process.env.R2_BUCKET;

async function getUsage() {
  if (!bucket) {
    throw new Error("R2_BUCKET is missing from .env");
  }

  let token;
  let totalBytes = 0;
  let totalFiles = 0;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: token,
      })
    );

    const files = response.Contents || [];

    for (const file of files) {
      totalBytes += file.Size || 0;
      totalFiles++;
    }

    token = response.NextContinuationToken;
  } while (token);

  console.log("\n========== R2 STORAGE REPORT ==========");
  console.log("Bucket:", bucket);
  console.log("Files:", totalFiles);
  console.log("Bytes:", totalBytes);
  console.log("MB:", (totalBytes / 1024 / 1024).toFixed(2));
  console.log("GB:", (totalBytes / 1024 / 1024 / 1024).toFixed(2));
  console.log("=======================================\n");
}

getUsage().catch((err) => {
  console.error("Error:", err.message);
});