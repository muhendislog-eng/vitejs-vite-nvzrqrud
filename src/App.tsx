import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Building,
  Ruler,
  DoorOpen,
  Maximize,
  Book,
  LayoutDashboard,
  ShieldCheck,
  Calculator,
  FileText,
  Printer,
  Wallet,
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
  initialArchitecturalData,
} from './data/constants';

import { loadScript, formatCurrency } from './utils/helpers';

// ============================
// INLINE PROJECT REPORT (HATASIZ)
// ============================
type AnyItem = { id?: any; pos?: string; desc?: string; unit?: string; price?: number; quantity?: number; [k: string]: any };

function ProjectReportInline({
  projectInfo,
  staticItems,
  architecturalItems,
  doorItems,
  windowItems,
}: {
  projectInfo: { name?: string; area?: string; floors?: string; city?: string };
  staticItems: AnyItem[];
  architecturalItems: AnyItem[];
  doorItems: AnyItem[];
  windowItems: AnyItem[];
}) {
  const totals = useMemo(() => {
    const sumList = (list: AnyItem[]) =>
      list.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0);

    const staticTotal = sumList(staticItems);
    const archTotal = sumList(architecturalItems);

    return {
      staticTotal,
      archTotal,
      grandTotal: staticTotal + archTotal,
      staticCount: staticItems.length,
      archCount: architecturalItems.length,
      doorCount: doorItems.length,
      windowCount: windowItems.length,
    };
  }, [staticItems, architecturalItems, doorItems, windowItems]);

  const handlePrint = () => window.print();

  return (
    <div className="w-full">
      {/* PRINT: sadece #print-area yazdır */}
      <style>
        {`
          @media print {
            @page { margin: 12mm; }
            body * { visibility: hidden !important; }
            #print-area, #print-area * { visibility: visible !important; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; }
            .print-hidden { display: none !important; }
            .print-card { break-inside: avoid; page-break-inside: avoid; }
          }
        `}
      </style>

      {/* EKRAN ÜST BAR */}
      <div className="print-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-slate-100 rounded-xl">
              <FileText className="w-5 h-5 text-slate-700" />
            </span>
            Proje Raporu
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Yazdırma çıktısı rapor alanından başlar (tüm uygulamayı basmaz).
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 active:scale-95 font-bold text-sm w-full md:w-auto"
        >
          <Printer className="w-4 h-4 mr-2" />
          Rapor Al
        </button>
      </div>

      {/* ===== PRINT AREA ===== */}
      <div id="print-area" className="space-y-6">
        {/* Proje Bilgisi */}
        <div className="print-card bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proje Bilgileri</div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-500 text-xs font-bold">Proje Adı</div>
                  <div className="font-semibold text-slate-800">{projectInfo?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-bold">Şehir</div>
                  <div className="font-semibold text-slate-800">{projectInfo?.city || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-bold">Kat</div>
                  <div className="font-semibold text-slate-800">{projectInfo?.floors || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-bold">Alan</div>
                  <div className="font-semibold text-slate-800">{projectInfo?.area || '-'}</div>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <Wallet className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="print-card bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statik Toplam</div>
            <div className="text-2xl font-black text-slate-800 mt-2">{formatCurrency(totals.staticTotal)}</div>
            <div className="text-xs text-slate-500 mt-1">{totals.staticCount} kalem</div>
          </div>
          <div className="print-card bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mimari Toplam</div>
            <div className="text-2xl font-black text-slate-800 mt-2">{formatCurrency(totals.archTotal)}</div>
            <div className="text-xs text-slate-500 mt-1">{totals.archCount} kalem</div>
          </div>
          <div className="print-card bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kapı Metrajı</div>
            <div className="text-2xl font-black text-slate-800 mt-2">{totals.doorCount}</div>
            <div className="text-xs text-slate-500 mt-1">satır</div>
          </div>
          <div className="print-card bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pencere Metrajı</div>
            <div className="text-2xl font-black text-slate-800 mt-2">{totals.windowCount}</div>
            <div className="text-xs text-slate-500 mt-1">satır</div>
          </div>
        </div>

        {/* Genel Toplam */}
        <div className="print-card bg-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Wallet className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">Genel Toplam</div>
              <div className="text-sm text-slate-300/80">Statik + Mimari toplamı</div>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight">
            {formatCurrency(totals.grandTotal)}
          </div>
        </div>

        {/* Basit Liste Özeti */}
        <div className="print-card bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-black text-slate-800 mb-4">Metraj Özeti (İlk 15 Kalem)</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold">
                <tr>
                  <th className="px-4 py-2 text-left">Kategori</th>
                  <th className="px-4 py-2 text-left">Poz</th>
                  <th className="px-4 py-2 text-left">Açıklama</th>
                  <th className="px-4 py-2 text-left">Birim</th>
                  <th className="px-4 py-2 text-right">Miktar</th>
                  <th className="px-4 py-2 text-right">Birim Fiyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...staticItems.slice(0, 8).map((x) => ({ ...x, _cat: 'Statik' })), ...architecturalItems.slice(0, 7).map((x) => ({ ...x, _cat: 'Mimari' }))]
                  .slice(0, 15)
                  .map((it, idx) => (
                    <tr key={`${it.pos || it.id || idx}-${idx}`}>
                      <td className="px-4 py-2 font-bold text-slate-600">{it._cat}</td>
                      <td className="px-4 py-2 font-mono text-slate-700">{it.pos || '-'}</td>
                      <td className="px-4 py-2 text-slate-700">{it.desc || '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{it.unit || '-'}</td>
                      <td className="px-4 py-2 text-right font-semibold">{Number(it.quantity) || 0}</td>
                      <td className="px-4 py-2 text-right font-semibold">{formatCurrency(Number(it.price) || 0)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-400 mt-3">
            Not: Bu bölüm rapor örneği için kısaltılmıştır (ilk kalemler).
          </p>
        </div>
      </div>
      {/* ===== PRINT AREA END ===== */}
    </div>
  );
}

// ============================
// APP
// ============================
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'static' | 'architectural' | 'door_calculation' | 'window_calculation' | 'green_book' | 'dashboard' | 'project_report'>('static');

  const [staticItems, setStaticItems] = useState<any[]>(initialStaticData);
  const [architecturalItems, setArchitecturalItems] = useState<any[]>(initialArchitecturalData);
  const [doorItems, setDoorItems] = useState<any[]>([]);
  const [windowItems, setWindowItems] = useState<any[]>([]);

  const [locations, setLocations] = useState<any[]>(INITIAL_LOCATIONS);
  const [projectInfo, setProjectInfo] = useState({ name: '', area: '', floors: '', city: '' });

  const [posLibrary, setPosLibrary] = useState<any[]>(INITIAL_POS_LIBRARY);
  const [isXLSXLoaded, setIsXLSXLoaded] = useState(false);
  const [isPDFLoaded, setIsPDFLoaded] = useState(false);
  const [isLoadingScripts, setIsLoadingScripts] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [targetCategory, setTargetCategory] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const totalStaticCost = staticItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalArchCost = architecturalItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const grandTotalCost = totalStaticCost + totalArchCost;

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

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('gkmetraj_session', 'active');
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('gkmetraj_session');
  };

  const handleSave = () => {
    const dataToSave = {
      staticItems,
      architecturalItems,
      doorItems,
      windowItems,
      projectInfo,
      locations,
      lastSaved: new Date().toLocaleTimeString(),
    };
    localStorage.setItem('gkmetraj_data', JSON.stringify(dataToSave));
    alert('Proje başarıyla kaydedildi!');
  };

  const handleUpdateQuantity = (id: number | string, quantity: number, type: 'static' | 'architectural') => {
    if (type === 'static') setStaticItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
    else setArchitecturalItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  // ✅ Eksik fonksiyon (yoksa compile error veriyor)
  const handleUpdateLocation = (id: number | string, loc: string, type: 'static' | 'architectural') => {
    if (type === 'static') {
      setStaticItems((prev) => prev.map((item) => (item.id === id ? { ...item, location: loc } : item)));
    } else {
      setArchitecturalItems((prev) => prev.map((item) => (item.id === id ? { ...item, location: loc } : item)));
    }
  };

  const handleBatchUpdateQuantities = (updates: any) => {
    const updateList = (list: any[]) =>
      list.map((item) => {
        if (updates[item.pos] !== undefined) return { ...item, quantity: updates[item.pos] };
        return item;
      });
    setStaticItems((prev) => updateList(prev));
    setArchitecturalItems((prev) => updateList(prev));
  };

  const handleOpenSelector = (item: any) => {
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

  const handleSelectPose = (newPoseData: any) => {
    const newItem = {
      id: Date.now(),
      category: isAddingNew ? targetCategory : editingItem ? editingItem.category : '',
      pos: newPoseData.pos,
      desc: newPoseData.desc,
      unit: newPoseData.unit,
      price: newPoseData.price,
      quantity: 0,
    };

    if (isAddingNew) {
      if (activeTab === 'static') setStaticItems((prev) => [...prev, newItem]);
      else setArchitecturalItems((prev) => [...prev, newItem]);
    } else if (editingItem) {
      const updateList = (items: any[]) =>
        items.map((item) =>
          item.id === editingItem.id ? { ...item, ...newItem, id: item.id, quantity: item.quantity } : item
        );

      if (activeTab === 'static') setStaticItems((prev) => updateList(prev));
      else setArchitecturalItems((prev) => updateList(prev));
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

      const updateList = (list: any[]) =>
        list.map((item) => {
          if (newPricesMap[item.pos]) {
            updatedCount++;
            return { ...item, price: newPricesMap[item.pos].price };
          }
          return item;
        });

      setStaticItems((prev) => updateList(prev));
      setArchitecturalItems((prev) => updateList(prev));
      alert(`PDF Tarandı: ${updatedCount} adet poz güncellendi.`);
    } catch (error) {
      console.error('PDF Hatası:', error);
      alert('PDF okunurken bir hata oluştu.');
    }

    e.target.value = '';
  };

  const handleImportFromXLSX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isXLSXLoaded) return;
    const reader = new FileReader();
    reader.onload = () => {
      alert('Excel yükleme özelliği şu an demo modundadır.');
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleDownloadDescriptions = () => {
    if (!isXLSXLoaded) return;
    alert('Poz listesi indiriliyor...');
  };

  const handleExportToXLSX = () => {
    if (!isXLSXLoaded) return;
    alert('Metraj cetveli indiriliyor...');
  };

  const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
      onClick={onClick}
      className={`flex items-center px-6 py-3 md:px-8 md:py-4 font-bold text-sm transition-all duration-300 rounded-t-xl relative overflow-hidden group whitespace-nowrap ${
        active
          ? 'bg-white text-orange-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border-t-4 border-orange-500'
          : 'bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-800 border-t-4 border-transparent'
      }`}
    >
      <Icon className={`w-5 h-5 mr-2 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20 relative w-full overflow-x-hidden">
      {/* Modallar */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} />
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
          category={isAddingNew ? targetCategory : editingItem ? editingItem.category : ''}
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
        className={`w-full px-4 py-6 transition-all duration-500 ${
          !isLoggedIn ? 'blur-sm pointer-events-none select-none opacity-50 overflow-hidden h-screen' : ''
        }`}
      >
        {/* Özet kartları */}
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

        {/* Sekmeler */}
        <div className="flex flex-col space-y-0 w-full">
          <div className="flex items-end px-2 space-x-2 overflow-x-auto pb-1 w-full no-scrollbar">
            <TabButton active={activeTab === 'static'} onClick={() => setActiveTab('static')} icon={Building} label="Statik Metraj" />
            <TabButton active={activeTab === 'architectural'} onClick={() => setActiveTab('architectural')} icon={Ruler} label="Mimari Metraj" />
            <TabButton active={activeTab === 'door_calculation'} onClick={() => setActiveTab('door_calculation')} icon={DoorOpen} label="Kapı Metrajı" />
            <TabButton active={activeTab === 'window_calculation'} onClick={() => setActiveTab('window_calculation')} icon={Maximize} label="Pencere Metrajı" />
            <TabButton active={activeTab === 'green_book'} onClick={() => setActiveTab('green_book')} icon={Book} label="Yeşil Defter" />
            <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Proje Özeti" />
            <TabButton active={activeTab === 'project_report'} onClick={() => setActiveTab('project_report')} icon={FileText} label="Proje Raporu" />
          </div>

          <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-xl border border-slate-200 min-h-[500px] p-8 relative z-10 w-full">
            {activeTab === 'static' && (
              <MetrajTable
                data={staticItems}
                onUpdateQuantity={(id: any, val: any) => handleUpdateQuantity(id, val, 'static')}
                onOpenSelector={handleOpenSelector}
                onAddNewItem={handleAddNewItem}
                locations={locations}
                onUpdateLocation={(id: any, loc: any) => handleUpdateLocation(id, loc, 'static')}
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
              />
            )}

            {activeTab === 'door_calculation' && (
              <DoorCalculationArea items={doorItems} setItems={setDoorItems} onUpdateQuantities={handleBatchUpdateQuantities} locations={locations} />
            )}

            {activeTab === 'window_calculation' && (
              <WindowCalculationArea items={windowItems} setItems={setWindowItems} onUpdateQuantities={handleBatchUpdateQuantities} locations={locations} />
            )}

            {activeTab === 'green_book' && (
              <GreenBook staticItems={staticItems} architecturalItems={architecturalItems} doorItems={doorItems} windowItems={windowItems} />
            )}

            {activeTab === 'dashboard' && <Dashboard staticItems={staticItems} architecturalItems={architecturalItems} />}

            {activeTab === 'project_report' && (
              <ProjectReportInline
                projectInfo={projectInfo}
                staticItems={staticItems}
                architecturalItems={architecturalItems}
                doorItems={doorItems}
                windowItems={windowItems}
              />
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
