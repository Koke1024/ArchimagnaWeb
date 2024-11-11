import React, {createContext} from 'react';
import 'dracula-ui/styles/dracula-ui.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Player from './player';
import Master from './master';
import {Box} from "dracula-ui";

export var UsersContext = createContext([]);
export var RoomContext = createContext({});

function App() {
  const [users, setUsers] = React.useState([]);
  const [roomInfo, setRoomInfo] = React.useState({});

  return (
    <Box color={"black"}>
      <UsersContext.Provider value={{users, setUsers}}>
      <RoomContext.Provider value={{roomInfo, setRoomInfo}}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Master/>}/>
          <Route path="/pl/:room/:userId/:token" element={<Player/>}/>
          <Route path="/gm" element={<Master/>}/>
          <Route path="/gm/:token" element={<Master/>}/>
        </Routes>
      </BrowserRouter>
      </RoomContext.Provider>
      </UsersContext.Provider>
    </Box>
  );
}

export default App;