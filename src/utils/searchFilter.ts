/**
 * 検索クエリで文字列配列をフィルタする。
 * - スペース区切り = AND（半角 " " と全角 "　" の両方）
 * - "|" 区切り = OR（半角 "|" と全角 "｜" の両方）
 * - 大文字小文字を区別しない
 * - OR が先に評価される（"A B|C" → "A AND (B OR C)"）
 *
 * @param query 検索クエリ文字列
 * @param targets フィルタ対象の文字列配列（名前、住所、メモなどを結合して渡す）
 * @returns マッチするかどうか
 */
export function matchesQuery(query: string, targets: string[]): boolean {
  const trimmed = query.trim();
  if (trimmed === "") return true;

  // 全角スペース→半角スペース、全角｜→半角| に正規化
  const normalized = trimmed.replace(/\u3000/g, " ").replace(/\uff5c/g, "|");

  // 検索対象を結合して小文字化
  const haystack = targets.filter(Boolean).join(" ").toLowerCase();

  // スペースで split → AND条件
  const andTerms = normalized.split(" ").filter((t) => t !== "");

  // 全ての AND 条件について、少なくとも1つの OR 条件がマッチ
  return andTerms.every((andTerm) => {
    const orTerms = andTerm.split("|").filter((t) => t !== "");
    if (orTerms.length === 0) return true;
    return orTerms.some((orTerm) => haystack.includes(orTerm.toLowerCase()));
  });
}
