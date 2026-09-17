【毎月 1 日 3:00 の自動実行プロンプト（playmiyazaki）】

前提：これは無人実行。作業前に CLAUDE.md、docs/要件.md、docs/design.md を読むこと。方針は CLAUDE.md が上位。書けない項目は null のまま。出典が確認できない情報は絶対に追加しない。

やること：

1. 生存確認（既存 listing 全件）
   - `data/listings/*/*.json` を全部順に見る
   - 各 listing の sources の URL を順に開く
   - 公式サイトが 404／閉業告知／別の店に変わっている → 該当 listing の status を "closed" にする（削除はしない）
   - URL がリダイレクトで変わっただけ、あるいは公式サイトのドメインが変わっただけなら sources を新しい URL に差し替える
   - 開けた listing はその日の日付で verified_at を更新
   - 「営業時間短縮」「臨時休業」など軽微な情報は今回は触らない（monthly では拾いきれないため）

2. 未掲載の追加（掲載件数が 1 件以上のジャンルのみ）
   - genre ごとに、宮崎県内でまだ掲載していないスポットを Google/公式サイト経由で探す
   - 追加は **ジャンルあたり最大 15 件、合計 30 件以内**（薄いページの粗製濫造を防ぐ）
   - 追加ルールは CLAUDE.md 通り：
     - 出典 URL 必須（公式サイト優先。Google マップ単独は不可）
     - 営業時間・料金・住所は出典に書いてある値のみ。無ければ null
     - price は出典金額をそのまま短く 1〜2 行（「約」「目安」は禁止）
     - features は出典で客観的に確認できるものだけ（主観語は禁止）
     - `data/taxonomy.json` に無い genre / category は使わない（足したくなったら止まって報告）
   - listing の追加は必ず `scripts/add-listing.ts` を通す（手書き JSON は禁止）

3. 検証と push
   - `npm run validate` を実行。失敗したら該当ファイルを直す（それでも通らなければ push せずに RESULT 行に理由を書いて終了）
   - `npm run build` を実行。失敗したら同上
   - 両方通ったら：
     - `git add data scripts` （必要なら app も）
     - `git commit -m "Monthly update YYYY-MM: +N listings, M closed"` （N と M は今回の実数）
     - `git push origin main`

4. 最後に 1 行だけ、以下の形式で必ず出力：
   `RESULT: +N listings, M closed／push YES|NO／コミット<hash 7桁>`

禁止（無人実行なので厳守）：
- 事業者へメール／フォーム送信／電話予約
- 出典が確認できない情報の追加
- CLAUDE.md／docs/要件.md／docs/design.md の方針変更
- `data/` 配下の一括削除、既存 listing JSON の削除
- `git push --force`、`rm -rf`
- 課金が発生する操作（有料 API、Vercel Pro など）
- playmiyazaki 以外のフォルダの変更
