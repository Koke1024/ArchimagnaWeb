import './App.css';
import React, {useContext, useEffect, useRef, useState} from "react";
import api from "./utils/api";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {ActionInfo, RoleInfo, TargetSelectFormat, TeamInfo} from "./utils/ArchiMagnaDefine";
import {
  Checkbox,
  Grid, Paper,
  Typography
} from "@mui/material";
import PhaseDisplay, {PlayerLog} from "./component/PhaseDisplay";
import {RoomContext, UsersContext} from "./App";
import {Box, Button} from "dracula-ui";
import {CustomInput, CustomMenu, CustomMenuItem, CustomListItemText} from "./component/Design";
import ConfirmDialog from './component/Dialog';
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

function Player() {
  const {users, setUsers} = useContext(UsersContext);
  const {roomInfo, setRoomInfo} = useContext(RoomContext);
  const [myInfo, setMyInfo] = useState({})
  const {room, userId, token} = useParams();
  const navigate = useNavigate();
  const [upd, setUpd] = useState(0);
  const [actionLog, setActionLog] = useState([]);
  const [actionValue, setActionValue] = useState('');
  const [inputAction, setInputAction] = useState(0);
  const selectedTargets = useRef([]);
  const location = useLocation();
  const [openDialog, setOpenDialog] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const warningParameter = useRef({});

  const handleOpen = () => {
    setOpenDialog(true); // ダイアログを開く
  };

  const handleClose = (cb) => {
    setOpenDialog(false); // ダイアログを閉じる
  };

  const handleConfirm = (cb) => {
    cb();
    setOpenDialog(false); // 確認後にダイアログを閉じる
  };

  const getActionLog = () => {
    if (!roomInfo.ROOM_ID) {
      console.log("no room id");
      return;
    }
    if (!myInfo.USER_ID) {
      console.log("no user id");
      return;
    }
    api.GetUserActionLog(roomInfo.ROOM_ID, myInfo.USER_ID).then(res => {
      console.log(res.data)
      setActionLog(res.data);
    })
  }

  useEffect(() => {
    if (token) {
      api.GetRoomInfoFromUser(userId, token).then(r => {
        console.dir(r.data)
        if (Object.keys(r.data).length > 0) {
          setRoomInfo(r.data);
        } else {
          console.error("対応する部屋が存在しない")
          navigate('/');
        }
        getActionLog();
      })
    }
  }, [token, upd]);

  useEffect(() => {
    if (!userId || !token) {
      return;
    }
    api.GetUserNames(userId, token).then(() => {
      api.GetUserInfo(userId, token).then(r => setMyInfo(r.data))
    })
  }, [token, userId])

  useEffect(() => {
    if (!roomInfo?.ROOM_ID) {
      return;
    }
    api.GetUserNames(roomInfo.ROOM_ID).then(res => {
      setUsers(res.data)
    })
  }, [roomInfo]);


  function Header() {
    const fullPath = `${window.location.origin}/gm/${roomInfo.TOKEN}/`;

    function CopyUrl() {
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
    const [anchorEl, setAnchorEl] = useState(null);
    const [displayTargets, setDisplayTargets] = useState([]);

    const handleChange = (value) => {
      let prevValues = selectedTargets.current;
      if (selectedTargets.current.includes(value)) {
        selectedTargets.current = prevValues.filter((item) => item !== value);
      } else {
        selectedTargets.current = [...prevValues, value];
      }
      setDisplayTargets(selectedTargets.current);
    };

    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
      setUpd(v => v + 1);
    };

    return (
      <>
        対象選択 <Button variant="normal"
                         onClick={handleClick}>
        {selectedTargets.current.length > 0 ? selectedTargets.current.join(', ') : '対象選択'}
      </Button>
        <br/>

        <CustomMenu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          open={Boolean(anchorEl)}
          onClose={event => {
            event.stopPropagation();
            handleClose()
          }}
        >
          {users && users.map(user => (
            <CustomMenuItem key={"user_select_" + user.USER_ID} value={user.USER_NAME}
                            onClick={(event) => {
                              // event.stopPropagation();
                              handleChange(user.USER_NAME);
                            }}
            >
              <Checkbox checked={selectedTargets.current.indexOf(user.USER_NAME) > -1}/>
              <CustomListItemText primary={user.USER_NAME}/>
            </CustomMenuItem>
          ))}
          {RoleInfo && Object.values(RoleInfo).map(role => (
            <CustomMenuItem key={"role_select_" + role} value={role}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleChange(role);
                            }}>
              <Checkbox checked={selectedTargets.current.indexOf(role) > -1}/>
              <CustomListItemText primary={role}/>
            </CustomMenuItem>
          ))}
        </CustomMenu>
        {/*</CustomSelect >*/}
        {/*</FormControl>*/}
      </>
    );
  };

  const PlayerInformation = (props) => {
    const [user,] = useState(props.player);
    // console.dir(user);
    var index = props.index;

    const openPlayerPage = (token) => {
      navigate(`/${roomInfo.ROOM_ID}/${user.USER_ID}/${token}`);
    }

    return <Grid key={"player_info_" + index} item xs={6} className={"Item"} >
      {/*名前*/}
        {user.ROLE &&
          (<div>
            <Box color={TeamInfo[user.TEAM].Color} m={"xxs"}>
              <Paper className={"drac-d-inline-flex"}
                     sx={{borderRadius: "10px", padding: "0 10px", backgroundColor: TeamInfo[user.TEAM].Color}}>
                <Typography variant={"h6"} color={user.HP > 0 ? "black" : "red"}
                            className={"text-outline drac-d-inline"}>
                  ［{RoleInfo[user.ROLE]}］{user.USER_NAME}
                </Typography>
              </Paper>
              <Box color={"black"}>
                <span>{TeamInfo[user.TEAM].Name}ツイン</span>
              </Box>
            </Box>
          </div>)}
        {!user.ROLE &&
          (<Typography fontSize={"x-large"}>{user.USER_NAME}</Typography>)}
        {/*<Box>HP：*/}
        {/*  {Array(DefaultHP).fill(null).map((_, lifeIndex) => <img src={img_life} width={"30px"}*/}
        {/*                                                          style={{marginTop: "0px"}}*/}
        {/*                                                          key={`life_${user.USER_ID}_${lifeIndex}`}*/}
        {/*                                                          className={(lifeIndex < user.HP ? "life_img" : "life_img_dead")}/>)}</Box>*/}
        {/*<Box>*/}
        {/*  魔力：{user.MANA}*/}
        {/*</Box>*/}
    </Grid>
  }

  if (!token) {
    return <>no token</>
  }

  const EnableAction = () => {
    return Object.entries(ActionInfo).filter(r => {
      return (r[1].Role.length === 0 || (r[1].Role.find(v => v === myInfo.ROLE)));
    });
  }

  const IsActiveAction = (id) => {
    return (ActionInfo[id]["Phase"].includes(roomInfo.PHASE));
  }

  return (
    <Box className="App" style={{width: "700px", paddingBottom: "100px"}} m={"auto"}>
      <header className="App-header">
        <h1 style={{paddingTop: "30px"}}>ArchiMagna</h1>
        <h2 style={{margin: "10px"}}>プレイヤー用ページ</h2>
        <PhaseDisplay roomInfo={roomInfo}/>
        <Grid item xs={12} mt={"10px"}>
          <Button onClick={() => setUpd(v => v + 1)}>情報更新</Button>
        </Grid>
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

        {/*<Grid item xs={12}><Typography>プレイヤー：</Typography></Grid>*/}
        {/*{users && users.map(user => {*/}
        {/*  return <Grid xs={3} item key={'id_' + user.USER_ID}>*/}
        {/*    <Paper><Typography py={"5px"}>*/}
        {/*      ［{user.USER_NAME}］*/}
        {/*    </Typography>*/}
        {/*    </Paper>*/}
        {/*  </Grid>*/}
        {/*})}*/}

        {myInfo ?
          <><Grid item xs={3}></Grid>
            <Grid item xs={6} md={6}>
              <Typography>
                行うアクション
              </Typography>
            </Grid>
            <Grid item xs={3}></Grid>
            {EnableAction().map(r => {
              return <Grid item key={"action_" + r[0]} xs={2}>
                <Button
                  style={(IsActiveAction(r[1].ID) && r[1].ID === inputAction)? {borderStyle: "solid", borderWidth: "5px", borderColor: "white"}: {}}
                  // style={IsActiveAction(r[1].ID) === inputAction? {borderStyle: "solid", borderWidth: "5px", borderColor: "white"}: {}}
                  variant={IsActiveAction(r[1].ID) ? "normal" : "ghost"}
                  disabled={!IsActiveAction(r[1].ID)}
                  onClick={() => {
                    if (inputAction === r[1].ID) {
                      // setInputAction(0);
                    } else {
                      setInputAction(r[1].ID);
                    }
                  }
                  }
                title={r[1].Description}>
                  <Typography>{r[1].Name}</Typography>
                </Button>
              </Grid>
            })}
            <Grid item xs={12}>
              <MultiSelectTarget/>
            </Grid>
            {inputAction === 7 ?
              <Grid item xs={12}>
                消費魔力 ：
                <CustomInput
                  type={"number"} defaultValue={actionValue} onChange={(e) => {
                  setActionValue(e.target.value)
                }}></CustomInput>
              </Grid> : <></>
            }
            {(inputAction === 11 || inputAction === 12) ?
              <Grid item xs={12}>
                {(inputAction === 11)? "伝言": "命約"}内容 ：
                <CustomInput
                  fullWidth
                  type={"text"} defaultValue={actionValue} onChange={(e) => {
                  setActionValue(e.target.value)
                }}></CustomInput>
              </Grid> : <></>
            }
            <Grid item xs={12}>
              {(inputAction !== 0 && IsActiveAction(inputAction)) ?
                <>
                  <Button variant="contained" color="red" onClick={handleOpen} disabled={TargetSelectFormat(selectedTargets.current, inputAction, actionValue).includes("?")}>
                    {TargetSelectFormat(selectedTargets.current, inputAction, actionValue)}
                  </Button>
                  <ConfirmDialog
                    open={openDialog}
                    onClose={handleClose}
                    title={"以下のアクションを実行しますか？"}
                    onConfirm={() => {
                      handleConfirm(() => {
                        if (inputAction === 7) {
                          if(actionValue.length === 0 || parseInt(actionValue) < 1){
                            setShowWarning(true);
                            warningParameter.current = {title: "", message: "攻撃には1以上の魔力の消費が必要です。"}
                            return;
                          }
                          selectedTargets.current[1] = actionValue;
                        }
                        if ((inputAction === 11 || inputAction === 12)) {
                          selectedTargets.current = Object.values({actionValue, ...selectedTargets.current});
                        }
                        if(inputAction === 6){
                          if(actionLog.find(r => r.ACTION_ID === 6 && JSON.parse(r.ACTION_TARGET)[0] === selectedTargets.current[0])){
                            console.log("同一対象に呼剥使用済み");
                            setShowWarning(true);
                            warningParameter.current = {title: "", message: "同じプレイヤーに複数回呼剥を行うことはできません。"}
                            return;
                          }
                        }
                        if(inputAction === 8){
                          if(actionLog.find(r => r.ACTION_ID === 8)){
                            console.log("絶結使用済み");
                            setShowWarning(true);
                            warningParameter.current = {title: "", message: "絶結はゲーム中一度しか行えません。"}
                            return;
                          }
                        }
                        api.SendAction(myInfo.USER_ID, inputAction, JSON.stringify(selectedTargets.current), roomInfo.DAY, roomInfo.ROOM_ID).then(res => {
                          setInputAction(0);
                          setActionValue("");
                          selectedTargets.current = [];
                          setUpd(v => v + 1);
                          getActionLog();
                        })
                      })
                    }}
                    message={TargetSelectFormat(selectedTargets.current, inputAction, actionValue)}
                  />
                </>
                : <></>}
            </Grid>
          </> : ''
        }
        <Grid item xs={12}>
          <Box className={"SquareFull"}>
            <PlayerLog player={myInfo} log={actionLog}/>
          </Box>
        </Grid>
      </Grid>
        <ConfirmDialog
        open={showWarning}
        onClose={() => {setShowWarning(false); warningParameter.current = {};}}
        title={warningParameter.current.title}
        onConfirm={() => {setShowWarning(false); warningParameter.current = {};}}
        message={warningParameter.current.message}
        simple={true}
      />
      {/*<Header/>*/}

    </Box>
  );
}

export default Player;
