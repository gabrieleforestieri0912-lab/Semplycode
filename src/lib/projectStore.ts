export interface ChatProject {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

const STORAGE_PROJECTS_KEY = "semplycode:projects:v2";
const STORAGE_MAP_KEY = "semplycode:chat_project_map:v2";

export const PROJECT_COLORS = [
  { id: "emerald", label: "Smeraldo", bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/40", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  { id: "blue", label: "Blu", bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/40", badge: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  { id: "violet", label: "Viola", bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/40", badge: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  { id: "amber", label: "Ambra", bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/40", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  { id: "rose", label: "Rosa", bg: "bg-rose-500", text: "text-rose-400", border: "border-rose-500/40", badge: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  { id: "cyan", label: "Ciano", bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500/40", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
];

export function getProjectColor(colorId?: string) {
  return PROJECT_COLORS.find((c) => c.id === colorId) || PROJECT_COLORS[0];
}

export function loadProjectsFromStorage(): ChatProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveProjectsToStorage(projects: ChatProject[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error("Failed to save projects to storage:", err);
  }
}

export function loadChatProjectMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_MAP_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveChatProjectMap(map: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(map));
  } catch (err) {
    console.error("Failed to save chat project map:", err);
  }
}

export function createProject(name: string, color?: string): ChatProject {
  const newProject: ChatProject = {
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || "Nuovo Progetto",
    color: color || PROJECT_COLORS[0].id,
    createdAt: Date.now(),
  };

  const list = loadProjectsFromStorage();
  list.unshift(newProject);
  saveProjectsToStorage(list);
  return newProject;
}

export function deleteProject(projectId: string): void {
  const list = loadProjectsFromStorage().filter((p) => p.id !== projectId);
  saveProjectsToStorage(list);

  // Rimuovi anche le associazioni
  const map = loadChatProjectMap();
  let modified = false;
  for (const chatId in map) {
    if (map[chatId] === projectId) {
      delete map[chatId];
      modified = true;
    }
  }
  if (modified) saveChatProjectMap(map);
}

export function renameProject(projectId: string, newName: string): void {
  const list = loadProjectsFromStorage();
  const found = list.find((p) => p.id === projectId);
  if (found) {
    found.name = newName.trim();
    saveProjectsToStorage(list);
  }
}

export function assignChatToProject(chatId: string, projectId: string | null): void {
  const map = loadChatProjectMap();
  if (!projectId) {
    delete map[chatId];
  } else {
    map[chatId] = projectId;
  }
  saveChatProjectMap(map);
}
