import { use, useEffect, useRef } from "react";
import useEditorStore from "../editorStore";
import ViewportContext from "./ViewportContext";
import ConstraintsLayer from "./ConstraintsLayer";
import useTheme from "../_utils/useTheme";
import AxisLayer from "./AxisLayer";
import GeometryLayer from "./GeometryLayer";
import CreatingLayer from "./CreatingLayer";

export default function Sketch() {
  const theme = useTheme();

  const svgRef = useRef<SVGSVGElement>(null);

  const { width, height } = use(ViewportContext);
  const scale = useEditorStore((s) => s.scale);
  const translate = useEditorStore((s) => s.translate);
  const pointer = useEditorStore((s) => s.pointer);

  const stat = useEditorStore((s) => s.solvingStats);
  const paramsOfSelectedGeo = useEditorStore((s) => s.paramsOfSelectedGeo);
  const selectedGeoIds = useEditorStore((s) => s.selectedGeoIds);
  const creating = useEditorStore((s) => s.creating);
  const create = useEditorStore((s) => s.create);

  const handleClickCapture = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!Object.keys(creating).length) return;

    e.stopPropagation();

    create();
  };

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) return;

    const controller = new AbortController();

    svg.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const { setScale, moveTranslate, scale } = useEditorStore.getState();

        // Проверяем, что это жест масштабирования (обычно с нажатым Ctrl или на трекпаде Mac)
        if (e.ctrlKey || e.metaKey || (e.deltaMode === 0 && Math.abs(e.deltaY) < 1)) {
          // Коэффициент масштабирования (эмпирически подобранный)
          const intensity = 0.01;
          const delta = -e.deltaY;
          const scaleFactor = 1 + delta * intensity;
          const newScale = scale * scaleFactor;

          const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();

          const sx = e.clientX - box.x - svg.clientWidth / 2;
          const sy = e.clientY - box.y - svg.clientHeight / 2;

          setScale(newScale);
          moveTranslate(sx / newScale - sx / scale, sy / newScale - sy / scale);
        } else {
          // Если не масштабирование, то панорамирование
          moveTranslate(-e.deltaX / scale, -e.deltaY / scale);
        }
      },
      { passive: false, signal: controller.signal }
    );

    svg.addEventListener(
      "mousemove",
      (e: MouseEvent) => {
        const { scale, translate, setPointer } = useEditorStore.getState();

        const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();

        const x = (e.clientX - box.x - svg.clientWidth / 2) / scale - translate.dx;
        const y = (e.clientY - box.y - svg.clientHeight / 2) / scale - translate.dy;

        setPointer(x, y);
      },
      { signal: controller.signal }
    );

    return () => controller.abort();
  }, [!svgRef.current]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ userSelect: "none", background: `linear-gradient(0deg, ${theme.background}, transparent)` }}
      onClickCapture={handleClickCapture}
    >
      <g
        data-layer="space"
        transform={`translate(${width / 2 + translate.dx * scale}, ${height / 2 + translate.dy * scale})`}
      >
        <AxisLayer />
        <ConstraintsLayer />
        <GeometryLayer />
        <CreatingLayer />
      </g>
      {/* INFO */}
      <g data-layer="info">
        <text x={0} y={0} fontFamily="monospace">
          <tspan x="0" dy="1.2em">
            i={stat.i.toLocaleString()}
          </tspan>
          <tspan dx="24px">e={stat.error.toLocaleString()}</tspan>
          <tspan x="0" dy="1.2em">
            Position: ({pointer.x.toLocaleString()}, {pointer.y.toLocaleString()})
          </tspan>
          <tspan x="0" dy="1.2em">
            Selection: {selectedGeoIds.join(", ") || "-"}
          </tspan>
          <tspan x="0" dy="1.2em">
            Params:{" "}
            {[
              paramsOfSelectedGeo.angle !== undefined && `Angle=${paramsOfSelectedGeo.angle.toLocaleString()}°`,
              paramsOfSelectedGeo.length !== undefined && `Length=${paramsOfSelectedGeo.length.toLocaleString()}`,
              paramsOfSelectedGeo.distance !== undefined && `Distance=${paramsOfSelectedGeo.distance.toLocaleString()}`,
              paramsOfSelectedGeo.radius !== undefined &&
                `R=${paramsOfSelectedGeo.radius.toLocaleString()}, ⵁ${(
                  paramsOfSelectedGeo.radius * 2
                ).toLocaleString()}`,
            ]
              .filter(Boolean)
              .join("; ") || "-"}
          </tspan>
        </text>
      </g>
    </svg>
  );
}
