"use client";

import { memo } from "react";
import {
  DotmHexBase,
  getHexPoint,
  type HexOpacityResolver,
} from "@/components/ui/dotm-hex-core";
import type { DotMatrixCommonProps } from "@/components/ui/dotmatrix-core";

export type DotmHex3Props = DotMatrixCommonProps;

const BASE_OPACITY = 0.08;
const HIGH_OPACITY = 0.96;
const BAND_WIDTH = 0.55;

function triangularWave(value: number): number {
  const wrapped = ((value % 1) + 1) % 1;
  return 1 - Math.abs(wrapped * 2 - 1);
}

function bandGlow(distance: number): number {
  return Math.max(0, 1 - Math.abs(distance) / BAND_WIDTH);
}

const resolveOpacity: HexOpacityResolver = (row, col, phase) => {
  const { x, y, radius } = getHexPoint(row, col);
  const sweep = triangularWave(phase) * 3.9 - 1.95;
  const firstGate = bandGlow(x * 0.86 + y * 0.5 - sweep);
  const secondGate = bandGlow(x * -0.86 + y * 0.5 + sweep);
  const centerFlash = Math.max(0, 1 - Math.abs(sweep) / 0.68)
    * Math.max(0, 1 - radius / 1.9);
  const wake = 0.16 * Math.max(0, 1 - Math.abs(y - sweep * 0.22) / 1.2);
  return Math.min(
    HIGH_OPACITY,
    BASE_OPACITY + firstGate * 0.7 + secondGate * 0.7 + centerFlash * 0.42 + wake,
  );
};

export const DotmHex3 = memo(function DotmHex3(props: DotmHex3Props) {
  return (
    <DotmHexBase
      {...props}
      defaultSpeed={1.45}
      cycleMsBase={1850}
      defaultPhase={0.12}
      resolveOpacity={resolveOpacity}
    />
  );
});
