import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  X, 
  ChevronRight, 
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Menu,
  LogOut
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  isPrivate: boolean;
  images: string[];
  createdAt: string;
}

const CATEGORIES = [
  "로고",
  "일러스트",
  "대회·행사",
  "패키지",
  "인쇄물",
  "광고",
  "명함"
];

// --- Contexts ---
const AuthContext = createContext<{
  isEntered: boolean;
  isAdmin: boolean;
  enter: (pw: string) => Promise<boolean>;
  loginAdmin: (pw: string) => Promise<boolean>;
  logout: () => void;
  exit: () => void;
} | null>(null);

const ProjectContext = createContext<{
  projects: Project[];
  loading: boolean;
  addProject: (formData: FormData) => Promise<void>;
  updateProject: (id: string, formData: FormData) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refresh: () => void;
} | null>(null);

// --- Components ---

const EntryGate = () => {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const auth = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await auth?.enter(pw);
    if (!success) {
      setError(true);
      setPw("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100]">
      <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
        <h1 className="text-[20vw] font-black">formwork</h1>
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xs text-center"
      >
        <h2 className="text-sm uppercase mb-8 text-zinc-500">Enter Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError(false);
            }}
            placeholder="••••"
            className={cn(
              "w-full bg-transparent border-b border-zinc-800 py-4 text-center text-2xl focus:outline-none focus:border-white transition-colors",
              error && "border-red-500 text-red-500"
            )}
            autoFocus
          />
          {error && <p className="text-xs text-red-500 mt-2">Incorrect password. Please try again.</p>}
        </form>
      </motion.div>
    </div>
  );
};

