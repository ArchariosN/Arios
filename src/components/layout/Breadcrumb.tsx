// ============================================================
// src/components/layout/Breadcrumb.tsx — 面包屑导航（v2 新增）
// 路径：项目管理 > [项目名] > [卫星名] > [当前页名]
// ============================================================

import {
  Breadcrumbs,
  Link,
  Typography,
  Box,
} from '@mui/material';
import { NavigateNext as NextIcon } from '@mui/icons-material';
import { useUiStore } from '@/store/useUiStore';
import { useBomStore } from '@/store/useBomStore';
import { PAGE_LABELS } from '@/types';

export default function Breadcrumb(): React.ReactElement {
  const currentPage = useUiStore((s) => s.currentPage);
  const goToGlobalPage = useUiStore((s) => s.goToGlobalPage);
  const goToProjectPage = useUiStore((s) => s.goToProjectPage);
  const currentProject = useBomStore((s) => s.getCurrentProject());
  const currentSatellite = useBomStore((s) => s.getCurrentSatellite());

  const crumbs: { label: string; onClick?: () => void }[] = [];

  // 全局页面
  if (currentPage.scope === 'global') {
    if (currentPage.page === 'overview') {
      crumbs.push({ label: '总览' });
    } else if (currentPage.page === 'project-management') {
      crumbs.push({
        label: '总览',
        onClick: () => goToGlobalPage('overview'),
      });
      crumbs.push({ label: '项目管理' });
    }
  } else {
    // 项目内页面
    crumbs.push({
      label: '总览',
      onClick: () => goToGlobalPage('overview'),
    });
    crumbs.push({
      label: '项目管理',
      onClick: () => goToGlobalPage('project-management'),
    });
    if (currentProject) {
      crumbs.push({
        label: currentProject.name,
        onClick: () => goToProjectPage('tree'),
      });
    }
    if (currentSatellite) {
      crumbs.push({
        label: currentSatellite.name,
      });
    }
    crumbs.push({ label: PAGE_LABELS[currentPage.page] ?? currentPage.page });
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Breadcrumbs
        separator={<NextIcon fontSize="small" />}
        aria-label="breadcrumb"
        maxItems={5}
      >
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          if (isLast || !crumb.onClick) {
            return (
              <Typography
                key={idx}
                variant="body2"
                color={isLast ? 'text.primary' : 'text.secondary'}
                sx={{ fontWeight: isLast ? 600 : 400, fontSize: '0.8rem' }}
              >
                {crumb.label}
              </Typography>
            );
          }
          return (
            <Link
              key={idx}
              component="button"
              variant="body2"
              onClick={crumb.onClick}
              sx={{ fontSize: '0.8rem', textDecoration: 'none' }}
            >
              {crumb.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
