import img_life from './img/life.png';
import './App.css';
import React, {useContext, useEffect, useRef, useState} from "react";
import api from "./utils/api";
import {Box, Button} from 'dracula-ui';
// import { Input } from '@mui/material';
import {Link, useParams, useLocation, useNavigate} from 'react-router-dom'
import {DefaultHP, RoleInfo, TeamInfo} from "./utils/ArchiMagnaDefine";
import {Grid2, Paper, Typography} from "@mui/material";
import PhaseDisplay, {PlayerLog} from "./component/PhaseDisplay";
import {RoomContext, UsersContext} from "./App";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function Master() {
  const {users, setUsers} = useContext(UsersContext);
  const {roomInfo, setRoomInfo} = useContext(RoomContext);
  const [usersLife, setUsersLife] = useState(Array(8).fill(0));
  const [actionLog, setActionLog] = useState([]);
  const nameInputRefs = useRef([]);
  const manaAddInputRefs = useRef([]);
  const [isTeamOrder, setTeamOrder] = useState(false);
  const [newURL, setNewURL] = useState("");
  const {token} = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [upd, setUpd] = useState(0);
  const submitRef = useRef(null);
  const [playerNames, setPlayerNames] = useState(Array(8).fill(""));

  function CopyText(text) {
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log("Copied")
      })
      .catch((err) => {
        console.error('コピーエラー:', err);
      });
  }

  useEffect(() => {
    if(submitRef.current){
      submitRef.current.disabled = true;
    }
    getActionLog();
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
        console.log(r)
        if (Object.keys(r.data).length !== 0) {
          console.log(r.data)
          setRoomInfo(r.data);
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
    if (!roomInfo.ROOM_ID) {
      console.log("no room id");
      return;
    }
    api.GetActionLog(roomInfo.ROOM_ID).then(res => {
      setActionLog(res.data);
    })
  }

  const updateUserInfo = () => {
    if (!roomInfo.ROOM_ID) {
      console.log("no room id");
      return;
    }
    var _users = users;
    for (let i = 0; i < _users.length; ++i) {
      console.log(manaAddInputRefs.current[i].value)
      _users[i].MANA = +(manaAddInputRefs.current[i].value) ?? 0;
    }
    for (let i = 0; i < _users.length; ++i) {
      _users[i].HP = usersLife[i] ?? 0;
    }
    api.UpdateUserInfo(roomInfo.ROOM_ID, _users).then(res => {
      setUsersLife(Array(8).fill(0));
      setUsers(res.data)
      getActionLog();
      submitRef.current.disabled = true;
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
          console.log(r)
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

  const playerFullUrl = (user_id, token) => {
    return `${window.location.origin}/pl/${roomInfo.ROOM_ID}/${user_id}/${token}`;
  }

  const playerUrl = (user_id, token) => {
    return `/${roomInfo.ROOM_ID}/pl/${user_id}/${token}`;
  }

  const openPlayerPage = (user_id, token) => {
    var link = playerUrl(user_id, token);
    console.log(link)
    navigate(link);
  }

  function RegisterUsers() {
    if (!roomInfo?.ROOM_ID) {
      return;
    }
    const newNames = [];
    console.log(nameInputRefs)
    for (let i = 0; i < nameInputRefs.current.length; ++i) {
      newNames[i] = nameInputRefs.current[i].value;
      if (newNames[i] === "") {
        newNames[i] = "プレイヤー" + (i);
      }
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

    return <Grid2 key={"player_info_" + user.USER_ID} container spacing={"xxs"} className={"Square"}>
      {/*名前*/}
      <Grid2 item xs={12} className={"Item"}>
        {user.ROLE &&
          (<div>
            <Box color={TeamInfo[user.TEAM].Color} m={"xxs"}>
              <Paper className={"drac-d-inline-flex"} sx={{borderRadius: "10px", padding: "0 10px", backgroundColor: TeamInfo[user.TEAM].Color}} color={TeamInfo[user.TEAM].Color}>
                <Typography variant={"h6"} color={user.HP > 0 ? "black" : "red"}
                          className={"text-outline drac-d-inline"}>
                  ［{RoleInfo[user.ROLE]}］{user.USER_NAME}
                </Typography>　
                <div className={"pointer"} color="gray"
                       onClick={() => CopyText(`${user.USER_NAME}：` + playerFullUrl(user.USER_ID, user.TOKEN))}>
                  <ContentCopyIcon color={"gray"} fontSize={"xs"} ml={"xs"} mt={"xs"}/>
                </div>
              </Paper>
              <Box color={"black"}>
                <span>{TeamInfo[user.TEAM].Name}ツイン</span>
              </Box>
            </Box>
          </div>)}
        {!user.ROLE &&
          (<Typography fontSize={"x-large"}>{index + 1}：{user.USER_NAME}</Typography>)}
        <Box className={"drac-d-flex"}>
          <Box className={"drac-text-left"} p={"xs"}>HP :
            {Array(DefaultHP).fill(null).map((_, lifeIndex) => <img src={img_life} width={"30px"}
                                                                    style={{marginTop: "0px", marginLeft: "10px"}}
                                                                    key={`life_${user.USER_ID}_${lifeIndex}`}
                                                                    className={(lifeIndex < (user.HP + usersLife[index]) ? "life_img" : "life_img_dead") + " pointer"}
                                                                    onClick={() => {
                                                                      if (lifeIndex < (user.HP + usersLife[index])) {
                                                                        usersLife[index] -= 1;
                                                                      } else {
                                                                        usersLife[index] += 1;
                                                                      }
                                                                      setUsersLife(usersLife.filter(_ => true));
                                                                      // setRewritten(true);

                                                                      submitRef.current.disabled = false;
                                                                        console.log(users)
                                                                    }}/>)}

            　魔力 ： <Typography className={"drac-d-inline"} color={"white"} fontSize={"x-large"}>{user.MANA}</Typography> +　
            <input
              ref={(el) => (manaAddInputRefs.current[index] = el)}
              defaultValue={manaAddInputRefs.current[index]}
              type="number"
              style={{
                fontSize: "x-large",
                width: '80px',
                padding: '4px',
                backgroundColor: 'var(--blackTernary)',
                color: 'var(--blackSecondary)',
                borderRadius: '10%'
              }}
              onChange={event => {
                manaAddInputRefs.current[index].value = event.target.value;
                console.log(+event.target.value)
                if(+(event.target.value) !== 0){
                  submitRef.current.disabled = false;
                }
              }}
            />
          </Box>
        </Box>
      </Grid2>
      <Grid2 item xs={12}>
        <Box>
          <PlayerLog player={users[index]} log={actionLog.filter(v => v.USER_ID === user.USER_ID)}/>
        </Box>
      </Grid2>
    </Grid2>
  }

  const OnNextPhase = () => {
    api.NextPhase(roomInfo.ROOM_ID).then(r => {
      if (Object.keys(r.data).length > 0) {
        console.log(r.data)
        setRoomInfo(r.data);
      } else {
        console.error("対応する部屋が存在しない")
        navigate('/');
      }
    })
  }

  return (
    <Box className="App" style={{width: "700px"}} m={"auto"}>
      <Header/>
      {/*<PopupOnCursor/>*/}
      <Grid2 container className={"Controller"}>
        <Grid2 item xs={2}></Grid2>
        <Grid2 item xs={2}>
          <Button onClick={toggleTeamOrder}>
            並び順変更
          </Button>
        </Grid2>
        <Grid2 item xs={2}><Button
          ref={submitRef}
          onClick={() => {
            updateUserInfo();
          }}>HPと魔力を更新</Button>
        </Grid2>
        <Grid2 item xs={2}>
          <Button onClick={getActionLog}>ログ再取得</Button>
        </Grid2>
        <Grid2 item xs={2}>
          {users.length > 0 ?
            <Button onClick={OnNextPhase} mx={"auto"}>
              {roomInfo.DAY > 0 ? <>フェイズを進める</> : <>開始</>}
            </Button> : ''}
        </Grid2>
        <Grid2 item xs={2}></Grid2>
      </Grid2>
      <PhaseDisplay roomInfo={roomInfo}/>
      <Box style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        width: "800px",
        resize: "both",
        margin: "30px auto"
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
            <Grid2 container spacing={2} className={"Square Players"}>
              {users.sort((a, b) => {
                if (!isTeamOrder) {
                  return (a.USER_ID - b.USER_ID);
                }
                return (a.TEAM - b.TEAM) * 10 + (a.ROLE - b.ROLE);
              }).map((r, index) => (<Grid2 key={"user_message_" + r.USER_ID} item xs={6}>
                  <PlayerInformation player={users[index]} index={index}/>
                </Grid2>
              ))}
            </Grid2>
          ) :
          <form>
            <>プレイヤーの名前を入力</>
            <InputPlayerNames/>
            <Button m={"xs"} onClick={RegisterUsers}>プレイヤー名登録
            </Button>
          </form>}</Box>
      {/*<div>*/}
      {/*  <Button m={"lg"} onClick={api.TruncateAll}>TruncateAll</Button>*/}
      {/*</div>*/}
      <Box mb={"lg"} style={{marginBottom: "80px"}}></Box>
    </Box>
  );
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