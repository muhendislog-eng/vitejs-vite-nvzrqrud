import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, AlertCircle, Loader, Filter, ArrowUpDown, Check, Database } from 'lucide-react';
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

const ITEMS_PER_PAGE = 20;

const PozAramaMotoru: React.FC<PozAramaMotoruProps> = ({ onSelect, category, currentPos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allResults, setAllResults] = useState<any[]>([]);
  const [displayedResults, setDisplayedResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [page, setPage] = useState(1);
  const [isNeighborMode, setIsNeighborMode] = useState(false);

  const dbRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tableNameRef = useRef<string>('pozlar');

  /* ---------------- DB YÜKLE ---------------- */
  useEffect(() => {
    const initDB = async () => {
      try {
        setLoading(true);

        if (!window.initSqlJs) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js');
        }

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
        console.error(e);
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
    } catch {
      return [];
    }
  }, []);

  /* ---------------- KOMŞU (±5) ---------------- */
  const showNeighbors = useCallback(
    (pozNo: string) => {
      const table = tableNameRef.current;
      const safe = pozNo.replace(/'/g, "''");

      setLoading(true);
      setTimeout(() => {
        const target = execQuery(`
          SELECT id, poz_no, tanim, birim, birim_fiyat
          FROM ${table}
          WHERE poz_no = '${safe}'
          LIMIT 1
        `);

        if (!target.length) {
          setLoading(false);
          return;
        }

        const id = Number(target[0].id);
        const neighbors = execQuery(`
          SELECT id, poz_no, tanim, birim, birim_fiyat
          FROM ${table}
          WHERE id BETWEEN ${id - 5} AND ${id + 5}
          ORDER BY id ASC
        `);

        setIsNeighborMode(true);
        setSearchTerm('');
        setAllResults(neighbors);
        setDisplayedResults(neighbors.slice(0, ITEMS_PER_PAGE));
        setPage(1);
        setLoading(false);
      }, 50);
    },
    [execQuery]
  );

  /* ---------------- NORMAL ARAMA ---------------- */
  const performSearch = (term: string) => {
    const table = tableNameRef.current;
    const safe = term.toLowerCase().replace(/'/g, "''");

    setLoading(true);
    setTimeout(() => {
      let q = `SELECT id, poz_no, tanim, birim, birim_fiyat FROM ${table} WHERE 1=1`;
      if (safe) {
        q += ` AND (lower(poz_no) LIKE '%${safe}%' OR lower(tanim) LIKE '%${safe}%')`;
      }
      q += ' ORDER BY id ASC LIMIT 200';

      const data = execQuery(q);
      setIsNeighborMode(false);
      setAllResults(data);
      setDisplayedResults(data.slice(0, ITEMS_PER_PAGE));
      setPage(1);
      setLoading(false);
    }, 50);
  };

  useEffect(() => {
    if (!dbReady) return;
    const t = setTimeout(() => {
      if (searchTerm.trim().length > 0) performSearch(searchTerm);
      else {
        setAllResults([]);
        setDisplayedResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm, dbReady]);

  /* ---------------- SCROLL ---------------- */
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      if (displayedResults.length < allResults.length) {
        const next = page + 1;
        setDisplayedResults(allResults.slice(0, next * ITEMS_PER_PAGE));
        setPage(next);
      }
    }
  }, [displayedResults, allResults, page]);

  /* ---------------- UI ---------------- */
  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl overflow-hidden border">
      <div className="p-4 border-b">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </div>
          <input
            className="w-full pl-10 pr-3 py-3 border rounded-xl"
            placeholder={
              isNeighborMode ? 'Seçili pozun çevresi (±5)' : 'Poz No veya Tanım ara...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!dbReady}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs">
          <div className="flex gap-2">
            {isNeighborMode && (
              <span className="flex items-center gap-1 text-blue-600">
                <ArrowUpDown className="w-3 h-3" /> Yakın Pozlar
              </span>
            )}
            {category && <span className="text-orange-600">{category}</span>}
            <span>{allResults.length} kayıt</span>
          </div>
          <span className="flex items-center gap-1 text-green-600">
            <Database className="w-3 h-3" /> {dbReady ? 'DB Bağlı' : 'Yükleniyor'}
          </span>
        </div>
      </div>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50"
      >
        {displayedResults.length ? (
          displayedResults.map((r: any, i: number) => {
            const isCurrent = currentPos && r.poz_no === currentPos;
            return (
              <div
                key={i}
                className={`p-3 rounded-lg border cursor-pointer ${
                  isCurrent ? 'bg-blue-50 border-blue-300' : 'bg-white'
                }`}
                onClick={() => {
                  showNeighbors(r.poz_no);
                  onSelect({
                    pos: r.poz_no,
                    desc: r.tanim,
                    unit: r.birim,
                    price: r.birim_fiyat,
                  });
                }}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-mono font-bold">{r.poz_no}</div>
                    <div className="text-sm">{r.tanim}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {formatCurrency(Number(r.birim_fiyat || 0))}
                    </div>
                    <div className="text-xs flex items-center gap-1">
                      {isCurrent ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {isCurrent ? 'MEVCUT' : 'DEĞİŞTİR'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            {loading ? <Loader className="animate-spin" /> : <AlertCircle />}
            <div>Sonuç yok</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PozAramaMotoru;
