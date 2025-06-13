import type { ComponentType } from 'react';
import SectionPanel from './SectionPanel';
import ReorganizePanel from './ReorganizePanel';
import ModelsPanel from './ModelsPanel';
import DesignPanel from './DesignPanel';
import ReviseTextPanel from './ReviseTextPanel';
import AnalysisPanel from './AnalysisPanel';
import AdaptPanel from './AdaptPanel';
import TranslatePanel from './TranslatePanel';
import DownloadPanel from './DownloadPanel';
import SharePanel from './SharePanel';
import HistoryPanel from './HistoryPanel';

type PanelConfig = {
  [key: string]: ComponentType;
};

export const panelComponents: PanelConfig = {
  'add-section': SectionPanel,
  reorganize: ReorganizePanel,
  models: ModelsPanel,
  design: DesignPanel,
  'revise-text': ReviseTextPanel,
  'analysis-score': AnalysisPanel,
  'adapt-job': AdaptPanel,
  translate: TranslatePanel,
  download: DownloadPanel,
  share: SharePanel,
  history: HistoryPanel,
};

export const DEFAULT_PANEL = 'add-section';
