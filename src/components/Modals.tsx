import React, { useState, useEffect } from 'react';
import { Lock, LogIn, X, Info, PieChart as PieChartIcon, Grid, MapPin, Pencil, RefreshCw, Plus } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose, onLogin }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

export const PoseSelectorModal = ({ isOpen, onClose, category, onSelect, currentPos, isAddingNew, posLibrary }: any) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualPose, setManualPose] = useState({ pos: "", desc: "", unit: "", price: "" });

  if (!isOpen) return null;

  const allPoses = Object.values(posLibrary).flat();
  const categoryPoses = posLibrary[category] || [];
  
  const displayPoses = searchTerm.length > 0 
    ? allPoses.filter((item: any) => (item.pos && item.pos.toLowerCase().includes(searchTerm.toLowerCase())) || (item.desc && item.desc.toLowerCase().includes(searchTerm.toLowerCase())))
    : categoryPoses;

  const handleManualSubmit = () => {
    if (manualPose.pos && manualPose.price) {
      onSelect({ ...manualPose, price: parseFloat(manualPose.price), category: category });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {isAddingNew ? <Plus className="w-5 h-5 text-orange-500"/> : <RefreshCw className="w-5 h-5 text-orange-500"/>}
              {isAddingNew ? `Yeni Poz Ekle: ${category}` : 'Poz Değiştir / Ekle'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{searchTerm ? 'Tüm Kütüphanede Aranıyor' : 'Kategoriye Uygun Pozlar Listeleniyor'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Poz No veya Tanım Ara (Örn: 15.160... veya Demir)" className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-700 placeholder-slate-400 shadow-inner transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-4 bg-slate-50/50">
          {showManualForm ? (
            <div className="p-6 bg-white rounded-xl border border-orange-200 shadow-md">
              <h4 className="font-bold text-slate-800 mb-6 flex items-center text-lg"><div className="p-2 bg-orange-100 rounded-lg mr-3"><Pencil className="w-5 h-5 text-orange-600" /></div> Manuel Poz Ekleme</h4>
              <div className="space-y-5">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Poz No</label><input type="text" value={manualPose.pos} onChange={(e) => setManualPose({...manualPose, pos: e.target.value})} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono" placeholder="Örn: 15.XXX.XXXX" /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanım</label><textarea value={manualPose.desc} onChange={(e) => setManualPose({...manualPose, desc: e.target.value})} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="İmalatın adı ve açıklaması..." rows={3} /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Birim</label><input type="text" value={manualPose.unit} onChange={(e) => setManualPose({...manualPose, unit: e.target.value})} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="m², m³, Adet" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Birim Fiyat (TL)</label><input type="number" value={manualPose.price} onChange={(e) => setManualPose({...manualPose, price: e.target.value})} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="0.00" /></div>
                </div>
                <div className="pt-4 flex space-x-3"><button onClick={handleManualSubmit} disabled={!manualPose.pos || !manualPose.price} className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all disabled:opacity-50 disabled:shadow-none">{isAddingNew ? 'Listeye Ekle' : 'Güncelle'}</button><button onClick={() => setShowManualForm(false)} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all">İptal</button></div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
               {displayPoses.length > 0 ? displayPoses.map((item: any) => (
                  <div key={item.pos} onClick={() => onSelect(item)} className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg group relative ${item.pos === currentPos ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'bg-white border-slate-200 hover:border-orange-300'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 mr-6">
                          <div className="flex items-center mb-2"><span className="font-mono text-sm font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded mr-3">{item.pos}</span>{item.pos === currentPos && <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full flex items-center"><Check className="w-3 h-3 mr-1"/> Seçili</span>}</div>
                          <p className="text-slate-700 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                        <div className="text-right min-w-[100px]"><span className="block text-xs font-bold text-slate-400 uppercase mb-1">{item.unit} Fiyatı</span><span className="font-bold text-slate-900 text-lg tracking-tight">{formatCurrency(item.price)}</span></div>
                      </div>
                  </div>
               )) : (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <div className="p-4 bg-slate-100 rounded-full mb-4"><Search className="w-10 h-10 opacity-40" /></div>
                    <p className="text-center mb-6 font-medium">"{searchTerm}" aramasına uygun poz bulunamadı.<br/><span className="text-sm font-normal opacity-70">Sistemde yüklü olmayan bir poz olabilir.</span></p>
                    <button onClick={() => setShowManualForm(true)} className="flex items-center px-6 py-3 bg-white border-2 border-dashed border-orange-300 text-orange-600 rounded-xl hover:bg-orange-50 hover:border-orange-500 transition-all font-bold"><Plus className="w-5 h-5 mr-2" /> Bu Pozu Manuel Ekle</button>
                 </div>
               )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
           <span className="text-xs font-semibold text-slate-400 flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div> 2025 ÇŞB Veritabanı Aktif</span>
           {!showManualForm && <button onClick={() => setShowManualForm(true)} className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center transition-colors px-3 py-1 hover:bg-orange-50 rounded-lg"><Pencil className="w-3 h-3 mr-1" /> Manuel Ekleme Formunu Aç</button>}
        </div>
      </div>
    </div>
  );
};