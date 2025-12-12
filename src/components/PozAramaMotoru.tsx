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
  category?: string;
  currentPos?: string;
}

const SEARCH_LIMIT = 25;
const NEIGHBOR_RADIUS = 5;
const NEIGHBOR_LIMIT = NEIGHBOR_RADIUS * 2 + 1;

const FAVORITES_KEY = 'gkmetraj_favorites';
const MANUAL_KEY = 'gkmetraj_manual_pozlar';

// ✅ Birimler sadece bunlar (elle yazmak yok, DB’den çekmek yok)
const UNIT_OPTIONS = ['Kg', 'li', 'm', 'm²', 'm³', 'n', 'Ton'] as const;

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
  _raw?: any; // db satırı
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
          ? 'bg-blue-50 border-blue-300 shadow-sm ring-2 ring-blue-100'
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

        <div className="text-right flex flex-col items-end justify-between gap-2 min-w-[120px]">
          <span className="font-black text-slate-800 text-lg tracking-tight">{priceText}</span>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onToggleFav}
              className={`p-1.5 rounded-lg transition-colors border ${
                isFav
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-yellow-600 hover:border-yellow-200'
              }`}
              title={isFav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
            >
              <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-500' : ''}`} />
            </button>

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

  const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Manual pozlar
  const [manualItems, setManualItems] = useState<NormalizedPoz[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  const [mPos, setMPos] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mPrice, setMPrice] = useState('');
  const [mUnit, setMUnit] = useState<(typeof UNIT_OPTIONS)[number]>('Kg');
  const [manualError, setManualError] = useState<string | null>(null);

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

  /* ---------- localStorage load ---------- */
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

  /* ---------- FAVORİ toggle (favori sırasını korur) ---------- */
  const toggleFavorite = useCallback(
    (e: React.MouseEvent, pozNo: string) => {
      e.stopPropagation();
      const p = String(pozNo).trim();

      let next: string[];
      if (favorites.includes(p)) next = favorites.filter((x) => x !== p);
      else next = [...favorites, p]; // ✅ ekleme sırası korunur
      persistFavorites(next);

      if (viewMode === 'favorites') {
        // favoriden çıkardıysa UI’dan kaldır
        if (!next.includes(p)) {
          setAllResults((prev) => prev.filter((x) => x.pos !== p));
          setDisplayedResults((prev) => prev.filter((x) => x.pos !== p));
        }
      }
    },
    [favorites, persistFavorites, viewMode]
  );

  /* ---------- DB init ---------- */
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

  /* ---------- exec + normalize ---------- */
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

        const pos = String(raw['poz_no'] ?? raw['pos'] ?? raw['no'] ?? '---').trim();
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

  /* ---------- Manual poz ekle ---------- */
  const addManualPoz = useCallback(() => {
    setManualError(null);

    const pos = mPos.trim();
    const desc = mDesc.trim();
    const price = toNumberTR(mPrice);

    if (!pos || !desc) {
      setManualError('Poz No ve Tanım zorunludur.');
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

    // Kaydet/Seç dediğinde parent’a standard + db-key uyumlu payload gönder
    onSelect({
      pos: newItem.pos,
      desc: newItem.desc,
      unit: newItem.unit,
      price: Number(newItem.price || 0),

      // ✅ parent tarafı bunları bekliyorsa diye
      poz_no: newItem.pos,
      tanim: newItem.desc,
      birim: newItem.unit,
      birim_fiyat: Number(newItem.price || 0),

      source: 'manual',
    });

    setManualOpen(false);
    setMPos('');
    setMDesc('');
    setMPrice('');
    setManualError(null);
  }, [mPos, mDesc, mPrice, mUnit, manualItems, persistManual, onSelect]);

  /* ---------- Komşu pozlar (±5) ---------- */
  const showNeighbors = useCallback(
    (pozNo: string) => {
      if (!dbReady) return;

      const table = tableNameRef.current;
      const safePos = String(pozNo).trim().replace(/'/g, "''");

      setLoading(true);
      setTimeout(() => {
        const target = execQuery(`
          SELECT rowid as rowid
          FROM "${table}"
          WHERE poz_no = '${safePos}' OR pos = '${safePos}' OR no = '${safePos}'
          LIMIT 1
        `);

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
        setNeighborAnchor(String(pozNo).trim());
        setSearchTerm('');
        setViewMode('all');
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
    setViewMode('all');
  }, []);

  /* ---------- Manual filtre ---------- */
  const manualMatches = useCallback(
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

  /* ---------- Arama ---------- */
  const performSearch = useCallback(
    (term: string) => {
      if (!dbReady) return;

      const t = term.trim();
      const safeTerm = t.toLowerCase().replace(/'/g, "''");
      const table = tableNameRef.current;

      setLoading(true);
      setTimeout(() => {
        const manAll = manualMatches(t);

        // FAVORITES MODE
        if (viewMode === 'favorites') {
          const favSet = new Set(favorites.map((x) => String(x).trim()));
          const manFavs = manAll.filter((m) => favSet.has(m.pos));

          if (favorites.length === 0) {
            const mergedOnly = manFavs.slice(0, SEARCH_LIMIT);
            setAllResults(mergedOnly);
            setDisplayedResults(mergedOnly);
            setLoading(false);
            return;
          }

          const favList = favorites.map((f) => `'${String(f).trim().replace(/'/g, "''")}'`).join(',');

          // ✅ LIMIT’i SQL’de değil JS’de kesiyoruz; favori sayısı az olduğu için performans sorunu yok
          let q = `
            SELECT rowid as rowid, poz_no, tanim, birim, birim_fiyat
            FROM "${table}"
            WHERE (poz_no IN (${favList}) OR pos IN (${favList}) OR no IN (${favList}))
          `;

          if (safeTerm) {
            q += ` AND (lower(poz_no) LIKE '%${safeTerm}%' OR lower(tanim) LIKE '%${safeTerm}%')`;
          }

          const dbFavs = execQuery(q) as NormalizedPoz[];

          // ✅ Favori sırasını koru
          const idx = (p: string) => favorites.findIndex((x) => String(x).trim() === String(p).trim());
          dbFavs.sort((a, b) => idx(a.pos) - idx(b.pos));

          const merged = [...manFavs, ...dbFavs].slice(0, SEARCH_LIMIT);
          setAllResults(merged);
          setDisplayedResults(merged);
          setLoading(false);
          return;
        }

        // ALL MODE
        let query = `
          SELECT rowid as rowid, poz_no, tanim, birim, birim_fiyat
          FROM "${table}"
          WHERE 1=1
        `;

        if (safeTerm) {
          query += ` AND (lower(poz_no) LIKE '%${safeTerm}%' OR lower(tanim) LIKE '%${safeTerm}%')`;
        }

        query += ` ORDER BY rowid ASC LIMIT ${SEARCH_LIMIT}`;

        const dbData = execQuery(query) as NormalizedPoz[];

        // manual üstte + db (aynı pos tekrar gelmesin)
        const merged = [...manAll, ...dbData]
          .filter((x, i, arr) => arr.findIndex((y) => y.pos === x.pos && y.source === x.source) === i)
          .slice(0, SEARCH_LIMIT);

        setIsNeighborMode(false);
        setNeighborAnchor(null);
        setAllResults(merged);
        setDisplayedResults(merged);
        setLoading(false);
      }, 60);
    },
    [dbReady, execQuery, viewMode, favorites, manualMatches]
  );

  /* ---------- İlk açılış ---------- */
  useEffect(() => {
    if (!dbReady) return;
    performSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady]);

  /* ---------- currentPos otomatik komşu ---------- */
  useEffect(() => {
    if (!dbReady) return;
    if (currentPos && searchTerm.trim() === '' && viewMode === 'all') {
      showNeighbors(currentPos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady, currentPos]);

  /* ---------- debounce (komşu mod boş input => bozma) ---------- */
  useEffect(() => {
    if (!dbReady) return;

    const h = setTimeout(() => {
      const v = searchTerm.trim();

      if (isNeighborMode && v === '') return;

      if (v.length > 0) setIsNeighborMode(false);

      // favorites: tek harf de çalışsın
      if (viewMode === 'favorites') performSearch(v);
      else performSearch(v);
    }, 250);

    return () => clearTimeout(h);
  }, [searchTerm, dbReady, performSearch, isNeighborMode, viewMode]);

  /* ---------- viewMode değişince ---------- */
  useEffect(() => {
    if (!dbReady) return;

    if (isNeighborMode) {
      setIsNeighborMode(false);
      setNeighborAnchor(null);
    }

    setSearchTerm('');
    performSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl overflow-hidden border border-slate-200">
      {/* ÜST */}
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
              {loading ? <Loader className="w-5 h-5 animate-spin text-orange-500" /> : <Search className="w-5 h-5" />}
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

        {/* MANUEL PANEL */}
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

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                <label className="block text-xs font-bold text-slate-600 mb-1">Birim</label>
                <select
                  value={mUnit}
                  onChange={(e) => setMUnit(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-slate-500 mt-1">Sadece sabit birim listesi.</div>
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

            {manualError && <div className="mt-2 text-sm font-bold text-red-600">{manualError}</div>}

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
                disabled={!dbReady}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:bg-slate-300"
              >
                Kaydet / Seç
              </button>
            </div>
          </div>
        )}

        {/* BİLGİ */}
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
              dbReady ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-100 border-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            {dbReady ? 'DB Bağlı' : 'Yükleniyor'}
          </span>
        </div>
      </div>

      {/* LİSTE */}
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
                  // ✅ Seç: parent tarafı “poz değiştirme” için gereken tüm alanları alsın
                  if (item.source === 'manual') {
                    onSelect({
                      pos: item.pos,
                      desc: item.desc,
                      unit: item.unit,
                      price: Number(item.price || 0),

                      // parent DB alanı bekliyorsa:
                      poz_no: item.pos,
                      tanim: item.desc,
                      birim: item.unit,
                      birim_fiyat: Number(item.price || 0),

                      source: 'manual',
                    });
                    return;
                  }

                  const raw = item._raw ?? {};
                  onSelect({
                    ...raw,

                    // ✅ standart alanlar
                    pos: item.pos,
                    desc: item.desc,
                    unit: item.unit,
                    price: Number(item.price || 0),

                    // ✅ DB alanları (poz değiştirmenin çalışması için kritik)
                    poz_no: item.pos,
                    tanim: item.desc,
                    birim: item.unit,
                    birim_fiyat: Number(item.price || 0),

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
                <p className="text-sm text-center px-6">Sık kullandığınız pozları yıldızlayarak buraya ekleyebilirsiniz.</p>
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
