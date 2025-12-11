import { loadScript } from '../utils/helpers';
import { INITIAL_POS_LIBRARY, initialStaticData, initialArchitecturalData } from '../data/constants';

// SQL.js için tip tanımı
declare global {
  interface Window {
    initSqlJs: any;
    SQL: any;
  }
}

let db: any = null;

// --- YARDIMCI: SQL SONUCUNU JSON'A ÇEVİRME ---
const resultToObjects = (res: any) => {
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
};

// --- VERİTABANI BAŞLATMA ---
export const initDatabase = async () => {
  try {
    console.log("SQL.js yükleniyor...");
    // 1. SQL.js WebAssembly Kütüphanesini Yükle
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js");

    if (!window.initSqlJs) {
      console.error("SQL.js kütüphanesi yüklenemedi!");
      return false;
    }

    // 2. SQL Motorunu Başlat
    const SQL = await window.initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });

    // 3. database.db Dosyasını Çek (Fetch)
    // ÖNEMLİ: Dosya public klasöründe olmalı ve '/' ile başlamalıdır.
    console.log("database.db dosyası okunuyor...");
    try {
      const response = await fetch('/database.db'); 
      
      if (!response.ok) {
        throw new Error(`Dosya bulunamadı veya okunamadı: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      db = new SQL.Database(new Uint8Array(buffer));
      console.log("Veritabanı başarıyla bağlandı!");

      // Tablo kontrolü (Eğer boş bir db attıysan tabloları oluşturur)
      db.run(`
        CREATE TABLE IF NOT EXISTS metraj_data (
          id TEXT PRIMARY KEY,
          category TEXT,
          pos TEXT,
          desc TEXT,
          unit TEXT,
          price REAL,
          quantity REAL,
          mahal TEXT,
          type TEXT
        );
      `);
      
      // Poz kütüphanesi tablosunu da kontrol et
      db.run(`
        CREATE TABLE IF NOT EXISTS poz_library (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pos TEXT,
          desc TEXT,
          unit TEXT,
          price REAL,
          category TEXT
        );
      `);

    } catch (err) {
      console.warn("database.db bulunamadı. Bellekte boş bir veritabanı oluşturuluyor. (Hata: " + err + ")");
      // Dosya yoksa boş db ile devam et (Uygulamanın çökmemesi için)
      db = new SQL.Database();
      db.run("CREATE TABLE metraj_data (id TEXT, category TEXT, pos TEXT, desc TEXT, unit TEXT, price REAL, quantity REAL, mahal TEXT, type TEXT)");
      db.run("CREATE TABLE poz_library (id INTEGER PRIMARY KEY AUTOINCREMENT, pos TEXT, desc TEXT, unit TEXT, price REAL, category TEXT)");
    }

    // --- SEED DATA (Eğer veritabanı boşsa başlangıç verilerini yükle) ---
    try {
      const pozCountRes = db.exec("SELECT COUNT(*) as cnt FROM poz_library");
      const pozCount = pozCountRes[0].values[0][0];

      if (pozCount === 0) {
        console.log("Veritabanı boş, başlangıç verileri (constants.ts) yükleniyor...");
        
        // Pozları Yükle
        Object.keys(INITIAL_POS_LIBRARY).forEach(category => {
          // @ts-ignore
          INITIAL_POS_LIBRARY[category].forEach((item: any) => {
            const safeDesc = item.desc.replace(/'/g, "''"); 
            db.run(`INSERT INTO poz_library (pos, desc, unit, price, category) VALUES ('${item.pos}', '${safeDesc}', '${item.unit}', ${item.price}, '${category}')`);
          });
        });

        // Statik Metrajları Yükle
        initialStaticData.forEach(item => {
           const safeDesc = item.desc.replace(/'/g, "''");
           const safeMahal = item.mahal ? item.mahal.replace(/'/g, "''") : "";
           db.run(`INSERT INTO metraj_data (id, category, pos, desc, unit, price, quantity, mahal, type) VALUES ('${item.id}', '${item.category}', '${item.pos}', '${safeDesc}', '${item.unit}', ${item.price}, ${item.quantity}, '${safeMahal}', 'static')`);
        });

        // Mimari Metrajları Yükle
        initialArchitecturalData.forEach(item => {
          const safeDesc = item.desc.replace(/'/g, "''");
          const safeMahal = item.mahal ? item.mahal.replace(/'/g, "''") : "";
          db.run(`INSERT INTO metraj_data (id, category, pos, desc, unit, price, quantity, mahal, type) VALUES ('${item.id}', '${item.category}', '${item.pos}', '${safeDesc}', '${item.unit}', ${item.price}, ${item.quantity}, '${safeMahal}', 'architectural')`);
        });
        
        console.log("Başlangıç verileri yüklendi.");
      }
    } catch (e) {
      console.error("Veri yükleme hatası:", e);
    }

    return true;

  } catch (e) {
    console.error("Veritabanı başlatma genel hatası:", e);
    return false;
  }
};

// --- SQL SORGULARI (API) ---

// Tüm Pozları Getir
export const getAllPoses = () => {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM poz_library");
    return resultToObjects(res);
  } catch (e) {
    console.warn("Poz sorgusu hatası:", e);
    return [];
  }
};

// Arama Yap
export const searchPoses = (searchTerm: string) => {
  if (!db || !searchTerm) return [];
  const term = searchTerm.toLowerCase().replace(/'/g, "''"); // Güvenlik için tırnakları escape et
  try {
    const res = db.exec(`
      SELECT * FROM poz_library 
      WHERE lower(pos) LIKE '%${term}%' OR lower(desc) LIKE '%${term}%'
      LIMIT 50
    `);
    return resultToObjects(res);
  } catch (e) {
    console.error("Arama hatası:", e);
    return [];
  }
};

// Metraj Verilerini Getir
export const getMetrajData = (type: string) => {
  if (!db) return [];
  try {
    const res = db.exec(`SELECT * FROM metraj_data WHERE type = '${type}'`);
    return resultToObjects(res);
  } catch (e) {
    console.error("Metraj veri hatası:", e);
    return [];
  }
};

// Yeni Metraj Ekle
export const addMetrajItem = (item: any, type: string) => {
  if (!db) return [];
  const id = Date.now().toString();
  const safeDesc = item.desc ? item.desc.replace(/'/g, "''") : "";
  const mahal = item.mahal ? item.mahal.replace(/'/g, "''") : "";
  
  try {
    db.run(`
      INSERT INTO metraj_data (id, category, pos, desc, unit, price, quantity, mahal, type)
      VALUES ('${id}', '${item.category}', '${item.pos}', '${safeDesc}', '${item.unit}', ${item.price}, ${item.quantity}, '${mahal}', '${type}')
    `);
    return getMetrajData(type);
  } catch (e) {
    console.error("Ekleme hatası:", e);
    return [];
  }
};

// Miktar Güncelle
export const updateMetrajQuantity = (id: string | number, quantity: number, type: string) => {
  if (!db) return [];
  try {
    db.run(`UPDATE metraj_data SET quantity = ${quantity} WHERE id = '${id}'`);
    return getMetrajData(type);
  } catch (e) {
    console.error("Miktar güncelleme hatası:", e);
    return [];
  }
};

// Mahal Güncelle
export const updateMetrajLocation = (id: string | number, mahal: string, type: string) => {
  if (!db) return [];
  try {
    const safeMahal = mahal.replace(/'/g, "''");
    db.run(`UPDATE metraj_data SET mahal = '${safeMahal}' WHERE id = '${id}'`);
    return getMetrajData(type);
  } catch (e) {
    console.error("Mahal güncelleme hatası:", e);
    return [];
  }
};

// Poz Güncelle
export const updateMetrajPose = (id: string | number, newPose: any, type: string) => {
  if (!db) return [];
  try {
    const safeDesc = newPose.desc.replace(/'/g, "''");
    db.run(`
      UPDATE metraj_data 
      SET pos = '${newPose.pos}', desc = '${safeDesc}', unit = '${newPose.unit}', price = ${newPose.price}, category = '${newPose.category}'
      WHERE id = '${id}'
    `);
    return getMetrajData(type);
  } catch (e) {
    console.error("Poz güncelleme hatası:", e);
    return [];
  }
};

// Veritabanını İndir
export const exportDatabaseFile = () => {
    if (!db) return;
    const data = db.export();
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proje_metraj_${new Date().toISOString().slice(0,10)}.db`;
    a.click();
};