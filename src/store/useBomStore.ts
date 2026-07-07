// ============================================================
// src/store/useBomStore.ts — BOM 树状态管理（v2 多星多项目）
// 职责：加载/查询/编辑单机，项目 CRUD，卫星切换，持久化到 localStorage
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  Satellite,
  Unit,
  ProjectSummary,
} from '@/types';
import { dataService } from '@/services/MockDataService';

/** 生成唯一 ID */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface BomState {
  // ===== v2 核心状态 =====
  /** 项目列表 */
  projects: Project[];
  /** 当前选中的项目 ID */
  currentProjectId: string | null;
  /** 当前选中的卫星 partNo（项目内作用域） */
  currentSatellitePartNo: string | null;
  /** 加载中标志 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 标记是否已初始化（避免重复加载） */
  initialized: boolean;

  // ===== 加载/重置 =====
  /** 加载项目数据（首次加载预置示例项目） */
  loadProjects: () => Promise<void>;
  /** 重置指定项目（重新从示例加载） */
  resetProject: (projectId: string) => Promise<void>;
  /** 重置全部数据 */
  resetAll: () => Promise<void>;

  // ===== 项目 CRUD =====
  /** 创建新项目（空白） */
  createProject: (params: {
    name: string;
    satelliteModel: string;
  }) => Promise<Project>;
  /** 从示例数据创建项目 */
  createProjectFromExample: (name: string) => Promise<Project>;
  /** 删除项目 */
  deleteProject: (projectId: string) => void;
  /** 选中项目（设置 currentProjectId + 自动选第一颗卫星） */
  selectProject: (projectId: string | null) => void;
  /** 选中卫星（设置 currentSatellitePartNo） */
  selectSatellite: (satellitePartNo: string | null) => void;

  // ===== 单机编辑 =====
  /** 更新指定 partNo 的单机属性（不可变更新，带卫星作用域） */
  updateUnit: (
    satellitePartNo: string,
    partNo: string,
    updates: Partial<Unit>,
  ) => void;
  /** 获取指定 partNo 的单机（带卫星作用域） */
  getUnit: (satellitePartNo: string, partNo: string) => Unit | undefined;

  // ===== Excel 导入 =====
  /** 将解析后的卫星列表追加/覆盖到项目 */
  importSatellites: (
    projectId: string,
    satellites: Satellite[],
    strategy: 'append' | 'overwrite',
  ) => void;

  // ===== 派生 getter =====
  /** 获取当前项目 */
  getCurrentProject: () => Project | null;
  /** 获取当前卫星 */
  getCurrentSatellite: () => Satellite | null;
  /** 获取项目摘要列表 */
  getProjectSummaries: () => ProjectSummary[];
}

