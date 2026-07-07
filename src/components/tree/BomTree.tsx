// ============================================================
// src/components/tree/BomTree.tsx — 树页面容器（v2 多星 + Excel 工具栏）
// 左树 + 右详情 + 顶部搜索 + Excel 工具栏（下载模板/导入/导出）
// ============================================================

import { useState, useMemo, useRef } from 'react';
import {
  Box,
  Card,
  TextField,
  InputAdornment,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Button,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import TreeNode from './TreeNode';
import NodeDetail from './NodeDetail';
import { useBomStore } from '@/store/useBomStore';
import { useUiStore } from '@/store/useUiStore';
import type { Subsystem, Unit, ExcelImportResult } from '@/types';
import { parseExcel, downloadTemplate, downloadProjectExcel } from '@/services/ExcelService';
import ExcelImportDialog from '@/components/project/ExcelImportDialog';

/** 递归过滤：检查分系统/单机是否匹配搜索词 */
function matchesSearch(
  partNo: string,
  name: string,
  query: string,
): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    partNo.toLowerCase().includes(q) || name.toLowerCase().includes(q)
  );
}

export default function BomTree(): React.ReactElement {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentProject = useBomStore((s) => s.getCurrentProject());
  const currentSatellite = useBomStore((s) => s.getCurrentSatellite());
  const currentSatellitePartNo = useBomStore((s) => s.currentSatellitePartNo);
  const loading = useBomStore((s) => s.loading);
  const selectedNodePartNo = useUiStore((s) => s.selectedNodePartNo);

  const [searchQuery, setSearchQuery] = useState('');
  const [excelResult, setExcelResult] = useState<ExcelImportResult | null>(null);
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 默认选中第一个单机
  const effectiveSelected = useMemo(() => {
    if (selectedNodePartNo) return selectedNodePartNo;
    if (currentSatellite && currentSatellite.subsystems.length > 0) {
      const firstSub = currentSatellite.subsystems[0];
      if (firstSub.units.length > 0) {
        return firstSub.units[0].partNo;
      }
      return firstSub.partNo;
    }
    return currentSatellite?.partNo ?? null;
  }, [selectedNodePartNo, currentSatellite]);

  // Excel 工具栏处理
  const handleImportClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;

    try {
      const result = await parseExcel(file, {
        projectId: currentProject.id,
        strategy: 'append',
        skipInvalidRows: true,
      });
      setExcelResult(result);
      setExcelDialogOpen(true);
    } catch (err) {
      console.error('Excel 导入失败', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExcelDialogClose = (): void => {
    setExcelDialogOpen(false);
    // 导入完成后，如果当前卫星存在，重新初始化阶段数据
    if (currentSatellitePartNo) {
      // 对于新增卫星，需要单独初始化（由 ExcelImportDialog 内部处理）
    }
  };

  if (loading || !currentProject) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentSatellite) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Excel 工具栏 */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="下载空白模板">
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => downloadTemplate()}
            >
              下载模板
            </Button>
          </Tooltip>
          <Tooltip title="从 Excel 导入卫星 BOM">
            <Button
              size="small"
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleImportClick}
            >
              导入 Excel
            </Button>
          </Tooltip>
          <Tooltip title="导出当前项目为 Excel">
            <Button
              size="small"
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => downloadProjectExcel(currentProject)}
            >
              导出当前项目
            </Button>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Box>
        <Card>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              当前项目暂无卫星数据
            </Typography>
            <Typography variant="caption" color="text.secondary">
              请通过「导入 Excel」或新建项目时导入卫星 BOM
            </Typography>
          </Box>
        </Card>
        <ExcelImportDialog
          open={excelDialogOpen}
          onClose={handleExcelDialogClose}
          result={excelResult}
          options={{
            strategy: 'append',
            projectId: currentProject.id,
            skipInvalidRows: true,
          }}
        />
      </Box>
    );
  }

  const satellite = currentSatellite;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Excel 工具栏 */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Tooltip title="下载空白模板">
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => downloadTemplate()}
          >
            下载模板
          </Button>
        </Tooltip>
        <Tooltip title="从 Excel 导入卫星 BOM">
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleImportClick}
          >
            导入 Excel
          </Button>
        </Tooltip>
        <Tooltip title="导出当前项目为 Excel">
          <Button
            size="small"
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => downloadProjectExcel(currentProject)}
          >
            导出当前项目
          </Button>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </Box>

      {/* 树 + 详情 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
          minHeight: 'calc(100vh - 240px)',
        }}
      >
        {/* 左侧树 */}
        <Card
          sx={{
            flex: isMobile ? 'none' : '0 0 360px',
            width: isMobile ? '100%' : 360,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="搜索料号 / 品名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ overflow: 'auto', p: 1, flex: 1, maxHeight: isMobile ? 400 : 'none' }}>
            {/* 整星节点 */}
            <TreeNode
              node={satellite}
              level={0}
              nodeType="satellite"
              hasChildren
            >
              {/* 分系统节点 */}
              {satellite.subsystems
                .filter(
                  (sub) =>
                    !searchQuery ||
                    matchesSearch(sub.partNo, sub.name, searchQuery) ||
                    sub.units.some(
                      (u) =>
                        matchesSearch(u.partNo, u.name, searchQuery),
                    ),
                )
                .map((sub: Subsystem) => (
                  <TreeNode
                    key={sub.partNo}
                    node={sub}
                    level={1}
                    nodeType="subsystem"
                    hasChildren={sub.units.length > 0}
                  >
                    {/* 单机/零部件节点 */}
                    {sub.units
                      .filter(
                        (u) =>
                          !searchQuery ||
                          matchesSearch(u.partNo, u.name, searchQuery),
                      )
                      .map((unit: Unit) => (
                        <TreeNode
                          key={unit.partNo}
                          node={unit}
                          level={2}
                          nodeType={unit.type === 'equipment' ? 'unit' : 'part'}
                          hasChildren={false}
                        />
                      ))}
                  </TreeNode>
                ))}
            </TreeNode>
          </Box>
        </Card>

        {/* 右侧详情 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <NodeDetail partNo={effectiveSelected} />
        </Box>
      </Box>

      <ExcelImportDialog
        open={excelDialogOpen}
        onClose={handleExcelDialogClose}
        result={excelResult}
        options={{
          strategy: 'append',
          projectId: currentProject.id,
          skipInvalidRows: true,
        }}
      />
    </Box>
  );
}
