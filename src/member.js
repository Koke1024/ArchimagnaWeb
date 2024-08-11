import logo from './img/archi_magna.png';
import './App.css';
import {useEffect, useState} from "react";
import api from "./api/api";
import {useParams} from "react-router-dom";
import {ActionInfo} from "./api/ArchiMagnaDefine";

function Member() {
  const [users, setUsers] = useState([])
  const [myInfo, setMyInfo] = useState([])
  const [userName, setUserName] = useState("")
  const {room, token} = useParams();

  useEffect(() => {
    if(!token){
      return;
    }
    console.log([room, token])
    api.GetUserInfo(token).then(r => setMyInfo(r.data))
  }, [token, room])

  if(!token){
    return <>no token</>
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
        <button onClick={() => api.AddUser(userName).then(res => {
          setUsers(res.data)
        })}>送信
        </button>

        {users.map(user => {
          return <div key={'id_' + user.ID}>{user.USER_NAME}, {user.UPD_DATE}</div>
        })}


        {myInfo ?
          <>現在可能なアクション
            {Object.entries(ActionInfo).filter(r => r[1].Role === myInfo.ROLE).map(r => {
              return <div key={"action_" + r[0]}>{r[1].Name}</div>
            })}
          </> : ''
        }
      </header>
    </div>
  );
}

export default Member;
