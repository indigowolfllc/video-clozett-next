import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ .env に SUPABASE_URL と SUPABASE_KEY を設定してください');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tables = [
  {
    name: 'urls',
    columns: [
      { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
      { name: 'user_id', type: 'UUID REFERENCES auth.users(id)' },
      { name: 'url', type: 'TEXT' },
      { name: 'title', type: 'TEXT' },
      { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
      { name: 'http_status', type: 'INT' },
      { name: 'embed_success', type: 'BOOLEAN' },
    ],
  },
  {
    name: 'subscribers',
    columns: [
      { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
      { name: 'user_id', type: 'UUID REFERENCES auth.users(id)' },
      { name: 'email', type: 'TEXT NOT NULL' },
      { name: 'joined_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
      { name: 'plan', type: 'TEXT' },
      { name: 'status', type: 'VARCHAR(20) DEFAULT active' },
      { name: 'extra', type: 'JSONB' },
    ],
  },
  {
    name: 'click_logs',
    columns: [
      { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
      { name: 'user_id', type: 'UUID REFERENCES auth.users(id)' },
      { name: 'url_id', type: 'BIGINT REFERENCES urls(id)' },
      { name: 'clicked_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
      { name: 'referrer', type: 'VARCHAR(255)' },
      { name: 'campaign', type: 'VARCHAR(50)' },
    ],
  },
  {
    name: 'ad_stats',
    columns: [
      { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
      { name: 'url_id', type: 'BIGINT REFERENCES urls(id)' },
      { name: 'impressions', type: 'INT DEFAULT 0' },
      { name: 'clicks', type: 'INT DEFAULT 0' },
      { name: 'revenue', type: 'NUMERIC(10,2) DEFAULT 0' },
      { name: 'recorded_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
    ],
  },
  {
    name: 'kpi_metrics',
    columns: [
      { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
      { name: 'metric_name', type: 'VARCHAR(50) NOT NULL' },
      { name: 'metric_value', type: 'NUMERIC(12,2)' },
      { name: 'calculated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
      { name: 'extra', type: 'JSONB' },
    ],
  },
  {
    name: 'reports',
    columns: [
      { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
      { name: 'report_type', type: 'VARCHAR(50) NOT NULL' },
      { name: 'generated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
      { name: 'content', type: 'JSONB' },
      { name: 'status', type: 'VARCHAR(20) DEFAULT pending' },
    ],
  },
  {
    name: 'notifications',
    columns: [
      { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
      { name: 'user_id', type: 'UUID REFERENCES auth.users(id)' },
      { name: 'type', type: 'VARCHAR(50) NOT NULL' },
      { name: 'message', type: 'TEXT' },
      { name: 'sent_at', type: 'TIMESTAMP WITH TIME ZONE' },
      { name: 'status', type: 'VARCHAR(20) DEFAULT pending' },
      { name: 'extra', type: 'JSONB' },
    ],
  },
  {
    name: 'scheduled_tasks',
    columns: [
      { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
      { name: 'task_name', type: 'VARCHAR(50) NOT NULL' },
      { name: 'last_run', type: 'TIMESTAMP WITH TIME ZONE' },
      { name: 'interval_minutes', type: 'INT' },
      { name: 'status', type: 'VARCHAR(20) DEFAULT idle' },
      { name: 'extra', type: 'JSONB' },
    ],
  },
  {
    name: 'system_logs',
    columns: [
      { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
      { name: 'log_type', type: 'VARCHAR(50)' },
      { name: 'message', type: 'TEXT' },
      { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
      { name: 'extra', type: 'JSONB' },
    ],
  },
];

async function ensureTableAndColumns(table) {
  try {
    // テーブル作成
    let colsDef = table.columns.map(c => `${c.name} ${c.type}`).join(', ');
    await supabase.rpc('exec_sql', { sql: `CREATE TABLE IF NOT EXISTS ${table.name} (${colsDef});` });
    
    // カラム不足チェック & 自動追加
    for (const col of table.columns) {
      await supabase.rpc('exec_sql', {
        sql: `DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='${table.name}' AND column_name='${col.name}') THEN
            ALTER TABLE ${table.name} ADD COLUMN ${col.name} ${col.type};
          END IF;
        END $$;`
      });
    }
  } catch (err) {
    console.error(`❌ ${table.name} チェック・作成中にエラー:`, err.message || err);
  }
}

async function main() {
  console.log('🚀 Video CloZett 全自動フロー開始');

  for (const table of tables) {
    await ensureTableAndColumns(table);
  }

  console.log('✅ テーブル＆カラムチェック完了');

  // ダミーデータ投入（必要に応じて）
  try {
    const { data: urls } = await supabase.from('urls').insert([
      { url: 'https://example.com/page1', title: 'Example Page 1' },
      { url: 'https://example.com/page2', title: 'Example Page 2' },
      { url: 'https://example.com/page3', title: 'Example Page 3' },
    ]).select();

    console.log('✅ urls ダミー投入完了', urls);
  } catch (err) {
    console.error('❌ urls insert エラー:', err);
  }

  try {
    const { data: subs } = await supabase.from('subscribers').insert([
      { email: 'user1@example.com' },
      { email: 'user2@example.com' },
    ]).select();

    console.log('✅ subscribers ダミー投入完了', subs);
  } catch (err) {
    console.error('❌ subscribers insert エラー:', err);
  }

  console.log('🏁 完全自動フロー初回処理終了');
}

main().catch(console.error);