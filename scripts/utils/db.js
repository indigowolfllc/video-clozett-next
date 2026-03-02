// utils/db.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// 環境変数から Supabase 接続情報を取得
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Supabase 接続情報が未設定です。.env を確認してください。');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 指定テーブルが存在するか確認
 * @param {string} tableName
 * @returns {Promise<boolean>}
 */
export async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', tableName);

  if (error) {
    console.error(`テーブル確認エラー [${tableName}]`, error);
    return false;
  }
  return data.length > 0;
}

/**
 * テーブルから全データ取得
 * @param {string} tableName
 * @returns {Promise<Array<Object>>}
 */
export async function getAllFromTable(tableName) {
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    throw new Error(`データ取得エラー [${tableName}]: ${error.message}`);
  }
  return data;
}

/**
 * 複数テーブル確認
 * @param {Array<string>} tableNames
 * @returns {Promise<Object>} { tableName: true/false }
 */
export async function checkTables(tableNames) {
  const result = {};
  for (const name of tableNames) {
    result[name] = await checkTableExists(name);
  }
  return result;
}