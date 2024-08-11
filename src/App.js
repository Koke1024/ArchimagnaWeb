import React from 'react';
import 'dracula-ui/styles/dracula-ui.css';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';

import Member from './member';
import Master from './master';
import {Box} from "dracula-ui";

function App() {
  return (
    <Box color={"black"}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Master/>}/>
          <Route path="/:room/:token" element={<Member/>}/>
          <Route path="/gm" element={<Master/>}/>
          <Route path="/gm/:token" element={<Master/>}/>
        </Routes>
        <Link to='/'>Back To Top</Link>
      </BrowserRouter>
    </Box>
  );
}

export default App;