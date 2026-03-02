// scripts/setup/check-and-create-schema.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 定義しておきたいテーブルとカラム情報
const schemaDefinition = {
  urls: [
    { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
    { name: 'user_id', type: 'UUID REFERENCES auth.users(id)' },
    { name: 'url', type: 'TEXT' },
    { name: 'title', type: 'TEXT' },
    { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
    { name: 'http_status', type: 'INT' },
    { name: 'embed_success', type: 'BOOLEAN' }
  ],
  subscribers: [
    { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
    { name: 'user_id', type: 'UUID REFERENCES auth.users(id)' },
    { name: 'email', type: 'TEXT NOT NULL' },
    { name: 'joined_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
    { name: 'plan', type: 'VARCHAR(50)' },
    { name: 'status', type: 'VARCHAR(20) DEFAULT \'active\'' },
    { name: 'extra', type: 'JSONB' }
  ],
  click_logs: [
    { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
    { name: 'user_id', type: 'UUID REFERENCES auth.users(id)' },
    { name: 'url_id', type: 'BIGINT REFERENCES urls(id)' },
    { name: 'clicked_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
    { name: 'referrer', type: 'VARCHAR(255)' },
    { name: 'campaign', type: 'VARCHAR(50)' }
  ],
  ad_stats: [
    { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
    { name: 'url_id', type: 'BIGINT REFERENCES urls(id)' },
    { name: 'impressions', type: 'INT DEFAULT 0' },
    { name: 'clicks', type: 'INT DEFAULT 0' },
    { name: 'revenue', type: 'NUMERIC(10,2) DEFAULT 0' },
    { name: 'recorded_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' }
  ],
  kpi_metrics: [
    { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
    { name: 'metric_name', type: 'VARCHAR(50) NOT NULL' },
    { name: 'metric_value', type: 'NUMERIC(12,2)' },
    { name: 'calculated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
    { name: 'extra', type: 'JSONB' }
  ],
  reports: [
    { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
    { name: 'report_type', type: 'VARCHAR(50) NOT NULL' },
    { name: 'generated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
    { name: 'content', type: 'JSONB' },
    { name: 'status', type: 'VARCHAR(20) DEFAULT \'pending\'' }
  ],
  notifications: [
    { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
    { name: 'user_id', type: 'UUID REFERENCES auth.users(id)' },
    { name: 'type', type: 'VARCHAR(50) NOT NULL' },
    { name: 'message', type: 'TEXT' },
    { name: 'sent_at', type: 'TIMESTAMP WITH TIME ZONE' },
    { name: 'status', type: 'VARCHAR(20) DEFAULT \'pending\'' },
    { name: 'extra', type: 'JSONB' }
  ],
  scheduled_tasks: [
    { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
    { name: 'task_name', type: 'VARCHAR(50) NOT NULL' },
    { name: 'last_run', type: 'TIMESTAMP WITH TIME ZONE' },
    { name: 'interval_minutes', type: 'INT' },
    { name: 'status', type: 'VARCHAR(20) DEFAULT \'idle\'' },
    { name: 'extra', type: 'JSONB' }
  ],
  system_logs: [
    { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
    { name: 'log_type', type: 'VARCHAR(50)' },
    { name: 'message', type: 'TEXT' },
    { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT now()' },
    { name: 'extra', type: 'JSONB' }
  ]
};

// 実行関数
export async function ensureSchema() {
  for (const [table, columns] of Object.entries(schemaDefinition)) {
    // 1️⃣ テーブル作成（存在しなければ）
    const createTableSql = `CREATE TABLE IF NOT EXISTS ${table} ( ${columns.map(c => `${c.name} ${c.type}`).join(', ')} );`;
    await supabase.rpc('sql', { q: createTableSql }).catch(e => console.error(`Table create error [${table}]:`, e));

    // 2️⃣ カラムチェック・追加（存在しなければ）
    for (const column of columns) {
      const alterSql = `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`;
      await supabase.rpc('sql', { q: alterSql }).catch(e => console.error(`Column add error [${table}.${column.name}]:`, e));
    }
  }

  console.log('✅ 全テーブル・全カラムの存在チェック＆追加完了');
}