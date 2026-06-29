// ============================================================
// src/components/phase/IntegrationView.tsx — 联试阶段视图
// 正样件/电性件单机交付状态列表
// ============================================================

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
} from '@mui/material';
import StatusBadge from '@/components/common/StatusBadge';
import { useBomStore } from '@/store/useBomStore';
import type { Unit } from '@/types';

/** 判断交付状态 */
function getDeliveryStatus(
  deliveryDate: string | null,
): { label: string; value: string } {
  if (!deliveryDate) return { label: '未安排', value: '未安排' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  if (delivery < today) return { label: '已交付', value: '已交付' };
  return { label: '待交付', value: '待交付' };
}

export default function IntegrationView(): React.ReactElement {
  const project = useBomStore((s) => s.project);

  // 筛选含正样件或电性件的单机
  const unitsWithSub = useMemo(() => {
    if (!project) return [];
    const list: { unit: Unit; subsystemName: string }[] = [];
    for (const sub of project.satellite.subsystems) {
      for (const unit of sub.units) {
        if (unit.type === 'equipment' && (unit.status.flight || unit.status.electrical)) {
          list.push({ unit, subsystemName: sub.name });
        }
      }
    }
    return list;
  }, [project]);

  if (unitsWithSub.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">
          暂无含正样件/电性件齐套的单机
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
            <TableCell align="center">正样件</TableCell>
            <TableCell align="center">电性件</TableCell>
            <TableCell align="center">交付状态</TableCell>
            <TableCell align="center">交付日期</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {unitsWithSub.map(({ unit, subsystemName }) => {
            const delivery = getDeliveryStatus(unit.deliveryDate);
            return (
              <TableRow key={unit.partNo} sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                  {unit.partNo}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{unit.name}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{subsystemName}</TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {unit.status.flight ? '✅ 齐套' : '—'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {unit.status.electrical ? '✅ 齐套' : '—'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <StatusBadge type="delivery" value={delivery.value} />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {unit.deliveryDate ?? '—'}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
