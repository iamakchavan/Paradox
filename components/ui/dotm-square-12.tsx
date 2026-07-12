"use client";

import type { CSSProperties } from "react";
import {
  DotMatrixBase,
  type DotAnimationResolver,
  type DotMatrixCommonProps,
} from "@/components/ui/dotmatrix-core";
import { useDotMatrixPhases, usePrefersReducedMotion } from "@/components/ui/dotmatrix-hooks";

export type DotmSquare12Props = DotMatrixCommonProps;

const ORIGIN_ROW = 1;
const ORIGIN_COL = 1;
const MAX_MANHATTAN_DISTANCE = 6;

const animationResolver: DotAnimationResolver = ({
  isActive,
  row,
  col,
  reducedMotion,
  phase,
}) => {
  if (!isActive) {
    return { className: "dmx-inactive" };
  }

  const ring = Math.max(
    0,
    Math.min(
      MAX_MANHATTAN_DISTANCE,
      Math.abs(row - ORIGIN_ROW) + Math.abs(col - ORIGIN_COL),
    ),
  );
  const style = {
    "--dmx-center-ripple-ring": ring,
  } as CSSProperties;

  if (reducedMotion || phase === "idle") {
    return {
      style: {
        ...style,
        opacity: 0.2 + (1 - ring / MAX_MANHATTAN_DISTANCE) * 0.75,
      },
    };
  }

  return { className: "dmx-center-origin-ripple", style };
};

export function DotmSquare12({
  speed = 1,
  pattern = "full",
  animated = true,
  hoverAnimated = false,
  ...rest
}: DotmSquare12Props) {
  const reducedMotion = usePrefersReducedMotion();
  const { phase: matrixPhase, onMouseEnter, onMouseLeave } = useDotMatrixPhases({
    animated: Boolean(animated && !reducedMotion),
    hoverAnimated: Boolean(hoverAnimated && !reducedMotion),
    speed,
  });

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
      animationResolver={animationResolver}
    />
  );
}
