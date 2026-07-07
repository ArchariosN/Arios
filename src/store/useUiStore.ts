// ============================================================
// src/store/useUiStore.ts — UI 状态管理（v2 两级导航）
// 职责：主题模式 + PageState 两级页面 + 树展开/选中 + 齐套筛选
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ThemeMode,
  PageState,
  GlobalPage,
  ProjectPage,
  KitFilter,
} from '@/types';
import { useBomStore } from '@/store/useBomStore';

interface UiState {
  /** 主题模式 */
  mode: ThemeMode;
  /** [v2] 当前页面（两级 PageState） */
  currentPage: PageState;
  /** 选中的树节点 partNo */
  selectedNodePartNo: string | null;
  /** 展开的树节点 Map<partNo, boolean> */
  expandedNodes: Record<string, boolean>;
  /** 齐套看板筛选 */
  kitFilter: KitFilter;
  /** 移动端 Drawer 开关 */
  mobileDrawerOpen: boolean;
  /** [v2] 层级数据子页展开/折叠状态 */
  treeSubPageExpanded: boolean;

  /** 切换日夜主题 */
  toggleTheme: () => void;
  /** [v2] 直接设置 PageState */
  setPage: (page: PageState) => void;
  /** [v2] 快捷导航到全局页面 */
  goToGlobalPage: (page: GlobalPage) => void;
  /** [v2] 快捷导航到项目内页面（检查是否已选项目） */
  goToProjectPage: (page: ProjectPage) => boolean;
  /** [v2] 切换层级数据子页展开 */
  toggleTreeSubPage: () => void;
  /** 选中树节点 */
  selectNode: (partNo: string | null) => void;
  /** 展开/折叠树节点 */
  toggleNode: (partNo: string) => void;
  /** 设置齐套筛选 */
  setKitFilter: (filter: KitFilter) => void;
  /** 切换移动端 Drawer */
  toggleMobileDrawer: () => void;
  /** 设置移动端 Drawer 开关 */
  setMobileDrawer: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      mode: 'light',
      currentPage: { scope: 'global', page: 'overview' },
      selectedNodePartNo: null,
      expandedNodes: {},
      kitFilter: 'all',
      mobileDrawerOpen: false,
      treeSubPageExpanded: true,

      toggleTheme: (): void => {
        set((state) => ({
          mode: state.mode === 'light' ? 'dark' : 'light',
        }));
      },

      setPage: (page): void => {
        set({ currentPage: page, mobileDrawerOpen: false });
      },

      goToGlobalPage: (page): void => {
        set({
          currentPage: { scope: 'global', page },
          mobileDrawerOpen: false,
        });
      },

      goToProjectPage: (page): boolean => {
        const bomState = useBomStore.getState();
        if (!bomState.currentProjectId) {
          set({ currentPage: { scope: 'global', page: 'project-management' } });
          return false;
        }
        set({
          currentPage: { scope: 'project', page },
          mobileDrawerOpen: false,
        });
        return true;
      },

      toggleTreeSubPage: (): void => {
        set((state) => ({ treeSubPageExpanded: !state.treeSubPageExpanded }));
      },

      selectNode: (partNo): void => {
        set({ selectedNodePartNo: partNo });
      },

      toggleNode: (partNo): void => {
        set((state) => ({
          expandedNodes: {
            ...state.expandedNodes,
            [partNo]: !state.expandedNodes[partNo],
          },
        }));
      },

      setKitFilter: (filter): void => {
        set({ kitFilter: filter });
      },

      toggleMobileDrawer: (): void => {
        set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen }));
      },

      setMobileDrawer: (open): void => {
        set({ mobileDrawerOpen: open });
      },
    }),
    {
      name: 'ui-storage',
      version: 2,
      partialize: (s) => ({
        mode: s.mode,
        currentPage: s.currentPage,
      }),
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          return {
            mode: 'light' as ThemeMode,
            currentPage: { scope: 'global' as const, page: 'overview' as const },
          };
        }
        return persistedState as Partial<UiState>;
      },
    },
  ),
);
