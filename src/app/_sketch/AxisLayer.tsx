import useEditorStore from "../editorStore";
import useTheme from "../_utils/useTheme";

const length = 300;

function AxisLayer() {
  const theme = useTheme();

  const scale = useEditorStore((s) => s.scale);

  const scaledHalfLength = (length / 2) * scale;

  return (
    <g data-layer="axis">
      <line
        x1={-scaledHalfLength}
        y1={0}
        x2={scaledHalfLength}
        y2={0}
        strokeWidth={theme.lineWidth}
        stroke={theme.oxColor}
      />
      <line
        x1={0}
        y1={-scaledHalfLength}
        x2={0}
        y2={scaledHalfLength}
        strokeWidth={theme.lineWidth}
        stroke={theme.oyColor}
      />
    </g>
  );
}

export default AxisLayer;
