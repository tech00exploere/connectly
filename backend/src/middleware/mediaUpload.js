import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    if (file.mimetype.startsWith("video/")) return cb(null, true);
    return cb(new Error("Only images and videos allowed"));
  },
  limits: { fileSize: 16 * 1024 * 1024 }
});

export default upload;
