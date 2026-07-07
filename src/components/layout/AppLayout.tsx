// ============================================================
// src/components/layout/AppLayout.tsx — 主布局组件（v2 PageState 路由）
// 结构：Header + Breadcrumb + Sidebar + Content + StatusBar
// ============================================================

import { useMediaQuery, useTheme, Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import Breadcrumb from './Breadcrumb';
import { useUiStore } from '@/store/useUiStore';
import OverviewPage from '@/components/dashboard/OverviewPage';
import BomTree from '@/components/tree/BomTree';
import KitBoard from '@/components/kitboard/KitBoard';
import PhaseManager from '@/components/phase/PhaseManager';
import AitKanban from '@/components/ait/AitKanban';
import ProjectManagementPage from '@/components/project/ProjectManagementPage';
import type { PageState } from '@/types';

/**
 * 主布局：根据当前 PageState 渲染对应内容。
 */
export default function AppLayout(): React.ReactElement {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const currentPage = useUiStore((s) => s.currentPage);

  const renderPage = (page: PageState): React.ReactNode => {
    if (page.scope === 'global') {
      switch (page.page) {
        case 'overview':
          return <OverviewPage />;
        case 'project-management':
          return <ProjectManagementPage />;
        default:
          return <OverviewPage />;
      }
    }
    // project scope
    switch (page.page) {
      case 'tree':
        return <BomTree />;
      case 'kitboard':
        return <KitBoard />;
      case 'phase':
        return <PhaseManager />;
      case 'ait':
        return <AitKanban />;
      default:
        return <BomTree />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Breadcrumb />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, md: 3, lg: 4 },
            overflow: 'auto',
            maxWidth: isDesktop ? 'calc(100% - 240px)' : '100%',
          }}
        >
          {renderPage(currentPage)}
        </Box>
      </Box>
      <StatusBar />
    </Box>
  );
}
