import { NextFunction, Request, Response } from "express";

export function corsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, authorization"
    );
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

    // Répondre correctement au preflight CORS
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  };
}

