import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  AlertCircle,
  Loader,
  Filter,
  ArrowUpDown,
  Check,
  Database,
  Pencil,
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

const ITEMS_PER_PAGE = 25;
const SEARCH_LIMIT = 25;

const PozAramaMotoru: React.FC<PozAramaMotoruProps> = ({ onSelect, category, currentPos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allResults, setAllResults] = useState<any[]>([]);
  const [displayedResults, setDisplayedResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [page, setPage] = useState(1);
  const [isNeighborMode, setIsNeighborMode] = useState(false);
  const [neighborAnchor, setNeighborAnchor] = useState<string | null>(null);

  const dbRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tableNameRef = useRef<string>('pozlar');

  const totalCap = useMemo(() => (isNeighborMode ? 11 : SEARCH_LIMIT), [isNeighborMode]);

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

  /* ---------------- NORMAL ARAMA: en fazla 25 ---------------- */
  const performSearch = useCallback(
    (term: string) => {
      const table = tableNameRef.current;
      const safe = term.toLowerCase().replace(/'/g, "''");

      setLoading(true);
      setTimeout(() => {
        let q = `
          SELECT id, poz_no, tanim, birim, birim_fiyat
          FROM ${table}
          WHERE 1=1
        `;

        if (safe) {
          q += ` AND (lower(poz_no) LIKE '%${safe}%' OR lower(tanim) LIKE '%${safe}%')`;
        }

        q += ` ORDER BY id ASC LIMIT ${SEARCH_LIMIT}`;

        const data = execQuery(q);

        setIsNeighborMode(false);
        setNeighborAnchor(null);

        setAllResults(data);
        setDisplayedResults(data.slice(0, ITEMS_PER_PAGE));
        setPage(1);

        setLoading(false);
      }, 80);
    },
    [execQuery]
  );

  /* ---------------- KOMŞU (±5): toplam 11 kayıt ---------------- */
  const showNeighbors = useCallback(
    (pozNo: string) => {
      const table = tableNameRef.current;
      const safePos = pozNo.replace(/'/g, "''");

      setLoading(true);

      setTimeout(() => {
        const target = execQuery(`
          SELECT rn
          FROM (
            SELECT poz_no, ROW_NUMBER() OVER (ORDER BY id ASC) AS rn
            FROM ${table}
          )
          WHERE poz_no = '${safePos}'
          LIMIT 1
        `);

        if (!target.length || target[0].rn == null) {
          setLoading(false);
          return;
        }

        const rn = Number(target[0].rn);
        const start = rn - 5;
        const end = rn + 5;

        const neighbors = execQuery(`
          SELECT id, poz_no, tanim, birim, birim_fiyat, rn
          FROM (
            SELECT id, poz_no, tanim, birim, birim_fiyat,
                   ROW_NUMBER() OVER (ORDER BY id ASC) AS rn
            FROM ${table}
          )
          WHERE rn BETWEEN ${start} AND ${end}
          ORDER BY rn ASC
          LIMIT 11
        `);

        // ÖNEMLİ: Neighbor mode'u önce açıyoruz ve anchor'ı set ediyoruz.
        // searchTerm'i boşaltmak OK; fakat aşağıdaki searchTerm effect’i boşken neighbor mode’da arama yapmayacak.
        setIsNeighborMode(true);
        setNeighborAnchor(pozNo);
        setSearchTerm('');

        setAllResults(neighbors);
        setDisplayedResults(neighbors); // max 11 zaten
        setPage(1);

        if (listRef.current) listRef.current.scrollTop = 0;

        setLoading(false);
      }, 80);
    },
    [execQuery]
  );

  /* ---------------- currentPos geldiyse otomatik komşu göster ---------------- */
  useEffect(() => {
    if (!dbReady) return;
    if (currentPos && !searchTerm.trim()) {
      showNeighbors(currentPos);
    } else if (!currentPos && category && !searchTerm.trim() && !isNeighborMode) {
      performSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady, currentPos]);

  /* ---------------- input araması (KRİTİK FIX BURADA) ---------------- */
  useEffect(() => {
    if (!dbReady) return;

    const t = setTimeout(() => {
      const v = searchTerm.trim();

      // KRİTİK: neighbor mode açık ve input boşsa hiçbir şey yapma.
      // Böylece komşu liste "1. satırdan itibaren" resetlenmez.
      if (isNeighborMode && v.length === 0) return;

      if (v.length > 0) {
        // kullanıcı yazmaya başladıysa neighbor modundan çık
        if (isNeighborMode) {
          setIsNeighborMode(false);
          setNeighborAnchor(null);
        }
        performSearch(v);
      } else {
        // boşsa: kategori varsa listele, yoksa boşalt
        if (category) performSearch('');
        else {
          setAllResults([]);
          setDisplayedResults([]);
          setPage(1);
        }
      }
    }, 300);

    return () => clearTimeout(t);
  }, [searchTerm, dbReady, performSearch, category, isNeighborMode]);

  /* ---------------- infinite scroll ---------------- */
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 80) {
      if (displayedResults.length < allResults.length) {
        const next = page + 1;
        const nextItems = allResults.slice(0, next * ITEMS_PER_PAGE);
        setDisplayedResults(nextItems);
        setPage(next);
      }
    }
  }, [displayedResults, allResults, page]);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl overflow-hidden border border-slate-200">
      {/* HEADER */}
      <div className="p-5 border-b bg-gradient-to-b from-white to-slate-50/80">
        <div className="flex items-center gap-3">
          <div
            className={`relative flex-1 rounded-2xl border shadow-sm transition-all ${
              isNeighborMode ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-white'
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-[3px] rounded-t-2xl ${
                isNeighborMode
                  ? 'bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500'
                  : 'bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400'
              }`}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {loading ? (
                <Loader
                  className={`w-5 h-5 animate-spin ${
                    isNeighborMode ? 'text-blue-600' : 'text-orange-600'
                  }`}
                />
              ) : (
                <Search className="w-5 h-5 text-slate-400" />
              )}
            </div>

            <input
              className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none text-slate-800 placeholder:text-slate-400
                bg-transparent transition-all focus:ring-4 ${
                  isNeighborMode ? 'focus:ring-blue-200/70' : 'focus:ring-orange-200/70'
                }`}
              placeholder={
                !dbReady
                  ? 'Veritabanı yükleniyor...'
                  : isNeighborMode
                  ? `Komşu pozlar (±5) — anchor: ${neighborAnchor ?? ''}`
                  : 'Poz No veya Tanım ara... (maks. 25 sonuç)'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!dbReady}
              autoFocus
            />
          </div>

          {/* POZ EKLE */}
          <button
            type="button"
            disabled={!dbReady}
            onClick={() => onSelect({ action: 'add' })}
            className={`h-[56px] px-4 rounded-2xl font-bold text-sm inline-flex items-center gap-2 border shadow-sm transition-colors
              ${
                dbReady
                  ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            title="Yeni poz ekle"
          >
            <Plus className="w-4 h-4" />
            Poz Ekle
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {isNeighborMode && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-1 rounded-lg">
                <ArrowUpDown className="w-3 h-3" />
                Yakın Pozlar
              </span>
            )}

            {category && !isNeighborMode && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-100/70 border border-orange-200 px-2 py-1 rounded-lg">
                <Filter className="w-3 h-3" />
                {category}
              </span>
            )}

            <span className="text-[11px] font-semibold text-slate-500">
              {allResults.length} sonuç (maks. {totalCap})
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

      {/* LISTE */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40"
        ref={listRef}
        onScroll={handleScroll}
      >
        {displayedResults.length > 0 ? (
          <>
            {displayedResults.map((item: any, index: number) => {
              const posVal = item.poz_no ?? '---';
              const descVal = item.tanim ?? 'Tanımsız';
              const unitVal = item.birim ?? 'Adet';
              const priceVal = item.birim_fiyat ?? 0;

              const isCurrent = currentPos && posVal === currentPos;

              return (
                <div
                  key={`${posVal}-${index}`}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span
                          className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg border ${
                            isCurrent
                              ? 'text-blue-700 bg-blue-100 border-blue-200'
                              : 'text-orange-700 bg-orange-50 border-orange-100'
                          }`}
                        >
                          {posVal}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {unitVal}
                        </span>
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed font-medium line-clamp-2">
                        {descVal}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end justify-between min-h-[72px]">
                      <span className="font-black text-slate-800 text-lg tracking-tight bg-slate-50 px-2 py-1 rounded-lg">
                        {formatCurrency(Number(priceVal || 0))}
                      </span>

                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            onSelect({
                              ...item,
                              pos: posVal,
                              desc: descVal,
                              unit: unitVal,
                              price: Number(priceVal || 0),
                            })
                          }
                          className={`inline-flex items-center text-xs font-bold text-white px-3 py-2 rounded-lg shadow-sm transition-colors ${
                            isCurrent ? 'bg-blue-600' : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {isCurrent ? (
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          {isCurrent ? 'MEVCUT' : 'SEÇ'}
                        </button>

                        <button
                          type="button"
                          onClick={() => showNeighbors(posVal)}
                          className="inline-flex items-center text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1.5" />
                          Değiştir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-70">
            {!dbReady ? (
              <>
                <Loader className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                <p className="text-sm">Veritabanı yükleniyor...</p>
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

      {/* FOOTER */}
      <div className="bg-slate-50 border-t border-slate-200 p-2 text-center">
        <p className="text-[10px] text-slate-400 font-mono">
          Gösterilen: {displayedResults.length} / {totalCap}
        </p>
      </div>
    </div>
  );
};

export default PozAramaMotoru;
