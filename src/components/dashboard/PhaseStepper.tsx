// ============================================================
// src/components/dashboard/PhaseStepper.tsx — 四阶段步骤条
// 设计 → 投产 → 联试 → AIT
// ============================================================

import {
  Stepper,
  Step,
  StepLabel,
  StepButton,
  Box,
  useTheme,
} from '@mui/material';
import type { PhaseType } from '@/types';
import { PHASE_LABELS, PHASE_ORDER } from '@/types';

interface PhaseStepperProps {
  /** 当前阶段 */
  currentPhase: PhaseType;
  /** 点击步骤回调 */
  onNavigate?: () => void;
}

export default function PhaseStepper({
  currentPhase,
  onNavigate,
}: PhaseStepperProps): React.ReactElement {
  const theme = useTheme();
  const activeStep = PHASE_ORDER.indexOf(currentPhase);

  const handleStep = (phase: PhaseType): void => {
    // 通过 DOM event 触发 store 更新
    const event = new CustomEvent('phase-stepper-click', {
      detail: { phase },
    });
    window.dispatchEvent(event);
    onNavigate?.();
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          '& .MuiStepLabel-label': {
            fontSize: '0.875rem',
          },
        }}
      >
        {PHASE_ORDER.map((phase) => (
          <Step key={phase}>
            <StepButton onClick={() => handleStep(phase)}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    color:
                      PHASE_ORDER.indexOf(phase) <= activeStep
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                  },
                }}
              >
                {PHASE_LABELS[phase]}
              </StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
