// ============================================================
// src/store/usePhaseStore.ts — 阶段状态管理（v2 按卫星作用域）
// 职责：当前阶段 + 临时任务 + AIT 工作项 CRUD + 拖拽排序
// v2: tasks/aitWorks 改为 Record<string, T> 按 satellitePartNo 分组
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PhaseType,
  Task,
  AitWork,
  AitWorkStatus,
} from '@/types';
import { dataService } from '@/services/MockDataService';

/** 生成唯一 ID */
function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface PhaseState {
  /** 当前阶段（项目级共享） */
  currentPhase: PhaseType;
  /** [v2] tasks 按 satellitePartNo 分组存储 */
  tasksBySatellite: Record<string, Task[]>;
  /** [v2] aitWorks 按 satellitePartNo 分组存储 */
  aitWorksBySatellite: Record<string, AitWork[]>;
  /** [v2] 已初始化的卫星 partNo 集合（序列化为数组） */
  initializedSatellites: string[];

  /** [v2] 初始化指定卫星的阶段数据 */
  initSatellitePhaseData: (satellitePartNo: string) => Promise<void>;
  /** 切换当前阶段 */
  setCurrentPhase: (phase: PhaseType) => void;

  /** [v2] 获取当前卫星的任务列表 */
  getTasks: (satellitePartNo: string) => Task[];
  /** [v2] 获取当前卫星的 AIT 工作项 */
  getAitWorks: (satellitePartNo: string) => AitWork[];

  /** [v2] 添加临时任务（带卫星作用域） */
  addTask: (satellitePartNo: string, task: Omit<Task, 'id'>) => void;
  /** [v2] 删除临时任务（带卫星作用域） */
  removeTask: (satellitePartNo: string, taskId: string) => void;

  /** [v2] 添加 AIT 工作项（带卫星作用域） */
  addAitWork: (satellitePartNo: string, work: Omit<AitWork, 'id'>) => void;
  /** [v2] 删除 AIT 工作项（带卫星作用域） */
  removeAitWork: (satellitePartNo: string, workId: string) => void;
  /** [v2] 移动 AIT 工作项（带卫星作用域） */
  moveAitWork: (
    satellitePartNo: string,
    workId: string,
    toStatus: AitWorkStatus,
    toIndex: number,
  ) => void;
  /** [v2] 更新 AIT 工作项属性（带卫星作用域） */
  updateAitWork: (
    satellitePartNo: string,
    workId: string,
    updates: Partial<AitWork>,
  ) => void;
}

export const usePhaseStore = create<PhaseState>()(
  persist(
    (set, get) => ({
      currentPhase: 'design',
      tasksBySatellite: {},
      aitWorksBySatellite: {},
      initializedSatellites: [],

      initSatellitePhaseData: async (satellitePartNo: string): Promise<void> => {
        const state = get();
        if (state.initializedSatellites.includes(satellitePartNo)) return;

        try {
          const [tasks, aitWorks] = await Promise.all([
            dataService.fetchTasks(satellitePartNo),
            dataService.fetchAitWorks(satellitePartNo),
          ]);
          set((s) => ({
            tasksBySatellite: {
              ...s.tasksBySatellite,
              [satellitePartNo]: tasks,
            },
            aitWorksBySatellite: {
              ...s.aitWorksBySatellite,
              [satellitePartNo]: aitWorks,
            },
            initializedSatellites: [...s.initializedSatellites, satellitePartNo],
          }));
        } catch {
          // 初始化失败也标记，避免无限重试
          set((s) => ({
            initializedSatellites: [...s.initializedSatellites, satellitePartNo],
          }));
        }
      },

      setCurrentPhase: (phase): void => {
        set({ currentPhase: phase });
      },

      getTasks: (satellitePartNo: string): Task[] => {
        return get().tasksBySatellite[satellitePartNo] ?? [];
      },

      getAitWorks: (satellitePartNo: string): AitWork[] => {
        return get().aitWorksBySatellite[satellitePartNo] ?? [];
      },

      addTask: (satellitePartNo, task): void => {
        set((state) => {
          const existing = state.tasksBySatellite[satellitePartNo] ?? [];
          return {
            tasksBySatellite: {
              ...state.tasksBySatellite,
              [satellitePartNo]: [...existing, { ...task, id: genId('task') }],
            },
          };
        });
      },

      removeTask: (satellitePartNo, taskId): void => {
        set((state) => {
          const existing = state.tasksBySatellite[satellitePartNo] ?? [];
          return {
            tasksBySatellite: {
              ...state.tasksBySatellite,
              [satellitePartNo]: existing.filter((t) => t.id !== taskId),
            },
          };
        });
      },

      addAitWork: (satellitePartNo, work): void => {
        set((state) => {
          const existing = state.aitWorksBySatellite[satellitePartNo] ?? [];
          const newWork: AitWork = { ...work, id: genId('ait') };
          const sameStatusWorks = existing.filter(
            (w) => w.status === newWork.status,
          );
          const maxOrder = sameStatusWorks.reduce(
            (max, w) => Math.max(max, w.order),
            -1,
          );
          newWork.order = maxOrder + 1;
          return {
            aitWorksBySatellite: {
              ...state.aitWorksBySatellite,
              [satellitePartNo]: [...existing, newWork],
            },
          };
        });
      },

      removeAitWork: (satellitePartNo, workId): void => {
        set((state) => {
          const existing = state.aitWorksBySatellite[satellitePartNo] ?? [];
          return {
            aitWorksBySatellite: {
              ...state.aitWorksBySatellite,
              [satellitePartNo]: existing.filter((w) => w.id !== workId),
            },
          };
        });
      },

      moveAitWork: (satellitePartNo, workId, toStatus, toIndex): void => {
        set((state) => {
          const existing = state.aitWorksBySatellite[satellitePartNo] ?? [];
          const work = existing.find((w) => w.id === workId);
          if (!work) return state;

          const remaining = existing.filter((w) => w.id !== workId);
          const targetCol = remaining
            .filter((w) => w.status === toStatus)
            .sort((a, b) => a.order - b.order);

          const movedWork: AitWork = { ...work, status: toStatus };
          targetCol.splice(toIndex, 0, movedWork);
          const updatedTargetCol = targetCol.map((w, i) => ({
            ...w,
            order: i,
          }));

          const otherCols = remaining.filter(
            (w) => w.status !== toStatus,
          );

          return {
            aitWorksBySatellite: {
              ...state.aitWorksBySatellite,
              [satellitePartNo]: [...otherCols, ...updatedTargetCol],
            },
          };
        });
      },

      updateAitWork: (satellitePartNo, workId, updates): void => {
        set((state) => {
          const existing = state.aitWorksBySatellite[satellitePartNo] ?? [];
          return {
            aitWorksBySatellite: {
              ...state.aitWorksBySatellite,
              [satellitePartNo]: existing.map((w) =>
                w.id === workId ? { ...w, ...updates } : w,
              ),
            },
          };
        });
      },
    }),
    {
      name: 'phase-storage',
      version: 2,
      partialize: (s) => ({
        currentPhase: s.currentPhase,
        tasksBySatellite: s.tasksBySatellite,
        aitWorksBySatellite: s.aitWorksBySatellite,
        initializedSatellites: s.initializedSatellites,
      }),
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          return {
            currentPhase: 'design' as PhaseType,
            tasksBySatellite: {},
            aitWorksBySatellite: {},
            initializedSatellites: [],
          };
        }
        return persistedState as Partial<PhaseState>;
      },
    },
  ),
);
