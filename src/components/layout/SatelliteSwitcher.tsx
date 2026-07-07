// ============================================================
// src/components/layout/SatelliteSwitcher.tsx — 卫星切换器（v2 新增）
// 卫星数 ≤ 5：Select 下拉；> 5：Autocomplete 搜索
// ============================================================

import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  TextField,
  Typography,
} from '@mui/material';
import { SatelliteAlt as SatIcon } from '@mui/icons-material';
import type { Satellite } from '@/types';

interface SatelliteSwitcherProps {
  /** 项目下的卫星列表 */
  satellites: Satellite[];
  /** 当前选中的卫星 partNo */
  currentPartNo: string | null;
  /** 切换回调 */
  onChange: (partNo: string) => void;
}

export default function SatelliteSwitcher({
  satellites,
  currentPartNo,
  onChange,
}: SatelliteSwitcherProps): React.ReactElement {
  const current =
    satellites.find((s) => s.partNo === currentPartNo) ?? satellites[0] ?? null;

  if (satellites.length === 0) {
    return (
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary">
          暂无卫星数据
        </Typography>
      </Box>
    );
  }

  // 超过 5 颗启用 Autocomplete 搜索
  if (satellites.length > 5) {
    return (
      <Box sx={{ px: 2, py: 1 }}>
        <Autocomplete
          size="small"
          options={satellites}
          getOptionLabel={(opt) => `${opt.name} (${opt.partNo})`}
          value={current}
          onChange={(_, val) => {
            if (val) onChange(val.partNo);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="选择卫星"
              variant="outlined"
            />
          )}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="satellite-select-label">
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <SatIcon fontSize="small" />
            选择卫星
          </Box>
        </InputLabel>
        <Select
          labelId="satellite-select-label"
          label="选择卫星"
          value={current?.partNo ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          {satellites.map((sat) => (
            <MenuItem key={sat.partNo} value={sat.partNo}>
              {sat.name} ({sat.partNo})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
