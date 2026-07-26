"use client";

import { useMemo, type CSSProperties } from "react";
import {
  cx,
  dmxBloomHaloSpreadClass,
  dmxBloomRootActive,
  dmxDotBloomParts,
  getPatternIndexes,
  remapOpacityToTriplet,
  resolveDmxColorTokens,
  styleOpacity,
  stylePx,
  type DotMatrixCommonProps,
} from "@/components/ui/dotmatrix-core";
import {
  useCyclePhase,
  useDotMatrixPhases,
  usePrefersReducedMotion,
} from "@/components/ui/dotmatrix-hooks";

export const HEX_ROW_COUNTS = [3, 4, 5, 4, 3] as const;
export const HEX_ROW_PITCH_RATIO = Math.sqrt(3) / 2;
const WRAPPER_INSET = 2;

export interface HexPoint {
  x: number;
  y: number;
  angle: number;
  radius: number;
}

export type HexOpacityResolver = (row: number, col: number, phase: number) => number;

interface DotmHexBaseProps extends DotMatrixCommonProps {
  cycleMsBase: number;
  defaultPhase: number;
  defaultSpeed: number;
  resolveOpacity: HexOpacityResolver;
}

function clamp01(value: number | undefined): number | undefined {
  if (value == null || !Number.isFinite(value)) return undefined;
  return Math.min(1, Math.max(0, value));
}

function hexPatternIndex(row: number, rowCount: number, col: number): number {
  return row * HEX_ROW_COUNTS[2] + Math.floor((HEX_ROW_COUNTS[2] - rowCount) / 2) + col;
}

export function getHexPoint(row: number, col: number): HexPoint {
  const count = HEX_ROW_COUNTS[row] ?? 1;
  const x = col - (count - 1) / 2;
  const y = (row - 2) * HEX_ROW_PITCH_RATIO;
  return {
    x,
    y,
    angle: Math.atan2(y, x),
    radius: Math.sqrt(x * x + y * y),
  };
}

export function DotmHexBase({
  size = 34,
  dotSize = 5,
  color = "currentColor",
  colorPreset,
  ariaLabel = "Loading",
  className,
  muted = false,
  bloom = false,
  halo = 0,
  dotClassName,
  dotShape = "circle",
  speed,
  animated = true,
  hoverAnimated = false,
  pattern = "full",
  cellPadding,
  boxSize,
  minSize,
  opacityBase,
  opacityMid,
  opacityPeak,
  cycleMsBase,
  defaultPhase,
  defaultSpeed,
  resolveOpacity,
}: DotmHexBaseProps) {
  const resolvedSpeed = speed ?? defaultSpeed;
  const reducedMotion = usePrefersReducedMotion();
  const { phase: matrixPhase, onMouseEnter, onMouseLeave } = useDotMatrixPhases({
    animated: Boolean(animated && !reducedMotion),
    hoverAnimated: Boolean(hoverAnimated && !reducedMotion),
    speed: resolvedSpeed,
  });
  const cyclePhase = useCyclePhase({
    active: !reducedMotion && matrixPhase !== "idle",
    cycleMsBase,
    speed: resolvedSpeed,
  });

  const gap = cellPadding
    ?? Math.max(1, Math.floor((size - dotSize * HEX_ROW_COUNTS[2]) / (HEX_ROW_COUNTS[2] - 1)));
  const rowGap = Math.max(1, (dotSize + gap) * HEX_ROW_PITCH_RATIO - dotSize);
  const matrixWidth = dotSize * HEX_ROW_COUNTS[2] + gap * (HEX_ROW_COUNTS[2] - 1);
  const matrixHeight = dotSize * HEX_ROW_COUNTS.length + rowGap * (HEX_ROW_COUNTS.length - 1);
  const matrixSpan = Math.max(matrixWidth, matrixHeight);
  const outerDim = Math.max(boxSize ?? matrixSpan, minSize ?? 0);
  const useWrapper = boxSize != null || minSize != null;
  const innerDim = Math.max(1, outerDim - WRAPPER_INSET);
  const scale = useWrapper && matrixSpan > 0 ? innerDim / matrixSpan : 1;
  const baseOpacity = clamp01(opacityBase);
  const midOpacity = clamp01(opacityMid);
  const peakOpacity = clamp01(opacityPeak);
  const phase = reducedMotion || matrixPhase === "idle" ? defaultPhase : cyclePhase;
  const activePatternIndexes = useMemo(() => new Set(getPatternIndexes(pattern)), [pattern]);
  const { resolvedColor, dotFill } = resolveDmxColorTokens(color, colorPreset);

  const matrixStyle = {
    width: stylePx(matrixWidth),
    height: stylePx(matrixHeight),
    ["--dmx-dot-fill" as const]: dotFill,
    ["--dmx-dot-size" as const]: `${dotSize}px`,
    ["--dmx-halo-level" as const]: halo,
    color: resolvedColor,
    ...(baseOpacity !== undefined && { ["--dmx-opacity-base" as const]: baseOpacity }),
    ...(midOpacity !== undefined && { ["--dmx-opacity-mid" as const]: midOpacity }),
    ...(peakOpacity !== undefined && { ["--dmx-opacity-peak" as const]: peakOpacity }),
    ...(useWrapper
      ? { transform: `scale(${scale})`, transformOrigin: "center center" as const }
      : { minWidth: minSize, minHeight: minSize }),
  } as unknown as CSSProperties;

  const matrix = (
    <div
      role={useWrapper ? undefined : "status"}
      aria-live={useWrapper ? undefined : "polite"}
      aria-label={useWrapper ? undefined : ariaLabel}
      className={cx(
        "dmx-root",
        `dmx-dot-shape-${dotShape}`,
        muted && "dmx-muted",
        dmxBloomRootActive(bloom, halo) && "dmx-bloom",
        dmxBloomHaloSpreadClass(halo),
        !useWrapper && className,
      )}
      style={matrixStyle}
      onMouseEnter={useWrapper ? undefined : onMouseEnter}
      onMouseLeave={useWrapper ? undefined : onMouseLeave}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: stylePx(rowGap),
          width: "100%",
          height: "100%",
        }}
      >
        {HEX_ROW_COUNTS.map((count, row) => (
          <div
            key={row}
            style={{ display: "flex", justifyContent: "center", gap: stylePx(gap) }}
          >
            {Array.from({ length: count }, (_, col) => {
              const isActive = activePatternIndexes.has(hexPatternIndex(row, count, col));
              const opacity = isActive ? resolveOpacity(row, col, phase) : 0;
              const dotBloom = dmxDotBloomParts(
                isActive,
                opacity,
                bloom,
                halo,
                baseOpacity,
                midOpacity,
                peakOpacity,
              );

              return (
                <span
                  key={`${row},${col}`}
                  aria-hidden="true"
                  className={cx(
                    "dmx-dot",
                    !isActive && "dmx-inactive",
                    dotBloom.bloomDot && "dmx-bloom-dot",
                    dotClassName,
                  )}
                  style={{
                    width: stylePx(dotSize),
                    height: stylePx(dotSize),
                    opacity: styleOpacity(remapOpacityToTriplet(
                      opacity,
                      baseOpacity,
                      midOpacity,
                      peakOpacity,
                    )),
                    ["--dmx-bloom-level" as const]: dotBloom.level,
                  } as CSSProperties}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  if (!useWrapper) return matrix;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: stylePx(outerDim),
        height: stylePx(outerDim),
        minWidth: minSize == null ? undefined : stylePx(minSize),
        minHeight: minSize == null ? undefined : stylePx(minSize),
        overflow: "hidden",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {matrix}
    </div>
  );
}
