// ============================================================
// src/utils/__tests__/kitCalculator.test.ts
// 齐套率计算纯函数单元测试（v2：函数签名改为 Satellite）
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  calcSubsystemKit,
  calcAllKits,
  calcProjectMetrics,
  calcSatelliteKitRate,
  calcProjectSummary,
  calcSatelliteSummary,
} from '../kitCalculator';
import type {
  Project,
  Satellite,
  Subsystem,
  Unit,
  AitWork,
} from '@/types';

// ---------- 测试数据工厂 ----------

/** 创建一个单机设备（EQ） */
function makeEquipment(
  partNo: string,
  overrides: Partial<Unit> = {},
): Unit {
  return {
    partNo,
    name: `设备-${partNo}`,
    spec: '规格A',
    manufacturer: '厂商A',
    qualityLevel: 'A级',
    form: '单机',
    quantity: 1,
    location: '库房A',
    unit: '台',
    type: 'equipment',
    status: {
      electrical: true,
      qualification: true,
      flight: true,
    },
    inSatellite: ['flight'],
    isKitComplete: true,
    productionStatus: 'completed',
    deliveryDate: '2026-08-01',
    ...overrides,
  };
}

/** 创建一个零部件（PT） */
function makePart(partNo: string, overrides: Partial<Unit> = {}): Unit {
  return {
    partNo,
    name: `零件-${partNo}`,
    spec: '规格B',
    manufacturer: '厂商B',
    qualityLevel: 'B级',
    form: '零件',
    quantity: 1,
    location: '库房B',
    unit: '个',
    type: 'part',
    status: {
      electrical: false,
      qualification: false,
      flight: false,
    },
    inSatellite: [],
    isKitComplete: false,
    productionStatus: 'not_started',
    deliveryDate: null,
    ...overrides,
  };
}

/** 创建一个分系统 */
function makeSubsystem(
  partNo: string,
  units: Unit[],
  name?: string,
): Subsystem {
  return {
    partNo,
    name: name || `分系统-${partNo}`,
    units,
  };
}

/** 创建一颗卫星（v2） */
function makeSatellite(subsystems: Subsystem[]): Satellite {
  return {
    partNo: 'ST-TEST',
    name: '测试卫星',
    manufacturer: '测试厂商',
    subsystems,
  };
}

/** 创建一个完整的项目（v2 多星） */
function makeProject(subsystems: Subsystem[]): Project {
  return {
    id: 'proj-test-001',
    name: '测试卫星',
    satelliteModel: '测试卫星',
    satellites: [makeSatellite(subsystems)],
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
  };
}

// ---------- calcSubsystemKit 测试 ----------

