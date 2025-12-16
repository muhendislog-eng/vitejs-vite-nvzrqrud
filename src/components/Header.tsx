import React, { useRef, useState, useEffect } from 'react';
import {
  Info,
  BookOpen,
  FileSpreadsheet,
  Upload,
  Save,
  LogOut,
  LogIn,
  FileText,
  Loader2,
  FolderOpen,
  Command,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import logo from '../assets/hdr.png';

export interface ProjectInfo {
  name: string;
  area: string;
  floors: string;
  city: string;
}

interface HeaderProps {
  isLoggedIn: boolean;
  projectInfo: ProjectInfo;
  isPDFLoaded: boolean;
  isXLSXLoaded: boolean;
  isLoadingScripts: boolean;
  onOpenProjectModal: () => void;
  onOpenProjectManager: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onSave: () => void;
  onDownloadDescriptions: () => void;
  onExportToXLSX: () => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdatePDF: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  projectInfo,
  isPDFLoaded,
  isXLSXLoaded,
  isLoadingScripts,
  onOpenProjectModal,
  onOpenProjectManager,
  onLoginClick,
  onLogoutClick,
  onSave,
  onDownloadDescriptions,
  onExportToXLSX,
  onImportExcel,
  onUpdatePDF,
}) => {
  const excelInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const excelEnabled = isLoggedIn && isXLSXLoaded && !isLoadingScripts;
  const pdfEnabled = isLoggedIn && isPDFLoaded && !isLoadingScripts;

  // -- Components --

  const IconButton = ({ onClick, disabled, icon: Icon, label, active, title, danger, primary }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        group relative flex items-center justify-center gap-1.5 h-8 sm:h-10 px-2 sm:px-3 rounded-xl transition-all duration-300
        ${disabled
          ? 'opacity-30 cursor-not-allowed'
          : danger
            ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400'
            : primary
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105'
              : 'hover:bg-white/10 text-slate-400 hover:text-white'
        }
      `}
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />

      {/* Label - Hidden on mobile, valid on desktop */}
      {!primary && <span className="hidden xl:block text-sm font-medium opacity-80 group-hover:opacity-100 whitespace-nowrap">{label}</span>}

      {/* Tooltip (Only for Mobile or when label is hidden) */}
      {!disabled && !primary && (
        <span className="xl:hidden absolute top-full mt-2 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          {label}
        </span>
      )}
    </button>
  );

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4 px-4 pointer-events-none">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`
            pointer-events-auto
            relative max-w-[95%] xl:max-w-[1800px] w-full mx-auto
            bg-[#0B1121]/80 backdrop-blur-2xl
            border border-white/5 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]
            rounded-2xl transition-all duration-500 ease-out
            ${isScrolled ? 'py-2 px-3 bg-[#0B1121]/90 shadow-2xl scale-[0.99] origin-top' : 'py-3 px-4'}
          `}
        >
          {/* Inner Glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 opacity-50 pointer-events-none"></div>

          <div className="relative flex items-center justify-between gap-4">

            {/* LEFT: Identity */}
            <div className="flex items-center gap-4 md:gap-6 shrink-0">
              {/* Logo */}
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-14 h-14 rounded-xl">
                  <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <img src={logo} alt="GK" className="w-full h-full object-contain relative z-10 opacity-90 group-hover:opacity-100 transition-opacity scale-150" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-white tracking-tight group-hover:text-blue-200 transition-colors">
                    GK<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">metraj</span>
                  </h1>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="w-px h-8 bg-white/5 hidden md:block"></div>

              {/* Active Project Capsule */}
              {projectInfo?.name && (
                <div
                  onClick={onOpenProjectManager}
                  className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="relative flex items-center justify-center w-2 h-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-none mb-0.5 group-hover:text-slate-400 transition-colors">Aktif</span>
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{projectInfo.name}</span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              )}
            </div>

            {/* RIGHT: Command Center */}
            <div className="flex items-center gap-3 min-w-0">

              {isLoggedIn ? (
                <>
                  {/* Utility Group */}
                  <div className="flex items-center p-0.5 sm:p-1 bg-white/5 border border-white/5 rounded-xl gap-0.5 sm:gap-1 flex-wrap justify-end">

                    <IconButton onClick={onOpenProjectManager} icon={Command} label="Yönet" title="Proje Yöneticisi" />
                    <IconButton onClick={onOpenProjectModal} icon={Info} label="Bilgi" title="Proje Detayları" />

                    <div className="w-px h-6 bg-white/10 mx-0.5 sm:mx-1 shrink-0"></div>

                    <IconButton onClick={onDownloadDescriptions} disabled={!excelEnabled} icon={BookOpen} label="Pozlar" title="Poz Tarifleri" />
                    <IconButton onClick={onExportToXLSX} disabled={!excelEnabled} icon={FileSpreadsheet} label="İndir" title="Excel İndir" />

                    <input type="file" ref={excelInputRef} onChange={onImportExcel} accept=".xlsx,.xls" className="hidden" />
                    <IconButton onClick={() => excelInputRef.current?.click()} disabled={!excelEnabled} icon={Upload} label="Yükle" title="Excel Yükle" />

                    <input type="file" ref={pdfInputRef} onChange={onUpdatePDF} accept=".pdf" className="hidden" />
                    <IconButton onClick={() => pdfInputRef.current?.click()} disabled={!pdfEnabled} icon={FileText} label="PDF" title="PDF Yükle" />

                  </div>

                  {/* Save Action */}
                  <button
                    onClick={onSave}
                    className="hidden sm:flex group items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-300 shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span className="text-sm font-bold">Kaydet</span>
                  </button>

                  {/* Logout */}
                  <IconButton onClick={onLogoutClick} icon={LogOut} label="Çıkış" danger />
                </>
              ) : (
                <button
                  onClick={onLoginClick}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-slate-900 font-bold hover:bg-blue-50 hover:scale-105 transition-all shadow-lg shadow-white/10"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Giriş</span>
                </button>
              )}

            </div>

          </div>
        </motion.header>
      </div>

      {/* Spacer is not strictly needed with 'fixed top-0' pointer-events-none wrapper, 
        but we need to ensure App.tsx has padding-top ~120px to clear this floating header */}
    </>
  );
};

export default Header;