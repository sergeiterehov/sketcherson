import { getPoint, makeCircle3, makeCoincident, makeFix, makeRadius, makeRect4, makeSketch } from "./utils";

export const sampleSketch = makeSketch();

const rect = makeRect4(sampleSketch, 10, 10, 80, 120);
const rectFixPoint = getPoint(sampleSketch, rect[0].a_id);

rectFixPoint.x[0] = 0;
rectFixPoint.y[0] = 0;

makeFix(sampleSketch, rectFixPoint);

// Not working with -200, -200
const circle = makeCircle3(sampleSketch, -100, -100, 10);

makeRadius(sampleSketch, circle[0], 40);

makeCoincident(sampleSketch, circle[1], getPoint(sampleSketch, rect[1].b_id));
