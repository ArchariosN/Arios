// ============================================================
// src/components/layout/Header.tsx — 顶栏
// 项目名 + 日夜切换 + 移动端汉堡菜单 + 重置数据
// ============================================================

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  LightMode,
  DarkMode,
  MoreVert,
  Refresh,
} from '@mui/icons-material';
import { useState } from 'react';
import { useUiStore } from '@/store/useUiStore';
import { useBomStore } from '@/store/useBomStore';

export default function Header(): React.ReactElement {
  const mode = useUiStore((s) => s.mode);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const toggleMobileDrawer = useUiStore((s) => s.toggleMobileDrawer);
  const resetData = useBomStore((s) => s.resetData);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleReset = (): void => {
    setMenuAnchor(null);
    resetData();
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ minHeight: '56px !important' }}>
        {/* 移动端汉堡菜单 */}
        <IconButton
          edge="start"
          onClick={toggleMobileDrawer}
          sx={{ display: { md: 'none' }, mr: 1 }}
          aria-label="打开菜单"
        >
          <MenuIcon />
        </IconButton>

        {/* 项目标题 */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            component="h1"
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            灵犀10B 卫星制造管理系统
          </Typography>
        </Box>

        {/* 日夜切换 */}
        <Tooltip title={mode === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
          <IconButton onClick={toggleTheme} aria-label="切换主题">
            {mode === 'light' ? <DarkMode /> : <LightMode />}
          </IconButton>
        </Tooltip>

        {/* 更多菜单（含重置数据） */}
        <IconButton
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          aria-label="更多操作"
        >
          <MoreVert />
        </IconButton>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleReset}>
            <ListItemIcon>
              <Refresh fontSize="small" />
            </ListItemIcon>
            <ListItemText>重置数据</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
