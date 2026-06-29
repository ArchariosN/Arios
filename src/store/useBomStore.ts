// ============================================================
// src/store/useBomStore.ts — BOM 树状态管理
// 职责：加载/查询/编辑单机，持久化到 localStorage
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, Unit } from '@/types';
import { dataService } from '@/services/MockDataService';

interface BomState {
  /** 项目领域模型（含完整 BOM 树） */
  project: Project | null;
  /** 加载中标志 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 标记是否已初始化（避免重复加载） */
  initialized: boolean;

  /** 加载 BOM 数据（若 localStorage 已有则跳过） */
  loadBom: () => Promise<void>;
  /** 更新指定 partNo 的单机属性（不可变更新） */
  updateUnit: (partNo: string, updates: Partial<Unit>) => void;
  /** 获取指定 partNo 的单机 */
  getUnit: (partNo: string) => Unit | undefined;
  /** 重置数据（清除 localStorage 并重新加载） */
  resetData: () => Promise<void>;
}

export const useBomStore = create<BomState>()(
  persist(
    (set, get) => ({
      project: null,
      loading: false,
      error: null,
      initialized: false,

      loadBom: async (): Promise<void> => {
        const state = get();
        // 若已有 project 数据（从 localStorage 恢复），跳过加载
        if (state.project && state.initialized) {
          return;
        }

        set({ loading: true, error: null });
        try {
          const project = await dataService.fetchProject();
          set({
            project,
            loading: false,
            error: null,
            initialized: true,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : '未知错误';
          set({ loading: false, error: message, initialized: true });
        }
      },

      updateUnit: (partNo, updates): void => {
        set((state) => {
          if (!state.project) return state;
          // 不可变更新：深拷贝到目标 Unit 所在路径，合并 updates
          const project: Project = {
            ...state.project,
            satellite: {
              ...state.project.satellite,
              subsystems: state.project.satellite.subsystems.map((sub) => ({
                ...sub,
                units: sub.units.map((u) =>
                  u.partNo === partNo ? { ...u, ...updates } : u,
                ),
              })),
            },
          };
          return { project };
        });
      },

      getUnit: (partNo): Unit | undefined => {
        const project = get().project;
        if (!project) return undefined;
        for (const sub of project.satellite.subsystems) {
          const unit = sub.units.find((u) => u.partNo === partNo);
          if (unit) return unit;
        }
        return undefined;
      },

      resetData: async (): Promise<void> => {
        // 清除当前状态，强制重新加载
        set({ project: null, initialized: false, loading: true });
        try {
          const project = await dataService.fetchProject();
          set({
            project,
            loading: false,
            error: null,
            initialized: true,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : '重置数据失败';
          set({ loading: false, error: message, initialized: true });
        }
      },
    }),
    {
      name: 'bom-storage',
      // 仅持久化 project，不持久化 loading/error/initialized
      partialize: (s) => ({ project: s.project, initialized: s.initialized }),
    },
  ),
);
