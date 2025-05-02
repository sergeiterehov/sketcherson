import { ToolBar, ToolBarButton } from "@/components/toolbar";
import useEditorStore from "./editorStore";
import CoincidentIcon from "@/icons/CoincidentIcon";
import PointOnLineIcon from "@/icons/PointOnLineIcon";
import PointOnCircleIcon from "@/icons/PointOnLineCircle";
import TangentIcon from "@/icons/TangentIcon";
import PerpendicularIcon from "@/icons/PerpendicularIcon";
import DistanceIcon from "@/icons/DistanceIcon";
import ParallelIcon from "@/icons/ParallelIcon";
import RadiusIcon from "@/icons/RadiusIcon";
import FixPointIcon from "@/icons/FixPointIcon";
import VerticalIcon from "@/icons/VerticalIcon";
import HorizontalIcon from "@/icons/HorizontalIcon";

export default function SketchToolBar() {
  const allowCoincident = useEditorStore((s) => s.allowCoincident);
  const allowPointOnLine = useEditorStore((s) => s.allowPointOnLine);
  const allowPointOnCircle = useEditorStore((s) => s.allowPointOnCircle);
  const allowRadius = useEditorStore((s) => s.allowRadius);

  const createCoincident = useEditorStore((s) => s.createCoincident);
  const createPointOnLine = useEditorStore((s) => s.createPointOnLine);
  const createPointOnCircle = useEditorStore((s) => s.createPointOnCircle);
  const createRadius = useEditorStore((s) => s.createRadius);

  const handleCoincidentClick = () => {
    createCoincident();
  };

  const handlePointOnLineClick = () => {
    createPointOnLine();
  };

  const handlePointOnCircleClick = () => {
    createPointOnCircle();
  };

  const handleRadiusClick = () => {
    const r = Number(prompt("Radius"));

    if (Number.isNaN(r)) return;

    if (r <= 0) return;

    createRadius(r);
  };

  return (
    <ToolBar>
      <ToolBarButton>
        <FixPointIcon />
      </ToolBarButton>
      <ToolBarButton aria-disabled={!allowCoincident} title="Coincident [X]" onClick={handleCoincidentClick}>
        <CoincidentIcon />
      </ToolBarButton>
      <ToolBarButton aria-disabled={!allowPointOnLine} title="Point on line [L]" onClick={handlePointOnLineClick}>
        <PointOnLineIcon />
      </ToolBarButton>
      <ToolBarButton aria-disabled={!allowPointOnCircle} title="Point on circle [Q]" onClick={handlePointOnCircleClick}>
        <PointOnCircleIcon />
      </ToolBarButton>
      <ToolBarButton>
        <DistanceIcon />
      </ToolBarButton>
      <ToolBarButton>
        <PerpendicularIcon />
      </ToolBarButton>
      <ToolBarButton>
        <ParallelIcon />
      </ToolBarButton>
      <ToolBarButton>
        <VerticalIcon />
      </ToolBarButton>
      <ToolBarButton>
        <HorizontalIcon />
      </ToolBarButton>
      <ToolBarButton>
        <TangentIcon />
      </ToolBarButton>
      <ToolBarButton aria-disabled={!allowRadius} title="Radius [R]" onClick={handleRadiusClick}>
        <RadiusIcon />
      </ToolBarButton>
    </ToolBar>
  );
}
