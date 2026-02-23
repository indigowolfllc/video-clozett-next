@echo off
:: [2602231030] Daily Insight Absolute Fix (Python-Driven Naming)
chcp 65001 > nul
set PATH=%PATH%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd;%LocalAppData%\Programs\Python\Python313;%LocalAppData%\Programs\Python\Python313\Scripts;C:\Python313;C:\Python313\Scripts
cd /d %~dp0

:: 1. 既存の古いMDファイルを一度すべてGitの対象にする（念のため）
git add *.md

:: 2. Pythonを実行（ここで正しい日付のファイルが作成・更新される）
python analyzer.py

:: 3. 作成されたファイルを強制的にGitHubへ叩き込む
git add .
git commit -m "feat: complete business metrics update"
git push origin master:main

echo ? GitHubへの反映を強制実行しました。
pause