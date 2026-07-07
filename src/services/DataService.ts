// ============================================================
// src/services/DataService.ts — 数据服务接口定义（v2）
// Store 层唯一依赖此接口，后续可替换为 ApiDataService 对接 MES/ERP。
// ============================================================

import type {
  RawBomNode,
  Project,
  AitWork,
  Task,
  DataService as IDataService,
} from '@/types';

/**
 * 数据服务抽象接口（v2 扩展）。
 * Demo 使用 MockDataService 实现，后续替换为 ApiDataService 时 Store 零改动。
 */
export type { IDataService as DataService };

/**
 * 预置 AIT 工作项工厂（v2：按卫星生成独立副本）。
 */
export function createDefaultAitWorks(satellitePartNo?: string): AitWork[] {
  const suffix = satellitePartNo ? `-${satellitePartNo.slice(-4)}` : '';
  return [
    {
      id: `ait-001${suffix}`,
      name: '卫星总装',
      type: 'assembly',
      order: 0,
      status: 'completed',
      relatedUnitPartNo: null,
      plannedDate: '2026-08-01',
      actualDate: '2026-08-03',
      owner: '王工',
      remark: '整星总装完成',
    },
    {
      id: `ait-002${suffix}`,
      name: '综合电测 #1',
      type: 'electrical_test',
      order: 1,
      status: 'completed',
      relatedUnitPartNo: null,
      plannedDate: '2026-08-10',
      actualDate: '2026-08-12',
      owner: '李工',
      remark: '首次综合电测',
    },
    {
      id: `ait-003${suffix}`,
      name: '力学试验',
      type: 'mechanical_test',
      order: 2,
      status: 'completed',
      relatedUnitPartNo: null,
      plannedDate: '2026-08-20',
      actualDate: '2026-08-22',
      owner: '张工',
      remark: '正弦振动+随机振动',
    },
    {
      id: `ait-004${suffix}`,
      name: '综合电测 #2',
      type: 'electrical_test',
      order: 0,
      status: 'in_progress',
      relatedUnitPartNo: null,
      plannedDate: '2026-09-05',
      actualDate: null,
      owner: '李工',
      remark: '功能性能电测',
    },
    {
      id: `ait-005${suffix}`,
      name: '热试验',
      type: 'thermal_test',
      order: 0,
      status: 'pending',
      relatedUnitPartNo: null,
      plannedDate: '2026-09-15',
      actualDate: null,
      owner: '陈工',
      remark: '热真空+热平衡',
    },
    {
      id: `ait-006${suffix}`,
      name: 'EMC 试验',
      type: 'emc_test',
      order: 1,
      status: 'pending',
      relatedUnitPartNo: null,
      plannedDate: '2026-09-25',
      actualDate: null,
      owner: '刘工',
      remark: '电磁兼容性试验',
    },
  ];
}

/**
 * 预置临时任务工厂（v2：按卫星生成独立副本）。
 */
export function createDefaultTasks(satellitePartNo?: string): Task[] {
  const suffix = satellitePartNo ? `-${satellitePartNo.slice(-4)}` : '';
  return [
    {
      id: `task-001${suffix}`,
      name: '完成反作用飞轮设计评审',
      phaseType: 'design',
      relatedUnitPartNo: null,
      owner: '王工',
      dueDate: '2026-07-15',
      createdAt: '2026-06-26T09:00:00.000Z',
    },
    {
      id: `task-002${suffix}`,
      name: '星敏交付跟踪',
      phaseType: 'design',
      relatedUnitPartNo: null,
      owner: '李工',
      dueDate: '2026-07-20',
      createdAt: '2026-06-26T09:30:00.000Z',
    },
  ];
}

/** 保留原始类型导入用于类型推断 */
export type { RawBomNode, Project, AitWork, Task };
