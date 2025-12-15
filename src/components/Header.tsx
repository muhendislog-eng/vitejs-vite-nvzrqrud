import React, { useRef } from 'react';
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
} from 'lucide-react';

// --- BURAYA DİKKAT: Logonuzu import ediyoruz ---
import logo from '../assets/gk_logo_new.png';

// Proje bilgileri için tip tanımı
export interface ProjectInfo {
  name: string;
  area: string;
  floors: string;
  city: string;
}

interface HeaderProps {
  // Durum Verileri
  isLoggedIn: boolean;
  projectInfo: ProjectInfo;
  isPDFLoaded: boolean;
  isXLSXLoaded: boolean;
  isLoadingScripts: boolean;

  // Aksiyon Fonksiyonları
  onOpenProjectModal: () => void;
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

  const excelEnabled = isLoggedIn && isXLSXLoaded && !isLoadingScripts;
  const pdfEnabled = isLoggedIn && isPDFLoaded && !isLoadingScripts;

  const disabledHint = isLoadingScripts
    ? 'Modüller yükleniyor...'
    : !isXLSXLoaded
      ? 'Excel modülü yüklenemedi'
      : '';

  return (
    <header className="bg-slate-900 shadow-xl sticky top-0 z-20 border-b border-slate-800">
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* SOL: Logo + Proje */}
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">

          {/* Logo */}
          <div className="shrink-0">
            <img
              src={logo}
              alt="Firma Logosu"
              className="h-10 sm:h-12 md:h-16 w-auto object-contain p-1"
            />
          </div>

          <div className="min-w-0 hidden sm:block">
            <h1 className="text-2xl font-black text-white tracking-tight leading-none hidden">
              GK<span className="text-orange-500">metraj</span>
            </h1>

            <div className="text-xs text-slate-400 font-medium tracking-wide mt-1 flex items-center gap-2 min-w-0 flex-wrap">
              {projectInfo?.name ? (
                <>
                  <span className="text-orange-400 font-bold truncate max-w-[120px] sm:max-w-[220px]">
                    {projectInfo.name}
                  </span>

                  {projectInfo.city && (
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 hidden md:inline">
                      {projectInfo.city}
                    </span>
                  )}

                  {projectInfo.area && (
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 hidden lg:inline">
                      {projectInfo.area} m²
                    </span>
                  )}
                </>
              ) : (
                'İnşaat Metraj Modülü'
              )}

              {isLoadingScripts && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Hazırlanıyor
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SAĞ: Aksiyonlar - Mobile Responsive */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 shrink-0">
          {isLoggedIn && (
            <>
              <button
                onClick={onOpenProjectModal}
                className="hidden lg:flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border bg-slate-800 hover:bg-slate-700 text-blue-300 border-slate-700 hover:border-blue-500/50"
                title="Proje Bilgileri Düzenle"
                type="button"
              >
                <Info className="w-4 h-4" />
                <span className="hidden xl:inline">Proje Bilgisi</span>
              </button>

              <div className="h-8 w-px bg-slate-700 mx-1 hidden lg:block" />

              <div className="flex bg-slate-800 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={onDownloadDescriptions}
                  disabled={!excelEnabled}
                  aria-disabled={!excelEnabled}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                  title={excelEnabled ? 'Poz Tarifleri' : disabledHint || 'Devre dışı'}
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xl:inline">Poz</span>
                </button>

                <button
                  type="button"
                  onClick={onExportToXLSX}
                  disabled={!excelEnabled}
                  aria-disabled={!excelEnabled}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium text-green-400 hover:bg-slate-700 hover:text-green-300 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                  title={excelEnabled ? 'YM Cetveli İndir' : disabledHint || 'Devre dışı'}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xl:inline">YM</span>
                </button>

                <div className="relative hidden sm:block">
                  <input
                    type="file"
                    ref={excelInputRef}
                    onChange={onImportExcel}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => excelInputRef.current?.click()}
                    disabled={!excelEnabled}
                    aria-disabled={!excelEnabled}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium text-blue-400 hover:bg-slate-700 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                    title={excelEnabled ? 'Excel Yükle' : disabledHint || 'Devre dışı'}
                  >
                    <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xl:inline">Yükle</span>
                  </button>
                </div>

                <div className="relative hidden md:block">
                  <input
                    type="file"
                    ref={pdfInputRef}
                    onChange={onUpdatePDF}
                    accept=".pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={!pdfEnabled}
                    aria-disabled={!pdfEnabled}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium text-amber-300 hover:bg-slate-700 hover:text-amber-200 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                    title={pdfEnabled ? 'PDF ile Güncelle' : isLoadingScripts ? 'Modüller yükleniyor...' : 'PDF modülü yok'}
                  >
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xl:inline">PDF</span>
                  </button>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-700 mx-1 hidden md:block" />

              <button
                onClick={onSave}
                type="button"
                className="flex items-center space-x-1 sm:space-x-2 bg-orange-600 hover:bg-orange-500 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-orange-900/30 active:scale-95"
              >
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Kaydet</span>
              </button>
            </>
          )}

          <div className="w-1 sm:w-2 md:w-4" />

          {isLoggedIn ? (
            <button
              onClick={onLogoutClick}
              type="button"
              className="flex items-center space-x-1 sm:space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all border border-slate-600"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              type="button"
              className="flex items-center space-x-1 sm:space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all border border-slate-600 animate-pulse"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Giriş Yap</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;