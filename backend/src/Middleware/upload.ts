import multer from "multer";
import path from "path";
import { generateAlphanumericString } from "../Helpers/GeneralHelpers";
function createUploadMiddleware(directory) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, directory);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname); // Get the extension from the original filename
      cb(null, generateAlphanumericString(10) + Date.now() + ext);
    },
  });

  return multer({ storage: storage });
}

export { createUploadMiddleware };
