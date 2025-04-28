import {
  getPoint,
  makeCircle3,
  makeCoincident,
  makeFix,
  makePoint,
  makePointOnCircle,
  makeRadius,
  makeRect4,
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

const point = makePoint(sampleSketch, 100, -100);
makePointOnCircle(sampleSketch, point, circle[0]);
