import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  AlertCircle,
  Loader,
  Filter,
  Check,
  Database,
  Pencil,
  ArrowUpDown,
  Undo2,
  Star,
  X,
} from 'lucide-react';
import { formatCurrency, loadScript } from '../utils/helpers';

declare global {
  interface Window {
    initSqlJs: any;
    SQL: any;
  }
}

interface PozAramaMotoruProps {
  onSelect: (pose: any) => void;
  category?: string; // UI’da gösterilebilir ama filtrelemede kullanılmıyor (istersen kaldır)
  currentPos?: string;
}

const SEARCH_LIMIT = 25;
const NEIGHBOR_RADIUS = 5;
const NEIGHBOR_LIMIT = NEIGHBOR_RADIUS * 2 + 1;

const FAVORITES_KEY = 'gkmetraj_favorites';
const MANUAL_KEY = 'gkmetraj_manual_pozlar';

// TR fiyat parse: "1.234,56" -> 1234.56
const toNumberTR = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;

  let s = String(v).trim();
  if (!s) return 0;

  s = s.replace(/\s/g, '');
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(',', '.');

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

type NormalizedPoz = {
  pos: string;
  desc: string;
  unit: string;
  price: number;
  source: 'db' | 'manual';
  createdAt?: number;
  // orijinal satırları da saklayalım (DB satırı seçilince bozulmasın)
  _raw?: any;
};

