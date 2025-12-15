import React, { useState, useEffect, useRef } from 'react';
import {
  Building,
  Ruler,
  DoorOpen,
  Maximize,
  Book,
  LayoutDashboard,
  ShieldCheck,
  Calculator,
  Zap,
  Wrench,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- BİLEŞEN IMPORTLARI ---
import Header from './components/Header';
import ProjectResults from './components/ProjectResults';
import MetrajTable from './components/MetrajTable';
import GreenBook from './components/GreenBook';
import DoorCalculationArea from './components/DoorCalculationArea';
import WindowCalculationArea from './components/WindowCalculationArea';
import Footer from './components/Footer';
import { LoginModal, ProjectInfoModal, PoseSelectorModal } from './components/Modals';

// --- VERİ VE YARDIMCI FONKSİYONLAR ---
import {
  INITIAL_POS_LIBRARY,
  INITIAL_LOCATIONS,
  initialStaticData,
  initialArchitecturalData,
  initialMechanicalData,
  initialElectricalData,
} from './data/constants';

import { loadScript, formatCurrency } from './utils/helpers';

// --- YEREL BİLEŞENLER ---
const SummaryCard = ({ title, value, icon: Icon, colorClass, iconBgClass }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group w-full">
    <div
      className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 ${colorClass}`}
    >
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

type ActiveTab =
  | 'static'
  | 'architectural'
  | 'mechanical'
  | 'electrical'
  | 'door_calculation'
  | 'window_calculation'
  | 'green_book'
  | 'project_results';

type MetrajItem = {
  id: number | string;
  pos: string;
  desc: string;
  unit: string;
  price: number;
  quantity: number;
  category?: string;

  // ✅ Manuel poz alanı (edit/sil için şart)
  isManual?: boolean;

  // opsiyonel
  locationId?: string | number | null;
  [key: string]: any;
};

export default function App() {
  // --- STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('static');

  // Veriler
  const [staticItems, setStaticItems] = useState<MetrajItem[]>(initialStaticData as any);
  const [architecturalItems, setArchitecturalItems] = useState<MetrajItem[]>(initialArchitecturalData as any);
  const [mechanicalItems, setMechanicalItems] = useState<MetrajItem[]>(initialMechanicalData as any);
  const [electricalItems, setElectricalItems] = useState<MetrajItem[]>(initialElectricalData as any);
  const [doorItems, setDoorItems] = useState<any[]>([]);
  const [windowItems, setWindowItems] = useState<any[]>([]);

  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [projectInfo, setProjectInfo] = useState({ name: '', area: '', floors: '', city: '' });

  const [posLibrary, setPosLibrary] = useState(INITIAL_POS_LIBRARY);
  const [isXLSXLoaded, setIsXLSXLoaded] = useState(false);
  const [isPDFLoaded, setIsPDFLoaded] = useState(false);
  const [isLoadingScripts, setIsLoadingScripts] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MetrajItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [targetCategory, setTargetCategory] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // --- ÖZET HESAPLAR ---
  const totalStaticCost = staticItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalArchCost = architecturalItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalMechCost = mechanicalItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalElecCost = electricalItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const grandTotalCost = totalStaticCost + totalArchCost + totalMechCost + totalElecCost;

  // --- BAŞLANGIÇ ---
  useEffect(() => {
    const loadLibraries = async () => {
      try {
        await loadScript('https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js');
        setIsXLSXLoaded(true);

        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        // @ts-ignore
        if (window.pdfjsLib) {
          // @ts-ignore
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          setIsPDFLoaded(true);
        }

        setIsLoadingScripts(false);
      } catch (error) {
        console.error('Kütüphane hatası:', error);
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
        if (parsed.mechanicalItems) setMechanicalItems(parsed.mechanicalItems);
        if (parsed.electricalItems) setElectricalItems(parsed.electricalItems);
        if (parsed.doorItems) setDoorItems(parsed.doorItems);
        if (parsed.windowItems) setWindowItems(parsed.windowItems);
        if (parsed.projectInfo) setProjectInfo(parsed.projectInfo);
        if (parsed.locations) setLocations(parsed.locations);
      } catch (e) {
        console.error('Veri okuma hatası', e);
      }
    }

    const session = localStorage.getItem('gkmetraj_session');
    if (session === 'active') setIsLoggedIn(true);
  }, []);

  // --- AUTH ---
  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('gkmetraj_session', 'active');
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('gkmetraj_session');
  };

  // --- SAVE ---
  const handleSave = () => {
    const dataToSave = {
      staticItems,
      architecturalItems,
      mechanicalItems,
      electricalItems,
      doorItems,
      windowItems,
      projectInfo,
      locations,
      lastSaved: new Date().toLocaleTimeString(),
    };
    localStorage.setItem('gkmetraj_data', JSON.stringify(dataToSave));
    alert('Proje başarıyla kaydedildi!');
  };

  // --- QUANTITY ---
  const handleUpdateQuantity = (id: number | string, quantity: number, type: 'static' | 'architectural' | 'mechanical' | 'electrical') => {
    if (type === 'static') setStaticItems(prev => prev.map(item => (item.id === id ? { ...item, quantity } : item)));
    else if (type === 'architectural') setArchitecturalItems(prev => prev.map(item => (item.id === id ? { ...item, quantity } : item)));
    else if (type === 'mechanical') setMechanicalItems(prev => prev.map(item => (item.id === id ? { ...item, quantity } : item)));
    else setElectricalItems(prev => prev.map(item => (item.id === id ? { ...item, quantity } : item)));
  };

  const handleBatchUpdateQuantities = (updates: any) => {
    const updateList = (list: any[]) =>
      list.map(item => {
        if (updates[item.pos] !== undefined) return { ...item, quantity: updates[item.pos] };
        return item;
      });

    setStaticItems(prev => updateList(prev));
    setArchitecturalItems(prev => updateList(prev));
    setMechanicalItems(prev => updateList(prev));
    setElectricalItems(prev => updateList(prev));
  };

  // ✅ BURAYA EKLE: Manuel poz düzenleme patch handler’ı
  const handleUpdateManualItem = (id: number | string, patch: any) => {
    const merge = (list: any[]) =>
      list.map((it) =>
        it.id === id ? { ...it, ...patch } : it
      );

    if (activeTab === 'static') setStaticItems((prev) => merge(prev));
    else if (activeTab === 'architectural') setArchitecturalItems((prev) => merge(prev));
    else if (activeTab === 'mechanical') setMechanicalItems((prev) => merge(prev));
    else if (activeTab === 'electrical') setElectricalItems((prev) => merge(prev));
  };

  const handleDeleteManualItem = (id: number | string) => {
    const remove = (list: any[]) => list.filter((it) => it.id !== id);

    if (activeTab === 'static') setStaticItems((prev) => remove(prev));
    else if (activeTab === 'architectural') setArchitecturalItems((prev) => remove(prev));
    else if (activeTab === 'mechanical') setMechanicalItems((prev) => remove(prev));
    else if (activeTab === 'electrical') setElectricalItems((prev) => remove(prev));
  };


  // --- LOCATION (SENDE YOKTU -> ÇALIŞAN STUB) ---
  // Eğer lokasyon seçimi gerçekten kullanılıyorsa, burada istediğin modele göre güncellersin.
  const handleUpdateLocation = (id: number | string, locId: any, type: 'static' | 'architectural' | 'mechanical' | 'electrical') => {
    const patch = (list: MetrajItem[]) => list.map(it => (it.id === id ? { ...it, locationId: locId } : it));
    if (type === 'static') setStaticItems(prev => patch(prev));
    else if (type === 'architectural') setArchitecturalItems(prev => patch(prev));
    else if (type === 'mechanical') setMechanicalItems(prev => patch(prev));
    else setElectricalItems(prev => patch(prev));
  };

  // --- POZ SELECTOR ---
  const handleOpenSelector = (item: MetrajItem) => {
    setEditingItem(item);
    setIsAddingNew(false);
    setIsModalOpen(true);
  };

  const handleAddNewItem = (category: string) => {
    setTargetCategory(category);
    setIsAddingNew(true);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // ✅ Poz seçildi: ekle / değiştir
  const handleSelectPose = (newPoseData: any) => {
    const base: MetrajItem = {
      id: isAddingNew ? Date.now() : (editingItem?.id ?? Date.now()),
      category: isAddingNew ? targetCategory : (editingItem?.category ?? ''),
      pos: newPoseData.pos,
      desc: newPoseData.desc,
      unit: newPoseData.unit,
      price: newPoseData.price,
      quantity: isAddingNew ? 0 : (editingItem?.quantity ?? 0),

      // ✅ Manuel ekleme için flag
      isManual: Boolean(newPoseData?.isManual === true),
    };

    if (isAddingNew && newPoseData?.source === 'manual') {
      base.isManual = true;
    }

    if (isAddingNew) {
      if (activeTab === 'static') setStaticItems(prev => [...prev, base]);
      else if (activeTab === 'architectural') setArchitecturalItems(prev => [...prev, base]);
      else if (activeTab === 'mechanical') setMechanicalItems(prev => [...prev, base]);
      else if (activeTab === 'electrical') setElectricalItems(prev => [...prev, base]);
    } else if (editingItem) {
      const updateList = (items: MetrajItem[]) =>
        items.map(item => (item.id === editingItem.id ? { ...item, ...base, id: item.id } : item));

      if (activeTab === 'static') setStaticItems(prev => updateList(prev));
      else if (activeTab === 'architectural') setArchitecturalItems(prev => updateList(prev));
      else if (activeTab === 'mechanical') setMechanicalItems(prev => updateList(prev));
      else if (activeTab === 'electrical') setElectricalItems(prev => updateList(prev));
    }

    setIsModalOpen(false);
  };


  // --- PDF ---
  const handleUpdateFromPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isPDFLoaded) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      // @ts-ignore
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // @ts-ignore
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      let updatedCount = 0;
      const newPricesMap: any = {};
      const regex =
        /(\d{2}\.\d{3}\.\d{4})\s+(.+?)\s+(m³|m²|m|Ton|kg|Adet|sa|km)\s+(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/gi;

      let match;
      while ((match = regex.exec(fullText)) !== null) {
        const price = parseFloat(match[4].replace(/\./g, '').replace(',', '.'));
        if (match[1] && !isNaN(price)) {
          newPricesMap[match[1]] = { price, desc: match[2].trim(), unit: match[3] };
        }
      }

      const updateList = (list: MetrajItem[]) =>
        list.map(item => {
          // DB pozlarını güncelle; manuel pozların fiyatını otomatik değiştirmeyelim
          if (newPricesMap[item.pos] && !item.isManual) {
            updatedCount++;
            return { ...item, price: newPricesMap[item.pos].price };
          }
          return item;
        });

      setStaticItems(prev => updateList(prev));
      setArchitecturalItems(prev => updateList(prev));
      setMechanicalItems(prev => updateList(prev));
      setElectricalItems(prev => updateList(prev));
      alert(`PDF Tarandı: ${updatedCount} adet poz güncellendi.`);
    } catch (error) {
      console.error('PDF Hatası:', error);
      alert('PDF okunurken bir hata oluştu.');
    }

    e.target.value = '';
  };

  // --- XLSX ---
  const handleImportFromXLSX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isXLSXLoaded) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      // @ts-ignore
      const wb = window.XLSX.read(evt.target?.result, { type: 'binary' });
      alert('Excel yükleme özelliği şu an demo modundadır.');
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // ✅ POZ LİSTESİ İNDİR (Tüm Kategoriler)
  const handleDownloadDescriptions = () => {
    if (!isXLSXLoaded) return;

    // Tüm pozları topla
    const allItems = [
      ...staticItems.map(i => ({ category: 'Statik', ...i })),
      ...architecturalItems.map(i => ({ category: 'Mimari', ...i })),
      ...mechanicalItems.map(i => ({ category: 'Mekanik', ...i })),
      ...electricalItems.map(i => ({ category: 'Elektrik', ...i })),
    ];

    const data = allItems.map(item => ({
      'Kategori': item.category,
      'Poz No': item.pos,
      'Tanım': item.desc,
      'Birim': item.unit,
      'Birim Fiyat': item.price
    }));

    // @ts-ignore
    const ws = window.XLSX.utils.json_to_sheet(data);
    // @ts-ignore
    const wb = window.XLSX.utils.book_new();
    // @ts-ignore
    window.XLSX.utils.book_append_sheet(wb, ws, 'Poz Listesi');

    // @ts-ignore
    window.XLSX.writeFile(wb, `Poz_Listesi_${new Date().toLocaleDateString()}.xlsx`);
  };

  // ✅ METRAJ CETVELİ İNDİR (YM Cetveli)
  const handleExportToXLSX = () => {
    if (!isXLSXLoaded) return;

    // @ts-ignore
    const wb = window.XLSX.utils.book_new();

    const createSheet = (name: string, items: MetrajItem[]) => {
      if (items.length === 0) return;
      const data = items.map(item => ({
        'Poz No': item.pos,
        'Tanım': item.desc,
        'Birim': item.unit,
        'Birim Fiyat': item.price,
        'Miktar': item.quantity,
        'Tutar': item.price * item.quantity,
        'Kategori': item.category || 'Genel'
      }));
      // @ts-ignore
      const ws = window.XLSX.utils.json_to_sheet(data);
      // @ts-ignore
      window.XLSX.utils.book_append_sheet(wb, ws, name);
    };

    createSheet('Statik', staticItems);
    createSheet('Mimari', architecturalItems);
    createSheet('Mekanik', mechanicalItems);
    createSheet('Elektrik', electricalItems);

    // @ts-ignore
    window.XLSX.writeFile(wb, `Metraj_Cetveli_${new Date().toLocaleDateString()}.xlsx`);
  };

  // --- TAB BUTTON COMPONENT (PREMIUM) ---
  const TabButton = ({ active, onClick, icon: Icon, label, id }: any) => (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 z-10 ${active
        ? 'text-slate-900'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
        }`}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/60"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${active ? 'text-orange-500' : 'text-slate-400'}`} />
        {label}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20 relative w-full overflow-x-hidden selection:bg-orange-500 selection:text-white">
      <style>
        {`
          @media print {
            footer {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}
      </style>
      {/* Modallar */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
      <ProjectInfoModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={setProjectInfo}
        initialData={projectInfo}
      />

      {isModalOpen && (
        <PoseSelectorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          category={isAddingNew ? targetCategory : (editingItem ? editingItem.category : '')}
          onSelect={handleSelectPose}
          currentPos={editingItem ? editingItem.pos : ''}
          isAddingNew={isAddingNew}
          posLibrary={posLibrary}
        />
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
      <main
        className={`w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500 ${!isLoggedIn ? 'blur-sm pointer-events-none select-none opacity-50 overflow-hidden h-screen' : ''
          }`}
      >

        {/* Sekmeler Container */}
        <div className="w-full mb-8">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/60 w-fit mx-auto sm:mx-0 overflow-x-auto no-scrollbar max-w-full">
            <TabButton id="static" active={activeTab === 'static'} onClick={() => setActiveTab('static')} icon={Building} label="Statik" />
            <TabButton id="architectural" active={activeTab === 'architectural'} onClick={() => setActiveTab('architectural')} icon={Ruler} label="Mimari" />
            <TabButton id="mechanical" active={activeTab === 'mechanical'} onClick={() => setActiveTab('mechanical')} icon={Wrench} label="Mekanik" />
            <TabButton id="electrical" active={activeTab === 'electrical'} onClick={() => setActiveTab('electrical')} icon={Zap} label="Elektrik" />

            <div className="w-px h-6 bg-slate-300 mx-1 hidden sm:block"></div>

            <TabButton id="door" active={activeTab === 'door_calculation'} onClick={() => setActiveTab('door_calculation')} icon={DoorOpen} label="Kapı" />
            <TabButton id="window" active={activeTab === 'window_calculation'} onClick={() => setActiveTab('window_calculation')} icon={Maximize} label="Pencere" />

            <div className="w-px h-6 bg-slate-300 mx-1 hidden sm:block"></div>

            <TabButton id="greenbook" active={activeTab === 'green_book'} onClick={() => setActiveTab('green_book')} icon={Book} label="Yeşil Defter" />
            <TabButton id="results" active={activeTab === 'project_results'} onClick={() => setActiveTab('project_results')} icon={LayoutDashboard} label="Sonuçlar" />
          </div>
        </div>

        {/* --- İÇERİK ALANI --- */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-slate-200/20 border border-white/40 p-1">
          <div className="bg-white/50 rounded-[2.3rem] p-6 sm:p-8 min-h-[500px]">
            {activeTab === 'static' && (
              <MetrajTable
                data={staticItems}
                onUpdateQuantity={(id: any, val: any) => handleUpdateQuantity(id, val, 'static')}
                onOpenSelector={handleOpenSelector}
                onAddNewItem={handleAddNewItem}
                locations={locations}
                onUpdateLocation={(id: any, loc: any) => handleUpdateLocation(id, loc, 'static')}
                onUpdateManualItem={handleUpdateManualItem}
                onDeleteManualItem={handleDeleteManualItem}
              />
            )}

            {activeTab === 'architectural' && (
              <MetrajTable
                data={architecturalItems}
                onUpdateQuantity={(id: any, val: any) => handleUpdateQuantity(id, val, 'architectural')}
                onOpenSelector={handleOpenSelector}
                onAddNewItem={handleAddNewItem}
                locations={locations}
                onUpdateLocation={(id: any, loc: any) => handleUpdateLocation(id, loc, 'architectural')}
                onUpdateManualItem={handleUpdateManualItem}
                onDeleteManualItem={handleDeleteManualItem}
              />
            )}

            {activeTab === 'mechanical' && (
              <MetrajTable
                data={mechanicalItems}
                onUpdateQuantity={(id: any, val: any) => handleUpdateQuantity(id, val, 'mechanical')}
                onOpenSelector={handleOpenSelector}
                onAddNewItem={handleAddNewItem}
                locations={locations}
                onUpdateLocation={(id: any, loc: any) => handleUpdateLocation(id, loc, 'mechanical')}
                onUpdateManualItem={handleUpdateManualItem}
                onDeleteManualItem={handleDeleteManualItem}
              />
            )}

            {activeTab === 'electrical' && (
              <MetrajTable
                data={electricalItems}
                onUpdateQuantity={(id: any, val: any) => handleUpdateQuantity(id, val, 'electrical')}
                onOpenSelector={handleOpenSelector}
                onAddNewItem={handleAddNewItem}
                locations={locations}
                onUpdateLocation={(id: any, loc: any) => handleUpdateLocation(id, loc, 'electrical')}
                onUpdateManualItem={handleUpdateManualItem}
                onDeleteManualItem={handleDeleteManualItem}
              />
            )}

            {activeTab === 'door_calculation' && (
              <DoorCalculationArea
                items={doorItems}
                setItems={setDoorItems}
                onUpdateQuantities={handleBatchUpdateQuantities}
              />
            )}

            {activeTab === 'window_calculation' && (
              <WindowCalculationArea
                items={windowItems}
                setItems={setWindowItems}
                onUpdateQuantities={handleBatchUpdateQuantities}
              />
            )}

            {activeTab === 'green_book' && (
              <GreenBook
                staticItems={staticItems}
                architecturalItems={architecturalItems}
                mechanicalItems={mechanicalItems}
                electricalItems={electricalItems}
                doorItems={doorItems}
                windowItems={windowItems}
              />
            )}

            {activeTab === 'project_results' && (
              <ProjectResults
                staticItems={staticItems}
                architecturalItems={architecturalItems}
                mechanicalItems={mechanicalItems}
                electricalItems={electricalItems}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Kilit Ekranı */}
      {!isLoggedIn && (
        <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/90 text-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md text-center pointer-events-auto border border-slate-700">
            <ShieldCheck className="w-16 h-16 text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sistem Kilitli</h2>
            <p className="text-slate-400 mb-6">
              Verilere erişmek ve işlem yapmak için lütfen yetkili girişi yapınız.
            </p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-900/50 w-full"
            >
              Giriş Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
