import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs-extra";
import multer from "multer";
import cors from "cors";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

fs.ensureDirSync(DATA_DIR);
if (!fs.existsSync(PROJECTS_FILE)) {
  fs.writeJsonSync(PROJECTS_FILE, []);
}

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// multer — 메모리 버퍼로 수신 후 Cloudinary로 전송
const upload = multer({ storage: multer.memoryStorage() });

function uploadToCloudinary(buffer: Buffer): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "formwork", resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

// Cloudinary URL에서 public_id 추출
// 형식: https://res.cloudinary.com/{cloud}/image/upload/v{ver}/{public_id}.{ext}
function getPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  return match ? match[1] : null;
}

async function deleteFromCloudinary(url: string) {
  const publicId = getPublicId(url);
  if (publicId) await cloudinary.uploader.destroy(publicId);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/projects", async (req, res) => {
    const projects = await fs.readJson(PROJECTS_FILE);
    res.json(projects);
  });

  app.post("/api/projects", upload.array("images"), async (req, res) => {
    const { title, category, description, date, isPrivate } = req.body;
    const files = req.files as Express.Multer.File[];

    const uploaded = await Promise.all(files.map(f => uploadToCloudinary(f.buffer)));

    const projects = await fs.readJson(PROJECTS_FILE);
    const newProject = {
      id: Date.now().toString(),
      title,
      category,
      description,
      date: date || new Date().toISOString().split("T")[0],
      isPrivate: isPrivate === "true",
      images: uploaded.map(u => u.url),
      createdAt: new Date().toISOString(),
    };

    projects.push(newProject);
    await fs.writeJson(PROJECTS_FILE, projects);
    res.json(newProject);
  });

  app.put("/api/projects/:id", upload.array("images"), async (req, res) => {
    const { id } = req.params;
    const { title, category, description, date, isPrivate, existingImages } = req.body;
    const files = req.files as Express.Multer.File[];

    let projects = await fs.readJson(PROJECTS_FILE);
    const index = projects.findIndex((p: any) => p.id === id);
    if (index === -1) return res.status(404).json({ error: "Project not found" });

    const kept: string[] = existingImages ? JSON.parse(existingImages) : [];

    // 제거된 이미지 Cloudinary에서 삭제
    const removed = (projects[index].images as string[]).filter(img => !kept.includes(img));
    await Promise.all(removed.map(deleteFromCloudinary));

    // 새 이미지 Cloudinary 업로드
    const uploaded = await Promise.all(files.map(f => uploadToCloudinary(f.buffer)));

    projects[index] = {
      ...projects[index],
      title,
      category,
      description,
      date,
      isPrivate: isPrivate === "true",
      images: [...kept, ...uploaded.map(u => u.url)],
    };

    await fs.writeJson(PROJECTS_FILE, projects);
    res.json(projects[index]);
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const { id } = req.params;
    let projects = await fs.readJson(PROJECTS_FILE);
    const project = projects.find((p: any) => p.id === id);

    if (project) {
      await Promise.all((project.images as string[]).map(deleteFromCloudinary));
    }

    projects = projects.filter((p: any) => p.id !== id);
    await fs.writeJson(PROJECTS_FILE, projects);
    res.json({ success: true });
  });

  app.post("/api/verify-password", (req, res) => {
    const { password, type } = req.body;
    if (type === "admin") {
      res.json({ success: password === "1111" });
    } else {
      res.json({ success: password === "1234" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
