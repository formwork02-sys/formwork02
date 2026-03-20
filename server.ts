import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs-extra";
import multer from "multer";
import cors from "cors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const UPLOADS_DIR = path.join(__dirname, "public", "uploads");

// Ensure directories exist
fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(UPLOADS_DIR);
if (!fs.existsSync(PROJECTS_FILE)) {
  fs.writeJsonSync(PROJECTS_FILE, []);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Serve uploaded files
  app.use("/uploads", express.static(UPLOADS_DIR));

  // API Routes
  app.get("/api/projects", async (req, res) => {
    const projects = await fs.readJson(PROJECTS_FILE);
    res.json(projects);
  });

  app.post("/api/projects", upload.array("images"), async (req, res) => {
    const { title, category, description, date, isPrivate } = req.body;
    const files = req.files as Express.Multer.File[];
    
    const projects = await fs.readJson(PROJECTS_FILE);
    const newProject = {
      id: Date.now().toString(),
      title,
      category,
      description,
      date: date || new Date().toISOString().split('T')[0],
      isPrivate: isPrivate === 'true',
      images: files.map(f => `/uploads/${f.filename}`),
      createdAt: new Date().toISOString()
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
    
    const parsedExistingImages = existingImages ? JSON.parse(existingImages) : [];
    const newImages = files.map(f => `/uploads/${f.filename}`);
    
    projects[index] = {
      ...projects[index],
      title,
      category,
      description,
      date,
      isPrivate: isPrivate === 'true',
      images: [...parsedExistingImages, ...newImages]
    };
    
    await fs.writeJson(PROJECTS_FILE, projects);
    res.json(projects[index]);
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const { id } = req.params;
    let projects = await fs.readJson(PROJECTS_FILE);
    const project = projects.find((p: any) => p.id === id);
    
    if (project) {
      // Optionally delete image files
      for (const imgPath of project.images) {
        const fullPath = path.join(__dirname, "public", imgPath);
        if (await fs.pathExists(fullPath)) {
          await fs.remove(fullPath);
        }
      }
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
