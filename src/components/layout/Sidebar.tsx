// ============================================================
// src/components/layout/Sidebar.tsx — 左侧导航栏（v2 两层导航）
// 全局层：总览 + 项目管理
// 项目内层：层级数据（父）→ BOM齐套/阶段管理/AIT编排（子，Collapse 折叠）
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
  Divider,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountTree as TreeIcon,
  CheckCircle as KitIcon,
  Timeline as PhaseIcon,
  Settings as AitIcon,
  Folder as FolderIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useUiStore } from '@/store/useUiStore';
import { useBomStore } from '@/store/useBomStore';
import { usePhaseStore } from '@/store/usePhaseStore';
import SatelliteSwitcher from './SatelliteSwitcher';
import type { GlobalPage, ProjectPage } from '@/types';

const DRAWER_WIDTH = 240;

/** 全局导航项 */
const GLOBAL_NAV_ITEMS: { page: GlobalPage; label: string; icon: React.ReactElement }[] = [
  { page: 'overview', label: '总览', icon: <DashboardIcon /> },
  { page: 'project-management', label: '项目管理', icon: <FolderIcon /> },
];

/** 项目内导航子页 */
const PROJECT_NAV_CHILDREN: { page: ProjectPage; label: string; icon: React.ReactElement }[] = [
  { page: 'kitboard', label: 'BOM 齐套', icon: <KitIcon /> },
  { page: 'phase', label: '阶段管理', icon: <PhaseIcon /> },
  { page: 'ait', label: 'AIT 编排', icon: <AitIcon /> },
];

/** 导航列表内容（桌面和移动端共用） */
function NavContent(): React.ReactElement {
  const currentPage = useUiStore((s) => s.currentPage);
  const treeSubPageExpanded = useUiStore((s) => s.treeSubPageExpanded);
  const toggleTreeSubPage = useUiStore((s) => s.toggleTreeSubPage);
  const goToGlobalPage = useUiStore((s) => s.goToGlobalPage);
  const goToProjectPage = useUiStore((s) => s.goToProjectPage);

  const currentProject = useBomStore((s) => s.getCurrentProject());
  const currentSatellitePartNo = useBomStore((s) => s.currentSatellitePartNo);
  const selectSatellite = useBomStore((s) => s.selectSatellite);
  const initSatellitePhaseData = usePhaseStore((s) => s.initSatellitePhaseData);

  const handleSatelliteChange = (partNo: string): void => {
    selectSatellite(partNo);
    initSatellitePhaseData(partNo);
  };

  const isGlobalActive = (page: GlobalPage): boolean =>
    currentPage.scope === 'global' && currentPage.page === page;

  const isProjectActive = (page: ProjectPage): boolean =>
    currentPage.scope === 'project' && currentPage.page === page;

  return (
    <List sx={{ pt: 2 }}>
      {/* === 全局导航 === */}
      <Box sx={{ px: 2, pb: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          全局
        </Typography>
      </Box>
      {GLOBAL_NAV_ITEMS.map((item) => (
        <ListItem key={item.page} disablePadding>
          <ListItemButton
            selected={isGlobalActive(item.page)}
            onClick={() => goToGlobalPage(item.page)}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isGlobalActive(item.page) ? 'primary.main' : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: isGlobalActive(item.page) ? 600 : 400,
              }}
            />
          </ListItemButton>
        </ListItem>
      ))}

      <Divider sx={{ my: 2 }} />

      {/* === 项目内导航 === */}
      {currentProject ? (
        <>
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              {currentProject.name}
            </Typography>
          </Box>

          {/* 卫星切换器 */}
          {currentProject.satellites.length > 0 && (
            <SatelliteSwitcher
              satellites={currentProject.satellites}
              currentPartNo={currentSatellitePartNo}
              onChange={handleSatelliteChange}
            />
          )}

          {/* 层级数据（父级入口） */}
          <ListItem disablePadding>
            <ListItemButton
              selected={isProjectActive('tree')}
              onClick={() => goToProjectPage('tree')}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isProjectActive('tree') ? 'primary.main' : 'inherit',
                }}
              >
                <TreeIcon />
              </ListItemIcon>
              <ListItemText
                primary="层级数据"
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: isProjectActive('tree') ? 600 : 400,
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTreeSubPage();
                }}
                sx={{ p: 0.5 }}
              >
                {treeSubPageExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </ListItemButton>
          </ListItem>

          {/* 子页（折叠/展开） */}
          <Collapse in={treeSubPageExpanded}>
            {PROJECT_NAV_CHILDREN.map((item) => (
              <ListItem key={item.page} disablePadding>
                <ListItemButton
                  selected={isProjectActive(item.page)}
                  onClick={() => goToProjectPage(item.page)}
                  sx={{ pl: 6 }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 32,
                      color: isProjectActive(item.page) ? 'primary.main' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                      fontWeight: isProjectActive(item.page) ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </Collapse>
        </>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            请先选择项目
          </Typography>
        </Box>
      )}
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
          <NavContent />
        </Box>
      </Drawer>
    </>
  );
}
