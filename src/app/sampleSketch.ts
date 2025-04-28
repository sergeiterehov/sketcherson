import {
  getPoint,
  makeCircle3,
  makeCoincident,
  makeFix,
  makePoint,
  makePointOnCircle,
  makePointOnLine,
  makeRadius,
  makeRect4,
  makeSegment4,
  makeSketch,
} from "./utils";

export const sampleSketch = makeSketch();

const zeroPoint = makePoint(sampleSketch, 0, 0);
makeFix(sampleSketch, zeroPoint);

const rect = makeRect4(sampleSketch, 10, 10, 80, 120);

makeCoincident(sampleSketch, zeroPoint, getPoint(sampleSketch, rect[0].a_id));

const circle = makeCircle3(sampleSketch, -200, -200, 10);
makeRadius(sampleSketch, circle[0], 40);
makeCoincident(sampleSketch, circle[1], getPoint(sampleSketch, rect[1].b_id));

const p1 = makePoint(sampleSketch, 100, -100);
makePointOnCircle(sampleSketch, p1, circle[0]);

const p2 = makePoint(sampleSketch, -50, -50);
const s = makeSegment4(sampleSketch, 0, 100, 100, 100);
makePointOnLine(sampleSketch, p2, s[0]);
