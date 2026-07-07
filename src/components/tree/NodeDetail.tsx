// ============================================================
// src/components/tree/NodeDetail.tsx — 节点详情面板（v2 多星作用域）
// 基本信息 + 三状态勾选 + 齐套/投产/交付编辑
// ============================================================

import {
  Card,
  CardContent,
  Box,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  TextField,
  Divider,
  Stack,
} from '@mui/material';
import { useBomStore } from '@/store/useBomStore';
import { useUiStore } from '@/store/useUiStore';
import StatusBadge from '@/components/common/StatusBadge';
import KitRingChart from '@/components/common/KitRingChart';
import { calcSubsystemKit } from '@/utils/kitCalculator';
import type {
  Unit,
  ProductionStatus,
  UnitStatus,
  KitStatusType,
} from '@/types';
import { PRODUCTION_STATUS_LABELS } from '@/types';

interface NodeDetailProps {
  /** 选中节点的 partNo */
  partNo: string | null;
}

/** 信息行组件 */
function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>
        {value || '—'}
      </Typography>
    </Grid>
  );
}

export default function NodeDetail({
  partNo,
}: NodeDetailProps): React.ReactElement {
  const currentSatellite = useBomStore((s) => s.getCurrentSatellite());
  const currentSatellitePartNo = useBomStore((s) => s.currentSatellitePartNo);
  const updateUnit = useBomStore((s) => s.updateUnit);
  const selectNode = useUiStore((s) => s.selectNode);

  if (!currentSatellite || !partNo) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            请从左侧选择一个节点查看详情
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const satellite = currentSatellite;
  const satPartNo = currentSatellitePartNo ?? satellite.partNo;

  // 整星节点
  if (satellite.partNo === partNo) {
    const totalUnits = satellite.subsystems.reduce(
      (sum, s) => sum + s.units.length,
      0,
    );
    const kitComplete = satellite.subsystems.reduce(
      (sum, s) => sum + s.units.filter((u) => u.isKitComplete).length,
      0,
    );
    const rate =
      totalUnits === 0 ? 0 : Math.round((kitComplete / totalUnits) * 100);
    const status: KitStatusType =
      rate >= 100 ? 'complete' : rate > 0 ? 'partial' : 'none';

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <span style={{ fontSize: '2rem' }}>🛰️</span>
            <Box>
              <Typography variant="h6">{satellite.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {satellite.partNo}
              </Typography>
            </Box>
          </Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <InfoRow label="制造商" value={satellite.manufacturer} />
            <InfoRow label="分系统数" value={String(satellite.subsystems.length)} />
            <InfoRow label="单机/零部件总数" value={String(totalUnits)} />
            <InfoRow label="已齐套" value={String(kitComplete)} />
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <KitRingChart rate={rate} size={120} status={status} />
          </Box>
          <Typography variant="body2" align="center" color="text.secondary">
            整星齐套率 {rate}%
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 分系统节点
  const subsystem = satellite.subsystems.find((s) => s.partNo === partNo);
  if (subsystem) {
    const kitStatus = calcSubsystemKit(subsystem);
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <span style={{ fontSize: '2rem' }}>📦</span>
            <Box>
              <Typography variant="h6">{subsystem.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {subsystem.partNo}
              </Typography>
            </Box>
          </Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <InfoRow label="下属单机/零部件数" value={String(subsystem.units.length)} />
            <InfoRow label="已齐套数" value={String(kitStatus.completeUnits)} />
            <InfoRow
              label="齐套状态"
              value={kitStatus.status === 'complete' ? '已齐套' : kitStatus.status === 'partial' ? '部分齐套' : '未齐套'}
            />
            <InfoRow label="齐套率" value={`${kitStatus.rate}%`} />
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <KitRingChart
              rate={kitStatus.rate}
              size={120}
              status={kitStatus.status}
            />
          </Box>
          {/* 下属单机列表 */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            下属单机/零部件
          </Typography>
          <Stack spacing={0.5}>
            {subsystem.units.slice(0, 8).map((u) => (
              <Box
                key={u.partNo}
                onClick={() => selectNode(u.partNo)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.5,
                  px: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: u.isKitComplete ? 'success.main' : 'error.main',
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {u.partNo}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {u.name}
                </Typography>
              </Box>
            ))}
            {subsystem.units.length > 8 && (
              <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                ...共 {subsystem.units.length} 条
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // 单机/零部件节点
  const unit = satellite.subsystems
    .flatMap((s) => s.units)
    .find((u) => u.partNo === partNo) as Unit | undefined;

  if (!unit) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            未找到节点信息
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const isEquipment = unit.type === 'equipment';

  const handleStatusChange = (key: keyof UnitStatus, value: boolean): void => {
    updateUnit(satPartNo, unit.partNo, {
      status: { ...unit.status, [key]: value },
    });
  };

  const handleKitCompleteChange = (value: boolean): void => {
    updateUnit(satPartNo, unit.partNo, { isKitComplete: value });
  };

  const handleProductionChange = (value: ProductionStatus): void => {
    updateUnit(satPartNo, unit.partNo, { productionStatus: value });
  };

  const handleDeliveryDateChange = (value: string): void => {
    updateUnit(satPartNo, unit.partNo, { deliveryDate: value || null });
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <span style={{ fontSize: '2rem' }}>
            {isEquipment ? '🔧' : '⚡'}
          </span>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{unit.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {unit.partNo}
            </Typography>
          </Box>
          <StatusBadge
            type="kit"
            value={unit.isKitComplete ? 'complete' : 'none'}
          />
        </Box>

        {/* 基本信息 */}
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          基本信息
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <InfoRow label="规格" value={unit.spec} />
          <InfoRow label="制造商" value={unit.manufacturer} />
          <InfoRow label="质量等级" value={unit.qualityLevel} />
          <InfoRow label="形态" value={unit.form} />
          <InfoRow label="用量" value={String(unit.quantity)} />
          <InfoRow label="位号" value={unit.location} />
          <InfoRow label="单位" value={unit.unit} />
          <InfoRow
            label="类型"
            value={isEquipment ? '单机设备' : '零部件'}
          />
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* 三状态管理（仅 EQ 单机） */}
        {isEquipment ? (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              三状态齐套管理
            </Typography>
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={unit.status.electrical}
                      onChange={(e) =>
                        handleStatusChange('electrical', e.target.checked)
                      }
                    />
                  }
                  label="电性件齐套"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={unit.status.qualification}
                      onChange={(e) =>
                        handleStatusChange('qualification', e.target.checked)
                      }
                    />
                  }
                  label="鉴定件齐套"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={unit.status.flight}
                      onChange={(e) =>
                        handleStatusChange('flight', e.target.checked)
                      }
                    />
                  }
                  label="正样件齐套"
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Checkbox
                  checked={unit.isKitComplete}
                  onChange={(e) => handleKitCompleteChange(e.target.checked)}
                />
              }
              label="整体齐套标记"
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            {/* 投产状态 */}
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              投产与交付
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  投产状态
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={unit.productionStatus}
                  onChange={(e) =>
                    handleProductionChange(e.target.value as ProductionStatus)
                  }
                  sx={{ mt: 0.5 }}
                >
                  {(Object.keys(PRODUCTION_STATUS_LABELS) as ProductionStatus[]).map(
                    (ps) => (
                      <MenuItem key={ps} value={ps}>
                        {PRODUCTION_STATUS_LABELS[ps]}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  交付日期
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={unit.deliveryDate ?? ''}
                  onChange={(e) => handleDeliveryDateChange(e.target.value)}
                  sx={{ mt: 0.5 }}
                />
              </Grid>
            </Grid>

            {unit.inSatellite.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  在整星中：{unit.inSatellite.join('、')}
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              零部件不做三状态管理。整体齐套标记：
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={unit.isKitComplete}
                  onChange={(e) => handleKitCompleteChange(e.target.checked)}
                />
              }
              label="已齐套"
              sx={{ mt: 1 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
