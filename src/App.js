import React from 'react';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';

import Member from './member';
import Master from './master';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Member />} />
        <Route path="/gm" element={<Master />} />
      </Routes>
      <Link to='/'>Back To Top</Link>
    </BrowserRouter>
  );
}

export default App;