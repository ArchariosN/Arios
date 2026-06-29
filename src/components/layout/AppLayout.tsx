// ============================================================
// src/components/layout/AppLayout.tsx — 主布局组件
// 结构：Header + Sidebar + Content + StatusBar
// ============================================================

import { useMediaQuery, useTheme, Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import { useUiStore } from '@/store/useUiStore';
import OverviewPage from '@/components/dashboard/OverviewPage';
import BomTree from '@/components/tree/BomTree';
import KitBoard from '@/components/kitboard/KitBoard';
import PhaseManager from '@/components/phase/PhaseManager';
import AitKanban from '@/components/ait/AitKanban';

/**
 * 主布局：根据当前页面渲染对应内容。
 * 桌面端 Sidebar 固定，移动端收为 Drawer。
 */
export default function AppLayout(): React.ReactElement {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const currentPage = useUiStore((s) => s.currentPage);

  const renderPage = (): React.ReactNode => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage />;
      case 'tree':
        return <BomTree />;
      case 'kitboard':
        return <KitBoard />;
      case 'phase':
        return <PhaseManager />;
      case 'ait':
        return <AitKanban />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
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
          {renderPage()}
        </Box>
      </Box>
      <StatusBar />
    </Box>
  );
}
