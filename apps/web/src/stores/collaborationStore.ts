import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { User } from '../types';

interface CollaborationState {
  currentUser?: User;
  collaborators: User[];
  isConnected: boolean;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  setCurrentUser: (user: User) => void;
  updateCollaborators: (collaborators: User[]) => void;
  addCollaborator: (collaborator: User) => void;
  removeCollaborator: (collaboratorId: string) => void;
}

export const useCollaborationStore = create<CollaborationState>()(
  immer((set, get) => ({
    currentUser: undefined,
    collaborators: [],
    isConnected: false,

    connect: () => {
      // TODO: Establish WebSocket connection
      console.log('Connecting to collaboration service...');
      
      // Mock current user
      const mockUser: User = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'owner',
        status: 'online',
      };

      set({
        isConnected: true,
        currentUser: mockUser,
      });
    },

    disconnect: () => {
      // TODO: Close WebSocket connection
      console.log('Disconnecting from collaboration service...');
      set({
        isConnected: false,
        collaborators: [],
      });
    },

    setCurrentUser: (user) => {
      set({ currentUser: user });
    },

    updateCollaborators: (collaborators) => {
      set({ collaborators });
    },

    addCollaborator: (collaborator) => {
      set((state) => {
        state.collaborators.push(collaborator);
      });
    },

    removeCollaborator: (collaboratorId) => {
      set((state) => {
        state.collaborators = state.collaborators.filter((c) => c.id !== collaboratorId);
      });
    },
  }))
);
