import { ToolBar, ToolBarButton } from "@/components/toolbar";
import useEditorStore from "./editorStore";
import CoincidentIcon from "@/icons/CoincidentIcon";
import PointOnLineIcon from "@/icons/PointOnLineIcon";
import PointOnCircleIcon from "@/icons/PointOnLineCircle";

export default function SketchToolBar() {
  const allowCoincident = useEditorStore((s) => s.allowCoincident);
  const allowPointOnLine = useEditorStore((s) => s.allowPointOnLine);
  const allowPointOnCircle = useEditorStore((s) => s.allowPointOnCircle);

  const createCoincident = useEditorStore((s) => s.createCoincident);
  const createPointOnLine = useEditorStore((s) => s.createPointOnLine);
  const createPointOnCircle = useEditorStore((s) => s.createPointOnCircle);

  const handleCoincidentClick = () => {
    createCoincident();
  };

  const handlePointOnLineClick = () => {
    createPointOnLine();
  };

  const handlePointOnCircleClick = () => {
    createPointOnCircle();
  };

  return (
    <ToolBar>
      <ToolBarButton aria-disabled={!allowCoincident} title="Coincident [X]" onClick={handleCoincidentClick}>
        <CoincidentIcon />
      </ToolBarButton>
      <ToolBarButton aria-disabled={!allowPointOnLine} title="Point on line [L]" onClick={handlePointOnLineClick}>
        <PointOnLineIcon />
      </ToolBarButton>
      <ToolBarButton aria-disabled={!allowPointOnCircle} title="Point on circle [Q]" onClick={handlePointOnCircleClick}>
        <PointOnCircleIcon />
      </ToolBarButton>
    </ToolBar>
  );
}
