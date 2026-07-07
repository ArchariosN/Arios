import { useEffect } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import AppLayout from '@/components/layout/AppLayout';
import { useBomStore } from '@/store/useBomStore';
import { usePhaseStore } from '@/store/usePhaseStore';
import { useUiStore } from '@/store/useUiStore';

/**
 * Root application component (v2).
 * 管理全局初始化：loadProjects + 初始化当前卫星阶段数据
 */
export default function App(): React.ReactElement {
  const loading = useBomStore((s) => s.loading);
  const error = useBomStore((s) => s.error);
  const loadProjects = useBomStore((s) => s.loadProjects);
  const initialized = useBomStore((s) => s.initialized);
  const projects = useBomStore((s) => s.projects);
  const currentSatellitePartNo = useBomStore((s) => s.currentSatellitePartNo);
  const currentPage = useUiStore((s) => s.currentPage);
  const initSatellitePhaseData = usePhaseStore((s) => s.initSatellitePhaseData);

  // 全局初始化：加载项目数据
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // 当选中卫星时，自动初始化阶段数据
  useEffect(() => {
    if (currentSatellitePartNo) {
      initSatellitePhaseData(currentSatellitePartNo);
    }
  }, [currentSatellitePartNo, initSatellitePhaseData]);

  if (loading && (!initialized || projects.length === 0)) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          正在加载项目数据...
        </Typography>
      </Box>
    );
  }

  if (error && (!initialized || projects.length === 0)) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h6" color="error">
          加载失败
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
        <Button variant="contained" onClick={() => loadProjects()}>
          重试
        </Button>
      </Box>
    );
  }

  return <AppLayout key={`${currentPage.scope}-${currentPage.page}`} />;
}
