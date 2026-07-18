"use client";

import { memo, type ComponentType } from "react";
import { DotmHex2 } from "@/components/ui/dotm-hex-2";
import { DotmHex3 } from "@/components/ui/dotm-hex-3";
import { DotmHex5 } from "@/components/ui/dotm-hex-5";
import type { DotMatrixCommonProps } from "@/components/ui/dotmatrix-core";
import type { ResearchEventType } from "@/lib/research/events";

const LOADER_BY_STEP_TYPE: Record<
  ResearchEventType,
  ComponentType<DotMatrixCommonProps>
> = {
  plan: DotmHex2,
  search: DotmHex5,
  map: DotmHex5,
  x: DotmHex5,
  browse: DotmHex3,
  scrape: DotmHex3,
  synthesis: DotmHex3,
};

export const ResearchStepLoader = memo(function ResearchStepLoader({
  stepType,
}: {
  stepType: ResearchEventType;
}) {
  const Loader = LOADER_BY_STEP_TYPE[stepType];

  return (
    <Loader
      size={34}
      dotSize={5}
      boxSize={20}
      minSize={20}
      opacityBase={0.28}
      opacityMid={0.72}
      opacityPeak={1}
      animated
      className="text-foreground"
    />
  );
});
