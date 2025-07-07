// src/App.tsx
import Designer from '@/components/Designer/Designer';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const App: React.FC = () => (
  <DndProvider backend={HTML5Backend}>
    <Designer />
  </DndProvider>
);

export default App;
