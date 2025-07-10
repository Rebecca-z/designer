// src/App.tsx
// import Designer from '@/components/Designer/Designer';
import React from 'react';
// import { DndProvider } from 'react-dnd';
// import { HTML5Backend } from 'react-dnd-html5-backend';
import Card from '@/components/Card/card-designer-index';

const App: React.FC = () => (
  // <DndProvider backend={HTML5Backend}>
  //   <Designer />
  // </DndProvider>
  <Card />
);

export default App;
