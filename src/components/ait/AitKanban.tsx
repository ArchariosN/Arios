// ============================================================
// src/components/ait/AitKanban.tsx — AIT 拖拽看板（v2 多星作用域）
// 三列（待开始/进行中/已完成）+ DndContext
// ============================================================

import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import AitCard from './AitCard';
import AitAddDialog from './AitAddDialog';
import { usePhaseStore } from '@/store/usePhaseStore';
import { useBomStore } from '@/store/useBomStore';
import type { AitWork, AitWorkStatus } from '@/types';
import { AIT_WORK_PRESETS } from '@/types';

/** 看板列配置 */
const COLUMNS: { status: AitWorkStatus; label: string; color: string }[] = [
  { status: 'pending', label: '待开始', color: '#8E8E93' },
  { status: 'in_progress', label: '进行中', color: '#0071E3' },
  { status: 'completed', label: '已完成', color: '#34C759' },
];

/** 可拖放列容器 */
function DroppableColumn({
  status,
  label,
  color,
  works,
}: {
  status: AitWorkStatus;
  label: string;
  color: string;
  works: AitWork[];
}): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` });

  return (
    <Card
      ref={setNodeRef}
      sx={{
        minHeight: 400,
        bgcolor: 'background.paper',
        borderTop: 3,
        borderColor: color,
        outline: isOver ? '2px solid' : 'none',
        outlineColor: 'primary.main',
      }}
    >
      <CardContent sx={{ p: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
            px: 0.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: color,
              }}
            />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {label}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            ({works.length})
          </Typography>
        </Box>
        <SortableContext
          items={works.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          {works.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                拖拽工作项到此处
              </Typography>
            </Box>
          ) : (
            works.map((work) => <AitCard key={work.id} work={work} />)
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}

export default function AitKanban(): React.ReactElement {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentSatellitePartNo = useBomStore((s) => s.currentSatellitePartNo);
  const aitWorks = usePhaseStore((s) =>
    currentSatellitePartNo ? s.getAitWorks(currentSatellitePartNo) : [],
  );
  const moveAitWork = usePhaseStore((s) => s.moveAitWork);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeWork, setActiveWork] = useState<AitWork | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // 按状态分组并排序
  const worksByStatus = useMemo(() => {
    const groups: Record<AitWorkStatus, AitWork[]> = {
      pending: [],
      in_progress: [],
      completed: [],
    };
    for (const work of aitWorks) {
      groups[work.status].push(work);
    }
    (Object.keys(groups) as AitWorkStatus[]).forEach((key) => {
      groups[key].sort((a, b) => a.order - b.order);
    });
    return groups;
  }, [aitWorks]);

  const handleDragStart = (event: DragStartEvent): void => {
    const work = aitWorks.find((w) => w.id === event.active.id);
    if (work) setActiveWork(work);
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    setActiveWork(null);
    const { active, over } = event;
    if (!over || !currentSatellitePartNo) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const work = aitWorks.find((w) => w.id === activeId);
    if (!work) return;

    let toStatus: AitWorkStatus;
    let toIndex: number;

    if (overId.startsWith('col-')) {
      toStatus = overId.replace('col-', '') as AitWorkStatus;
      toIndex = worksByStatus[toStatus].length;
    } else {
      const overWork = aitWorks.find((w) => w.id === overId);
      if (!overWork) return;
      toStatus = overWork.status;

      const targetList = worksByStatus[toStatus];
      const overIndex = targetList.findIndex((w) => w.id === overId);

      if (work.status === toStatus && work.id === overId) return;

      toIndex = overIndex;
    }

    moveAitWork(currentSatellitePartNo, activeId, toStatus, toIndex);
  };

  if (!currentSatellitePartNo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        {useBomStore.getState().loading ? <CircularProgress /> : <Typography color="text.secondary">暂无卫星数据</Typography>}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 标题栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6">AIT 任务编排看板</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          新增工作项
        </Button>
      </Box>

      {/* 看板 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Grid container spacing={2}>
          {COLUMNS.map((col) => (
            <Grid
              item
              xs={12}
              md={4}
              key={col.status}
              sx={
                isMobile
                  ? { minWidth: 280 }
                  : {}
              }
            >
              <DroppableColumn
                status={col.status}
                label={col.label}
                color={col.color}
                works={worksByStatus[col.status]}
              />
            </Grid>
          ))}
        </Grid>

        {/* 拖拽预览 */}
        <DragOverlay>
          {activeWork ? (
            <Card sx={{ opacity: 0.8, maxWidth: 300 }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {AIT_WORK_PRESETS[activeWork.type]} #{activeWork.order + 1}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {activeWork.name}
                </Typography>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AitAddDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />
    </Box>
  );
}
