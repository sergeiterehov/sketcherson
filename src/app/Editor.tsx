"use client";
import { useEffect } from "react";
import { useKey, useMeasure } from "react-use";
import { sampleSketch } from "./sampleSketch";
import useEditorStore from "./editorStore";
import SketchToolBar from "./SketchToolBar";
import SketchSvg from "./SketchSvg";
import styled from "@emotion/styled";
import { FloatingToolBarContainer } from "@/components/toolbar";

const EditorContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
});

const SketchContainer = styled.div({
  display: "flex",
  flexGrow: 1,
  overflow: "hidden",
});

function SketchSizeObserver(props: { children(width: number, height: number): React.ReactNode }) {
  const { children } = props;
  const [ref, { width, height }] = useMeasure<HTMLDivElement>();

  return <SketchContainer ref={ref}>{children(width, height)}</SketchContainer>;
}

export default function Editor() {
  const resetGeoSelection = useEditorStore((s) => s.resetGeoSelection);
  const init = useEditorStore((s) => s.init);
  const reset = useEditorStore((s) => s.reset);
  const createCoincident = useEditorStore((s) => s.createCoincident);
  const createPointOnLine = useEditorStore((s) => s.createPointOnLine);
  const createPointOnCircle = useEditorStore((s) => s.createPointOnCircle);

  useKey("Escape", resetGeoSelection);
  useKey("x", createCoincident);
  useKey("l", createPointOnLine);
  useKey("q", createPointOnCircle);

  useEffect(() => {
    init(JSON.parse(JSON.stringify(sampleSketch)));

    return () => reset();
  }, [init, reset]);

  return (
    <EditorContainer>
      <SketchSizeObserver>{(width, height) => <SketchSvg width={width} height={height} />}</SketchSizeObserver>
      <FloatingToolBarContainer>
        <SketchToolBar />
      </FloatingToolBarContainer>
    </EditorContainer>
  );
}
