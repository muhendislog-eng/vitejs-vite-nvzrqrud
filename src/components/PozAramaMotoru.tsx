import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, BookOpen, AlertCircle, Loader, Filter, ArrowUpDown, Check } from 'lucide-react';
import { formatCurrency, loadScript } from '../utils/helpers';

// SQL.js için tip tanımı
declare global {
  interface Window {
    initSqlJs: any;
    SQL: any;
  }
}

interface PozAramaMotoruProps {
  onSelect: (pose: any) => void;
  category?: string;
  currentPos?: string;
}

const ITEMS_PER_PAGE = 20;

const PozAramaMotoru: React.FC<PozAramaMotoruProps> = ({ onSelect, category, currentPos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allResults, setAllResults] = useState<any[]>([]);
  const [displayedResults, setDisplayedResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [page, setPage] = useState(1);
  const [isNeighborMode, setIsNeighborMode] = useState(false);
  
  // Veritabanı nesnesini ref içinde tutuyoruz ki re-render'da kaybolmasın
  const dbRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // --- 1. VERİTABANINI YÜKLE (Mount Anında) ---
  useEffect(() => {
    const loadDB = async () => {
      try {
        setLoading(true);
        // 1. SQL.js Kütüphanesini CDN'den çek
        if (!window.initSqlJs) {
            await loadScript("https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js");
        }

        if (!window.initSqlJs) {
            console.error("SQL.js yüklenemedi.");
            return;
        }

        // 2. SQL Motorunu Başlat
        const SQL = await window.initSqlJs({
            locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        // 3. public/database.db dosyasını indir
        // Kanka burası önemli: Dosyanın adı 'database.db' ve public klasöründe olmalı.
        const response = await fetch('/database.db');
        
        if (!response.ok) {
            throw new Error("database.db dosyası bulunamadı! Lütfen public klasörüne yükleyin.");
        }

        const buffer = await response.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(buffer));
        
        dbRef.current = db;
        setDbReady(true);
        setLoading(false);

      } catch (err) {
        console.error("DB Yükleme Hatası:", err);
        setLoading(false);
      }
    };

    loadDB();
  }, []);


  // --- YARDIMCI: SQL SONUCUNU JSON'A ÇEVİRME ---
  const execQuery = useCallback((query: string) => {
    if (!dbRef.current) return [];
    try {
      const res = dbRef.current.exec(query);
      if (!res || res.length === 0) return [];
      const columns = res[0].columns;
      const values = res[0].values;
      return values.map((row: any) => {
        let obj: any = {};
        columns.forEach((col: string, i: number) => {
          obj[col] = row[i];
        });
        return obj;
      });
    } catch (e) {
      console.warn("SQL Hatası:", e);
      return [];
    }
  }, []);


  // --- 2. SENARYO: KOMŞU POZLARI GETİR (±5 Satır) ---
  useEffect(() => {
    if (!dbReady) return;

    // Eğer bir poz düzenleniyorsa (currentPos var) ve arama yapılmadıysa
    if (currentPos && searchTerm === '') {
      setLoading(true);
      setTimeout(() => {
        const safePos = currentPos.replace(/'/g, "''");
        
        // Önce Pozun ID'sini bul (Tablo adı genelde 'poz_library' veya 'unit_prices' olur. 
        // Senin db yapına göre buradaki tablo adını kontrol etmelisin. Varsayılan: poz_library)
        
        // Not: Eğer tablo adını bilmiyorsan "SELECT name FROM sqlite_master WHERE type='table'" ile bakabiliriz.
        // Şimdilik standart tablo ismiyle deniyorum.
        const targetRes = execQuery(`SELECT id FROM poz_no WHERE pos = '${safePos}' LIMIT 1`);
        
        if (targetRes.length > 0) {
            const targetId = targetRes[0].id;
            const startId = Math.max(1, targetId - 5);
            const endId = targetId + 5;
            
            // Komşuları çek
            const neighbors = execQuery(`SELECT * FROM poz_no WHERE id BETWEEN ${startId} AND ${endId} ORDER BY id ASC`);
            
            setAllResults(neighbors);
            setDisplayedResults(neighbors);
            setIsNeighborMode(true);
        } else {
            // Poz bulunamazsa kategoriye göre getir (Fallback)
            if (category) performSearch('');
        }
        setLoading(false);
      }, 50);
    } 
    // Düzenleme değilse ve kategori varsa
    else if (!currentPos && category && searchTerm === '') {
        performSearch('');
    }

  }, [dbReady, currentPos, category]);


  // --- 3. SENARYO: ARAMA YAP (Debounce) ---
  useEffect(() => {
    if (!dbReady) return;

    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        setIsNeighborMode(false);
        performSearch(searchTerm);
      } else if (searchTerm.trim().length === 0 && !isNeighborMode) {
         if (category) performSearch('');
         else {
            setAllResults([]);
            setDisplayedResults([]);
         }
      }
    }, 300); // 300ms bekle

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, dbReady]);


  const performSearch = (term: string) => {
    setLoading(true);
    setTimeout(() => {
      const safeTerm = term.toLowerCase().replace(/'/g, "''");
      let query = "SELECT * FROM poz_no";
      
      const conditions = [];
      // Hem Poz No hem Tanım içinde ara
      if (safeTerm) {
        conditions.push(`(lower(pos) LIKE '%${safeTerm}%' OR lower(desc) LIKE '%${safeTerm}%')`);
      }
      // Kategori filtresi
      if (category) {
        conditions.push(`category = '${category}'`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      
      query += " LIMIT 100"; // Performans için limit

      const data = execQuery(query);
      setAllResults(data);
      setPage(1);
      setDisplayedResults(data.slice(0, ITEMS_PER_PAGE));
      setLoading(false);
    }, 10);
  };

  // --- 4. SONSUZ KAYDIRMA (Lazy Load) ---
  const handleScroll = useCallback(() => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        if (displayedResults.length < allResults.length) {
          const nextPage = page + 1;
          const nextItems = allResults.slice(0, nextPage * ITEMS_PER_PAGE);
          setDisplayedResults(nextItems);
          setPage(nextPage);
        }
      }
    }
  }, [displayedResults, allResults, page]);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl overflow-hidden border border-slate-200">
      
      {/* --- ARAMA ALANI --- */}
      <div className="p-5 bg-white border-b border-slate-200 shadow-sm z-10 flex-shrink-0">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            {loading ? <Loader className="w-5 h-5 animate-spin text-orange-500" /> : <Search className="w-5 h-5" />}
          </div>
          <input 
            type="text" 
            placeholder={!dbReady ? "Veritabanı Yükleniyor..." : (isNeighborMode ? `Mevcut Poz (${currentPos}) ve çevresi...` : "Poz No veya Tanım Ara...")}
            className={`w-full pl-12 pr-4 py-4 border rounded-2xl outline-none transition-all shadow-inner text-slate-700 placeholder:text-slate-400 font-medium text-lg ${isNeighborMode ? 'bg-blue-50 border-blue-200 focus:ring-blue-300' : 'bg-slate-50 border-slate-200 focus:ring-orange-200'}`}
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                if(e.target.value.length > 0) setIsNeighborMode(false);
            }}
            disabled={!dbReady}
            autoFocus
          />
        </div>
        
        <div className="mt-3 flex justify-between items-center px-1">
             <div className="flex items-center space-x-2">
                {isNeighborMode && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 flex items-center animate-in fade-in zoom-in">
                        <ArrowUpDown className="w-3 h-3 mr-1"/> Yakın Pozlar
                    </span>
                )}
                {category && !isNeighborMode && (
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100 flex items-center">
                        <Filter className="w-3 h-3 mr-1"/> {category}
                    </span>
                )}
                {!loading && allResults.length > 0 && (
                    <span className="text-xs font-semibold text-slate-500">
                        {allResults.length} sonuç
                    </span>
                )}
             </div>
             
             <span className="text-[10px] font-bold text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <BookOpen className="w-3 h-3 mr-1"/> {dbReady ? "DB Bağlı" : "Yükleniyor..."}
             </span>
        </div>
      </div>

      {/* --- LİSTE ALANI --- */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 custom-scrollbar"
        ref={listRef}
        onScroll={handleScroll}
      >
        {displayedResults.length > 0 ? (
          <>
            {displayedResults.map((item: any, index: number) => {
               const isCurrent = currentPos && item.pos === currentPos;
               
               return (
                <div 
                    key={`${item.pos}-${index}`} 
                    onClick={() => onSelect(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all group relative animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        isCurrent 
                        ? 'bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-100' 
                        : 'bg-white border-slate-200 hover:border-orange-400 hover:shadow-lg'
                    }`}
                >
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                                <span className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg border ${isCurrent ? 'text-blue-700 bg-blue-100 border-blue-200' : 'text-orange-700 bg-orange-50 border-orange-100'}`}>
                                    {item.pos}
                                </span>
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                    {item.unit}
                                </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed font-medium line-clamp-2">
                                {item.desc}
                            </p>
                        </div>
                        
                        <div className="text-right flex flex-col items-end justify-between min-h-[60px]">
                            <span className="font-black text-slate-800 text-lg tracking-tight bg-slate-50 px-2 py-1 rounded-lg">
                                {formatCurrency(item.price)}
                            </span>
                            <span className={`flex items-center text-xs font-bold text-white px-4 py-2 rounded-lg shadow-sm transition-colors mt-2 ${isCurrent ? 'bg-blue-600' : 'bg-green-600 group-hover:bg-green-700'}`}>
                                {isCurrent ? <Check className="w-3.5 h-3.5 mr-1.5"/> : <Plus className="w-3.5 h-3.5 mr-1.5" />} 
                                {isCurrent ? 'MEVCUT' : 'SEÇ'}
                            </span>
                        </div>
                    </div>
                </div>
               );
            })}
            
            {/* Loading Spinner */}
            {displayedResults.length < allResults.length && (
                <div className="py-4 text-center text-slate-400 text-sm flex items-center justify-center">
                    <Loader className="w-4 h-4 animate-spin mr-2"/> Yükleniyor...
                </div>
            )}
          </>
        ) : (
          /* BOŞ EKRAN */
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60 pb-10">
             {!dbReady ? (
                 <>
                    <Loader className="w-12 h-12 mb-4 animate-spin text-slate-300"/>
                    <p className="text-sm">Veritabanı Yükleniyor...</p>
                 </>
             ) : searchTerm ? (
               <>
                 <AlertCircle className="w-16 h-16 mb-4 text-slate-300"/>
                 <p className="text-lg font-bold text-slate-500">Sonuç Bulunamadı</p>
               </>
             ) : (
               <>
                 <Search className="w-16 h-16 mb-4 text-slate-200"/>
                 <p className="text-lg font-bold text-slate-400">Aramaya Başlayın</p>
               </>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PozAramaMotoru;