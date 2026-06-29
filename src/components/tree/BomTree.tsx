// ============================================================
// src/components/tree/BomTree.tsx — 树页面容器
// 左树 + 右详情，响应式堆叠，顶部搜索框
// ============================================================

import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  TextField,
  InputAdornment,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import TreeNode from './TreeNode';
import NodeDetail from './NodeDetail';
import { useBomStore } from '@/store/useBomStore';
import { useUiStore } from '@/store/useUiStore';
import type { Subsystem, Unit } from '@/types';

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
  const project = useBomStore((s) => s.project);
  const loading = useBomStore((s) => s.loading);
  const selectedNodePartNo = useUiStore((s) => s.selectedNodePartNo);

  const [searchQuery, setSearchQuery] = useState('');

  // 默认选中第一个单机
  const effectiveSelected = useMemo(() => {
    if (selectedNodePartNo) return selectedNodePartNo;
    if (project && project.satellite.subsystems.length > 0) {
      const firstSub = project.satellite.subsystems[0];
      if (firstSub.units.length > 0) {
        return firstSub.units[0].partNo;
      }
      return firstSub.partNo;
    }
    return project?.satellite.partNo ?? null;
  }, [selectedNodePartNo, project]);

  if (loading || !project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const satellite = project.satellite;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2,
        minHeight: 'calc(100vh - 180px)',
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
  );
}