const PozCard = React.memo(function PozCard({
  item,
  isCurrent,
  isAnchor,
  isFav,
  onPick,
  onChange,
  onToggleFav,
  allowChange,
}: {
  item: NormalizedPoz;
  isCurrent: boolean;
  isAnchor: boolean;
  isFav: boolean;
  onPick: () => void;
  onChange: () => void;
  onToggleFav: (e: React.MouseEvent) => void;
  allowChange: boolean;
}) {
  const priceText = useMemo(() => formatCurrency(Number(item.price || 0)), [item.price]);

  return (
    <div
      style={{
        contentVisibility: 'auto' as any,
        contain: 'content',
        containIntrinsicSize: '120px',
      }}
      className={`p-3 rounded-xl border cursor-pointer transition-all group bg-white ${
        isAnchor
          ? 'border-blue-400 bg-blue-50/40'
          : isCurrent
          ? 'border-blue-300 shadow-sm ring-2 ring-blue-100'
          : 'border-slate-200 hover:border-orange-400 hover:shadow-md'
      }`}
      onClick={onPick}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1.5">
            <span
              className={`font-mono text-sm font-black px-2 py-0.5 rounded-lg border ${
                isAnchor
                  ? 'text-blue-700 bg-blue-100 border-blue-200'
                  : isCurrent
                  ? 'text-blue-700 bg-blue-100 border-blue-200'
                  : 'text-orange-700 bg-orange-50 border-orange-100'
              }`}
            >
              {item.pos || '---'}
            </span>

            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {item.unit || 'Adet'}
            </span>

            {isAnchor && (
              <span className="text-[10px] font-black text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md">
                MERKEZ
              </span>
            )}

            {item.source === 'manual' && (
              <span className="text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                MANUEL
              </span>
            )}
          </div>

          <p className="text-sm text-slate-700 leading-snug font-medium line-clamp-2">
            {item.desc || 'Tanımsız'}
          </p>
        </div>

        <div className="text-right flex flex-col items-end justify-between gap-2 min-w-[110px]">
          <span className="font-black text-slate-800 text-lg tracking-tight">
            {priceText}
          </span>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Favori */}
            <button
              type="button"
              onClick={onToggleFav}
              className={`p-1.5 rounded-lg transition-colors border ${
                isFav
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-500 hover:bg-yellow-100'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-yellow-500 hover:border-yellow-200'
              }`}
              title={isFav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
            >
              <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-500' : ''}`} />
            </button>

            {/* Değiştir (komşu) sadece DB itemlarında mantıklı */}
            {allowChange && item.source === 'db' && (
              <button
                type="button"
                onClick={onChange}
                className="p-1.5 rounded-lg transition-colors border bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                title="Bu pozun ±5 komşusunu göster"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}

            {/* Seç */}
            <span
              className={`inline-flex items-center text-xs font-bold text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors ${
                isCurrent ? 'bg-blue-600' : 'bg-green-600 group-hover:bg-green-700'
              }`}
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              {isCurrent ? 'SEÇİLİ' : 'SEÇ'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

const PozAramaMotoru: React.FC<PozAramaMotoruProps> = ({ onSelect, category, currentPos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allResults, setAllResults] = useState<NormalizedPoz[]>([]);
  const [displayedResults, setDisplayedResults] = useState<NormalizedPoz[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  // Favoriler
  const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Manual pozlar
  const [manualItems, setManualItems] = useState<NormalizedPoz[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  const [mPos, setMPos] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mPrice, setMPrice] = useState('');
  const [mUnit, setMUnit] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // ✅ Birimler DB’den (elle giriş yok)
  const [unitOptions, setUnitOptions] = useState<string[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // Komşu mod
  const [isNeighborMode, setIsNeighborMode] = useState(false);
  const [neighborAnchor, setNeighborAnchor] = useState<string | null>(null);

  const dbRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tableNameRef = useRef<string>('pozlar');

  const totalCap = useMemo(
    () => (isNeighborMode ? NEIGHBOR_LIMIT : SEARCH_LIMIT),
    [isNeighborMode]
  );

  /* ---------------- FAVORİ + MANUEL LOAD ---------------- */
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem(FAVORITES_KEY);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch {}

    try {
      const savedManual = localStorage.getItem(MANUAL_KEY);
      if (savedManual) {
        const parsed = JSON.parse(savedManual) as NormalizedPoz[];
        setManualItems(Array.isArray(parsed) ? parsed : []);
      }
    } catch {}
  }, []);

  const persistFavorites = useCallback((list: string[]) => {
    setFavorites(list);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  }, []);

  const persistManual = useCallback((list: NormalizedPoz[]) => {
    setManualItems(list);
    localStorage.setItem(MANUAL_KEY, JSON.stringify(list));
  }, []);

  const toggleFavorite = useCallback(
    (e: React.MouseEvent, pozNo: string) => {
      e.stopPropagation();
      let next: string[];
      if (favorites.includes(pozNo)) next = favorites.filter((x) => x !== pozNo);
      else next = [...favorites, pozNo];
      persistFavorites(next);

      // Favoriler sekmesindeyken çıkarılırsa UI anında güncellensin
      if (viewMode === 'favorites') {
        const updated = displayedResults.filter((x) => x.pos !== pozNo);
        setDisplayedResults(updated);
        setAllResults((prev) => prev.filter((x) => x.pos !== pozNo));
      }
    },
    [favorites, persistFavorites, viewMode, displayedResults]
  );

  /* ---------------- DB YÜKLE ---------------- */
  useEffect(() => {
    const initDB = async () => {
      try {
        setLoading(true);

        if (!window.initSqlJs) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js');
        }
        if (!window.initSqlJs) throw new Error('SQL.js yüklenemedi');

        const SQL = await window.initSqlJs({
          locateFile: (file: string) =>
            `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
        });

        const response = await fetch('/database.db');
        if (!response.ok) throw new Error('database.db dosyası bulunamadı!');

        const buffer = await response.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(buffer));
        dbRef.current = db;

        const tables = db.exec(`
          SELECT name FROM sqlite_master
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name
          LIMIT 1
        `);
        if (tables?.[0]?.values?.length) {
          tableNameRef.current = String(tables[0].values[0][0]);
        }

        setDbReady(true);
        setLoading(false);
      } catch (err) {
        console.error('DB Yükleme Hatası:', err);
        setLoading(false);
      }
    };

    initDB();
  }, []);

  /* ---------------- SQL ÇALIŞTIR + normalize ---------------- */
  const execQuery = useCallback((query: string) => {
    if (!dbRef.current) return [];
    try {
      const res = dbRef.current.exec(query);
      if (!res || res.length === 0) return [];

      const columns = res[0].columns.map((c: string) => c.toLowerCase());
      const values = res[0].values;

      return values.map((row: any[]) => {
        const raw: any = {};
        columns.forEach((col: string, i: number) => (raw[col] = row[i]));

        const pos = String(raw['poz_no'] ?? raw['pos'] ?? raw['no'] ?? '---');
        const desc = String(raw['tanim'] ?? raw['aciklama'] ?? raw['desc'] ?? 'Tanımsız');
        const unit = String(raw['birim'] ?? raw['unit'] ?? 'Adet');
        const price = toNumberTR(raw['birim_fiyat'] ?? raw['fiyat'] ?? raw['price'] ?? 0);

        const normalized: NormalizedPoz = {
          pos,
          desc,
          unit,
          price,
          source: 'db',
          _raw: raw,
        };

        return normalized;
      });
    } catch (e) {
      console.warn('Sorgu hatası:', e);
      return [];
    }
  }, []);

  /* ---------------- DB’den birimleri çek (DISTINCT birim) ---------------- */
  const loadUnits = useCallback(() => {
    if (!dbRef.current) return;
    setUnitsLoading(true);
    try {
      const table = tableNameRef.current;
      const res = dbRef.current.exec(`
        SELECT DISTINCT birim
        FROM "${table}"
        WHERE birim IS NOT NULL AND TRIM(birim) <> ''
      `);

      const list =
        res?.[0]?.values?.map((v: any[]) => String(v[0]).trim()) ?? [];

      const uniq = Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'tr'));
      const finalList = uniq.length ? uniq : ['Adet'];

      setUnitOptions(finalList);
      setMUnit((prev) => (prev && finalList.includes(prev) ? prev : finalList[0]));
    } catch (e) {
      setUnitOptions(['Adet']);
      setMUnit('Adet');
    } finally {
      setUnitsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dbReady) loadUnits();
  }, [dbReady, loadUnits]);

  /* ---------------- Manuel poz ekle ---------------- */
  const addManualPoz = useCallback(() => {
    setManualError(null);

    const pos = mPos.trim();
    const desc = mDesc.trim();
    const price = toNumberTR(mPrice);

    if (!pos || !desc) {
      setManualError('Poz No ve Tanım zorunludur.');
      return;
    }

    if (!mUnit || !unitOptions.includes(mUnit)) {
      setManualError('Birim sadece veritabanındaki seçeneklerden seçilmelidir.');
      return;
    }

    const newItem: NormalizedPoz = {
      pos,
      desc,
      unit: mUnit,
      price,
      source: 'manual',
      createdAt: Date.now(),
    };

    const next = [newItem, ...manualItems.filter((x) => x.pos !== pos)];
    persistManual(next);

    // İstersen otomatik favoriye ekleyelim (kullanışlı)
    // persistFavorites(favorites.includes(pos) ? favorites : [...favorites, pos]);

    // Seçim aksiyonu
    onSelect({
      pos: newItem.pos,
      desc: newItem.desc,
      unit: newItem.unit,
      price: newItem.price,
      source: 'manual',
    });

    setManualOpen(false);
    setMPos('');
    setMDesc('');
    setMPrice('');
    setManualError(null);
  }, [mPos, mDesc, mPrice, mUnit, unitOptions, manualItems, persistManual, onSelect]);

  /* ---------------- Komşu pozlar (±5) - rowid kesin yöntem ---------------- */
  const showNeighbors = useCallback(
    (pozNo: string) => {
      if (!dbReady) return;

      const table = tableNameRef.current;
      const safePos = pozNo.replace(/'/g, "''");

      setLoading(true);
      setTimeout(() => {
        const target = execQuery(`
          SELECT rowid as rowid
          FROM "${table}"
          WHERE poz_no = '${safePos}' OR pos = '${safePos}' OR no = '${safePos}'
          LIMIT 1
        `);

        // execQuery normalize ettiği için rowid’yi _raw’dan alacağız
        const ridRaw = target?.[0]?._raw?.rowid;
        if (ridRaw == null) {
          console.warn('Hedef poz bulunamadı:', pozNo);
          setLoading(false);
          return;
        }

        const rid = Number(ridRaw);
        const start = rid - NEIGHBOR_RADIUS;
        const end = rid + NEIGHBOR_RADIUS;

        const neighbors = execQuery(`
          SELECT rowid as rowid, poz_no, tanim, birim, birim_fiyat
          FROM "${table}"
          WHERE rowid BETWEEN ${start} AND ${end}
          ORDER BY rowid ASC
          LIMIT ${NEIGHBOR_LIMIT}
        `);

        setIsNeighborMode(true);
        setNeighborAnchor(pozNo);
        setSearchTerm('');
        setViewMode('all'); // komşu modu “tüm pozlar” mantığında çalışır
        setAllResults(neighbors);
        setDisplayedResults(neighbors);
        if (listRef.current) listRef.current.scrollTop = 0;

        setLoading(false);
      }, 40);
    },
    [dbReady, execQuery]
  );

  const handleBackToList = useCallback(() => {
    setIsNeighborMode(false);
    setNeighborAnchor(null);
    setSearchTerm('');
    // geri dönünce “tüm pozlar” listesine döner (limit 25)
    setViewMode('all');
  }, []);

  /* ---------------- Arama / Favori / Manuel merge mantığı ---------------- */
  const computeManualMatches = useCallback(
    (term: string) => {
      const t = term.trim().toLowerCase();
      if (!t) return manualItems;
      return manualItems.filter((m) => {
        return (
          m.pos.toLowerCase().includes(t) ||
          m.desc.toLowerCase().includes(t) ||
          String(m.unit).toLowerCase().includes(t)
        );
      });
    },
    [manualItems]
  );

  const performSearch = useCallback(
    (term: string) => {
      if (!dbReady) return;

      const safeTerm = term.toLowerCase().replace(/'/g, "''");
      const table = tableNameRef.current;

      setLoading(true);
      setTimeout(() => {
        // 1) MANUEL eşleşmeleri al (ALL veya FAVORITES’ta kullanılacak)
        const manualMatchesAll = computeManualMatches(term);

        // 2) DB sorgusu
        let query = `SELECT rowid as rowid, poz_no, tanim, birim, birim_fiyat FROM "${table}" WHERE 1=1`;
        const conditions: string[] = [];

        if (viewMode === 'favorites') {
          // Favorilerde: DB’den favori pozları çek
          if (favorites.length === 0) {
            const manualFavs = manualMatchesAll.filter((m) => favorites.includes(m.pos));
            setAllResults(manualFavs.slice(0, SEARCH_LIMIT));
            setDisplayedResults(manualFavs.slice(0, SEARCH_LIMIT));
            setLoading(false);
            return;
          }
          const favList = favorites.map((f) => `'${f.replace(/'/g, "''")}'`).join(',');
          conditions.push(`(poz_no IN (${favList}) OR pos IN (${favList}) OR no IN (${favList}))`);
        }

        if (safeTerm) {
          conditions.push(`(lower(poz_no) LIKE '%${safeTerm}%' OR lower(tanim) LIKE '%${safeTerm}%')`);
        }

        if (conditions.length > 0) query += ` AND ${conditions.join(' AND ')}`;

        query += ` ORDER BY rowid ASC LIMIT ${SEARCH_LIMIT}`;

        const dbData = execQuery(query) as NormalizedPoz[];

        // 3) Manual + DB merge
        let merged: NormalizedPoz[] = [];

        if (viewMode === 'favorites') {
          const manualFavs = manualMatchesAll.filter((m) => favorites.includes(m.pos));
          merged = [...manualFavs, ...dbData].slice(0, SEARCH_LIMIT);
        } else {
          // ALL mod: manual eşleşmeleri üste koy (kullanışlı), sonra DB
          merged = [...manualMatchesAll, ...dbData]
            // aynı pos iki kez gelmesin
            .filter((x, idx, arr) => arr.findIndex((y) => y.pos === x.pos && y.source === x.source) === idx)
            .slice(0, SEARCH_LIMIT);
        }

        setIsNeighborMode(false);
        setNeighborAnchor(null);

        setAllResults(merged);
        setDisplayedResults(merged);
        setLoading(false);
      }, 60);
    },
    [dbReady, execQuery, viewMode, favorites, computeManualMatches]
  );

  /* ---------------- İlk açılış: ALL modda boş arama => ilk 25 (DB + manuel) ---------------- */
  useEffect(() => {
    if (!dbReady) return;
    if (viewMode === 'all') {
      // boş arama: manuel + ilk 25 DB
      performSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady]);

  /* ---------------- currentPos gelirse otomatik komşu ---------------- */
  useEffect(() => {
    if (!dbReady) return;
    if (currentPos && searchTerm.trim() === '' && viewMode === 'all') {
      showNeighbors(currentPos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady, currentPos]);

  /* ---------------- Input debounce (Kritik: neighbor mode + boş input => bozma) ---------------- */
  useEffect(() => {
    if (!dbReady) return;

    const t = setTimeout(() => {
      const v = searchTerm.trim();

      // Komşu moddayken input boşsa: listeyi bozma
      if (isNeighborMode && v === '') return;

      // Kullanıcı yazarsa neighbor moddan çık
      if (v.length > 0) setIsNeighborMode(false);

      // Favorilerde: tek karakterle de arat (favoriler içinde filtre mantıklı)
      if (viewMode === 'favorites') {
        performSearch(v);
        return;
      }

      // ALL mod
      if (v.length > 0) performSearch(v);
      else performSearch('');
    }, 250);

    return () => clearTimeout(t);
  }, [searchTerm, dbReady, performSearch, isNeighborMode, viewMode]);

  /* ---------------- View mode değişince listeyi yenile ---------------- */
  useEffect(() => {
    if (!dbReady) return;

    // Komşu moddayken tab değişirse komşuyu kapat
    if (isNeighborMode) {
      setIsNeighborMode(false);
      setNeighborAnchor(null);
    }
    setSearchTerm('');
    performSearch('');
  }, [viewMode, dbReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl overflow-hidden border border-slate-200">
      {/* ÜST KISIM */}
      <div className="p-4 bg-white border-b border-slate-200 shadow-sm z-10 flex-shrink-0">
        {/* TABLAR */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-3 w-fit">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center ${
              viewMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Database className="w-4 h-4 mr-2" /> Tüm Pozlar
          </button>

          <button
            onClick={() => setViewMode('favorites')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center ${
              viewMode === 'favorites'
                ? 'bg-white text-orange-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Star className={`w-4 h-4 mr-2 ${viewMode === 'favorites' ? 'fill-orange-500' : ''}`} />
            Favorilerim
            <span className="ml-2 bg-slate-200 text-slate-600 text-xs px-1.5 rounded-full">
              {favorites.length}
            </span>
          </button>
        </div>

        {/* ARAMA + POZ EKLE */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
              {loading ? (
                <Loader className="w-5 h-5 animate-spin text-orange-500" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>
            <input
              type="text"
              placeholder={
                !dbReady
                  ? 'Veritabanı Yükleniyor...'
                  : viewMode === 'favorites'
                  ? 'Favorilerim içinde ara...'
                  : isNeighborMode
                  ? `Komşu pozlar (±${NEIGHBOR_RADIUS}) — ${neighborAnchor ?? ''}`
                  : 'Poz No veya Tanım ara... (maks. 25 sonuç)'
              }
              className={`w-full pl-12 pr-4 py-3 border rounded-xl outline-none transition-all shadow-inner text-slate-700 placeholder:text-slate-400 font-medium ${
                isNeighborMode ? 'bg-blue-50 border-blue-200 focus:ring-blue-300' : 'bg-slate-50 border-slate-200 focus:ring-orange-200'
              }`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.length > 0) setIsNeighborMode(false);
              }}
              disabled={!dbReady}
              autoFocus
            />
          </div>

          <button
            type="button"
            disabled={!dbReady}
            onClick={() => {
              setManualOpen((p) => !p);
              setManualError(null);
              // birimler yoksa tekrar çek
              if (dbReady && unitOptions.length === 0) loadUnits();
            }}
            className={`h-[46px] px-4 rounded-xl font-bold text-sm inline-flex items-center gap-2 border transition-colors ${
              !dbReady
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title="Manuel poz ekle"
          >
            <Plus className="w-4 h-4" />
            Poz Ekle
          </button>
        </div>

        {/* MANUEL POZ EKLE PANEL */}
        {manualOpen && (
          <div className="mt-3 p-4 rounded-xl border border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <div className="font-black text-slate-700 text-sm">Manuel Poz Ekle</div>
              <button
                type="button"
                onClick={() => {
                  setManualOpen(false);
                  setManualError(null);
                }}
                className="p-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-700"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-600 mb-1">Poz No</label>
                <input
                  value={mPos}
                  onChange={(e) => setMPos(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="15.XXX.XXXX"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">Tanım</label>
                <input
                  value={mDesc}
                  onChange={(e) => setMDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Açıklama / tanım..."
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-600 mb-1">Birim (DB)</label>
                <select
                  value={mUnit}
                  onChange={(e) => setMUnit(e.target.value)}
                  disabled={!dbReady || unitsLoading || unitOptions.length === 0}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
                >
                  {unitOptions.length === 0 ? (
                    <option value="">Birim yok</option>
                  ) : (
                    unitOptions.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))
                  )}
                </select>
                <div className="text-[10px] text-slate-500 mt-1">
                  Elle giriş kapalı. Birimler DB’den gelir.
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-600 mb-1">Birim Fiyat</label>
                <input
                  value={mPrice}
                  onChange={(e) => setMPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="0"
                />
              </div>
            </div>

            {manualError && (
              <div className="mt-2 text-sm font-bold text-red-600">
                {manualError}
              </div>
            )}

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setManualOpen(false);
                  setManualError(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={addManualPoz}
                disabled={!dbReady || unitsLoading || !mUnit}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:bg-slate-300"
              >
                Kaydet / Seç
              </button>
            </div>
          </div>
        )}

        {/* BİLGİ ÇUBUĞU */}
        <div className="mt-2 flex justify-between items-center px-1">
          <div className="flex items-center space-x-2">
            {isNeighborMode && (
              <>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 flex items-center">
                  <ArrowUpDown className="w-3 h-3 mr-1" /> Yakın Pozlar
                </span>
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Undo2 className="w-3 h-3" />
                  Listeye Dön
                </button>
              </>
            )}

            {/* Kategori/etiket filtrelemesi yok; sadece istersen label olarak göster */}
            {category && !isNeighborMode && viewMode === 'all' && (
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100 flex items-center">
                <Filter className="w-3 h-3 mr-1" /> {category}
              </span>
            )}

            <span className="text-xs font-semibold text-slate-500">
              {allResults.length} sonuç (maks. {totalCap})
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
              dbReady
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-slate-600 bg-slate-100 border-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            {dbReady ? 'DB Bağlı' : 'Yükleniyor'}
          </span>
        </div>
      </div>

      {/* LİSTE ALANI */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30"
        ref={listRef}
        style={{ willChange: 'transform', transform: 'translateZ(0)', contain: 'content' as any }}
      >
        {displayedResults.length > 0 ? (
          displayedResults.map((item: NormalizedPoz, index: number) => {
            const posVal = item.pos || '---';
            const isCurrent = Boolean(currentPos && posVal === currentPos);
            const isAnchor = Boolean(isNeighborMode && neighborAnchor && posVal === neighborAnchor);
            const isFav = favorites.includes(posVal);

            return (
              <PozCard
                key={`${item.source}-${posVal}-${index}`}
                item={item}
                isCurrent={isCurrent}
                isAnchor={isAnchor}
                isFav={isFav}
                allowChange={viewMode === 'all' && !manualOpen}
                onToggleFav={(e) => toggleFavorite(e, posVal)}
                onPick={() => {
                  // Seçildiğinde: manuel ise direkt kendisini gönder
                  if (item.source === 'manual') {
                    onSelect({
                      pos: item.pos,
                      desc: item.desc,
                      unit: item.unit,
                      price: Number(item.price || 0),
                      source: 'manual',
                    });
                    return;
                  }

                  // DB ise _raw’ı da gönderelim (mevcut kodunu bozmasın)
                  const raw = item._raw ?? {};
                  onSelect({
                    ...raw,
                    pos: item.pos,
                    desc: item.desc,
                    unit: item.unit,
                    price: Number(item.price || 0),
                    source: 'db',
                  });
                }}
                onChange={() => showNeighbors(posVal)}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-70 pb-10">
            {!dbReady ? (
              <>
                <Loader className="w-12 h-12 mb-4 animate-spin text-slate-300" />
                <p className="text-sm">Veritabanı Yükleniyor...</p>
              </>
            ) : viewMode === 'favorites' && favorites.length === 0 ? (
              <>
                <Star className="w-16 h-16 mb-4 text-slate-200" />
                <p className="text-lg font-bold text-slate-500">Henüz Favoriniz Yok</p>
                <p className="text-sm text-center px-6">
                  Sık kullandığınız pozları yıldızlayarak buraya ekleyebilirsiniz.
                </p>
              </>
            ) : searchTerm ? (
              <>
                <AlertCircle className="w-16 h-16 mb-4 text-slate-200" />
                <p className="text-lg font-bold text-slate-400">Sonuç Bulunamadı</p>
                <p className="text-sm text-center px-6">"{searchTerm}" için eşleşen poz yok.</p>
              </>
            ) : (
              <>
                <Search className="w-16 h-16 mb-4 text-slate-200" />
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
          Gösterilen: {displayedResults.length} / {totalCap}
        </p>
      </div>
    </div>
  );
};

export default PozAramaMotoru;
