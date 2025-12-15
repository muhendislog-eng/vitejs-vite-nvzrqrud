import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Loader, Star, ArrowUpDown, Database, Check, Plus, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, loadScript } from '../utils/helpers';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

interface PozAramaMotoruProps {
  onSelect: (pose: any) => void;
  currentPos?: string;
  category?: string;
}

const ITEMS_PER_PAGE = 20;
const SEARCH_LIMIT_DB = 100;

const NEIGHBOR_RADIUS = 5;
const NEIGHBOR_LIMIT = NEIGHBOR_RADIUS * 2 + 1;

const FAVORITES_KEY = 'gkmetraj_favorites';

// Sadece bunlar:
const UNIT_OPTIONS = ['Kg', 'm', 'm²', 'm³', 'Ton', 'Adet'] as const;
type UnitOption = (typeof UNIT_OPTIONS)[number];

type ViewMode = 'all' | 'favorites';

type PozItem = {
  pos: string;
  desc: string;
  unit: string;
  price: number;
  source: 'db' | 'manual';
  rowid?: number;
};

const escapeSql = (s: string) => s.replace(/'/g, "''").trim();

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

const normalizeItemFromDbRow = (row: any): PozItem => {
  const pos = String(row?.poz_no ?? row?.pos ?? row?.no ?? '---').trim();
  const desc = String(row?.tanim ?? row?.aciklama ?? row?.desc ?? 'Tanımsız');
  const unit = String(row?.birim ?? row?.unit ?? 'm').trim() || 'm';
  const price = toNumberTR(row?.birim_fiyat ?? row?.fiyat ?? row?.price ?? 0);
  const rowid = row?.rowid != null ? Number(row.rowid) : undefined;

  return { pos, desc, unit, price, source: 'db', rowid };
};

const PozAramaMotoru: React.FC<PozAramaMotoruProps> = ({ onSelect, currentPos, category }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesItems, setFavoritesItems] = useState<PozItem[]>([]);

  const [manualItems, setManualItems] = useState<PozItem[]>([]);
  const [dbCache, setDbCache] = useState<PozItem[]>([]);

  const [isNeighborMode, setIsNeighborMode] = useState(false);
  const [neighborAnchor, setNeighborAnchor] = useState<string | null>(null);
  const [neighborResults, setNeighborResults] = useState<PozItem[]>([]);

  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const dbRef = useRef<any>(null);
  const tableRef = useRef<string>('');

  // Manual modal
  const [manualOpen, setManualOpen] = useState(false);
  const [mPos, setMPos] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mUnit, setMUnit] = useState<UnitOption>('m');
  const [mPrice, setMPrice] = useState<string>('0');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const persistFavorites = useCallback((next: string[]) => {
    setFavorites(next);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = useCallback(
    (pos: string) => {
      const p = pos.trim();
      if (!p) return;
      const next = favorites.includes(p) ? favorites.filter((x) => x !== p) : [...favorites, p];
      persistFavorites(next);
    },
    [favorites, persistFavorites]
  );

  useEffect(() => {
    const initDB = async () => {
      try {
        setLoading(true);

        if (!window.initSqlJs) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js');
        }
        if (!window.initSqlJs) throw new Error('SQL.js yüklenemedi');

        const SQL = await window.initSqlJs({
          locateFile: (f: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}`,
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
        if (!tables?.[0]?.values?.length) throw new Error('Tablo bulunamadı');
        tableRef.current = String(tables[0].values[0][0]);

        setDbReady(true);
      } catch (e) {
        console.error('DB init error:', e);
      } finally {
        setLoading(false);
      }
    };

    initDB();
  }, []);

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
      console.warn('SQL error:', e);
      return [];
    }
  }, []);

  const emitSelect = useCallback(
    (item: PozItem) => {
      onSelect({
        pos: item.pos,
        desc: item.desc,
        unit: item.unit,
        price: Number(item.price || 0),

        poz_no: item.pos,
        tanim: item.desc,
        birim: item.unit,
        birim_fiyat: Number(item.price || 0),

        source: item.source,
      });
    },
    [onSelect]
  );

  const runDbSearch = useCallback(
    (term: string) => {
      if (!dbReady) return;
      const table = tableRef.current;
      const safe = escapeSql(term).toLowerCase();

      setLoading(true);
      setTimeout(() => {
        let q = `
          SELECT rowid as rowid, poz_no, tanim, birim, birim_fiyat
          FROM "${table}"
          WHERE 1=1
        `;

        if (safe) {
          q += ` AND (lower(poz_no) LIKE '%${safe}%' OR lower(tanim) LIKE '%${safe}%')`;
        }

        q += ` ORDER BY rowid ASC LIMIT ${SEARCH_LIMIT_DB}`;

        const rows = execQuery(q);
        setDbCache(rows.map(normalizeItemFromDbRow));
        setLoading(false);
      }, 60);
    },
    [dbReady, execQuery]
  );

  const fetchFavoritesFromDb = useCallback(() => {
    if (!dbReady) return;

    if (!favorites.length) {
      setFavoritesItems([]);
      return;
    }

    const table = tableRef.current;
    const favList = favorites.map((f) => `'${escapeSql(f)}'`).join(',');

    setLoading(true);
    setTimeout(() => {
      const rows = execQuery(`
        SELECT rowid as rowid, poz_no, tanim, birim, birim_fiyat
        FROM "${table}"
        WHERE poz_no IN (${favList})
      `);

      const items = rows.map(normalizeItemFromDbRow);
      items.sort((a, b) => favorites.indexOf(a.pos) - favorites.indexOf(b.pos));

      setFavoritesItems(items);
      setLoading(false);
    }, 60);
  }, [dbReady, execQuery, favorites]);

  const showNeighbors = useCallback(
    (posNo: string) => {
      if (!dbReady) return;
      const table = tableRef.current;
      const safePos = escapeSql(posNo);

      setLoading(true);
      setTimeout(() => {
        const target = execQuery(`
          SELECT rowid as rowid
          FROM "${table}"
          WHERE poz_no='${safePos}'
          LIMIT 1
        `);

        if (!target.length || target[0].rowid == null) {
          console.warn('Neighbor anchor not found:', posNo);
          setLoading(false);
          return;
        }

        const rid = Number(target[0].rowid);
        const start = rid - NEIGHBOR_RADIUS;
        const end = rid + NEIGHBOR_RADIUS;

        const rows = execQuery(`
          SELECT rowid as rowid, poz_no, tanim, birim, birim_fiyat
          FROM "${table}"
          WHERE rowid BETWEEN ${start} AND ${end}
        `);

        const neighbors = rows
          .map(normalizeItemFromDbRow)
          .filter((x) => typeof x.rowid === 'number')
          .sort((a, b) => Number(a.rowid) - Number(b.rowid))
          .slice(0, NEIGHBOR_LIMIT);

        setIsNeighborMode(true);
        setNeighborAnchor(posNo);
        setNeighborResults(neighbors);

        setViewMode('all');
        setSearchTerm('');
        setPage(1);
        if (listRef.current) listRef.current.scrollTop = 0;

        setLoading(false);
      }, 60);
    },
    [dbReady, execQuery]
  );

  const exitNeighborMode = useCallback(() => {
    setIsNeighborMode(false);
    setNeighborAnchor(null);
    setNeighborResults([]);
    setPage(1);
  }, []);

  useEffect(() => {
    if (!dbReady) return;
    runDbSearch('');
  }, [dbReady, runDbSearch]);

  useEffect(() => {
    if (!dbReady) return;
    if (currentPos && !searchTerm.trim()) {
      showNeighbors(currentPos);
    }
  }, [dbReady, currentPos, searchTerm, showNeighbors]);

  useEffect(() => {
    if (!dbReady) return;
    setPage(1);

    if (viewMode === 'favorites') {
      exitNeighborMode();
      fetchFavoritesFromDb();
    } else {
      if (!isNeighborMode) runDbSearch(searchTerm.trim());
    }
  }, [viewMode, dbReady, fetchFavoritesFromDb, runDbSearch, searchTerm, exitNeighborMode, isNeighborMode]);

  useEffect(() => {
    if (!dbReady) return;

    const t = setTimeout(() => {
      const v = searchTerm.trim();

      if (isNeighborMode && v === '') return;

      if (viewMode === 'favorites') {
        setPage(1);
        return;
      }

      if (isNeighborMode && v !== '') exitNeighborMode();
      runDbSearch(v);
      setPage(1);
    }, 250);

    return () => clearTimeout(t);
  }, [searchTerm, dbReady, isNeighborMode, viewMode, runDbSearch, exitNeighborMode]);

  const allMerged = useMemo(() => {
    const map = new Map<string, PozItem>();
    for (const d of dbCache) map.set(d.pos, d);
    for (const m of manualItems) map.set(m.pos, m);
    return Array.from(map.values());
  }, [dbCache, manualItems]);

  const favoritesMerged = useMemo(() => {
    const map = new Map<string, PozItem>();
    for (const f of favoritesItems) map.set(f.pos, f);
    for (const m of manualItems) if (favorites.includes(m.pos)) map.set(m.pos, m);

    const arr = Array.from(map.values());
    arr.sort((a, b) => favorites.indexOf(a.pos) - favorites.indexOf(b.pos));
    return arr;
  }, [favoritesItems, manualItems, favorites]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (isNeighborMode) return neighborResults;

    if (viewMode === 'favorites') {
      if (!term) return favoritesMerged;
      return favoritesMerged.filter(
        (i) => i.pos.toLowerCase().includes(term) || (i.desc || '').toLowerCase().includes(term)
      );
    }

    if (!term) return allMerged;
    return allMerged.filter((i) => i.pos.toLowerCase().includes(term) || (i.desc || '').toLowerCase().includes(term));
  }, [isNeighborMode, neighborResults, viewMode, favoritesMerged, allMerged, searchTerm]);

  const displayed = useMemo(() => {
    if (isNeighborMode) return filtered.slice(0, NEIGHBOR_LIMIT);
    return filtered.slice(0, page * ITEMS_PER_PAGE);
  }, [filtered, page, isNeighborMode]);

  const onScroll = useCallback(() => {
    if (!listRef.current) return;
    if (isNeighborMode) return;

    const el = listRef.current;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
    if (!nearBottom) return;

    const nextCap = (page + 1) * ITEMS_PER_PAGE;
    if (nextCap <= filtered.length) setPage((p) => p + 1);
  }, [filtered.length, isNeighborMode, page]);

  const resetManual = () => {
    setMPos('');
    setMDesc('');
    setMUnit('m');
    setMPrice('0');
  };

  const saveManual = (selectAfter: boolean) => {
    const pos = mPos.trim();
    if (!pos) return;

    const item: PozItem = {
      pos,
      desc: (mDesc || '').trim() || 'Tanımsız',
      unit: mUnit,
      price: toNumberTR(mPrice),
      source: 'manual',
    };

    setManualItems((prev) => {
      const idx = prev.findIndex((x) => x.pos === pos);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [item, ...prev];
    });

    setManualOpen(false);
    resetManual();

    setViewMode('all');
    exitNeighborMode();
    setSearchTerm('');
    setPage(1);
    if (listRef.current) listRef.current.scrollTop = 0;

    if (selectAfter) emitSelect(item);
  };

  const subtitle = useMemo(() => {
    if (!dbReady) return 'Veritabanı yükleniyor...';
    if (isNeighborMode) return `Benzer Pozlar (±${NEIGHBOR_RADIUS}) — ${neighborAnchor ?? ''}`;
    if (viewMode === 'favorites') return 'Favorilerim';
    return category ? `${category} Kategorisinde Arama` : `Arama (max ${SEARCH_LIMIT_DB} DB sonucu)`;
  }, [dbReady, isNeighborMode, neighborAnchor, viewMode, category]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative overflow-hidden">
      {/* HEADER */}
      <div className="shrink-0 p-6 border-b border-slate-200/60 bg-white/40 ">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'all'
                ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
            >
              <Database className="w-4 h-4 inline mr-2 text-blue-500" />
              Tüm Pozlar
            </button>

            <button
              type="button"
              onClick={() => setViewMode('favorites')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'favorites'
                ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
            >
              <Star className="w-4 h-4 inline mr-2 text-orange-500" />
              Favorilerim <span className="ml-1 opacity-60">({favorites.length})</span>
            </button>

            {isNeighborMode && (
              <button
                type="button"
                onClick={() => {
                  exitNeighborMode();
                  setSearchTerm('');
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors ring-1 ring-blue-200"
              >
                Normal Görünüm
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              resetManual();
              setManualOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-800 text-white hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Manuel Poz Ekle
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${loading ? 'text-orange-500' : 'text-slate-400 group-focus-within:text-orange-500'}`}>
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </div>
          <input
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-slate-200/60 rounded-2xl outline-none bg-white/80 placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all shadow-sm group-hover:border-slate-300"
            placeholder={
              !dbReady
                ? 'Veritabanı yükleniyor...'
                : isNeighborMode
                  ? `Benzer pozlar (±${NEIGHBOR_RADIUS}) içinde ara...`
                  : viewMode === 'favorites'
                    ? 'Favorilerim içinde ara...'
                    : 'Poz No veya Tanım ile arama yapın...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!dbReady}
            autoFocus
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
            {subtitle}
          </div>
        </div>
      </div>

      {/* LIST */}
      <div
        ref={listRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-6 space-y-3"
        style={{ contentVisibility: 'auto' }}
      >
        {dbReady && displayed.length === 0 && !loading ? (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            {viewMode === 'favorites' && favorites.length === 0 ? (
              <>
                <div className="p-4 bg-orange-50 rounded-full mb-4">
                  <Star className="w-8 h-8 text-orange-400" />
                </div>
                <div className="font-black text-slate-600 text-lg">Henüz favorin yok</div>
                <div className="text-sm">Pozların yanındaki yıldız ile ekleyebilirsin.</div>
              </>
            ) : (
              <>
                <div className="p-4 bg-slate-100 rounded-full mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <div className="font-black text-slate-600 text-lg">Sonuç bulunamadı</div>
                <div className="text-sm">Farklı bir terim ile aramayı dene.</div>
              </>
            )}
          </div>
        ) : (
          displayed.map((item, idx) => {
            const fav = favorites.includes(item.pos);
            const isCurrent = Boolean(currentPos && item.pos === currentPos);
            const isAnchor = Boolean(isNeighborMode && neighborAnchor && item.pos === neighborAnchor);

            return (
              <div
                key={`${item.pos}-${idx}`}
                className={`group p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden ${isAnchor
                  ? 'border-blue-400 bg-blue-50/30'
                  : isCurrent
                    ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/30'
                    : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5'
                  }`}
              >
                {isCurrent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}

                <div className="flex items-start gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span
                        className={`font-mono text-base font-black px-2.5 py-1 rounded-lg border shadow-sm ${isAnchor
                          ? 'text-blue-700 bg-blue-50 border-blue-200'
                          : isCurrent
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-slate-700 bg-slate-50 border-slate-200 group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-900'
                          }`}
                      >
                        {item.pos}
                      </span>

                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100/80 px-2 py-1 rounded-md border border-slate-200">
                        {item.unit}
                      </span>

                      {item.source === 'manual' && (
                        <span className="text-[10px] font-black text-white bg-slate-400 px-2 py-0.5 rounded-md">
                          MANUEL
                        </span>
                      )}

                      {isAnchor && (
                        <span className="text-[10px] font-black text-white bg-blue-500 px-2 py-0.5 rounded-md shadow-sm shadow-blue-500/20">
                          MERKEZ
                        </span>
                      )}
                    </div>

                    <p className="text-[15px] text-slate-600 leading-relaxed font-medium line-clamp-2 group-hover:text-slate-900 transition-colors">{item.desc}</p>
                  </div>

                  <div className="flex flex-col items-end gap-3 min-w-[140px]">
                    <div className="font-black text-slate-800 text-2xl tracking-tighter tabular-nums text-right">
                      {formatCurrency(Number(item.price || 0))}
                    </div>

                    <div className="flex items-center gap-2 w-full justify-end">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(item.pos)}
                        className={`p-2 rounded-xl border transition-colors ${fav
                          ? 'border-yellow-200 bg-yellow-50 text-yellow-500'
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 hover:border-yellow-200'
                          }`}
                        title={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                      >
                        <Star className={`w-4 h-4 ${fav ? 'fill-yellow-500' : ''}`} />
                      </button>

                      {item.source === 'db' && (
                        <button
                          type="button"
                          onClick={() => showNeighbors(item.pos)}
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-colors"
                          title="Benzer pozları bul"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => emitSelect(item)}
                        className={`flex-1 inline-flex items-center justify-center text-xs font-bold text-white px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 ${isCurrent
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20 group-hover:bg-orange-600 group-hover:shadow-orange-500/20'
                          }`}
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        SEÇ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {loading && (
          <div className="py-8 text-center text-slate-400 text-sm flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl border border-dashed border-slate-200">
            <Loader className="w-5 h-5 animate-spin mr-3 text-orange-500" />
            <span className="font-medium animate-pulse">Veriler yükleniyor...</span>
          </div>
        )}
      </div>

      {/* MANUAL MODAL (PREMIUM ANIMATED) */}
      <AnimatePresence>
        {manualOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/50 bg-white/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-lg shadow-slate-900/20">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg tracking-tight">Manuel Poz Ekle</h3>
                    <p className="text-xs font-bold text-slate-500">Veritabanında olmayan özel poz tanımı</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setManualOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors group"
                >
                  <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Poz No */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Poz No</label>
                  <input
                    value={mPos}
                    onChange={(e) => setMPos(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200/60 bg-white/80 outline-none text-slate-800 font-bold placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                    placeholder="Örn: 15.105.1108"
                    autoFocus
                  />
                </div>

                {/* Tanim */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Poz Tanımı</label>
                  <textarea
                    value={mDesc}
                    onChange={(e) => setMDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200/60 bg-white/80 outline-none text-slate-800 font-medium placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all min-h-[100px] resize-none"
                    placeholder="Örn: 200 dozlu demirsiz beton (kırma taş ile)"
                  />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Birim */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Birim</label>
                    <div className="relative">
                      <select
                        value={mUnit}
                        onChange={(e) => setMUnit(e.target.value as UnitOption)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200/60 bg-white/80 outline-none text-slate-800 font-bold appearance-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ArrowUpDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Fiyat */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Birim Fiyat (TL)</label>
                    <input
                      value={mPrice}
                      onChange={(e) => setMPrice(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200/60 bg-white/80 outline-none text-slate-800 font-black text-right placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all tabular-nums"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-2 bg-gradient-to-b from-transparent to-slate-50/50 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => saveManual(false)}
                  disabled={!mPos.trim()}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${!mPos.trim()
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                    }`}
                >
                  <Save className="w-4 h-4" />
                  Listeye Ekle
                </button>

                <button
                  type="button"
                  onClick={() => saveManual(true)}
                  disabled={!mPos.trim()}
                  className={`flex-[2] py-3.5 rounded-xl font-black text-sm transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${!mPos.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-emerald-500/30'
                    }`}
                >
                  <Check className="w-5 h-5" />
                  Kaydet ve Kullan
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PozAramaMotoru;
