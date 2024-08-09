import logo from './archi_magna.png';
import './App.css';
import axios from 'axios'
import {useEffect, useState} from "react";
import {AddUser, GetUserList} from "./api/api";

axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

function Member() {
  const [users, setUsers] = useState([])

  const [userName, setUserName] = useState("")

  useEffect(() => {
    UpdateUserList()
  }, [])

  function UpdateUserList(){
    GetUserList().then(res => {
      setUsers(res.data)
    })
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>ArchiMagna</h1>
        <h2>プレイヤー用</h2>
        <img src={logo} className="App-logo" alt="logo"/>
        <label>
          Text input: <input name="myInput" type="text"
                             value={userName} onChange={(e) => setUserName(e.target.value)}/>
        </label>
        <button onClick={() => AddUser(userName).then(res => {
          setUsers(res.data)
        })}>送信
        </button>

        {users.map(user => {
          return <div key={'id_' + user.ID}>{user.USER_NAME}, {user.UPD_DATE}</div>
        })}
      </header>
    </div>
  );
}

export default Member;
