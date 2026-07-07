// ============================================================
// src/components/dashboard/OverviewPage.tsx — 总览页（v2）
// 全局模式：聚合所有项目的指标
// 项目模式：当前项目多星对比
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
  Folder as FolderIcon,
  SatelliteAlt as SatIcon,
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
  calcSatelliteSummary,
} from '@/utils/kitCalculator';
import type { PhaseType } from '@/types';

export default function OverviewPage(): React.ReactElement {
  const theme = useTheme();
  const projects = useBomStore((s) => s.projects);
  const currentProject = useBomStore((s) => s.getCurrentProject());
  const currentSatellite = useBomStore((s) => s.getCurrentSatellite());
  const currentSatellitePartNo = useBomStore((s) => s.currentSatellitePartNo);
  const currentPhase = usePhaseStore((s) => s.currentPhase);
  const setCurrentPhase = usePhaseStore((s) => s.setCurrentPhase);
  const aitWorks = usePhaseStore((s) =>
    currentSatellitePartNo ? s.getAitWorks(currentSatellitePartNo) : [],
  );
  const goToGlobalPage = useUiStore((s) => s.goToGlobalPage);
  const goToProjectPage = useUiStore((s) => s.goToProjectPage);

  // ===== 全局总览：无选中项目时 =====
  if (!currentProject || !currentSatellite) {
    // 聚合所有项目指标
    let totalProjects = projects.length;
    let totalSatellites = 0;
    let totalMaterials = 0;
    let totalKitComplete = 0;

    for (const p of projects) {
      totalSatellites += p.satellites.length;
      for (const sat of p.satellites) {
        for (const sub of sat.subsystems) {
          for (const unit of sub.units) {
            totalMaterials++;
            if (unit.isKitComplete) totalKitComplete++;
          }
        }
      }
    }

    const avgKitRate =
      totalMaterials === 0
        ? 0
        : Math.round((totalKitComplete / totalMaterials) * 100);

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
                  系统总览
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  管理多个卫星制造项目，跟踪齐套率、投产状态与 AIT 进度
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<FolderIcon />}
                    onClick={() => goToGlobalPage('project-management')}
                  >
                    项目管理
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
                  rate={avgKitRate}
                  size={120}
                  status={avgKitRate >= 100 ? 'complete' : avgKitRate > 0 ? 'partial' : 'none'}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 全局指标卡 */}
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <MetricCard
              label="项目总数"
              value={totalProjects}
              icon={<FolderIcon />}
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard
              label="卫星总数"
              value={totalSatellites}
              icon={<SatIcon />}
              color={theme.palette.info.main}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard
              label="物料总数"
              value={totalMaterials}
              icon={<MaterialIcon />}
              color={theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard
              label="平均齐套率"
              value={`${avgKitRate}%`}
              icon={<KitIcon />}
              color={theme.palette.success.main}
            />
          </Grid>
        </Grid>

        {/* 项目列表缩略 */}
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
              <Typography variant="h6">项目概览</Typography>
              <Button
                size="small"
                endIcon={<ArrowIcon />}
                onClick={() => goToGlobalPage('project-management')}
              >
                查看全部
              </Button>
            </Box>
            {projects.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                暂无项目，请前往项目管理创建
              </Typography>
            ) : (
              projects.map((p) => {
                let pTotal = 0;
                let pComplete = 0;
                for (const sat of p.satellites) {
                  for (const sub of sat.subsystems) {
                    for (const unit of sub.units) {
                      pTotal++;
                      if (unit.isKitComplete) pComplete++;
                    }
                  }
                }
                const pRate =
                  pTotal === 0 ? 0 : Math.round((pComplete / pTotal) * 100);
                return (
                  <Box
                    key={p.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 1.5,
                      px: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => goToGlobalPage('project-management')}
                  >
                    <FolderIcon color="action" />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {p.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.satellites.length} 颗卫星 · {pTotal} 物料
                      </Typography>
                    </Box>
                    <Box sx={{ width: 120 }}>
                      <ProgressBar value={pRate} status={pRate >= 100 ? 'complete' : pRate > 0 ? 'partial' : 'none'} height={6} />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
                      {pRate}%
                    </Typography>
                  </Box>
                );
              })
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ===== 项目总览：有选中项目时 =====
  const metrics = calcProjectMetrics(currentSatellite, aitWorks);
  const kitStatuses = calcAllKits(currentSatellite);
  const satRate = calcSatelliteKitRate(currentSatellite);

  const handlePhaseNavigate = (phase: string): void => {
    setCurrentPhase(phase as PhaseType);
    goToProjectPage('phase');
  };

  // 监听步骤条点击事件
  if (typeof window !== 'undefined') {
    window.removeEventListener('phase-stepper-click', () => {});
    window.addEventListener('phase-stepper-click', ((e: CustomEvent) => {
      handlePhaseNavigate(e.detail.phase);
    }) as EventListener);
  }

  // 多星对比数据
  const satelliteSummaries = currentProject.satellites.map(calcSatelliteSummary);

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
                {currentProject.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {currentProject.satelliteModel} · 当前卫星：{currentSatellite.name}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => goToProjectPage('tree')}
                >
                  查看层级数据
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => goToProjectPage('kitboard')}
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

      {/* 多星对比（如果项目有多颗卫星） */}
      {currentProject.satellites.length > 1 && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              多星齐套率对比
            </Typography>
            <Grid container spacing={1.5}>
              {satelliteSummaries.map((ss) => (
                <Grid item xs={12} sm={6} md={4} key={ss.partNo}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor:
                        ss.partNo === currentSatellitePartNo
                          ? 'primary.main'
                          : 'divider',
                      bgcolor:
                        ss.partNo === currentSatellitePartNo
                          ? 'action.selected'
                          : 'transparent',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {ss.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ss.partNo} · {ss.subsystemCount} 分系统 · {ss.totalMaterials} 物料
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <ProgressBar value={ss.kitRate} status={ss.kitRate >= 100 ? 'complete' : ss.kitRate > 0 ? 'partial' : 'none'} height={6} />
                      <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 32, textAlign: 'right' }}>
                        {ss.kitRate}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

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
              onClick={() => goToProjectPage('kitboard')}
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
                  onClick={() => goToProjectPage('kitboard')}
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
