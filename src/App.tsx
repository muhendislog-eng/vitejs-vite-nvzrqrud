import React, { useState, useEffect, useRef } from 'react';
import { FileText, Building, Calculator, Save, Plus, Layers, DoorOpen, Hammer, RefreshCw, Search, X, Check, Download, Upload, FileSpreadsheet, BookOpen, Ruler, ArrowRight, Trash2, Grid, MousePointer, Lock, Settings, RefreshCcw, Pencil, Maximize, Box, LogIn, LogOut, ShieldCheck, Info, MapPin } from 'lucide-react';

// --- SABİTLER VE VERİ SETLERİ ---

const INITIAL_POS_LIBRARY = {
  "Betonarme ve Kalıp İşleri": [
    { pos: "15.150.1003", desc: "C 16/20 basınç dayanım sınıfında hazır beton dökülmesi", unit: "m³", price: 3150.44 },
    { pos: "15.150.1004", desc: "C 20/25 basınç dayanım sınıfında hazır beton dökülmesi", unit: "m³", price: 3250.60 },
    { pos: "15.150.1005", desc: "C 25/30 basınç dayanım sınıfında hazır beton dökülmesi", unit: "m³", price: 3380.90 },
    { pos: "15.150.1006", desc: "C 30/37 basınç dayanım sınıfında hazır beton dökülmesi", unit: "m³", price: 3553.73 },
    { pos: "15.150.1007", desc: "C 35/45 basınç dayanım sınıfında hazır beton dökülmesi", unit: "m³", price: 3750.25 },
    { pos: "15.150.1008", desc: "C 40/50 basınç dayanım sınıfında hazır beton dökülmesi", unit: "m³", price: 3950.80 },
    { pos: "15.160.1003", desc: "Ø 8- Ø 12 mm nervürlü beton çelik çubuğu, çubukların kesilmesi, bükülmesi ve yerine konulması", unit: "Ton", price: 45954.91 },
    { pos: "15.160.1004", desc: "Ø 14- Ø 28 mm nervürlü beton çelik çubuğu, çubukların kesilmesi, bükülmesi ve yerine konulması", unit: "Ton", price: 44180.65 },
    { pos: "15.160.1005", desc: "Ø 32- Ø 50 mm nervürlü beton çelik çubuğu, çubukların kesilmesi, bükülmesi ve yerine konulması", unit: "Ton", price: 43500.50 },
    { pos: "15.160.1010", desc: "Çelik hasırın yerine konulması (Her çeşit)", unit: "Ton", price: 52100.20 },
    { pos: "15.180.1003", desc: "Plywood ile düz yüzeyli betonarme kalıbı yapılması", unit: "m²", price: 1011.06 },
    { pos: "15.180.1001", desc: "Ahşap kalıp yapılması (Rendelemiş kereste ile)", unit: "m²", price: 950.40 },
    { pos: "15.185.1005", desc: "Çelik borudan kalıp iskelesi yapılması (0-4m)", unit: "m³", price: 124.89 },
  ],
  "Duvar ve Kaba Yapı": [
    { pos: "15.220.1011", desc: "85 mm kalınlığında yatay delikli tuğla (190 x 85 x 190 mm) ile duvar yapılması", unit: "m²", price: 598.79 },
    { pos: "15.220.1012", desc: "100 mm kalınlığında yatay delikli tuğla (200 x 100 x 200 mm) ile duvar yapılması", unit: "m²", price: 741.66 },
    { pos: "15.220.1013", desc: "135 mm kalınlığında düşey delikli tuğla ile duvar yapılması", unit: "m²", price: 765.40 },
    { pos: "15.220.1014", desc: "135 mm kalınlığında yatay delikli tuğla (190 x 135 x 190 mm) ile duvar yapılması", unit: "m²", price: 794.93 },
    { pos: "15.220.1015", desc: "190 mm kalınlığında yatay delikli tuğla (190 x 190 x 135 mm) ile duvar yapılması", unit: "m²", price: 907.18 },
    { pos: "10.200.1001", desc: "Gazbeton duvar bloğu (G2 sınıfı) ile duvar yapılması", unit: "m³", price: 2850.50 },
  ],
  "İnce İşler (Sıva, Şap, Boya)": [
    { pos: "15.275.1111", desc: "250/350 kg çimento dozlu kaba ve ince harçla sıva yapılması (dış cephe)", unit: "m²", price: 601.88 },
    { pos: "15.275.1112", desc: "200/250 kg kireç/çimento karışımı kaba ve ince harçla sıva yapılması (iç cephe)", unit: "m²", price: 535.60 },
    { pos: "15.280.1009", desc: "Perlitli sıva alçısı ve saten alçı ile kaplama yapılması", unit: "m²", price: 682.90 },
    { pos: "15.280.1011", desc: "Saten alçı kaplaması yapılması (ortalama 1 mm)", unit: "m²", price: 250.00 },
    { pos: "15.540.1520", desc: "Yeni sıva yüzeylere astar uygulanarak iki kat Su bazlı Silikonlu Mat İç Cephe Boyası", unit: "m²", price: 212.05 },
    { pos: "15.540.1502", desc: "Eski boyalı yüzeylere astar uygulanarak Su bazlı Plastik Boya yapılması", unit: "m²", price: 185.30 },
    { pos: "15.250.1111", desc: "2.5 cm kalınlığında 400 kg dozlu şap", unit: "m²", price: 443.59 },
  ],
  "Çatı İşleri": [
    { pos: "15.300.1002", desc: "Ahşaptan oturtma çatı yapılması (çatı örtüsünün altı OSB/3 kaplamalı)", unit: "m²", price: 1544.23 },
    { pos: "15.305.1001", desc: "Üst ve alt kiremit (alaturka) ile çatı örtüsü yapılması (3 Latalı)", unit: "m²", price: 1560.74 },
    { pos: "15.305.1006", desc: "Mahya kiremitleri ile mahya yapılması", unit: "m", price: 516.11 },
    { pos: "15.310.1201", desc: "14 no.lu çinko levhadan eğimli çatı deresi yapılması", unit: "m", price: 1226.74 },
    { pos: "15.310.1205", desc: "12 No.lu çinko levhadan sıva eteği, baca kenarı vb. yapılması", unit: "m", price: 987.76 },
    { pos: "15.330.1004", desc: "Çatı örtüsü altına polimer bitümlü örtü ile su yalıtımı yapılması", unit: "m²", price: 353.95 },
  ],
  "Cephe İşleri": [
    { pos: "15.185.1013", desc: "Ön yapımlı tam güvenlikli dış cephe iş iskelesi yapılması (0-51,50m)", unit: "m²", price: 217.18 },
    { pos: "15.185.1014", desc: "Ön yapımlı tam güvenlikli tavan iş iskelesi (0-21,50m)", unit: "m³", price: 176.29, quantity: 0 },
    { pos: "15.341.1004", desc: "10 cm EPS Mantolama", unit: "m²", price: 1065.70, quantity: 0 },
    { pos: "15.341.1006", desc: "5 cm kalınlıkta Taşyünü levhalar ile dış cephe mantolama yapılması", unit: "m²", price: 980.50 },
    { pos: "15.540.1602", desc: "Saf akrilik esaslı Dış Cephe Boyası yapılması", unit: "m²", price: 378.53 },
    { pos: "77.105.1001", desc: "Mineral dolgulu kompozit alüminyum levhalar ile cephe kaplaması", unit: "m²", price: 3995.34 },
  ],
  "Zemin ve Duvar Kaplamaları": [
    { pos: "15.385.1008", desc: "60x60 cm anma ebatlarında, I.kalite, beyaz, sırlı porselen karo döşeme kaplaması", unit: "m²", price: 850.53 },
    { pos: "15.385.1009", desc: "60x60 cm anma ebatlarında, I.kalite, RENKLİ, sırlı porselen karo döşeme kaplaması", unit: "m²", price: 920.45 },
    { pos: "15.385.1024", desc: "30x30 cm veya 33x33 cm anma ebatlarında, renkli, sırlı porselen karo kaplaması", unit: "m²", price: 780.20 },
    { pos: "15.380.1056", desc: "30x60 cm anma ebatlarında, I.kalite, renkli seramik duvar karoları ile duvar kaplaması", unit: "m²", price: 695.15 },
    { pos: "15.490.1003", desc: "Laminat parke döşeme kaplaması yapılması (AC4 Sınıf 32)", unit: "m²", price: 685.88 },
    { pos: "15.490.1004", desc: "Laminat parke döşeme kaplaması yapılması (AC5 Sınıf 33 - Yoğun Trafik)", unit: "m²", price: 810.12 },
    { pos: "15.410.1413", desc: "3 cm kalınlığında renkli mermer levha ile dış denizlik yapılması", unit: "m²", price: 3604.93 },
  ],
  "Kapı ve Pencere Doğramaları": [
    { pos: "15.455.1001", desc: "PVC doğrama imalatı", unit: "kg", price: 247.96 },
    { pos: "77.170.1009", desc: "120 Dk Dayanımlı Panik Barlı Yangın Kapısı (Tek Kanat)", unit: "Adet", price: 21770.84 },
    { pos: "35.800.6105", desc: "Yana kayan kapı motoru (300kg, 24V DC, 200W)", unit: "Adet", price: 10793.75 },
    { pos: "35.800.6120", desc: "Yana kayan kapı motoru (600kg, 24V DC, 350W)", unit: "Adet", price: 14815.63 },
    { pos: "15.465.1101", desc: "Pencere kolu (İspanyolet) takılması", unit: "Adet", price: 145.50 },
    { pos: "15.465.1116", desc: "Pencere menteşesi takılması", unit: "Adet", price: 35.40 },
    { pos: "15.460.1010", desc: "Isı yalıtımlı alüminyum doğrama imalatı", unit: "kg", price: 350.00 },
    { pos: "15.470.1010", desc: "4+12+4 mm çift camlı pencere ünitesi", unit: "m²", price: 1692.55 }, // CAM POZU
  ],
  "Hafriyat ve Zemin İşleri": [
    { pos: "15.120.1101", desc: "Makine ile her derinlik ve her genişlikte yumuşak ve sert toprak kazılması (Derin kazı)", unit: "m³", price: 65.95 },
    { pos: "15.120.1104", desc: "Makine ile serbest kazı yapılması", unit: "m³", price: 58.40 },
    { pos: "15.125.1010", desc: "63mm'ye kadar kırmataş serilmesi", unit: "m³", price: 564.94 },
    { pos: "15.204.1001", desc: "Ø 100 mm PVC drenaj borusu", unit: "m", price: 55.29 },
  ]
};

