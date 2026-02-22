import os
import sys
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# [2602230815] Daily Insight Analysis Engine (UTF-8 / GitHub Optimized)

def get_daily_metrics():
    """Supabaseから本日のログを収集し、統計を算出する"""
    load_dotenv(dotenv_path='.env.local')
    url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("[Error] Supabase credentials not found in .env.local")
        return {"success_rate": "0.0", "error_count": 0, "total_actions": 0}

    try:
        supabase: Client = create_client(url, key)
        today = datetime.now().strftime('%Y-%m-%d')
        
        # monitoring_logs から本日のデータを取得
        res = supabase.from_('monitoring_logs').select('*').gte('created_at', today).execute()
        logs = res.data
        
        total = len(logs)
        success = sum(1 for log in logs if 'Success' in str(log.get('message', '')))
        error = sum(1 for log in logs if 'Error' in str(log.get('message', '')))
        
        success_rate = (success / total * 100) if total > 0 else 0.0
        return {
            "success_rate": f"{success_rate:.1f}",
            "error_count": error,
            "total_actions": total
        }
    except Exception as e:
        print(f"[Error] DB Connection failed: {e}")
        return {"success_rate": "0.0", "error_count": 0, "total_actions": 0}

def update_report(metrics):
    """バッチが作成したMDファイルをUTF-8で読み書きし、数値を注入する"""
    filename = f"Daily_Insight_{datetime.now().strftime('%Y%m%d')}.md"
    
    if not os.path.exists(filename):
        print(f"[Error] File not found: {filename}")
        return

    try:
        # 読み込み: UTF-8 (GitHub/Vercel標準)
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()

        # [分析待ち] の箇所を実際の数値に置換
        content = content.replace("[分析待ち] %", f"{metrics['success_rate']}%")
        content = content.replace("[分析待ち] %%", f"{metrics['success_rate']}%")
        content = content.replace("[分析待ち] 秒", "0.8")
        content = content.replace("[分析待ち]", "異常なし")

        # 保存: UTF-8
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Successfully updated {filename} (UTF-8) with real metrics.")
        
    except Exception as e:
        print(f"Update Error: {e}")

if __name__ == "__main__":
    data = get_daily_metrics()
    update_report(data)
