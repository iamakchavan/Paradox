"use client";

import { memo } from "react";
import {
  DotmHexBase,
  getHexPoint,
  type HexOpacityResolver,
} from "@/components/ui/dotm-hex-core";
import type { DotMatrixCommonProps } from "@/components/ui/dotmatrix-core";

export type DotmHex2Props = DotMatrixCommonProps;

const BASE_OPACITY = 0.08;
const MID_OPACITY = 0.44;
const HIGH_OPACITY = 0.98;
const SPOKE_WIDTH = 0.34;

function angularDistance(first: number, second: number): number {
  return Math.abs(Math.atan2(Math.sin(first - second), Math.cos(first - second)));
}

const resolveOpacity: HexOpacityResolver = (row, col, phase) => {
  const { angle, radius } = getHexPoint(row, col);
  if (radius < 0.01) {
    return MID_OPACITY + Math.sin(phase * Math.PI * 2) * 0.18;
  }

  const rotation = phase * Math.PI * 2;
  const nearestSpoke = Math.min(
    angularDistance(angle, rotation),
    angularDistance(angle, rotation + (Math.PI * 2) / 3),
    angularDistance(angle, rotation + (Math.PI * 4) / 3),
  );
  const spokeGlow = Math.max(0, 1 - nearestSpoke / SPOKE_WIDTH);
  const outerPulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 - radius * 2.2);
  const shellLift = radius > 1.7 ? outerPulse * 0.24 : 0;
  return Math.min(HIGH_OPACITY, BASE_OPACITY + spokeGlow * 0.78 + shellLift);
};

export const DotmHex2 = memo(function DotmHex2(props: DotmHex2Props) {
  return (
    <DotmHexBase
      {...props}
      defaultSpeed={1.7}
      cycleMsBase={1500}
      defaultPhase={0.06}
      resolveOpacity={resolveOpacity}
    />
  );
});
