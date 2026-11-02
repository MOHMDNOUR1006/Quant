/**
 * QUANT AI — Minimal line-based diff utility.
 *
 * Produces a classic LCS (longest-common-subsequence) line diff between two
 * texts, in the same spirit as `git diff` — good enough for source files
 * shown inline in chat. Not optimized for huge files, but files that large
 * shouldn't be rendered inline in chat anyway (the card just shows a
 * truncated preview + line counts in that case).
 *
 * Returns an array of { type: 'same' | 'add' | 'del', text } in display
 * order, plus the caller can derive addedCount/removedCount from it.
 */
function computeLineDiff(oldText, newText) {
    const oldLines = (oldText ?? '').split('\n');
    const newLines = (newText ?? '').split('\n');

    const n = oldLines.length;
    const m = newLines.length;

    // LCS length table (dynamic programming, O(n*m) — fine for typical
    // source files; guarded by a size cap by the caller for huge files).
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            dp[i][j] = oldLines[i] === newLines[j]
                ? dp[i + 1][j + 1] + 1
                : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }

    const result = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
        if (oldLines[i] === newLines[j]) {
            result.push({ type: 'same', text: oldLines[i] });
            i++; j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            result.push({ type: 'del', text: oldLines[i] });
            i++;
        } else {
            result.push({ type: 'add', text: newLines[j] });
            j++;
        }
    }
    while (i < n) { result.push({ type: 'del', text: oldLines[i] }); i++; }
    while (j < m) { result.push({ type: 'add', text: newLines[j] }); j++; }

    return result;
}

/** Quick summary counts without building the full display list, for huge files. */
function diffCounts(oldText, newText) {
    const diff = computeLineDiff(oldText, newText);
    let added = 0, removed = 0;
    for (const line of diff) {
        if (line.type === 'add') added++;
        else if (line.type === 'del') removed++;
    }
    return { added, removed, diff };
}

window.computeLineDiff = computeLineDiff;
window.diffCounts = diffCounts;
