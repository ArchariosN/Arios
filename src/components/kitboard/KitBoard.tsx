// ============================================================
// src/components/kitboard/KitBoard.tsx — 齐套看板页
// 筛选栏 + 分系统卡片网格 + 下钻明细
// ============================================================

import { useState } from 'react';
import {
  Box,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  InputAdornment,
  Collapse,
  Card,
  CardContent,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import SubsystemCard from './SubsystemCard';
import KitDetailTable from './KitDetailTable';
import { useBomStore } from '@/store/useBomStore';
import { useUiStore } from '@/store/useUiStore';
import type { Subsystem, KitFilter } from '@/types';

const FILTER_OPTIONS: { value: KitFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'electrical', label: '电性件' },
  { value: 'qualification', label: '鉴定件' },
  { value: 'flight', label: '正样件' },
];

export default function KitBoard(): React.ReactElement {
  const project = useBomStore((s) => s.project);
  const kitFilter = useUiStore((s) => s.kitFilter);
  const setKitFilter = useUiStore((s) => s.setKitFilter);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubsystem, setExpandedSubsystem] = useState<string | null>(
    null,
  );

  if (!project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography color="text.secondary">暂无数据</Typography>
      </Box>
    );
  }

  const filteredSubsystems = project.satellite.subsystems.filter(
    (sub) =>
      !searchQuery ||
      sub.partNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCardClick = (partNo: string): void => {
    setExpandedSubsystem(expandedSubsystem === partNo ? null : partNo);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 筛选栏 */}
      <Card>
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { sm: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <ToggleButtonGroup
              value={kitFilter}
              exclusive
              onChange={(_, val) => val && setKitFilter(val)}
              size="small"
            >
              {FILTER_OPTIONS.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value}>
                  {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <TextField
              size="small"
              placeholder="搜索分系统..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: { xs: '100%', sm: 240 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* 分系统卡片网格 */}
      <Grid container spacing={2}>
        {filteredSubsystems.map((sub: Subsystem) => {
          const isExpanded = expandedSubsystem === sub.partNo;
          return (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={sub.partNo}
            >
              <SubsystemCard
                subsystem={sub}
                filter={kitFilter}
                onClick={() => handleCardClick(sub.partNo)}
              />
              {/* 下钻明细 */}
              <Collapse in={isExpanded} timeout="auto">
                <Card sx={{ mt: 1 }}>
                  <CardContent sx={{ p: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1,
                        py: 0.5,
                      }}
                    >
                      <IconButton size="small" sx={{ p: 0.5 }}>
                        {isExpanded ? (
                          <ExpandMoreIcon />
                        ) : (
                          <ChevronRightIcon />
                        )}
                      </IconButton>
                      <Typography variant="subtitle2">
                        {sub.name} — 单机明细 ({sub.units.length})
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <KitDetailTable subsystem={sub} filter={kitFilter} />
                    </Box>
                  </CardContent>
                </Card>
              </Collapse>
            </Grid>
          );
        })}
      </Grid>

      {filteredSubsystems.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            未找到匹配的分系统
          </Typography>
        </Box>
      )}
    </Box>
  );
}
