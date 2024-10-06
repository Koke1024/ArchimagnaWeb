import logo from './img/archi_magna.png';
import img_life from './img/life.png';
import './App.css';
import React, {useContext, useEffect, useRef, useState} from "react";
import api from "./api/api";
import {backgroundColors, Box, Button, Text} from 'dracula-ui';
// import { Input } from '@mui/material';
import {Link, useParams, useLocation, useNavigate} from 'react-router-dom'
import {DefaultHP, PhaseInfo, RoleInfo, TeamInfo} from "./api/ArchiMagnaDefine";
import {Grid, Paper, Typography} from "@mui/material";
import PhaseDisplay from "./component/PhaseDisplay";
import {RoomContext, UsersContext} from "./App";

export default function Master() {
  const {users, setUsers} = useContext(UsersContext);
  const {roomInfo, setRoomInfo} = useContext(RoomContext);
  const nameInputRefs = useRef([]);
  const lifeInputRefs = useRef([]);
  const manaInputRefs = useRef([]);
  const lifeAddInputRefs = useRef([]);
  const manaAddInputRefs = useRef([]);
  const [isTeamOrder, setTeamOrder] = useState(false);
  const [newURL, setNewURL] = useState("");
  const {token} = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleTeamOrder = () => {
    setTeamOrder(v => !v);
  }

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
          <input onClick={CopyUrl} style={{margin: "auto", width: "100%", cursor: 'pointer'}} readOnly={true}
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
      if (newNames[i] === "") {
        newNames[i] = "プレイヤー" + (i);
      }
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

  const PlayerInformation = (props) => {
    const [user,] = useState(props.player);
    var index = props.index;

    const openPlayerPage = (token) => {
      navigate(`/${roomInfo.ROOM_ID}/${user.USER_ID}/${token}`);
    }

    return <Grid key={user.USER_ID} item xs={6} className={"Square"}>
      {/*名前*/}
      <Grid item xs={12} className={"Item"}>
        <Typography onClick={() => openPlayerPage(user.TOKEN)}>※</Typography>
        {user.ROLE &&
          (<div key={user.USER_ID}>
            <Box color={TeamInfo[user.TEAM].Color} m={"xxs"}><Typography variant={"h6"} color={"black"}
                                                                         className={"text-outline"}>［{RoleInfo[user.ROLE]}］{user.USER_NAME}<br/>{TeamInfo[user.TEAM].Name}チーム</Typography></Box>
          </div>)}
        {!user.ROLE &&
          (<Typography fontSize={"x-large"}>{index + 1}：{user.USER_NAME}</Typography>)}
        <Box>HP:
          {Array(DefaultHP).fill(null).map((_, lifeIndex) => <img src={img_life} width={"30px"}
                                                                  style={{marginTop: "0px"}}
                                                                  key={`life_${user.USER_ID}_${lifeIndex}`}
                                                                  className={(lifeIndex < user.HP ? "life_img" : "life_img_dead") + " pointer"}
                                                                  onClick={() => {
                                                                    if (lifeIndex < user.HP) {
                                                                      users[index].HP -= 1;
                                                                    } else {
                                                                      users[index].HP += 1;
                                                                    }
                                                                    setUsers(users.filter(v => true));
                                                                    console.log(users)
                                                                  }}/>)}</Box>
        <Box mb={"md"}>
          <>魔力</>
          <input
            ref={(el) => (manaInputRefs.current[index] = el)}
            defaultValue={user.MANA}
            type="number"
            style={{
              fontsize: "sm",
              width: '50px',
              backgroundColor: 'var(--blackTernary)',
              color: 'var(--blackSecondary)'
            }}/>+
          <input
            ref={(el) => (manaAddInputRefs.current[index] = el)}
            defaultValue={0}
            type="number"
            style={{
              fontsize: "sm",
              width: '50px',
              backgroundColor: 'var(--blackTernary)',
              color: 'var(--blackSecondary)'
            }}
          />
        </Box></Grid>
    </Grid>
  }

  const PlayerRequest = (props) => {

    const [user,] = useState(props.player);
    var index = props.index;

    return <Grid key={user.USER_ID} item xs={6} className={"Square"}>
      この辺にいろいろ表示
    </Grid>;
  }

  const OnNextPhase = () => {
    api.NextPhase(roomInfo.ROOM_ID).then(r => {
      if (r.data.length > 0) {
        console.log(r.data)
        setRoomInfo(r.data[0]);
      } else {
        console.error("対応する部屋が存在しない")
        navigate('/');
      }
    })
  }

  return (
    <Box className="App" style={{width: "700px"}} m={"auto"}>
      <Header/>
      <PhaseDisplay roomInfo={roomInfo}/>
      <Box style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        width: "800px",
        resize: "both",
        margin: "auto"
      }}>
        {users.length > 0 && users[0].ROLE === null &&
          (<>
            <Button m={"lg"} onClick={() => api.SetRoleAutomated(roomInfo.ROOM_ID).then(() => {
              api.GetUserList(roomInfo.ROOM_ID).then(res => {
                setUsers(res.data)
              })
            })}>ロールの自動割り当て</Button>
          </>)}
        <Box mb={"md"} sx={{"margin": "auto"}}>
          <Button onClick={OnNextPhase}>
            進める
          </Button>
        </Box>
        {users.length > 0 ?
          (
            <Grid container spacing={2} className={"Square"}>
              <Grid item xs={9}>
              </Grid>
              <Grid item xs={3}>
                <Button onClick={toggleTeamOrder}>
                  並び順変更
                </Button>
              </Grid>
              {users.sort((a, b) => {
                if (!isTeamOrder) {
                  return (a.USER_ID - b.USER_ID);
                }
                return (a.TEAM - b.TEAM) * 10 + (a.ROLE - b.ROLE);
              }).map((r, index) => (<>
                  <PlayerInformation player={users[index]} index={index}/>
                  <PlayerRequest player={users[index]} index={index}/>
                </>
              ))}
            </Grid>
          ) :
          <form>
            <InputPlayerNames/>
            <Button m={"xs"} onClick={RegisterUsers}>登録
            </Button>
          </form>}</Box>
      <div>
        <Button m={"lg"} onClick={api.TruncateAll}>TruncateAll</Button>
      </div>
    </Box>
  )
    ;
}


function Flex(props) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      flexWrap: "wrap",
      width: "100%",
      height: "250px",
      margin: "auto",
    }}>{props.children}
    </div>
  )
}