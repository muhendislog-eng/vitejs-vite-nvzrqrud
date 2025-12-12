import React, { useState, useEffect, useRef } from 'react';
import { 
  Building, 
  Ruler, 
  DoorOpen, 
  Maximize, 
  Book, 
  LayoutDashboard, 
  ShieldCheck, 
  MapPin,
  RefreshCcw,
  Box,
  Grid,
  Calculator // Hesap makinesi ikonu eklendi
} from 'lucide-react';

// --- BİLEŞEN IMPORTLARI ---
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MetrajTable from './components/MetrajTable';
import GreenBook from './components/GreenBook';
import DoorCalculationArea from './components/DoorCalculationArea';
import WindowCalculationArea from './components/WindowCalculationArea';
import { LoginModal, ProjectInfoModal, PoseSelectorModal } from './components/Modals';

// --- VERİ VE YARDIMCI FONKSİYONLAR ---
import { 
  INITIAL_POS_LIBRARY, 
  INITIAL_LOCATIONS, 
  initialStaticData, 
  initialArchitecturalData 
} from './data/constants'; 

import { loadScript, formatCurrency } from './utils/helpers'; // formatCurrency'yi buradan çekiyoruz veya aşağıda tanımlıyoruz

// --- FIREBASE (Opsiyonel) ---
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// --- YEREL BİLEŞENLER ---
// Bu kart sadece App.tsx'te kullanıldığı için burada tanımladım.
const SummaryCard = ({ title, value, icon: Icon, colorClass, iconBgClass }: any) => (
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

export default function App() {
  // --- STATE TANIMLARI ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('static');
  
  // Veriler
  const [staticItems, setStaticItems] = useState(initialStaticData);
  const [architecturalItems, setArchitecturalItems] = useState(initialArchitecturalData);
  const [doorItems, setDoorItems] = useState<any[]>([]);
  const [windowItems, setWindowItems] = useState<any[]>([]);
  
  const [locations, setLocations] = useState(INITIAL_LOCATIONS); 
  const [projectInfo, setProjectInfo] = useState({ name: '', area: '', floors: '', city: '' });
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  const [posLibrary, setPosLibrary] = useState(INITIAL_POS_LIBRARY);
  const [isXLSXLoaded, setIsXLSXLoaded] = useState(false);
  const [isPDFLoaded, setIsPDFLoaded] = useState(false);
  const [isLoadingScripts, setIsLoadingScripts] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [targetCategory, setTargetCategory] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // --- HESAPLAMALAR (ÖZET KARTLARI İÇİN) ---
  const totalStaticCost = staticItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalArchCost = architecturalItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const grandTotalCost = totalStaticCost + totalArchCost;

  // --- BAŞLANGIÇ ETKİLERİ ---
  useEffect(() => {
    const loadLibraries = async () => {
      try {
        await loadScript("https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js");
        setIsXLSXLoaded(true);
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
        // @ts-ignore
        if (window.pdfjsLib) { 
          // @ts-ignore
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; 
          setIsPDFLoaded(true); 
        }
        setIsLoadingScripts(false);
      } catch (error) { 
        console.error("Kütüphane hatası:", error); 
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
      } catch (e) { console.error("Veri okuma hatası", e); }
    }
    
    const session = localStorage.getItem('gkmetraj_session');
    if (session === 'active') setIsLoggedIn(true);
  }, []);

  // --- HANDLER FONKSİYONLARI ---
  const handleLogin = () => { setIsLoggedIn(true); localStorage.setItem('gkmetraj_session', 'active'); };
  const handleLogout = () => { setIsLoggedIn(false); localStorage.removeItem('gkmetraj_session'); };

  const handleSave = () => {
    const dataToSave = { staticItems, architecturalItems, doorItems, windowItems, projectInfo, locations, lastSaved: new Date().toLocaleTimeString() };
    localStorage.setItem('gkmetraj_data', JSON.stringify(dataToSave));
    alert("Proje başarıyla kaydedildi!");
  };

  const handleUpdateQuantity = (id: number | string, quantity: number, type: 'static' | 'architectural') => {
    if (type === 'static') setStaticItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
    else setArchitecturalItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const handleUpdateLocation = (id: number | string, locationName: string, type: 'static' | 'architectural') => {
    if (type === 'static') setStaticItems(prev => prev.map(item => item.id === id ? { ...item, mahal: locationName } : item));
    else setArchitecturalItems(prev => prev.map(item => item.id === id ? { ...item, mahal: locationName } : item));
  };

  const handleBatchUpdateQuantities = (updates: any) => {
    const updateList = (list: any[]) => list.map(item => {
      if (updates[item.pos] !== undefined) {
        return { ...item, quantity: updates[item.pos] };
      }
      return item;
    });
    setStaticItems(prev => updateList(prev));
    setArchitecturalItems(prev => updateList(prev));
  };

  const handleOpenSelector = (item: any) => { setEditingItem(item); setIsAddingNew(false); setIsModalOpen(true); };
  const handleAddNewItem = (category: string) => { setTargetCategory(category); setIsAddingNew(true); setEditingItem(null); setIsModalOpen(true); };
  
  const handleSelectPose = (newPoseData: any) => {
    const newItem = {
      id: Date.now(),
      category: isAddingNew ? targetCategory : (editingItem ? editingItem.category : ""),
      pos: newPoseData.pos,
      desc: newPoseData.desc,
      unit: newPoseData.unit,
      price: newPoseData.price,
      quantity: 0,
      mahal: ""
    };

    if (isAddingNew) {
      if (activeTab === 'static') setStaticItems(prev => [...prev, newItem]);
      else setArchitecturalItems(prev => [...prev, newItem]);
    } else if (editingItem) {
      const updateList = (items: any[]) => items.map(item => item.id === editingItem.id ? { ...item, ...newItem, id: item.id, quantity: item.quantity, mahal: item.mahal } : item);
      if (activeTab === 'static') setStaticItems(prev => updateList(prev));
      else setArchitecturalItems(prev => updateList(prev));
    }
    setIsModalOpen(false);
  };

  const handleUpdateFromPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isPDFLoaded) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      // @ts-ignore
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // @ts-ignore
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      let updatedCount = 0;
      const newPricesMap: any = {};
      const regex = /(\d{2}\.\d{3}\.\d{4})\s+(.+?)\s+(m³|m²|m|Ton|kg|Adet|sa|km)\s+(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/gi;
      let match;
      while ((match = regex.exec(fullText)) !== null) {
        const price = parseFloat(match[4].replace(/\./g, '').replace(',', '.'));
        if (match[1] && !isNaN(price)) {
          newPricesMap[match[1]] = { price, desc: match[2].trim(), unit: match[3] };
        }
      }
      const updateList = (list: any[]) => list.map(item => {
        if (newPricesMap[item.pos]) {
           updatedCount++;
           return { ...item, price: newPricesMap[item.pos].price };
        }
        return item;
      });
      setStaticItems(prev => updateList(prev));
      setArchitecturalItems(prev => updateList(prev));
      alert(`PDF Tarandı: ${updatedCount} adet poz güncellendi.`);
    } catch (error) {
      console.error("PDF Hatası:", error);
      alert("PDF okunurken bir hata oluştu.");
    }
    e.target.value = "";
  };

  const handleImportFromXLSX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isXLSXLoaded) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      // @ts-ignore
      const wb = window.XLSX.read(evt.target?.result, { type: 'binary' });
      alert("Excel yükleme özelliği şu an demo modundadır.");
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleDownloadDescriptions = () => { if (!isXLSXLoaded) return; alert("Poz listesi indiriliyor..."); };
  const handleExportToXLSX = () => { if (!isXLSXLoaded) return; alert("Metraj cetveli indiriliyor..."); };

  const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button onClick={onClick} className={`flex items-center px-6 py-3 md:px-8 md:py-4 font-bold text-sm transition-all duration-300 rounded-t-xl relative overflow-hidden group whitespace-nowrap ${active ? 'bg-white text-orange-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border-t-4 border-orange-500' : 'bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-800 border-t-4 border-transparent'}`}>
      <Icon className={`w-5 h-5 mr-2 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20 relative w-full overflow-x-hidden">
      {/* Modallar */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} />
      <ProjectInfoModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSave={setProjectInfo} initialData={projectInfo} />
      
      {isModalOpen && (
        <PoseSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} category={isAddingNew ? targetCategory : (editingItem ? editingItem.category : "")} onSelect={handleSelectPose} currentPos={editingItem ? editingItem.pos : ""} isAddingNew={isAddingNew} posLibrary={posLibrary} />
      )}

      {/* Header */}
      <Header 
        isLoggedIn={isLoggedIn}
        projectInfo={projectInfo}
        isPDFLoaded={isPDFLoaded}
        isXLSXLoaded={isXLSXLoaded}
        isLoadingScripts={isLoadingScripts}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogoutClick={handleLogout}
        onSave={handleSave}
        onDownloadDescriptions={handleDownloadDescriptions}
        onExportToXLSX={handleExportToXLSX}
        onImportExcel={handleImportFromXLSX}
        onUpdatePDF={handleUpdateFromPDF}
      />

      {/* Ana İçerik */}
      <main className={`w-full px-4 py-6 transition-all duration-500 ${!isLoggedIn ? 'blur-sm pointer-events-none select-none opacity-50 overflow-hidden h-screen' : ''}`}>
        
        {/* --- ÖZET KARTLARI (Header Altına Eklendi) --- */}
        <div className="w-full mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <SummaryCard 
                    title="Statik İmalatlar" 
                    value={totalStaticCost} 
                    icon={Building} 
                    colorClass="text-orange-500" 
                    iconBgClass="bg-orange-50"
                />
                <SummaryCard 
                    title="Mimari İmalatlar" 
                    value={totalArchCost} 
                    icon={Ruler} 
                    colorClass="text-blue-500" 
                    iconBgClass="bg-blue-50"
                />
                <SummaryCard 
                    title="GENEL TOPLAM MALİYET" 
                    value={grandTotalCost} 
                    icon={Calculator} 
                    colorClass="text-green-600" 
                    iconBgClass="bg-green-50"
                />
            </div>
        </div>

        {/* Sekme Butonları */}
        <div className="flex flex-col space-y-0 w-full">
          <div className="flex items-end px-2 space-x-2 overflow-x-auto pb-1 w-full no-scrollbar">
             <TabButton active={activeTab === 'static'} onClick={() => setActiveTab('static')} icon={Building} label="Statik Metraj" />
             <TabButton active={activeTab === 'architectural'} onClick={() => setActiveTab('architectural')} icon={Ruler} label="Mimari Metraj" />
             <TabButton active={activeTab === 'door_calculation'} onClick={() => setActiveTab('door_calculation')} icon={DoorOpen} label="Kapı Metrajı" />
             <TabButton active={activeTab === 'window_calculation'} onClick={() => setActiveTab('window_calculation')} icon={Maximize} label="Pencere Metrajı" />
             <TabButton active={activeTab === 'green_book'} onClick={() => setActiveTab('green_book')} icon={Book} label="Yeşil Defter" />
             <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Proje Özeti" />
          </div>

          {/* Sekme İçerikleri (w-full ile tam ekran) */}
          <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-xl border border-slate-200 min-h-[500px] p-8 relative z-10 w-full">
            
            {activeTab === 'static' && (
              <MetrajTable 
                data={staticItems} 
                onUpdateQuantity={(id, val) => handleUpdateQuantity(id, val, 'static')} 
                onOpenSelector={handleOpenSelector} 
                onAddNewItem={handleAddNewItem} 
                locations={locations}
                onUpdateLocation={(id, loc) => handleUpdateLocation(id, loc, 'static')}
              />
            )}

            {activeTab === 'architectural' && (
              <MetrajTable 
                data={architecturalItems} 
                onUpdateQuantity={(id, val) => handleUpdateQuantity(id, val, 'architectural')} 
                onOpenSelector={handleOpenSelector} 
                onAddNewItem={handleAddNewItem} 
                locations={locations}
                onUpdateLocation={(id, loc) => handleUpdateLocation(id, loc, 'architectural')}
              />
            )}

            {activeTab === 'door_calculation' && (
              <DoorCalculationArea items={doorItems} setItems={setDoorItems} onUpdateQuantities={handleBatchUpdateQuantities} locations={locations} />
            )}

             {activeTab === 'window_calculation' && (
              <WindowCalculationArea items={windowItems} setItems={setWindowItems} onUpdateQuantities={handleBatchUpdateQuantities} locations={locations} />
            )}

             {activeTab === 'green_book' && (
              <GreenBook 
                  staticItems={staticItems} 
                  architecturalItems={architecturalItems} 
                  doorItems={doorItems} 
                  windowItems={windowItems} 
              />
            )}
             {activeTab === 'dashboard' && (
              <Dashboard 
                  staticItems={staticItems} 
                  architecturalItems={architecturalItems} 
              />
            )}
          </div>
        </div>
      </main>

      {/* Kilit Ekranı */}
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
    </div>
  );
}