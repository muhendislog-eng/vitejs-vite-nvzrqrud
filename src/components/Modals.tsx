import React, { useState, useEffect } from 'react';
import { Lock, LogIn, X, Info, PieChart as PieChartIcon, Grid, MapPin, RefreshCw } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" /> Proje Bilgileri
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Proje İsmi</label>
            <input type="text" name="name" value={info.name} onChange={handleChange} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Örn: Mavişehir Konutları" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Kapalı Alan (m²)</label>
                <div className="relative">
                   <PieChartIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/>
                   <input type="number" name="area" value={info.area} onChange={handleChange} className="w-full pl-10 p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="1500" />
                </div>
             </div>
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Kat Sayısı</label>
                <input type="number" name="floors" value={info.floors} onChange={handleChange} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="5" />
             </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Şehir</label>
            <div className="relative">
               <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/>
               <input type="text" name="city" value={info.city} onChange={handleChange} className="w-full pl-10 p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="İstanbul" />
            </div>
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- YENİ POZ SEÇİM MODALI ---
// currentPos prop'unu alıp PozAramaMotoru'na iletiyoruz
export const PoseSelectorModal = ({ isOpen, onClose, category, onSelect, currentPos }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* Başlık Alanı */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <RefreshCw className="w-5 h-5 text-orange-600"/>
              </div>
              Poz Seçimi
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {category ? `${category} için poz arayın` : 'Tüm veritabanında arama yapın'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Yeni Arama Motorunu Buraya Entegre Ettik */}
        <div className="flex-1 bg-slate-50 p-4 overflow-hidden">
            <PozAramaMotoru 
                onSelect={onSelect} 
                category={category} 
                currentPos={currentPos} 
            />
        </div>

      </div>
    </div>
  );
};