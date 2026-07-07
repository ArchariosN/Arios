// ============================================================
// src/components/ait/AitAddDialog.tsx — 新增工作项弹窗（v2 多星作用域）
// 工作名/类型/关联单机/计划时间/负责人/备注
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
} from '@mui/material';
import { usePhaseStore } from '@/store/usePhaseStore';
import { useBomStore } from '@/store/useBomStore';
import type { AitWorkType } from '@/types';
import { AIT_WORK_PRESETS } from '@/types';

interface AitAddDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AitAddDialog({
  open,
  onClose,
}: AitAddDialogProps): React.ReactElement {
  const addAitWork = usePhaseStore((s) => s.addAitWork);
  const currentSatellitePartNo = useBomStore((s) => s.currentSatellitePartNo);
  const aitWorks = usePhaseStore((s) =>
    currentSatellitePartNo ? s.getAitWorks(currentSatellitePartNo) : [],
  );
  const currentSatellite = useBomStore((s) => s.getCurrentSatellite());

  const [name, setName] = useState('');
  const [type, setType] = useState<AitWorkType>('electrical_test');
  const [relatedUnitPartNo, setRelatedUnitPartNo] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [owner, setOwner] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setType('electrical_test');
      setRelatedUnitPartNo('');
      setPlannedDate('');
      setOwner('');
      setRemark('');
    }
  }, [open]);

  const equipmentOptions = useMemo(() => {
    if (!currentSatellite) return [];
    const list: { partNo: string; label: string }[] = [];
    for (const sub of currentSatellite.subsystems) {
      for (const unit of sub.units) {
        if (unit.type === 'equipment') {
          list.push({
            partNo: unit.partNo,
            label: `${unit.partNo} — ${unit.name}`,
          });
        }
      }
    }
    return list;
  }, [currentSatellite]);

  const handleSubmit = (): void => {
    if (!name.trim() || !currentSatellitePartNo) return;

    // 计算待开始列的最大 order
    const pendingWorks = aitWorks.filter((w) => w.status === 'pending');
    const maxOrder = pendingWorks.reduce(
      (max, w) => Math.max(max, w.order),
      -1,
    );

    addAitWork(currentSatellitePartNo, {
      name: name.trim(),
      type,
      order: maxOrder + 1,
      status: 'pending',
      relatedUnitPartNo: relatedUnitPartNo || null,
      plannedDate: plannedDate || null,
      actualDate: null,
      owner: owner.trim() || '未分配',
      remark: remark.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新增 AIT 工作项</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="工作名称"
            required
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入工作名称"
          />
          <TextField
            select
            label="工作类型"
            fullWidth
            value={type}
            onChange={(e) => setType(e.target.value as AitWorkType)}
          >
            {(Object.keys(AIT_WORK_PRESETS) as AitWorkType[]).map((t) => (
              <MenuItem key={t} value={t}>
                {AIT_WORK_PRESETS[t]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="关联单机"
            fullWidth
            value={relatedUnitPartNo}
            onChange={(e) => setRelatedUnitPartNo(e.target.value)}
          >
            <MenuItem value="">
              <em>整星（不关联单机）</em>
            </MenuItem>
            {equipmentOptions.map((opt) => (
              <MenuItem key={opt.partNo} value={opt.partNo}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="计划时间"
            type="date"
            fullWidth
            value={plannedDate}
            onChange={(e) => setPlannedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="负责人"
            fullWidth
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="请输入负责人姓名"
          />
          <TextField
            label="备注"
            fullWidth
            multiline
            rows={2}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="可选备注信息"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim() || !currentSatellitePartNo}
        >
          添加
        </Button>
      </DialogActions>
    </Dialog>
  );
}
