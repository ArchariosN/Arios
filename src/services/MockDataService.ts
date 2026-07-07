// ============================================================
// src/services/MockDataService.ts — Mock 数据服务实现（v2）
// 从 public/data/bom_tree.json fetch 数据 → bomParser 解析
// 支持 fetchProjects / createProject / createProjectFromExample
// ============================================================

import type {
  RawBomNode,
  Project,
  AitWork,
  Task,
  DataService,
} from '@/types';
import { parseBomTree } from '@/utils/bomParser';
import { createDefaultAitWorks, createDefaultTasks } from './DataService';

/** 生成唯一 ID */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Mock 数据服务实现（v2）。
 * 从 public/data/bom_tree.json 加载原始数据，解析为领域模型。
 */
export class MockDataService implements DataService {
  /** 缓存原始 BOM JSON，避免重复 fetch */
  private rawCache: RawBomNode | null = null;
  /** 缓存解析后的示例项目 */
  private exampleProjectCache: Project | null = null;

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
   * 获取解析后的示例 Project（作为种子数据）。
   * 内部调用 fetchBomTree → parseBomTree。
   * 项目名固定为"灵犀10B示例项目"（仅作为示例数据标签，非硬编码业务逻辑）。
   */
  async fetchProject(): Promise<Project> {
    if (this.exampleProjectCache) {
      // 每次返回深拷贝，避免外部修改污染缓存
      return JSON.parse(JSON.stringify(this.exampleProjectCache)) as Project;
    }
    const raw = await this.fetchBomTree();
    const project = parseBomTree(raw, '灵犀10B示例项目');
    this.exampleProjectCache = project;
    return JSON.parse(JSON.stringify(project)) as Project;
  }

  /**
   * [v2] 获取所有项目列表。
   * 首次调用返回包含一个示例项目的数组，后续由 Store 从 localStorage 恢复。
   */
  async fetchProjects(): Promise<Project[]> {
    const example = await this.fetchProject();
    return [example];
  }

  /**
   * [v2] 创建空白新项目（无卫星）。
   */
  async createProject(params: {
    name: string;
    satelliteModel: string;
  }): Promise<Project> {
    const now = new Date().toISOString();
    return {
      id: genId('proj'),
      name: params.name,
      satelliteModel: params.satelliteModel,
      satellites: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * [v2] 从示例数据创建新项目（复制灵犀10B 数据为种子）。
   * 生成新 id + 新 name，但保留示例的卫星/分系统/单机结构。
   */
  async createProjectFromExample(name: string): Promise<Project> {
    const example = await this.fetchProject();
    const now = new Date().toISOString();
    return {
      ...JSON.parse(JSON.stringify(example)) as Project,
      id: genId('proj'),
      name,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 获取预置 AIT 工作项（6 类）。
   * v2: satellitePartNo 参数可选，每颗卫星独立副本。
   */
  async fetchAitWorks(satellitePartNo?: string): Promise<AitWork[]> {
    return createDefaultAitWorks(satellitePartNo);
  }

  /**
   * 获取预置临时任务（设计阶段 2 条）。
   * v2: satellitePartNo 参数可选，每颗卫星独立副本。
   */
  async fetchTasks(satellitePartNo?: string): Promise<Task[]> {
    return createDefaultTasks(satellitePartNo);
  }
}

/**
 * 模块级单例，Store 层通过此单例访问数据服务。
 * 后续替换为 ApiDataService 时，只需修改此导出。
 */
export const dataService: DataService = new MockDataService();
