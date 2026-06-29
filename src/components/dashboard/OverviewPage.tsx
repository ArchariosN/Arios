// ============================================================
// src/components/dashboard/OverviewPage.tsx — 项目总览页
// Hero + 指标卡 + 分系统齐套缩略 + 阶段步骤条
// ============================================================

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  useTheme,
} from '@mui/material';
import {
  Inventory2 as MaterialIcon,
  CheckCircle as KitIcon,
  Factory as ProdIcon,
  Engineering as AitIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import MetricCard from './MetricCard';
import PhaseStepper from './PhaseStepper';
import KitRingChart from '@/components/common/KitRingChart';
import ProgressBar from '@/components/common/ProgressBar';
import { useBomStore } from '@/store/useBomStore';
import { usePhaseStore } from '@/store/usePhaseStore';
import { useUiStore } from '@/store/useUiStore';
import {
  calcProjectMetrics,
  calcAllKits,
  calcSatelliteKitRate,
} from '@/utils/kitCalculator';

export default function OverviewPage(): React.ReactElement {
  const theme = useTheme();
  const project = useBomStore((s) => s.project);
  const currentPhase = usePhaseStore((s) => s.currentPhase);
  const setCurrentPhase = usePhaseStore((s) => s.setCurrentPhase);
  const aitWorks = usePhaseStore((s) => s.aitWorks);
  const setPage = useUiStore((s) => s.setPage);

  if (!project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography color="text.secondary">暂无项目数据</Typography>
      </Box>
    );
  }

  const metrics = calcProjectMetrics(project, aitWorks);
  const kitStatuses = calcAllKits(project);
  const satRate = calcSatelliteKitRate(project);

  const handlePhaseNavigate = (phase: string): void => {
    setCurrentPhase(phase as typeof currentPhase);
    setPage('phase');
  };

  // 监听步骤条点击事件
  if (typeof window !== 'undefined') {
    window.removeEventListener('phase-stepper-click', () => {});
    window.addEventListener('phase-stepper-click', ((e: CustomEvent) => {
      handlePhaseNavigate(e.detail.phase);
    }) as EventListener);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Hero 区 */}
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="caption" color="text.secondary">
                卫星制造项目管理
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, mb: 1 }}>
                {project.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {project.satelliteModel} · {project.satellite.manufacturer}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setPage('tree')}
                >
                  查看层级数据
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setPage('kitboard')}
                >
                  BOM 齐套看板
                </Button>
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              md={4}
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              <KitRingChart
                rate={satRate}
                size={120}
                status={satRate >= 100 ? 'complete' : satRate > 0 ? 'partial' : 'none'}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 指标卡区 */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <MetricCard
            label="物料总数"
            value={metrics.totalMaterials}
            icon={<MaterialIcon />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard
            label="齐套率"
            value={`${metrics.kitRate}%`}
            icon={<KitIcon />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard
            label="已投产单机"
            value={metrics.productionCount}
            icon={<ProdIcon />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard
            label="AIT 工作项"
            value={metrics.aitWorkCount}
            icon={<AitIcon />}
            color={theme.palette.info.main}
          />
        </Grid>
      </Grid>

      {/* 分系统齐套缩略 */}
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
            <Typography variant="h6">分系统齐套概览</Typography>
            <Button
              size="small"
              endIcon={<ArrowIcon />}
              onClick={() => setPage('kitboard')}
            >
              查看详情
            </Button>
          </Box>
          <Grid container spacing={1.5}>
            {kitStatuses.map((kit) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={kit.subsystemPartNo}>
                <Box
                  sx={{
                    cursor: 'pointer',
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => setPage('kitboard')}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {kit.subsystemName}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <ProgressBar value={kit.rate} status={kit.status} height={6} />
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, minWidth: 32, textAlign: 'right' }}
                    >
                      {kit.rate}%
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {kit.completeUnits}/{kit.totalUnits} 已齐套
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* 阶段步骤条 */}
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            项目阶段
          </Typography>
          <PhaseStepper
            currentPhase={currentPhase}
            onNavigate={() => {}}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
