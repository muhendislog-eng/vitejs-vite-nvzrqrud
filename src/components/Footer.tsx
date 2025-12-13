import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 py-6 mt-auto border-t border-slate-800">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        
        {/* Sol Taraf: Telif Hakkı */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          <span>
            &copy; {new Date().getFullYear()} <strong>GKmetraj</strong> - Tüm Hakları Saklıdır.
          </span>
        </div>

        {/* Orta Kısım: Uyarı Metni */}
        <div className="text-center md:text-left text-xs opacity-70 max-w-lg">
          Bu yazılımın izinsiz kopyalanması, çoğaltılması veya kaynak kodlarının ticari amaçla kullanılması 
          5846 sayılı Fikir ve Sanat Eserleri Kanunu kapsamında yasaktır.
        </div>

        {/* Sağ Taraf: Sürüm Bilgisi */}
        <div className="font-mono text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-500">
          v1.0.0
        </div>

      </div>
    </footer>
  );
};

export default Footer;