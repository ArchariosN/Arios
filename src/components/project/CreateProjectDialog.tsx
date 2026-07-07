// ============================================================
// src/components/project/CreateProjectDialog.tsx — 新建项目弹窗（v2 新增）
// 三种创建方式：空白项目 / 从示例数据创建 / 从 Excel 导入
// ============================================================

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useBomStore } from '@/store/useBomStore';
import { useUiStore } from '@/store/useUiStore';
import { parseExcel, downloadTemplate } from '@/services/ExcelService';
import type { ExcelImportResult } from '@/types';
import ExcelImportDialog from './ExcelImportDialog';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

type CreateMode = 'blank' | 'example' | 'excel';

export default function CreateProjectDialog({
  open,
  onClose,
}: CreateProjectDialogProps): React.ReactElement {
  const createProject = useBomStore((s) => s.createProject);
  const createProjectFromExample = useBomStore((s) => s.createProjectFromExample);
  const selectProject = useBomStore((s) => s.selectProject);
  const goToProjectPage = useUiStore((s) => s.goToProjectPage);

  const [name, setName] = useState('');
  const [satelliteModel, setSatelliteModel] = useState('');
  const [mode, setMode] = useState<CreateMode>('blank');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Excel 导入相关
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelResult, setExcelResult] = useState<ExcelImportResult | null>(null);
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);

  const handleReset = (): void => {
    setName('');
    setSatelliteModel('');
    setMode('blank');
    setError(null);
    setBusy(false);
    setExcelResult(null);
    setPendingProjectId(null);
  };

  const handleClose = (): void => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim()) {
      setError('请输入项目名称');
      return;
    }
    if (mode !== 'excel' && !satelliteModel.trim()) {
      setError('请输入卫星型号');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (mode === 'blank') {
        const project = await createProject({
          name: name.trim(),
          satelliteModel: satelliteModel.trim(),
        });
        selectProject(project.id);
        goToProjectPage('tree');
        handleClose();
      } else if (mode === 'example') {
        const project = await createProjectFromExample(name.trim());
        selectProject(project.id);
        goToProjectPage('tree');
        handleClose();
      } else if (mode === 'excel') {
        // Excel 模式：先创建空白项目，然后触发文件选择
        const project = await createProject({
          name: name.trim(),
          satelliteModel: satelliteModel.trim() || '待导入',
        });
        setPendingProjectId(project.id);
        fileInputRef.current?.click();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '创建项目失败';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file || !pendingProjectId) return;

    setBusy(true);
    setError(null);
    try {
      const result = await parseExcel(file, {
        projectId: pendingProjectId,
        strategy: 'overwrite',
        skipInvalidRows: true,
      });
      setExcelResult(result);
      setExcelDialogOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Excel 解析失败';
      setError(msg);
    } finally {
      setBusy(false);
      // 清空 input 以便重复选择同一文件
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExcelDialogClose = (): void => {
    setExcelDialogOpen(false);
    if (pendingProjectId) {
      selectProject(pendingProjectId);
      goToProjectPage('tree');
    }
    handleClose();
  };

  const handleDownloadTemplate = (): void => {
    downloadTemplate();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>新建项目</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="项目名称"
              required
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入项目名称"
            />
            <TextField
              label="卫星型号"
              required={mode !== 'excel'}
              fullWidth
              value={satelliteModel}
              onChange={(e) => setSatelliteModel(e.target.value)}
              placeholder="请输入卫星型号（Excel 导入模式可留空）"
            />

            <FormControl>
              <FormLabel>创建方式</FormLabel>
              <RadioGroup
                value={mode}
                onChange={(e) => setMode(e.target.value as CreateMode)}
              >
                <FormControlLabel
                  value="blank"
                  control={<Radio />}
                  label="空白项目：创建无卫星的空项目"
                />
                <FormControlLabel
                  value="example"
                  control={<Radio />}
                  label="从示例数据创建：复制示例卫星数据为种子"
                />
                <FormControlLabel
                  value="excel"
                  control={<Radio />}
                  label="从 Excel 导入：创建项目后上传 Excel 文件"
                />
              </RadioGroup>
            </FormControl>

            {mode === 'excel' && (
              <Alert severity="info" sx={{ py: 1 }}>
                点击「创建」后将选择 Excel 文件。单星单 sheet，多星多 sheet，
                sheet 名 = 卫星名。
                <Button
                  size="small"
                  onClick={handleDownloadTemplate}
                  sx={{ ml: 1 }}
                >
                  下载模板
                </Button>
              </Alert>
            )}

            {error && (
              <Alert severity="error">{error}</Alert>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={busy}>
            取消
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={busy || !name.trim()}
            startIcon={busy ? <CircularProgress size={16} /> : undefined}
          >
            {busy ? '创建中...' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      <ExcelImportDialog
        open={excelDialogOpen}
        onClose={handleExcelDialogClose}
        result={excelResult}
        options={{
          strategy: 'overwrite',
          projectId: pendingProjectId ?? '',
          skipInvalidRows: true,
        }}
      />
    </>
  );
}