const initialStaticData = [
  { id: 1, category: "Hafriyat ve Zemin İşleri", pos: "15.120.1101", desc: "Makine ile her derinlik ve her genişlikte yumuşak ve sert toprak kazılması (Derin kazı)", unit: "m³", price: 65.95, quantity: 0 },
  { id: 2, category: "Hafriyat ve Zemin İşleri", pos: "15.125.1010", desc: "63mm'ye kadar kırmataş temin edilerek, makine ile serme, sulama ve sıkıştırma yapılması", unit: "m³", price: 564.94, quantity: 0 },
  { id: 9, category: "Hafriyat ve Zemin İşleri", pos: "15.204.1001", desc: "Ø 100 mm anma çaplı, PVC esaslı koruge drenaj borusunun temini ve yerine döşenmesi", unit: "m", price: 55.29, quantity: 0 },
  { id: 3, category: "Betonarme ve Kalıp İşleri", pos: "15.150.1003", desc: "C 16/20 basınç dayanım sınıfında, gri renkte, normal hazır beton dökülmesi", unit: "m³", price: 3150.44, quantity: 0 },
  { id: 4, category: "Betonarme ve Kalıp İşleri", pos: "15.150.1006", desc: "C 30/37 basınç dayanım sınıfında, gri renkte, normal hazır beton dökülmesi", unit: "m³", price: 3553.73, quantity: 0 },
  { id: 5, category: "Betonarme ve Kalıp İşleri", pos: "15.160.1003", desc: "Ø 8- Ø 12 mm nervürlü beton çelik çubuğu, kesilmesi, bükülmesi ve yerine konulması", unit: "Ton", price: 45954.91, quantity: 0 },
  { id: 6, category: "Betonarme ve Kalıp İşleri", pos: "15.160.1004", desc: "Ø 14- Ø 28 mm nervürlü beton çelik çubuğu, kesilmesi, bükülmesi ve yerine konulması", unit: "Ton", price: 44180.65, quantity: 0 },
  { id: 7, category: "Betonarme ve Kalıp İşleri", pos: "15.180.1003", desc: "Plywood ile düz yüzeyli betonarme kalıbı yapılması", unit: "m²", price: 1011.06, quantity: 0 },
  { id: 8, category: "Betonarme ve Kalıp İşleri", pos: "15.185.1005", desc: "Çelik borudan kalıp iskelesi yapılması (0-4m)", unit: "m³", price: 124.89, quantity: 0 },
  { id: 10, category: "Temel Yalıtım İşleri", pos: "15.255.1008", desc: "Polimer bitümlü örtüler ile iki kat su yalıtımı yapılması", unit: "m²", price: 618.30, quantity: 0 },
  { id: 11, category: "Temel Yalıtım İşleri", pos: "15.270.1008", desc: "Çimento esaslı polimer modifiyeli yalıtım harcı ile su yalıtımı yapılması", unit: "m²", price: 610.66, quantity: 0 },
];

