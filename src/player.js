import './App.css';
import React, {useContext, useEffect, useState} from "react";
import api from "./api/api";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {ActionInfo, DefaultHP, RoleInfo, TeamInfo} from "./api/ArchiMagnaDefine";
import {
  Checkbox,
  FormControl,
  Grid,
  Input,
  InputLabel,
  ListItemText,
  Typography
} from "@mui/material";
// import {Box, Button, Input, Select} from "dracula-ui";
import PhaseDisplay from "./component/PhaseDisplay";
import {RoomContext, UsersContext} from "./App";
import img_life from "./img/life.png";
import {Box, Button} from "dracula-ui";
import {CustomSelect, CustomMenuItem, CustomListItemText} from "./component/Design";

function Player() {
  const {users, setUsers} = useContext(UsersContext);
  const {roomInfo, setRoomInfo} = useContext(RoomContext);
  const [myInfo, setMyInfo] = useState({})
  const {room, userId, token} = useParams();
  const navigate = useNavigate();
  const [upd, setUpd] = useState(0);
  const [actionLog, setActionLog] = useState([]);
  const [actionValue, setActionValue] = useState(0);
  const [inputAction, setInputAction] = useState(0);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const location = useLocation();

  useEffect(() => {
    var id = setInterval(() => {
      setUpd(v => v + 1);
    }, 500000);

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

  const TargetSelectFormat = (selected) => {
    switch(inputAction){
      case 7:
        return `裁定「${selected[0] ?? '?'}が${selected[1] ?? '?'}に戦闘を行った」`;
      case 5:
        return (ActionInfo[inputAction].Target? `${selected[0] ?? '?'}に対して`: '') + `魔力を${actionValue}消費して${ActionInfo[inputAction].Name}を行う`;
      default:
        return (ActionInfo[inputAction].Target? `${selected[0] ?? '?'}に対して`: '') + `${ActionInfo[inputAction].Name}を行う`;
    }
  }


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

  const MultiSelectTarget = () => {
    const handleChange = (event) => {
      setSelectedTargets(event.target.value); // 複数の値が配列で渡される
    };

    return (
      <FormControl variant="outlined" style={{ minWidth: 200 }}>
        <CustomSelect
          labelId="multi-select-label"
          multiple
          value={selectedTargets}
          onChange={handleChange}
          renderValue={selected => selected.join(',')} // 選択された値をコンマ区切りで表示
          label="複数選択"
          variant={"filled"}
        >
          {users && users.map(user => (
            <CustomMenuItem key={"user_select_" + user.USER_NAME} value={user.USER_NAME}>
              <Checkbox checked={selectedTargets.indexOf(user.USER_NAME) > -1} />
              <CustomListItemText primary={user.USER_NAME} />
            </CustomMenuItem>
          ))}
          {RoleInfo && Object.values(RoleInfo).map(role => (
            <CustomMenuItem key={"role_select_" + role} value={role}>
              <Checkbox checked={selectedTargets.indexOf(role) > -1} />
              <CustomListItemText primary={role} />
            </CustomMenuItem>
          ))}
        </CustomSelect >
      </FormControl>
    );
  };

  const PlayerInformation = (props) => {
    const [user,] = useState(props.player);
    console.dir(user);
    var index = props.index;

    const openPlayerPage = (token) => {
      navigate(`/${roomInfo.ROOM_ID}/${user.USER_ID}/${token}`);
    }

    return <Grid key={"player_info_" + index} item xs={6} className={"Square"}>
      {/*名前*/}
      <Grid item xs={12} className={"Item"} pt={"2px"}>
        {user.ROLE &&
          (<div>
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
            return <Grid xs={3} item key={'id_' + user.USER_ID}>
              <Typography color={(user.HP > 0) ? "white" : "red"}>
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
              <MultiSelectTarget/>
            </Grid>
            <Grid item xs={12}>
              <Input type={"number"} defaultValue={actionValue} onChange={(e) => {
                setActionValue(e.target.value)
              }}></Input>
            </Grid>
            {Object.entries(ActionInfo).filter(r => {
              return (r[1].Role.length === 0 || r[1].Role.find(v => v === roomInfo.PHASE)) && (r[1].Role.find(v => v === myInfo.ROLE));
            }).map(r => {
              return <Grid item key={"action_" + r[0]} xs={4}>
                <Button onClick={() => {
                  console.log("action: " + r[0])
                  console.log("inputAction: " + inputAction)
                  console.log("r[1].IDs: " + r[1].ID)
                  if(inputAction === r[1].ID){
                    setInputAction(0);
                  }else {
                    setInputAction(r[1].ID);
                  }
                  // api.SendAction(myInfo.USER_ID, r[1].ID, actionTarget, roomInfo.DAY, roomInfo.roomId).then(res => {
                  //   // setActionLog([])
                  // })
                }
                }>
                  <Typography>{r[1].Name}</Typography>
                </Button>
              </Grid>
            })}
            <Grid item xs={12}>
            {(inputAction !== 0) ? <Button onClick={
              () => {
                api.SendAction(myInfo.USER_ID, inputAction, selectedTargets, roomInfo.DAY, roomInfo.ROOM_ID).then(res => {
                  setActionLog([])
                })
              }
            }>
              {TargetSelectFormat(selectedTargets)}
            </Button> : <>{inputAction}</>}
            </Grid>
          </> : ''
        }
      </Grid>
      <Header/>
    </Box>
  );
}

export default Player;
