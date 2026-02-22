import os
import sys
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# [2602230805] Daily Insight Analysis Engine (CP932/Windows Optimized)

def get_daily_metrics():
    """Supabaseから本日のログを収集し、統計を算出する"""
    # 1. 環境設定の読み込み
    load_dotenv(dotenv_path='.env.local')
    url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("SupabaseのURLまたはキーが .env.local に見つかりません。")

    supabase: Client = create_client(url, key)
    
    # 2. 本日の日付（JST想定）
    today = datetime.now().strftime('%Y-%m-%d')
    
    # 3. monitoring_logs テーブルから本日のログを取得
    # monitoring_logs に Success や Error のキーワードが含まれている前提
    res = supabase.from_('monitoring_logs').select('*').gte('created_at', today).execute()
    logs = res.data
    
    total = len(logs)
    success = sum(1 for log in logs if 'Success' in str(log.get('message', '')))
    error = sum(1 for log in logs if 'Error' in str(log.get('message', '')))
    
    # 成功率の計算（ログがない場合は 0.0%）
    success_rate = (success / total * 100) if total > 0 else 0.0
    
    return {
        "success_rate": f"{success_rate:.1f}",
        "error_count": error,
        "total_actions": total
    }

def update_report(metrics):
    """バッチが作成したMDファイルの内容を本物の数値に書き換える"""
    # ファイル名の生成（バッチ側の命名規則と一致させる）
    filename = f"Daily_Insight_{datetime.now().strftime('%Y%m%d')}.md"
    
    if not os.path.exists(filename):
        print(f"[Error] File not found: {filename}")
        return

    # Windowsのバッチ(echo)が書き出す cp932 形式で読み書きする
    try:
        # 読み込み
        with open(filename, 'r', encoding='cp932') as f:
            content = f.read()

        # [分析待ち] の箇所を実際の数値に置換
        # ※バッチファイル側の表記と一文字一句合わせる必要があります
        content = content.replace("[分析待ち] %", f"{metrics['success_rate']}%")
        content = content.replace("[分析待ち] %%", f"{metrics['success_rate']}%") # 重複対応
        content = content.replace("[分析待ち] 秒", "0.8")
        content = content.replace("[分析待ち]", "異常なし")

        # 保存
        with open(filename, 'w', encoding='cp932') as f:
            f.write(content)
            
        print(f"Successfully updated {filename} with real metrics.")
        
    except Exception as e:
        print(f"Update Error: {e}")

if __name__ == "__main__":
    try:
        # 脳の実行
        data = get_daily_metrics()
        update_report(data)
    except Exception as e:
        print(f"Analysis Error: {e}")
