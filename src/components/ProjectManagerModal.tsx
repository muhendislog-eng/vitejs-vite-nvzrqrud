import React, { useState } from 'react';
import { Folder, Plus, Trash2, Check, X, FolderOpen, Clock, Search, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ProjectMetadata {
    id: string;
    name: string;
    lastModified: string;
}

interface ProjectManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: ProjectMetadata[];
    activeProjectId: string;
    onSwitchProject: (id: string) => void;
    onCreateProject: (name: string) => void;
    onDeleteProject: (id: string) => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
    isOpen,
    onClose,
    projects,
    activeProjectId,
    onSwitchProject,
    onCreateProject,
    onDeleteProject,
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

    if (!isOpen) return null;

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            onCreateProject(newProjectName.trim());
            setNewProjectName('');
            setIsCreating(false);
        }
    };

    const confirmDelete = (e: React.MouseEvent, id: string, name: string) => {
        e.preventDefault(); // Stop default button behavior
        e.stopPropagation(); // Stop clicking the card
        setProjectToDelete({ id, name });
    };

    const executeDelete = () => {
        if (projectToDelete) {
            onDeleteProject(projectToDelete.id);
            setProjectToDelete(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-all"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                className="relative w-full max-w-5xl bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                {/* Header */}
                <div className="relative px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 backdrop-blur-md shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-900/40">
                            <FolderOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white tracking-tight">Projelerim</h3>
                            <p className="text-sm text-slate-400 font-medium">Tüm projelerinizi buradan yönetin</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Search Bar */}
                        <div className="relative group flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Proje ara..."
                                className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-slate-600 transition-all"
                            />
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 relative z-0">

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

                        {/* Create New Card (Always First) */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setIsCreating(true)}
                            className="group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/20 hover:bg-slate-800/50 hover:border-blue-500/50 transition-all duration-300 min-h-[180px]"
                        >
                            <div className="p-4 bg-slate-800 rounded-full group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300 shadow-xl">
                                <Plus className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-sm font-bold text-slate-400 group-hover:text-blue-100 transition-colors">Yeni Proje Oluştur</span>
                        </motion.button>

                        {/* Project Cards */}
                        <AnimatePresence mode="popLayout">
                            {filteredProjects.map((project, index) => {
                                const isActive = project.id === activeProjectId;
                                return (
                                    <motion.div
                                        key={project.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => !isActive && onSwitchProject(project.id)}
                                        className={`group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden
                                            ${isActive
                                                ? 'bg-gradient-to-br from-blue-900/40 to-slate-900/40 border-blue-500/50 shadow-lg shadow-blue-900/20 ring-1 ring-blue-400/20'
                                                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 hover:shadow-xl hover:-translate-y-1'
                                            }
                                        `}
                                    >
                                        {/* Active Indicator Glow */}
                                        {isActive && <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />}

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className={`p-3 rounded-xl mb-2 ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-900 text-slate-400 group-hover:text-orange-400 group-hover:bg-slate-950 transition-colors'}`}>
                                                <Folder className="w-6 h-6 fill-current" />
                                            </div>

                                            {isActive && (
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-widest shadow-sm">
                                                    Aktif
                                                </span>
                                            )}
                                        </div>

                                        <div className="relative z-10">
                                            <h4 className={`text-lg font-bold truncate mb-1 ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                                                {project.name}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{project.lastModified}</span>
                                            </div>
                                        </div>

                                        {/* Actions overlay (Only on hover or active) */}
                                        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button
                                                onClick={(e) => confirmDelete(e, project.id, project.name)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all"
                                                title="Projeyi Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            {isActive ? (
                                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="p-2 rounded-lg bg-slate-700 text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <span className="text-xs font-bold">Aç</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Empty State */}
                        {filteredProjects.length === 0 && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500">
                                <Search className="w-12 h-12 mb-3 opacity-20" />
                                <p>Proje bulunamadı.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Modal Overlay */}
                <AnimatePresence>
                    {isCreating && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-6">
                            <motion.form
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onSubmit={handleCreateSubmit}
                                className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
                            >
                                {/* Glow Effect */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                                <div className="relative z-10 flex flex-col gap-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner">
                                            <Plus className="w-8 h-8 text-blue-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Yeni Proje Oluştur</h3>
                                        <p className="text-slate-400">Projenize bir isim vererek başlayın</p>
                                    </div>

                                    <div className="w-full relative">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newProjectName}
                                            onChange={(e) => setNewProjectName(e.target.value)}
                                            placeholder="Örn: Konut Projesi 2024"
                                            className="w-full px-6 py-4 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-lg text-center"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreating(false)}
                                            className="flex-1 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            Oluştur
                                        </button>
                                    </div>
                                </div>
                            </motion.form>
                        </div>
                    )}
                </AnimatePresence>

                {/* Delete Confirmation Modal Overlay */}
                <AnimatePresence>
                    {projectToDelete && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                                <div className="text-center relative z-10">
                                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl mx-auto flex items-center justify-center mb-4 text-red-500">
                                        <Trash2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Projeyi Sil?</h3>
                                    <p className="text-slate-400 mb-6">
                                        <span className="text-white font-bold">"{projectToDelete.name}"</span> projesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                    </p>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setProjectToDelete(null)}
                                            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            onClick={executeDelete}
                                            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/40 hover:shadow-red-900/60 transition-all"
                                        >
                                            Evet, Sil
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </motion.div>
        </div>
    );
};
