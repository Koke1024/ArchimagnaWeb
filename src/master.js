import logo from './img/archi_magna.png';
import img_life from './img/life.png';
import './App.css';
import React, {useEffect, useRef, useState} from "react";
import api from "./api/api";
import {Box, Button, Text} from 'dracula-ui';
// import { Input } from '@mui/material';
import {Link, useParams, useLocation, useNavigate} from 'react-router-dom'
import {TeamInfo} from "./api/ArchiMagnaDefine";
import {Grid, Typography} from "@mui/material";

export default function Master() {
  const nameInputRefs = useRef([]);
  const lifeInputRefs = useRef([]);
  const manaInputRefs = useRef([]);
  const [users, setUsers] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [newURL, setNewURL] = useState("");
  const {token} = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      api.GetRoomInfo(token).then(r => {
        if (r.data.length > 0) {
          console.log(r.data)
          setRoomInfo(r.data[0]);
        } else {
          console.error("対応する部屋が存在しない")
          navigate('/');
        }
      })
    }
  }, [token]);

  useEffect(() => {
    if (!roomInfo?.ROOM_ID) {
      return;
    }
    api.GetUserList(roomInfo.ROOM_ID).then(res => {
      setUsers(res.data)
    })
  }, [roomInfo]);

  function InputPlayerNames() {
    return (
      <Box p={"md"}>
        <Flex>
          {Array(8).fill(null).map((_, index) =>
            <div key={"name_input_" + index}>
              <label>
                <input
                  ref={(el) => (nameInputRefs.current[index] = el)}
                  // inputRef={(el) => (nameInputRefs.current[index] = el)}
                  placeholder={`Player ${index + 1}`}
                  type="text"
                  style={{width: '200px', margin: '10px'}}
                  required
                />
              </label>
            </div>
          )}
        </Flex>
      </Box>)
  }

  if (!token) {
    return <div className="App">
      <Header/>
      {newURL ? <>
          <Link to={newURL} color={"skyblue"}>部屋URLはこちら</Link>
        </> :
        <Button m={"xs"} onClick={() => api.CreateRoom().then(r => {
          navigate("/gm/" + r.data.TOKEN);
          // setNewURL("/gm/" + r.data.TOKEN)
        })}>新規ゲームを開始する
        </Button>}
    </div>
  }

  function Header() {
    const fullPath = `${window.location.origin}${location.pathname}${location.search}${location.hash}`;

    function CopyUrl() {
      navigator.clipboard.writeText(fullPath)
        .then(() => {
          console.log("Copied")
        })
        .catch((err) => {
          console.error('コピーエラー:', err);
        });
    }

    return <header className="App-header">
      <h1 style={{paddingTop: "30px"}}>ArchiMagna</h1>
      <h2 style={{margin: "10px"}}>マスター用ページ</h2>
      {token ?
        <>
          <div style={{margin: "10px"}}>URLを紛失しないようにしてください。</div>
          <input onClick={CopyUrl} style={{margin: "auto", width: "600px", cursor: 'pointer'}} readOnly={true}
                 type={"text"}
                 value={fullPath}></input>
        </> : ''}
    </header>
  }

  function RegisterUsers() {
    if (!roomInfo?.ROOM_ID) {
      return;
    }
    const newNames = [];
    console.log(nameInputRefs)
    for (let i = 0; i < nameInputRefs.current.length; ++i) {
      console.log(nameInputRefs.current[i])
      newNames[i] = nameInputRefs.current[i].value;
      console.log(newNames)
    }

    if (roomInfo.ROOM_ID) {
      api.AddUser(newNames, roomInfo.ROOM_ID).then(res => {
        setUsers(res.data)
      })
    } else {
      console.log("no room info")
    }
  }

  return (
    <Box className="App" style={{width: "500px"}} m={"auto"}>
      <Header/>
      {roomInfo ?
        <Box m={"md"}><h2>{roomInfo.DAY > 0 ? <>{roomInfo.DAY}日目</> : <>開始前</>}</h2></Box> : ""
      }
      {users.length > 0 ?
        users.map((r, index) => {
          if (r.ROLE) {
            return (<div key={r.USER_ID}>
                <Box color={TeamInfo[r.TEAM].Color}>{r.USER_NAME} {TeamInfo[r.TEAM].Name}</Box>
              </div>
            )
          } else {
            return (
              <Grid container key={r.USER_ID} spacing={0} className={"Square"}>
                <Grid item m={"sm"} xs={12} className={"Item"}>
                  <Typography fontSize={"x-large"}>{index + 1}：{r.USER_NAME}</Typography>
                </Grid>
                <Grid item m={"sm"} xs={3} className={"Item"}>
                  {Array(r.HP).fill(null).map(_ => <img src={img_life} width={"30px"}/>)}
                </Grid>
                <Grid item m={"sm"} xs={3} className={"Item"}>HP：
                  <input
                    ref={(el) => (lifeInputRefs.current[index] = el)}
                    defaultValue={r.HP}
                    type="text"
                    style={{
                      width: '50px',
                      margin: '10px',
                      backgroundColor: 'var(--blackTernary)',
                      color: 'var(--blackSecondary)'
                    }}
                  />
                </Grid>
                <Grid item ml={"20px"} xs={3} className={"Item"}>魔力：
                  <input
                    ref={(el) => (manaInputRefs.current[index] = el)}
                    defaultValue={r.MANA}
                    type="text"
                    style={{
                      width: '50px',
                      margin: '10px',
                      backgroundColor: 'var(--blackTernary)',
                      color: 'var(--blackSecondary)'
                    }}
                  /></Grid>
              </Grid>)
          }
        }) :
        <form>
          <InputPlayerNames/>
          <Button m={"xs"} onClick={RegisterUsers}>登録
          </Button>
        </form>}
      <div>
        <Button m={"lg"} onClick={api.TruncateAll}>TruncateAll</Button>
      </div>
    </Box>
  );
}

function Flex(props) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      flexWrap: "wrap",
      width: "500px",
      height: "250px",
      margin: "auto"
    }}>{props.children}
    </div>
  )
}