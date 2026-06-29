// ============================================================
// src/components/layout/StatusBar.tsx — 底部状态栏
// 显示：项目名 · 物料总数 · 齐套率 · 当前阶段
// ============================================================

import { Box, Typography } from '@mui/material';
import { useBomStore } from '@/store/useBomStore';
import { usePhaseStore } from '@/store/usePhaseStore';
import { calcProjectMetrics } from '@/utils/kitCalculator';
import { PHASE_LABELS } from '@/types';

export default function StatusBar(): React.ReactElement {
  const project = useBomStore((s) => s.project);
  const currentPhase = usePhaseStore((s) => s.currentPhase);
  const aitWorks = usePhaseStore((s) => s.aitWorks);

  const metrics = project
    ? calcProjectMetrics(project, aitWorks)
    : { totalMaterials: 0, kitRate: 0, productionCount: 0, aitWorkCount: 0 };

  return (
    <Box
      component="footer"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, md: 3 },
        px: { xs: 2, md: 3 },
        py: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        fontSize: '0.75rem',
        color: 'text.secondary',
        flexWrap: 'wrap',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 500 }}>
        {project?.name ?? '—'} · {project?.satelliteModel ?? ''}
      </Typography>
      <Typography variant="caption">
        物料总数：<strong>{metrics.totalMaterials}</strong>
      </Typography>
      <Typography variant="caption">
        齐套率：<strong>{metrics.kitRate}%</strong>
      </Typography>
      <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' } }}>
        已投产：<strong>{metrics.productionCount}</strong>
      </Typography>
      <Typography variant="caption">
        当前阶段：<strong>{PHASE_LABELS[currentPhase]}</strong>
      </Typography>
    </Box>
  );
}
