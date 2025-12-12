import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, BookOpen, AlertCircle, Loader, Filter, ArrowUpDown, Check, Database, Star } from 'lucide-react';
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
  
  // --- YENİ: FAVORİLER VE GÖRÜNÜM MODU STATE'LERİ ---
  const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Veritabanı referansları
  const dbRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tableNameRef = useRef<string>(""); 

  // --- BAŞLANGIÇ: FAVORİLERİ YÜKLE ---
  useEffect(() => {
    const savedFavs = localStorage.getItem('gkmetraj_favorites');
    if (savedFavs) {
      setFavorites(JSON.parse(savedFavs));
    }
  }, []);

  // --- FAVORİ EKLE/ÇIKAR ---
  const toggleFavorite = (e: React.MouseEvent, pozNo: string) => {
    e.stopPropagation(); // Satıra tıklamayı engelle
    let newFavs;
    if (favorites.includes(pozNo)) {
      newFavs = favorites.filter(id => id !== pozNo);
    } else {
      newFavs = [...favorites, pozNo];
    }
    setFavorites(newFavs);
    localStorage.setItem('gkmetraj_favorites', JSON.stringify(newFavs));
    
    // Eğer favoriler sekmesindeysek ve favoriden çıkardıysak listeyi güncelle
    if (viewMode === 'favorites') {
        // UI'dan anında kaldırmak için
        const updatedDisplay = displayedResults.filter(item => (item.poz_no || item.pos) !== pozNo);
        setDisplayedResults(updatedDisplay);
    }
  };

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

        const response = await fetch('/database.db');
        if (!response.ok) throw new Error("database.db dosyası bulunamadı!");
        
        const buffer = await response.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(buffer));
        dbRef.current = db;

        const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        if (tables.length > 0 && tables[0].values.length > 0) {
            tableNameRef.current = tables[0].values[0][0]; 
            console.log("Kullanılan Tablo:", tableNameRef.current);
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
        let rawObj: any = {};
        columns.forEach((col: string, i: number) => {
          rawObj[col.toLowerCase()] = row[i];
        });
        return {
            pos: rawObj['poz_no'] || rawObj['pos'] || rawObj['no'] || "---",
            desc: rawObj['tanim'] || rawObj['aciklama'] || rawObj['desc'] || "Tanımsız",
            unit: rawObj['birim'] || rawObj['unit'] || "adet",
            price: rawObj['birim_fiyat'] || rawObj['fiyat'] || rawObj['price'] || 0,
            category: rawObj['kategori'] || rawObj['category'] || "Genel"
        };
      });
    } catch (e) {
      console.warn("Sorgu hatası:", e);
      return [];
    }
  }, []);

  // --- 2. KOMŞU POZLARI GETİR (±5 SATIR) ---
  useEffect(() => {
    if (!dbReady || !tableNameRef.current) return;

    if (currentPos && searchTerm === '' && viewMode === 'all') {
      setLoading(true);
      setTimeout(() => {
        const table = tableNameRef.current;
        const safePos = currentPos.replace(/'/g, "''");
        
        let targetQuery = `SELECT rowid, * FROM "${table}" WHERE poz_no = '${safePos}' OR pos = '${safePos}' LIMIT 1`;
        let targetRes = execQuery(targetQuery);
        
        if (targetRes.length === 0) {
             // Fallback: Sütun adlarını kontrol et
             try {
                const res = dbRef.current.exec(`SELECT * FROM "${table}" LIMIT 1`);
                const cols = res[0].columns.map((c:string) => c.toLowerCase());
                if(cols.includes('no')) {
                     targetRes = execQuery(`SELECT rowid, * FROM "${table}" WHERE no = '${safePos}' LIMIT 1`);
                }
             } catch(e) {}
        }

        if (targetRes.length > 0) {
            // @ts-ignore
            // rowid'ye manuel erişmek gerekebilir çünkü execQuery mapliyor
            // Ancak biz burada basitleştirilmiş mantık kullanıyoruz.
            // Aslında yukarıdaki execQuery rowid döndürmeyebilir, bu yüzden manuel çekiyoruz:
            const rawRes = dbRef.current.exec(`SELECT rowid FROM "${table}" WHERE poz_no = '${safePos}' OR pos = '${safePos}' LIMIT 1`);
            if (rawRes.length > 0) {
                const targetRowId = rawRes[0].values[0][0];
                const startId = targetRowId - 5;
                const endId = targetRowId + 5;
                const neighbors = execQuery(`SELECT * FROM "${table}" WHERE rowid BETWEEN ${startId} AND ${endId} ORDER BY rowid ASC`);
                setAllResults(neighbors);
                setDisplayedResults(neighbors);
                setIsNeighborMode(true);
                setLoading(false);
                return;
            }
        }
        
        if (category) performSearch('');
        else setLoading(false);

      }, 100);
    } 
    else if (!currentPos && category && searchTerm === '' && viewMode === 'all') {
        performSearch('');
    }
  }, [dbReady, currentPos, category, viewMode]);

  // --- 3. ARAMA VE FİLTRELEME MANTIĞI ---
  useEffect(() => {
    if (!dbReady) return;

    const delayDebounceFn = setTimeout(() => {
      // Favoriler modundaysak, arama terimi favoriler içinde filtreleme yapar
      if (viewMode === 'favorites') {
         performSearch(searchTerm);
      } 
      // Tüm pozlar modundaysak
      else {
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
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, dbReady, viewMode]); // viewMode eklendi

  const performSearch = (term: string) => {
    setLoading(true);
    setTimeout(() => {
      const safeTerm = term.toLowerCase().replace(/'/g, "''");
      const table = tableNameRef.current;
      
      let query = `SELECT * FROM "${table}" WHERE 1=1`;
      const conditions = [];

      // --- FAVORİLER FİLTRESİ ---
      if (viewMode === 'favorites') {
          if (favorites.length === 0) {
              setAllResults([]);
              setDisplayedResults([]);
              setLoading(false);
              return;
          }
          // SQLite IN clause limiti olabilir, ama 100 favori için sorun olmaz
          // Poz numaralarını tırnak içine alıp virgülle birleştir
          const favList = favorites.map(f => `'${f.replace(/'/g, "''")}'`).join(',');
          
          // Veritabanındaki sütun adını tahmin etmeye çalışıyoruz
          // En güvenlisi OR ile hepsine bakmak
          conditions.push(`(poz_no IN (${favList}) OR pos IN (${favList}))`);
      }

      // --- METİN ARAMA ---
      if (safeTerm) {
        // En yaygın sütun isimlerinde arama yap
        // Veritabanı yapısını dinamik kontrol ediyoruz
        try {
            const res = dbRef.current.exec(`SELECT * FROM "${table}" LIMIT 1`);
            const cols = res[0].columns;
            const searchConditions = cols.map((col: string) => `lower("${col}") LIKE '%${safeTerm}%'`).join(' OR ');
            conditions.push(`(${searchConditions})`);
        } catch (e) {
             // Fallback
             conditions.push(`(lower(poz_no) LIKE '%${safeTerm}%' OR lower(tanim) LIKE '%${safeTerm}%')`);
        }
      }

      if (conditions.length > 0) {
        query += " AND " + conditions.join(" AND ");
      } else if (viewMode !== 'favorites') {
          // Eğer filtre yoksa ve favorilerde değilsek (Tümü sekmesi) 
          // ve arama boşsa (ve komşu modu değilse - yukarıda handle edildi), boş döndür
          // Ancak kategori varsa kategoriye göre getir
          // (Bu kısım üstteki useEffect tarafından yönetiliyor genelde)
      }
      
      query += " LIMIT 100"; 

      const data = execQuery(query);
      setAllResults(data);
      setPage(1);
      setDisplayedResults(data.slice(0, ITEMS_PER_PAGE));
      setLoading(false);
    }, 50);
  };

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
      
      {/* ÜST KISIM (ARAMA VE TABLAR) */}
      <div className="p-4 bg-white border-b border-slate-200 shadow-sm z-10 flex-shrink-0">
        
        {/* TABLAR */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-3 w-fit">
            <button 
                onClick={() => { setViewMode('all'); setSearchTerm(''); setIsNeighborMode(false); }}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center ${viewMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Database className="w-4 h-4 mr-2"/> Tüm Pozlar
            </button>
            <button 
                onClick={() => { setViewMode('favorites'); setSearchTerm(''); setIsNeighborMode(false); }}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center ${viewMode === 'favorites' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Star className={`w-4 h-4 mr-2 ${viewMode === 'favorites' ? 'fill-orange-500' : ''}`}/> Favorilerim
                <span className="ml-2 bg-slate-200 text-slate-600 text-xs px-1.5 rounded-full">{favorites.length}</span>
            </button>
        </div>

        {/* ARAMA INPUT */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            {loading ? <Loader className="w-5 h-5 animate-spin text-orange-500" /> : <Search className="w-5 h-5" />}
          </div>
          <input 
            type="text" 
            placeholder={
                !dbReady ? "Veritabanı Yükleniyor..." :
                viewMode === 'favorites' ? "Favorilerim içinde ara..." :
                isNeighborMode ? `Mevcut Poz (${currentPos}) ve çevresi...` : 
                "Poz No, Tanım veya Anahtar Kelime Ara..."
            }
            className={`w-full pl-12 pr-4 py-3 border rounded-xl outline-none transition-all shadow-inner text-slate-700 placeholder:text-slate-400 font-medium ${isNeighborMode ? 'bg-blue-50 border-blue-200 focus:ring-blue-300' : 'bg-slate-50 border-slate-200 focus:ring-orange-200'}`}
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                if(e.target.value.length > 0) setIsNeighborMode(false);
            }}
            disabled={!dbReady}
            autoFocus
          />
        </div>
        
        {/* BİLGİ ÇUBUĞU */}
        <div className="mt-2 flex justify-between items-center px-1">
             <div className="flex items-center space-x-2">
                {isNeighborMode && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 flex items-center animate-in fade-in zoom-in">
                        <ArrowUpDown className="w-3 h-3 mr-1"/> Yakın Pozlar
                    </span>
                )}
                {category && !isNeighborMode && viewMode === 'all' && (
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100 flex items-center">
                        <Filter className="w-3 h-3 mr-1"/> {category}
                    </span>
                )}
                <span className="text-xs font-semibold text-slate-500">
                    {allResults.length} sonuç
                </span>
             </div>
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
               const posVal = item.pos || "---";
               const isCurrent = currentPos && posVal === currentPos;
               const isFav = favorites.includes(posVal);
               
               return (
                <div 
                    key={`${posVal}-${index}`} 
                    onClick={() => onSelect(item)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all group relative animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        isCurrent 
                        ? 'bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-100' 
                        : 'bg-white border-slate-200 hover:border-orange-400 hover:shadow-md'
                    }`}
                >
                    <div className="flex justify-between items-start gap-3">
                        {/* Sol: Veriler */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                <span className={`font-mono text-sm font-black px-2 py-0.5 rounded-lg border ${isCurrent ? 'text-blue-700 bg-blue-100 border-blue-200' : 'text-orange-700 bg-orange-50 border-orange-100'}`}>
                                    {posVal}
                                </span>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                    {item.unit}
                                </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-snug font-medium line-clamp-2">
                                {item.desc}
                            </p>
                        </div>
                        
                        {/* Sağ: Aksiyonlar ve Fiyat */}
                        <div className="text-right flex flex-col items-end justify-between gap-2 min-w-[90px]">
                            <span className="font-black text-slate-800 text-lg tracking-tight">
                                {formatCurrency(Number(item.price))}
                            </span>
                            
                            <div className="flex items-center gap-2">
                                {/* FAVORİ BUTONU */}
                                <button 
                                    onClick={(e) => toggleFavorite(e, posVal)}
                                    className={`p-1.5 rounded-lg transition-colors border ${
                                        isFav 
                                        ? 'bg-yellow-50 border-yellow-200 text-yellow-500 hover:bg-yellow-100' 
                                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-yellow-500 hover:border-yellow-200'
                                    }`}
                                    title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                                >
                                    <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-500' : ''}`} />
                                </button>

                                {/* SEÇ BUTONU */}
                                <span className={`flex items-center text-xs font-bold text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors ${isCurrent ? 'bg-blue-600' : 'bg-green-600 group-hover:bg-green-700'}`}>
                                    {isCurrent ? 'SEÇİLİ' : 'EKLE'}
                                </span>
                            </div>
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
             ) : viewMode === 'favorites' && favorites.length === 0 ? (
                <>
                    <Star className="w-16 h-16 mb-4 text-slate-200"/>
                    <p className="text-lg font-bold text-slate-500">Henüz Favoriniz Yok</p>
                    <p className="text-sm">Sık kullandığınız pozları yıldızlayarak buraya ekleyebilirsiniz.</p>
                </>
             ) : (
               <>
                 <Search className="w-16 h-16 mb-4 text-slate-200"/>
                 <p className="text-lg font-bold text-slate-400">Sonuç Bulunamadı</p>
                 <p className="text-sm text-center px-6">"{searchTerm}" için eşleşen poz yok veya henüz arama yapmadınız.</p>
               </>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PozAramaMotoru;