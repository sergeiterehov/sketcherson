import styled from "@emotion/styled";

export const ToolBarButton = styled.div({
  pointerEvents: "none",
  userSelect: "none",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: 32,
  height: 32,
  overflow: "hidden",
  fontSize: 24,
  padding: 4,
  lineHeight: "1em",
  borderRadius: 6,

  ":not([aria-disabled='true'])": {
    cursor: "pointer",
    pointerEvents: "inherit",

    ":hover": {
      backgroundColor: "#EEE",
    },
  },
});

export const ToolBar = styled.div({
  display: "flex",
  gap: 8,
  alignItems: "center",
  backgroundColor: "#FFF",
  boxShadow: "0 2px 6px #0002, 0 0 1px #0002",
  borderRadius: 12,
  padding: 8,
});

export const FloatingToolBarContainer = styled.div({
  position: "fixed",
  display: "flex",
  justifyContent: "center",
  bottom: 12,
  left: 0,
  right: 0,
});
