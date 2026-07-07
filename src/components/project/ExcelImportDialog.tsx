// ============================================================
// src/components/project/ExcelImportDialog.tsx — Excel 导入预览弹窗（v2 新增）
// 展示导入预览：卫星数/物料数/异常行 + 策略选择 + 确认导入
// ============================================================

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import type { ExcelImportResult, ExcelImportOptions } from '@/types';
import { extractSatellites } from '@/services/ExcelService';
import { useBomStore } from '@/store/useBomStore';
import { usePhaseStore } from '@/store/usePhaseStore';

interface ExcelImportDialogProps {
  open: boolean;
  onClose: () => void;
  /** 导入预览结果 */
  result: ExcelImportResult | null;
  /** 导入选项 */
  options: ExcelImportOptions;
}

export default function ExcelImportDialog({
  open,
  onClose,
  result,
  options,
}: ExcelImportDialogProps): React.ReactElement {
  const [strategy, setStrategy] = useState<'append' | 'overwrite'>(
    options.strategy,
  );
  const importSatellites = useBomStore((s) => s.importSatellites);
  const initSatellitePhaseData = usePhaseStore((s) => s.initSatellitePhaseData);

  if (!result) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Excel 导入预览</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">无导入数据</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>关闭</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const handleConfirm = async (): Promise<void> => {
    const satellites = extractSatellites(result);
    if (satellites.length === 0) {
      onClose();
      return;
    }
    importSatellites(options.projectId, satellites, strategy);
    // 为每颗新卫星初始化阶段数据
    for (const sat of satellites) {
      await initSatellitePhaseData(sat.partNo);
    }
    onClose();
  };

  const totalErrors = result.sheetResults.reduce(
    (sum, r) => sum + r.rowValidations.filter((v) => !v.valid).length,
    0,
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Excel 导入预览</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* 汇总信息 */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`卫星数：${result.satelliteCount}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`总物料数：${result.totalMaterials}`}
              color="info"
              variant="outlined"
            />
            <Chip
              label={`异常行：${totalErrors}`}
              color={totalErrors > 0 ? 'error' : 'success'}
              variant="outlined"
            />
          </Box>

          {result.errors.length > 0 && (
            <Alert severity="warning">
              {result.errors.map((e, i) => (
                <div key={i}>• {e}</div>
              ))}
            </Alert>
          )}

          {/* 每 sheet 详情 */}
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sheet 名（卫星名）</TableCell>
                  <TableCell align="center">物料数</TableCell>
                  <TableCell align="center">有效行</TableCell>
                  <TableCell align="center">异常行</TableCell>
                  <TableCell align="center">状态</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.sheetResults.map((sr) => {
                  const invalidCount = sr.rowValidations.filter(
                    (v) => !v.valid,
                  ).length;
                  return (
                    <TableRow key={sr.sheetName}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {sr.sheetName}
                      </TableCell>
                      <TableCell align="center">{sr.totalRows}</TableCell>
                      <TableCell align="center">{sr.validRows}</TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="caption"
                          color={invalidCount > 0 ? 'error' : 'text.secondary'}
                        >
                          {invalidCount}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {sr.satellite ? (
                          <Chip label="可导入" color="success" size="small" />
                        ) : (
                          <Chip label="解析失败" color="error" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider />

          {/* 策略选择 */}
          <FormControl>
            <FormLabel>导入策略</FormLabel>
            <RadioGroup
              value={strategy}
              onChange={(e) =>
                setStrategy(e.target.value as 'append' | 'overwrite')
              }
            >
              <FormControlLabel
                value="append"
                control={<Radio />}
                label="追加：保留原有卫星，在末尾追加新卫星"
              />
              <FormControlLabel
                value="overwrite"
                control={<Radio />}
                label="覆盖：清空原有卫星，替换为导入的卫星"
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={result.satelliteCount === 0}
        >
          确认导入
        </Button>
      </DialogActions>
    </Dialog>
  );
}
