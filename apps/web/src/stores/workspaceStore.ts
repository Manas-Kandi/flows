import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { WorkspaceMode, Project, Part, Assembly } from '@types/index';

interface WorkspaceState {
  // Current workspace state
  currentMode: WorkspaceMode;
  projectId?: string;
  branchId?: string;
  
  // Active data
  currentProject?: Project;
  currentPart?: Part;
  currentAssembly?: Assembly;
  
  // Actions
  setMode: (mode: WorkspaceMode) => void;
  setProject: (project: Project) => void;
  setPart: (part: Part) => void;
  setAssembly: (assembly: Assembly) => void;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  immer((set, get) => ({
    currentMode: 'model',
    projectId: undefined,
    branchId: undefined,
    currentProject: undefined,
    currentPart: undefined,
    currentAssembly: undefined,

    setMode: (mode) => {
      set({ currentMode: mode });
    },

    setProject: (project) => {
      set({
        currentProject: project,
        projectId: project.id,
        branchId: project.currentBranch,
      });
    },

    setPart: (part) => {
      set({ currentPart: part });
    },

    setAssembly: (assembly) => {
      set({ currentAssembly: assembly });
    },

    loadProject: async (projectId: string) => {
      // TODO: Implement API call to load project
      // For now, create a mock project
      const mockProject: Project = {
        id: projectId,
        name: 'Sample Project',
        description: 'A sample CAD project',
        workspaceId: 'workspace-1',
        currentBranch: 'main',
        branches: [
          {
            id: 'main',
            name: 'main',
            createdAt: new Date().toISOString(),
            createdBy: {
              id: 'user-1',
              name: 'John Doe',
              email: 'john@example.com',
              role: 'owner',
              status: 'online',
            },
            commits: [],
            mergeRequests: [],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'owner',
          status: 'online',
        },
        collaborators: [],
      };

      set({
        currentProject: mockProject,
        projectId: mockProject.id,
        branchId: mockProject.currentBranch,
      });
    },

    saveProject: async () => {
      // TODO: Implement API call to save project
      console.log('Saving project...', get().currentProject);
    },
  }))
);
