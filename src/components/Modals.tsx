import React, { useState, useEffect } from 'react';
import { Lock, LogIn, X, Info, PieChart as PieChartIcon, MapPin, RefreshCw } from 'lucide-react';
import PozAramaMotoru from './PozAramaMotoru'; // Arama motorunu import ettik

// --- GİRİŞ MODALI ---
export const LoginModal = ({ isOpen, onClose, onLogin }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basit bir kullanıcı adı şifre kontrolü
    if (username === 'gokalp' && password === 'gokalp81') {
      onLogin();
      onClose();
      setError('');
    } else {
      setError('Kullanıcı adı veya şifre hatalı!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="bg-orange-600 p-6 flex flex-col items-center">
          <div className="bg-white/20 p-3 rounded-full mb-3">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">Güvenli Giriş</h2>
          <p className="text-orange-100 text-sm">Sisteme erişmek için kimliğinizi doğrulayın</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="Kullanıcı adınızı girin"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
              <X className="w-4 h-4 mr-2" /> {error}
            </div>
          )}
          <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all flex justify-center items-center">
            <LogIn className="w-5 h-5 mr-2" /> Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
};

// --- PROJE BİLGİSİ MODALI ---
// --- PROJE BİLGİSİ MODALI ---
export const ProjectInfoModal = ({ isOpen, onClose, onSave, initialData }: any) => {
  const [info, setInfo] = useState({ name: '', area: '', floors: '', city: '' });

  useEffect(() => {
    if (isOpen) {
      setInfo(initialData || { name: '', area: '', floors: '', city: '' });
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(info);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = "w-full pl-10 p-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-white placeholder:text-slate-500 outline-none transition-all";
  const labelClass = "block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all">
      <div className="relative bg-[#0B1121] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-800">

        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        {/* Header */}
        <div className="relative px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-orange-500" />
              Proje Bilgileri
            </h3>
            <p className="text-xs text-slate-400 mt-1">Aktif proje detaylarını düzenleyin</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="relative p-8 space-y-6">

          {/* Proje İsmi */}
          <div>
            <label className={labelClass}>Proje İsmi</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50 group-focus-within:bg-orange-500 transition-colors"></div>
              </div>
              <input
                type="text"
                name="name"
                value={info.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Örn: Mavişehir Konutları"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Kapalı Alan (m²)</label>
              <div className="relative">
                <PieChartIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  name="area"
                  value={info.area}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="1500"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Kat Sayısı</label>
              <div className="relative">
                <div className="absolute left-3 top-3.5 w-4 h-4 flex items-center justify-center text-slate-500 text-[10px] font-bold border border-slate-600 rounded">K</div>
                <input
                  type="number"
                  name="floors"
                  value={info.floors}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Şehir / Lokasyon</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                name="city"
                value={info.city}
                onChange={handleChange}
                className={inputClass}
                placeholder="İstanbul"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Kaydet ve Güncelle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- YENİ POZ SEÇİM MODALI ---
import { motion, AnimatePresence } from 'framer-motion';

export const PoseSelectorModal = ({ isOpen, onClose, category, onSelect, currentPos }: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh] border border-slate-200/60 shadow-slate-900/20"
          >
            {/* Arka plan dekorasyonu */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

            {/* Başlık Alanı */}
            <div className="px-8 py-6 border-b border-slate-200/60 flex justify-between items-center relative z-10">
              <div>
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                  <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl shadow-inner border border-orange-100/50">
                    <RefreshCw className="w-6 h-6 text-orange-600" />
                  </div>
                  Poz Seçimi
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1 ml-1">
                  {category ? <><span className="text-slate-800 font-bold">{category}</span> için en uygun pozu seçin</> : 'Tüm veritabanında arama yapın'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Yeni Arama Motorunu Buraya Entegre Ettik */}
            <div className="flex-1 bg-slate-50/50 p-6 overflow-hidden relative z-10">
              <PozAramaMotoru
                onSelect={onSelect}
                category={category}
                currentPos={currentPos}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};