// ============================================================
// src/utils/bomParser.ts — 将 RawBomNode（JSON）解析为 Project 领域模型
// v2: 去硬编码，支持多星解析，项目名运行时传入
// ============================================================

import type {
  Project,
  RawBomNode,
  Satellite,
  Subsystem,
  Unit,
  UnitType,
  ProductionStatus,
} from '@/types';
import { seededRandom, randInt } from './seedRandom';

/** 生成唯一 ID */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 生成 2026-07-01 到 2026-10-31 范围内的随机日期（ISO 字符串）。
 * 基于 partNo 种子保证可重现。
 */
function generateDeliveryDate(rng: () => number): string | null {
  // 80% 概率有交付日期
  if (rng() < 0.2) return null;
  const start = new Date('2026-07-01').getTime();
  const end = new Date('2026-10-31').getTime();
  const offset = Math.floor(rng() * (end - start + 1));
  const date = new Date(start + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 生成随机投产状态。
 * < 0.3 → not_started, 0.3-0.7 → in_progress, > 0.7 → completed
 */
function generateProductionStatus(rng: () => number): ProductionStatus {
  const r = rng();
  if (r < 0.3) return 'not_started';
  if (r < 0.7) return 'in_progress';
  return 'completed';
}

/**
 * 从 flight/electrical 中随机选 1-2 个作为 inSatellite。
 */
function generateInSatellite(rng: () => number): string[] {
  const candidates = ['flight', 'electrical', 'qualification'];
  const count = randInt(rng, 1, 2);
  const result: string[] = [];
  const shuffled = [...candidates].sort(() => rng() - 0.5);
  for (let i = 0; i < count && i < shuffled.length; i++) {
    result.push(shuffled[i]);
  }
  return result;
}

/**
 * 解析单个 Unit（单机或零部件）节点。
 */
function parseUnit(node: RawBomNode): Unit {
  const partNo = node.part_no;
  const type: UnitType = partNo.startsWith('EQ')
    ? 'equipment'
    : partNo.startsWith('PT')
      ? 'part'
      : 'equipment';

  // 以 partNo + 卫星前缀为种子，确保不同卫星间可重现
  const rng = seededRandom(partNo);

  // PT 零部件不做三状态管理
  const isEquipment = type === 'equipment';

  const isKitComplete = rng() > 0.3; // ~70% 为 true

  const status = isEquipment
    ? {
        electrical: rng() > 0.4, // ~60% 为 true
        qualification: rng() > 0.5, // ~50% 为 true
        flight: rng() > 0.45, // ~55% 为 true
      }
    : {
        electrical: false,
        qualification: false,
        flight: false,
      };

  const productionStatus = isEquipment
    ? generateProductionStatus(rng)
    : 'not_started';

  const deliveryDate = isEquipment ? generateDeliveryDate(rng) : null;

  const inSatellite = isEquipment ? generateInSatellite(rng) : [];

  return {
    partNo,
    name: node.name || '',
    spec: node.spec || '',
    manufacturer: node.manufacturer || '',
    qualityLevel: node.quality_level || '',
    form: node.form || node.package || '',
    quantity: parseInt(node.quantity || '1', 10) || 1,
    location: node.location || '',
    unit: node.unit || '',
    type,
    status,
    inSatellite,
    isKitComplete,
    productionStatus,
    deliveryDate,
  };
}

/**
 * 解析分系统列表（level 2）。
 */
function parseSubsystems(nodes: RawBomNode[]): Subsystem[] {
  return nodes.map((node) => ({
    partNo: node.part_no,
    name: node.name || '',
    units: (node.children || []).map(parseUnit),
  }));
}

/**
 * 解析整星（level 1）。
 */
function parseSatellite(node: RawBomNode): Satellite {
  return {
    partNo: node.part_no,
    name: node.name || '',
    manufacturer: node.manufacturer || '',
    subsystems: parseSubsystems(node.children || []),
  };
}

/**
 * 将原始 BOM JSON 树解析为 Project 领域模型（v2 多星版）。
 *
 * 层级映射：
 * - level 0 (ROOT) → Project
 * - level 1 (ST) → Satellite（支持多个，组装为 satellites[]）
 * - level 2 (SB) → Subsystem[]
 * - level 3 (EQ or PT) → Unit[]
 *
 * @param raw - 原始 BOM JSON 根节点
 * @param projectName - 项目名称（可选，默认使用 raw.name）
 * @returns 完整的 Project 领域模型（含 satellites 数组）
 */
export function parseBomTree(
  raw: RawBomNode,
  projectName?: string,
): Project {
  // 收集所有 level 1 节点（多星支持）
  const satelliteNodes = (raw.children || []).filter(
    (c) => c.level === 1,
  );

  if (satelliteNodes.length === 0) {
    throw new Error('BOM 数据中未找到整星节点（level 1）');
  }

  const satellites = satelliteNodes.map(parseSatellite);
  const name = projectName || raw.name || '未命名项目';
  const now = new Date().toISOString();

  return {
    id: genId('proj'),
    name,
    satelliteModel: satellites[0]?.name ?? name,
    satellites,
    createdAt: now,
    updatedAt: now,
  };
}
