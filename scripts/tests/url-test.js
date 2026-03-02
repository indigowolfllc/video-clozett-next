import axios from 'axios';

async function testURL() {
  try {
    const res = await axios.get('https://video-clozett-next.vercel.app');
    console.log('Status:', res.status);
  } catch (err) {
    console.error('Detected failure, should trigger Slack notification');
  }
}

testURL();