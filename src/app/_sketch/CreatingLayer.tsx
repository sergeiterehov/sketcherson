import useTheme from "../_utils/useTheme";
import useEditorStore from "../editorStore";

function PointCrating() {
  const theme = useTheme();

  const scale = useEditorStore((s) => s.scale);

  const point = useEditorStore((s) => s.creating.point);

  if (!point) return;

  return <circle cx={point.p.x * scale} cy={point.p.y * scale} r={2} fill={theme.creatingColor} />;
}

function SegmentCrating() {
  const theme = useTheme();

  const scale = useEditorStore((s) => s.scale);

  const segment = useEditorStore((s) => s.creating.segment);

  if (!segment) return;

  if (!segment.b) {
    return <circle cx={segment.a.x * scale} cy={segment.a.y * scale} r={2} fill={theme.creatingColor} />;
  }

  return (
    <g>
      <line
        x1={segment.a.x * scale}
        y1={segment.a.y * scale}
        x2={segment.b.x * scale}
        y2={segment.b.y * scale}
        stroke={theme.creatingColor}
        strokeWidth={2}
      />
      <circle cx={segment.a.x * scale} cy={segment.a.y * scale} r={3} fill={theme.creatingColor} />
      <circle cx={segment.b.x * scale} cy={segment.b.y * scale} r={3} fill={theme.creatingColor} />
    </g>
  );
}

function CircleCrating() {
  const theme = useTheme();

  const scale = useEditorStore((s) => s.scale);

  const circle = useEditorStore((s) => s.creating.circle);

  if (!circle) return;

  if (!circle.r) {
    return (
      <circle
        cx={circle.c.x * scale}
        cy={circle.c.y * scale}
        r={4}
        fill="none"
        stroke={theme.creatingColor}
        strokeWidth={2}
      />
    );
  }

  const r = Math.sqrt((circle.r.x - circle.c.x) ** 2 + (circle.r.y - circle.c.y) ** 2);

  return (
    <g>
      <line
        x1={circle.c.x * scale}
        y1={circle.c.y * scale}
        x2={circle.r.x * scale}
        y2={circle.r.y * scale}
        stroke={theme.creatingColor}
        strokeWidth={1}
      />
      <circle cx={circle.c.x * scale} cy={circle.c.y * scale} r={3} fill={theme.creatingColor} />
      <circle
        cx={circle.c.x * scale}
        cy={circle.c.y * scale}
        r={r * scale}
        fill="none"
        stroke={theme.creatingColor}
        strokeWidth={2}
      />
    </g>
  );
}

export default function CreatingLayer() {
  return (
    <g data-layer="creating" style={{ pointerEvents: "none" }}>
      <PointCrating />
      <SegmentCrating />
      <CircleCrating />
    </g>
  );
}
