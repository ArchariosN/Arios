// ============================================================
// src/components/phase/DesignView.tsx — 设计/投产阶段视图（v2 多星作用域）
// 单机投产状态 + 交付日期行内编辑
// ============================================================

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  TextField,
  Paper,
  Box,
  Typography,
} from '@mui/material';
import { useBomStore } from '@/store/useBomStore';
import type { ProductionStatus, Unit } from '@/types';
import { PRODUCTION_STATUS_LABELS } from '@/types';

interface DesignViewProps {
  /** 视图变体：design=设计阶段(全部), production=投产阶段(仅已投产) */
  variant?: 'design' | 'production';
}

export default function DesignView({
  variant = 'design',
}: DesignViewProps): React.ReactElement {
  const currentSatellite = useBomStore((s) => s.getCurrentSatellite());
  const currentSatellitePartNo = useBomStore((s) => s.currentSatellitePartNo);
  const updateUnit = useBomStore((s) => s.updateUnit);

  // 收集所有 EQ 单机及其所属分系统
  const unitsWithSub = useMemo(() => {
    if (!currentSatellite) return [];
    const list: { unit: Unit; subsystemName: string }[] = [];
    for (const sub of currentSatellite.subsystems) {
      for (const unit of sub.units) {
        if (unit.type === 'equipment') {
          list.push({ unit, subsystemName: sub.name });
        }
      }
    }
    // 投产阶段仅显示已投产的
    if (variant === 'production') {
      return list.filter(
        (item) => item.unit.productionStatus !== 'not_started',
      );
    }
    return list;
  }, [currentSatellite, variant]);

  const handleProductionChange = (partNo: string, value: ProductionStatus): void => {
    if (!currentSatellitePartNo) return;
    updateUnit(currentSatellitePartNo, partNo, { productionStatus: value });
  };

  const handleDateChange = (partNo: string, value: string): void => {
    if (!currentSatellitePartNo) return;
    updateUnit(currentSatellitePartNo, partNo, { deliveryDate: value || null });
  };

  if (unitsWithSub.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">
          {variant === 'production'
            ? '暂无已投产的单机'
            : '暂无单机数据'}
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>料号</TableCell>
            <TableCell>品名</TableCell>
            <TableCell>分系统</TableCell>
            {variant === 'design' ? (
              <>
                <TableCell align="center">投产状态</TableCell>
                <TableCell align="center">交付日期</TableCell>
              </>
            ) : (
              <>
                <TableCell align="center">生产状态</TableCell>
                <TableCell align="center">预计完成</TableCell>
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {unitsWithSub.map(({ unit, subsystemName }) => (
            <TableRow key={unit.partNo} sx={{ '&:last-child td': { border: 0 } }}>
              <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                {unit.partNo}
              </TableCell>
              <TableCell sx={{ fontSize: '0.8rem' }}>{unit.name}</TableCell>
              <TableCell sx={{ fontSize: '0.8rem' }}>{subsystemName}</TableCell>
              <TableCell align="center">
                <Select
                  size="small"
                  value={unit.productionStatus}
                  onChange={(e) =>
                    handleProductionChange(
                      unit.partNo,
                      e.target.value as ProductionStatus,
                    )
                  }
                  sx={{ minWidth: 100, fontSize: '0.8rem' }}
                >
                  {(
                    Object.keys(PRODUCTION_STATUS_LABELS) as ProductionStatus[]
                  ).map((ps) => (
                    <MenuItem key={ps} value={ps}>
                      {PRODUCTION_STATUS_LABELS[ps]}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>
              <TableCell align="center">
                <TextField
                  size="small"
                  type="date"
                  value={unit.deliveryDate ?? ''}
                  onChange={(e) => handleDateChange(unit.partNo, e.target.value)}
                  sx={{ width: 140 }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
