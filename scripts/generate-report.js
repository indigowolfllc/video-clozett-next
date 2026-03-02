import fs from 'fs';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function main() {
  const { data: kpis } = await supabase.from('kpi_metrics')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(7);

  if (!fs.existsSync('reports')) fs.mkdirSync('reports');

  const doc = new PDFDocument();
  const filename = `reports/weekly-report-${Date.now()}.pdf`;
  doc.pipe(fs.createWriteStream(filename));

  doc.fontSize(18).text('Video CloZett Weekly Report', { align: 'center' });
  doc.moveDown();

  kpis.forEach(kpi => {
    doc.fontSize(12)
      .text(`${kpi.metric_date}: Users ${kpi.active_users}, Clicks ${kpi.total_clicks}, Ad Spend ${kpi.ad_spend}`);
  });

  doc.end();
  console.log('Report generated:', filename);
}

main().catch(err => {
  console.error('Report Generation Error:', err);
  process.exit(1);
});