【安全ルール】
確認は原則スキップして進めてよい。ただし以下は絶対に実行せず、必要になったら先に私に確認すること。
(1) 全データの削除や取り返しのつかない操作（DROP TABLE、条件なしの DELETE FROM、git push --force、rm -rf、git stash drop/clear など）
(2) 課金や支払いが発生する操作
(3) 既存 listing JSON の削除・書き換え。Windows の電源設定・セキュリティ設定の変更（今回作るのは「タスク スケジューラの登録」と「スクリプトの追加」だけ）。C:\projects 配下の他のプロジェクトのファイル変更

【前提】
CLAUDE.md、docs/要件.md を最初に読むこと。★作業前に git fetch origin → git checkout main → git pull --ff-only origin main（本番は main の 5307da4 まで反映済み）。
目的：**C:\projects 配下の全プロジェクト共通で**、PC がスリープ中でも決まった時刻に起き、Claude Code が「順番待ちのプロンプト」や「毎月の更新」を人手なしで実行し、push まで終える仕組みを作る。運営者（じゅん）はコピペを一切しない。設計側の Claude が各プロジェクトの tasks/queue/ に .txt を直接置くと、10分以内に自動で実行される。
Claude Code には対話なしで動く print モード（claude -p "プロンプト"）がある。これを Windows のタスク スケジューラから起動する。
★ 仕組みは playmiyazaki 専用ではなく、**C:\projects\<どのプロジェクト>\tasks\queue\ でも拾う**共通ランナーとして作る。今後フォルダを増やしても登録し直し不要。

【やること】STEP 12：全プロジェクト共通の自動実行の仕組み

1. 共通ランナーの置き場所 C:\projects\_agent\ を作る（git リポジトリにはしない）
   - C:\projects\_agent\run-agent.ps1 … 本体（下の 2）
   - C:\projects\_agent\logs\       … 実行ログ（<プロジェクト名>_YYYY-MM-DD_HHmm.log）
   - C:\projects\_agent\README.md   … 運営者向け説明（下の 5）
   - バックアップとして同じ run-agent.ps1 を playmiyazaki/scripts/ にもコピーしてコミットする
   各プロジェクト側の約束（playmiyazaki には今回作る。他は将来 queue を置いた時点で自動的に対象になる）：
   - tasks/queue/    …「次に実行してほしいプロンプト」の .txt。ファイル名順に1本ずつ。.gitkeep を置く
   - tasks/done/     … 実行済みの .txt を移す（同名＋実行日時）
   - tasks/monthly.md … あれば毎月1日に実行する標準プロンプト（無いプロジェクトは月次スキップ）

2. C:\projects\_agent\run-agent.ps1 を作る（PowerShell 5.1 で動くこと）
   引数：-Mode queue | monthly
   動作の順番：
   a. [Console]::OutputEncoding と $OutputEncoding を UTF-8 に
   b. 対象を決める
      - queue：C:\projects\*\tasks\queue\*.txt を全部集め、ファイル名（日付＋連番）で昇順に並べ、**先頭1本だけ**を実行対象にする（1回の起動で1本。次は10分後）。無ければ「実行対象なし」で静かに終了（ログも残さない）
      - monthly：C:\projects\*\tasks\monthly.md を持つプロジェクトを順に全部実行
      - _agent フォルダ自身と、.git が無いフォルダ、CLAUDE.md が無いフォルダは対象外（ログに「スキップ：理由」）
   c. 対象プロジェクトに Set-Location → ログファイルを開く（C:\projects\_agent\logs\<プロジェクト名>_YYYY-MM-DD_HHmm.log）。以降の全出力をログにも書く
   d. git fetch origin → git status で未コミットの変更があれば「作業ツリーが汚れている」とログに書いて **そのプロジェクトは中断**（人が途中の作業を上書きしないため。queue の .txt はそのまま残す）→ git pull --ff-only origin <既定ブランチ>（main が無ければ master）
   e. プロンプトの先頭に、次の「無人実行ヘッダー」を必ず連結してから渡す：
      「これは無人の自動実行です。人に確認する手段は無いので、確認が必要になる操作は **行わずにスキップしてログに理由を書く** こと。絶対禁止：全データの削除、git push --force、rm -rf、条件なしの一括削除、課金・契約、外部への連絡（メール・フォーム・電話）、出典の無い情報の追加、CLAUDE.md の方針変更、このプロジェクト以外のフォルダの変更。ビルドが通らなければ push しない（変更は git stash ではなく、そのまま残してログに書く）。最後に必ず『RESULT: <一行の要約>／push YES|NO／コミット<hash>』の1行を出す。」
   f. claude -p "<連結したプロンプト>" --permission-mode acceptEdits --max-turns 400 を実行し、標準出力をログに流す
      ★ 無人なので権限確認で止まらない設定が要る。--dangerously-skip-permissions は使わず、acceptEdits＋ヘッダーの禁止事項で安全側に倒す。もし acceptEdits では bash 実行（npm run build や git push）が権限待ちで止まるなら、**ユーザー設定（~/.claude/settings.json）** の permissions.allow に必要なコマンド（Bash(npm run build)、Bash(npm run validate)、Bash(git add:*)、Bash(git commit:*)、Bash(git push origin main) 等）を最小限だけ登録する方法に切り替え、その内容を報告する（全プロジェクト共通で効くようにユーザー設定に入れる）
   g. queue モードなら、実行後にその .txt を tasks/done/ に移動し、git add tasks/done tasks/queue → コミット「Queue: <ファイル名> executed」→ push（プロンプト本体の変更は Claude Code 自身が push している前提。していなければここで一緒に push）
   h. 終了コードとログの場所を最後に出力
   ★ 罠：タスク スケジューラから起動すると PATH が違い claude が見つからないことがある。where.exe claude で実際のパスを調べ、スクリプトには **絶対パス** を書く（npm のグローバル bin、例 C:\Users\junra\AppData\Roaming\npm\claude.cmd）
   ★ 罠：ログの文字化け（a で対処）
   ★ 罠：git の認証。タスクから起動しても push できるか、手順 6 の手動テストで必ず確認する（Windows 資格情報マネージャーに GitHub の資格情報があれば動く。無ければ報告して止まる）
   ★ 罠：同時起動。Queue が10分ごとに走るので、前の実行がまだ動いている間は新しい実行を始めない（タスク側の MultipleInstances = IgnoreNew に加え、スクリプト側でも C:\projects\_agent\running.lock を作って二重起動を防ぐ。3時間より古い lock は壊れたものとして無視）

