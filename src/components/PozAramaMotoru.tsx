import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, BookOpen, AlertCircle, Loader, Filter } from 'lucide-react';
import { searchPoses } from '../db/dtabase'; // SQL Motoru bağlantısı
import { formatCurrency } from '../utils/helpers';

interface PozAramaMotoruProps {
  onSelect: (pose: any) => void;
  category?: string; // Opsiyonel kategori filtresi
}

const ITEMS_PER_PAGE = 20; // Altın Kural A: Her seferde kaç satır yüklenecek?

const PozAramaMotoru: React.FC<PozAramaMotoruProps> = ({ onSelect, category }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allResults, setAllResults] = useState<any[]>([]); // Tüm arama sonuçları (Veritabanından gelen ham veri)
  const [displayedResults, setDisplayedResults] = useState<any[]>([]); // Ekrana basılanlar (Pagination uygulanmış)
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  
  const listRef = useRef<HTMLDivElement>(null);

  // --- ALTIN KURAL C: DEBOUNCING (Bekletmeli Arama) ---
  useEffect(() => {
    // Kullanıcı yazmayı bıraktıktan 300ms sonra çalışır
    const delayDebounceFn = setTimeout(() => {
      // Eğer arama kutusu boşsa ve kategori yoksa arama yapma
      if (searchTerm.trim().length > 1 || category) { 
        performSearch(searchTerm);
      } else {
        // Boşsa temizle
        setAllResults([]);
        setDisplayedResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, category]);

  // --- Arama Mantığı ---
  const performSearch = (term: string) => {
    setLoading(true);
    
    // UI'ın kilitlenmesini önlemek için kısa bir gecikme ile işlemi sıraya alıyoruz
    setTimeout(() => {
      try {
        // Veritabanından sorgula (SQL LIKE işlemi burada çalışır - Altın Kural B)
        // Eğer arama kutusu boşsa ama kategori seçiliyse, o kategorideki her şeyi getirir.
        let data = searchPoses(term);
        
        // Eğer kategori zorunluluğu varsa filtrele (Örn: Sadece Duvar işleri)
        if (category) {
          data = data.filter((item: any) => item.category === category);
        }
        
        setAllResults(data);
        setPage(1); // Yeni aramada sayfayı başa sar
        setDisplayedResults(data.slice(0, ITEMS_PER_PAGE)); // İlk partiyi yükle
      } catch (error) {
        console.error("Arama hatası:", error);
      } finally {
        setLoading(false);
      }
    }, 10); 
  };

  // --- ALTIN KURAL A: LAZY LOADING (Infinite Scroll) ---
  const handleScroll = useCallback(() => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      
      // Listenin sonuna yaklaşıldı mı? (50px tolerans)
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        // Tüm sonuçlar zaten gösterilmediyse yeni parti yükle
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
      
      {/* --- ÜST KISIM: ARAMA KUTUSU --- */}
      <div className="p-5 bg-white border-b border-slate-200 shadow-sm z-10 flex-shrink-0">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            {loading ? <Loader className="w-5 h-5 animate-spin text-orange-500" /> : <Search className="w-5 h-5" />}
          </div>
          <input 
            type="text" 
            placeholder="Poz No, Tanım veya Anahtar Kelime Ara..." 
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-inner text-slate-700 placeholder:text-slate-400 font-medium text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
             
             <span className="text-[10px] font-bold text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <BookOpen className="w-3 h-3 mr-1"/> ÇŞB 2025 Veritabanı
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
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px] hidden sm:block" title={item.category}>
                              {item.category}
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
             {searchTerm ? (
               <>
                 <AlertCircle className="w-16 h-16 mb-4 text-slate-300"/>
                 <p className="text-lg font-bold text-slate-500">Sonuç Bulunamadı</p>
                 <p className="text-sm">"{searchTerm}" için eşleşen poz yok.</p>
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