import logo from './img/archi_magna.png';
import './App.css';
import React, {useContext, useEffect, useState} from "react";
import api from "./api/api";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {ActionInfo, DefaultHP, RoleInfo, TeamInfo} from "./api/ArchiMagnaDefine";
import {FormControl, Grid, InputLabel, MenuItem, Typography} from "@mui/material";
import {Box, Button, Input, Select} from "dracula-ui";
import PhaseDisplay from "./component/PhaseDisplay";
import {RoomContext, UsersContext} from "./App";
import img_life from "./img/life.png";

function Player() {
  const {users, setUsers} = useContext(UsersContext);
  const {roomInfo, setRoomInfo} = useContext(RoomContext);
  const [myInfo, setMyInfo] = useState({})
  const {room, userId, token} = useParams();
  const navigate = useNavigate();
  const [upd, setUpd] = useState(0);
  const [actionLog, setActionLog] = useState([]);
  const [actionTarget, setActionTarget] = useState("");
  const [inputAction, setInputAction] = useState(0);
  const location = useLocation();

  useEffect(() => {
    var id = setInterval(() => {
      setUpd(v => v + 1);
    }, 5000);

    return () => {
      clearInterval(id);
    }
  }, []);

  useEffect(() => {
    if (token) {
      api.GetRoomInfoFromUser(userId, token).then(r => {
        console.dir(r.data)
        if (r.data.length > 0) {
          setRoomInfo(r.data[0]);
          console.log("")
        } else {
          console.error("対応する部屋が存在しない")
          navigate('/');
        }
      })
    }
  }, [token, upd]);

  useEffect(() => {
    if (!userId || !token) {
      return;
    }
    api.GetUserInfo(userId, token).then(r => setMyInfo(r.data[0]))
  }, [token, userId])

  useEffect(() => {
    if (!roomInfo?.ROOM_ID) {
      return;
    }
    api.GetUserList(roomInfo.ROOM_ID).then(res => {
      setUsers(res.data)
    })
  }, [roomInfo]);



  function Header() {
    const fullPath = `${window.location.origin}/gm/${roomInfo.TOKEN}/`;

    function CopyUrl() {
      console.log(window.location.origin)
      console.log(location.pathname)
      console.log(location.search)
      console.log(location.hash)
      navigator.clipboard.writeText(fullPath)
        .then(() => {
          console.log("Copied")
        })
        .catch((err) => {
          console.error('コピーエラー:', err);
        });
    }

    return <Box className="App-header" mt={"lg"}>
      {token ?
        <>
          <div>GM用URL</div>
          <input onClick={CopyUrl} style={{margin: "auto", width: "100%", cursor: 'pointer'}} readOnly={true}
                 type={"text"}
                 value={fullPath}></input>
        </> : ''}
    </Box>
  }

  const PlayerInformation = (props) => {
    const [user,] = useState(props.player);
    console.dir(user);
    var index = props.index;

    const openPlayerPage = (token) => {
      navigate(`/${roomInfo.ROOM_ID}/${user.USER_ID}/${token}`);
    }

    return <Grid key={user.USER_ID} item xs={6} className={"Square"}>
      {/*名前*/}
      <Grid item xs={12} className={"Item"} pt={"2px"}>
        {user.ROLE &&
          (<div key={user.USER_ID}>
            <Box color={TeamInfo[user.TEAM].Color} m={"xxs"}><Typography variant={"h6"} color={"black"}
                                                                         className={"text-outline"}>［{RoleInfo[user.ROLE]}］{user.USER_NAME}<br/>{TeamInfo[user.TEAM].Name}チーム</Typography></Box>
          </div>)}
        {!user.ROLE &&
          (<Typography fontSize={"x-large"}>{user.USER_NAME}</Typography>)}
        <Box>HP:
          {Array(DefaultHP).fill(null).map((_, lifeIndex) => <img src={img_life} width={"30px"}
                                                                  style={{marginTop: "0px"}}
                                                                  key={`life_${user.USER_ID}_${lifeIndex}`}
                                                                  className={(lifeIndex < user.HP ? "life_img" : "life_img_dead")}/>)}</Box>
        <Box mb={"md"}>
          <>魔力</>
          {user.MANA}
        </Box></Grid>
    </Grid>
  }

  if (!token) {
    return <>no token</>
  }

  return (
    <Box className="App" style={{width: "700px"}} m={"auto"}>
      <header className="App-header">
        <h1 style={{paddingTop: "30px"}}>ArchiMagna</h1>
        <h2 style={{margin: "10px"}}>プレイヤー用ページ</h2>
        <PhaseDisplay roomInfo={roomInfo}/>
        <Box style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          width: "800px",
          resize: "both",
          margin: "auto"
        }}>
        </Box>
      </header>

      <Box p={"md"}>
        <Grid container>
          <Grid item xs={3}></Grid>
          <PlayerInformation player={myInfo} index={0}/>
        </Grid>
      </Box>
      <Grid container spacing={2}>
        {/*Text input: <input name="myInput" type="text"*/}
        {/*                   value={userName} onChange={(e) => setUserName(e.target.value)}/>*/}
        {/*<button onClick={() => api.AddUser(userName).then(res => {*/}
        {/*  setUsers(res.data)*/}
        {/*})}>送信*/}
        {/*</button>*/}


        <Grid container spacing={2}>

        <Grid item xs={12}><Typography>プレイヤー：</Typography></Grid>
        <br/>
        {users && users.map(user => {
          return <Grid xs={3} key={'id_' + user.USER_ID}>
            <Typography color={(user.HP > 0)? "white": "red"}>
              ［{user.USER_NAME}］
            </Typography>
          </Grid>
        })}
        </Grid>

        {myInfo ?
          <><Grid item xs={3}></Grid>
            <Grid item xs={6} md={6}>
              <Typography>
                現在可能なアクション
              </Typography>
            </Grid>
            <Grid item xs={3}></Grid>
            <Grid item xs={12}>
              <Input type={"text"} defaultValue={actionTarget} onChange={(e) => {
                setActionTarget(e.target.value)
              }}></Input>
            </Grid>
              {Object.entries(ActionInfo).filter(r => {
                return (r[1].Role.length === 0 || r[1].Role.find(v => v === roomInfo.PHASE)) && (r[1].Role.find(v => v === myInfo.ROLE));
              }).map(r => {
                return <Grid item key={"action_" + r[0]} xs={2}>
                  <Button onClick={() => {
                    console.log("action: " + r[0])
                    if(inputAction === 0) {
                      setInputAction(r[1].ID);
                    }else {
                      setInputAction(0);
                    }
                    // api.SendAction(myInfo.USER_ID, r[1].ID, actionTarget, roomInfo.DAY, roomInfo.roomId).then(res => {
                    //   // setActionLog([])
                    // })
                  }
                  }>
                    <Typography>{r[1].Name}</Typography>
                  </Button>
                  {r[1].Target &&
                    <FormControl variant="outlined" style={{ minWidth: 200 }}>
                      <InputLabel id="dropdown-label">対象を選択</InputLabel>

                      <Select
                        labelId="dropdown-label"
                        // value={selectedValue} // 選択されている値を表示
                        // onChange={handleChange} // 値が変更されたときに呼ばれる関数
                        label="選択してください" // ラベルを指定
                        >
                    {users.map((u, index) =>
                      <MenuItem value={index} key={"target_select_" + index}>
                        {u.USER_NAME}
                      </MenuItem>
                    )}
                  </Select>
                    </FormControl>
                    }
                </Grid>
              })}
              {(inputAction !== 0)? <Button onClick={
                () => {
                  api.SendAction(myInfo.USER_ID, inputAction, actionTarget, roomInfo.DAY, roomInfo.ROOM_ID).then(res => {
                    setActionLog([])
                  })
                }
              }>
                実行
              </Button>: <>{inputAction}</>}
          </> : ''
        }
      </Grid>
      <Header/>
    </Box>
  );
}

export default Player;
