import { ToolBar, ToolBarButton, ToolBarGroup, ToolBarSeparator } from "@/components/toolbar";
import useEditorStore from "./editorStore";
import TangentIcon from "@/icons/TangentIcon";
import PerpendicularIcon from "@/icons/PerpendicularIcon";
import DistanceIcon from "@/icons/DistanceIcon";
import ParallelIcon from "@/icons/ParallelIcon";
import RadiusIcon from "@/icons/RadiusIcon";
import FixPointIcon from "@/icons/FixPointIcon";
import AnyCoincidentIcon from "@/icons/AnyCoincidentIcon";
import AlignIcon from "@/icons/AlignIcon";
import PointIcon from "@/icons/PointIcon";
import CircleIcon from "@/icons/CircleIcon";
import SegmentIcon from "@/icons/SegmentIcon";
import ArcIcon from "@/icons/ArcIcon";
import useShortcuts from "./utils/useShortcuts";

export default function SketchToolBar() {
  const shortcuts = useShortcuts();

  const createCoincident = useEditorStore((s) => s.createCoincident);
  const createRadius = useEditorStore((s) => s.createRadius);
  const createDistance = useEditorStore((s) => s.createDistance);
  const createAlign = useEditorStore((s) => s.createAlign);
  const createPerpendicular = useEditorStore((s) => s.createPerpendicular);
  const createParallel = useEditorStore((s) => s.createParallel);

  const handleCoincidentClick = () => {
    createCoincident();
  };

  const handleRadiusClick = () => {
    createRadius();
  };

  const handleDistanceClick = () => {
    createDistance();
  };

  const handleAlignClick = () => {
    createAlign();
  };

  const handlePerpendicularClick = () => {
    createPerpendicular();
  };

  const handleParallelClick = () => {
    createParallel();
  };

  return (
    <ToolBar>
      <ToolBarGroup>
        <ToolBarButton>
          <PointIcon />
        </ToolBarButton>
        <ToolBarButton>
          <SegmentIcon />
        </ToolBarButton>
        <ToolBarButton>
          <CircleIcon />
        </ToolBarButton>
        <ToolBarButton>
          <ArcIcon />
        </ToolBarButton>
      </ToolBarGroup>
      <ToolBarSeparator />
      <ToolBarGroup>
        <ToolBarButton>
          <FixPointIcon />
        </ToolBarButton>
        <ToolBarButton title={`Coincident [${shortcuts.coincident}]`} onClick={handleCoincidentClick}>
          <AnyCoincidentIcon />
        </ToolBarButton>
        <ToolBarButton title={`Distance [${shortcuts.distance}]`} onClick={handleDistanceClick}>
          <DistanceIcon />
        </ToolBarButton>
        <ToolBarButton title={`Radius [${shortcuts.radius}]`} onClick={handleRadiusClick}>
          <RadiusIcon />
        </ToolBarButton>
        <ToolBarButton title={`Perpendicular [${shortcuts.perpendicular}]`} onClick={handlePerpendicularClick}>
          <PerpendicularIcon />
        </ToolBarButton>
        <ToolBarButton title={`Parallel [${shortcuts.parallel}]`} onClick={handleParallelClick}>
          <ParallelIcon />
        </ToolBarButton>
        <ToolBarButton title={`Axis align [${shortcuts.align}]`} onClick={handleAlignClick}>
          <AlignIcon />
        </ToolBarButton>
        <ToolBarButton>
          <TangentIcon />
        </ToolBarButton>
      </ToolBarGroup>
    </ToolBar>
  );
}
