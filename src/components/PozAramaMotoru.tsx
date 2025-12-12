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

// TR fiyat parse (DB string döndürürse 0'a düşmesin)
const toNumberTR = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;

  let s = String(v).trim();
  if (!s) return 0;

  s = s.replace(/\s/g, '');

  // 1.234,56 -> 1234.56
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(',', '.');

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const PozEkleButton = React.memo(function PozEkleButton({
  disabled,
  onClick,
  active,
}: {
  disabled: boolean;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-[52px] px-4 rounded-xl font-bold text-sm inline-flex items-center gap-2 border transition-colors
        ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : active
            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
        }`}
      title="Manuel poz ekle"
    >
      <Plus className="w-4 h-4" />
      Poz Ekle
    </button>
  );
});

const PozCard = React.memo(function PozCard({
  item,
  isCurrent,
  isAnchor,
  isFav,
  onPick,
  onChange,
  onToggleFav,
  hideChangeButton,
}: {
  item: any;
  isCurrent: boolean;
  isAnchor: boolean;
  isFav: boolean;
  onPick: () => void;
  onChange: () => void;
  onToggleFav: (e: React.MouseEvent) => void;
  hideChangeButton?: boolean;
}) {
  const posVal = item?.poz_no ?? item?.pos ?? '---';
  const descVal = item?.tanim ?? item?.desc ?? 'Tanımsız';
  const unitVal = item?.birim ?? item?.unit ?? 'Adet';
  const price = toNumberTR(item?.birim_fiyat ?? item?.price);

  const priceText = useMemo(() => formatCurrency(price), [price]);

  return (
    <div
      style={{
        contentVisibility: 'auto' as any,
        contain: 'content',
        containIntrinsicSize: '120px',
      }}
      className={`p-4 rounded-xl border bg-white transition-colors ${
        isAnchor
          ? 'border-blue-400 bg-blue-50/40'
          : isCurrent
          ? 'border-emerald-300'
          : 'border-slate-200 hover:border-orange-300'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span
              className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg border ${
                isAnchor
                  ? 'text-blue-700 bg-blue-100 border-blue-200'
                  : isCurrent
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-orange-700 bg-orange-50 border-orange-100'
              }`}
            >
              {posVal}
            </span>

            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
              {unitVal}
            </span>

            {isAnchor && (
              <span className="text-[10px] font-black text-blue-700 bg-blue-100 border border-blue-200 px-2 py-1 rounded-md">
                MERKEZ
              </span>
            )}
          </div>

          <p className="text-sm text-slate-700 leading-relaxed font-medium line-clamp-2">{descVal}</p>
        </div>

        <div className="text-right flex flex-col items-end justify-between min-h-[88px]">
          <span className="font-black text-slate-800 text-lg tracking-tight bg-slate-50 px-2 py-1 rounded-lg">
            {priceText}
          </span>

          <div className="flex gap-2 mt-3 items-center">
            <button
              type="button"
              onClick={onToggleFav}
              className={`p-2 rounded-lg border transition-colors ${
                isFav
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-yellow-600 hover:border-yellow-200'
              }`}
              title={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            >
              <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onPick}
              className={`inline-flex items-center text-xs font-bold text-white px-3 py-2 rounded-lg transition-colors ${
                isCurrent ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-green-600 hover:bg-green-700'
              }`}
              title="Bu pozu seç"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              SEÇ
            </button>

            {!hideChangeButton && (
              <button
                type="button"
                onClick={onChange}
                className="inline-flex items-center text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                title="Bu pozun ±5 komşusunu göster"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Değiştir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const PozAramaMotoru: React.FC<PozAramaMotoruProps> = ({ onSelect, category, currentPos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  // Sekmeler
  const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Neighbor mode
  const [isNeighborMode, setIsNeighborMode] = useState(false);
  const [neighborAnchor, setNeighborAnchor] = useState<string | null>(null);

  // Manuel poz ekleme paneli
  const [manualOpen, setManualOpen] = useState(false);
  const [mPos, setMPos] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mUnit, setMUnit] = useState('Adet');
  const [mPrice, setMPrice] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  const dbRef = useRef<any>(null);
  const tableNameRef = useRef<string>('pozlar');

  const totalCap = useMemo(() => (isNeighborMode ? NEIGHBOR_LIMIT : SEARCH_LIMIT), [isNeighborMode]);

  /* ---------------- FAVORİLERİ YÜKLE ---------------- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      if (saved) setFavorites(JSON.parse(saved));
    } catch {
      setFavorites([]);
    }
  }, []);

  const persistFavorites = useCallback((list: string[]) => {
    setFavorites(list);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  }, []);

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

        const res = await fetch('/database.db');
        if (!res.ok) throw new Error('database.db bulunamadı');

        const buf = await res.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(buf));
        dbRef.current = db;

        const tables = db.exec(`
          SELECT name FROM sqlite_master
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `);
        if (tables?.[0]?.values?.length) {
          tableNameRef.current = String(tables[0].values[0][0]);
        }

        setDbReady(true);
        setLoading(false);
      } catch (e) {
        console.error('DB Yükleme Hatası:', e);
        setLoading(false);
      }
    };

    initDB();
  }, []);

  /* ---------------- SQL EXEC ---------------- */
  const execQuery = useCallback((query: string) => {
    if (!dbRef.current) return [];
    try {
      const res = dbRef.current.exec(query);
      if (!res || !res.length) return [];
      const { columns, values } = res[0];
      return values.map((row: any[]) => {
        const o: any = {};
        columns.forEach((c: string, i: number) => (o[c.toLowerCase()] = row[i]));
        return o;
      });
    } catch (e) {
      console.warn('Sorgu hatası:', e);
      return [];
    }
  }, []);

  /* ---------------- NORMAL ARAMA (max 25) ---------------- */
  const performSearch = useCallback(
    (term: string, mode: 'all' | 'favorites') => {
      const table = tableNameRef.current;
      const safe = term.toLowerCase().replace(/'/g, "''");

      setLoading(true);
      setTimeout(() => {
        let q = `
          SELECT rowid as rowid, poz_no, tanim, birim, birim_fiyat
          FROM ${table}
          WHERE 1=1
        `;

        if (mode === 'favorites') {
          if (!favorites.length) {
            setResults([]);
            setLoading(false);
            return;
          }
          const favList = favorites.map((f) => `'${String(f).replace(/'/g, "''")}'`).join(',');
          q += ` AND poz_no IN (${favList})`;
        }

        if (safe) {
          q += ` AND (lower(poz_no) LIKE '%${safe}%' OR lower(tanim) LIKE '%${safe}%')`;
        }

        // kategori (opsiyonel)
        // if (category) q += ` AND category='${category.replace(/'/g,"''")}'`;

        q += ` ORDER BY rowid ASC LIMIT ${SEARCH_LIMIT}`;

        const data = execQuery(q);

        setIsNeighborMode(false);
        setNeighborAnchor(null);
        setResults(data);

        setLoading(false);
      }, 40);
    },
    [execQuery, favorites]
  );

  /* ---------------- KOMŞU (±5) - rowid TABANLI ---------------- */
  const showNeighbors = useCallback(
    (pozNo: string) => {
      const table = tableNameRef.current;
      const safePos = pozNo.replace(/'/g, "''");

      setLoading(true);
      setTimeout(() => {
        const target = execQuery(`
          SELECT rowid as rowid
          FROM ${table}
          WHERE poz_no = '${safePos}'
          LIMIT 1
        `);

        if (!target.length || target[0].rowid == null) {
          console.warn('Hedef poz bulunamadı:', pozNo);
          setLoading(false);
          return;
        }

        const rid = Number(target[0].rowid);
        const start = rid - NEIGHBOR_RADIUS;
        const end = rid + NEIGHBOR_RADIUS;

        const neighbors = execQuery(`
          SELECT rowid as rowid, poz_no, tanim, birim, birim_fiyat
          FROM ${table}
          WHERE rowid BETWEEN ${start} AND ${end}
          ORDER BY rowid ASC
          LIMIT ${NEIGHBOR_LIMIT}
        `);

        setIsNeighborMode(true);
        setNeighborAnchor(pozNo);
        setSearchTerm('');
        setResults(neighbors);

        setLoading(false);
      }, 40);
    },
    [execQuery]
  );

  /* ---------------- İlk açılış: ALL modda ilk 25 ---------------- */
  useEffect(() => {
    if (!dbReady) return;
    performSearch('', 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady]);

  /* ---------------- currentPos gelirse otomatik komşu (ALL mod) ---------------- */
  useEffect(() => {
    if (!dbReady) return;
    if (viewMode !== 'all') return;
    if (currentPos && !searchTerm.trim()) {
      showNeighbors(currentPos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady, currentPos, viewMode]);

  /* ---------------- Input debounce (KRİTİK FIX) ---------------- */
  useEffect(() => {
    if (!dbReady) return;

    const t = setTimeout(() => {
      const v = searchTerm.trim();

      // Komşu modundayken input boşsa: komşu listeyi bozma
      if (viewMode === 'all' && isNeighborMode && v === '') return;

      if (viewMode === 'favorites') {
        performSearch(v, 'favorites');
        return;
      }

      if (v.length > 0) {
        if (isNeighborMode) {
          setIsNeighborMode(false);
          setNeighborAnchor(null);
        }
        performSearch(v, 'all');
      } else {
        performSearch('', 'all');
      }
    }, 220);

    return () => clearTimeout(t);
  }, [searchTerm, dbReady, performSearch, viewMode, isNeighborMode]);

  /* ---------------- Favori toggle ---------------- */
  const toggleFavorite = useCallback(
    (pozNo: string) => {
      const key = String(pozNo);
      const isFav = favorites.includes(key);
      const next = isFav ? favorites.filter((x) => x !== key) : [...favorites, key];
      persistFavorites(next);
    },
    [favorites, persistFavorites]
  );

  /* ---------------- Sekme değişimi ---------------- */
  const switchMode = useCallback(
    (mode: 'all' | 'favorites') => {
      setViewMode(mode);
      setSearchTerm('');
      setIsNeighborMode(false);
      setNeighborAnchor(null);
      setManualOpen(false);
      setManualError(null);

      if (dbReady) {
        performSearch('', mode);
      }
    },
    [dbReady, performSearch]
  );

  /* ---------------- Manuel panel toggle ---------------- */
  const toggleManualPanel = useCallback(() => {
    setManualOpen((p) => !p);
    setManualError(null);
  }, []);

  /* ---------------- Manuel poz gönder ---------------- */
  const submitManual = useCallback(() => {
    const pos = mPos.trim();
    const desc = mDesc.trim();
    const unit = (mUnit || 'Adet').trim();
    const price = toNumberTR(mPrice);

    if (!pos) {
      setManualError('Poz No zorunlu.');
      return;
    }
    if (!desc) {
      setManualError('Tanım zorunlu.');
      return;
    }

    setManualError(null);

    onSelect({
      pos,
      desc,
      unit,
      price,
      source: 'manual',
    });

    // Formu temizle
    setMPos('');
    setMDesc('');
    setMUnit('Adet');
    setMPrice('');
    setManualOpen(false);
  }, [mPos, mDesc, mUnit, mPrice, onSelect]);

  const handleBackToList = useCallback(() => {
    setIsNeighborMode(false);
    setNeighborAnchor(null);
    setSearchTerm('');
    performSearch('', 'all');
  }, [performSearch]);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl overflow-hidden border border-slate-200">
      {/* HEADER */}
      <div className="shrink-0 p-5 border-b bg-white">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => switchMode('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center ${
                viewMode === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Database className="w-4 h-4 mr-2" />
              Tüm Pozlar
            </button>

            <button
              type="button"
              onClick={() => switchMode('favorites')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center ${
                viewMode === 'favorites'
                  ? 'bg-white text-orange-600 shadow-sm'
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

          {viewMode === 'all' && isNeighborMode && (
            <button
              type="button"
              onClick={handleBackToList}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
              title="Normal listeye dön"
            >
              <Undo2 className="w-3 h-3" />
              Listeye Dön
            </button>
          )}
        </div>

        {/* Search + Add */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 rounded-xl border border-slate-200 bg-white">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {loading ? (
                <Loader className="w-5 h-5 animate-spin text-orange-600" />
              ) : (
                <Search className="w-5 h-5 text-slate-400" />
              )}
            </div>

            <input
              className="w-full pl-12 pr-4 py-4 rounded-xl outline-none text-slate-800 placeholder:text-slate-400 bg-transparent focus:ring-4 focus:ring-orange-200/60"
              placeholder={
                !dbReady
                  ? 'Veritabanı yükleniyor...'
                  : viewMode === 'favorites'
                  ? 'Favorilerimde poz_no / tanım ara... (maks. 25)'
                  : isNeighborMode
                  ? `Komşu pozlar (±${NEIGHBOR_RADIUS}) — ${neighborAnchor ?? ''}`
                  : 'Poz No veya Tanım ara... (maks. 25 sonuç)'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!dbReady}
              autoFocus
            />
          </div>

          <PozEkleButton disabled={!dbReady} onClick={toggleManualPanel} active={manualOpen} />
        </div>

        {/* Manuel poz ekleme paneli */}
        {manualOpen && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-black text-blue-700">Manuel Poz Ekle</div>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="p-2 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-700"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Poz No</label>
                <input
                  value={mPos}
                  onChange={(e) => setMPos(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-200/60"
                  placeholder="15.140.1203"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanım</label>
                <input
                  value={mDesc}
                  onChange={(e) => setMDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-200/60"
                  placeholder="Poz açıklaması..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Birim</label>
                <input
                  value={mUnit}
                  onChange={(e) => setMUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-200/60"
                  placeholder="Adet"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Birim Fiyat</label>
                <input
                  value={mPrice}
                  onChange={(e) => setMPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-200/60"
                  placeholder="1.234,56"
                  inputMode="decimal"
                />
              </div>
            </div>

            {manualError && (
              <div className="mt-3 text-xs font-bold text-red-600 bg-white border border-red-200 px-3 py-2 rounded-lg">
                {manualError}
              </div>
            )}

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setMPos('');
                  setMDesc('');
                  setMUnit('Adet');
                  setMPrice('');
                  setManualError(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50"
              >
                Temizle
              </button>

              <button
                type="button"
                onClick={submitManual}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-black text-sm hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Ekle / Seç
              </button>
            </div>
          </div>
        )}

        {/* Info bar */}
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {viewMode === 'all' && isNeighborMode && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
                <ArrowUpDown className="w-3 h-3" />
                Yakın Pozlar
              </span>
            )}

            {category && viewMode === 'all' && !isNeighborMode && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
                <Filter className="w-3 h-3" />
                {category}
              </span>
            )}

            <span className="text-[11px] font-semibold text-slate-500">
              {results.length} sonuç (maks. {totalCap})
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
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

      {/* SCROLL ALANI */}
      <div
        className="flex-1 overflow-y-auto bg-slate-50"
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          contain: 'content',
        }}
      >
        <div className="p-4 space-y-3">
          {results.length > 0 ? (
            results.map((item: any, index: number) => {
              const posVal = item?.poz_no ?? item?.pos ?? '---';
              const descVal = item?.tanim ?? item?.desc ?? 'Tanımsız';
              const unitVal = item?.birim ?? item?.unit ?? 'Adet';
              const priceVal = item?.birim_fiyat ?? item?.price ?? 0;

              const isAnchor =
                Boolean(viewMode === 'all' && isNeighborMode && neighborAnchor && posVal === neighborAnchor);
              const isCurrent = Boolean(currentPos && posVal === currentPos);
              const isFav = favorites.includes(String(posVal));

              return (
                <PozCard
                  key={`${posVal}-${index}`}
                  item={item}
                  isCurrent={isCurrent}
                  isAnchor={isAnchor}
                  isFav={isFav}
                  hideChangeButton={viewMode === 'favorites'}
                  onPick={() =>
                    onSelect({
                      ...item,
                      pos: posVal,
                      desc: descVal,
                      unit: unitVal,
                      price: toNumberTR(priceVal),
                    })
                  }
                  onChange={() => showNeighbors(String(posVal))}
                  onToggleFav={(e) => {
                    e.stopPropagation();
                    const wasFav = favorites.includes(String(posVal));
                    toggleFavorite(String(posVal));
                    if (viewMode === 'favorites' && wasFav) {
                      setResults((prev) =>
                        prev.filter((x) => String(x?.poz_no ?? x?.pos) !== String(posVal))
                      );
                    }
                  }}
                />
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-[420px] text-slate-400">
              {!dbReady ? (
                <>
                  <Loader className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                  <p className="text-sm">Veritabanı yükleniyor...</p>
                </>
              ) : viewMode === 'favorites' && favorites.length === 0 ? (
                <>
                  <Star className="w-14 h-14 mb-3 text-slate-200" />
                  <p className="text-lg font-bold text-slate-500">Henüz Favoriniz Yok</p>
                  <p className="text-sm text-center px-6">
                    Sık kullandığınız pozları yıldızlayarak buraya ekleyebilirsiniz.
                  </p>
                </>
              ) : searchTerm ? (
                <>
                  <AlertCircle className="w-14 h-14 mb-3 text-slate-300" />
                  <p className="text-lg font-bold text-slate-500">Sonuç bulunamadı</p>
                </>
              ) : (
                <>
                  <Search className="w-14 h-14 mb-3 text-slate-200" />
                  <p className="text-lg font-bold text-slate-400">Aramaya başlayın</p>
                  <p className="text-sm">Poz numarası veya tanım yazarak filtreleyin.</p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-2 text-center">
          <p className="text-[10px] text-slate-400 font-mono">
            Gösterilen: {results.length} / {totalCap}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PozAramaMotoru;
