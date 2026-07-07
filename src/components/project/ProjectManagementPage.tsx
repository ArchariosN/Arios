// ============================================================
// src/components/project/ProjectManagementPage.tsx — 项目管理页（v2 新增）
// 项目卡片网格 + 新建项目入口 + 空态引导
// ============================================================

import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Refresh as ResetIcon,
  Folder as FolderIcon,
  SatelliteAlt as SatIcon,
  Inventory2 as MaterialIcon,
} from '@mui/icons-material';
import { useBomStore } from '@/store/useBomStore';
import { useUiStore } from '@/store/useUiStore';
import CreateProjectDialog from './CreateProjectDialog';

export default function ProjectManagementPage(): React.ReactElement {
  const theme = useTheme();
  const summaries = useBomStore((s) => s.getProjectSummaries());
  const selectProject = useBomStore((s) => s.selectProject);
  const deleteProject = useBomStore((s) => s.deleteProject);
  const resetProject = useBomStore((s) => s.resetProject);
  const goToProjectPage = useUiStore((s) => s.goToProjectPage);

  const [createOpen, setCreateOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ id: string; el: HTMLElement } | null>(null);

  const handleCardClick = (projectId: string): void => {
    selectProject(projectId);
    goToProjectPage('tree');
  };

  const handleDelete = (projectId: string): void => {
    deleteProject(projectId);
    setMenuAnchor(null);
  };

  const handleReset = (projectId: string): void => {
    resetProject(projectId);
    setMenuAnchor(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 标题栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            项目管理
          </Typography>
          <Typography variant="body2" color="text.secondary">
            共 {summaries.length} 个项目
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
        >
          新建项目
        </Button>
      </Box>

      {/* 项目卡片网格 */}
      {summaries.length === 0 ? (
        <Card>
          <CardContent
            sx={{
              textAlign: 'center',
              py: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <FolderIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              暂无项目
            </Typography>
            <Typography variant="body2" color="text.secondary">
              创建第一个项目开始管理卫星制造流程
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{ mt: 1 }}
            >
              创建第一个项目
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {summaries.map((summary) => (
            <Grid item xs={12} sm={6} md={4} key={summary.id}>
              <Card
                onClick={() => handleCardClick(summary.id)}
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {summary.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {summary.satelliteModel}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAnchor({ id: summary.id, el: e.currentTarget });
                      }}
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      icon={<SatIcon />}
                      label={`${summary.satelliteCount} 颗卫星`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<MaterialIcon />}
                      label={`${summary.totalMaterials} 物料`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      齐套率
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color:
                          summary.kitRate >= 80
                            ? 'success.main'
                            : summary.kitRate >= 50
                              ? 'warning.main'
                              : 'error.main',
                      }}
                    >
                      {summary.kitRate}%
                    </Typography>
                  </Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    更新于：{new Date(summary.updatedAt).toLocaleString('zh-CN')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 更多操作菜单 */}
      <Menu
        anchorEl={menuAnchor?.el ?? null}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => menuAnchor && handleReset(menuAnchor.id)}>
          <ListItemIcon>
            <ResetIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>重置项目数据</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuAnchor && handleDelete(menuAnchor.id)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>删除项目</ListItemText>
        </MenuItem>
      </Menu>

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Box>
  );
}