3. タスク スケジューラに2つ登録する（Register-ScheduledTask で。管理者権限が要る場合はその旨を報告し、管理者 PowerShell で実行するコマンドを1行にして出す）
   - 「Claude Agent Queue」：**10分ごと**（無期限に繰り返し）、run-agent.ps1 -Mode queue。空なら数秒で終わる。MultipleInstances = IgnoreNew
   - 「Claude Agent Monthly」：毎月1日 3:00、run-agent.ps1 -Mode monthly、-WakeToRun（スリープから起こす）
   - 両方とも：-AllowStartIfOnBatteries は付けない（AC 電源前提）、-ExecutionTimeLimit 3時間、-RunOnlyIfNetworkAvailable、ログオン中のユーザーとして実行（-LogonType Interactive。PC はシャットダウンではなくスリープ運用が前提）
   - 実行アクション：powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\projects\_agent\run-agent.ps1 -Mode <mode>
   ★ 既に「Claude_Wake…」という名前のタスクが登録されているようなので、Get-ScheduledTask で一覧を取り、重複や競合（同じ時刻に別の Claude が起動する等）があれば報告する。他のタスクは消さない

4. playmiyazaki/tasks/monthly.md を書く（毎月1日の標準プロンプト）。内容：
   - CLAUDE.md・docs/要件.md・docs/design.md を読む
   - 既存 listing 全件の sources を開いて生存確認（開けない・閉業表示・別の店 → status を "closed" に。URL が変わっただけなら sources を更新）。verified_at を更新
   - 掲載件数が1件以上のジャンルごとに、未掲載のスポットを出典付きで探して追加（ジャンルあたり最大15件、合計30件以内。出典・features・price のルールは CLAUDE.md 通り。確認できないものは追加しない）
   - npm run validate → npm run build → 通ったら コミット「Monthly update YYYY-MM: +N listings, M closed」→ push
   - 最後に RESULT 行

5. C:\projects\_agent\README.md に、運営者向けのやさしい日本語で：どのプロジェクトでも tasks/queue に .txt を置けば10分以内に勝手に実行される／tasks/monthly.md があるプロジェクトは毎月1日 3:00 に走る／新しいプロジェクトを対象にするには、そのフォルダに tasks/queue を作るだけ（git リポジトリと CLAUDE.md が必要）／PC はスリープのままで良いがシャットダウンは不可・電源ケーブルは挿しておく／ログは C:\projects\_agent\logs／止めたいときはタスク スケジューラで「Claude Agent Queue」「Claude Agent Monthly」を無効化

6. 手動テスト（重要）
   - playmiyazaki/tasks/queue/ に 0000_test.txt（内容：「tasks/README.md の末尾に『動作確認 YYYY-MM-DD HH:mm』の1行を追記し、コミット『Queue test』して push すること。RESULT 行を出すこと」）を置く（tasks/README.md が無ければ「この仕組みの説明は C:\projects\_agent\README.md にある」の1行で作る）
   - ★ tasks/queue/ には既に 2026-09-17_STEP14.txt（料金の拾い直し）が置いてある。0000_test.txt が先に実行される。test が通ったら、STEP14 は次の10分ごとの実行で自動的に走るので、このプロンプト内では実行しない（走り始めても止めない）
   - Start-ScheduledTask "Claude Agent Queue" で実際にタスク経由で起動し、ログに RESULT 行が出て、GitHub に「Queue test」のコミットが上がることを確認する
   - 通らなければ原因（PATH／権限待ち／git 認証／文字化け／lock）を直して再テスト。3回やって通らなければ、状況を報告して止まる

7. playmiyazaki 側の変更（tasks/、scripts/run-agent.ps1 のコピー）をコミットして push。メッセージは「Add unattended runner (shared task scheduler + queue)」。

【禁止】
- --dangerously-skip-permissions の使用（無人で取り返しのつかない操作を許すため）
- 電源プラン・スリープ設定・BIOS・セキュリティソフト等の変更（既に運営者が設定済み。触らない）
- 既存の他タスクの削除・変更
- listing データ・ページ・デザインの変更
- playmiyazaki 以外のプロジェクトのファイル変更（将来 queue が置かれた時点で自動対象になればよい）

【報告してほしいこと】
- claude の絶対パス、ユーザー設定 settings.json に足した permissions（あれば）
- 登録したタスク2つの名前・間隔／時刻・WakeToRun の設定（Get-ScheduledTask の結果を要約）と、既存の Claude 関連タスクとの競合の有無
- 手動テストの結果（RESULT 行の内容、コミットハッシュ、何回目で通ったか）
- 通らなかった場合：どこで止まったか（PATH／権限／git 認証／文字化け／lock）
- 迷った点（無ければ「なし」）

END OF PROMPT
