import { ToolBar, ToolBarButton } from "@/components/toolbar";
import useEditorStore from "./editorStore";
import TangentIcon from "@/icons/TangentIcon";
import PerpendicularIcon from "@/icons/PerpendicularIcon";
import DistanceIcon from "@/icons/DistanceIcon";
import ParallelIcon from "@/icons/ParallelIcon";
import RadiusIcon from "@/icons/RadiusIcon";
import FixPointIcon from "@/icons/FixPointIcon";
import AnyCoincidentIcon from "@/icons/AnyCoincidentIcon";
import AlignIcon from "@/icons/AlignIcon";

export default function SketchToolBar() {
  const createCoincident = useEditorStore((s) => s.createCoincident);
  const createRadius = useEditorStore((s) => s.createRadius);
  const createDistance = useEditorStore((s) => s.createDistance);

  const handleCoincidentClick = () => {
    createCoincident();
  };

  const handleRadiusClick = () => {
    createRadius();
  };

  const handleDistanceClick = () => {
    createDistance();
  };

  return (
    <ToolBar>
      <ToolBarButton>
        <FixPointIcon />
      </ToolBarButton>
      <ToolBarButton title="Coincident [X]" onClick={handleCoincidentClick}>
        <AnyCoincidentIcon />
      </ToolBarButton>
      <ToolBarButton title="Distance or length [D]" onClick={handleDistanceClick}>
        <DistanceIcon />
      </ToolBarButton>
      <ToolBarButton>
        <PerpendicularIcon />
      </ToolBarButton>
      <ToolBarButton>
        <ParallelIcon />
      </ToolBarButton>
      <ToolBarButton title="Align vertical or horizontal [A]">
        <AlignIcon />
      </ToolBarButton>
      <ToolBarButton>
        <TangentIcon />
      </ToolBarButton>
      <ToolBarButton title="Radius [R]" onClick={handleRadiusClick}>
        <RadiusIcon />
      </ToolBarButton>
    </ToolBar>
  );
}
