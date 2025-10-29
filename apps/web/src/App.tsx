import { useState } from 'react';
import { MainLayout } from '@components/layout/MainLayout';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { CollaborationProvider } from '@/contexts/CollaborationContext';

function App() {
  return (
    <WorkspaceProvider>
      <CollaborationProvider>
        <MainLayout />
      </CollaborationProvider>
    </WorkspaceProvider>
  );
}

export default App;
