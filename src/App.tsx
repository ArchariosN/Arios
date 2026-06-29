import { useEffect } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import AppLayout from '@/components/layout/AppLayout';
import { useBomStore } from '@/store/useBomStore';
import { usePhaseStore } from '@/store/usePhaseStore';
import { useUiStore } from '@/store/useUiStore';

/**
 * Root application component.
 * Manages global initialization and page routing via UiStore.
 */
export default function App(): React.ReactElement {
  const loading = useBomStore((s) => s.loading);
  const error = useBomStore((s) => s.error);
  const loadBom = useBomStore((s) => s.loadBom);
  const currentPage = useUiStore((s) => s.currentPage);

  // 全局初始化：加载 BOM 数据 + 初始化 Phase 数据
  useEffect(() => {
    loadBom();
    usePhaseStore.getState().initPhaseData();
  }, [loadBom]);

  if (loading && !useBomStore.getState().project) {
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
          正在加载 BOM 数据...
        </Typography>
      </Box>
    );
  }

  if (error && !useBomStore.getState().project) {
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
        <Button variant="contained" onClick={() => loadBom()}>
          重试
        </Button>
      </Box>
    );
  }

  return <AppLayout key={currentPage} />;
}
