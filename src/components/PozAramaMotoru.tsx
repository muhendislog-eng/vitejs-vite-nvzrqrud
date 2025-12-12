import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, BookOpen, AlertCircle, Loader, Filter, ArrowUpDown, Check } from 'lucide-react';
import { formatCurrency, loadScript } from '../utils/helpers';

// SQL.js için tip tanımı
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
  const [loading, setLoading] = useState(true); // Başlangıçta yükleniyor
  const [dbReady, setDbReady] = useState(false);
  const [page, setPage] = useState(1);
  const [isNeighborMode, setIsNeighborMode] = useState(false);

  const dbRef = useRef<any>(null); // Veritabanı referansı
  const listRef = useRef<HTMLDivElement>(null);

  // --- 1. VERİTABANINI BAŞLATMA (COMPONENT MOUNT) ---
  useEffect(() => {
    const initDB = async () => {
      try {
        // SQL.js kütüphanesini yükle
        if (!window.initSqlJs) {
          await loadScript("https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js");
        }

        if (!window.initSqlJs) {
          console.error("SQL.js yüklenemedi.");
          setLoading(false);
          return;
        }

        const SQL = await window.initSqlJs({
          locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        // ✅ public/database.db dosyasını SAĞLAM şekilde çek (StackBlitz/Vite uyumlu)
        const dbUrl = new URL("/database.db", import.meta.url).toString();
        console.log("DB URL:", dbUrl);

        const response = await fetch(dbUrl);

        // 404 / 500 vs
        if (!response.ok) {
          throw new Error(`Veritabanı dosyası bulunamadı. HTTP: ${response.status}`);
        }

        // ✅ DB yerine HTML geldiyse (yanlış path / fallback) anlayalım
        const contentType = response.headers.get("content-type") || "";
        const buffer = await response.arrayBuffer();

        if (contentType.includes("text/html")) {
          const preview = new TextDecoder().decode(new Uint8Array(buffer).slice(0, 200));
          console.error("DB yerine HTML geldi. Muhtemelen yol yanlış. İlk 200 byte:", preview);
          throw new Error("DB yerine HTML geldi (muhtemelen yanlış dosya yolu).");
        }

        const db = new SQL.Database(new Uint8Array(buffer));
        dbRef.current = db;

        setDbReady(true);
        setLoading(false);

      } catch (err) {
        console.error("Veritabanı başlatma hatası:", err);
        setLoading(false);
      }
    };

    initDB();
  }, []);

  // --- YARDIMCI: SQL SONUCUNU JSON'A ÇEVİRME ---
  const execQuery = (query: string) => {
    if (!dbRef.current) return [];
    try {
      const res = dbRef.current.exec(query);
      if (!res || res.length === 0) return [];
      const columns = res[0].columns;
      const values = res[0].values;
      return values.map((row: any) => {
        let obj: any = {};
        columns.forEach((col: string, i: number) => {
          obj[col] = row[i];
        });
        return obj;
      });
    } catch (e) {
      console.warn("Sorgu hatası:", e);
      return [];
    }
  };

  // --- 2. İLK AÇILIŞ VE KOMŞU POZ MANTIĞI ---
  useEffect(() => {
    if (!dbReady) return;

    if (currentPos && searchTerm === '') {
      setLoading(true);
      setTimeout(() => {
        const safePos = currentPos.replace(/'/g, "''");

        let targetRows = execQuery(`SELECT id FROM poz_library WHERE pos = '${safePos}' LIMIT 1`);

        if (targetRows.length > 0) {
          const targetId = targetRows[0].id;
          const startId = Math.max(1, targetId - 5);
          const endId = targetId + 5;

          const neighbors = execQuery(
            `SELECT * FROM poz_library WHERE id BETWEEN ${startId} AND ${endId} ORDER BY id ASC`
          );

          if (neighbors.length > 0) {
            setAllResults(neighbors);
            setDisplayedResults(neighbors);
            setIsNeighborMode(true);
          }
        } else {
          if (category) performSearch('');
        }

        setLoading(false);
      }, 50);
    }
    else if (!currentPos && category && searchTerm === '') {
      performSearch('');
    }
  }, [dbReady, currentPos, category]); // searchTerm eklenmez

  // --- 3. ARAMA TETİKLEYİCİSİ (DEBOUNCE) ---
  useEffect(() => {
    if (!dbReady) return;

    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        setIsNeighborMode(false);
        performSearch(searchTerm);
      } else if (searchTerm.trim().length === 0 && !isNeighborMode) {
        if (category) performSearch('');
        else {
          setAllResults([]);
          setDisplayedResults([]);
        }
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, dbReady]); // isNeighborMode isteğe bağlı eklenebilir ama şimdilik dokunmuyorum

  const performSearch = (term: string) => {
    setLoading(true);
    setTimeout(() => {
      const safeTerm = term.toLowerCase().replace(/'/g, "''");
      let query = "SELECT * FROM poz_library";

      // ✅ TypeScript never[] hatasını engelle
      const conditions: string[] = [];

      if (safeTerm) {
        conditions.push(`(lower(pos) LIKE '%${safeTerm}%' OR lower(desc) LIKE '%${safeTerm}%')`);
      }
      if (category) {
        // category içinde tek tırnak varsa bozulmasın
        const safeCategory = category.replace(/'/g, "''");
        conditions.push(`category = '${safeCategory}'`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " LIMIT 100";

      const data = execQuery(query);
      setAllResults(data);
      setPage(1);
      setDisplayedResults(data.slice(0, ITEMS_PER_PAGE));
      setLoading(false);
    }, 10);
  };

  const handleScroll = useCallback(() => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        if (displayedResults.length < allResults.length) {
          const nextPage = page + 1;
          const nextItems = allResults.slice(0, nextPage * ITEMS_PER_PAGE);
          setDisplayedResults(nextItems);
          setPage(nextPage);
        }
      }
    }
  }, [dbReady, currentPos, category]);




};

export default PozAramaMotoru;
