// ============================================================
// src/components/dashboard/MetricCard.tsx — 指标卡片
// 苹果风格：圆角16px，微妙阴影，大号数字 + 小号标签
// ============================================================

import { Card, Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';

interface MetricCardProps {
  /** 标签 */
  label: string;
  /** 数值 */
  value: string | number;
  /** 图标 */
  icon: ReactNode;
  /** 强调色 */
  color?: string;
}

export default function MetricCard({
  label,
  value,
  icon,
  color,
}: MetricCardProps): React.ReactElement {
  const theme = useTheme();
  const accentColor = color ?? theme.palette.primary.main;

  return (
    <Card
      sx={{
        p: 2.5,
        cursor: 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${accentColor}15`,
            color: accentColor,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          fontSize: { xs: '1.5rem', md: '2rem' },
          lineHeight: 1.1,
          mb: 0.5,
        }}
      >
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Card>
  );
}
