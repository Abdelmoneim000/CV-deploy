import { panelComponents, DEFAULT_PANEL } from './panels/panelConfig';

interface PanelProps {
  currentPanel: string;
}

const Panel = ({ currentPanel }: PanelProps) => {
  const CurrentPanel =
    panelComponents[currentPanel] || panelComponents[DEFAULT_PANEL];

  return (
    <div className="shrink-0 ml-2 overflow-y-auto w-xs min-h-screen">
      <CurrentPanel />
    </div>
  );
};

export default Panel;
