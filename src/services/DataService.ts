// ============================================================
// src/services/DataService.ts — 数据服务接口定义
// Store 层唯一依赖此接口，后续可替换为 ApiDataService 对接 MES/ERP。
// ============================================================

import type {
  RawBomNode,
  Project,
  AitWork,
  Task,
} from '@/types';

/**
 * 数据服务抽象接口。
 * Demo 使用 MockDataService 实现，后续替换为 ApiDataService 时 Store 零改动。
 */
export interface DataService {
  /** 获取原始 BOM JSON 树 */
  fetchBomTree(): Promise<RawBomNode>;
  /** 获取解析后的 Project 领域模型（含 Mock 状态） */
  fetchProject(): Promise<Project>;
  /** 获取预置 AIT 工作项（6 类） */
  fetchAitWorks(): Promise<AitWork[]>;
  /** 获取预置临时任务 */
  fetchTasks(): Promise<Task[]>;
}
