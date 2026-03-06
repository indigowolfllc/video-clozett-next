// ============================================
// Video CloZett 完全自動フロー版
// 2026-03-02 更新版
// テーブル＆カラムの自動チェック＋不足分自動追加
// ============================================

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY not set in .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function ensureColumn(table, column, type = 'TEXT') {
  const { error } = await supabase.rpc('ensure_column', {
    table_name: table,
    column_name: column,
    column_type: type
  });
  if (error) console.log(`⚠ ${table}.${column} 確認/追加エラー:`, error);
}

async function ensureTablesAndColumns() {
  console.log('✅ テーブル＆カラムチェック開始');

  // URLs
  await supabase.rpc('ensure_table', { table_name: 'urls' });
  await ensureColumn('urls', 'id', 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY');
  await ensureColumn('urls', 'user_id', 'UUID REFERENCES auth.users(id)');
  await ensureColumn('urls', 'url', 'TEXT');
  await ensureColumn('urls', 'title', 'TEXT');
  await ensureColumn('urls', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT now()');
  await ensureColumn('urls', 'http_status', 'INT');
  await ensureColumn('urls', 'embed_success', 'BOOLEAN');

  // Subscribers
  await supabase.rpc('ensure_table', { table_name: 'subscribers' });
  await ensureColumn('subscribers', 'id', 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY');
  await ensureColumn('subscribers', 'user_id', 'UUID REFERENCES auth.users(id)');
  await ensureColumn('subscribers', 'email', 'TEXT NOT NULL');
  await ensureColumn('subscribers', 'joined_at', 'TIMESTAMP WITH TIME ZONE DEFAULT now()');
  await ensureColumn('subscribers', 'plan', 'TEXT');
  await ensureColumn('subscribers', 'status', "VARCHAR(20) DEFAULT 'active'");
  await ensureColumn('subscribers', 'extra', 'JSONB');

  // Click Logs
  await supabase.rpc('ensure_table', { table_name: 'click_logs' });
  await ensureColumn('click_logs', 'id', 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY');
  await ensureColumn('click_logs', 'user_id', 'UUID REFERENCES auth.users(id)');
  await ensureColumn('click_logs', 'url_id', 'BIGINT REFERENCES urls(id)');
  await ensureColumn('click_logs', 'clicked_at', 'TIMESTAMP WITH TIME ZONE DEFAULT now()');
  await ensureColumn('click_logs', 'referrer', 'VARCHAR(255)');
  await ensureColumn('click_logs', 'campaign', 'VARCHAR(50)');
  await ensureColumn('click_logs', 'extra', 'JSONB');

  // Ad Stats
  await supabase.rpc('ensure_table', { table_name: 'ad_stats' });
  await ensureColumn('ad_stats', 'id', 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY');
  await ensureColumn('ad_stats', 'url_id', 'BIGINT REFERENCES urls(id)');
  await ensureColumn('ad_stats', 'impressions', 'INT DEFAULT 0');
  await ensureColumn('ad_stats', 'clicks', 'INT DEFAULT 0');
  await ensureColumn('ad_stats', 'revenue', 'NUMERIC(10,2) DEFAULT 0');
  await ensureColumn('ad_stats', 'recorded_at', 'TIMESTAMP WITH TIME ZONE DEFAULT now()');

  // KPI Metrics
  await supabase.rpc('ensure_table', { table_name: 'kpi_metrics' });
  await ensureColumn('kpi_metrics', 'id', 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY');
  await ensureColumn('kpi_metrics', 'metric_name', 'VARCHAR(50) NOT NULL');
  await ensureColumn('kpi_metrics', 'metric_value', 'NUMERIC(12,2)');
  await ensureColumn('kpi_metrics', 'calculated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT now()');
  await ensureColumn('kpi_metrics', 'extra', 'JSONB');

  // Reports
  await supabase.rpc('ensure_table', { table_name: 'reports' });
  await ensureColumn('reports', 'id', 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY');
  await ensureColumn('reports', 'report_type', 'VARCHAR(50) NOT NULL');
  await ensureColumn('reports', 'generated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT now()');
  await ensureColumn('reports', 'content', 'JSONB');
  await ensureColumn('reports', 'status', "VARCHAR(20) DEFAULT 'pending'");

  // Notifications
  await supabase.rpc('ensure_table', { table_name: 'notifications' });
  await ensureColumn('notifications', 'id', 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY');
  await ensureColumn('notifications', 'user_id', 'UUID REFERENCES auth.users(id)');
  await ensureColumn('notifications', 'type', 'VARCHAR(50) NOT NULL');
  await ensureColumn('notifications', 'message', 'TEXT');
  await ensureColumn('notifications', 'sent_at', 'TIMESTAMP WITH TIME ZONE');
  await ensureColumn('notifications', 'status', "VARCHAR(20) DEFAULT 'pending'");
  await ensureColumn('notifications', 'extra', 'JSONB');

  // Scheduled Tasks
  await supabase.rpc('ensure_table', { table_name: 'scheduled_tasks' });
  await ensureColumn('scheduled_tasks', 'id', 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY');
  await ensureColumn('scheduled_tasks', 'task_name', 'VARCHAR(50) NOT NULL');
  await ensureColumn('scheduled_tasks', 'last_run', 'TIMESTAMP WITH TIME ZONE');
  await ensureColumn('scheduled_tasks', 'interval_minutes', 'INT');
  await ensureColumn('scheduled_tasks', 'status', "VARCHAR(20) DEFAULT 'idle'");
  await ensureColumn('scheduled_tasks', 'extra', 'JSONB');

  // System Logs
  await supabase.rpc('ensure_table', { table_name: 'system_logs' });
  await ensureColumn('system_logs', 'id', 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY');
  await ensureColumn('system_logs', 'log_type', 'VARCHAR(50)');
  await ensureColumn('system_logs', 'message', 'TEXT');
  await ensureColumn('system_logs', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT now()');
  await ensureColumn('system_logs', 'extra', 'JSONB');

  console.log('✅ テーブル＆カラムチェック完了');
}

async function insertDummyData() {
  console.log('🚀 ダミーデータ投入開始');

  // URLs
  const urls = [
    { url: 'https://example.com/page1', title: 'Example Page 1' },
    { url: 'https://example.com/page2', title: 'Example Page 2' },
    { url: 'https://example.com/page3', title: 'Example Page 3' },
  ];
  const { data: urlsData, error: urlsError } = await supabase.from('urls').insert(urls).select();
  if (urlsError) console.log('❌ urls insert エラー:', urlsError);
  else console.log('✅ urls ダミー投入完了', urlsData);

  // Subscribers
  const subscribers = [
    { email: 'user1@example.com', status: 'active' },
    { email: 'user2@example.com', status: 'active' },
  ];
  const { data: subsData, error: subsError } = await supabase.from('subscribers').insert(subscribers).select();
  if (subsError) console.log('❌ subscribers insert エラー:', subsError);
  else console.log('✅ subscribers ダミー投入完了', subsData);
}

async function main() {
  console.log('🚀 Video CloZett 全自動フロー開始');
  await ensureTablesAndColumns();
  await insertDummyData();
  console.log('🏁 完全自動フロー初回処理終了');
}

main().catch((err) => {
  console.log('❌ エラー発生', err);
});