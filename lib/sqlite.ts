import * as SQLite from 'expo-sqlite';
import { CARD_DATABASE } from '../data/cards';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('cardmentor.db');
  await initializeSchema();
  return db;
}

async function initializeSchema(): Promise<void> {
  if (!db) return;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS offline_cards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      network TEXT NOT NULL,
      annual_fee_gbp REAL NOT NULL,
      earn_currency TEXT NOT NULL,
      accepted_widely INTEGER NOT NULL,
      fx_fee_pct REAL NOT NULL,
      section_75 INTEGER NOT NULL,
      earn_rates_json TEXT NOT NULL,
      benefits_json TEXT NOT NULL,
      voucher_json TEXT
    );

    CREATE TABLE IF NOT EXISTS offline_user_cards (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL,
      current_year_spend_gbp REAL DEFAULT 0,
      annual_fee_start_date TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS offline_benefit_utilisations (
      id TEXT PRIMARY KEY,
      user_card_id TEXT NOT NULL,
      benefit_id TEXT NOT NULL,
      period_key TEXT NOT NULL,
      used_gbp REAL DEFAULT 0,
      UNIQUE(user_card_id, benefit_id, period_key)
    );
  `);

  // Seed card definitions
  for (const card of CARD_DATABASE) {
    await db.runAsync(
      `INSERT OR REPLACE INTO offline_cards
        (id, name, issuer, network, annual_fee_gbp, earn_currency, accepted_widely,
         fx_fee_pct, section_75, earn_rates_json, benefits_json, voucher_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.id,
        card.name,
        card.issuer,
        card.network,
        card.annual_fee_gbp,
        card.earn_currency,
        card.accepted_widely ? 1 : 0,
        card.fx_fee_pct,
        card.section_75 ? 1 : 0,
        JSON.stringify(card.earn_rates),
        JSON.stringify(card.benefits),
        card.voucher ? JSON.stringify(card.voucher) : null,
      ]
    );
  }
}

export async function syncUserCardsToOffline(
  userCards: Array<{
    id: string;
    card_id: string;
    current_year_spend_gbp: number;
    annual_fee_start_date: string | null;
    is_active: boolean;
  }>
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM offline_user_cards');
  for (const uc of userCards) {
    await db.runAsync(
      `INSERT OR REPLACE INTO offline_user_cards
        (id, card_id, current_year_spend_gbp, annual_fee_start_date, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [
        uc.id,
        uc.card_id,
        uc.current_year_spend_gbp,
        uc.annual_fee_start_date ?? '',
        uc.is_active ? 1 : 0,
      ]
    );
  }
}

export async function getOfflineUserCards(): Promise<
  Array<{
    id: string;
    card_id: string;
    current_year_spend_gbp: number;
    annual_fee_start_date: string | null;
    is_active: boolean;
  }>
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    card_id: string;
    current_year_spend_gbp: number;
    annual_fee_start_date: string;
    is_active: number;
  }>('SELECT * FROM offline_user_cards WHERE is_active = 1');

  return rows.map((r) => ({
    ...r,
    annual_fee_start_date: r.annual_fee_start_date || null,
    is_active: r.is_active === 1,
  }));
}