const Hero = () => {
  return (
    <section className="h-screen flex flex-col items-center justify-center relative overflow-hidden px-6 bg-black">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="text-center z-10"
      >
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 mb-12">formwork design studio</h2>
        </div>
        
        <h1 className="text-[8vw] md:text-[5vw] font-black leading-[1.1] mb-12 max-w-5xl mx-auto">
          CRAFTING <span className="text-zinc-500 italic font-light">FORM</span><br />
          CAPTURING <span className="text-zinc-500 italic font-light">ESSENCE</span>
        </h1>

        <div className="max-w-2xl mx-auto">
          <p className="text-sm md:text-base font-light leading-relaxed text-zinc-400">
            형태를 만드는 과정, 본질을 담는 디자인.
            <br />
            우리는 보이지 않는 가치를 시각적 언어로 번역합니다.
          </p>
        </div>
      </motion.div>
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
        <div className="w-[1px] h-12 bg-zinc-800 relative overflow-hidden">
          <motion.div 
            animate={{ y: [-48, 48] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-0 bg-white h-full"
          />
        </div>
      </div>
    </section>
  );
};

const WorkArchive = () => {
  const [activeCategory, setActiveCategory] = useState("전체");
  const projectCtx = useContext(ProjectContext);
  const auth = useContext(AuthContext);
  
  const filteredProjects = projectCtx?.projects.filter(p => 
    (activeCategory === "전체" || p.category === activeCategory) &&
    (!p.isPrivate || auth?.isAdmin)
  ) || [];

  return (
    <section id="work" className="py-24 px-6 max-w-[1800px] mx-auto">
      {/* Category Nav */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-24 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-6 border-b border-zinc-900">
        {["전체", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "text-xs md:text-sm uppercase transition-all relative py-2",
              activeCategory === cat ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {cat}
            {activeCategory === cat && (
              <motion.div 
                layoutId="activeCat"
                className="absolute bottom-0 left-0 right-0 h-px bg-white"
              />
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div
              layout
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative aspect-[4/3] overflow-hidden bg-zinc-900 cursor-pointer"
            >
              <Link to={`/project/${project.id}`}>
                <img
                  src={project.images[0]}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center p-6">
                  <span className="text-[10px] uppercase text-zinc-400 mb-2">{project.category}</span>
                  <h3 className="text-xl font-bold">{project.title}</h3>
                  <div className="mt-4 w-8 h-px bg-white/40" />
                </div>
                {project.isPrivate && (
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full">
                    <Lock size={14} className="text-zinc-400" />
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {filteredProjects.length === 0 && !projectCtx?.loading && (
        <div className="py-48 text-center">
          <p className="text-zinc-500 uppercase text-sm">No projects found in this category.</p>
        </div>
      )}
    </section>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const projectCtx = useContext(ProjectContext);
  const navigate = useNavigate();
  const project = projectCtx?.projects.find(p => p.id === id);

  if (!project) return null;

  return (
    <div className="min-h-screen bg-black">
      <div className="flex flex-col lg:flex-row">
        {/* Sticky Info */}
        <div className="lg:w-1/3 lg:h-screen lg:sticky lg:top-0 p-8 md:p-16 flex flex-col justify-between border-r border-zinc-900">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-12 group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs uppercase">Back to Archive</span>
            </button>
            
            <span className="text-xs uppercase text-zinc-500 mb-4 block">{project.category}</span>
            <h1 className="text-4xl md:text-6xl font-black mb-8">{project.title}</h1>
            
            <div className="space-y-8 max-w-md">
              <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
              
              <div className="pt-8 border-t border-zinc-900 flex gap-12">
                <div>
                  <span className="text-[10px] uppercase text-zinc-600 block mb-1">Date</span>
                  <span className="text-sm font-medium">{project.date}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-zinc-600 block mb-1">Client</span>
                  <span className="text-sm font-medium">formwork</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 lg:mt-0">
            <p className="text-[10px] text-zinc-700 uppercase">© 2026 formwork design studio</p>
          </div>
        </div>

        {/* Image Feed */}
        <div className="lg:w-2/3 p-4 md:p-8 space-y-4">
          {project.images.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
            >
              <img
                src={img}
                alt={`${project.title} - ${idx}`}
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const auth = useContext(AuthContext);
  const projectCtx = useContext(ProjectContext);
  const navigate = useNavigate();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await auth?.loginAdmin(pw);
    if (success) {
      setIsLoggedIn(true);
    } else {
      setError(true);
      setPw("");
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory(CATEGORIES[0]);
    setDescription("");
    setDate(new Date().toISOString().split('T')[0]);
    setIsPrivate(false);
    setSelectedFiles([]);
    setExistingImages([]);
    setEditingProject(null);
    setIsAdding(false);
  };

  const handleEdit = (p: Project) => {
    setEditingProject(p);
    setTitle(p.title);
    setCategory(p.category);
    setDescription(p.description);
    setDate(p.date);
    setIsPrivate(p.isPrivate);
    setExistingImages(p.images);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("date", date);
    formData.append("isPrivate", String(isPrivate));
    
    selectedFiles.forEach(file => {
      formData.append("images", file);
    });

    if (editingProject) {
      formData.append("existingImages", JSON.stringify(existingImages));
      await projectCtx?.updateProject(editingProject.id, formData);
    } else {
      await projectCtx?.addProject(formData);
    }
    
    resetForm();
  };

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-[110]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm p-8 bg-zinc-900 border border-zinc-800 rounded-2xl"
        >
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Lock className="text-black" size={20} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center mb-2">Admin Access</h2>
          <p className="text-zinc-500 text-sm text-center mb-8">Please enter the administrative password.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
              placeholder="••••"
              autoFocus
            />
            {error && <p className="text-xs text-red-500">Access denied.</p>}
            <button className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors">
              Login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black">Dashboard</h1>
            <p className="text-zinc-500 text-sm">Manage your portfolio projects</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-white text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors"
            >
              <Plus size={18} />
              New Project
            </button>
            <button 
              onClick={() => {
                auth?.logout();
                navigate("/");
              }}
              className="bg-zinc-900 text-white px-4 py-2 rounded-full border border-zinc-800 hover:bg-zinc-800 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <span className="text-zinc-500 text-xs uppercase block mb-2">Total Projects</span>
            <span className="text-4xl font-black">{projectCtx?.projects.length}</span>
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <span className="text-zinc-500 text-xs uppercase block mb-2">Private</span>
            <span className="text-4xl font-black">{projectCtx?.projects.filter(p => p.isPrivate).length}</span>
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <span className="text-zinc-500 text-xs uppercase block mb-2">Categories</span>
            <span className="text-4xl font-black">{CATEGORIES.length}</span>
          </div>
        </div>

        {/* Project List */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase">
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {projectCtx?.projects.map(project => (
                <tr key={project.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={project.images[0]} className="w-12 h-12 object-cover rounded-lg" referrerPolicy="no-referrer" />
                      <span className="font-bold">{project.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{project.category}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{project.date}</td>
                  <td className="px-6 py-4">
                    {project.isPrivate ? (
                      <span className="flex items-center gap-1 text-xs text-amber-500"><Lock size={12} /> Private</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-emerald-500"><Eye size={12} /> Public</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(project)}
                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button 
                        onClick={() => projectCtx.deleteProject(project.id)}
                        className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl"
            >
              <div className="p-8 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 z-10">
                <h2 className="text-2xl font-black">
                  {editingProject ? "Edit Project" : "New Project"}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-zinc-800 rounded-full">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase text-zinc-500 block mb-2">Project Title</label>
                      <input 
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                        placeholder="Project name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-zinc-500 block mb-2">Category</label>
                      <select 
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors appearance-none"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-zinc-500 block mb-2">Date</label>
                      <input 
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPrivate(!isPrivate)}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-colors",
                          isPrivate ? "bg-white" : "bg-zinc-800"
                        )}
                      >
                        <motion.div 
                          animate={{ x: isPrivate ? 26 : 4 }}
                          className={cn("w-4 h-4 rounded-full absolute top-1", isPrivate ? "bg-black" : "bg-zinc-500")}
                        />
                      </button>
                      <span className="text-sm">Private Project</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase text-zinc-500 block mb-2">Description</label>
                    <textarea 
                      required
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={8}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors resize-none"
                      placeholder="Tell the story of this project..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase text-zinc-500 block mb-4">Project Images</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Existing Images */}
                    {existingImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    
                    {/* New Files Preview */}
                    {selectedFiles.map((file, idx) => (
                      <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    <label className="aspect-square border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-zinc-600 transition-colors">
                      <Plus size={24} className="text-zinc-500" />
                      <span className="text-[10px] uppercase text-zinc-500">Add Images</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => {
                          if (e.target.files) {
                            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-8 border-t border-zinc-800 flex justify-end gap-4">
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-white text-black px-12 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                  >
                    {editingProject ? "Save Changes" : "Publish Project"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MainLayout = () => {
  const auth = useContext(AuthContext);
  
  if (!auth?.isEntered) return <EntryGate />;

  return (
    <div className="bg-black min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-8 flex justify-between items-center pointer-events-none">
        <Link to="/" className="pointer-events-auto">
          <h2 className="text-xl font-black">formwork</h2>
        </Link>
        <div className="flex gap-8 pointer-events-auto">
          <Link to="/admin" className="text-[10px] uppercase text-zinc-500 hover:text-white transition-colors">Admin</Link>
        </div>
      </nav>
      
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Hero />
              <WorkArchive />
            </motion.div>
          } />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </AnimatePresence>
      
      <footer className="py-32 px-6 border-t border-zinc-900">
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-8">
            <h2 className="text-4xl font-black">formwork</h2>
            <p className="text-sm md:text-base font-light leading-relaxed text-zinc-300 max-w-xl">
              우리는 단순한 디자인을 넘어, 당신의 브랜드가 가진 진심을 가장 아름다운 형태로 빚어냅니다. 
              모든 프로젝트에 우리의 혼을 담아, 당신의 가치가 세상에 온전히 닿을 수 있도록 최선을 다하겠습니다.
            </p>
          </div>
          <div className="flex flex-col justify-end md:items-end gap-8">
            <div className="space-y-2 md:text-right">
              <span className="text-[10px] uppercase text-zinc-500 block">Contact</span>
              <a href="mailto:formwork02@gmail.com" className="text-sm md:text-base hover:text-zinc-400 transition-colors block">formwork02@gmail.com</a>
              <a href="tel:010-9357-8259" className="text-sm md:text-base hover:text-zinc-400 transition-colors block">010-9357-8259</a>
            </div>
          </div>
        </div>
        <div className="mt-24 pt-8 border-t border-zinc-900 text-[10px] uppercase text-zinc-700">
          © 2026 formwork design studio. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

// --- Providers ---

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isEntered, setIsEntered] = useState(() => localStorage.getItem("formwork_entered") === "true");
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem("formwork_admin") === "true");

  const enter = async (pw: string) => {
    const res = await fetch("/api/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, type: "entry" })
    });
    const data = await res.json();
    if (data.success) {
      setIsEntered(true);
      localStorage.setItem("formwork_entered", "true");
      return true;
    }
    return false;
  };

  const loginAdmin = async (pw: string) => {
    const res = await fetch("/api/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, type: "admin" })
    });
    const data = await res.json();
    if (data.success) {
      setIsAdmin(true);
      localStorage.setItem("formwork_admin", "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem("formwork_admin");
  };

  const exit = () => {
    setIsEntered(false);
    setIsAdmin(false);
    localStorage.removeItem("formwork_entered");
    localStorage.removeItem("formwork_admin");
  };

  return (
    <AuthContext.Provider value={{ isEntered, isAdmin, enter, loginAdmin, logout, exit }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const addProject = async (formData: FormData) => {
    await fetch("/api/projects", {
      method: "POST",
      body: formData
    });
    fetchProjects();
  };

  const updateProject = async (id: string, formData: FormData) => {
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      body: formData
    });
    fetchProjects();
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    await fetch(`/api/projects/${id}`, {
      method: "DELETE"
    });
    fetchProjects();
  };

  return (
    <ProjectContext.Provider value={{ projects, loading, addProject, updateProject, deleteProject, refresh: fetchProjects }}>
      {children}
    </ProjectContext.Provider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Router>
          <MainLayout />
        </Router>
      </ProjectProvider>
    </AuthProvider>
  );
}
