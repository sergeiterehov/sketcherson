import {
  getPoint,
  makeCircle3,
  makeCoincident,
  makeDistance,
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

const c1 = makeCircle3(sampleSketch, -200, -200, 10);
makeRadius(sampleSketch, c1[0], 40);
makeCoincident(sampleSketch, c1[1], getPoint(sampleSketch, rect[1].b_id));

const p1 = makePoint(sampleSketch, 100, -100);
makePointOnCircle(sampleSketch, p1, c1[0]);

const s = makeSegment4(sampleSketch, 0, 100, 100, 100);
makeDistance(sampleSketch, s[1], s[2], 150);
makeCoincident(sampleSketch, p1, s[1]);
makePointOnLine(sampleSketch, getPoint(sampleSketch, rect[0].b_id), s[0]);

const c2 = makeCircle3(sampleSketch, -200, -200, 10);
makeCoincident(sampleSketch, c2[1], s[2]); // Без доп ограничения попадает в локальный минимум
