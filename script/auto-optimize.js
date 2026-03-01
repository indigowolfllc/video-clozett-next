import axios from 'axios';

async function main() {
  // Geminiが提案した自動最適化案を取得
  const { data: optimizations } = await axios.get(`${process.env.GEMINI_API_URL}/auto-optimize`);

  if (!optimizations || optimizations.length === 0) {
    console.log('No optimizations needed.');
    return;
  }

  for (const opt of optimizations) {
    // 広告入札やレコメンドAPIに反映
    try {
      await axios.post(opt.api_endpoint, opt.payload);
      console.log(`Optimization applied: ${opt.description}`);
    } catch (e) {
      console.error(`Failed to apply optimization: ${opt.description}`, e);
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: `❌ Failed to apply optimization: ${opt.description}\nError: ${e.message}`
      });
    }
  }
}

main().catch(err => {
  console.error('Auto Optimization Error:', err);
  process.exit(1);
});