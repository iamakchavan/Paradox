"use client";

import { useMemo } from "react";
import {
  DotMatrixBase,
  type DotAnimationResolver,
  type DotMatrixCommonProps,
} from "@/components/ui/dotmatrix-core";
import {
  useCyclePhase,
  useDotMatrixPhases,
  usePrefersReducedMotion,
} from "@/components/ui/dotmatrix-hooks";

export type DotmSquare15Props = DotMatrixCommonProps;

const BASE_OPACITY = 0.08;
const STRAND_OPACITY = 1;
const BRIDGE_OPACITY = 0.58;
const NEAR_STRAND_OPACITY = 0.24;
const STRAND_LOOPS = 2;

export function DotmSquare15({
  speed = 1,
  pattern = "full",
  animated = true,
  hoverAnimated = false,
  ...rest
}: DotmSquare15Props) {
  const reducedMotion = usePrefersReducedMotion();
  const { phase: matrixPhase, onMouseEnter, onMouseLeave } = useDotMatrixPhases({
    animated: Boolean(animated && !reducedMotion),
    hoverAnimated: Boolean(hoverAnimated && !reducedMotion),
    speed,
  });
  const animationPhase = useCyclePhase({
    active: !reducedMotion && matrixPhase !== "idle",
    cycleMsBase: 1600,
    speed,
  });

  const resolver = useMemo<DotAnimationResolver>(() => {
    return ({ isActive, row, col, phase }) => {
      if (!isActive) {
        return { className: "dmx-inactive" };
      }

      const cyclePosition = reducedMotion || phase === "idle" ? 0 : animationPhase;
      const rowPhase = cyclePosition * STRAND_LOOPS * 2 * Math.PI + row * 1.24;
      const leftStrand = Math.round(1 + Math.sin(rowPhase));
      const rightStrand = 4 - leftStrand;
      const bridgeVisible = Math.cos(rowPhase * 2) > 0.82;

      if (col === leftStrand || col === rightStrand) {
        return { style: { opacity: STRAND_OPACITY } };
      }
      if (bridgeVisible && col > leftStrand && col < rightStrand) {
        return { style: { opacity: BRIDGE_OPACITY } };
      }
      if (
        Math.abs(col - leftStrand) === 1
        || Math.abs(col - rightStrand) === 1
      ) {
        return { style: { opacity: NEAR_STRAND_OPACITY } };
      }
      return { style: { opacity: BASE_OPACITY } };
    };
  }, [animationPhase, reducedMotion]);

  return (
    <DotMatrixBase
      {...rest}
      speed={speed}
      pattern={pattern}
      animated={animated}
      phase={matrixPhase}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      reducedMotion={reducedMotion}
      animationResolver={resolver}
    />
  );
}