describe('calcSubsystemKit', () => {
  describe('全齐套 (100%)', () => {
    it('所有单机 isKitComplete=true 时 rate 应为 100，status=complete', () => {
      const sub = makeSubsystem('SB-001', [
        makeEquipment('EQ001'),
        makeEquipment('EQ002'),
        makeEquipment('EQ003'),
      ]);
      const result = calcSubsystemKit(sub, 'all');
      expect(result.rate).toBe(100);
      expect(result.status).toBe('complete');
      expect(result.totalUnits).toBe(3);
      expect(result.completeUnits).toBe(3);
    });

    it('单个单机齐套时 rate 也应为 100', () => {
      const sub = makeSubsystem('SB-002', [makeEquipment('EQ001')]);
      const result = calcSubsystemKit(sub, 'all');
      expect(result.rate).toBe(100);
      expect(result.status).toBe('complete');
    });
  });

  describe('部分齐套 (0-99%)', () => {
    it('3 个单机中 2 个齐套，rate 应为 67，status=partial', () => {
      const sub = makeSubsystem('SB-003', [
        makeEquipment('EQ001', { isKitComplete: true }),
        makeEquipment('EQ002', { isKitComplete: true }),
        makeEquipment('EQ003', { isKitComplete: false }),
      ]);
      const result = calcSubsystemKit(sub, 'all');
      expect(result.rate).toBe(67);
      expect(result.status).toBe('partial');
      expect(result.completeUnits).toBe(2);
      expect(result.totalUnits).toBe(3);
    });

    it('4 个单机中 1 个齐套，rate 应为 25，status=partial', () => {
      const sub = makeSubsystem('SB-004', [
        makeEquipment('EQ001', { isKitComplete: true }),
        makeEquipment('EQ002', { isKitComplete: false }),
        makeEquipment('EQ003', { isKitComplete: false }),
        makeEquipment('EQ004', { isKitComplete: false }),
      ]);
      const result = calcSubsystemKit(sub, 'all');
      expect(result.rate).toBe(25);
      expect(result.status).toBe('partial');
    });

    it('所有单机都不齐套时 rate=0，status=none', () => {
      const sub = makeSubsystem('SB-005', [
        makeEquipment('EQ001', { isKitComplete: false }),
        makeEquipment('EQ002', { isKitComplete: false }),
      ]);
      const result = calcSubsystemKit(sub, 'all');
      expect(result.rate).toBe(0);
      expect(result.status).toBe('none');
      expect(result.completeUnits).toBe(0);
    });
  });

  describe('空分系统 (totalUnits=0)', () => {
    it('没有单机时 rate=0，status=none，totalUnits=0', () => {
      const sub = makeSubsystem('SB-006', []);
      const result = calcSubsystemKit(sub, 'all');
      expect(result.rate).toBe(0);
      expect(result.status).toBe('none');
      expect(result.totalUnits).toBe(0);
      expect(result.completeUnits).toBe(0);
    });
  });

  describe('四种 filter 筛选', () => {
    const sub = makeSubsystem('SB-FILTER', [
      makeEquipment('EQ-F1', {
        status: { electrical: true, qualification: true, flight: true },
        isKitComplete: true,
      }),
      makeEquipment('EQ-F2', {
        status: { electrical: true, qualification: false, flight: false },
        isKitComplete: false,
      }),
      makeEquipment('EQ-F3', {
        status: { electrical: false, qualification: true, flight: false },
        isKitComplete: false,
      }),
      makeEquipment('EQ-F4', {
        status: { electrical: false, qualification: false, flight: true },
        isKitComplete: false,
      }),
    ]);

    it("filter='all' 按 isKitComplete 统计 → 1/4=25%", () => {
      const result = calcSubsystemKit(sub, 'all');
      expect(result.completeUnits).toBe(1);
      expect(result.rate).toBe(25);
      expect(result.status).toBe('partial');
    });

    it("filter='electrical' 按 status.electrical 统计 → 2/4=50%", () => {
      const result = calcSubsystemKit(sub, 'electrical');
      expect(result.completeUnits).toBe(2);
      expect(result.rate).toBe(50);
    });

    it("filter='qualification' 按 status.qualification 统计 → 2/4=50%", () => {
      const result = calcSubsystemKit(sub, 'qualification');
      expect(result.completeUnits).toBe(2);
      expect(result.rate).toBe(50);
    });

    it("filter='flight' 按 status.flight 统计 → 2/4=50%", () => {
      const result = calcSubsystemKit(sub, 'flight');
      expect(result.completeUnits).toBe(2);
      expect(result.rate).toBe(50);
    });

    it("默认 filter 为 'all'（不传参数）", () => {
      const result = calcSubsystemKit(sub);
      expect(result.completeUnits).toBe(1);
      expect(result.rate).toBe(25);
    });
  });

  it('返回的 subsystemPartNo 和 subsystemName 正确', () => {
    const sub = makeSubsystem('SB-META', [makeEquipment('EQ001')], '电源分系统');
    const result = calcSubsystemKit(sub, 'all');
    expect(result.subsystemPartNo).toBe('SB-META');
    expect(result.subsystemName).toBe('电源分系统');
  });
});

// ---------- calcAllKits 测试 ----------

