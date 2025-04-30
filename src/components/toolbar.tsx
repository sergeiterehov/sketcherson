import styled from "@emotion/styled";

export const ToolBarButton = styled.div({
  pointerEvents: "none",
  userSelect: "none",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: 24,
  height: 24,
  backgroundColor: "#AAA",
  color: "#666",
  overflow: "hidden",

  ":not([aria-disabled='true'])": {
    cursor: "pointer",
    pointerEvents: "inherit",
    color: "#000",

    ":hover": {
      backgroundColor: "#BBB",
    },
  },
});

export const TollBar = styled.div({
  display: "flex",
  gap: 4,
  backgroundColor: "#999",
});
