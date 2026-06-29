// ============================================================
// src/components/common/ProgressBar.tsx — 进度条组件
// 带色块状态标识，圆角两端
// ============================================================

import { Box, useTheme } from '@mui/material';
import type { KitStatusType } from '@/types';

interface ProgressBarProps {
  /** 进度值 0-100 */
  value: number;
  /** 状态，决定进度色 */
  status: KitStatusType;
  /** 高度 px */
  height?: number;
}

export default function ProgressBar({
  value,
  status,
  height = 8,
}: ProgressBarProps): React.ReactElement {
  const theme = useTheme();

  const colorMap: Record<KitStatusType, string> = {
    complete: theme.palette.success.main,
    partial: theme.palette.warning.main,
    none: theme.palette.error.main,
  };

  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <Box
      sx={{
        width: '100%',
        height,
        borderRadius: height / 2,
        bgcolor: theme.palette.divider,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: `${clampedValue}%`,
          height: '100%',
          borderRadius: height / 2,
          bgcolor: colorMap[status],
          transition: 'width 0.4s ease',
        }}
      />
    </Box>
  );
}
