import {
  makeCircle3,
  makeDistance,
  makeFix,
  makePoint,
  makeRadius,
  makeRect4,
  makeSegment4,
  makeSketch,
} from "@/core/utils";

export const sampleSketch = makeSketch();

const zeroPoint = makePoint(sampleSketch, 0, 0);
makeFix(sampleSketch, zeroPoint);

makeRect4(sampleSketch, 10, 10, 80, 120);
const c1 = makeCircle3(sampleSketch, -200, 200, 20);
makeRadius(sampleSketch, c1[0], 40);
makePoint(sampleSketch, 100, -100);
const s1 = makeSegment4(sampleSketch, 10, 200, 100, 250);
makeSegment4(sampleSketch, 10, -200, 100, -290);
makeSegment4(sampleSketch, 0, -100, 100, -150);
makeDistance(sampleSketch, s1[1], s1[2], 150);
makeCircle3(sampleSketch, -200, -200, 10);
