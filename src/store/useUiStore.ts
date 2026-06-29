// ============================================================
// src/store/useUiStore.ts — UI 状态管理
// 职责：主题模式 + 当前页面 + 树展开/选中 + 齐套筛选
// 仅持久化 mode + currentPage（偏好），不持久化临时 UI 状态。
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode, PageType, KitFilter } from '@/types';

interface UiState {
  /** 主题模式 */
  mode: ThemeMode;
  /** 当前页面 */
  currentPage: PageType;
  /** 选中的树节点 partNo */
  selectedNodePartNo: string | null;
  /** 展开的树节点 Map<partNo, boolean> */
  expandedNodes: Record<string, boolean>;
  /** 齐套看板筛选 */
  kitFilter: KitFilter;
  /** 移动端 Drawer 开关 */
  mobileDrawerOpen: boolean;

  /** 切换日夜主题 */
  toggleTheme: () => void;
  /** 设置当前页面 */
  setPage: (page: PageType) => void;
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
      currentPage: 'overview',
      selectedNodePartNo: null,
      expandedNodes: {},
      kitFilter: 'all',
      mobileDrawerOpen: false,

      toggleTheme: (): void => {
        set((state) => ({
          mode: state.mode === 'light' ? 'dark' : 'light',
        }));
      },

      setPage: (page): void => {
        set({ currentPage: page, mobileDrawerOpen: false });
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
      // 仅持久化偏好，不持久化临时 UI 状态
      partialize: (s) => ({
        mode: s.mode,
        currentPage: s.currentPage,
      }),
    },
  ),
);
