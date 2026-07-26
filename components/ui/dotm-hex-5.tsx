"use client";

import { memo } from "react";
import {
  DotmHexBase,
  getHexPoint,
  type HexOpacityResolver,
} from "@/components/ui/dotm-hex-core";
import type { DotMatrixCommonProps } from "@/components/ui/dotmatrix-core";

export type DotmHex5Props = DotMatrixCommonProps;

const BASE_OPACITY = 0.08;
const HIGH_OPACITY = 0.96;

function wavePeak(value: number): number {
  const wrapped = ((value % 1) + 1) % 1;
  return Math.max(0, 1 - Math.abs(wrapped * 2 - 1) / 0.55);
}

const resolveOpacity: HexOpacityResolver = (row, col, phase) => {
  const { angle, radius } = getHexPoint(row, col);
  const spiral = phase + radius * 0.18 + angle / (Math.PI * 2);
  const counterSpiral = phase * 0.72 - radius * 0.16 - angle / (Math.PI * 2);
  const firstWave = wavePeak(spiral);
  const secondWave = wavePeak(counterSpiral) * 0.55;
  const core = radius < 0.1 ? 0.54 + Math.sin(phase * Math.PI * 4) * 0.26 : 0;
  return Math.min(HIGH_OPACITY, BASE_OPACITY + firstWave * 0.7 + secondWave * 0.42 + core);
};

export const DotmHex5 = memo(function DotmHex5(props: DotmHex5Props) {
  return (
    <DotmHexBase
      {...props}
      defaultSpeed={1.75}
      cycleMsBase={1450}
      defaultPhase={0.18}
      resolveOpacity={resolveOpacity}
    />
  );
});
