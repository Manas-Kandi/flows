import { createContext, useContext, ReactNode } from 'react';
import { useWorkspaceStore } from '@stores/workspaceStore';
import type { WorkspaceMode } from '../types';

interface WorkspaceContextType {
  currentMode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  projectId?: string;
  branchId?: string;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { currentMode, setMode, projectId, branchId } = useWorkspaceStore();

  return (
    <WorkspaceContext.Provider value={{ currentMode, setMode, projectId, branchId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
