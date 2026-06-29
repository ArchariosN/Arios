// ============================================================
// src/utils/__tests__/bomParser.test.ts
// BOM 解析器单元测试
// ============================================================

import { describe, it, expect } from 'vitest';
import { parseBomTree } from '../bomParser';
import type { RawBomNode, Project, Unit } from '@/types';
import { seededRandom } from '../seedRandom';
import * as fs from 'fs';
import * as path from 'path';

// ---------- 读取真实 BOM 数据 ----------

/**
 * 从 public/data/bom_tree.json 读取真实 BOM 数据。
 * 测试路径相对于项目根目录。
 */
function loadRealBom(): RawBomNode {
  const bomPath = path.resolve(
    __dirname,
    '../../../public/data/bom_tree.json',
  );
  const raw = fs.readFileSync(bomPath, 'utf8');
  return JSON.parse(raw) as RawBomNode;
}

// ---------- BOM 解析测试 ----------

describe('parseBomTree', () => {
  const rawBom = loadRealBom();
  const project: Project = parseBomTree(rawBom);

  describe('层级映射', () => {
    it('应解析出 1 个整星（level 1 → Satellite）', () => {
      expect(project.satellite).toBeDefined();
      expect(project.satellite.partNo).toBeDefined();
      expect(project.satellite.name).toBeTruthy();
    });

    it('应解析出 12 个分系统（level 2 → Subsystem[]）', () => {
      expect(project.satellite.subsystems).toHaveLength(12);
    });

    it('每个分系统应有正确的 partNo 和 name', () => {
      for (const sub of project.satellite.subsystems) {
        expect(sub.partNo).toBeTruthy();
        expect(sub.partNo.startsWith('SB')).toBe(true);
        expect(sub.name).toBeTruthy();
      }
    });

    it('Project 的 id 和 name 正确', () => {
      expect(project.id).toBe('proj-lx10b-001');
      expect(project.name).toBe('灵犀10B');
    });

    it('satelliteModel 应等于整星名称', () => {
      expect(project.satelliteModel).toBe(project.satellite.name);
    });
  });

  describe('单机/零部件生成', () => {
    it('所有 EQ 单机应生成 status/productionStatus/deliveryDate', () => {
      let eqCount = 0;
      for (const sub of project.satellite.subsystems) {
        for (const unit of sub.units) {
          if (unit.type === 'equipment') {
            eqCount++;
            // status 应有三个布尔字段
            expect(unit.status).toBeDefined();
            expect(typeof unit.status.electrical).toBe('boolean');
            expect(typeof unit.status.qualification).toBe('boolean');
            expect(typeof unit.status.flight).toBe('boolean');

            // productionStatus 应是有效枚举值
            expect(['not_started', 'in_progress', 'completed']).toContain(
              unit.productionStatus,
            );

            // deliveryDate 应是 null 或 'YYYY-MM-DD' 格式
            if (unit.deliveryDate !== null) {
              expect(unit.deliveryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            }
          }
        }
      }
      expect(eqCount).toBeGreaterThan(0);
    });

    it('PT 零部件的 status 应全为 false，productionStatus 为 not_started', () => {
      let ptCount = 0;
      for (const sub of project.satellite.subsystems) {
        for (const unit of sub.units) {
          if (unit.type === 'part') {
            ptCount++;
            expect(unit.status.electrical).toBe(false);
            expect(unit.status.qualification).toBe(false);
            expect(unit.status.flight).toBe(false);
            expect(unit.productionStatus).toBe('not_started');
            expect(unit.deliveryDate).toBeNull();
          }
        }
      }
      expect(ptCount).toBeGreaterThan(0);
    });

    it('EQ 单机的 partNo 应以 EQ 开头', () => {
      for (const sub of project.satellite.subsystems) {
        for (const unit of sub.units) {
          if (unit.type === 'equipment') {
            expect(unit.partNo.startsWith('EQ')).toBe(true);
          }
        }
      }
    });

    it('PT 零部件的 partNo 应以 PT 开头', () => {
      for (const sub of project.satellite.subsystems) {
        for (const unit of sub.units) {
          if (unit.type === 'part') {
            expect(unit.partNo.startsWith('PT')).toBe(true);
          }
        }
      }
    });

    it('所有 Unit 应有 isKitComplete 布尔值', () => {
      for (const sub of project.satellite.subsystems) {
        for (const unit of sub.units) {
          expect(typeof unit.isKitComplete).toBe('boolean');
        }
      }
    });

    it('所有 Unit 的 quantity 应为正整数', () => {
      for (const sub of project.satellite.subsystems) {
        for (const unit of sub.units) {
          expect(unit.quantity).toBeGreaterThan(0);
          expect(Number.isInteger(unit.quantity)).toBe(true);
        }
      }
    });

    it('所有 Unit 应有非空的 name', () => {
      for (const sub of project.satellite.subsystems) {
        for (const unit of sub.units) {
          expect(unit.name).toBeTruthy();
        }
      }
    });
  });

  describe('可重现性（种子随机）', () => {
    it('对同一 BOM 数据解析两次，结果应完全一致', () => {
      const project1 = parseBomTree(rawBom);
      const project2 = parseBomTree(rawBom);
      expect(JSON.stringify(project1)).toBe(JSON.stringify(project2));
    });

    it('EQ 单机的 Mock 状态与 seededRandom 直接生成一致', () => {
      // 取第一个 EQ 单机验证
      let firstEq: Unit | null = null;
      for (const sub of project.satellite.subsystems) {
        for (const unit of sub.units) {
          if (unit.type === 'equipment') {
            firstEq = unit;
            break;
          }
        }
        if (firstEq) break;
      }
      expect(firstEq).not.toBeNull();
      if (!firstEq) return;

      // 用同一 partNo 重新生成 rng 序列验证
      const rng = seededRandom(firstEq.partNo);
      const expectedIsKitComplete = rng() > 0.3;
      expect(firstEq.isKitComplete).toBe(expectedIsKitComplete);
    });
  });

  describe('边界情况', () => {
    it('缺少整星节点（level 1）时应抛出错误', () => {
      const invalidBom: RawBomNode = {
        level: 0,
        part_no: 'ROOT',
        name: '空项目',
        children: [],
      };
      expect(() => parseBomTree(invalidBom)).toThrow();
    });

    it('整星无子分系统时应返回空 subsystems 数组', () => {
      const minimalBom: RawBomNode = {
        level: 0,
        part_no: 'ROOT',
        name: '最小项目',
        children: [
          {
            level: 1,
            part_no: 'ST-001',
            name: '测试卫星',
            children: [],
          },
        ],
      };
      const result = parseBomTree(minimalBom);
      expect(result.satellite.subsystems).toHaveLength(0);
    });

    it('分系统无子节点时应返回空 units 数组', () => {
      const bomWithEmptySub: RawBomNode = {
        level: 0,
        part_no: 'ROOT',
        name: '测试项目',
        children: [
          {
            level: 1,
            part_no: 'ST-001',
            name: '测试卫星',
            children: [
              {
                level: 2,
                part_no: 'SB-001',
                name: '空分系统',
                children: [],
              },
            ],
          },
        ],
      };
      const result = parseBomTree(bomWithEmptySub);
      expect(result.satellite.subsystems).toHaveLength(1);
      expect(result.satellite.subsystems[0].units).toHaveLength(0);
    });
  });

  describe('数据完整性', () => {
    it('总单机/零部件数应与原始 BOM level 3 节点数一致', () => {
      // 统计原始 BOM level 3 节点数
      let rawCount = 0;
      const sat = rawBom.children?.find((c) => c.level === 1);
      if (sat?.children) {
        for (const sb of sat.children) {
          rawCount += (sb.children || []).length;
        }
      }

      // 统计解析后的 units 总数
      let parsedCount = 0;
      for (const sub of project.satellite.subsystems) {
        parsedCount += sub.units.length;
      }

      expect(parsedCount).toBe(rawCount);
    });
  });
});
