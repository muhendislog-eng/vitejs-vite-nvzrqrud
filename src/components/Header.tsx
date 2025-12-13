import React, { useRef } from 'react';
import {
  Hammer,
  Info,
  BookOpen,
  FileSpreadsheet,
  Upload,
  Save,
  LogOut,
  LogIn,
  FileText, // PDF için
  Loader2,
} from 'lucide-react';

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

  // Opsiyonel (kullanmıyorsan App’te noop geçebilirsin)
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
      <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* SOL: Logo + Proje */}
        <div className="flex items-center space-x-4 min-w-0">
          <div className="bg-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-900/50 shrink-0">
            <Hammer className="w-8 h-8 text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">
              GK<span className="text-orange-500">metraj</span>
            </h1>

            <div className="text-xs text-slate-400 font-medium tracking-wide mt-1 flex items-center gap-2 min-w-0 flex-wrap">
              {projectInfo?.name ? (
                <>
                  <span className="text-orange-400 font-bold truncate max-w-[220px]">
                    {projectInfo.name}
                  </span>

                  {projectInfo.city && (
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
                      {projectInfo.city}
                    </span>
                  )}

                  {projectInfo.area && (
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
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

        {/* SAĞ: Aksiyonlar */}
        <div className="flex items-center space-x-3 shrink-0">
          {isLoggedIn && (
            <>
              {/* Proje Bilgisi */}
              <button
                onClick={onOpenProjectModal}
                className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border bg-slate-800 hover:bg-slate-700 text-blue-300 border-slate-700 hover:border-blue-500/50"
                title="Proje Bilgileri Düzenle"
                type="button"
              >
                <Info className="w-4 h-4" />
                <span className="hidden lg:inline">Proje Bilgisi</span>
              </button>

              <div className="h-8 w-px bg-slate-700 mx-1 hidden md:block" />

              {/* Excel + PDF işlemleri (md+ tam, mobil kompakt) */}
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                {/* Poz Tarifleri */}
                <button
                  type="button"
                  onClick={onDownloadDescriptions}
                  disabled={!excelEnabled}
                  aria-disabled={!excelEnabled}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                  title={excelEnabled ? 'Poz Tarifleri' : disabledHint || 'Devre dışı'}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden lg:inline">Poz</span>
                </button>

                {/* YM Cetveli */}
                <button
                  type="button"
                  onClick={onExportToXLSX}
                  disabled={!excelEnabled}
                  aria-disabled={!excelEnabled}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-green-400 hover:bg-slate-700 hover:text-green-300 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                  title={excelEnabled ? 'YM Cetveli İndir' : disabledHint || 'Devre dışı'}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden lg:inline">YM</span>
                </button>

                {/* Excel Yükle */}
                <div className="relative">
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
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-blue-400 hover:bg-slate-700 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                    title={excelEnabled ? 'Excel Yükle' : disabledHint || 'Devre dışı'}
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden lg:inline">Yükle</span>
                  </button>
                </div>

                {/* PDF Güncelle (opsiyonel) */}
                <div className="relative hidden sm:block">
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
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-amber-300 hover:bg-slate-700 hover:text-amber-200 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                    title={pdfEnabled ? 'PDF ile Güncelle' : isLoadingScripts ? 'Modüller yükleniyor...' : 'PDF modülü yok'}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden lg:inline">PDF</span>
                  </button>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-700 mx-2 hidden md:block" />

              {/* Kaydet */}
              <button
                onClick={onSave}
                type="button"
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-900/30 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
            </>
          )}

          <div className="w-2 sm:w-4" />

          {/* Giriş / Çıkış */}
          {isLoggedIn ? (
            <button
              onClick={onLogoutClick}
              type="button"
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış</span>
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              type="button"
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-600 animate-pulse"
            >
              <LogIn className="w-4 h-4" />
              <span>Giriş Yap</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