describe('calcAllKits', () => {
  it('对卫星所有分系统计算齐套状态', () => {
    const satellite = makeSatellite([
      makeSubsystem('SB-A', [
        makeEquipment('EQ001', { isKitComplete: true }),
        makeEquipment('EQ002', { isKitComplete: true }),
      ]),
      makeSubsystem('SB-B', [
        makeEquipment('EQ003', { isKitComplete: false }),
      ]),
    ]);
    const results = calcAllKits(satellite, 'all');
    expect(results).toHaveLength(2);
    expect(results[0].subsystemPartNo).toBe('SB-A');
    expect(results[0].rate).toBe(100);
    expect(results[1].subsystemPartNo).toBe('SB-B');
    expect(results[1].rate).toBe(0);
  });

  it('空卫星（无分系统）返回空数组', () => {
    const satellite = makeSatellite([]);
    const results = calcAllKits(satellite, 'all');
    expect(results).toHaveLength(0);
  });
});

// ---------- calcProjectMetrics 测试 ----------

describe('calcProjectMetrics', () => {
  it('正确计算 totalMaterials、kitRate、productionCount、aitWorkCount', () => {
    const satellite = makeSatellite([
      makeSubsystem('SB-A', [
        makeEquipment('EQ001', {
          isKitComplete: true,
          productionStatus: 'completed',
        }),
        makeEquipment('EQ002', {
          isKitComplete: false,
          productionStatus: 'in_progress',
        }),
        makePart('PT001', {
          isKitComplete: false,
          productionStatus: 'not_started',
        }),
      ]),
      makeSubsystem('SB-B', [
        makeEquipment('EQ003', {
          isKitComplete: true,
          productionStatus: 'completed',
        }),
      ]),
    ]);

    const aitWorks: AitWork[] = [
      {
        id: 'ait-1',
        name: '总装',
        type: 'assembly',
        order: 0,
        status: 'completed',
        relatedUnitPartNo: null,
        plannedDate: '2026-08-01',
        actualDate: '2026-08-03',
        owner: '王工',
        remark: '',
      },
      {
        id: 'ait-2',
        name: '电测',
        type: 'electrical_test',
        order: 0,
        status: 'in_progress',
        relatedUnitPartNo: null,
        plannedDate: '2026-09-01',
        actualDate: null,
        owner: '李工',
        remark: '',
      },
    ];

    const metrics = calcProjectMetrics(satellite, aitWorks);
    expect(metrics.totalMaterials).toBe(4);
    expect(metrics.kitRate).toBe(50);
    expect(metrics.productionCount).toBe(3);
    expect(metrics.aitWorkCount).toBe(2);
  });

  it('空卫星返回零值', () => {
    const satellite = makeSatellite([]);
    const metrics = calcProjectMetrics(satellite, []);
    expect(metrics.totalMaterials).toBe(0);
    expect(metrics.kitRate).toBe(0);
    expect(metrics.productionCount).toBe(0);
    expect(metrics.aitWorkCount).toBe(0);
  });

  it('全部齐套时 kitRate=100', () => {
    const satellite = makeSatellite([
      makeSubsystem('SB-A', [
        makeEquipment('EQ001', { isKitComplete: true }),
        makeEquipment('EQ002', { isKitComplete: true }),
      ]),
    ]);
    const metrics = calcProjectMetrics(satellite, []);
    expect(metrics.kitRate).toBe(100);
  });

  it('productionCount 排除 not_started 状态', () => {
    const satellite = makeSatellite([
      makeSubsystem('SB-A', [
        makeEquipment('EQ001', { productionStatus: 'not_started' }),
        makeEquipment('EQ002', { productionStatus: 'in_progress' }),
        makeEquipment('EQ003', { productionStatus: 'completed' }),
      ]),
    ]);
    const metrics = calcProjectMetrics(satellite, []);
    expect(metrics.productionCount).toBe(2);
  });
});

// ---------- calcSatelliteKitRate 测试 ----------

