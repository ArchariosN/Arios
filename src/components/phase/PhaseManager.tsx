// ============================================================
// src/components/phase/PhaseManager.tsx — 阶段管理页（v2 多星作用域）
// 步骤条切换 + 视图路由 + 临时任务区
// ============================================================

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Stack,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
} from '@mui/icons-material';
import PhaseStepper from '@/components/dashboard/PhaseStepper';
import DesignView from './DesignView';
import IntegrationView from './IntegrationView';
import TaskDialog from './TaskDialog';
import { usePhaseStore } from '@/store/usePhaseStore';
import { useUiStore } from '@/store/useUiStore';
import { useBomStore } from '@/store/useBomStore';
import { PHASE_LABELS } from '@/types';
import type { PhaseType } from '@/types';

export default function PhaseManager(): React.ReactElement {
  const currentPhase = usePhaseStore((s) => s.currentPhase);
  const setCurrentPhase = usePhaseStore((s) => s.setCurrentPhase);
  const currentSatellitePartNo = useBomStore((s) => s.currentSatellitePartNo);
  const tasks = usePhaseStore((s) =>
    currentSatellitePartNo ? s.getTasks(currentSatellitePartNo) : [],
  );
  const removeTask = usePhaseStore((s) => s.removeTask);
  const goToProjectPage = useUiStore((s) => s.goToProjectPage);
  const currentSatellite = useBomStore((s) => s.getCurrentSatellite());

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  // 监听 PhaseStepper 点击事件
  useEffect(() => {
    const handler = (e: Event): void => {
      const detail = (e as CustomEvent).detail as { phase: PhaseType };
      setCurrentPhase(detail.phase);
    };
    window.addEventListener('phase-stepper-click', handler);
    return () => window.removeEventListener('phase-stepper-click', handler);
  }, [setCurrentPhase]);

  // AIT 阶段跳转到 AIT 看板
  useEffect(() => {
    if (currentPhase === 'ait') {
      goToProjectPage('ait');
    }
  }, [currentPhase, goToProjectPage]);

  if (!currentSatellite || !currentSatellitePartNo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        {currentSatellitePartNo ? <CircularProgress /> : <Typography color="text.secondary">暂无卫星数据</Typography>}
      </Box>
    );
  }

  const phaseTasks = tasks.filter((t) => t.phaseType === currentPhase);

  const renderPhaseView = (): React.ReactNode => {
    switch (currentPhase) {
      case 'design':
        return <DesignView variant="design" />;
      case 'production':
        return <DesignView variant="production" />;
      case 'integration':
        return <IntegrationView />;
      case 'ait':
        return null;
      default:
        return <DesignView variant="design" />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 步骤条 */}
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            项目阶段管理
          </Typography>
          <PhaseStepper currentPhase={currentPhase} onNavigate={() => {}} />
        </CardContent>
      </Card>

      {/* 阶段内容 */}
      {currentPhase !== 'ait' && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              {PHASE_LABELS[currentPhase]} — 单机管理
            </Typography>
            {renderPhaseView()}
          </CardContent>
        </Card>
      )}

      {/* 临时任务区 */}
      {currentPhase !== 'ait' && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {PHASE_LABELS[currentPhase]} — 临时任务
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setTaskDialogOpen(true)}
              >
                添加任务
              </Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            {phaseTasks.length === 0 ? (
              <Typography
                color="text.secondary"
                align="center"
                sx={{ py: 3 }}
              >
                暂无临时任务，点击「添加任务」创建
              </Typography>
            ) : (
              <List>
                {phaseTasks.map((task) => (
                  <ListItem
                    key={task.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => removeTask(currentSatellitePartNo, task.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                    sx={{
                      borderRadius: 1.5,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemIcon>
                      <TaskIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={task.name}
                      secondary={
                        <Stack
                          direction="row"
                          spacing={2}
                          component="span"
                          sx={{ display: 'flex', flexWrap: 'wrap' }}
                        >
                          <span>负责人：{task.owner}</span>
                          {task.dueDate && (
                            <span>截止：{task.dueDate}</span>
                          )}
                          {task.relatedUnitPartNo && (
                            <span>
                              关联：{task.relatedUnitPartNo}
                            </span>
                          )}
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      <TaskDialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        phaseType={currentPhase}
      />
    </Box>
  );
}
