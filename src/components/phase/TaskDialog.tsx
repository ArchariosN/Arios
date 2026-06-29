// ============================================================
// src/components/phase/TaskDialog.tsx — 临时任务新增弹窗
// 任务名/关联单机/负责人/截止日期
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
import type { PhaseType } from '@/types';

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  /** 当前阶段（新任务归属的阶段） */
  phaseType: PhaseType;
}

export default function TaskDialog({
  open,
  onClose,
  phaseType,
}: TaskDialogProps): React.ReactElement {
  const addTask = usePhaseStore((s) => s.addTask);
  const project = useBomStore((s) => s.project);

  const [name, setName] = useState('');
  const [relatedUnitPartNo, setRelatedUnitPartNo] = useState('');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');

  // 重置表单
  useEffect(() => {
    if (open) {
      setName('');
      setRelatedUnitPartNo('');
      setOwner('');
      setDueDate('');
    }
  }, [open]);

  // 收集所有 EQ 单机供选择
  const equipmentOptions = useMemo(() => {
    if (!project) return [];
    const list: { partNo: string; label: string }[] = [];
    for (const sub of project.satellite.subsystems) {
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
  }, [project]);

  const handleSubmit = (): void => {
    if (!name.trim()) return;
    addTask({
      name: name.trim(),
      phaseType,
      relatedUnitPartNo: relatedUnitPartNo || null,
      owner: owner.trim() || '未分配',
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新增临时任务</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="任务名称"
            required
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入任务名称"
          />
          <TextField
            select
            label="关联单机"
            fullWidth
            value={relatedUnitPartNo}
            onChange={(e) => setRelatedUnitPartNo(e.target.value)}
          >
            <MenuItem value="">
              <em>不关联</em>
            </MenuItem>
            {equipmentOptions.map((opt) => (
              <MenuItem key={opt.partNo} value={opt.partNo}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="负责人"
            fullWidth
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="请输入负责人姓名"
          />
          <TextField
            label="截止日期"
            type="date"
            fullWidth
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          添加
        </Button>
      </DialogActions>
    </Dialog>
  );
}
