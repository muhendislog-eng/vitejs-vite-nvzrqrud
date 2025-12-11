import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, BookOpen, AlertCircle, Loader, Filter } from 'lucide-react';
import initSqlJs from 'sql.js';

// Yardımcı Fonksiyon: Para Formatı
const formatCurrency = (amount: number) => {
  const safeAmount = isNaN(amount) || amount === null ? 0 : amount;
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(safeAmount);
};

interface PozAramaMotoruProps {
  onSelect: (pose: any) => void;
  category?: string; 
}

const ITEMS_PER_PAGE = 20;

const PozAramaMotoru: React.FC<PozAramaMotoruProps> = ({ onSelect, category }) => {
  // --- STATE TANIMLARI ---
  const [db, setDb] = useState<any>(null);
  const [dbReady, setDbReady] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [allResults, setAllResults] = useState<any[]>([]);
  const [displayedResults, setDisplayedResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  // --- 1. ADIM: VERİTABANINI YÜKLEME ---
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: file => `https://sql.js.org/dist/${file}`
        });
        
        // DİKKAT: Dosya adı database.db olarak sabitlenmiştir.
        const response = await fetch('/database.db'); 
        if (!response.ok) throw new Error("database.db dosyası bulunamadı! Public klasörünü kontrol edin.");
        
        const buffer = await response.arrayBuffer();
        const database = new SQL.Database(new Uint8Array(buffer));
        
        setDb(database);
        setDbReady(true);
      } catch (err: any) {
        console.error("Veritabanı yükleme hatası:", err.message);
      }
    };
    loadDatabase();
  }, []);

  // --- 2. ADIM: DEBOUNCING (Bekletmeli Arama) ---
  useEffect(() => {
    if (!dbReady) return;

    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1 || category) { 
        performSearch(searchTerm);
      } else {
        setAllResults([]);
        setDisplayedResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, category, dbReady]);

  // --- 3. ADIM: Arama Mantığı (TRIM ve CAST Uygulandı) ---
  const performSearch = (term: string) => {
    if (!db) return;
    setLoading(true);
    
    setTimeout(() => {
      try {
        // SORGU GÜNCELLENDİ: CAST AS TEXT ve TRIM uygulandı.
        const query = `
            SELECT * FROM pozlar 
            WHERE TRIM(CAST(poz_no AS TEXT)) LIKE :term OR TRIM(tanim) LIKE :term
            ORDER BY poz_no ASC
        `;
        
        const stmt = db.prepare(query);
        // Arama teriminin başındaki/sonundaki boşlukları da temizliyoruz
        stmt.bind({ ':term': `%${term.trim()}%` }); 
        
        const results = [];
        while (stmt.step()) {
            const row: any = stmt.getAsObject();
            results.push({
                // Sütun Adları: poz_no, tanim, birim, birim_fiyat (Küçük harf olarak teyit edildi)
                pos: row.poz_no,
                desc: row.tanim,
                unit: row.birim,
                // price: DB'de fiyat zaten TEXT gibi görünüyor, bu yüzden parseFloat ile güvene aldık
                price: parseFloat(row.birim_fiyat), 
                category: "İnşaat" 
            });
        }
        stmt.free();

        let filteredData = results;
        if (category) {
          filteredData = results.filter((item: any) => item.category === category);
        }
        
        setAllResults(filteredData);
        setPage(1);
        setDisplayedResults(filteredData.slice(0, ITEMS_PER_PAGE)); 
      } catch (error) {
        console.error("SQL Arama hatası:", error);
      } finally {
        setLoading(false);
      }
    }, 10); 
  };

  // --- 4. ADIM: LAZY LOADING ---
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

  // --- JSX / GÖRÜNÜM KISMI ---
  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl overflow-hidden border border-slate-200">
      
      {/* --- ÜST KISIM: ARAMA KUTUSU --- */}
      <div className="p-5 bg-white border-b border-slate-200 shadow-sm z-10 flex-shrink-0">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            {loading ? <Loader className="w-5 h-5 animate-spin text-orange-500" /> : <Search className="w-5 h-5" />}
          </div>
          <input 
            type="text" 
            placeholder={dbReady ? "Poz No, Tanım veya Anahtar Kelime Ara..." : "Veritabanı Yükleniyor..."} 
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-inner text-slate-700 placeholder:text-slate-400 font-medium text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!dbReady} 
            autoFocus
          />
        </div>
        
        <div className="mt-3 flex justify-between items-center px-1">
             <div className="flex items-center space-x-2">
                {category && (
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100 flex items-center">
                        <Filter className="w-3 h-3 mr-1"/> {category} Filtresi Aktif
                    </span>
                )}
                {!loading && allResults.length > 0 && (
                    <span className="text-xs font-semibold text-slate-500">
                        Toplam {allResults.length} sonuç bulundu
                    </span>
                )}
             </div>
             
             <span className={`text-[10px] font-bold flex items-center px-2 py-1 rounded-full border ${dbReady ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
                <BookOpen className="w-3 h-3 mr-1"/> {dbReady ? 'ÇŞB 2025 Veritabanı Aktif' : 'Veritabanı Yükleniyor...'}
             </span>
        </div>
      </div>

      {/* --- LİSTE ALANI (SCROLLABLE) --- */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 custom-scrollbar"
        ref={listRef}
        onScroll={handleScroll}
      >
        {displayedResults.length > 0 ? (
          <>
            {displayedResults.map((item: any, index: number) => (
              <div 
                key={`${item.pos}-${index}`} 
                onClick={() => onSelect(item)}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer transition-all group relative animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex justify-between items-start gap-4">
                  
                  {/* Sol Taraf: Bilgiler */}
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                          <span className="font-mono text-sm font-black text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                              {item.pos}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                              {item.unit}
                          </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium group-hover:text-slate-900 line-clamp-2">
                          {item.desc}
                      </p>
                  </div>
                  
                  {/* Sağ Taraf: Fiyat ve Buton */}
                  <div className="text-right flex flex-col items-end justify-between min-h-[60px]">
                      <span className="font-black text-slate-800 text-lg tracking-tight bg-slate-50 px-2 py-1 rounded-lg">
                          {formatCurrency(item.price)}
                      </span>
                      <span className="flex items-center text-xs font-bold text-white bg-green-600 px-4 py-2 rounded-lg shadow-sm group-hover:bg-green-700 transition-colors mt-2">
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> EKLE
                      </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Yükleniyor İndikatörü (Infinite Scroll için) */}
            {displayedResults.length < allResults.length && (
                <div className="py-4 text-center text-slate-400 text-sm flex items-center justify-center">
                    <Loader className="w-4 h-4 animate-spin mr-2"/> Daha fazlası yükleniyor...
                </div>
            )}
          </>
        ) : (
          /* --- BOŞ DURUM --- */
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60 pb-10">
             {!dbReady ? (
                <>
                    <Loader className="w-16 h-16 mb-4 animate-spin text-orange-400"/>
                    <p className="text-lg font-bold text-slate-500">Veritabanı Yükleniyor...</p>
                    <p className="text-sm">Lütfen bekleyin. Büyük bir dosya okunuyor.</p>
                </>
             ) : searchTerm ? (
               <>
                 <AlertCircle className="w-16 h-16 mb-4 text-slate-300"/>
                 <p className="text-lg font-bold text-slate-500">Sonuç Bulunamadı</p>
                 <p className="text-sm">"{searchTerm}" için eşleşen poz yok.</p>
               </>
             ) : (
               <>
                 <Search className="w-16 h-16 mb-4 text-slate-200"/>
                 <p className="text-lg font-bold text-slate-400">Aramaya Başlayın</p>
                 <p className="text-sm">Poz numarası veya tanım yazın.</p>
               </>
             )}
          </div>
        )}
      </div>
      
      {/* Footer Bilgisi */}
      <div className="bg-slate-50 border-t border-slate-200 p-2 text-center">
          <p className="text-[10px] text-slate-400 font-mono">
              Gösterilen: {displayedResults.length} / {allResults.length} kayıt
          </p>
      </div>
    </div>
  );
};

export default PozAramaMotoru;