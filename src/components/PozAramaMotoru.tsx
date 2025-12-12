import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Loader, Star, ArrowUpDown, Database, Check, Plus, X, Save } from 'lucide-react';
import { formatCurrency, loadScript } from '../utils/helpers';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

interface PozAramaMotoruProps {
  onSelect: (pose: any) => void;
  currentPos?: string;
}

const ITEMS_PER_PAGE = 20;
const SEARCH_LIMIT_DB = 100;

const NEIGHBOR_RADIUS = 5;
const NEIGHBOR_LIMIT = NEIGHBOR_RADIUS * 2 + 1;

const FAVORITES_KEY = 'gkmetraj_favorites';

// Sadece bunlar:
const UNIT_OPTIONS = ['Kg', 'li', 'm', 'm²', 'm³', 'n', 'Ton'] as const;
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

const PozAramaMotoru: React.FC<PozAramaMotoruProps> = ({ onSelect, currentPos }) => {
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
    if (isNeighborMode) return `Komşu pozlar (±${NEIGHBOR_RADIUS}) — ${neighborAnchor ?? ''}`;
    if (viewMode === 'favorites') return 'Favorilerim';
    return `Arama (max ${SEARCH_LIMIT_DB} DB sonucu)`;
  }, [dbReady, isNeighborMode, neighborAnchor, viewMode]);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl overflow-hidden border border-slate-200 relative">
      {/* HEADER */}
      <div className="shrink-0 p-4 border-b bg-white">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Database className="w-4 h-4 inline mr-1" />
              Tüm Pozlar
            </button>

            <button
              type="button"
              onClick={() => setViewMode('favorites')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                viewMode === 'favorites'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Favorilerim <span className="ml-1 opacity-90">({favorites.length})</span>
            </button>

            {isNeighborMode && (
              <button
                type="button"
                onClick={() => {
                  exitNeighborMode();
                  setSearchTerm('');
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                title="Komşu modundan çık"
              >
                Çık
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              resetManual();
              setManualOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
            title="Manuel poz ekle"
          >
            <Plus className="w-4 h-4" />
            Manuel Poz
          </button>
        </div>

        {/* Search */}
        <div className="relative bg-white rounded-lg">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </div>
          <input
            className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg outline-none bg-white text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-orange-200/50"
            placeholder={
              !dbReady
                ? 'Veritabanı yükleniyor...'
                : isNeighborMode
                ? `Komşu pozlar (±${NEIGHBOR_RADIUS})`
                : viewMode === 'favorites'
                ? 'Favorilerim içinde ara...'
                : 'Poz No veya Tanım ara...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!dbReady}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold">{subtitle}</span>
          <span className="font-mono">
            Gösterilen: {displayed.length} / {filtered.length}
          </span>
        </div>
      </div>

      {/* LIST */}
      <div
        ref={listRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto bg-slate-50 p-3 space-y-2"
        style={{ contain: 'content' as any }}
      >
        {dbReady && displayed.length === 0 && !loading ? (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-slate-400">
            {viewMode === 'favorites' && favorites.length === 0 ? (
              <>
                <Star className="w-10 h-10 mb-2 text-slate-300" />
                <div className="font-bold text-slate-500">Henüz favorin yok</div>
                <div className="text-sm">Pozların yanındaki yıldız ile ekleyebilirsin.</div>
              </>
            ) : (
              <>
                <Search className="w-10 h-10 mb-2 text-slate-300" />
                <div className="font-bold text-slate-500">Sonuç bulunamadı</div>
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
                className={`p-3 rounded-xl border bg-white transition-colors ${
                  isAnchor
                    ? 'border-blue-400 bg-blue-50/40'
                    : isCurrent
                    ? 'border-emerald-300'
                    : 'border-slate-200 hover:border-orange-300'
                }`}
                style={{
                  contentVisibility: 'auto' as any,
                  contain: 'content',
                  containIntrinsicSize: '120px',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span
                        className={`font-mono text-sm font-black px-2 py-0.5 rounded-lg border ${
                          isAnchor
                            ? 'text-blue-700 bg-blue-100 border-blue-200'
                            : isCurrent
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-orange-700 bg-orange-50 border-orange-100'
                        }`}
                      >
                        {item.pos}
                      </span>

                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {item.unit}
                      </span>

                      {item.source === 'manual' && (
                        <span className="text-[10px] font-black text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          MANUEL
                        </span>
                      )}

                      {isAnchor && (
                        <span className="text-[10px] font-black text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md">
                          MERKEZ
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-700 leading-snug font-medium line-clamp-2">{item.desc}</p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2 min-w-[120px]">
                    <div className="font-black text-slate-800 text-lg tracking-tight">
                      {formatCurrency(Number(item.price || 0))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(item.pos)}
                        className={`p-1.5 rounded-lg border transition-colors bg-white ${
                          fav
                            ? 'border-yellow-200 text-yellow-500 hover:bg-yellow-50'
                            : 'border-slate-200 text-slate-400 hover:text-yellow-500 hover:border-yellow-200 hover:bg-yellow-50'
                        }`}
                        title={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                      >
                        <Star className={`w-4 h-4 ${fav ? 'fill-yellow-500' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => emitSelect(item)}
                        className={`inline-flex items-center text-xs font-bold text-white px-3 py-2 rounded-lg transition-colors ${
                          isCurrent ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title="Seç"
                      >
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        SEÇ
                      </button>

                      {item.source === 'db' && (
                        <button
                          type="button"
                          onClick={() => showNeighbors(item.pos)}
                          className="inline-flex items-center text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                          title="±5 komşu poz"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {loading && (
          <div className="py-3 text-center text-slate-400 text-sm flex items-center justify-center">
            <Loader className="w-4 h-4 animate-spin mr-2" />
            Yükleniyor...
          </div>
        )}
      </div>

      {/* MANUAL MODAL (SİYAH ARKA PLAN YOK) */}
      {manualOpen && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
              <div className="font-black text-slate-800">Manuel Poz Ekle</div>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
                title="Kapat"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4 bg-white">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Poz No</label>
                <input
                  value={mPos}
                  onChange={(e) => setMPos(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-200/50"
                  placeholder="Örn: 15.105.1108"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tanım</label>
                <textarea
                  value={mDesc}
                  onChange={(e) => setMDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-200/50 min-h-[90px]"
                  placeholder="Poz açıklaması..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Birim</label>
                  <select
                    value={mUnit}
                    onChange={(e) => setMUnit(e.target.value as UnitOption)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-emerald-200/50"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Birim Fiyat</label>
                  <input
                    value={mPrice}
                    onChange={(e) => setMPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-200/50"
                    placeholder="Örn: 853,80"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t bg-slate-50 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => saveManual(false)}
                disabled={!mPos.trim()}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                  !mPos.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>

              <button
                type="button"
                onClick={() => saveManual(true)}
                disabled={!mPos.trim()}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-black text-sm transition-colors ${
                  !mPos.trim()
                    ? 'bg-emerald-200 text-emerald-400 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Check className="w-4 h-4" />
                Kaydet ve Seç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PozAramaMotoru;
