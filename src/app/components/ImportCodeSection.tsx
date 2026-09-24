"use client";

import React, { useState, useCallback, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, Play } from "lucide-react";
import { motion } from "framer-motion";
import Toast, { useToast } from "./Toast";

interface FileData {
  name: string;
  content: string | ArrayBuffer | null;
  language: string;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 100 * 1024;

export default function ImportCodeSection() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast, showToast } = useToast();
  const router = useRouter();

  const detectLanguageFromExt = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', java: 'java', cpp: 'cpp', c: 'c', go: 'go', rs: 'rust',
      php: 'php', sql: 'sql', css: 'css', html: 'html', json: 'json'
    };
    return map[ext] || 'javascript';
  };

  const handleFiles = useCallback((newFiles: File[]) => {
    const validFiles: File[] = [];

    for (const file of newFiles) {
      if (files.length + validFiles.length >= MAX_FILES) break;

      if (file.size > MAX_FILE_SIZE) {
        showToast(`Il file ${file.name} è troppo grande (max 100KB)`, "error");
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const allowed = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'sql', 'css', 'html', 'json'];
      if (!allowed.includes(ext)) {
        showToast(`Formato non supportato: ${file.name}`, "error");
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    Promise.all<FileData>(
      validFiles.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
              resolve({
                name: file.name,
                content: e.target?.result ?? null,
                language: detectLanguageFromExt(file.name),
              });
            };
            reader.readAsText(file);
          })
      )
    ).then((fileData) => {
      setFiles((prev) => [...prev, ...fileData].slice(0, MAX_FILES));
    });
  }, [files]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    handleFiles(selected);
    e.target.value = '';
  };

  const handleAnalyze = () => {
    if (files.length === 0) return;

    try {
      localStorage.setItem(
        'semplycode:imported-files',
        JSON.stringify(files)
      );
    } catch (e) {
      console.error('Failed to store imported files', e);
    }

    router.push('/chat?import=true');
  };

  return (
    <motion.section
      id="importa-file"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="w-full py-16 sm:py-24 md:py-28 bg-[#f8fafc] relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)" }} />
      </div>
        <div className="container mx-auto max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1600px]">
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs sm:text-sm font-semibold mb-4">
              PROVA CON I TUOI FILE
            </div>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl 3xl:text-6xl font-bold tracking-tight text-[#0f172a] mb-4">
              Analizza i tuoi file di codice
            </h2>
            <p className="text-sm xs:text-base sm:text-lg 3xl:text-xl text-[#475569] max-w-2xl 3xl:max-w-3xl mx-auto px-2 sm:px-0">Carica uno o più file. L&apos;AI li analizzerà tutti insieme e ti mostrerà i risultati in Chat AI.</p>
          </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-4 xs:p-6 sm:p-10 3xl:p-14 text-center transition-all ${
            isDragging 
              ? 'border-emerald-400 bg-emerald-500/10' 
              : 'border-[#1e293b]/30 hover:border-emerald-500/50'
          }`}
          style={{ background: 'linear-gradient(135deg, #0a0c10 0%, #14181f 100%)' }}
        >
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 sm:mb-6 border border-emerald-500/20">
            <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
          </div>

          <p className="text-lg xs:text-xl 3xl:text-2xl font-semibold text-white mb-2">
            Trascina i file qui
          </p>
          <p className="text-sm xs:text-base text-[#94a3b8] mb-5 sm:mb-6">oppure</p>

          <label className="inline-flex items-center justify-center gap-2 px-5 xs:px-6 py-3 min-h-[48px] max-w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-colors text-xs xs:text-sm 3xl:text-base font-medium text-[#cbd5e1]">
            <FileText size={16} />
            Scegli file dal computer
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rs,.php,.sql,.css,.html,.json"
            />
          </label>

          <p className="text-[11px] xs:text-xs 3xl:text-sm text-[#64748b] mt-4 px-2" style={{color: '#64748b'}}>
            Max {MAX_FILES} file &bull; 100KB per file &bull; JS, TS, Python, Java, Go, Rust...
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-semibold text-[#475569]">
                File caricati ({files.length}/{MAX_FILES})
              </span>
              <button
                onClick={() => setFiles([])}
                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X size={14} /> Rimuovi tutti
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3 group backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-white truncate">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-[#64748b]">
                        {file.language}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="opacity-40 group-hover:opacity-100 p-1 text-[#94a3b8] hover:text-red-400 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleAnalyze}
            disabled={files.length === 0}
            className="inline-flex items-center justify-center gap-2.5 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 w-full xs:w-auto min-h-[48px] rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold text-base sm:text-lg 3xl:text-xl shadow-lg shadow-emerald-500/20 hover:brightness-105 active:scale-[0.985] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            Analizza {files.length > 0 ? `${files.length} file` : ''} con AI
          </button>
        </div>

        <p className="text-center text-xs text-[#64748b] mt-4">
          Verrai reindirizzato a Chat AI. L&apos;AI analizzerà tutti i file e mostrerà i risultati.
        </p>
      </div>
      <Toast toast={toast} />
    </motion.section>
  );
}
