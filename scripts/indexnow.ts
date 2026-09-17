/**
 * 更新したURLを検索エンジンに知らせる（IndexNow）。
 *
 * 使い方
 *   npx tsx scripts/indexnow.ts            … 直前のコミットで変わったスポット＋一覧側を送る
 *                                           （記録が読めないときは直近7日ぶんで代用する）
 *   npx tsx scripts/indexnow.ts --all      … 全URLを送る（最初の1回・作り直したときだけ）
 *   npx tsx scripts/indexnow.ts --dry-run  … 送らずに、送る予定のURLだけ数えて見せる
 *
 * ビルドのあと（postbuild）に自動で走る。ただし **Vercel の本番ビルドのときだけ**。
 * プレビューや手元のビルドでは何も送らない。
 *
 * 大事な約束：**この処理でビルドを失敗させない。** 送信に失敗しても記録を出して終了コード0で終わる。
 * 検索エンジンへの通知が遅れることより、サイトが出ないことのほうが困るため。
 */
import { execFileSync } from "node:child_process";
import { INDEXNOW_ENDPOINT, INDEXNOW_KEY, urlsToSubmit } from "../lib/indexnow";
import { SITE_URL } from "../lib/i18n";

/**
 * 直前のコミットで中身が変わったスポットを拾う。
 * 記録（.git）が読めない所（配信元の作りによっては入っていない）では null を返し、
 * 呼び出し側が「直近◯日」の目安に切り替える。
 */
function changedListings(): Array<{ genre: string; slug: string }> | null {
  try {
    const out = execFileSync("git", ["diff", "--name-only", "HEAD~1", "HEAD", "--", "data/listings"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const keys: Array<{ genre: string; slug: string }> = [];
    for (const line of out.split("\n")) {
      const m = line.trim().match(/^data\/listings\/([^/]+)\/([^/]+)\.json$/);
      if (m) keys.push({ genre: m[1], slug: m[2] });
    }
    return keys;
  } catch {
    return null;
  }
}

const argv = process.argv.slice(2);
const all = argv.includes("--all");
const dryRun = argv.includes("--dry-run");
/** postbuild から呼ばれたときは、本番ビルド以外では何もしない */
const fromBuild = argv.includes("--from-build");

async function main() {
  if (fromBuild && process.env.VERCEL_ENV !== "production") {
    console.log("[indexnow] 本番ビルドではないので何も送りません");
    return;
  }

  const changed = all ? null : changedListings();
  const urls = urlsToSubmit(changed ? { changed } : { all });
  if (urls.length === 0) {
    console.log("[indexnow] 変わったスポットがないので、送るものはありません");
    return;
  }

  const host = new URL(SITE_URL).host;
  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  if (dryRun) {
    console.log(`[indexnow] 送る予定 ${urls.length} 件（--dry-run なので送っていません）`);
    for (const u of urls.slice(0, 5)) console.log("  ", u);
    if (urls.length > 5) console.log(`   … ほか ${urls.length - 5} 件`);
    return;
  }

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  console.log(`[indexnow] ${urls.length} 件を送りました（返事 ${res.status}）`);
}

main().catch((err) => {
  // 失敗してもビルドは止めない
  console.log(`[indexnow] 送れませんでした：${err instanceof Error ? err.message : String(err)}`);
});
