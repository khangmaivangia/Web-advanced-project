import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import liveScoresRouter from "../routes/liveScores.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (match && !match[1].startsWith("#")) {
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  });
}

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, service: "goalscorer-api" });
});

app.use("/api", liveScoresRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`goalscorer-api listening on http://localhost:${port}`);
});
