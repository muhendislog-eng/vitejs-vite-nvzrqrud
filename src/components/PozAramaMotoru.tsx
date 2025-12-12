import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, BookOpen, AlertCircle, Loader, Filter, ArrowUpDown, Check } from 'lucide-react';
import { searchPoses, getNeighborPoses } from '../db/database';
import { formatCurrency } from '../utils/helpers';

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
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [isNeighborMode, setIsNeighborMode] = useState(false);
  
  const listRef = useRef<HTMLDivElement>(null);

  // --- İLK AÇILIŞ VE ARAMA MANTIĞI ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // 1. Durum: Arama kutusu doluysa normal arama yap
      if (searchTerm.trim().length > 1) {
        setIsNeighborMode(false);
        performSearch(searchTerm);
      } 
      // 2. Durum: Arama boşsa
      else if (searchTerm.trim().length === 0) {
        // Eğer mevcut bir poz varsa (Düzenleme moduysa) -> Komşuları getir
        if (currentPos && !searchTerm) {
           setLoading(true);
           // Veritabanı sorgusu hızlı olsa da UI akıcılığı için timeout içinde çağırıyoruz
           setTimeout(() => {
             const neighbors = getNeighborPoses(currentPos);
             if (neighbors && neighbors.length > 0) {
               setAllResults(neighbors);
               setDisplayedResults(neighbors);
               setIsNeighborMode(true);
             } else if (category) {
               // Komşu bulunamazsa veya poz yoksa kategoriye göre getir
               performSearch('');
             }
             setLoading(false);
           }, 50);
        } 
        // Eğer sadece kategori varsa -> O kategoriyi getir
        else if (category) {
            performSearch('');
        } 
        // Hiçbir şey yoksa -> Boş bırak
        else {
            setAllResults([]);
            setDisplayedResults([]);
            setIsNeighborMode(false);
        }
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, category, currentPos]);

  const performSearch = (term: string) => {
    setLoading(true);
    setTimeout(() => {
      try {
        let data = searchPoses(term);
        // Kategori filtresi varsa uygula
        if (category) {
          data = data.filter((item: any) => item.category === category);
        }
        setAllResults(data);
        setPage(1);
        setDisplayedResults(data.slice(0, ITEMS_PER_PAGE));
      } catch (error) {
        console.error("Arama hatası:", error);
      } finally {
        setLoading(false);
      }
    }, 10);
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
      
      {/* ÜST KISIM */}
      <div className="p-5 bg-white border-b border-slate-200 shadow-sm z-10 flex-shrink-0">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            {loading ? <Loader className="w-5 h-5 animate-spin text-orange-500" /> : <Search className="w-5 h-5" />}
          </div>
          <input 
            type="text" 
            placeholder={isNeighborMode ? `Mevcut Poz (${currentPos}) civarı listeleniyor...` : "Poz No, Tanım veya Anahtar Kelime Ara..."}
            className={`w-full pl-12 pr-4 py-4 border rounded-2xl outline-none transition-all shadow-inner text-slate-700 placeholder:text-slate-400 font-medium text-lg ${isNeighborMode ? 'bg-blue-50 border-blue-200 focus:ring-4 focus:ring-blue-100' : 'bg-slate-50 border-slate-200 focus:ring-4 focus:ring-orange-100 focus:border-orange-500'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
        
        <div className="mt-3 flex justify-between items-center px-1">
             <div className="flex items-center space-x-2">
                {isNeighborMode && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 flex items-center animate-in fade-in zoom-in duration-300">
                        <ArrowUpDown className="w-3 h-3 mr-1"/> Yakın Pozlar Listeleniyor
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
                <BookOpen className="w-3 h-3 mr-1"/> ÇŞB 2025
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
               // Eğer listedeki eleman şu an seçili olan poz ise (currentPos) vurgula
               const isCurrent = currentPos && item.pos === currentPos;
               
               return (
                <div 
                    key={`${item.pos}-${index}`} 
                    onClick={() => onSelect(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all group relative animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        isCurrent 
                        ? 'bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-100' 
                        : 'bg-white border-slate-200 hover:border-orange-400 hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                >
                    <div className="flex justify-between items-start gap-4">
                    
                    {/* Sol Taraf */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                            <span className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg border ${isCurrent ? 'text-blue-700 bg-blue-100 border-blue-200' : 'text-orange-700 bg-orange-50 border-orange-100'}`}>
                                {item.pos}
                            </span>
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                {item.unit}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[200px] hidden sm:block" title={item.category}>
                                {item.category}
                            </span>
                        </div>
                        <p className={`text-sm leading-relaxed font-medium line-clamp-2 ${isCurrent ? 'text-blue-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                            {item.desc}
                        </p>
                    </div>
                    
                    {/* Sağ Taraf */}
                    <div className="text-right flex flex-col items-end justify-between min-h-[60px]">
                        <span className="font-black text-slate-800 text-lg tracking-tight bg-slate-50 px-2 py-1 rounded-lg">
                            {formatCurrency(item.price)}
                        </span>
                        <span className={`flex items-center text-xs font-bold text-white px-4 py-2 rounded-lg shadow-sm transition-colors mt-2 ${isCurrent ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 group-hover:bg-green-700'}`}>
                            {isCurrent ? <Check className="w-3.5 h-3.5 mr-1.5"/> : <Plus className="w-3.5 h-3.5 mr-1.5" />} 
                            {isCurrent ? 'MEVCUT' : 'SEÇ'}
                        </span>
                    </div>
                    </div>
                </div>
               );
            })}
            
            {/* Yükleme Göstergesi */}
            {displayedResults.length < allResults.length && (
                <div className="py-4 text-center text-slate-400 text-sm flex items-center justify-center">
                    <Loader className="w-4 h-4 animate-spin mr-2"/> Daha fazlası yükleniyor...
                </div>
            )}
          </>
        ) : (
          /* BOŞ DURUM */
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