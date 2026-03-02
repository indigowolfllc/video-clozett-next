import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function main() {
  // 最新7日間のKPI取得
  const { data: kpis } = await supabase.from('kpi_metrics')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(7);

  // Gemini APIに送信して分析
  const analysis = await axios.post(process.env.GEMINI_API_URL, { metrics: kpis });

  // Slack通知
  if (analysis.data.alerts?.length > 0) {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: `⚠️ Gemini Analysis Alerts\n${analysis.data.alerts.map(a => `• ${a}`).join('\n')}`
    });
  }

  // GitHub Issue作成（改善提案）
  if (analysis.data.recommendations?.length > 0) {
    for (const rec of analysis.data.recommendations) {
      await axios.post(`https://api.github.com/repos/${process.env.GITHUB_REPO}/issues`, {
        title: `💡 Gemini Suggestion: ${rec.title}`,
        body: rec.detail
      }, {
        headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
      });
    }
  }
}

main().catch(err => {
  console.error('Gemini Analysis Error:', err);
  process.exit(1);
});