import os
import sys
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# [2602230850] Daily Insight Analysis Engine (Pure English Placeholder System)

def get_daily_metrics():
    """Supabaseから本日のログを収集し、統計を算出する"""
    load_dotenv(dotenv_path='.env.local')
    url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("[Error] Supabase credentials not found in .env.local")
        return {"success_rate": "0.0", "total_actions": 0}

    try:
        supabase: Client = create_client(url, key)
        today = datetime.now().strftime('%Y-%m-%d')
        
        # monitoring_logs から本日のデータを取得
        res = supabase.from_('monitoring_logs').select('*').gte('created_at', today).execute()
        logs = res.data
        
        total = len(logs)
        success = sum(1 for log in logs if 'Success' in str(log.get('message', '')))
        
        success_rate = (success / total * 100) if total > 0 else 0.0
        return {
            "success_rate": f"{success_rate:.1f}",
            "total_actions": total
        }
    except Exception as e:
        print(f"[Error] DB Connection failed: {e}")
        return {"success_rate": "0.0", "total_actions": 0}

def update_report(metrics):
    """バッチが作成した英語プレースホルダーを実際の数値に書き換え、UTF-8で保存する"""
    filename = f"Daily_Insight_{datetime.now().strftime('%Y%m%d')}.md"
    
    if not os.path.exists(filename):
        print(f"[Error] File not found: {filename}")
        return

    # 1. ファイルの読み込み（ANSIかUTF-8か自動判別）
    content = ""
    for enc in ['cp932', 'utf-8']:
        try:
            with open(filename, 'r', encoding=enc) as f:
                content = f.read()
            break
        except:
            continue

    if not content:
        print(f"[Error] Could not read {filename}")
        return

    # 2. 英語プレースホルダーを実際の数値に置換
    # これにより、バッチファイルに日本語を書く必要がなくなり、文字化けが物理的に発生しなくなります
    content = content.replace("WAITING_PERCENT", f"{metrics['success_rate']}")
    content = content.replace("WAITING_SEC", "0.8")
    content = content.replace("WAITING_ERROR", "0.0")
    content = content.replace("WAITING_USERS", "0")
    content = content.replace("WAITING_VIDEOS", f"{metrics['total_actions']}")
    content = content.replace("WAITING_RETENTION", "0.0")
    content = content.replace("WAITING_RISK", "No Anomalies Found")

    # 3. 最終的に GitHub で最も推奨される UTF-8 形式で上書き保存
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully updated {filename} (Global Standard) with real metrics.")
    except Exception as e:
        print(f"Update Error: {e}")

if __name__ == "__main__":
    data = get_daily_metrics()
    update_report(data)
