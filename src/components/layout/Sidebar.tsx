// ============================================================
// src/components/layout/Sidebar.tsx — 左侧导航栏
// 桌面端固定，移动端 Drawer
// ============================================================

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountTree as TreeIcon,
  CheckCircle as KitIcon,
  Timeline as PhaseIcon,
  Settings as AitIcon,
} from '@mui/icons-material';
import { useUiStore } from '@/store/useUiStore';
import type { PageType } from '@/types';

/** 导航项配置 */
const NAV_ITEMS: { page: PageType; label: string; icon: React.ReactElement }[] =
  [
    { page: 'overview', label: '总览', icon: <DashboardIcon /> },
    { page: 'tree', label: '层级数据', icon: <TreeIcon /> },
    { page: 'kitboard', label: 'BOM 齐套', icon: <KitIcon /> },
    { page: 'phase', label: '阶段管理', icon: <PhaseIcon /> },
    { page: 'ait', label: 'AIT 编排', icon: <AitIcon /> },
  ];

const DRAWER_WIDTH = 240;

/** 导航列表内容（桌面和移动端共用） */
function NavContent(): React.ReactElement {
  const currentPage = useUiStore((s) => s.currentPage);
  const setPage = useUiStore((s) => s.setPage);

  return (
    <List sx={{ pt: 2 }}>
      {NAV_ITEMS.map((item) => (
        <ListItem key={item.page} disablePadding>
          <ListItemButton
            selected={currentPage === item.page}
            onClick={() => setPage(item.page)}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: currentPage === item.page ? 'primary.main' : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: currentPage === item.page ? 600 : 400,
              }}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

export default function Sidebar(): React.ReactElement {
  const mobileDrawerOpen = useUiStore((s) => s.mobileDrawerOpen);
  const setMobileDrawer = useUiStore((s) => s.setMobileDrawer);

  return (
    <>
      {/* 桌面端固定 Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
        open
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              导航菜单
            </Typography>
          </Box>
          <NavContent />
        </Box>
      </Drawer>

      {/* 移动端临时 Drawer */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawer(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <Box sx={{ px: 2, pb: 1, pt: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              导航菜单
            </Typography>
          </Box>
          <NavContent />
        </Box>
      </Drawer>
    </>
  );
}