const initialArchitecturalData = [
  { id: 3, category: "Duvar ve Kaba Yapı", pos: "15.220.1012", desc: "100 mm yatay delikli tuğla duvar yapılması", unit: "m²", price: 741.66, quantity: 0 },
  { id: 4, category: "Duvar ve Kaba Yapı", pos: "15.220.1014", desc: "135 mm yatay delikli tuğla duvar yapılması", unit: "m²", price: 794.93, quantity: 0 },
  { id: 5, category: "Duvar ve Kaba Yapı", pos: "15.220.1015", desc: "190 mm yatay delikli tuğla duvar yapılması", unit: "m²", price: 907.18, quantity: 0 },
  { id: 10, category: "Çatı İşleri", pos: "15.300.1002", desc: "Ahşaptan oturtma çatı (OSB/3 kaplamalı)", unit: "m²", price: 1544.23, quantity: 0 },
  { id: 11, category: "Çatı İşleri", pos: "15.305.1001", desc: "Alaturka kiremit çatı örtüsü (3 Latalı)", unit: "m²", price: 1560.74, quantity: 0 },
  { id: 12, category: "Çatı İşleri", pos: "15.310.1201", desc: "14 no.lu çinko levhadan eğimli çatı deresi", unit: "m", price: 1226.74, quantity: 0 },
  { id: 13, category: "Çatı İşleri", pos: "15.315.1002", desc: "Ø 100 mm PVC yağmur borusu", unit: "m", price: 260.23, quantity: 0 },
  { id: 17, category: "Kapı ve Pencere Doğramaları", pos: "15.455.1001", desc: "PVC doğrama imalatı", unit: "kg", price: 247.96, quantity: 0 },
  { id: 18, category: "Kapı ve Pencere Doğramaları", pos: "15.470.1010", desc: "4+4 mm çift camlı pencere ünitesi", unit: "m²", price: 1692.55, quantity: 0 },
  { id: 20, category: "Kapı ve Pencere Doğramaları", pos: "15.510.1103", desc: "Laminat kaplamalı, kraft dolgulu iç kapı kanadı", unit: "m²", price: 3165.60, quantity: 0 },
  { id: 33, category: "Kapı ve Pencere Doğramaları", pos: "15.510.1001", desc: "Ahşaptan masif tablalı iç kapı kasa ve pervazı", unit: "m²", price: 2332.99, quantity: 0 },
  { id: 25, category: "Kapı ve Pencere Doğramaları", pos: "15.465.1002", desc: "Gömme iç kapı kilidinin yerine takılması (Dar Tip)", unit: "Adet", price: 126.25, quantity: 0 },
  { id: 26, category: "Kapı ve Pencere Doğramaları", pos: "15.465.1008", desc: "Kapı kolu ve aynalarının yerine takılması (Kromajlı)", unit: "Adet", price: 126.25, quantity: 0 },
  { id: 27, category: "Kapı ve Pencere Doğramaları", pos: "15.465.1010", desc: "Menteşenin yerine takılması", unit: "Adet", price: 22.28, quantity: 0 },
  { id: 42, category: "Kapı ve Pencere Doğramaları", pos: "77.170.1009", desc: "120 Dk Dayanımlı Panik Barlı Yangın Kapısı", unit: "Adet", price: 21770.84, quantity: 0 },
  { id: 6, category: "İnce İşler (Sıva, Şap, Boya)", pos: "15.250.1111", desc: "2.5 cm kalınlığında 400 kg dozlu şap", unit: "m²", price: 443.59, quantity: 0 },
  { id: 7, category: "İnce İşler (Sıva, Şap, Boya)", pos: "15.275.1116", desc: "250 kg çimento dozlu kaba sıva", unit: "m²", price: 437.11, quantity: 0 },
  { id: 8, category: "İnce İşler (Sıva, Şap, Boya)", pos: "15.280.1009", desc: "Perlitli sıva ve saten alçı kaplama", unit: "m²", price: 682.90, quantity: 0 },
  { id: 9, category: "İnce İşler (Sıva, Şap, Boya)", pos: "15.280.1012", desc: "Makina alçısı ile tavanlara tek kat alçı sıva", unit: "m²", price: 459.11, quantity: 0 },
  { id: 21, category: "İnce İşler (Sıva, Şap, Boya)", pos: "15.540.1520", desc: "Su bazlı Silikonlu Mat İç Cephe Boyası", unit: "m²", price: 212.05, quantity: 0 },
  { id: 15, category: "Zemin ve Duvar Kaplamaları", pos: "15.385.1008", desc: "60x60 cm anma ebatlarında, I.kalite, beyaz, sırlı porselen karo döşeme kaplaması", unit: "m²", price: 850.53, quantity: 0 },
  { id: 24, category: "Zemin ve Duvar Kaplamaları", pos: "OZL.60X120", desc: "60x120 Parlak Granit Seramik", unit: "m²", price: 1503.43, quantity: 0 },
  { id: 19, category: "Zemin ve Duvar Kaplamaları", pos: "15.490.1003", desc: "Laminat parke döşeme kaplaması (AC4)", unit: "m²", price: 685.88, quantity: 0 },
  { id: 16, category: "Zemin ve Duvar Kaplamaları", pos: "15.410.1413", desc: "3 cm renkli mermer denizlik", unit: "m²", price: 3604.93, quantity: 0 },
  { id: 1, category: "Cephe İşleri", pos: "15.185.1013", desc: "Ön yapımlı tam güvenlikli dış cephe iş iskelesi yapılması (0-51,50m)", unit: "m²", price: 217.18, quantity: 0 },
  { id: 2, category: "Cephe İşleri", pos: "15.185.1014", desc: "Ön yapımlı tam güvenlikli tavan iş iskelesi (0-21,50m)", unit: "m³", price: 176.29, quantity: 0 },
  { id: 14, category: "Cephe İşleri", pos: "15.341.1004", desc: "10 cm EPS Mantolama", unit: "m²", price: 1065.70, quantity: 0 },
  { id: 22, category: "Cephe İşleri", pos: "15.540.1602", desc: "Saf akrilik esaslı Dış Cephe Boyası", unit: "m²", price: 378.53, quantity: 0 },
  { id: 23, category: "Cephe İşleri", pos: "77.105.1001", desc: "Kompozit alüminyum levha cephe kaplaması", unit: "m²", price: 3995.34, quantity: 0 },
];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(value);
};

// --- Helper Functions to Load External Scripts (CDN Injection) ---
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// --- BİLEŞENLER ---

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-8 py-4 font-bold text-sm transition-all duration-300 rounded-t-xl relative overflow-hidden group ${
      active
        ? 'bg-white text-orange-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border-t-4 border-orange-500'
        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 border-t-4 border-transparent'
    }`}
  >
    <Icon className={`w-5 h-5 mr-2 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
    {label}
  </button>
);

