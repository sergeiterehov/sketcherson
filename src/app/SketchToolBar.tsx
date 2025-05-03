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

export default function SketchToolBar() {
  const createCoincident = useEditorStore((s) => s.createCoincident);
  const createRadius = useEditorStore((s) => s.createRadius);
  const createDistance = useEditorStore((s) => s.createDistance);
  const createAlign = useEditorStore((s) => s.createAlign);

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
        <ToolBarButton title="Coincident [X]" onClick={handleCoincidentClick}>
          <AnyCoincidentIcon />
        </ToolBarButton>
        <ToolBarButton title="Distance or length [D]" onClick={handleDistanceClick}>
          <DistanceIcon />
        </ToolBarButton>
        <ToolBarButton title="Radius [R]" onClick={handleRadiusClick}>
          <RadiusIcon />
        </ToolBarButton>
        <ToolBarButton>
          <PerpendicularIcon />
        </ToolBarButton>
        <ToolBarButton>
          <ParallelIcon />
        </ToolBarButton>
        <ToolBarButton title="Align vertical or horizontal [A]" onClick={handleAlignClick}>
          <AlignIcon />
        </ToolBarButton>
        <ToolBarButton>
          <TangentIcon />
        </ToolBarButton>
      </ToolBarGroup>
    </ToolBar>
  );
}
