import React from 'react';
import { ShieldCheck, Github, Twitter, Linkedin, Mail } from 'lucide-react';

interface FooterProps {
  onOpenProjects: () => void;
  onOpenCalculations: () => void;
  onOpenGreenBook: () => void;
  onOpenReports: () => void;
}

const Footer: React.FC<FooterProps> = ({
  onOpenProjects,
  onOpenCalculations,
  onOpenGreenBook,
  onOpenReports
}) => {
  return (
    <footer className="w-full bg-[#0B1121] text-slate-400 py-12 border-t border-slate-800/50 mt-auto relative overflow-hidden">

      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-[1600px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <span className="text-2xl font-bold tracking-tight">GK<span className="text-blue-500">metraj</span></span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">v1.1.0</span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              İnşaat metraj ve maliyet hesaplama süreçlerinizi hızlandıran, modern ve profesyonel çözüm ortağınız.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <SocialIcon icon={Github} />
              <SocialIcon icon={Twitter} />
              <SocialIcon icon={Linkedin} />
              <SocialIcon icon={Mail} />
            </div>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="text-white font-bold mb-4">Hızlı Erişim</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={onOpenProjects} className="hover:text-blue-400 transition-colors text-left">
                  Projelerim
                </button>
              </li>
              <li>
                <button onClick={onOpenCalculations} className="hover:text-blue-400 transition-colors text-left">
                  Hesaplamalar
                </button>
              </li>
              <li>
                <button onClick={onOpenGreenBook} className="hover:text-blue-400 transition-colors text-left">
                  Yeşil Defter
                </button>
              </li>
              <li>
                <button onClick={onOpenReports} className="hover:text-blue-400 transition-colors text-left">
                  Raporlar
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white font-bold mb-4">Yasal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Kullanım Koşulları</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Gizlilik Politikası</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Lisans Bilgisi</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-500/80" />
            <span>&copy; {new Date().getFullYear()} GK Metraj Yazılım Çözümleri. Tüm hakları saklıdır.</span>
          </div>
          <div className="text-center md:text-right opacity-60">
            Bu yazılım 5846 sayılı Fikir ve Sanat Eserleri Kanunu kapsamında korunmaktadır.
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon: Icon }: any) => (
  <a href="#" className="p-2 rounded-lg bg-slate-800/50 hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-300">
    <Icon className="w-4 h-4" />
  </a>
)

export default Footer;