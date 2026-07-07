// ============================================================
// src/components/ait/AitCard.tsx — 可拖拽工作卡片（v2 多星作用域）
// 使用 useSortable 实现拖拽
// ============================================================

import { Card, CardContent, Box, Typography, IconButton, Chip } from '@mui/material';
import { Delete as DeleteIcon, DragIndicator as DragIcon } from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePhaseStore } from '@/store/usePhaseStore';
import { useBomStore } from '@/store/useBomStore';
import type { AitWork } from '@/types';
import { AIT_WORK_PRESETS } from '@/types';

interface AitCardProps {
  work: AitWork;
}

export default function AitCard({ work }: AitCardProps): React.ReactElement {
  const removeAitWork = usePhaseStore((s) => s.removeAitWork);
  const currentSatellitePartNo = useBomStore((s) => s.currentSatellitePartNo);
  const currentSatellite = useBomStore((s) => s.getCurrentSatellite());

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: work.id });

  // 查找关联单机名称
  let relatedUnitName = '整星';
  if (work.relatedUnitPartNo && currentSatellite) {
    for (const sub of currentSatellite.subsystems) {
      const unit = sub.units.find((u) => u.partNo === work.relatedUnitPartNo);
      if (unit) {
        relatedUnitName = unit.name;
        break;
      }
    }
  }

  const handleDelete = (): void => {
    if (currentSatellitePartNo) {
      removeAitWork(currentSatellitePartNo, work.id);
    }
  };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
        borderLeft: 3,
        borderLeftColor:
          work.status === 'completed'
            ? 'success.main'
            : work.status === 'in_progress'
              ? 'info.main'
              : 'divider',
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          {/* 拖拽手柄 */}
          <Box
            {...attributes}
            {...listeners}
            sx={{
              cursor: 'grab',
              color: 'text.secondary',
              pt: 0.5,
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <DragIcon fontSize="small" />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Chip
                label={AIT_WORK_PRESETS[work.type]}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
              <Typography variant="caption" color="text.secondary">
                #{work.order + 1}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {work.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              关联：{relatedUnitName}
            </Typography>
            {work.plannedDate && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                计划：{work.plannedDate}
              </Typography>
            )}
            {work.owner && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                负责人：{work.owner}
              </Typography>
            )}
          </Box>

          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{ p: 0.25 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
