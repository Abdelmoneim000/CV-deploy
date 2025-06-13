import { useState } from 'react';
import Panel from '../components/dashboard/Panel';
import Sidebar from '../components/dashboard/Sidebar';
import TemplateRender from '../components/dashboard/TemplateRender';

const Dashboard = () => {
  const [currentPanel, setCurrentPanel] = useState('add-section');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-200">
      <Sidebar
        currentPanel={currentPanel}
        setCurrentPanel={setCurrentPanel}
        isPanelOpen={isPanelOpen}
        setIsPanelOpen={setIsPanelOpen}
      />
      {isPanelOpen && <Panel currentPanel={currentPanel} />}
      <TemplateRender setIsPanelOpen={setIsPanelOpen} />
    </div>
  );
};

export default Dashboard;
