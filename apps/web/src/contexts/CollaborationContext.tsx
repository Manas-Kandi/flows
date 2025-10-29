import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useCollaborationStore } from '@stores/collaborationStore';
import type { User } from '../types';

interface CollaborationContextType {
  currentUser?: User;
  collaborators: User[];
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function CollaborationProvider({ children }: { children: ReactNode }) {
  const { currentUser, collaborators, isConnected, connect, disconnect } =
    useCollaborationStore();

  useEffect(() => {
    // Auto-connect on mount
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <CollaborationContext.Provider
      value={{ currentUser, collaborators, isConnected, connect, disconnect }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider');
  }
  return context;
}
