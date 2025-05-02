"use client";
import { useEffect } from "react";
import { useKey, useMeasure } from "react-use";
import { sampleSketch } from "./sampleSketch";
import useEditorStore from "./editorStore";
import SketchToolBar from "./SketchToolBar";
import Renderer from "./render/Renderer";
import styled from "@emotion/styled";
import { FloatingToolBarContainer } from "@/components/toolbar";
import ViewportContext from "./render/ViewportContext";

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
  const resetGeoSelection = useEditorStore((s) => s.resetGeoSelection);
  const init = useEditorStore((s) => s.init);
  const reset = useEditorStore((s) => s.reset);
  const createCoincident = useEditorStore((s) => s.createCoincident);
  const createRadius = useEditorStore((s) => s.createRadius);
  const createDistance = useEditorStore((s) => s.createDistance);

  useKey("Escape", resetGeoSelection);
  useKey("x", createCoincident);
  useKey("r", createRadius);
  useKey("d", createDistance);

  useEffect(() => {
    init(JSON.parse(JSON.stringify(sampleSketch)));

    return () => reset();
  }, [init, reset]);

  return (
    <EditorContainer>
      <ViewportSizeObserver>
        <Renderer />
      </ViewportSizeObserver>
      <FloatingToolBarContainer>
        <SketchToolBar />
      </FloatingToolBarContainer>
    </EditorContainer>
  );
}
