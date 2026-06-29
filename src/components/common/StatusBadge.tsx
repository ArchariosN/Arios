// ============================================================
// src/components/common/StatusBadge.tsx — 状态标签
// 齐套/投产/交付/AIT 状态统一渲染
// ============================================================

import { Chip } from '@mui/material';
import type {
  KitStatusType,
  ProductionStatus,
  AitWorkStatus,
} from '@/types';

type StatusBadgeType = 'kit' | 'production' | 'delivery' | 'ait';

interface StatusBadgeProps {
  /** 标签类型 */
  type: StatusBadgeType;
  /** 标签值 */
  value: string;
}

/** 齐套状态标签配置 */
const KIT_CONFIG: Record<
  KitStatusType,
  { label: string; color: 'success' | 'warning' | 'error' }
> = {
  complete: { label: '已齐套', color: 'success' },
  partial: { label: '部分齐套', color: 'warning' },
  none: { label: '未齐套', color: 'error' },
};

/** 投产状态标签配置 */
const PRODUCTION_CONFIG: Record<
  ProductionStatus,
  { label: string; color: 'default' | 'info' | 'success' }
> = {
  not_started: { label: '未投产', color: 'default' },
  in_progress: { label: '生产中', color: 'info' },
  completed: { label: '已完成', color: 'success' },
};

/** AIT 状态标签配置 */
const AIT_CONFIG: Record<
  AitWorkStatus,
  { label: string; color: 'default' | 'info' | 'success' }
> = {
  pending: { label: '待开始', color: 'default' },
  in_progress: { label: '进行中', color: 'info' },
  completed: { label: '已完成', color: 'success' },
};

export default function StatusBadge({
  type,
  value,
}: StatusBadgeProps): React.ReactElement {
  // 交付状态：根据值判断
  if (type === 'delivery') {
    let color: 'success' | 'warning' | 'error' | 'default' = 'default';
    let label = value;
    if (value === '已交付') {
      color = 'success';
    } else if (value === '待交付') {
      color = 'warning';
    } else if (value === '延期') {
      color = 'error';
    } else if (value === '未安排') {
      color = 'default';
      label = '未安排';
    }
    return (
      <Chip
        label={label}
        size="small"
        color={color}
        variant="outlined"
        sx={{ fontSize: '0.75rem' }}
      />
    );
  }

  // 齐套状态
  if (type === 'kit') {
    const config = KIT_CONFIG[value as KitStatusType];
    if (!config) {
      return (
        <Chip label={value} size="small" variant="outlined" />
      );
    }
    return (
      <Chip
        label={config.label}
        size="small"
        color={config.color}
        variant="outlined"
        sx={{ fontSize: '0.75rem' }}
      />
    );
  }

  // 投产状态
  if (type === 'production') {
    const config = PRODUCTION_CONFIG[value as ProductionStatus];
    if (!config) {
      return <Chip label={value} size="small" variant="outlined" />;
    }
    return (
      <Chip
        label={config.label}
        size="small"
        color={config.color}
        variant="outlined"
        sx={{ fontSize: '0.75rem' }}
      />
    );
  }

  // AIT 状态
  const config = AIT_CONFIG[value as AitWorkStatus];
  if (!config) {
    return <Chip label={value} size="small" variant="outlined" />;
  }
  return (
    <Chip
      label={config.label}
      size="small"
      color={config.color}
      variant="outlined"
      sx={{ fontSize: '0.75rem' }}
    />
  );
}
