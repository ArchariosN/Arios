// ============================================================
// src/utils/seedRandom.ts — 种子随机数生成器（mulberry32）
// 以 partNo 为种子生成确定性随机数，保证 Mock 数据可重现。
// ============================================================

/**
 * 基于字符串种子生成确定性伪随机数生成器。
 * 使用 mulberry32 算法，同一 seed 永远产生相同的随机数序列。
 *
 * @param seed - 种子字符串（通常为 partNo）
 * @returns 返回一个 () => number 函数，调用产生 [0, 1) 区间随机数
 */
export function seededRandom(seed: string): () => number {
  // 将字符串转换为 32 位整数 hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  let state = hash >>> 0;

  // mulberry32 PRNG
  return (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 在 [min, max] 范围内生成确定性整数。
 *
 * @param rng - seededRandom 返回的随机数生成器
 * @param min - 最小值（含）
 * @param max - 最大值（含）
 * @returns 整数
 */
export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
