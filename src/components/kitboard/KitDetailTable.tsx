// ============================================================
// src/components/kitboard/KitDetailTable.tsx — 下钻明细表（v2 多星作用域）
// 单机列表 + 齐套状态行内编辑
// ============================================================

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Typography,
} from '@mui/material';
import StatusBadge from '@/components/common/StatusBadge';
import { useBomStore } from '@/store/useBomStore';
import type { Subsystem, KitFilter, Unit } from '@/types';

interface KitDetailTableProps {
  /** 分系统数据 */
  subsystem: Subsystem;
  /** 齐套筛选维度 */
  filter: KitFilter;
}

export default function KitDetailTable({
  subsystem,
  filter,
}: KitDetailTableProps): React.ReactElement {
  const updateUnit = useBomStore((s) => s.updateUnit);
  const currentSatellitePartNo = useBomStore((s) => s.currentSatellitePartNo);

  const handleStatusToggle = (
    unit: Unit,
    field: 'electrical' | 'qualification' | 'flight',
  ): void => {
    if (!currentSatellitePartNo) return;
    updateUnit(currentSatellitePartNo, unit.partNo, {
      status: { ...unit.status, [field]: !unit.status[field] },
    });
  };

  const showStatusColumns = filter !== 'all';

  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>料号</TableCell>
            <TableCell>品名</TableCell>
            <TableCell align="center">类型</TableCell>
            <TableCell align="center">电性件</TableCell>
            <TableCell align="center">鉴定件</TableCell>
            <TableCell align="center">正样件</TableCell>
            <TableCell align="center">整体齐套</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subsystem.units.map((unit) => (
            <TableRow
              key={unit.partNo}
              sx={{ '&:last-child td': { border: 0 } }}
            >
              <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                {unit.partNo}
              </TableCell>
              <TableCell sx={{ fontSize: '0.8rem' }}>{unit.name}</TableCell>
              <TableCell align="center">
                <Typography variant="caption">
                  {unit.type === 'equipment' ? '单机' : '零件'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                {unit.type === 'equipment' ? (
                  <Checkbox
                    size="small"
                    checked={unit.status.electrical}
                    onChange={() => handleStatusToggle(unit, 'electrical')}
                    sx={
                      showStatusColumns && filter === 'electrical'
                        ? { bgcolor: 'action.selected', borderRadius: 1 }
                        : {}
                    }
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    —
                  </Typography>
                )}
              </TableCell>
              <TableCell align="center">
                {unit.type === 'equipment' ? (
                  <Checkbox
                    size="small"
                    checked={unit.status.qualification}
                    onChange={() => handleStatusToggle(unit, 'qualification')}
                    sx={
                      showStatusColumns && filter === 'qualification'
                        ? { bgcolor: 'action.selected', borderRadius: 1 }
                        : {}
                    }
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    —
                  </Typography>
                )}
              </TableCell>
              <TableCell align="center">
                {unit.type === 'equipment' ? (
                  <Checkbox
                    size="small"
                    checked={unit.status.flight}
                    onChange={() => handleStatusToggle(unit, 'flight')}
                    sx={
                      showStatusColumns && filter === 'flight'
                        ? { bgcolor: 'action.selected', borderRadius: 1 }
                        : {}
                    }
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    —
                  </Typography>
                )}
              </TableCell>
              <TableCell align="center">
                <StatusBadge
                  type="kit"
                  value={unit.isKitComplete ? 'complete' : 'none'}
                />
              </TableCell>
            </TableRow>
          ))}
          {subsystem.units.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Typography variant="body2" color="text.secondary" align="center">
                  该分系统暂无单机/零部件数据
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
