// ============================================================
// src/store/usePhaseStore.ts — 阶段状态管理
// 职责：当前阶段 + 临时任务 + AIT 工作项 CRUD + 拖拽排序
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

interface PhaseState {
  /** 当前阶段 */
  currentPhase: PhaseType;
  /** 临时任务列表 */
  tasks: Task[];
  /** AIT 工作项列表 */
  aitWorks: AitWork[];
  /** 标记是否已初始化 */
  initialized: boolean;

  /** 初始化数据（首次加载预置任务和 AIT 工作项） */
  initPhaseData: () => Promise<void>;
  /** 切换当前阶段 */
  setCurrentPhase: (phase: PhaseType) => void;
  /** 添加临时任务 */
  addTask: (task: Omit<Task, 'id'>) => void;
  /** 删除临时任务 */
  removeTask: (taskId: string) => void;
  /** 添加 AIT 工作项 */
  addAitWork: (work: Omit<AitWork, 'id'>) => void;
  /** 删除 AIT 工作项 */
  removeAitWork: (workId: string) => void;
  /** 移动 AIT 工作项（跨列变更状态 + 列内排序） */
  moveAitWork: (workId: string, toStatus: AitWorkStatus, toIndex: number) => void;
  /** 更新 AIT 工作项属性 */
  updateAitWork: (workId: string, updates: Partial<AitWork>) => void;
}

/** 生成唯一 ID */
function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const usePhaseStore = create<PhaseState>()(
  persist(
    (set, get) => ({
      currentPhase: 'design',
      tasks: [],
      aitWorks: [],
      initialized: false,

      initPhaseData: async (): Promise<void> => {
        if (get().initialized) return;
        try {
          const [tasks, aitWorks] = await Promise.all([
            dataService.fetchTasks(),
            dataService.fetchAitWorks(),
          ]);
          set({ tasks, aitWorks, initialized: true });
        } catch {
          set({ initialized: true });
        }
      },

      setCurrentPhase: (phase): void => {
        set({ currentPhase: phase });
      },

      addTask: (task): void => {
        set((state) => ({
          tasks: [...state.tasks, { ...task, id: genId('task') }],
        }));
      },

      removeTask: (taskId): void => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));
      },

      addAitWork: (work): void => {
        set((state) => {
          const newWork: AitWork = { ...work, id: genId('ait') };
          // 新增工作放入对应状态列末尾，order 为该列最大 order + 1
          const sameStatusWorks = state.aitWorks.filter(
            (w) => w.status === newWork.status,
          );
          const maxOrder = sameStatusWorks.reduce(
            (max, w) => Math.max(max, w.order),
            -1,
          );
          newWork.order = maxOrder + 1;
          return { aitWorks: [...state.aitWorks, newWork] };
        });
      },

      removeAitWork: (workId): void => {
        set((state) => ({
          aitWorks: state.aitWorks.filter((w) => w.id !== workId),
        }));
      },

      moveAitWork: (workId, toStatus, toIndex): void => {
        set((state) => {
          const work = state.aitWorks.find((w) => w.id === workId);
          if (!work) return state;

          // 移除被拖拽的 work
          const remaining = state.aitWorks.filter((w) => w.id !== workId);

          // 目标列中已有的 works（排除被拖拽项后）
          const targetCol = remaining
            .filter((w) => w.status === toStatus)
            .sort((a, b) => a.order - b.order);

          // 更新被拖拽 work 的 status
          const movedWork: AitWork = { ...work, status: toStatus };

          // 插入到目标位置
          targetCol.splice(toIndex, 0, movedWork);

          // 重新计算目标列 order（从 0 开始）
          const updatedTargetCol = targetCol.map((w, i) => ({
            ...w,
            order: i,
          }));

          // 其他列保持不变
          const otherCols = remaining.filter(
            (w) => w.status !== toStatus || w.id === workId,
          ).filter((w) => w.status !== toStatus);

          return {
            aitWorks: [...otherCols, ...updatedTargetCol],
          };
        });
      },

      updateAitWork: (workId, updates): void => {
        set((state) => ({
          aitWorks: state.aitWorks.map((w) =>
            w.id === workId ? { ...w, ...updates } : w,
          ),
        }));
      },
    }),
    {
      name: 'phase-storage',
    },
  ),
);
