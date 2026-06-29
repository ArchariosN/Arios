// ============================================================
// src/utils/kitCalculator.ts — 齐套率计算纯函数
// 不存储齐套率，由 BOM 数据实时派生，避免双源不一致。
// ============================================================

import type {
  Project,
  Subsystem,
  SubsystemKitStatus,
  KitStatusType,
  KitFilter,
  ProjectMetrics,
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
 * 计算项目所有分系统的齐套状态。
 *
 * @param project - 项目领域模型
 * @param filter - 齐套筛选维度
 * @returns 所有分系统的齐套状态数组
 */
export function calcAllKits(
  project: Project,
  filter: KitFilter = 'all',
): SubsystemKitStatus[] {
  return project.satellite.subsystems.map((sub) =>
    calcSubsystemKit(sub, filter),
  );
}

/**
 * 计算项目总览指标。
 *
 * @param project - 项目领域模型
 * @param aitWorks - AIT 工作项列表
 * @returns 项目总览指标
 */
export function calcProjectMetrics(
  project: Project,
  aitWorks: AitWork[],
): ProjectMetrics {
  let totalMaterials = 0;
  let kitCompleteCount = 0;
  let productionCount = 0;

  for (const sub of project.satellite.subsystems) {
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
 * 计算整星齐套率（所有单机/零部件的总体齐套率）。
 */
export function calcSatelliteKitRate(project: Project): number {
  let total = 0;
  let complete = 0;
  for (const sub of project.satellite.subsystems) {
    for (const unit of sub.units) {
      total++;
      if (unit.isKitComplete) complete++;
    }
  }
  return total === 0 ? 0 : Math.round((complete / total) * 100);
}