export const useBomStore = create<BomState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      currentSatellitePartNo: null,
      loading: false,
      error: null,
      initialized: false,

      // ===== 加载/重置 =====
      loadProjects: async (): Promise<void> => {
        const state = get();
        if (state.initialized && state.projects.length > 0) {
          return;
        }

        set({ loading: true, error: null });
        try {
          const projects = await dataService.fetchProjects();
          set({
            projects,
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

      resetProject: async (projectId: string): Promise<void> => {
        set({ loading: true, error: null });
        try {
          const example = await dataService.fetchProject();
          const now = new Date().toISOString();
          const resetProject: Project = {
            ...JSON.parse(JSON.stringify(example)) as Project,
            id: projectId,
            updatedAt: now,
          };
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId ? resetProject : p,
            ),
            loading: false,
            error: null,
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : '重置项目失败';
          set({ loading: false, error: message });
        }
      },

      resetAll: async (): Promise<void> => {
        set({
          projects: [],
          currentProjectId: null,
          currentSatellitePartNo: null,
          initialized: false,
          loading: true,
        });
        try {
          const projects = await dataService.fetchProjects();
          set({
            projects,
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

      // ===== 项目 CRUD =====
      createProject: async (params): Promise<Project> => {
        const project = await dataService.createProject(params);
        set((state) => ({
          projects: [...state.projects, project],
        }));
        return project;
      },

      createProjectFromExample: async (name): Promise<Project> => {
        const project = await dataService.createProjectFromExample(name);
        set((state) => ({
          projects: [...state.projects, project],
        }));
        return project;
      },

      deleteProject: (projectId: string): void => {
        set((state) => {
          const projects = state.projects.filter(
            (p) => p.id !== projectId,
          );
          const currentProjectId =
            state.currentProjectId === projectId
              ? null
              : state.currentProjectId;
          return {
            projects,
            currentProjectId,
            currentSatellitePartNo:
              state.currentProjectId === projectId
                ? null
                : state.currentSatellitePartNo,
          };
        });
      },

      selectProject: (projectId: string | null): void => {
        set((state) => {
          if (projectId === null) {
            return {
              currentProjectId: null,
              currentSatellitePartNo: null,
            };
          }
          const project = state.projects.find((p) => p.id === projectId);
          const firstSat = project?.satellites[0]?.partNo ?? null;
          return {
            currentProjectId: projectId,
            currentSatellitePartNo: firstSat,
          };
        });
      },

      selectSatellite: (satellitePartNo: string | null): void => {
        set({ currentSatellitePartNo: satellitePartNo });
      },

      // ===== 单机编辑 =====
      updateUnit: (satellitePartNo, partNo, updates): void => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== state.currentProjectId) return p;
            return {
              ...p,
              updatedAt: new Date().toISOString(),
              satellites: p.satellites.map((sat) => {
                if (sat.partNo !== satellitePartNo) return sat;
                return {
                  ...sat,
                  subsystems: sat.subsystems.map((sub) => ({
                    ...sub,
                    units: sub.units.map((u) =>
                      u.partNo === partNo ? { ...u, ...updates } : u,
                    ),
                  })),
                };
              }),
            };
          }),
        }));
      },

      getUnit: (satellitePartNo, partNo): Unit | undefined => {
        const project = get().getCurrentProject();
        if (!project) return undefined;
        const sat = project.satellites.find(
          (s) => s.partNo === satellitePartNo,
        );
        if (!sat) return undefined;
        for (const sub of sat.subsystems) {
          const unit = sub.units.find((u) => u.partNo === partNo);
          if (unit) return unit;
        }
        return undefined;
      },

      // ===== Excel 导入 =====
      importSatellites: (projectId, satellites, strategy): void => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const newSatellites =
              strategy === 'overwrite'
                ? satellites
                : [...p.satellites, ...satellites];
            return {
              ...p,
              satellites: newSatellites,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      // ===== 派生 getter =====
      getCurrentProject: (): Project | null => {
        const state = get();
        return (
          state.projects.find((p) => p.id === state.currentProjectId) ?? null
        );
      },

      getCurrentSatellite: (): Satellite | null => {
        const state = get();
        const project = state.projects.find(
          (p) => p.id === state.currentProjectId,
        );
        if (!project) return null;
        return (
          project.satellites.find(
            (s) => s.partNo === state.currentSatellitePartNo,
          ) ?? project.satellites[0] ?? null
        );
      },

      getProjectSummaries: (): ProjectSummary[] => {
        const state = get();
        return state.projects.map((p) => {
          let totalMaterials = 0;
          let kitCompleteCount = 0;
          for (const sat of p.satellites) {
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
            id: p.id,
            name: p.name,
            satelliteModel: p.satelliteModel,
            satelliteCount: p.satellites.length,
            totalMaterials,
            kitRate,
            updatedAt: p.updatedAt,
          };
        });
      },
    }),
    {
      name: 'bom-storage',
      version: 2,
      // 仅持久化核心数据
      partialize: (s) => ({
        projects: s.projects,
        currentProjectId: s.currentProjectId,
        currentSatellitePartNo: s.currentSatellitePartNo,
        initialized: s.initialized,
      }),
      // 版本迁移：检测旧格式（v1 单数 satellite）自动清空
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          return {
            projects: [],
            currentProjectId: null,
            currentSatellitePartNo: null,
            initialized: false,
          };
        }
        return persistedState as Partial<BomState>;
      },
    },
  ),
);

export { genId };
