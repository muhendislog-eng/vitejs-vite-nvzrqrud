import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Plus, AlertCircle, Loader, Filter, Check, Database } from 'lucide-react';
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

// Poz Ekle butonu memo (scroll sırasında repaint maliyeti düşük kalsın)
const PozEkleButton = React.memo(function PozEkleButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
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
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
        }`}
      title="Yeni poz ekle"
    >
      <Plus className="w-4 h-4" />
      Poz Ekle
    </button>
  );
});

// Kartı memo’layıp render izolasyonu
const PozCard = React.memo(function PozCard({
  item,
  isCurrent,
  onPick,
}: {
  item: any;
  isCurrent: boolean;
  onPick: () => void;
}) {
  const posVal = item?.poz_no ?? '---';
  const descVal = item?.tanim ?? 'Tanımsız';
  const unitVal = item?.birim ?? 'Adet';
  const price = toNumberTR(item?.birim_fiyat);

  // formatCurrency maliyetini de azaltmak için memo
  const priceText = useMemo(() => formatCurrency(price), [price]);

  return (
    <div
      // içerik görünürlük optimizasyonu: scroll kasmasını ciddi azaltır (özellikle Chrome)
      style={{
        contentVisibility: 'auto' as any,
        contain: 'content',
        containIntrinsicSize: '96px',
      }}
      className={`p-4 rounded-xl border bg-white ${
        isCurrent ? 'border-blue-300' : 'border-slate-200'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span
              className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg border ${
                isCurrent
                  ? 'text-blue-700 bg-blue-50 border-blue-200'
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
            {priceText}
          </span>

          <button
            type="button"
            onClick={onPick}
            className={`mt-3 inline-flex items-center text-xs font-bold text-white px-3 py-2 rounded-lg transition-colors ${
              isCurrent ? 'bg-blue-600' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            {isCurrent ? 'MEVCUT' : 'SEÇ'}
          </button>
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

  const dbRef = useRef<any>(null);
  const tableNameRef = useRef<string>('pozlar');

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

  /* ---------------- ARAMA (poz_no + tanim) ---------------- */
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

        // kategori kolonunuz varsa:
        // if (category) q += ` AND category='${category.replace(/'/g,"''")}'`;

        q += ` ORDER BY id ASC LIMIT ${SEARCH_LIMIT}`;

        const data = execQuery(q);
        setResults(data);
        setLoading(false);
      }, 40);
    },
    [execQuery]
  );

  // İlk açılışta: kategori varsa boş arama, yoksa boş liste (istenirse performSearch('') de yapılabilir)
  useEffect(() => {
    if (!dbReady) return;
    if (category) performSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady]);

  // Input debounce
  useEffect(() => {
    if (!dbReady) return;

    const t = setTimeout(() => {
      const v = searchTerm.trim();
      if (v.length > 0) performSearch(v);
      else {
        if (category) performSearch('');
        else setResults([]);
      }
    }, 200);

    return () => clearTimeout(t);
  }, [searchTerm, dbReady, performSearch, category]);

  const handleAddPoz = useCallback(() => onSelect({ action: 'add' }), [onSelect]);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl overflow-hidden border border-slate-200">
      {/* HEADER (SCROLL DIŞI) */}
      <div className="shrink-0 p-5 border-b bg-white">
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
              placeholder={!dbReady ? 'Veritabanı yükleniyor...' : 'Poz No veya Tanım ara... (maks. 25 sonuç)'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!dbReady}
              autoFocus
            />
          </div>

          <PozEkleButton disabled={!dbReady} onClick={handleAddPoz} />
        </div>

        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {category && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
                <Filter className="w-3 h-3" />
                {category}
              </span>
            )}
            <span className="text-[11px] font-semibold text-slate-500">
              {results.length} sonuç (maks. {SEARCH_LIMIT})
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
              const posVal = item?.poz_no ?? '---';
              const descVal = item?.tanim ?? 'Tanımsız';
              const unitVal = item?.birim ?? 'Adet';
              const priceVal = item?.birim_fiyat ?? 0;

              const isCurrent = Boolean(currentPos && posVal === currentPos);

              return (
                <PozCard
                  key={`${posVal}-${index}`}
                  item={item}
                  isCurrent={isCurrent}
                  onPick={() =>
                    onSelect({
                      ...item,
                      pos: posVal,
                      desc: descVal,
                      unit: unitVal,
                      price: toNumberTR(priceVal),
                    })
                  }
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
            Gösterilen: {results.length} / {SEARCH_LIMIT}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PozAramaMotoru;
