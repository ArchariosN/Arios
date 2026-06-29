// ============================================================
// src/components/kitboard/SubsystemCard.tsx — 分系统卡片
// 名称 + 环形图 + 齐套数/总数 + 色块
// ============================================================

import { Card, CardContent, Box, Typography, useTheme } from '@mui/material';
import KitRingChart from '@/components/common/KitRingChart';
import ProgressBar from '@/components/common/ProgressBar';
import { calcSubsystemKit } from '@/utils/kitCalculator';
import type { Subsystem, KitFilter } from '@/types';

interface SubsystemCardProps {
  /** 分系统数据 */
  subsystem: Subsystem;
  /** 齐套筛选维度 */
  filter: KitFilter;
  /** 点击回调（下钻） */
  onClick: () => void;
}

export default function SubsystemCard({
  subsystem,
  filter,
  onClick,
}: SubsystemCardProps): React.ReactElement {
  const theme = useTheme();
  const kitStatus = calcSubsystemKit(subsystem, filter);

  const colorMap = {
    complete: theme.palette.success.main,
    partial: theme.palette.warning.main,
    none: theme.palette.error.main,
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
        borderTop: `3px solid ${colorMap[kitStatus.status]}`,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
          }}
        >
          <KitRingChart
            rate={kitStatus.rate}
            size={72}
            status={kitStatus.status}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subsystem.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subsystem.partNo}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
              {kitStatus.completeUnits} / {kitStatus.totalUnits}
            </Typography>
          </Box>
        </Box>
        <ProgressBar value={kitStatus.rate} status={kitStatus.status} height={6} />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          齐套率 {kitStatus.rate}%
        </Typography>
      </CardContent>
    </Card>
  );
}
