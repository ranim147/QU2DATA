const router = require("express").Router();
import { Request, Response } from "express";

router.route("/").get((req: Request, res: Response) => {
  return res.send({
    Message: "Your REST API is WORKING ",
  });
});
export { router };
