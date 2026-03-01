import axios from 'axios';

async function failOptimization() {
  try {
    await axios.post('https://nonexistent-api-endpoint.test', { test: true });
  } catch (e) {
    console.log('Optimization failed, should trigger Slack alert.');
  }
}

failOptimization();