const SummaryCard = ({ title, value, icon: Icon, colorClass, iconBgClass }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group w-full">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 ${colorClass}`}>
       <Icon className="w-24 h-24" />
    </div>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconBgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('text-', '')}`} /> 
      </div>
      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">{title}</span>
      <span className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(value)}</span>
    </div>
  </div>
);

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
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

          <button 
            type="submit"
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all flex justify-center items-center"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
};

const ProjectInfoModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [info, setInfo] = useState({ name: '', area: '', floors: '', city: '' });

  useEffect(() => {
    if (isOpen) {
      setInfo(initialData || { name: '', area: '', floors: '', city: '' });
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
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
            <Info className="w-5 h-5 text-blue-500" />
            Proje Bilgileri
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Proje İsmi</label>
            <input 
              type="text" 
              name="name"
              value={info.name}
              onChange={handleChange}
              className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Örn: Mavişehir Konutları"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Kapalı Alan (m²)</label>
                <div className="relative">
                   <Grid className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/>
                   <input 
                    type="number" 
                    name="area"
                    value={info.area}
                    onChange={handleChange}
                    className="w-full pl-10 p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="1500"
                  />
                </div>
             </div>
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Kat Sayısı</label>
                <input 
                  type="number" 
                  name="floors"
                  value={info.floors}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="5"
                />
             </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Şehir</label>
            <div className="relative">
               <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/>
               <input 
                type="text" 
                name="city"
                value={info.city}
                onChange={handleChange}
                className="w-full pl-10 p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="İstanbul"
              />
            </div>
          </div>
          
          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PoseSelectorModal = ({ isOpen, onClose, category, onSelect, currentPos, isAddingNew, posLibrary }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualPose, setManualPose] = useState({
    pos: "",
    desc: "",
    unit: "",
    price: ""
  });

  if (!isOpen) return null;

  const allPoses = Object.values(posLibrary).flat();
  const categoryPoses = posLibrary[category] || [];
  
  const displayPoses = searchTerm.length > 0 
    ? allPoses.filter(item => 
        (item.pos && item.pos.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (item.desc && item.desc.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : categoryPoses;

  const handleManualSubmit = () => {
    if (manualPose.pos && manualPose.price) {
      onSelect({
        ...manualPose,
        price: parseFloat(manualPose.price),
        category: category 
      });
    }
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
            <p className="text-sm text-slate-500 mt-1">
              {searchTerm ? 'Tüm Kütüphanede Aranıyor' : 'Kategoriye Uygun Pozlar Listeleniyor'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Poz No veya Tanım Ara (Örn: 15.160... veya Demir)" 
              className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-700 placeholder-slate-400 shadow-inner transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 bg-slate-50/50">
          {showManualForm ? (
            <div className="p-6 bg-white rounded-xl border border-orange-200 shadow-md">
              <h4 className="font-bold text-slate-800 mb-6 flex items-center text-lg">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <Edit3 className="w-5 h-5 text-orange-600" />
                </div>
                Manuel Poz Ekleme
              </h4>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Poz No</label>
                  <input 
                    type="text" 
                    value={manualPose.pos}
                    onChange={(e) => setManualPose({...manualPose, pos: e.target.value})}
                    className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono"
                    placeholder="Örn: 15.XXX.XXXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanım</label>
                  <textarea 
                    value={manualPose.desc}
                    onChange={(e) => setManualPose({...manualPose, desc: e.target.value})}
                    className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="İmalatın adı ve açıklaması..."
                    rows="3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Birim</label>
                    <input 
                      type="text" 
                      value={manualPose.unit}
                      onChange={(e) => setManualPose({...manualPose, unit: e.target.value})}
                      className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      placeholder="m², m³, Adet"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Birim Fiyat (TL)</label>
                    <input 
                      type="number" 
                      value={manualPose.price}
                      onChange={(e) => setManualPose({...manualPose, price: e.target.value})}
                      className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="pt-4 flex space-x-3">
                  <button 
                    onClick={handleManualSubmit}
                    disabled={!manualPose.pos || !manualPose.price}
                    className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    {isAddingNew ? 'Listeye Ekle' : 'Güncelle'}
                  </button>
                  <button 
                    onClick={() => setShowManualForm(false)}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {displayPoses.length > 0 ? (
                <div className="space-y-3">
                  {displayPoses.map((item) => (
                    <div 
                      key={item.pos}
                      onClick={() => onSelect(item)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg group relative ${
                        item.pos === currentPos 
                          ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' 
                          : 'bg-white border-slate-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 mr-6">
                          <div className="flex items-center mb-2">
                            <span className="font-mono text-sm font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded mr-3">
                              {item.pos}
                            </span>
                            {item.pos === currentPos && (
                              <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full flex items-center">
                                <Check className="w-3 h-3 mr-1"/> Seçili
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                        <div className="text-right min-w-[100px]">
                           <span className="block text-xs font-bold text-slate-400 uppercase mb-1">{item.unit} Fiyatı</span>
                           <span className="font-bold text-slate-900 text-lg tracking-tight">{formatCurrency(item.price)}</span>
                        </div>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                         <ArrowRight className="w-5 h-5 text-orange-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <div className="p-4 bg-slate-100 rounded-full mb-4">
                    <Search className="w-10 h-10 opacity-40" />
                  </div>
                  <p className="text-center mb-6 font-medium">
                    "{searchTerm}" aramasına uygun poz bulunamadı.<br/>
                    <span className="text-sm font-normal opacity-70">Sistemde yüklü olmayan bir poz olabilir.</span>
                  </p>
                  <button 
                    onClick={() => setShowManualForm(true)}
                    className="flex items-center px-6 py-3 bg-white border-2 border-dashed border-orange-300 text-orange-600 rounded-xl hover:bg-orange-50 hover:border-orange-500 transition-all font-bold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Bu Pozu Manuel Ekle
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
           <span className="text-xs font-semibold text-slate-400 flex items-center">
             <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
             2025 ÇŞB Veritabanı Aktif
           </span>
           {!showManualForm && (
             <button 
               onClick={() => setShowManualForm(true)}
               className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center transition-colors px-3 py-1 hover:bg-orange-50 rounded-lg"
             >
               <Edit3 className="w-3 h-3 mr-1" />
               Manuel Ekleme Formunu Aç
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

const GroupedTable = ({ data, onUpdateQuantity, onOpenSelector, onAddNewItem }) => {
  const groupedData = data.reduce((acc, item) => {
    const cat = item.category || "Genel";
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8 w-full">
      {Object.keys(groupedData).map((category) => {
        const items = groupedData[category];
        const categoryTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        let CategoryIcon = Layers;
        if (category.includes("Hafriyat")) CategoryIcon = Hammer;
        if (category.includes("Kapı")) CategoryIcon = DoorOpen;
        if (category.includes("Beton")) CategoryIcon = Building;
        
        return (
          <div key={category} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md w-full">
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <CategoryIcon className="w-5 h-5 text-slate-700" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{category}</h3>
              </div>
              <div className="flex items-center space-x-4">
                 <button 
                  onClick={() => onAddNewItem(category)}
                  className="flex items-center px-4 py-2 bg-white text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-50 transition-all border border-orange-200 shadow-sm hover:shadow active:scale-95"
                 >
                   <Plus className="w-3 h-3 mr-1.5" />
                   Poz Ekle
                 </button>
                 <div className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm shadow-md">
                   Ara Toplam: <span className="font-bold text-orange-400 ml-2">{formatCurrency(categoryTotal)}</span>
                 </div>
              </div>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left table-fixed min-w-[800px]">
                <thead className="bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                  <tr>
                    <th className="px-6 py-4 w-32">Poz No</th>
                    <th className="px-6 py-4 w-auto">İmalat Adı</th>
                    <th className="px-6 py-4 w-24 text-center">Birim</th>
                    <th className="px-6 py-4 w-32 text-right">Birim Fiyat</th>
                    <th className="px-6 py-4 w-28 text-center">İşlem</th>
                    <th className="px-6 py-4 w-32 text-center">Miktar</th>
                    <th className="px-6 py-4 w-36 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200/50 px-2 py-1 rounded">
                          {item.pos}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-700 line-clamp-2" title={item.desc}>
                          {item.desc}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-sm text-slate-600 font-medium">
                          {formatCurrency(item.price)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => onOpenSelector(item)}
                          className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all active:scale-95"
                          title="Pozu Değiştir"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity || ''}
                            onChange={(e) => onUpdateQuantity(item.id, parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm text-center font-bold text-slate-800 bg-white border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm focus:shadow-md"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Door Calculation Component ---
const DoorCalculationArea = ({ items, setItems, onUpdateQuantities }) => {
  const [newItem, setNewItem] = useState({ label: '', width: '', height: '', count: '' });
  const [editingId, setEditingId] = useState(null);

  const handleAddOrUpdateItem = () => {
    if (newItem.label && newItem.count) {
      if (editingId) {
        setItems(items.map(item => item.id === editingId ? { ...newItem, id: editingId } : item));
        setEditingId(null);
      } else {
        setItems([...items, { ...newItem, id: Date.now() }]);
      }
      setNewItem({ label: '', width: '', height: '', count: '' });
    }
  };

  const handleEditItem = (item) => {
    setNewItem({ label: item.label, width: item.width, height: item.height, count: item.count });
    setEditingId(item.id);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setNewItem({ label: '', width: '', height: '', count: '' });
    }
  };

  const calculateRowValues = (item) => {
    const widthM = (parseFloat(item.width) || 0) / 100;
    const heightM = (parseFloat(item.height) || 0) / 100;
    const count = parseFloat(item.count) || 0;

    const leafArea = widthM * heightM * count;
    const frameArea = ((2 * heightM) + widthM) * 0.34 * count;

    return { leafArea, frameArea };
  };

  const totalDoorCount = items.reduce((sum, item) => sum + (parseFloat(item.count) || 0), 0);
  const totalLeafArea = items.reduce((sum, item) => sum + calculateRowValues(item).leafArea, 0);
  const totalFrameArea = items.reduce((sum, item) => sum + calculateRowValues(item).frameArea, 0);

  const lockCount = totalDoorCount * 1;
  const hingeCount = totalDoorCount * 3;
  const handleCount = totalDoorCount * 1;
  const stopCount = totalDoorCount * 1;

  const handleTransfer = () => {
    const updates = {
      "15.510.1103": totalLeafArea,
      "15.510.1001": totalFrameArea,
      "15.510.1101": totalFrameArea,
      "15.465.1002": lockCount,
      "15.465.1010": hingeCount,
      "15.465.1008": handleCount,
      "15.465.1013": stopCount
    };
    onUpdateQuantities(updates);
    alert("Hesaplanan kapı metrajları listeye başarıyla aktarıldı!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <div className="flex justify-between items-end border-b border-slate-200 pb-2">
         <h2 className="text-xl font-bold text-slate-800 flex items-center">
           <DoorOpen className="w-6 h-6 mr-2 text-indigo-600" />
           Kapı Metrajı
         </h2>
         <button 
          onClick={handleTransfer}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-all shadow-md active:scale-95"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Listeye Aktar
        </button>
      </div>
      
      {/* Input Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 w-full">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider flex items-center">
             {editingId ? <Edit3 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
             {editingId ? 'Kapı Düzenle' : 'Yeni Kapı Ekle'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Tip (Örn: K1)</label>
            <input 
              type="text" 
              value={newItem.label}
              onChange={e => setNewItem({...newItem, label: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="K1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">En (cm)</label>
            <input 
              type="number" 
              value={newItem.width}
              onChange={e => setNewItem({...newItem, width: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="90"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Boy (cm)</label>
            <input 
              type="number" 
              value={newItem.height}
              onChange={e => setNewItem({...newItem, height: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="220"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Adet</label>
            <input 
              type="number" 
              value={newItem.count}
              onChange={e => setNewItem({...newItem, count: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="0"
            />
          </div>
          <button 
            onClick={handleAddOrUpdateItem}
            className={`flex items-center justify-center p-2.5 text-white rounded-lg font-bold transition-colors ${
              editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {editingId ? 'Güncelle' : 'Ekle'}
          </button>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        <table className="w-full text-left text-sm table-fixed min-w-[800px]">
          <thead className="bg-slate-200 text-slate-600 text-xs font-bold uppercase">
            <tr>
              <th className="px-6 py-4 w-32">Tip</th>
              <th className="px-6 py-4 w-32">Ebat (En/Boy)</th>
              <th className="px-6 py-4 w-24 text-center">Adet</th>
              <th className="px-6 py-4 w-40 text-right">Kapı Kanadı (m²)</th>
              <th className="px-6 py-4 w-40 text-right">Kasa+Pervaz (m²)</th>
              <th className="px-6 py-4 w-32 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-400">Henüz veri girişi yapılmadı.</td>
              </tr>
            ) : items.map((item) => {
              const { leafArea, frameArea } = calculateRowValues(item);
              return (
                <tr key={item.id} className={`hover:bg-slate-50 ${editingId === item.id ? 'bg-orange-50' : ''}`}>
                  <td className="px-6 py-4 font-bold text-indigo-700">{item.label}</td>
                  <td className="px-6 py-4">{item.width} / {item.height} cm</td>
                  <td className="px-6 py-4 text-center font-bold">{item.count}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-700">
                    {leafArea.toFixed(2)} m²
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-700">
                    {frameArea.toFixed(2)} m²
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleEditItem(item)} className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
              <tr>
                <td colSpan="2" className="px-6 py-3 text-right uppercase tracking-wider">Genel Toplam:</td>
                <td className="px-6 py-3 text-center text-indigo-700">{totalDoorCount} Adet</td>
                <td className="px-6 py-3 text-right text-indigo-700">{totalLeafArea.toFixed(2)} m²</td>
                <td className="px-6 py-3 text-right text-indigo-700">{totalFrameArea.toFixed(2)} m²</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Summary Cards (Hırdavat Hesabı) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 rounded-full mb-3 text-blue-600">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-500 uppercase">Gömme Kilit</h4>
          <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1002</div>
          <span className="text-2xl font-black text-slate-800">{lockCount}</span>
          <span className="text-xs text-slate-400">Adet</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-50 rounded-full mb-3 text-green-600">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-500 uppercase">Menteşe (x3)</h4>
          <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1010</div>
          <span className="text-2xl font-black text-slate-800">{hingeCount}</span>
          <span className="text-xs text-slate-400">Adet</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-50 rounded-full mb-3 text-purple-600">
            <MousePointer className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-500 uppercase">Kapı Kolu</h4>
          <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1008</div>
          <span className="text-2xl font-black text-slate-800">{handleCount}</span>
          <span className="text-xs text-slate-400">Takım</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-orange-50 rounded-full mb-3 text-orange-600">
            <Hammer className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-500 uppercase">Stop (Nikelaj)</h4>
          <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1013</div>
          <span className="text-2xl font-black text-slate-800">{stopCount}</span>
          <span className="text-xs text-slate-400">Adet</span>
        </div>
      </div>
    </div>
  );
};

