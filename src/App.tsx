import React, { useState, useEffect, useRef } from 'react';
import {
  Building,
  Ruler,
  DoorOpen,
  Maximize,
  Book,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Wrench,
  CreditCard,
  HardHat,
  Briefcase,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENT IMPORTS ---
import Header from './components/Header';
import ProjectResults from './components/ProjectResults';
import MetrajTable from './components/MetrajTable';
import GreenBook from './components/GreenBook';
import DoorCalculationArea from './components/DoorCalculationArea';
import WindowCalculationArea from './components/WindowCalculationArea';
import Footer from './components/Footer';
import { LoginModal, ProjectInfoModal, PoseSelectorModal } from './components/Modals';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { PaymentModule, type YesilDefterEntry } from './components/PaymentModule';
import { ConstructionManagementModule, DailyReport } from './components/ConstructionManagementModule';
import { PublicTendersModule, Tender } from './components/PublicTendersModule';
import type { ProjectMetadata } from './components/ProjectManagerModal';

// --- DATA & HELPERS ---
import {
  INITIAL_POS_LIBRARY,
  INITIAL_LOCATIONS,
  initialStaticData,
  initialArchitecturalData,
  initialMechanicalData,
  initialElectricalData,
} from './data/constants';

import { loadScript, formatCurrency } from './utils/helpers';

// --- TYPES ---
type ActiveTab =
  | 'static'
  | 'architectural'
  | 'mechanical'
  | 'electrical'
  | 'door_calculation'
  | 'window_calculation'
  | 'green_book'
  | 'project_results'
  | 'payment'
  | 'construction_management'
  | 'public_tenders'; // Added new type

type MetrajItem = {
  id: number | string;
  pos: string;
  desc: string;
  unit: string;
  price: number;
  quantity: number;
  category?: string;
  isManual?: boolean;
  locationId?: string | number | null;
  [key: string]: any;
};

// --- DROPDOWN COMPONENTS (Premium Design) ---
// --- DROPDOWN COMPONENTS (Dynamic Horizontal Design) ---
// --- DROPDOWN COMPONENTS (Liquid Premium Design) ---
const DropdownMenu = ({ label, icon: Icon, children, isActive, isOpen, onToggle }: any) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <motion.div
      layout={!isMobile}
      className={`relative z-50 flex flex-col sm:flex-row items-center justify-center h-auto sm:h-full rounded-[1.2rem] transition-all duration-300 border overflow-hidden ${isActive || isOpen
        ? 'bg-slate-900 border-slate-900 shadow-lg shadow-slate-900/20'
        : 'border-transparent hover:bg-white/50'
        }`}
      onMouseEnter={() => !isMobile && onToggle(true)}
      onMouseLeave={() => !isMobile && onToggle(false)}
      onClick={() => onToggle(!isOpen)}
    >
      {/* Trigger Area */}
      <button
        className={`relative px-3 py-2 sm:px-5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${isActive || isOpen ? 'text-white' : 'text-slate-500'
          }`}
      >
        <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-300 ${isActive || isOpen ? 'text-orange-400' : 'text-slate-400'}`} />
          <span className={`font-bold tracking-tight ${isActive || isOpen ? 'text-white' : ''}`}>
            {label}
          </span>
          <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-400' : 'text-slate-400'}`} />
        </span>
      </button>

      {/* Accordion Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={isMobile ? { opacity: 0, height: 0 } : { width: 0, height: 0, opacity: 0 }}
            animate={isMobile ? { opacity: 1, height: 'auto' } : { width: "auto", height: "auto", opacity: 1 }}
            exit={isMobile ? { opacity: 0, height: 0 } : { width: 0, height: 0, opacity: 0 }}
            transition={isMobile ? { duration: 0.2 } : {
              type: "spring",
              stiffness: 400,
              damping: 40,
              mass: 0.8,
              opacity: { duration: 0.15, delay: 0.05 }
            }}
            className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-1 pr-2 pb-1.5 sm:pb-0 w-full sm:w-auto sm:max-w-none whitespace-nowrap"
          >
            <div className="hidden sm:block w-px h-4 bg-slate-700/50 mx-1 flex-shrink-0" />
            <div className="sm:hidden w-full h-px bg-slate-700/50 my-1" />
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const DropdownItem = ({ onClick, active, label, icon: Icon }: any) => (
  <button
    onClick={(e) => {
      onClick(e);
      e.stopPropagation();
    }}
    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg sm:rounded-full text-[10px] sm:text-sm font-bold whitespace-nowrap transition-all flex-grow sm:flex-grow-0 justify-center sm:justify-start ${active
      ? 'bg-orange-500 text-white shadow-md'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
  >
    <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
    {label}
  </button>
);

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className="relative px-5 py-3 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap z-10"
  >
    {active && (
      <motion.div
        layoutId="liquidTab"
        className="absolute inset-0 bg-slate-900 shadow-lg shadow-slate-900/20 rounded-full"
        initial={false}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    )}

    <span className={`relative z-10 flex items-center gap-2 transition-colors duration-200 ${active ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}>
      <Icon className={`w-4 h-4 ${active ? 'text-orange-400' : 'text-slate-400'}`} />
      <span className="font-bold tracking-tight">
        {label}
      </span>
    </span>
  </button>
);


export default function App() {
  // --- STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('static');

  // --- PROJECT MANAGEMENT STATE ---
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);

  // Veriler
  const [staticItems, setStaticItems] = useState<MetrajItem[]>(initialStaticData as any);
  const [architecturalItems, setArchitecturalItems] = useState<MetrajItem[]>(initialArchitecturalData as any);
  const [mechanicalItems, setMechanicalItems] = useState<MetrajItem[]>(initialMechanicalData as any);
  const [electricalItems, setElectricalItems] = useState<MetrajItem[]>(initialElectricalData as any);
  const [doorItems, setDoorItems] = useState<any[]>([]);
  const [windowItems, setWindowItems] = useState<any[]>([]);

  // Module States
  const [paymentMeasurements, setPaymentMeasurements] = useState<YesilDefterEntry[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]); // New State

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

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleDropdownToggle = (id: string, isOpen: boolean) => {
    if (isOpen) {
      setOpenDropdown(id);
    } else if (openDropdown === id) {
      setOpenDropdown(null);
    }
  };
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

    // --- MIGRATION & INIT LOGIC ---
    const initProjects = () => {
      const storedProjects = localStorage.getItem('gkmetraj_projects');
      const oldData = localStorage.getItem('gkmetraj_data');

      // 1. Durum: Hiç proje yok ama eski veri var -> Migration
      if (!storedProjects && oldData) {
        const defaultProjectId = 'default-project-' + Date.now();
        const defaultProject: ProjectMetadata = {
          id: defaultProjectId,
          name: 'Varsayılan Proje',
          lastModified: new Date().toLocaleDateString()
        };

        // Eski veriyi yeni ID ile kaydet
        localStorage.setItem(`gkmetraj_data_${defaultProjectId}`, oldData);

        // Projeler listesini başlat
        const newProjects = [defaultProject];
        localStorage.setItem('gkmetraj_projects', JSON.stringify(newProjects));
        localStorage.setItem('gkmetraj_active_project', defaultProjectId);

        setProjects(newProjects);
        setActiveProjectId(defaultProjectId);
        loadProjectData(defaultProjectId); // Veriyi yükle
      }
      // 2. Durum: Projeler var -> Listeyi ve aktif projeyi yükle
      else if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        setProjects(parsedProjects);

        const lastActiveId = localStorage.getItem('gkmetraj_active_project');
        // Eğer aktif ID varsa ve geçerliyse onu aç, yoksa ilk projeyi aç
        const targetId = lastActiveId && parsedProjects.find((p: any) => p.id === lastActiveId)
          ? lastActiveId
          : parsedProjects[0]?.id;

        if (targetId) {
          setActiveProjectId(targetId);
          loadProjectData(targetId);
        } else {
          // Proje listesi boşsa
          handleCreateProject('Yeni Proje');
        }
      }
      // 3. Durum: Hiçbir şey yok -> Tertemiz başlangıç
      else {
        handleCreateProject('Yeni Proje');
      }
    };

    initProjects();

    const session = localStorage.getItem('gkmetraj_session');
    if (session === 'active') setIsLoggedIn(true);
  }, []);

  // --- PROJECT HELPERS ---
  const loadProjectData = (projectId: string) => {
    const data = localStorage.getItem(`gkmetraj_data_${projectId}`);
    if (data) {
      try {
        const parsed = JSON.parse(data);

        setStaticItems(parsed.staticItems || initialStaticData);
        setArchitecturalItems(parsed.architecturalItems || initialArchitecturalData);
        setMechanicalItems(parsed.mechanicalItems || initialMechanicalData);
        setElectricalItems(parsed.electricalItems || initialElectricalData);
        setDoorItems(parsed.doorItems || []);
        setWindowItems(parsed.windowItems || []);
        setPaymentMeasurements(parsed.paymentMeasurements || []);
        setDailyReports(parsed.dailyReports || []);
        setTenders(parsed.tenders || []); // Load Tenders
        setProjectInfo(parsed.projectInfo || { name: '', area: '', floors: '', city: '' });
        setLocations(parsed.locations || INITIAL_LOCATIONS);
      } catch (e) {
        console.error('Veri yükleme hatası', e);
      }
    } else {
      resetProjectData();
    }
  };

  const resetProjectData = () => {
    setStaticItems(initialStaticData as any);
    setArchitecturalItems(initialArchitecturalData as any);
    setMechanicalItems(initialMechanicalData as any);
    setElectricalItems(initialElectricalData as any);
    setDoorItems([]);
    setWindowItems([]);
    setProjectInfo({ name: '', area: '', floors: '', city: '' });
    setLocations(INITIAL_LOCATIONS);
    setPaymentMeasurements([]);
    setDailyReports([]);
    setTenders([]);
  };

  const handleSwitchProject = (id: string) => {
    if (id === activeProjectId) return;
    setActiveProjectId(id);
    localStorage.setItem('gkmetraj_active_project', id);
    loadProjectData(id);
    setIsProjectManagerOpen(false);
  };

  const handleCreateProject = (name: string) => {
    const newId = 'project-' + Date.now();
    const newProject: ProjectMetadata = {
      id: newId,
      name: name,
      lastModified: new Date().toLocaleDateString()
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('gkmetraj_projects', JSON.stringify(updatedProjects));

    // Yeni projeye geç
    setActiveProjectId(newId);
    localStorage.setItem('gkmetraj_active_project', newId);

    // Verileri sıfırla ve kaydet (boş olarak)
    resetProjectData();
    const emptyData = {
      staticItems: initialStaticData,
      architecturalItems: initialArchitecturalData,
      mechanicalItems: initialMechanicalData,
      electricalItems: initialElectricalData,
      doorItems: [],
      windowItems: [],
      projectInfo: { name: name, area: '', floors: '', city: '' },
      locations: INITIAL_LOCATIONS,
      lastSaved: new Date().toLocaleTimeString(),
      paymentMeasurements: [],
      dailyReports: [],
      tenders: [],
    };
    localStorage.setItem(`gkmetraj_data_${newId}`, JSON.stringify(emptyData));
    setProjectInfo(prev => ({ ...prev, name }));

    setIsProjectManagerOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    const updatedProjects = projects.filter(p => p.id !== id);
    setProjects(updatedProjects);
    localStorage.setItem('gkmetraj_projects', JSON.stringify(updatedProjects));
    localStorage.removeItem(`gkmetraj_data_${id}`);

    if (id === activeProjectId) {
      if (updatedProjects.length > 0) {
        handleSwitchProject(updatedProjects[0].id);
      } else {
        handleCreateProject('Yeni Proje');
      }
    }
  };

  // --- AUTH & SAVE ---
  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('gkmetraj_session', 'active');
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('gkmetraj_session');
  };

  const handleSave = () => {
    if (!activeProjectId) {
      alert('Hata: Aktif proje bulunamadı.');
      return;
    }

    const dataToSave = {
      staticItems,
      architecturalItems,
      mechanicalItems,
      electricalItems,
      doorItems,
      windowItems,
      projectInfo,
      locations,
      paymentMeasurements,
      dailyReports,
      tenders, // Save Tenders
      lastSaved: new Date().toLocaleTimeString(),
    };

    localStorage.setItem(`gkmetraj_data_${activeProjectId}`, JSON.stringify(dataToSave));

    const updatedProjects = projects.map(p =>
      p.id === activeProjectId ? { ...p, lastModified: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0, 5) } : p
    );
    setProjects(updatedProjects);
    localStorage.setItem('gkmetraj_projects', JSON.stringify(updatedProjects));

    alert('Proje başarıyla kaydedildi!');
  };

  // --- ITEM LOGIC ---
  const handleUpdateQuantity = (id: number | string, quantity: number, type: 'static' | 'architectural' | 'mechanical' | 'electrical') => {
    const update = (prev: MetrajItem[]) => prev.map(item => (item.id === id ? { ...item, quantity } : item));
    if (type === 'static') setStaticItems(update);
    else if (type === 'architectural') setArchitecturalItems(update);
    else if (type === 'mechanical') setMechanicalItems(update);
    else setElectricalItems(update);
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

  const handleUpdateManualItem = (id: number | string, patch: any) => {
    const merge = (list: any[]) => list.map((it) => it.id === id ? { ...it, ...patch } : it);
    if (activeTab === 'static') setStaticItems(merge);
    else if (activeTab === 'architectural') setArchitecturalItems(merge);
    else if (activeTab === 'mechanical') setMechanicalItems(merge);
    else if (activeTab === 'electrical') setElectricalItems(merge);
  };

  const handleDeleteManualItem = (id: number | string) => {
    const remove = (list: any[]) => list.filter((it) => it.id !== id);
    if (activeTab === 'static') setStaticItems(remove);
    else if (activeTab === 'architectural') setArchitecturalItems(remove);
    else if (activeTab === 'mechanical') setMechanicalItems(remove);
    else if (activeTab === 'electrical') setElectricalItems(remove);
  };

  const handleUpdateLocation = (id: number | string, locId: any, type: 'static' | 'architectural' | 'mechanical' | 'electrical') => {
    const patch = (list: MetrajItem[]) => list.map(it => (it.id === id ? { ...it, locationId: locId } : it));
    if (type === 'static') setStaticItems(patch);
    else if (type === 'architectural') setArchitecturalItems(patch);
    else if (type === 'mechanical') setMechanicalItems(patch);
    else setElectricalItems(patch);
  };

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

  const handleSelectPose = (newPoseData: any) => {
    const base: MetrajItem = {
      id: isAddingNew ? Date.now() : (editingItem?.id ?? Date.now()),
      category: isAddingNew ? targetCategory : (editingItem?.category ?? ''),
      pos: newPoseData.pos,
      desc: newPoseData.desc,
      unit: newPoseData.unit,
      price: newPoseData.price,
      quantity: isAddingNew ? 0 : (editingItem?.quantity ?? 0),
      isManual: Boolean(newPoseData?.isManual === true),
    };

    if (isAddingNew && newPoseData?.source === 'manual') {
      base.isManual = true;
    }

    const updateOrAdd = (list: MetrajItem[]) => {
      if (isAddingNew) return [...list, base];
      return list.map(item => (item.id === editingItem?.id ? { ...item, ...base, id: item.id } : item));
    };

    if (activeTab === 'static') setStaticItems(updateOrAdd);
    else if (activeTab === 'architectural') setArchitecturalItems(updateOrAdd);
    else if (activeTab === 'mechanical') setMechanicalItems(updateOrAdd);
    else if (activeTab === 'electrical') setElectricalItems(updateOrAdd);

    setIsModalOpen(false);
  };

  // --- FILE HANDLING ---
  const handleUpdateFromPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // PDF Logic (simplified for brevity, assume same as before)
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
      const regex = /(\d{2}\.\d{3}\.\d{4})\s+(.+?)\s+(m³|m²|m|Ton|kg|Adet|sa|km)\s+(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/gi;
      let match;
      while ((match = regex.exec(fullText)) !== null) {
        const price = parseFloat(match[4].replace(/\./g, '').replace(',', '.'));
        if (match[1] && !isNaN(price)) {
          newPricesMap[match[1]] = { price, desc: match[2].trim(), unit: match[3] };
        }
      }
      const updateList = (list: MetrajItem[]) => list.map(item => {
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

  const handleImportFromXLSX = (e: React.ChangeEvent<HTMLInputElement>) => {
    alert('Excel yükleme özelliği şu an demo modundadır.');
    e.target.value = '';
  };

  const handleDownloadDescriptions = () => {
    if (!isXLSXLoaded) return;
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

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 relative w-full overflow-x-hidden selection:bg-orange-500 selection:text-white">
      <style>{`@media print { footer { display: none !important; } }`}</style>

      {/* MODALS */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} />
      <ProjectInfoModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSave={setProjectInfo} initialData={projectInfo} />
      <ProjectManagerModal isOpen={isProjectManagerOpen} onClose={() => setIsProjectManagerOpen(false)} projects={projects} activeProjectId={activeProjectId} onSwitchProject={handleSwitchProject} onCreateProject={handleCreateProject} onDeleteProject={handleDeleteProject} />

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

      {/* HEADER */}
      <Header
        isLoggedIn={isLoggedIn}
        projectInfo={projectInfo}
        isPDFLoaded={isPDFLoaded}
        isXLSXLoaded={isXLSXLoaded}
        isLoadingScripts={isLoadingScripts}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogoutClick={handleLogout}
        onSave={handleSave}
        onDownloadDescriptions={handleDownloadDescriptions}
        onExportToXLSX={handleExportToXLSX}
        onImportExcel={handleImportFromXLSX}
        onUpdatePDF={handleUpdateFromPDF}
      />

      {/* MAIN CONTENT */}
      <main className={`flex-grow w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pt-24 sm:pt-28 md:pt-32 transition-all duration-500 ${!isLoggedIn ? 'blur-sm pointer-events-none select-none opacity-50 overflow-hidden h-screen' : ''}`}>

        {/* NAVIGATION BAR WITH DROPDOWNS */}
        <div className="w-full mb-4 sm:mb-8 z-50 relative">
          <div className="flex flex-wrap justify-center items-center gap-1.5 p-2 bg-white/60 backdrop-blur-2xl rounded-[1.5rem] border border-white/40 shadow-xl shadow-slate-200/40 w-full md:w-fit mx-auto ring-1 ring-slate-900/5 transition-all duration-300">

            {/* ROW 1 (Mobile) / Core Tabs */}
            <div className="flex flex-wrap justify-center gap-1 w-full md:w-auto">
              <TabButton onClick={() => setActiveTab('static')} active={activeTab === 'static'} icon={Building} label="Statik" />
              <TabButton onClick={() => setActiveTab('architectural')} active={activeTab === 'architectural'} icon={Ruler} label="Mimari" />
              <TabButton onClick={() => setActiveTab('mechanical')} active={activeTab === 'mechanical'} icon={Wrench} label="Mekanik" />
              <TabButton onClick={() => setActiveTab('electrical')} active={activeTab === 'electrical'} icon={Zap} label="Elektrik" />
            </div>

            <div className="hidden md:block w-px h-6 bg-slate-300/50 mx-1 flex-shrink-0" />

            {/* ROW 2 (Mobile) / Secondary Tabs */}
            <div className="flex flex-wrap justify-center gap-1 w-full md:w-auto mt-1 md:mt-0">
              <DropdownMenu
                label="Kapı/Pencere"
                icon={Maximize}
                isActive={activeTab === 'door_calculation' || activeTab === 'window_calculation'}
                isOpen={openDropdown === 'door_window'}
                onToggle={(isOpen: boolean) => handleDropdownToggle('door_window', isOpen)}
              >
                <DropdownItem onClick={() => setActiveTab('door_calculation')} active={activeTab === 'door_calculation'} label="Kapı" icon={DoorOpen} />
                <DropdownItem onClick={() => setActiveTab('window_calculation')} active={activeTab === 'window_calculation'} label="Pencere" icon={Maximize} />
              </DropdownMenu>

              <DropdownMenu
                label="İdare"
                icon={Briefcase}
                isActive={activeTab === 'public_tenders'}
                isOpen={openDropdown === 'admin'}
                onToggle={(isOpen: boolean) => handleDropdownToggle('admin', isOpen)}
              >
                <DropdownItem onClick={() => setActiveTab('public_tenders')} active={activeTab === 'public_tenders'} label="Kamu İhale" icon={Briefcase} />
              </DropdownMenu>
            </div>

            {/* ROW 3 (Mobile) / Proje */}
            <div className="flex justify-center w-full md:w-auto mt-1 md:mt-0">
              <DropdownMenu
                label="Proje"
                icon={LayoutDashboard}
                isActive={['green_book', 'project_results', 'payment', 'construction_management'].includes(activeTab)}
                isOpen={openDropdown === 'project'}
                onToggle={(isOpen: boolean) => handleDropdownToggle('project', isOpen)}
              >
                <DropdownItem onClick={() => setActiveTab('green_book')} active={activeTab === 'green_book'} label="Yeşil Defter" icon={Book} />
                <DropdownItem onClick={() => setActiveTab('project_results')} active={activeTab === 'project_results'} label="Proje Sonuçları" icon={LayoutDashboard} />
                <DropdownItem onClick={() => setActiveTab('payment')} active={activeTab === 'payment'} label="Hakediş" icon={CreditCard} />
                <DropdownItem onClick={() => setActiveTab('construction_management')} active={activeTab === 'construction_management'} label="Şantiye" icon={HardHat} />
              </DropdownMenu>
            </div>

          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white/80 backdrop-blur-md sm:backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] shadow-xl shadow-slate-200/20 border border-white/40 p-1">
          <div className="bg-white/50 rounded-xl sm:rounded-[2.3rem] p-3 sm:p-6 md:p-8 min-h-[400px] sm:min-h-[500px]">

            {/* RENDER CONDITIONS */}
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
              <DoorCalculationArea items={doorItems} setItems={setDoorItems} onUpdateQuantities={handleBatchUpdateQuantities} />
            )}

            {activeTab === 'window_calculation' && (
              <WindowCalculationArea items={windowItems} setItems={setWindowItems} onUpdateQuantities={handleBatchUpdateQuantities} />
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

            {activeTab === 'payment' && (
              <PaymentModule
                contractItems={[
                  ...staticItems.map(i => ({ ...i, id: String(i.id), pozNo: i.pos, tanim: i.desc, birim: i.unit, birimFiyat: i.price })),
                  ...architecturalItems.map(i => ({ ...i, id: String(i.id), pozNo: i.pos, tanim: i.desc, birim: i.unit, birimFiyat: i.price })),
                  ...mechanicalItems.map(i => ({ ...i, id: String(i.id), pozNo: i.pos, tanim: i.desc, birim: i.unit, birimFiyat: i.price })),
                  ...electricalItems.map(i => ({ ...i, id: String(i.id), pozNo: i.pos, tanim: i.desc, birim: i.unit, birimFiyat: i.price })),
                ]}
                measurements={paymentMeasurements}
                onUpdateMeasurements={setPaymentMeasurements}
              />
            )}

            {activeTab === 'construction_management' && (
              <ConstructionManagementModule
                reports={dailyReports}
                onUpdateReports={setDailyReports}
              />
            )}

            {activeTab === 'public_tenders' && (
              <PublicTendersModule
                tenders={tenders}
                onUpdateTenders={setTenders}
              />
            )}
          </div>
        </div>
      </main>

      <Footer onOpenProjects={() => setIsProjectManagerOpen(true)} onOpenCalculations={() => setActiveTab('architectural')} onOpenGreenBook={() => setActiveTab('green_book')} onOpenReports={() => setActiveTab('project_results')} />

      {/* Lock Screen */}
      <AnimatePresence>
        {!isLoggedIn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-10 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900/30 pointer-events-none" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative bg-white/10 backdrop-blur-2xl text-white p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full text-center border border-white/20">
              <ShieldCheck className="w-16 h-16 text-orange-500 mb-6" />
              <h2 className="text-4xl font-black mb-3">Sistem Kilitli</h2>
              <p className="text-slate-300 mb-8">Verilere erişmek ve işlem yapmak için lütfen yetkili girişi yapınız.</p>
              <button onClick={() => setIsLoginModalOpen(true)} className="bg-orange-600 hover:bg-orange-500 text-white px-10 py-4 rounded-2xl font-bold transition-all w-full">Giriş Yap</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
