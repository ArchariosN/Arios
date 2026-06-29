// ============================================================
// src/utils/__tests__/seedRandom.test.ts
// 种子随机数生成器单元测试
// ============================================================

import { describe, it, expect } from 'vitest';
import { seededRandom, randInt } from '../seedRandom';

describe('seededRandom', () => {
  describe('可重现性', () => {
    it('同一 partNo 多次生成结果一致', () => {
      const partNo = 'EQ0101-220010';
      const rng1 = seededRandom(partNo);
      const rng2 = seededRandom(partNo);

      // 生成 10 个随机数，验证完全一致
      const seq1: number[] = [];
      const seq2: number[] = [];
      for (let i = 0; i < 10; i++) {
        seq1.push(rng1());
        seq2.push(rng2());
      }
      expect(seq1).toEqual(seq2);
    });

    it('同一 partNo 生成的单个随机数一致', () => {
      const partNo = 'EQ0102-000002';
      const rng1 = seededRandom(partNo);
      const rng2 = seededRandom(partNo);
      expect(rng1()).toBe(rng2());
    });

    it('长 partNo 也能稳定重现', () => {
      const partNo = 'EQ0101-220010-VERY-LONG-IDENTIFIER-2026';
      const rng1 = seededRandom(partNo);
      const rng2 = seededRandom(partNo);
      const seq1 = Array.from({ length: 20 }, () => rng1());
      const seq2 = Array.from({ length: 20 }, () => rng2());
      expect(seq1).toEqual(seq2);
    });
  });

  describe('差异性', () => {
    it('不同 partNo 生成不同结果', () => {
      const rng1 = seededRandom('EQ0101-220010');
      const rng2 = seededRandom('EQ0102-000002');

      const seq1: number[] = [];
      const seq2: number[] = [];
      for (let i = 0; i < 10; i++) {
        seq1.push(rng1());
        seq2.push(rng2());
      }
      // 至少有一个不同（实际上应该全部不同）
      expect(seq1).not.toEqual(seq2);
    });

    it('仅末尾不同的 partNo 也产生不同序列', () => {
      const rng1 = seededRandom('EQ0101-220010');
      const rng2 = seededRandom('EQ0101-220011');

      expect(rng1()).not.toBe(rng2());
    });
  });

  describe('取值范围', () => {
    it('生成的随机数在 [0, 1) 区间内', () => {
      const rng = seededRandom('EQ-RANGE-TEST');
      for (let i = 0; i < 1000; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('空字符串种子也能工作（不抛异常）', () => {
      const rng = seededRandom('');
      expect(() => rng()).not.toThrow();
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    });
  });
});

describe('randInt', () => {
  it('生成的整数在 [min, max] 范围内（含边界）', () => {
    const rng = seededRandom('EQ-RANDINT-TEST');
    for (let i = 0; i < 1000; i++) {
      const val = randInt(rng, 5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('min=max 时始终返回该值', () => {
    const rng = seededRandom('EQ-SINGLE-VAL');
    for (let i = 0; i < 10; i++) {
      expect(randInt(rng, 7, 7)).toBe(7);
    }
  });

  it('同一种子生成的 randInt 序列可重现', () => {
    const partNo = 'EQ0101-220010';
    const rng1 = seededRandom(partNo);
    const rng2 = seededRandom(partNo);

    const seq1: number[] = [];
    const seq2: number[] = [];
    for (let i = 0; i < 20; i++) {
      seq1.push(randInt(rng1, 1, 100));
      seq2.push(randInt(rng2, 1, 100));
    }
    expect(seq1).toEqual(seq2);
  });

  it('负数范围也能正确工作', () => {
    const rng = seededRandom('EQ-NEG-TEST');
    for (let i = 0; i < 100; i++) {
      const val = randInt(rng, -10, -5);
      expect(val).toBeGreaterThanOrEqual(-10);
      expect(val).toBeLessThanOrEqual(-5);
    }
  });
});
