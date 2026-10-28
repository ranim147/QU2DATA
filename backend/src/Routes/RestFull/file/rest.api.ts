const router = require("express").Router();
import multer from "multer";
import { createFile } from "../../../App/File/service";
import { authMiddleware } from "../../../Middleware/auth";
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", authMiddleware(), upload.single("file"), createFile);

export { router };
