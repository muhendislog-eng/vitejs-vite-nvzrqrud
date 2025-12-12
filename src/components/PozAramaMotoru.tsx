import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Search,
  Loader,
  Star,
  ArrowUpDown,
  Database,
  Check,
  Plus,
  X,
  Save,
} from 'lucide-react';
import { formatCurrency, loadScript } from '../utils/helpers';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

interface PozAramaMotoruProps {
  onSelect: (pose: any) => void;
  currentPos?: string; // “poz değiştir” modunda gelen poz_no
}

const ITEMS_PER_PAGE = 20;
const SEARCH_LIMIT_DB = 100;
const NEIGHBOR_RADIUS = 5;
const NEIGHBOR_LIMIT = NEIGHBOR_RADIUS * 2 + 1;

const FAVORITES_KEY = 'gkmetraj_favorites';

// Kullanıcı istedi: sadece bunlar
const UNIT_OPTIONS = ['Kg', 'li', 'm', 'm²', 'm³', 'n', 'Ton'] as const;

type UnitOption = (typeof UNIT_OPTIONS)[number];

type ViewMode = 'all' | 'favorites';

type PozItem = {
  pos: string;
  desc: string;
  unit: UnitOption | string;
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

  // 1.234,56 -> 1234.56
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(',', '.');

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const normalizeItemFromDbRow = (row: any): PozItem => {
  const pos = String(row?.poz_no ?? row?.pos ?? row?.no ?? '---').trim();
  const desc = String(row?.tanim ?? row?.aciklama ?? row?.desc ?? 'Tanımsız');
  const unit = String(row?.birim ?? row?.unit ?? 'Adet');
  const price = toNumberTR(row?.birim_fiyat ?? row?.fiyat ?? row?.price ?? 0);
  const rowid = row?.rowid != null ? Number(row.rowid) : undefined;

  return {
    pos,
    desc,
    unit,
    price,
    source: 'db',
    rowid,
  };
};

const PozAramaMotoru: React.FC<PozAramaMotoruProps> = ({ onSelect, currentPos }) => {
  // UI
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  // Data
  const [favorites, setFavorites] = useState<string[]>([]);
  const [manualItems, setManualItems] = useState<PozItem[]>([]);
  const [dbCache, setDbCache] = useState<PozItem[]>([]); // son aramanın DB sonucu (max 100)

  // Neighbor mode
  const [isNeighborMode, setIsNeighborMode] = useState(false);
  const [neighborAnchor, setNeighborAnchor] = useState<string | null>(null);
  const [neighborResults, setNeighborResults] = useState<PozItem[]>([]);

  // Pagination (kasma azaltmak için)
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  // SQL.js refs
  const dbRef = useRef<any>(null);
  const tableRef = useRef<string>('');

  // Manual add modal
  const [manualOpen, setManualOpen] = useState(false);
  const [mPos, setMPos] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mUnit, setMUnit] = useState<UnitOption>('Adet');
  const [mPrice, setMPrice] = useState<string>('0');

  /* ---------------- FAVORİLER LOAD/SAVE ---------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const persistFavorites = (next: string[]) => {
    setFavorites(next);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const toggleFavorite = (pos: string) => {
    const p = pos.trim();
    if (!p) return;
    const next = favorites.includes(p) ? favorites.filter((x) => x !== p) : [...favorites, p];
    persistFavorites(next);
  };

  /* ---------------- DB INIT ---------------- */
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
      console.warn('SQL error:', e);
      return [];
    }
  }, []);

  /* ---------------- STANDARD EMIT ---------------- */
  const emitSelect = useCallback(
    (item: PozItem) => {
      onSelect({
        pos: item.pos,
        desc: item.desc,
        unit: item.unit,
        price: Number(item.price || 0),

        // parent farklı isimler beklerse diye
        poz_no: item.pos,
        tanim: item.desc,
        birim: item.unit,
        birim_fiyat: Number(item.price || 0),

        source: item.source,
      });
    },
    [onSelect]
  );

  /* ---------------- DB SEARCH (max 100) ---------------- */
  const runDbSearch = useCallback(
    (term: string) => {
      if (!dbReady) return;

      const table = tableRef.current;
      const safe = escapeSql(term).toLowerCase();

      setLoading(true);
      setTimeout(() => {
        let q = `
          SELECT rowid as rowid, *
          FROM "${table}"
          WHERE 1=1
        `;

        if (safe) {
          // En kritik kolonlar: poz_no, tanim. (Sabit tutuyoruz)
          q += ` AND (lower(poz_no) LIKE '%${safe}%' OR lower(tanim) LIKE '%${safe}%')`;
        }

        q += ` LIMIT ${SEARCH_LIMIT_DB}`;

        const rows = execQuery(q);
        const data = rows.map(normalizeItemFromDbRow);

        setDbCache(data);
        setLoading(false);
      }, 60);
    },
    [dbReady, execQuery]
  );

  /* ---------------- NEIGHBORS (+/-5) ---------------- */
  const showNeighbors = useCallback(
    (posNo: string) => {
      if (!dbReady) return;
      const table = tableRef.current;
      const safePos = escapeSql(posNo);

      setLoading(true);
      setTimeout(() => {
        // hedef rowid
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
          SELECT rowid as rowid, *
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

        // Komşu moduna girince: favoriler modunda kalmasın, “tüm pozlar”a dön
        setViewMode('all');
        setSearchTerm('');
        setPage(1);

        // scroll başa
        if (listRef.current) listRef.current.scrollTop = 0;

        setLoading(false);
      }, 60);
    },
    [dbReady, execQuery]
  );

  /* ---------------- INIT LIST (ilk açılış) ---------------- */
  useEffect(() => {
    if (!dbReady) return;
    // ilk açılışta ilk 100 cache
    runDbSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady]);

  /* ---------------- currentPos geldiyse otomatik komşu ---------------- */
  useEffect(() => {
    if (!dbReady) return;
    if (currentPos && !searchTerm.trim()) {
      showNeighbors(currentPos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady, currentPos]);

  /* ---------------- SEARCH DEBOUNCE ---------------- */
  useEffect(() => {
    if (!dbReady) return;

    const t = setTimeout(() => {
      const v = searchTerm.trim();

      // Komşu modundayken input boşsa: komşu listeyi bozma
      if (isNeighborMode && v === '') return;

      // Komşu modundayken kullanıcı yazarsa: komşudan çık ve DB araması yap
      if (isNeighborMode && v !== '') {
        setIsNeighborMode(false);
        setNeighborAnchor(null);
        setNeighborResults([]);
      }

      if (viewMode === 'favorites') {
        // Favoriler modunda DB sorgusu yok: sadece filtre
        setPage(1);
        return;
      }

      runDbSearch(v);
      setPage(1);
    }, 250);

    return () => clearTimeout(t);
  }, [searchTerm, dbReady, isNeighborMode, viewMode, runDbSearch]);

  /* ---------------- DERIVED LIST (favoriler kesin çalışsın) ---------------- */
  const baseAllList: PozItem[] = useMemo(() => {
    // Manual + DB cache birleşsin; aynı pos varsa manual üstün olsun (kullanıcı girişi)
    const map = new Map<string, PozItem>();

    for (const d of dbCache) {
      if (d.pos) map.set(d.pos, d);
    }
    for (const m of manualItems) {
      if (m.pos) map.set(m.pos, m);
    }

    return Array.from(map.values());
  }, [dbCache, manualItems]);

  const filteredList: PozItem[] = useMemo(() => {
    // Neighbor mode varsa: sadece neighborResults
    if (isNeighborMode) return neighborResults;

    const term = searchTerm.trim().toLowerCase();

    if (viewMode === 'favorites') {
      const favSet = new Set(favorites.map((f) => f.trim()));
      const favItems = baseAllList.filter((i) => favSet.has(i.pos));

      // Favori sırası korunsun
      favItems.sort((a, b) => favorites.indexOf(a.pos) - favorites.indexOf(b.pos));

      // Favoriler içinde arama
      if (!term) return favItems;

      return favItems.filter(
        (i) =>
          i.pos.toLowerCase().includes(term) ||
          (i.desc || '').toLowerCase().includes(term)
      );
    }

    // viewMode === all
    // Not: DB aramasını runDbSearch zaten yaptı; burada sadece manual’ları da term ile süzerek ekleyelim:
    if (!term) {
      // arama boşken: dbCache + manual birleşimi
      // (dbCache zaten LIMIT 100)
      return baseAllList;
    }

    return baseAllList.filter(
      (i) =>
        i.pos.toLowerCase().includes(term) ||
        (i.desc || '').toLowerCase().includes(term)
    );
  }, [
    isNeighborMode,
    neighborResults,
    viewMode,
    favorites,
    baseAllList,
    searchTerm,
  ]);

  const displayedResults = useMemo(() => {
    const cap = isNeighborMode ? NEIGHBOR_LIMIT : page * ITEMS_PER_PAGE;
    return filteredList.slice(0, cap);
  }, [filteredList, page, isNeighborMode]);

  /* ---------------- SCROLL LOAD MORE (hafif) ---------------- */
  const onScroll = useCallback(() => {
    if (!listRef.current) return;
    const el = listRef.current;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
    if (!nearBottom) return;

    // neighbor modunda zaten 11 kayıt
    if (isNeighborMode) return;

    // daha fazla varsa sayfayı artır
    const nextCap = (page + 1) * ITEMS_PER_PAGE;
    if (nextCap <= filteredList.length) {
      setPage((p) => p + 1);
    }
  }, [filteredList.length, isNeighborMode, page]);

  /* ---------------- MANUAL ADD ---------------- */
  const resetManualForm = () => {
    setMPos('');
    setMDesc('');
    setMUnit('Adet');
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
      // aynı pos varsa güncelle
      const idx = prev.findIndex((x) => x.pos === pos);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [item, ...prev];
    });

    setManualOpen(false);
    resetManualForm();

    // Manual ekleyince: tüm pozlara geç, aramayı temizle, liste başa
    setViewMode('all');
    setSearchTerm('');
    setIsNeighborMode(false);
    setNeighborAnchor(null);
    setNeighborResults([]);
    setPage(1);
    if (listRef.current) listRef.current.scrollTop = 0;

    if (selectAfter) emitSelect(item);
  };

  /* ---------------- HEADER INFO ---------------- */
  const headerSubtitle = useMemo(() => {
    if (!dbReady) return 'Veritabanı yükleniyor...';
    if (isNeighborMode) return `Komşu pozlar (±${NEIGHBOR_RADIUS}) — ${neighborAnchor ?? ''}`;
    if (viewMode === 'favorites') return 'Favorilerim';
    return `Arama (DB cache: ${Math.min(dbCache.length, SEARCH_LIMIT_DB)} kayıt)`;
  }, [dbReady, isNeighborMode, neighborAnchor, viewMode, dbCache.length]);

  /* ---------------- CARD HELPERS ---------------- */
  const isFav = (pos: string) => favorites.includes(pos);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl overflow-hidden border border-slate-200">
      {/* HEADER */}
      <div className="shrink-0 p-4 border-b bg-white">
        {/* Tabs + Add */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setViewMode('all');
                setIsNeighborMode(false);
                setNeighborAnchor(null);
                setNeighborResults([]);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Database className="w-4 h-4 inline mr-1" />
              Tüm Pozlar
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('favorites');
                setIsNeighborMode(false);
                setNeighborAnchor(null);
                setNeighborResults([]);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                viewMode === 'favorites'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Favorilerim <span className="ml-1 opacity-90">({favorites.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setManualOpen(true);
              // inputlarda önceki değer kalmasın
              resetManualForm();
            }}
            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
            title="Manuel poz ekle"
          >
            <Plus className="w-4 h-4" />
            Manuel Poz
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </div>
          <input
            className="w-full pl-10 pr-3 py-2.5 border rounded-lg outline-none focus:ring-4 focus:ring-orange-200/60"
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

        {/* Info line */}
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold">{headerSubtitle}</span>
          <span className="font-mono">
            Gösterilen: {displayedResults.length} / {isNeighborMode ? NEIGHBOR_LIMIT : filteredList.length}
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
        {dbReady && displayedResults.length === 0 && !loading ? (
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
                <div className="text-sm">Arama terimini değiştirip tekrar dene.</div>
              </>
            )}
          </div>
        ) : (
          displayedResults.map((item, idx) => {
            const current = currentPos && item.pos === currentPos;
            const anchor = isNeighborMode && neighborAnchor && item.pos === neighborAnchor;
            const fav = isFav(item.pos);

            return (
              <div
                key={`${item.pos}-${idx}`}
                className={`p-3 rounded-xl border bg-white transition-colors ${
                  anchor
                    ? 'border-blue-400 bg-blue-50/40'
                    : current
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
                  {/* Left */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span
                        className={`font-mono text-sm font-black px-2 py-0.5 rounded-lg border ${
                          anchor
                            ? 'text-blue-700 bg-blue-100 border-blue-200'
                            : current
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

                      {anchor && (
                        <span className="text-[10px] font-black text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md">
                          MERKEZ
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-700 leading-snug font-medium line-clamp-2">
                      {item.desc}
                    </p>
                  </div>

                  {/* Right */}
                  <div className="text-right flex flex-col items-end gap-2 min-w-[110px]">
                    <div className="font-black text-slate-800 text-lg tracking-tight">
                      {formatCurrency(Number(item.price || 0))}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Favorite */}
                      <button
                        type="button"
                        onClick={() => toggleFavorite(item.pos)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          fav
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-500 hover:bg-yellow-100'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-yellow-500 hover:border-yellow-200'
                        }`}
                        title={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                      >
                        <Star className={`w-4 h-4 ${fav ? 'fill-yellow-500' : ''}`} />
                      </button>

                      {/* Select (tek kalsın) */}
                      <button
                        type="button"
                        onClick={() => emitSelect(item)}
                        className={`inline-flex items-center text-xs font-bold text-white px-3 py-2 rounded-lg transition-colors ${
                          current ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title="Seç"
                      >
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        SEÇ
                      </button>

                      {/* Neighbors (+/-5) */}
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

      {/* MANUAL MODAL */}
      {manualOpen && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-whi
