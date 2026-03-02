// utils/gemini-client.js
import fetch from 'node-fetch';

const GEMINI_MODE = process.env.GEMINI_MODE || 'mock';
const GEMINI_URL =
  GEMINI_MODE === 'mock'
    ? 'http://localhost:3001/analyze' // モックサーバー
    : 'https://gemini.example.com/analyze';

/**
 * URLs を Gemini に送って分析結果を取得
 * @param {Array<string>} urls
 * @returns {Promise<Array<Object>>} 分析結果
 */
export async function analyzeWithGemini(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return [];

  const payload = { urls };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Geminiサーバー応答エラー: ${res.status}`);
  }

  const data = await res.json();
  return data.results || [];
}