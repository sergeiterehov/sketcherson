import { getPoint, makeFix, makeRect4, makeSketch } from "./utils";

export const sampleSketch = makeSketch();

const rect = makeRect4(sampleSketch, 10, 10, 80, 120);
const rectPoint = getPoint(sampleSketch, rect[0].a_id);

rectPoint.x = 0;
rectPoint.y = 0;

makeFix(sampleSketch, rectPoint);
