// ============================================================
// src/services/MockDataService.ts — Mock 数据服务实现
// 从 public/data/bom_tree.json fetch 数据 → bomParser 解析 → 种子随机生成状态
// ============================================================

import type {
  RawBomNode,
  Project,
  AitWork,
  Task,
  DataService,
} from '@/types';
import { parseBomTree } from '@/utils/bomParser';

/**
 * Mock 数据服务实现。
 * 从 public/data/bom_tree.json 加载原始数据，解析为领域模型。
 */
export class MockDataService implements DataService {
  /** 缓存原始 BOM JSON，避免重复 fetch */
  private rawCache: RawBomNode | null = null;

  /**
   * 从 public/data/bom_tree.json 获取原始 BOM JSON。
   */
  async fetchBomTree(): Promise<RawBomNode> {
    if (this.rawCache) {
      return this.rawCache;
    }
    const response = await fetch('/data/bom_tree.json');
    if (!response.ok) {
      throw new Error(
        `加载 BOM 数据失败: ${response.status} ${response.statusText}`,
      );
    }
    this.rawCache = (await response.json()) as RawBomNode;
    return this.rawCache;
  }

  /**
   * 获取解析后的 Project 领域模型。
   * 内部调用 fetchBomTree → parseBomTree。
   */
  async fetchProject(): Promise<Project> {
    const raw = await this.fetchBomTree();
    return parseBomTree(raw);
  }

  /**
   * 获取预置 AIT 工作项（6 类）。
   * 初始状态分散：2 个 pending, 1 个 in_progress, 3 个 completed。
   * order 按状态列内排序，从 0 开始。
   */
  async fetchAitWorks(): Promise<AitWork[]> {
    return [
      {
        id: 'ait-001',
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
        id: 'ait-002',
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
        id: 'ait-003',
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
        id: 'ait-004',
        name: '综合电测 #2',
        type: 'electrical_test',
        order: 0,
        status: 'in_progress',
        relatedUnitPartNo: 'EQ0101-220010',
        plannedDate: '2026-09-05',
        actualDate: null,
        owner: '李工',
        remark: '功能性能电测',
      },
      {
        id: 'ait-005',
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
        id: 'ait-006',
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
   * 获取预置临时任务（设计阶段 2 条）。
   */
  async fetchTasks(): Promise<Task[]> {
    return [
      {
        id: 'task-001',
        name: '完成反作用飞轮设计评审',
        phaseType: 'design',
        relatedUnitPartNo: 'EQ0101-220010',
        owner: '王工',
        dueDate: '2026-07-15',
        createdAt: '2026-06-26T09:00:00.000Z',
      },
      {
        id: 'task-002',
        name: '星敏交付跟踪',
        phaseType: 'design',
        relatedUnitPartNo: 'EQ0102-000002',
        owner: '李工',
        dueDate: '2026-07-20',
        createdAt: '2026-06-26T09:30:00.000Z',
      },
    ];
  }
}

/**
 * 模块级单例，Store 层通过此单例访问数据服务。
 * 后续替换为 ApiDataService 时，只需修改此导出。
 */
export const dataService: DataService = new MockDataService();
