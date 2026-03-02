import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function injectKPIAnomaly() {
  await supabase.from('kpi_metrics').insert([
    { metric_date: new Date(), active_users: 99999, total_clicks: 99999, ad_spend: 99999 }
  ]);
  console.log('Injected KPI anomaly for testing.');
}

injectKPIAnomaly();