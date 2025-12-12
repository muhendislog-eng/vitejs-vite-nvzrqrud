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

const SEARCH_LIMIT = 25;      // normal arama max
const NEIGHBOR_LIMIT = 11;    // ±5 + kendisi

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

// Memo: Poz Ekle butonu scroll sırasında repaint olmasın
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

// Kart: memo + content-visibility ile scroll performansı
const PozCard = React.memo(function PozCard({
  item,
  isCurrent,
  onPick,
  onChange,
}: {
  item: any;
  isCurrent: boolean;
  onPick: () => void;
  onChange: () => void;
}) {
  const posVal = item?.poz_no ?? '---';
  const descVal = item?.tanim ?? 'Tanımsız';
  const unitVal = item?.birim ?? 'Adet';
  const price = toNumberTR(item?.birim_fiyat);

  const priceText = useMemo(() => formatCurrency(price), [price]);

  return (
    <div
      style={{
        contentVisibility: 'auto' as any,
        contain: 'content',
        containIntrinsicSize: '110px',
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

        <div className="text-right flex flex-col items-end justify-between min-h-[84px]">
          <span className="font-black text-slate-800 text-lg tracking-tight bg-slate-50 px-2 py-1 rounded-lg">
            {priceText}
          </span>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onPick}
              className={`inline-flex items-center text-xs font-bold text-white px-3 py-2 rounded-lg transition-colors ${
                isCurrent ? 'bg-blue-600' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              {isCurrent ? 'MEVCUT' : 'SEÇ'}
            </button>

            <button
              type="button"
              onClick={onChange}
              className="inline-flex items-center text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              title="Bu pozun ±5 komşusunu göster"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Değiştir
            </button>
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

  // Komşu modu state (Değiştir için)
  const [isNeighborMode, setIsNeighborMode] = useState(false);
  const [neighborAnchor, setNeighborAnchor] = useState<string | null>(null);

  const dbRef = useRef<any>(null);
  const tableNameRef = useRef<string>('pozlar');

  const totalCap = useMemo(
    () => (isNeighborMode ? NEIGHBOR_LIMIT : SEARCH_LIMIT),
    [isNeighborMode]
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

        setIsNeighborMode(false);
        setNeighborAnchor(null);
        setResults(data);

        setLoading(false);
      }, 40);
    },
    [execQuery]
  );

  /* ---------------- KOMŞU (±5) (max 11) ---------------- */
  const showNeighbors = useCallback(
    (pozNo: string) => {
      const table = tableNameRef.current;
      const safePos = pozNo.replace(/'/g, "''");

      setLoading(true);
      setTimeout(() => {
        // 1) hedef pozun row_number'ını bul (id sırasına göre)
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

        // 2) rn aralığındaki komşuları çek
        const neighbors = execQuery(`
          SELECT id, poz_no, tanim, birim, birim_fiyat, rn
          FROM (
            SELECT id, poz_no, tanim, birim, birim_fiyat,
                   ROW_NUMBER() OVER (ORDER BY id ASC) AS rn
            FROM ${table}
          )
          WHERE rn BETWEEN ${start} AND ${end}
          ORDER BY rn ASC
          LIMIT ${NEIGHBOR_LIMIT}
        `);

        // Komşu modunu aç
        setIsNeighborMode(true);
        setNeighborAnchor(pozNo);

        // input'u boş tutuyoruz; önemli: aşağıdaki effect boşken neighbor mode'da arama yapmayacak
        setSearchTerm('');
        setResults(neighbors);

        setLoading(false);
      }, 40);
    },
    [execQuery]
  );

  // İlk açılış: kategori varsa boş arama
  useEffect(() => {
    if (!dbReady) return;
    if (category) performSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady]);

  // currentPos gelirse otomatik komşu aç (isteğe bağlı davranış)
  useEffect(() => {
    if (!dbReady) return;
    if (currentPos && !searchTerm.trim()) {
      showNeighbors(currentPos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady, currentPos]);

  // Input debounce (KRİTİK: neighbor mode + input boşken listeyi BOZMA)
  useEffect(() => {
    if (!dbReady) return;

    const t = setTimeout(() => {
      const v = searchTerm.trim();

      // Komşu modu açık + input boş => hiçbir şey yapma (listeyi 1. satırdan başlatmayı engeller)
      if (isNeighborMode && v.length === 0) return;

      if (v.length > 0) {
        // kullanıcı yazdıysa neighbor modundan çık ve ara
        if (isNeighborMode) {
          setIsNeighborMode(false);
          setNeighborAnchor(null);
        }
        performSearch(v);
      } else {
        // boşsa kategori varsa listele, yoksa boşalt
        if (category) performSearch('');
        else setResults([]);
      }
    }, 200);

    return () => clearTimeout(t);
  }, [searchTerm, dbReady, performSearch, category, isNeighborMode]);

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
              placeholder={
                !dbReady
                  ? 'Veritabanı yükleniyor...'
                  : isNeighborMode
                  ? `Komşu pozlar (±5) — ${neighborAnchor ?? ''}`
                  : 'Poz No veya Tanım ara... (maks. 25 sonuç)'
              }
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
            {isNeighborMode && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
                <ArrowUpDown className="w-3 h-3" />
                Yakın Pozlar
              </span>
            )}
            {category && !isNeighborMode && (
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
                  onChange={() => showNeighbors(posVal)}
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
            Gösterilen: {results.length} / {totalCap}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PozAramaMotoru;
