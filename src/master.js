import logo from './img/archi_magna.png';
import img_life from './img/life.png';
import './App.css';
import React, {useContext, useEffect, useRef, useState} from "react";
import api from "./api/api";
import {backgroundColors, Box, Button, Text} from 'dracula-ui';
// import { Input } from '@mui/material';
import {Link, useParams, useLocation, useNavigate} from 'react-router-dom'
import {ActionInfo, DefaultHP, PhaseInfo, RoleInfo, TargetSelectFormat, TeamInfo} from "./api/ArchiMagnaDefine";
import {Grid, Paper, Typography} from "@mui/material";
import PhaseDisplay from "./component/PhaseDisplay";
import {RoomContext, UsersContext} from "./App";

export default function Master() {
  const {users, setUsers} = useContext(UsersContext);
  const {roomInfo, setRoomInfo} = useContext(RoomContext);
  const [actionLog, setActionLog] = useState([]);
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
  const [upd, setUpd] = useState(0);
  const [playerNames, setPlayerNames] = useState(Array(8).fill(""));

  useEffect(() => {
    var id = setInterval(() => {
      if(users.length > 0){
        setUpd(v => v + 1);
      }
    }, 20000);

    getActionLog();

    return () => {
      clearInterval(id);
    }
  }, []);

  useEffect(() => {
    getActionLog();
    console.dir(nameInputRefs.current)
  }, [upd])

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

  const getActionLog = () => {
    if(!roomInfo.ROOM_ID){
      console.log("no room id");
      return;
    }
    api.GetActionLog(roomInfo.ROOM_ID).then(res => {
      console.log("GetActionLog")
      console.log(res.data)
      setActionLog(res.data);
    })
  }

  const handleInputChange = (index, value) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[index] = value;
    setPlayerNames(newPlayerNames);
  };

  function InputPlayerNames() {
    return (
      <Box p={"md"}>
        <Flex>
          {Array(8).fill(null).map((_, index) =>
            <div key={"name_input_" + index}>
              <label>
                <input
                  key={"name_input_text_" + index}
                  ref={(el) => (nameInputRefs.current[index] = el)}
                  // onBlur={(e) => handleInputChange(index, e.target.value)}
                  placeholder={`Player ${index + 1}`}
                  // value={playerNames[index]}
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
        })}>新規ルームの作成
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
          <div>GM用URL</div>
          <input onClick={CopyUrl} style={{margin: "auto", width: "100%", cursor: 'pointer'}} readOnly={true}
                 type={"text"}
                 value={fullPath}></input>
        </> : ''}
    </header>
  }

  const openPlayerPage = (user_id, token) => {
    console.log(`/${roomInfo.ROOM_ID}/${user_id}/${token}`)
    navigate(`/${roomInfo.ROOM_ID}/${user_id}/${token}`);
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

    return <Grid key={"player_info_" + user.USER_ID} container className={"Square"}>
      {/*名前*/}
      <Grid item xs={12} className={"Item"}>
        {user.ROLE &&
          (<div>
            <Box color={TeamInfo[user.TEAM].Color} m={"xxs"}><Typography variant={"h6"} color={"black"}
                                                                         onClick={() => openPlayerPage(user.USER_ID, user.TOKEN)}
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
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Box>
          <PlayerRequest player={users[index]} index={index}/>
        </Box>
      </Grid>
    </Grid>
  }

  const PlayerRequest = (props) => {
    const [user,] = useState(props.player);
    var index = props.index;

    return (<Box key={"user_action_log_box_" + user.USER_ID} className={"pointer"}
    >
      行動ログ
      {actionLog && actionLog.filter(r => r.USER_ID === user.USER_ID).map(r => {
          var args = JSON.parse(r.ACTION_TARGET);
          return (<Grid key={"user_action_log_" + r.ACTION_LOG_ID} item xs={12} >
            <Box>{r.DAY}日目</Box>
            <Box>{TargetSelectFormat(args, r.ACTION_ID, args[1])}</Box>
          </Grid>)
        }
      )}
    </Box>)
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
      {users.length > 0?
      <Button onClick={OnNextPhase} mx={"auto"} my={"xs"}>
        {roomInfo.DAY > 0? <>進める</>: <>開始</>}
      </Button>: ''}
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
        {users.length > 0 ?
          (
            <Grid container spacing={2} className={"Square"}>
              <Grid item xs={6}>
              </Grid>
              <Grid item xs={3}>
                <Button onClick={getActionLog}>ログの更新</Button>
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
              }).map((r, index) => (<Grid key={"user_message_" + r.USER_ID} item xs={6}>
                  <PlayerInformation player={users[index]} index={index}/>
                </Grid>
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