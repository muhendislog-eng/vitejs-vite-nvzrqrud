import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, BookOpen, AlertCircle, Loader, Filter, ArrowUpDown, Check, Database } from 'lucide-react';
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
  
  // Veritabanı referansları
  const dbRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tableNameRef = useRef<string>("pozlar"); // Varsayılan tablo adı

  // --- 1. VERİTABANINI YÜKLE VE TABLOYU BUL ---
  useEffect(() => {
    const initDB = async () => {
      try {
        setLoading(true);
        if (!window.initSqlJs) {
          await loadScript("https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js");
        }

        if (!window.initSqlJs) {
          console.error("SQL.js yüklenemedi.");
          return;
        }

        const SQL = await window.initSqlJs({
          locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        // database.db dosyasını public klasöründen çek
        const response = await fetch('/database.db');
        if (!response.ok) throw new Error("database.db bulunamadı!");
        
        const buffer = await response.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(buffer));
        dbRef.current = db;

        // Tablo adını otomatik bulmaya çalış (yoksa varsayılanı kullan)
        try {
            const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            if (tables.length > 0 && tables[0].values.length > 0) {
                // Genellikle ilk tablo asıl veri tablosudur
                tableNameRef.current = tables[0].values[0][0]; 
                console.log("Bulunan Tablo:", tableNameRef.current);
            }
        } catch (e) {
            console.warn("Tablo adı bulunamadı, varsayılan kullanılıyor.");
        }

        setDbReady(true);
        setLoading(false);

      } catch (err) {
        console.error("DB Yükleme Hatası:", err);
        setLoading(false);
      }
    };

    initDB();
  }, []);

  // --- YARDIMCI: SQL ÇALIŞTIRMA ---
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
          // Sütun isimlerini küçük harfe çevirerek eşleştirme kolaylığı sağla
          obj[col.toLowerCase()] = row[i];
        });
        return obj;
      });
    } catch (e) {
      console.warn("Sorgu hatası:", e);
      return [];
    }
  }, []);

  // --- 2. KOMŞU POZLARI GETİR (±5 SATIR) ---
  useEffect(() => {
    if (!dbReady) return;

    // Eğer düzenleme modundaysak ve arama yapılmadıysa
    if (currentPos && searchTerm === '') {
      setLoading(true);
      setTimeout(() => {
        const table = tableNameRef.current;
        const safePos = currentPos.replace(/'/g, "''");
        
        // 1. ADIM: Hedef pozun satır numarasını (rowid) bul
        // Hem 'poz_no' hem 'pos' sütun isimlerini dene
        let targetQuery = `SELECT rowid, * FROM ${table} WHERE poz_no = '${safePos}' LIMIT 1`;
        let targetRes = execQuery(targetQuery);
        
        if (targetRes.length === 0) {
             targetRes = execQuery(`SELECT rowid, * FROM ${table} WHERE pos = '${safePos}' LIMIT 1`);
        }

        if (targetRes.length > 0) {
            // Hedef bulundu, satır numarasını al
            const targetRowId = targetRes[0].rowid; 
            
            // 2. ADIM: Bu satır numarasının 5 altını ve 5 üstünü hesapla
            const startId = targetRowId - 5;
            const endId = targetRowId + 5;
            
            // 3. ADIM: Bu aralıktaki tüm satırları çek
            const neighbors = execQuery(`SELECT * FROM ${table} WHERE rowid BETWEEN ${startId} AND ${endId} ORDER BY rowid ASC`);
            
            setAllResults(neighbors);
            setDisplayedResults(neighbors);
            setIsNeighborMode(true);
        } else {
             // Poz veritabanında yoksa normal listeleme yap (Kategoriye göre)
             if (category) performSearch('');
        }
        setLoading(false);
      }, 100);
    } 
    else if (!currentPos && category && searchTerm === '') {
        performSearch('');
    }
  }, [dbReady, currentPos, category]);

  // --- 3. ARAMA MANTIĞI (poz_no ve tanim) ---
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
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, dbReady]);

  const performSearch = (term: string) => {
    setLoading(true);
    setTimeout(() => {
      const safeTerm = term.toLowerCase().replace(/'/g, "''");
      const table = tableNameRef.current;
      
      let query = `SELECT * FROM ${table} WHERE 1=1`;
      
      if (safeTerm) {
        query += ` AND (
            lower(poz_no) LIKE '%${safeTerm}%' OR 
            lower(tanim) LIKE '%${safeTerm}%' OR
            lower(pos) LIKE '%${safeTerm}%' OR 
            lower(desc) LIKE '%${safeTerm}%'
        )`;
      }

      // Opsiyonel: Kategoriye göre filtrele (Eğer veritabanında bu sütun varsa)
      // query += ` AND category = '${category}'` 

      query += " LIMIT 100"; 

      const data = execQuery(query);
      setAllResults(data);
      setPage(1);
      setDisplayedResults(data.slice(0, ITEMS_PER_PAGE));
      setLoading(false);
    }, 50);
  };

  // --- 4. SONSUZ KAYDIRMA ---
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
      
      {/* ÜST ARAMA ALANI */}
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
                <span className="text-xs font-semibold text-slate-500">
                    {allResults.length} sonuç
                </span>
             </div>
             
             <span className="text-[10px] font-bold text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <Database className="w-3 h-3 mr-1"/> {dbReady ? "DB Bağlı" : "Yükleniyor..."}
             </span>
        </div>
      </div>

      {/* LİSTE ALANI */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 custom-scrollbar"
        ref={listRef}
        onScroll={handleScroll}
      >
        {displayedResults.length > 0 ? (
          <>
            {displayedResults.map((item: any, index: number) => {
               // item verisinden doğru alanları al (poz_no yoksa pos, tanim yoksa desc)
               const posVal = item.poz_no || item.pos || "---";
               const descVal = item.tanim || item.desc || "Tanımsız";
               const unitVal = item.birim || item.unit || "adet";
               const priceVal = item.birim_fiyat || item.price || 0;

               const isCurrent = currentPos && posVal === currentPos;
               
               return (
                <div 
                    key={`${posVal}-${index}`} 
                    onClick={() => onSelect({ ...item, pos: posVal, desc: descVal, unit: unitVal, price: priceVal })}
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
                                    {posVal}
                                </span>
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                    {unitVal}
                                </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed font-medium line-clamp-2">
                                {descVal}
                            </p>
                        </div>
                        
                        <div className="text-right flex flex-col items-end justify-between min-h-[60px]">
                            <span className="font-black text-slate-800 text-lg tracking-tight bg-slate-50 px-2 py-1 rounded-lg">
                                {formatCurrency(Number(priceVal))}
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
                 <p className="text-sm">Poz numarası veya tanım yazarak filtreleyin.</p>
               </>
             )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-slate-50 border-t border-slate-200 p-2 text-center">
          <p className="text-[10px] text-slate-400 font-mono">
              Gösterilen: {displayedResults.length} / {allResults.length} kayıt
          </p>
      </div>
    </div>
  );
};

export default PozAramaMotoru;