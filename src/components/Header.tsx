import React, { useRef } from 'react';
import { 
  Hammer, 
  Info, 
  RefreshCw, 
  BookOpen, 
  FileSpreadsheet, 
  Upload, 
  Save, 
  LogOut, 
  LogIn 
} from 'lucide-react';

// Header'ın dışarıdan beklediği veri tiplerini tanımlıyoruz
interface ProjectInfo {
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
  // Aksiyonlar (Ana dosyadan tetiklenecek fonksiyonlar)
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
  onUpdatePDF
}) => {
  // Dosya yükleme inputları için referanslar
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="bg-slate-900 shadow-xl sticky top-0 z-20 border-b border-slate-800">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* SOL TARAF: Logo ve Proje Bilgisi */}
        <div className="flex items-center space-x-4">
          <div className="bg-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-900/50">
            <Hammer className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">
              GK<span className="text-orange-500">metraj</span>
            </h1>
            <div className="text-xs text-slate-400 font-medium tracking-wide mt-1 flex items-center gap-2">
              {projectInfo.name ? (
                <>
                  <span className="text-orange-400 font-bold">{projectInfo.name}</span>
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
                "İnşaat Metraj Modülü"
              )}
            </div>
          </div>
        </div>

        {/* SAĞ TARAF: Butonlar */}
        <div className="flex items-center space-x-3">
          {isLoggedIn && (
            <>
              {/* Proje Bilgisi Düzenle */}
              <button
                onClick={onOpenProjectModal}
                className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border bg-slate-800 hover:bg-slate-700 text-blue-300 border-slate-700 hover:border-blue-500/50"
                title="Proje Bilgileri Düzenle"
              >
                <Info className="w-4 h-4" /> <span className="hidden lg:inline">Proje Bilgisi</span>
              </button>

              <div className="h-8 w-px bg-slate-700 mx-1 hidden md:block"></div>

              {/* PDF Yükleme */}
              <div className="relative group hidden md:block">
                <input
                  type="file"
                  ref={pdfInputRef}
                  onChange={onUpdatePDF}
                  accept=".pdf"
                  className="hidden"
                />
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={!isPDFLoaded}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                    isPDFLoaded
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-900/20 active:scale-95'
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                  title="PDF'ten Birim Fiyat Güncelle"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingScripts ? 'animate-spin' : ''}`} />
                  <span className="hidden lg:inline">PDF Fiyat Güncelle</span>
                </button>
              </div>

              <div className="h-8 w-px bg-slate-700 mx-2 hidden md:block"></div>

              {/* Excel İşlemleri */}
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 hidden md:flex">
                <button
                  onClick={onDownloadDescriptions}
                  disabled={!isXLSXLoaded}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  title="Poz Tarifleri İndir"
                >
                  <BookOpen className="w-4 h-4" />
                </button>

                <button
                  onClick={onExportToXLSX}
                  disabled={!isXLSXLoaded}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-green-400 hover:bg-slate-700 hover:text-green-300 transition-colors"
                  title="YM Cetveli İndir"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>

                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onImportExcel}
                    accept=".xlsx, .xls"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isXLSXLoaded}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-blue-400 hover:bg-slate-700 hover:text-blue-300 transition-colors"
                    title="Excel Yükle"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-700 mx-2 hidden md:block"></div>

              {/* Kaydet Butonu */}
              <button
                onClick={onSave}
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-900/30 active:scale-95"
              >
                <Save className="w-4 h-4" /> <span>Kaydet</span>
              </button>
            </>
          )}

          <div className="w-4"></div>

          {/* Giriş / Çıkış Butonu */}
          {isLoggedIn ? (
            <button
              onClick={onLogoutClick}
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-600"
            >
              <LogOut className="w-4 h-4" /> <span>Çıkış</span>
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-600 animate-pulse"
            >
              <LogIn className="w-4 h-4" /> <span>Giriş Yap</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;