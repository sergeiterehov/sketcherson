"use client";
import { useEffect } from "react";
import { useKey, useMeasure } from "react-use";
import { sampleSketch } from "./sampleSketch";
import useEditorStore from "./editorStore";
import SketchToolBar from "./SketchToolBar";
import Sketch from "./_sketch/Sketch";
import styled from "@emotion/styled";
import { FloatingToolBarContainer } from "@/components/toolbar";
import ViewportContext from "./_sketch/ViewportContext";
import useShortcuts from "./_utils/useShortcuts";

const EditorContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
});

const SketchViewport = styled.div({
  display: "flex",
  flexGrow: 1,
  overflow: "hidden",
});

function ViewportSizeObserver(props: { children: React.ReactNode }) {
  const { children } = props;
  const [ref, size] = useMeasure<HTMLDivElement>();

  return (
    <SketchViewport ref={ref}>
      <ViewportContext.Provider value={size}>{children}</ViewportContext.Provider>
    </SketchViewport>
  );
}

export default function Editor() {
  const shortcuts = useShortcuts();

  const cancelActiveOperation = useEditorStore((s) => s.cancelActiveOperation);
  const init = useEditorStore((s) => s.init);
  const reset = useEditorStore((s) => s.reset);
  const initPointCreating = useEditorStore((s) => s.initPointCreating);
  const initSegmentCreating = useEditorStore((s) => s.initSegmentCreating);
  const initCircleCreating = useEditorStore((s) => s.initCircleCreating);
  const createCoincident = useEditorStore((s) => s.createCoincident);
  const createRadius = useEditorStore((s) => s.createRadius);
  const createDistance = useEditorStore((s) => s.createDistance);
  const createAlign = useEditorStore((s) => s.createAlign);
  const createPerpendicular = useEditorStore((s) => s.createPerpendicular);
  const createParallel = useEditorStore((s) => s.createParallel);
  const createAngle = useEditorStore((s) => s.createAngle);

  useKey(shortcuts.cancel, cancelActiveOperation);
  useKey(shortcuts.point, initPointCreating);
  useKey(shortcuts.segment, initSegmentCreating);
  useKey(shortcuts.circle, initCircleCreating);
  useKey(shortcuts.coincident, createCoincident);
  useKey(shortcuts.radius, createRadius);
  useKey(shortcuts.distance, createDistance);
  useKey(shortcuts.align, createAlign);
  useKey(shortcuts.perpendicular, createPerpendicular);
  useKey(shortcuts.parallel, createParallel);
  useKey(shortcuts.angle, createAngle);

  useEffect(() => {
    init(JSON.parse(JSON.stringify(sampleSketch)));

    return () => reset();
  }, [init, reset]);

  return (
    <EditorContainer>
      <ViewportSizeObserver>
        <Sketch />
      </ViewportSizeObserver>
      <FloatingToolBarContainer>
        <SketchToolBar />
      </FloatingToolBarContainer>
    </EditorContainer>
  );
}
