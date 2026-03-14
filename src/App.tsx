import React from 'react';
import { Board } from './board';

const cells = [
  [
    {
      value: 1,
    },
    {},
    {},
  ],
  [
    {},
    {},
    {},
  ],
  [
    {},
    {},
    {},
  ]
];

function App() {
  return (
    <main style={{ padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
      <Board cells={cells} />
    </main>
  );
}

export default App;
