// ============================================================
// src/components/tree/TreeNode.tsx — 树节点递归渲染
// 图标/料号/品名/齐套色点，展开折叠
// ============================================================

import { Box, Typography, IconButton, useTheme } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import type { Satellite, Subsystem, Unit } from '@/types';
import { useUiStore } from '@/store/useUiStore';

interface TreeNodeProps {
  /** 节点数据 */
  node: Satellite | Subsystem | Unit;
  /** 节点层级 */
  level: number;
  /** 节点类型标识 */
  nodeType: 'satellite' | 'subsystem' | 'unit' | 'part';
  /** 子节点列表（单机无子节点） */
  children?: React.ReactNode;
  /** 是否有子节点 */
  hasChildren: boolean;
}

/** 层级图标 */
function LevelIcon({ type }: { type: string }): React.ReactElement {
  const iconMap: Record<string, string> = {
    satellite: '🛰️',
    subsystem: '📦',
    unit: '🔧',
    part: '⚡',
  };
  return <span style={{ fontSize: '1rem' }}>{iconMap[type] ?? '•'}</span>;
}

export default function TreeNode({
  node,
  level,
  nodeType,
  children,
  hasChildren,
}: TreeNodeProps): React.ReactElement {
  const theme = useTheme();
  const expandedNodes = useUiStore((s) => s.expandedNodes);
  const toggleNode = useUiStore((s) => s.toggleNode);
  const selectedNodePartNo = useUiStore((s) => s.selectedNodePartNo);
  const selectNode = useUiStore((s) => s.selectNode);

  const isExpanded = expandedNodes[node.partNo] ?? false;
  const isSelected = selectedNodePartNo === node.partNo;

  // 获取齐套色点
  let kitColor: string | null = null;
  if (nodeType === 'unit' || nodeType === 'part') {
    const unit = node as Unit;
    kitColor = unit.isKitComplete
      ? theme.palette.success.main
      : theme.palette.error.main;
  }

  const handleToggle = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (hasChildren) {
      toggleNode(node.partNo);
    }
    selectNode(node.partNo);
  };

  return (
    <Box>
      <Box
        onClick={handleToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 0.75,
          px: 1,
          ml: level * 2,
          borderRadius: 1.5,
          cursor: 'pointer',
          bgcolor: isSelected ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
          transition: 'background-color 0.15s ease',
        }}
      >
        {/* 展开/折叠箭头 */}
        {hasChildren ? (
          <IconButton size="small" sx={{ p: 0.5 }}>
            {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>
        ) : (
          <Box sx={{ width: 28 }} />
        )}

        {/* 图标 */}
        <LevelIcon type={nodeType} />

        {/* 料号 + 品名 */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: isSelected ? 600 : 400,
            fontSize: '0.85rem',
          }}
        >
          {node.partNo}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: '0.85rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 200,
          }}
        >
          {node.name}
        </Typography>

        {/* 齐套色点 */}
        {kitColor && (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: kitColor,
              ml: 'auto',
              flexShrink: 0,
            }}
          />
        )}
      </Box>

      {/* 子节点 */}
      {isExpanded && hasChildren && <Box>{children}</Box>}

      {/* 元器件占位（单机/零部件下） */}
      {isExpanded &&
        !hasChildren &&
        (nodeType === 'unit' || nodeType === 'part') && (
          <Box
            sx={{
              ml: (level + 1) * 2 + 4,
              py: 0.5,
              px: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box sx={{ width: 28 }} />
            <span style={{ fontSize: '0.8rem' }}>🔩</span>
            <Typography variant="caption" color="text.secondary">
              暂无元器件数据
            </Typography>
          </Box>
        )}
    </Box>
  );
}