describe('calcSatelliteKitRate', () => {
  it('正确计算整星齐套率', () => {
    const satellite = makeSatellite([
      makeSubsystem('SB-A', [
        makeEquipment('EQ001', { isKitComplete: true }),
        makeEquipment('EQ002', { isKitComplete: false }),
      ]),
      makeSubsystem('SB-B', [
        makeEquipment('EQ003', { isKitComplete: true }),
        makeEquipment('EQ004', { isKitComplete: true }),
      ]),
    ]);
    expect(calcSatelliteKitRate(satellite)).toBe(75);
  });

  it('全部齐套返回 100', () => {
    const satellite = makeSatellite([
      makeSubsystem('SB-A', [
        makeEquipment('EQ001', { isKitComplete: true }),
        makeEquipment('EQ002', { isKitComplete: true }),
      ]),
    ]);
    expect(calcSatelliteKitRate(satellite)).toBe(100);
  });

  it('空卫星返回 0', () => {
    const satellite = makeSatellite([]);
    expect(calcSatelliteKitRate(satellite)).toBe(0);
  });

  it('四舍五入正确（2/3=67%）', () => {
    const satellite = makeSatellite([
      makeSubsystem('SB-A', [
        makeEquipment('EQ001', { isKitComplete: true }),
        makeEquipment('EQ002', { isKitComplete: true }),
        makeEquipment('EQ003', { isKitComplete: false }),
      ]),
    ]);
    expect(calcSatelliteKitRate(satellite)).toBe(67);
  });
});

// ---------- calcProjectSummary 测试 ----------

describe('calcProjectSummary', () => {
  it('正确聚合单星项目指标', () => {
    const project = makeProject([
      makeSubsystem('SB-A', [
        makeEquipment('EQ001', { isKitComplete: true }),
        makeEquipment('EQ002', { isKitComplete: false }),
      ]),
    ]);
    const summary = calcProjectSummary(project);
    expect(summary.satelliteCount).toBe(1);
    expect(summary.totalMaterials).toBe(2);
    expect(summary.kitRate).toBe(50);
  });

  it('正确聚合多星项目指标', () => {
    const sat1 = makeSatellite([
      makeSubsystem('SB-A', [
        makeEquipment('EQ001', { isKitComplete: true }),
        makeEquipment('EQ002', { isKitComplete: true }),
      ]),
    ]);
    const sat2: Satellite = {
      partNo: 'ST-002',
      name: '备星',
      manufacturer: '厂商B',
      subsystems: [
        makeSubsystem('SB-B', [
          makeEquipment('EQ003', { isKitComplete: false }),
          makeEquipment('EQ004', { isKitComplete: false }),
        ]),
      ],
    };
    const project: Project = {
      id: 'proj-multi',
      name: '多星项目',
      satelliteModel: '主星',
      satellites: [sat1, sat2],
      createdAt: '2026-06-26T00:00:00.000Z',
      updatedAt: '2026-06-26T00:00:00.000Z',
    };
    const summary = calcProjectSummary(project);
    expect(summary.satelliteCount).toBe(2);
    expect(summary.totalMaterials).toBe(4);
    expect(summary.kitRate).toBe(50); // 2/4
  });
});

// ---------- calcSatelliteSummary 测试 ----------

describe('calcSatelliteSummary', () => {
  it('正确计算单星摘要', () => {
    const satellite = makeSatellite([
      makeSubsystem('SB-A', [
        makeEquipment('EQ001', { isKitComplete: true }),
        makeEquipment('EQ002', { isKitComplete: false }),
      ]),
      makeSubsystem('SB-B', [
        makeEquipment('EQ003', { isKitComplete: true }),
      ]),
    ]);
    const summary = calcSatelliteSummary(satellite);
    expect(summary.partNo).toBe('ST-TEST');
    expect(summary.totalMaterials).toBe(3);
    expect(summary.kitRate).toBe(67);
    expect(summary.subsystemCount).toBe(2);
  });
});
