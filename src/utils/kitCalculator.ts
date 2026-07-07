// ============================================================
// src/utils/kitCalculator.ts — 齐套率计算纯函数
// v2: 函数签名改为接收 Satellite（单星），新增项目级聚合
// ============================================================

import type {
  Project,
  Satellite,
  Subsystem,
  SubsystemKitStatus,
  KitStatusType,
  KitFilter,
  ProjectMetrics,
  ProjectSummary,
  SatelliteSummary,
  AitWork,
} from '@/types';

/**
 * 根据 rate 值判断齐套状态。
 * - 100 → complete
 * - >0  → partial
 * - 0   → none
 */
function rateToStatus(rate: number): KitStatusType {
  if (rate >= 100) return 'complete';
  if (rate > 0) return 'partial';
  return 'none';
}

/**
 * 计算单个分系统的齐套状态。
 *
 * @param subsystem - 分系统领域模型
 * @param filter - 齐套筛选维度，默认 'all'（按 isKitComplete）
 * @returns 分系统齐套状态（含 rate 和 status）
 */
export function calcSubsystemKit(
  subsystem: Subsystem,
  filter: KitFilter = 'all',
): SubsystemKitStatus {
  const totalUnits = subsystem.units.length;

  let completeUnits: number;
  if (filter === 'all') {
    completeUnits = subsystem.units.filter((u) => u.isKitComplete).length;
  } else if (filter === 'electrical') {
    completeUnits = subsystem.units.filter((u) => u.status.electrical).length;
  } else if (filter === 'qualification') {
    completeUnits = subsystem.units.filter(
      (u) => u.status.qualification,
    ).length;
  } else {
    // flight
    completeUnits = subsystem.units.filter((u) => u.status.flight).length;
  }

  const rate =
    totalUnits === 0
      ? 0
      : Math.round((completeUnits / totalUnits) * 100);

  return {
    subsystemPartNo: subsystem.partNo,
    subsystemName: subsystem.name,
    totalUnits,
    completeUnits,
    rate,
    status: rateToStatus(rate),
  };
}

/**
 * 计算单颗卫星所有分系统的齐套状态（v2：接收 Satellite）。
 *
 * @param satellite - 卫星领域模型
 * @param filter - 齐套筛选维度
 * @returns 所有分系统的齐套状态数组
 */
export function calcAllKits(
  satellite: Satellite,
  filter: KitFilter = 'all',
): SubsystemKitStatus[] {
  return satellite.subsystems.map((sub) =>
    calcSubsystemKit(sub, filter),
  );
}

/**
 * 计算单颗卫星的总览指标（v2：接收 Satellite）。
 *
 * @param satellite - 卫星领域模型
 * @param aitWorks - AIT 工作项列表
 * @returns 卫星总览指标
 */
export function calcProjectMetrics(
  satellite: Satellite,
  aitWorks: AitWork[],
): ProjectMetrics {
  let totalMaterials = 0;
  let kitCompleteCount = 0;
  let productionCount = 0;

  for (const sub of satellite.subsystems) {
    for (const unit of sub.units) {
      totalMaterials++;
      if (unit.isKitComplete) kitCompleteCount++;
      if (unit.productionStatus !== 'not_started') productionCount++;
    }
  }

  const kitRate =
    totalMaterials === 0
      ? 0
      : Math.round((kitCompleteCount / totalMaterials) * 100);

  return {
    totalMaterials,
    kitRate,
    productionCount,
    aitWorkCount: aitWorks.length,
  };
}

/**
 * 计算单颗卫星的齐套率（v2：接收 Satellite）。
 */
export function calcSatelliteKitRate(satellite: Satellite): number {
  let total = 0;
  let complete = 0;
  for (const sub of satellite.subsystems) {
    for (const unit of sub.units) {
      total++;
      if (unit.isKitComplete) complete++;
    }
  }
  return total === 0 ? 0 : Math.round((complete / total) * 100);
}

/**
 * 计算项目摘要（v2 新增）：聚合所有卫星的指标。
 *
 * @param project - 项目领域模型
 * @returns 项目摘要
 */
export function calcProjectSummary(project: Project): ProjectSummary {
  let totalMaterials = 0;
  let kitCompleteCount = 0;

  for (const sat of project.satellites) {
    for (const sub of sat.subsystems) {
      for (const unit of sub.units) {
        totalMaterials++;
        if (unit.isKitComplete) kitCompleteCount++;
      }
    }
  }

  const kitRate =
    totalMaterials === 0
      ? 0
      : Math.round((kitCompleteCount / totalMaterials) * 100);

  return {
    id: project.id,
    name: project.name,
    satelliteModel: project.satelliteModel,
    satelliteCount: project.satellites.length,
    totalMaterials,
    kitRate,
    updatedAt: project.updatedAt,
  };
}

/**
 * 计算单颗卫星摘要（v2 新增）。
 *
 * @param satellite - 卫星领域模型
 * @returns 卫星摘要
 */
export function calcSatelliteSummary(
  satellite: Satellite,
): SatelliteSummary {
  let totalMaterials = 0;
  let kitCompleteCount = 0;

  for (const sub of satellite.subsystems) {
    for (const unit of sub.units) {
      totalMaterials++;
      if (unit.isKitComplete) kitCompleteCount++;
    }
  }

  const kitRate =
    totalMaterials === 0
      ? 0
      : Math.round((kitCompleteCount / totalMaterials) * 100);

  return {
    partNo: satellite.partNo,
    name: satellite.name,
    totalMaterials,
    kitRate,
    subsystemCount: satellite.subsystems.length,
  };
}