// --- Window Calculation Component ---
const WindowCalculationArea = ({ items, setItems, onUpdateQuantities }) => {
  const [newItem, setNewItem] = useState({ label: '', width: '', height: '', count: '', middleRegister: '' });
  const [editingId, setEditingId] = useState(null);
  const [windowType, setWindowType] = useState('pvc'); 

  const handleAddOrUpdateItem = () => {
    if (newItem.label && newItem.count) {
      const itemToSave = { ...newItem, type: windowType };
      if (editingId) {
        setItems(items.map(item => item.id === editingId ? { ...itemToSave, id: editingId } : item));
        setEditingId(null);
      } else {
        setItems([...items, { ...itemToSave, id: Date.now() }]);
      }
      setNewItem({ label: '', width: '', height: '', count: '', middleRegister: '' });
    }
  };

  const handleEditItem = (item) => {
    setWindowType(item.type);
    setNewItem({ 
      label: item.label, 
      width: item.width, 
      height: item.height, 
      count: item.count,
      middleRegister: item.middleRegister || ''
    });
    setEditingId(item.id);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setNewItem({ label: '', width: '', height: '', count: '', middleRegister: '' });
    }
  };

  const calculateWindowValues = (item) => {
    const widthM = (parseFloat(item.width) || 0) / 100;
    const heightM = (parseFloat(item.height) || 0) / 100;
    const count = parseFloat(item.count) || 0;
    const midReg = parseFloat(item.middleRegister) || 0;
    
    let weight = 0;
    const glassArea = Math.max(0, (widthM - 0.2) * (heightM - 0.2)) * count;

    if (item.type === 'pvc') {
       // PVC Formülü: 2 * (En + Boy) * 1.1 * 2 * Adet
       // Çevre * 1.1 * 2
       weight = 2 * (widthM + heightM) * 1.1 * 2 * count;
    } else if (item.type === 'alu') {
       // Alüminyum Hesaplama Mantığı
       if (midReg > 0) {
         // Orta Kayıt VARSA (Eski Formül - Kullanıcı Formülü)
         // [(En*Boy)*2*1.596] + [(Boy-0.2)*2.038] + [(((En/2)-0.16)+(Boy-0.16))*2*2.186)]
         const term1 = (widthM * heightM) * 2 * 1.596;
         const term2 = (heightM - 0.2) * 2.038;
         const term3 = (((widthM / 2) - 0.16) + (heightM - 0.16)) * 2 * 2.186;
         weight = (term1 + term2 + term3) * count;
       } else {
         // Orta Kayıt YOKSA (Yeni Formül)
         // [(En+Boy)*2*1.596] + [((En-0.16)+(Boy-0.16))*2*2.186]
         const term1 = (widthM + heightM) * 2 * 1.596;
         const term2 = ((widthM - 0.16) + (heightM - 0.16)) * 2 * 2.186;
         weight = (term1 + term2) * count;
       }
    }
    
    return { weight, glassArea };
  };

  const pvcWindows = items.filter(i => i.type === 'pvc');
  const aluWindows = items.filter(i => i.type === 'alu');

  const totalPVCCount = pvcWindows.reduce((acc, i) => acc + (parseFloat(i.count) || 0), 0);
  const totalAluCount = aluWindows.reduce((acc, i) => acc + (parseFloat(i.count) || 0), 0);
  
  const totalPVCWeight = pvcWindows.reduce((acc, item) => acc + calculateWindowValues(item).weight, 0);
  const totalAluWeight = aluWindows.reduce((acc, item) => acc + calculateWindowValues(item).weight, 0);

  const totalWindowCount = items.reduce((sum, item) => sum + (parseFloat(item.count) || 0), 0);
  const windowHandleCount = totalWindowCount * 1;
  const windowHingeCount = totalWindowCount * 3;
  
  // Toplam Cam Alanı
  const totalGlassArea = items.reduce((sum, item) => sum + calculateWindowValues(item).glassArea, 0);

  const handleTransfer = () => {
    const updates = {
      "15.455.1001": totalPVCWeight,  // PVC
      "15.460.1010": totalAluWeight,  // Alüminyum
      "15.465.1101": windowHandleCount,
      "15.465.1116": windowHingeCount,
      "15.470.1010": totalGlassArea   // Cam
    };
    onUpdateQuantities(updates);
    alert("Hesaplanan pencere metrajları listeye başarıyla aktarıldı!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 w-full">
      <div className="flex justify-between items-end border-b border-slate-200 pb-2">
           <h2 className="text-xl font-bold text-slate-800 flex items-center">
             <Maximize className="w-6 h-6 mr-2 text-blue-600" />
             Pencere Metrajı
           </h2>
           <button 
            onClick={handleTransfer}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-all shadow-md active:scale-95"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Listeye Aktar
          </button>
      </div>

      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setWindowType('pvc')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${windowType === 'pvc' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          PVC Doğrama
        </button>
        <button 
          onClick={() => setWindowType('alu')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${windowType === 'alu' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Isı Yal. Al. Doğrama
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden w-full">
        <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none`}>
            <Box className="w-32 h-32" />
        </div>
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider flex items-center">
            {editingId ? <Edit3 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {editingId ? 'Pencere Düzenle' : `Yeni ${windowType === 'pvc' ? 'PVC' : 'Alüminyum'} Pencere Ekle`}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Tip (Örn: P1)</label>
            <input 
              type="text" 
              value={newItem.label}
              onChange={e => setNewItem({...newItem, label: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="P1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">En (cm)</label>
            <input 
              type="number" 
              value={newItem.width}
              onChange={e => setNewItem({...newItem, width: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="150"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Boy (cm)</label>
            <input 
              type="number" 
              value={newItem.height}
              onChange={e => setNewItem({...newItem, height: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="150"
            />
          </div>
           <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Orta Kayıt (cm)</label>
            <input 
              type="number" 
              value={newItem.middleRegister}
              onChange={e => setNewItem({...newItem, middleRegister: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Adet</label>
            <input 
              type="number" 
              value={newItem.count}
              onChange={e => setNewItem({...newItem, count: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0"
            />
          </div>
          <button 
            onClick={handleAddOrUpdateItem}
            className={`flex items-center justify-center p-2.5 text-white rounded-lg font-bold transition-colors ${
              editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {editingId ? 'Güncelle' : 'Ekle'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        <table className="w-full text-left text-sm table-fixed min-w-[800px]">
          <thead className="bg-slate-200 text-slate-600 text-xs font-bold uppercase">
            <tr>
              <th className="px-6 py-4 w-32">Poz No</th>
              <th className="px-6 py-4">Tip</th>
              <th className="px-6 py-4">Çeşit</th>
              <th className="px-6 py-4">Ebat</th>
              <th className="px-6 py-4 text-center">Adet</th>
              <th className="px-6 py-4 text-right">
                {windowType === 'pvc' ? 'PVC Profil (kg)' : 'Alüminyum Profil (kg)'}
              </th>
              <th className="px-6 py-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400">Veri yok.</td></tr>
            ) : items.map((item) => {
                const weight = calculateWindowValues(item);
                const posNo = item.type === 'pvc' ? '15.455.1001' : '15.460.1010';
                
                return (
              <tr key={item.id} className={`hover:bg-slate-50 ${editingId === item.id ? 'bg-orange-50' : ''}`}>
                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                   {posNo}
                </td>
                <td className="px-6 py-4 font-bold text-blue-700">{item.label}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${item.type === 'pvc' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {item.type === 'pvc' ? 'PVC' : 'Alüminyum'}
                  </span>
                </td>
                <td className="px-6 py-4">{item.width} / {item.height}</td>
                <td className="px-6 py-4 text-center font-bold">{item.count}</td>
                <td className="px-6 py-4 text-right font-mono text-slate-700">
                  {weight.weight.toFixed(2)} kg
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => handleEditItem(item)} className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-500 uppercase">PVC Toplamı</span>
              <Box className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-2xl font-black text-blue-800">{totalPVCWeight.toFixed(2)}</span>
              <span className="text-sm font-medium text-blue-600 ml-1">kg</span>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-500 uppercase">PVC Adedi</span>
              <Grid className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-2xl font-black text-blue-800">{totalPVCCount}</span>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between opacity-70">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Alüminyum Toplamı</span>
              <Box className="w-5 h-5 text-gray-400" />
            </div>
            <div>
                <span className="text-2xl font-black text-gray-800">{totalAluWeight.toFixed(2)}</span>
                <span className="text-sm font-medium text-gray-600 ml-1">kg</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between opacity-70">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Alüminyum Adedi</span>
              <Grid className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-2xl font-black text-gray-800">{totalAluCount}</span>
          </div>
      </div>

      <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 shadow-sm flex items-center justify-between mt-6 w-full">
         <div>
            <span className="text-xs font-bold text-teal-600 uppercase block mb-1">Toplam Cam (Isıcam)</span>
            <span className="text-xs text-teal-500">Poz No: 15.470.1010</span>
         </div>
         <div>
            <span className="text-3xl font-black text-teal-800">{totalGlassArea.toFixed(2)}</span>
            <span className="text-sm font-medium text-teal-600 ml-1">m²</span>
         </div>
      </div>

      {/* Pencere Aksesuarları */}
      <div className="mt-8 w-full">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-indigo-500" />
          Pencere Aksesuarları (Listeye Aktarılacak)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="p-3 bg-purple-50 rounded-full mb-3 text-purple-600">
              <MousePointer className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-500 uppercase">Pencere Kolu</h4>
            <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1101</div>
            <span className="text-2xl font-black text-slate-800">{windowHandleCount}</span>
            <span className="text-xs text-slate-400">Adet</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-50 rounded-full mb-3 text-green-600">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-500 uppercase">Menteşe (x3)</h4>
            <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1116</div>
            <span className="text-2xl font-black text-slate-800">{windowHingeCount}</span>
            <span className="text-xs text-slate-400">Adet</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('static');
  const [staticItems, setStaticItems] = useState(initialStaticData);
  const [architecturalItems, setArchitecturalItems] = useState(initialArchitecturalData);
  const [lastSaved, setLastSaved] = useState(null);
  const [posLibrary, setPosLibrary] = useState(INITIAL_POS_LIBRARY);
  
  const [doorItems, setDoorItems] = useState([]);
  const [windowItems, setWindowItems] = useState([]);
  
  const [isXLSXLoaded, setIsXLSXLoaded] = useState(false);
  const [isPDFLoaded, setIsPDFLoaded] = useState(false);
  const [isLoadingScripts, setIsLoadingScripts] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectInfo, setProjectInfo] = useState({ name: '', area: '', floors: '', city: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [targetCategory, setTargetCategory] = useState("");
  
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // --- Initialize Scripts & Load Data ---
  useEffect(() => {
    const loadLibraries = async () => {
      try {
        await loadScript("https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js");
        setIsXLSXLoaded(true);

        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          setIsPDFLoaded(true);
        }
        
        setIsLoadingScripts(false);
      } catch (error) {
        console.error("Kütüphaneler yüklenirken hata oluştu:", error);
        setIsLoadingScripts(false);
      }
    };
    loadLibraries();

    const savedData = localStorage.getItem('gkmetraj_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.staticItems) setStaticItems(parsed.staticItems);
        if (parsed.architecturalItems) setArchitecturalItems(parsed.architecturalItems);
        if (parsed.doorItems) setDoorItems(parsed.doorItems);
        if (parsed.windowItems) setWindowItems(parsed.windowItems);
        if (parsed.projectInfo) setProjectInfo(parsed.projectInfo);
        if (parsed.lastSaved) setLastSaved(parsed.lastSaved);
      } catch (e) {
        console.error("Kayıtlı veri okunamadı", e);
      }
    }
    
    // Check if user session exists (simple check)
    const session = localStorage.getItem('gkmetraj_session');
    if (session === 'active') {
        setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
      setIsLoggedIn(true);
      localStorage.setItem('gkmetraj_session', 'active');
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      localStorage.removeItem('gkmetraj_session');
  };

  const handleSaveProjectInfo = (info) => {
    setProjectInfo(info);
    // Auto-save when project info is updated
    const dataToSave = {
      staticItems,
      architecturalItems,
      doorItems,
      windowItems,
      projectInfo: info,
      lastSaved: new Date().toLocaleTimeString()
    };
    localStorage.setItem('gkmetraj_data', JSON.stringify(dataToSave));
  };

  const handleExportToXLSX = () => {
    if (!isXLSXLoaded || !window.XLSX) {
      alert("Excel modülü henüz yüklenmedi. Lütfen sayfayı yenileyip tekrar deneyin.");
      return;
    }

    const prepareData = (items) => items.map(item => ({
      "ID": item.id,
      "Kategori": item.category,
      "Poz No": item.pos,
      "İmalat Tanımı": item.desc,
      "Birim": item.unit,
      "Birim Fiyat (TL)": item.price,
      "Miktar": item.quantity,
      "Toplam Tutar (TL)": item.price * item.quantity
    }));

    const staticData = prepareData(staticItems);
    const archData = prepareData(architecturalItems);

    const wb = window.XLSX.utils.book_new();
    
    const wscols = [
      {wch:10}, {wch:25}, {wch:15}, {wch:60}, {wch:10}, {wch:15}, {wch:15}, {wch:15}
    ];

    const wsStatic = window.XLSX.utils.json_to_sheet(staticData);
    wsStatic['!cols'] = wscols;
    window.XLSX.utils.book_append_sheet(wb, wsStatic, "Statik Metraj");

    const wsArch = window.XLSX.utils.json_to_sheet(archData);
    wsArch['!cols'] = wscols;
    window.XLSX.utils.book_append_sheet(wb, wsArch, "Mimari Metraj");

    window.XLSX.writeFile(wb, "YM_Cetveli.xlsx");
  };

  const handleDownloadDescriptions = () => {
    if (!isXLSXLoaded || !window.XLSX) {
      alert("Excel modülü henüz yüklenmedi.");
      return;
    }

    let flatLibrary = [];
    Object.keys(posLibrary).forEach(category => {
      posLibrary[category].forEach(item => {
        flatLibrary.push({
          "Kategori": category,
          "Poz No": item.pos,
          "Tanım (Tarif)": item.desc,
          "Birim": item.unit,
          "Birim Fiyat (TL)": item.price
        });
      });
    });

    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.json_to_sheet(flatLibrary);
    
    const wscols = [
      {wch:25}, {wch:15}, {wch:80}, {wch:10}, {wch:15}
    ];
    ws['!cols'] = wscols;

    window.XLSX.utils.book_append_sheet(wb, ws, "Birim Fiyat Tarifleri");
    window.XLSX.writeFile(wb, "Birim_Fiyat_Tarifleri.xlsx");
  };

  const handleImportFromXLSX = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isXLSXLoaded) {
      alert("Excel modülü yükleniyor...");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const wb = window.XLSX.read(data, { type: 'binary' });

      const validateSheet = (sheet) => {
        if (!sheet) return false;
        const range = window.XLSX.utils.decode_range(sheet['!ref']);
        const headers = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = sheet[window.XLSX.utils.encode_cell({ r: range.s.r, c: C })];
          if (cell && cell.v) headers.push(cell.v);
        }
        
        const requiredHeaders = ["ID", "Kategori", "Poz No", "İmalat Tanımı", "Birim", "Birim Fiyat (TL)", "Miktar"];
        return requiredHeaders.every(h => headers.includes(h));
      };

      const staticSheetName = wb.SheetNames.find(n => n.includes("Statik"));
      const archSheetName = wb.SheetNames.find(n => n.includes("Mimari"));

      if (!staticSheetName || !archSheetName) {
         alert("Hata: Yüklenen Excel dosyası 'Statik Metraj' ve 'Mimari Metraj' sayfalarını içermelidir. Lütfen sistemden indirdiğiniz şablonu kullanın.");
         e.target.value = null;
         return;
      }

      if (!validateSheet(wb.Sheets[staticSheetName]) || !validateSheet(wb.Sheets[archSheetName])) {
         alert("Hata: Excel dosyasının sütun yapısı hatalı! \nLütfen 'YM Cetveli İndir' butonu ile aldığınız şablonu bozmadan doldurup yükleyin.\n(Gerekli sütunlar: ID, Kategori, Poz No, İmalat Tanımı, Birim, Birim Fiyat (TL), Miktar)");
         e.target.value = null;
         return;
      }

      if (staticSheetName) {
        const rawData = window.XLSX.utils.sheet_to_json(wb.Sheets[staticSheetName]);
        const mappedData = rawData.map(row => ({
          id: row["ID"] || Date.now() + Math.random(),
          category: row["Kategori"] || "Genel",
          pos: row["Poz No"],
          desc: row["İmalat Tanımı"],
          unit: row["Birim"],
          price: parseFloat(row["Birim Fiyat (TL)"]) || 0,
          quantity: parseFloat(row["Miktar"]) || 0
        }));
        setStaticItems(mappedData);
      }

      if (archSheetName) {
        const rawData = window.XLSX.utils.sheet_to_json(wb.Sheets[archSheetName]);
        const mappedData = rawData.map(row => ({
          id: row["ID"] || Date.now() + Math.random(),
          category: row["Kategori"] || "Genel",
          pos: row["Poz No"],
          desc: row["İmalat Tanımı"],
          unit: row["Birim"],
          price: parseFloat(row["Birim Fiyat (TL)"]) || 0,
          quantity: parseFloat(row["Miktar"]) || 0
        }));
        setArchitecturalItems(mappedData);
      }
      
      alert("Veriler Excel (.xlsx) dosyasından başarıyla yüklendi ve güncellendi!");
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleUpdateFromPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isPDFLoaded) {
      alert("PDF modülü henüz yüklenmedi. Lütfen bekleyin...");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
      }

      let updatedCount = 0;
      const newPricesMap = {}; 

      const regex = /(\d{2}\.\d{3}\.\d{4})\s+(.+?)\s+(m³|m²|m|Ton|kg|Adet|sa|km)\s+(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/gi;
      
      let match;
      while ((match = regex.exec(fullText)) !== null) {
        const posNo = match[1];
        const desc = match[2].trim();
        const unit = match[3];
        const priceStr = match[4];
        const price = parseFloat(priceStr.replace(/\./g, '').replace(',', '.'));
        
        if (posNo && !isNaN(price)) {
          newPricesMap[posNo] = { price, desc, unit };
        }
      }

      const updateList = (list) => list.map(item => {
        if (newPricesMap[item.pos]) {
           updatedCount++;
           return { 
             ...item, 
             price: newPricesMap[item.pos].price,
           };
        }
        return item;
      });

      setStaticItems(prev => updateList(prev));
      setArchitecturalItems(prev => updateList(prev));

      const newLibrary = { ...posLibrary };
      
      Object.keys(newLibrary).forEach(cat => {
        newLibrary[cat] = newLibrary[cat].map(item => {
           if (newPricesMap[item.pos]) {
             return { 
               ...item, 
               price: newPricesMap[item.pos].price,
               desc: newPricesMap[item.pos].desc || item.desc 
             };
           }
           return item;
        });
      });

      let newItemsCategory = "PDF'ten Eklenen Pozlar";
      if (!newLibrary[newItemsCategory]) newLibrary[newItemsCategory] = [];

      Object.keys(newPricesMap).forEach(pos => {
        let exists = false;
        Object.values(newLibrary).forEach(list => {
          if (list.find(i => i.pos === pos)) exists = true;
        });

        if (!exists) {
          newLibrary[newItemsCategory].push({
            pos: pos,
            desc: newPricesMap[pos].desc,
            unit: newPricesMap[pos].unit,
            price: newPricesMap[pos].price
          });
        }
      });

      setPosLibrary(newLibrary);

      alert(`İşlem Tamamlandı!\nPDF tarandı ve ${updatedCount} adet pozun fiyatı güncellendi.\n${Object.keys(newPricesMap).length} adet poz tarifleriyle birlikte hafızaya alındı.`);

    } catch (error) {
      console.error("PDF okuma hatası:", error);
      alert("PDF okunurken bir hata oluştu.");
    }
    
    e.target.value = null;
  };

  const handleUpdateQuantity = (id, newQuantity, type) => {
    if (type === 'static') {
      setStaticItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    } else {
      setArchitecturalItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    }
  };

  const handleBatchUpdateQuantities = (updatesMap) => {
    setArchitecturalItems(prev => prev.map(item => {
      if (updatesMap[item.pos] !== undefined) {
        return { ...item, quantity: updatesMap[item.pos] };
      }
      return item;
    }));
  };

  const handleOpenSelector = (item) => {
    setEditingItem(item);
    setIsAddingNew(false);
    setIsModalOpen(true);
  };

  const handleAddNewItem = (category) => {
    setTargetCategory(category);
    setIsAddingNew(true);
    setEditingItem(null); 
    setIsModalOpen(true);
  };

  const handleSelectPose = (newPoseData) => {
    if (isAddingNew) {
      const newItem = {
        id: Date.now(), 
        category: targetCategory,
        pos: newPoseData.pos,
        desc: newPoseData.desc,
        unit: newPoseData.unit,
        price: newPoseData.price,
        quantity: 0
      };

      if (activeTab === 'static') {
        setStaticItems(prev => [...prev, newItem]);
      } else {
        setArchitecturalItems(prev => [...prev, newItem]);
      }
    } 
    else if (editingItem) {
      const updateList = (items) => items.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            pos: newPoseData.pos,
            desc: newPoseData.desc,
            unit: newPoseData.unit,
            price: newPoseData.price,
            category: newPoseData.category || item.category 
          };
        }
        return item;
      });

      if (activeTab === 'static') {
        setStaticItems(prev => updateList(prev));
      } else {
        setArchitecturalItems(prev => updateList(prev));
      }
    }
    
    setIsModalOpen(false);
    setEditingItem(null);
    setIsAddingNew(false);
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const staticTotal = calculateTotal(staticItems);
  const architecturalTotal = calculateTotal(architecturalItems);
  const grandTotal = staticTotal + architecturalTotal;

  const handleSave = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    setLastSaved(timeString);

    const dataToSave = {
      staticItems,
      architecturalItems,
      doorItems,
      windowItems,
      projectInfo,
      lastSaved: timeString
    };
    
    try {
      localStorage.setItem('gkmetraj_data', JSON.stringify(dataToSave));
      alert("Proje başarıyla tarayıcı hafızasına kaydedildi!");
    } catch (e) {
      console.error("Kaydetme hatası", e);
      alert("Kayıt sırasında bir hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20 relative w-full">
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} />
      <ProjectInfoModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSave={handleSaveProjectInfo} initialData={projectInfo} />
      
      {/* Header */}
      <header className="bg-slate-900 shadow-xl sticky top-0 z-20 border-b border-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-900/50">
              <Hammer className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">GK<span className="text-orange-500">metraj</span></h1>
              <div className="text-xs text-slate-400 font-medium tracking-wide mt-1 flex items-center gap-2">
                {projectInfo.name ? (
                  <>
                    <span className="text-orange-400 font-bold">{projectInfo.name}</span>
                    {projectInfo.city && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">{projectInfo.city}</span>}
                    {projectInfo.area && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">{projectInfo.area} m²</span>}
                  </>
                ) : (
                  "İnşaat Metraj Modülü"
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
             {isLoggedIn && (
               <>
                 {/* Project Info Button */}
                 <button 
                  onClick={() => setIsProjectModalOpen(true)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border bg-slate-800 hover:bg-slate-700 text-blue-300 border-slate-700 hover:border-blue-500/50"
                  title="Proje Bilgileri Düzenle"
                 >
                   <Info className="w-4 h-4" /> <span className="hidden lg:inline">Proje Bilgisi</span>
                 </button>

                 <div className="h-8 w-px bg-slate-700 mx-1 hidden md:block"></div>

                 <div className="relative group hidden md:block">
                    <input type="file" ref={pdfInputRef} onChange={handleUpdateFromPDF} accept=".pdf" className="hidden" />
                    <button onClick={() => pdfInputRef.current.click()} disabled={!isPDFLoaded} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-900/20 active:scale-95">
                      <RefreshCw className={`w-3 h-3 ${isLoadingScripts ? 'animate-spin' : ''}`} /> <span className="hidden lg:inline">PDF Fiyat Güncelle</span>
                    </button>
                 </div>
                 <div className="h-8 w-px bg-slate-700 mx-2 hidden md:block"></div>
                 <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 hidden md:flex">
                    <button onClick={handleDownloadDescriptions} disabled={!isXLSXLoaded} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors" title="Poz Tarifleri"><BookOpen className="w-4 h-4" /></button>
                    <button onClick={handleExportToXLSX} disabled={!isXLSXLoaded} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-green-400 hover:bg-slate-700 hover:text-green-300 transition-colors" title="YM Cetveli İndir"><FileSpreadsheet className="w-4 h-4" /></button>
                    <div className="relative">
                        <input type="file" ref={fileInputRef} onChange={handleImportFromXLSX} accept=".xlsx, .xls" className="hidden" />
                        <button onClick={() => fileInputRef.current.click()} disabled={!isXLSXLoaded} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-blue-400 hover:bg-slate-700 hover:text-blue-300 transition-colors" title="Excel Yükle"><Upload className="w-4 h-4" /></button>
                    </div>
                </div>
                 <div className="h-8 w-px bg-slate-700 mx-2 hidden md:block"></div>
                 <button onClick={handleSave} className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-900/30 active:scale-95">
                  <Save className="w-4 h-4" /> <span>Kaydet</span>
                </button>
               </>
             )}

            <div className="w-4"></div>
            {/* Login/Logout Button */}
            {isLoggedIn ? (
              <button onClick={handleLogout} className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-600">
                <LogOut className="w-4 h-4" /> <span>Çıkış</span>
              </button>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-600 animate-pulse">
                <LogIn className="w-4 h-4" /> <span>Giriş Yap</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Blurred if not logged in */}
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-10 transition-all duration-500 ${!isLoggedIn ? 'blur-sm pointer-events-none select-none opacity-50 overflow-hidden h-screen' : ''}`}>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          <SummaryCard title="Statik İmalatlar" value={staticTotal} icon={Building} colorClass="text-orange-500" iconBgClass="bg-orange-50"/>
          <SummaryCard title="Mimari İmalatlar" value={architecturalTotal} icon={Ruler} colorClass="text-blue-500" iconBgClass="bg-blue-50"/>
          <SummaryCard title="GENEL TOPLAM MALİYET" value={grandTotal} icon={Calculator} colorClass="text-green-600" iconBgClass="bg-green-50"/>
        </div>

        <div className="flex flex-col space-y-0">
          <div className="flex items-end px-2 space-x-2 overflow-x-auto pb-1">
            <TabButton active={activeTab === 'static'} onClick={() => setActiveTab('static')} icon={Building} label="Statik Metraj" />
            <TabButton active={activeTab === 'architectural'} onClick={() => setActiveTab('architectural')} icon={Ruler} label="Mimari Metraj" />
            <TabButton active={activeTab === 'door_calculation'} onClick={() => setActiveTab('door_calculation')} icon={DoorOpen} label="Kapı Metrajı" />
             <TabButton active={activeTab === 'window_calculation'} onClick={() => setActiveTab('window_calculation')} icon={Maximize} label="Pencere Metrajı" />
          </div>

          <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-xl border border-slate-200 min-h-[500px] p-8 relative z-10 w-full">
            {activeTab === 'static' && (
              <>
                <GroupedTable data={staticItems} onUpdateQuantity={(id, val) => handleUpdateQuantity(id, val, 'static')} onOpenSelector={handleOpenSelector} onAddNewItem={handleAddNewItem} />
                <div className="mt-8 p-6 bg-slate-900 text-white rounded-xl shadow-lg flex justify-between items-center sticky bottom-4 z-20 border border-slate-700">
                  <span className="text-slate-400 text-sm font-medium flex items-center">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-2 animate-pulse"></div>
                    Statik genel toplamı gösterilmektedir.
                  </span>
                  <div className="text-right flex items-baseline">
                    <span className="text-slate-400 text-sm mr-4 font-bold uppercase tracking-wider">Sayfa Toplamı:</span>
                    <span className="text-3xl font-black text-white tracking-tight">{formatCurrency(staticTotal)}</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'architectural' && (
              <>
                <GroupedTable data={architecturalItems} onUpdateQuantity={(id, val) => handleUpdateQuantity(id, val, 'architectural')} onOpenSelector={handleOpenSelector} onAddNewItem={handleAddNewItem} />
                <div className="mt-8 p-6 bg-slate-900 text-white rounded-xl shadow-lg flex justify-between items-center sticky bottom-4 z-20 border border-slate-700">
                  <span className="text-slate-400 text-sm font-medium flex items-center">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-2 animate-pulse"></div>
                    Mimari genel toplamı gösterilmektedir.
                  </span>
                  <div className="text-right flex items-baseline">
                    <span className="text-slate-400 text-sm mr-4 font-bold uppercase tracking-wider">Sayfa Toplamı:</span>
                    <span className="text-3xl font-black text-white tracking-tight">{formatCurrency(architecturalTotal)}</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'door_calculation' && (
              <DoorCalculationArea items={doorItems} setItems={setDoorItems} onUpdateQuantities={handleBatchUpdateQuantities} />
            )}

             {activeTab === 'window_calculation' && (
              <WindowCalculationArea items={windowItems} setItems={setWindowItems} onUpdateQuantities={handleBatchUpdateQuantities} />
            )}
          </div>
        </div>
      </main>

      {!isLoggedIn && (
        <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/90 text-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md text-center pointer-events-auto border border-slate-700">
            <ShieldCheck className="w-16 h-16 text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sistem Kilitli</h2>
            <p className="text-slate-400 mb-6">Verilere erişmek ve işlem yapmak için lütfen yetkili girişi yapınız.</p>
            <button onClick={() => setIsLoginModalOpen(true)} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-900/50 w-full">
              Giriş Yap
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <PoseSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} category={isAddingNew ? targetCategory : (editingItem ? editingItem.category : "")} onSelect={handleSelectPose} currentPos={editingItem ? editingItem.pos : ""} isAddingNew={isAddingNew} posLibrary={posLibrary} />
      )}
    </div>
  );
}