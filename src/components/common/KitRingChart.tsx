// ============================================================
// src/components/common/KitRingChart.tsx — 环形齐套率图
// 使用 Recharts RadialBarChart 封装，中心显示百分比
// ============================================================

import { Box, Typography, useTheme } from '@mui/material';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import type { KitStatusType } from '@/types';

interface KitRingChartProps {
  /** 齐套率 0-100 */
  rate: number;
  /** 图表尺寸 px */
  size?: number;
  /** 齐套状态，决定颜色 */
  status: KitStatusType;
}

export default function KitRingChart({
  rate,
  size = 80,
  status,
}: KitRingChartProps): React.ReactElement {
  const theme = useTheme();

  const colorMap: Record<KitStatusType, string> = {
    complete: theme.palette.success.main,
    partial: theme.palette.warning.main,
    none: theme.palette.error.main,
  };

  const color = colorMap[status];
  const clampedRate = Math.max(0, Math.min(100, rate));

  const data = [{ name: 'kit', value: clampedRate, fill: color }];

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <RadialBarChart
        width={size}
        height={size}
        data={data}
        startAngle={90}
        endAngle={-270}
        innerRadius={size * 0.32}
        outerRadius={size * 0.42}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          background={{ fill: theme.palette.divider }}
          dataKey="value"
          cornerRadius={size * 0.08}
          angleAxisId={0}
        />
      </RadialBarChart>
      <Box
        sx={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{ fontSize: size * 0.22, fontWeight: 700, lineHeight: 1, color }}
        >
          {clampedRate}%
        </Typography>
      </Box>
    </Box>
  );
}
