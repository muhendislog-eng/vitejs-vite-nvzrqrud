import { loadScript } from '../utils/helpers';
import { INITIAL_POS_LIBRARY, initialStaticData, initialArchitecturalData } from '../data/constants';

declare global {
  interface Window {
    initSqlJs: any;
    SQL: any;
  }
}

let db: any = null;

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

export const initDatabase = async () => {
  try {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js");

    if (!window.initSqlJs) {
      console.error("SQL.js yüklenemedi!");
      return false;
    }

    const SQL = await window.initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });

    try {
      const response = await fetch('/database.db');
      if (!response.ok) throw new Error("Dosya bulunamadı");
      const buffer = await response.arrayBuffer();
      db = new SQL.Database(new Uint8Array(buffer));
      console.log("Veritabanı başarıyla bağlandı!");
    } catch (err) {
      console.warn("database.db bulunamadı, boş db oluşturuluyor.", err);
      db = new SQL.Database();
    }

    // Tabloları oluştur
    db.run(`CREATE TABLE IF NOT EXISTS metraj_data (id TEXT PRIMARY KEY, category TEXT, pos TEXT, desc TEXT, unit TEXT, price REAL, quantity REAL, mahal TEXT, type TEXT);`);
    db.run(`CREATE TABLE IF NOT EXISTS poz_library (id INTEGER PRIMARY KEY AUTOINCREMENT, pos TEXT, desc TEXT, unit TEXT, price REAL, category TEXT);`);

    // Boşsa doldur
    const res = db.exec("SELECT COUNT(*) as cnt FROM poz_library");
    if (res.length > 0 && res[0].values[0][0] === 0) {
        Object.keys(INITIAL_POS_LIBRARY).forEach(category => {
            // @ts-ignore
            INITIAL_POS_LIBRARY[category].forEach((item: any) => {
                const safeDesc = item.desc.replace(/'/g, "''");
                db.run(`INSERT INTO poz_library (pos, desc, unit, price, category) VALUES ('${item.pos}', '${safeDesc}', '${item.unit}', ${item.price}, '${category}')`);
            });
        });
    }

    return true;
  } catch (e) {
    console.error("DB Başlatma Hatası:", e);
    return false;
  }
};

export const searchPoses = (searchTerm: string) => {
  if (!db || !searchTerm) return [];
  const term = searchTerm.toLowerCase().replace(/'/g, "''");
  try {
    const res = db.exec(`SELECT * FROM poz_library WHERE lower(pos) LIKE '%${term}%' OR lower(desc) LIKE '%${term}%' LIMIT 50`);
    return resultToObjects(res);
  } catch (e) { return []; }
};

export const getNeighborPoses = (posNo: string) => {
  if (!db || !posNo) return [];
  try {
    const safePos = posNo.replace(/'/g, "''");
    const targetRes = db.exec(`SELECT id FROM poz_library WHERE pos = '${safePos}' LIMIT 1`);
    const targetRows = resultToObjects(targetRes);
    if (targetRows.length === 0) return [];

    const targetId = targetRows[0].id;
    const res = db.exec(`SELECT * FROM poz_library WHERE id BETWEEN ${targetId - 5} AND ${targetId + 5}`);
    return resultToObjects(res);
  } catch (e) { return []; }
};

export const getMetrajData = (type: string) => {
    if (!db) return [];
    const res = db.exec(`SELECT * FROM metraj_data WHERE type = '${type}'`);
    return resultToObjects(res);
};

export const addMetrajItem = (item: any, type: string) => {
    if (!db) return [];
    const id = Date.now().toString();
    const safeDesc = item.desc.replace(/'/g, "''");
    const mahal = item.mahal ? item.mahal.replace(/'/g, "''") : "";
    db.run(`INSERT INTO metraj_data (id, category, pos, desc, unit, price, quantity, mahal, type) VALUES ('${id}', '${item.category}', '${item.pos}', '${safeDesc}', '${item.unit}', ${item.price}, ${item.quantity}, '${mahal}', '${type}')`);
    return getMetrajData(type);
};

export const updateMetrajQuantity = (id: string | number, quantity: number, type: string) => {
    if (!db) return [];
    db.run(`UPDATE metraj_data SET quantity = ${quantity} WHERE id = '${id}'`);
    return getMetrajData(type);
};

export const updateMetrajLocation = (id: string | number, mahal: string, type: string) => {
    if (!db) return [];
    const safeMahal = mahal.replace(/'/g, "''");
    db.run(`UPDATE metraj_data SET mahal = '${safeMahal}' WHERE id = '${id}'`);
    return getMetrajData(type);
};

export const updateMetrajPose = (id: string | number, newPose: any, type: string) => {
    if (!db) return [];
    const safeDesc = newPose.desc.replace(/'/g, "''");
    db.run(`UPDATE metraj_data SET pos = '${newPose.pos}', desc = '${safeDesc}', unit = '${newPose.unit}', price = ${newPose.price}, category = '${newPose.category}' WHERE id = '${id}'`);
    return getMetrajData(type);
};