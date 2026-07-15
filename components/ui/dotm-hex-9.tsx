"use client";

import { memo } from "react";
import {
  DotmHexBase,
  getHexPoint,
  type HexOpacityResolver,
} from "@/components/ui/dotm-hex-core";
import type { DotMatrixCommonProps } from "@/components/ui/dotmatrix-core";

export type DotmHex9Props = DotMatrixCommonProps;

const BASE_OPACITY = 0.15;
const HIGH_OPACITY = 0.98;
const PETAL_WIDTH = 0.42;

function angularDistance(first: number, second: number): number {
  return Math.abs(Math.atan2(Math.sin(first - second), Math.cos(first - second)));
}

const resolveOpacity: HexOpacityResolver = (row, col, phase) => {
  const { angle, radius } = getHexPoint(row, col);
  if (radius < 0.1) {
    return 0.42 + Math.sin(phase * Math.PI * 2) * 0.2;
  }

  const rotation = phase * Math.PI * 2;
  const firstPetal = Math.max(0, 1 - angularDistance(angle, rotation) / PETAL_WIDTH);
  const secondPetal = Math.max(0, 1 - angularDistance(angle, rotation + Math.PI) / PETAL_WIDTH);
  const firstCross = Math.max(
    0,
    1 - angularDistance(angle, rotation + Math.PI / 2) / 0.52,
  ) * 0.46;
  const secondCross = Math.max(
    0,
    1 - angularDistance(angle, rotation + Math.PI * 1.5) / 0.52,
  ) * 0.46;
  const ring = (0.5 + 0.5 * Math.sin(phase * Math.PI * 2 - radius * 2.7))
    * (radius > 1.3 ? 0.22 : 0.1);
  const petalPeak = Math.max(firstPetal, secondPetal);
  if (petalPeak > 0.92) return HIGH_OPACITY;
  return Math.min(HIGH_OPACITY, BASE_OPACITY + petalPeak * 0.82 + firstCross + secondCross + ring);
};

export const DotmHex9 = memo(function DotmHex9(props: DotmHex9Props) {
  return (
    <DotmHexBase
      {...props}
      defaultSpeed={1.8}
      cycleMsBase={1650}
      defaultPhase={0.1}
      resolveOpacity={resolveOpacity}
    />
  );
});
