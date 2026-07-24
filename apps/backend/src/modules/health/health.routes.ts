import { Router } from "express";

import { database } from "../../db/pool.js";

export const healthRouter = Router();

healthRouter.get("/", async (_request, response) => {
  const databaseResult = await database.query<{
    database_time: string;
  }>("SELECT NOW()::text AS database_time");

  response.status(200).json({
    status: "ok",
    service: "thinktwice-backend",
    database: "connected",
    databaseTime: databaseResult.rows[0]?.database_time ?? null,
    uptimeSeconds: Math.round(process.uptime()),
  });
});