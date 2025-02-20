import img_life from './img/life.png';
import './App.css';
import React, {useContext, useEffect, useRef, useState} from "react";
import api from "./utils/api";
import {Box, Button} from 'dracula-ui';
// import { Input } from '@mui/material';
import {Link, useParams, useLocation, useNavigate} from 'react-router-dom'
import {DefaultHP, RoleInfo, TeamInfo} from "./utils/ArchiMagnaDefine";
import {Grid, Paper, Typography} from "@mui/material";
import PhaseDisplay, {PlayerLog} from "./component/PhaseDisplay";
import {RoomContext, UsersContext} from "./App";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function Master(props) {
  const {users, setUsers} = useContext(UsersContext);
  const {roomInfo, setRoomInfo} = useContext(RoomContext);
  const [loading, setLoading] = useState(0);
  const [actionLog, setActionLog] = useState([]);
  // const usersLife = useRef(Array(8).fill(0));
  const nameInputRefs = useRef([]);
  // const manaAddInputRefs = useRef([]);
  const autoReloadOnTeam = useRef(null);
  const [isTeamOrder, setTeamOrder] = useState(false);
  const {token} = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [upd, setUpd] = useState(0);
  const submitRef = useRef(null);

  const isWatcher = props.watcher;

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
    if (submitRef.current) {
      submitRef.current.disabled = true;
    }
    getActionLog();
  }, []);

  useEffect(() => {
    getActionLog();
  }, [upd])

  const toggleTeamOrder = () => {
    setTeamOrder(v => !v);
  }

  useEffect(() => {
    //陣営会議中は3秒ごとにリロード
      autoReloadOnTeam.current = setInterval(() => {
        if(roomInfo.PHASE === 1 || roomInfo.PHASE === 2 || roomInfo.PHASE === 3) {
          getActionLog()
        }
      }, 3000);

      return () => {
        clearInterval(autoReloadOnTeam.current);
      }
  }, [roomInfo.PHASE])


  useEffect(() => {
    if (token) {
      setLoading(v => v + 1)
      api.GetRoomInfo(token).then(r => {
        setLoading(v => v - 1)
        if (Object.keys(r.data).length !== 0) {
          setRoomInfo(r.data);
          setLoading(v => v + 1)
          api.GetActionLog(r.data.ROOM_ID).then(res => {
            setActionLog(res.data);
            setLoading(v => v - 1)
          })
        } else {
          console.error("対応する部屋が存在しない")
          navigate('/');
        }
      })
    }
  }, []);

  useEffect(() => {
    if (token) {
      setLoading(v => v + 1)
      api.GetRoomInfo(token).then(r => {
        setLoading(v => v - 1)
        if (Object.keys(r.data).length !== 0) {
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
    setLoading(v => v + 1)
    api.GetUserList(roomInfo.ROOM_ID).then(res => {
      setLoading(v => v - 1)
      setUsers(res.data.users)
    })
  }, [roomInfo]);

  const getActionLog = () => {
    if (!roomInfo.ROOM_ID) {
      return;
    }
    setLoading(v => v + 1)
    api.GetActionLog(roomInfo.ROOM_ID).then(res => {
      setLoading(v => v - 1)
      setActionLog(res.data);
    })
  }

  // const updateUserInfo = () => {
  //   if (!roomInfo.ROOM_ID) {
  //     return;
  //   }
  //   let _users = users;
  //   for (let i = 0; i < _users.length; ++i) {
  //     console.log(manaAddInputRefs.current[i].value)
  //     _users[i].MANA = +(manaAddInputRefs.current[i].value) ?? 0;
  //   }
  //   for (let i = 0; i < _users.length; ++i) {
  //     _users[i].HP = usersLife.current[i] ?? 0;
  //   }
  //   api.UpdateUserInfo(roomInfo.ROOM_ID, _users).then(res => {
  //     usersLife.current = (Array(8).fill(0));
  //     setUsers(res.data)
  //     getActionLog();
  //     submitRef.current.disabled = true;
  //   })
  // }

  function InputPlayerNames() {
    return (
      <Box p={"md"}>
        <Flex>
          {Array(8).fill(null).map((_, index) =>
            <div key={"name_input_" + index}>
              <label>
                <input
                  key={"name_input_text_" + index}
                  id={"name_input_text_" + index}
                  ref={(el) => (nameInputRefs.current[index] = el)}
                  placeholder={`Player ${index + 1}`}
                  defaultValue={`PC${index + 1} `}
                  type="text"
                  style={{width: '400px', margin: '10px auto'}}
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
        <Button
          m={"lg"} onClick={() => api.CreateRoom().then(r => {
          navigate("/gm/" + r.data.TOKEN);
        })}>新規ルームの作成
        </Button>
    </div>
  }

  function Header() {
    const fullPath = `${window.location.origin}${location.pathname}${location.search}${location.hash}`;
    const watcherFullPath = fullPath.replace("/gm/", "/watch/");

    function CopyUrl(path) {
      navigator.clipboard.writeText(path)
        .then(() => {
          console.log("Copied")
        })
        .catch((err) => {
          console.error('コピーエラー:', err);
        });
    }

    return <header className="App-header">
      {isWatcher ?
        <h1 style={{paddingTop: "30px"}}>ArchiMagna</h1>:
      <h1 style={{paddingTop: "30px"}}>ArchiMagna GM</h1>}
      {token && !isWatcher ?
          <>
          <div style={{margin: "10px"}}>GM用URL</div>
          <Box onClick={() => CopyUrl(fullPath)} className={"drac-d-flex"} style={{margin: "auto", width: "50%", cursor: 'pointer'}}>
            <input id={"gm_url"} readOnly={true} type={"text"} style={{cursor: 'pointer'}} value={fullPath}></input>
            <ContentCopyIcon color={"gray"} style={{marginLeft: "-40px", marginTop: "8px"}}/>
          </Box>
        <div style={{margin: "10px"}}>観戦用URL</div>
        <Box onClick={() => CopyUrl(watcherFullPath)} className={"drac-d-flex"} style={{margin: "auto", width: "50%", cursor: 'pointer'}}>
            <input id={"gm_url"} readOnly={true} type={"text"} style={{cursor: 'pointer'}} value={watcherFullPath}></input>
            <ContentCopyIcon color={"gray"} style={{marginLeft: "-40px", marginTop: "8px"}}/>
          </Box>
        </> : ''}
    </header>
  }

  const playerFullUrl = (user_id, token) => {
    return `${window.location.origin}/pl/${roomInfo.ROOM_ID}/${user_id}/${token}`;
  }

  const playerUrl = (user_id, token) => {
    return `/pl/${roomInfo.ROOM_ID}/${user_id}/${token}`;
  }

  function RegisterUsers() {
    if (!roomInfo?.ROOM_ID) {
      return;
    }
    if (roomInfo.ROOM_ID) {
      api.AddUser(nameInputRefs.current.map(v => v.value), roomInfo.ROOM_ID).then(res => {
        setUsers(res.data)
      })
    } else {
      console.log("no room info")
    }
  }

  const PlayerInformation = (props) => {
    const [user,] = useState(props.player);
    let index = props.index;

    return <Grid key={"player_info_" + user.USER_ID} container spacing={"xxs"} className={"Square"}>
      {/*名前*/}
      <Grid item xs={12} className={"Item"}>
        {user.ROLE &&
          (<div>
            <Box color={TeamInfo[user.TEAM].Color} m={"xxs"}>
              <Paper className={"drac-d-inline-flex"}
                     sx={{borderRadius: "10px", padding: "0 10px", backgroundColor: TeamInfo[user.TEAM].Color}}>
                <Typography variant={"h6"} color={user.HP > 0 ? "black" : "red"}
                            className={"text-outline drac-d-inline"}>
                  {user.USER_ORDER + 1}［{RoleInfo[user.ROLE]}］{user.USER_NAME}
                </Typography>
                {!isWatcher && <div className={"pointer"} color="gray" title={"プレイヤー用URLをクリップボードにコピー"}
                     onClick={() => CopyText(`${user.USER_NAME}：` + playerFullUrl(user.USER_ID, user.TOKEN))}>
                  <ContentCopyIcon color={"gray"} fontSize={"xs"} style={{marginTop: "8px", marginLeft: "10px"}}/>
                </div>}
              </Paper>
              <Box color={"black"}>
                <span>{TeamInfo[user.TEAM].Name}ツイン・{user.ROLE <= 4? "主": "従"}</span>
              </Box>
            </Box>
          </div>)}
        {!user.ROLE &&
          (<Typography fontSize={"x-large"}>{index + 1}：{user.USER_NAME}</Typography>)}
        {/*<Box className={"drac-d-flex"}>*/}
        {/*  <Box className={"drac-text-left"} p={"xs"}>HP :*/}
        {/*    {Array(DefaultHP).fill(null).map((_, lifeIndex) => <img src={img_life} width={"25px"}*/}
        {/*                                                            style={{marginTop: "0px", marginLeft: "4px"}}*/}
        {/*                                                            key={`life_${user.USER_ID}_${lifeIndex}`}*/}
        {/*                                                            className={(lifeIndex < (user.HP + usersLife.current[index]) ? "life_img" : "life_img_dead") + " pointer"}*/}
        {/*                                                            onClick={(event) => {*/}
        {/*                                                              if(lifeIndex < (user.HP + usersLife.current[index] - 1) || lifeIndex > (user.HP + usersLife.current[index])){*/}
        {/*                                                                return;*/}
        {/*                                                              }*/}
        {/*                                                              if (lifeIndex < (user.HP + usersLife.current[index])) {*/}
        {/*                                                                usersLife.current[index] -= 1;*/}
        {/*                                                                event.target.style.filter = "grayscale(100%)";*/}
        {/*                                                              } else {*/}
        {/*                                                                event.target.style.filter = "grayscale(0)";*/}
        {/*                                                                usersLife.current[index] += 1;*/}
        {/*                                                              }*/}
        {/*                                                              // setRewritten(true);*/}

        {/*                                                              submitRef.current.disabled = false;*/}
        {/*                                                              console.log(users)*/}
        {/*                                                            }}/>)}*/}

        {/*    魔力 ： <Typography className={"drac-d-inline"} color={"white"}*/}
        {/*                       fontSize={"x-large"}>{user.MANA}</Typography> +*/}
        {/*    <input*/}
        {/*      id={"mana_input_" + index}*/}
        {/*      ref={(el) => (manaAddInputRefs.current[index] = el)}*/}
        {/*      defaultValue={manaAddInputRefs.current[index]}*/}
        {/*      type="number"*/}
        {/*      style={{*/}
        {/*        fontSize: "x-large",*/}
        {/*        width: '80px',*/}
        {/*        padding: '4px',*/}
        {/*        backgroundColor: 'var(--blackTernary)',*/}
        {/*        color: 'var(--blackSecondary)',*/}
        {/*        borderRadius: '10%'*/}
        {/*      }}*/}
        {/*      onChange={event => {*/}
        {/*        manaAddInputRefs.current[index].value = event.target.value;*/}
        {/*        console.log(+event.target.value)*/}
        {/*        if (+(event.target.value) !== 0) {*/}
        {/*          submitRef.current.disabled = false;*/}
        {/*        }*/}
        {/*      }}*/}
        {/*    />*/}
        {/*  </Box>*/}
        {/*</Box>*/}
      </Grid>
      <Grid item xs={12}>
        <Box>
          <PlayerLog player={users[index]} log={actionLog.filter(v => v.USER_ID === user.USER_ID)} users={users} />
        </Box>
      </Grid>
    </Grid>
  }

  const OnNextPhase = () => {
    api.NextPhase(roomInfo.ROOM_ID).then(r => {
      if (Object.keys(r.data).length > 0) {
        setRoomInfo(r.data);
        getActionLog();
      } else {
        console.error("対応する部屋が存在しない")
        navigate('/');
      }
    })
  }

  const OnNBackPhase = () => {
    api.BackPhase(roomInfo.ROOM_ID).then(r => {
      if (Object.keys(r.data).length > 0) {
        setRoomInfo(r.data);
        getActionLog();
      } else {
        console.error("対応する部屋が存在しない")
        navigate('/');
      }
    })
  }

  function NameToPlayer(name){
    return users.find(row => row.USER_NAME === name);
  }

  function OrderToPlayer(order){
    return users.find(row => row.USER_ORDER === order);
  }

  function IDToPlayer(order){
    return users.find(row => row.USER_ID === order);
  }

  function LogTextArea({logList, day}) {
    if(users.length === 0){
      return <></>;
    }
    function IsTwinCheck(pl1, pl2) {
      let team1 = pl1?.TEAM;
      let team2 = pl2?.TEAM;
      if(team1 === null || team2 === null){
        return false;
      }
      return team1 === team2;
    }

    let zekketsuResult =
      [ {Win: 0, Miss: 0, Lose: 0},
        {Win: 0, Miss: 0, Lose: 0},
        {Win: 0, Miss: 0, Lose: 0},
        {Win: 0, Miss: 0, Lose: 0},
        {Win: 0, Miss: 0, Lose: 0},
        {Win: 0, Miss: 0, Lose: 0},
        {Win: 0, Miss: 0, Lose: 0},
        {Win: 0, Miss: 0, Lose: 0},
      ];
    let outputLog = "";
    let dailyLog = logList.filter(v => v.DAY === day);
    //絶結成否を先に全部計算
    let zekketsuLog = dailyLog.filter(v => v.ACTION_ID === 8);
    zekketsuLog.forEach(row => {
      let targets = JSON.parse(row.ACTION_TARGET);
      var me = IDToPlayer(row.USER_ID);
      var t0 = NameToPlayer(targets[0]);
      var t1 = NameToPlayer(targets[1]);
      if(IsTwinCheck(t0, t1)){
        zekketsuResult[t0.USER_ORDER]["Lose"] += 1;
        zekketsuResult[t1.USER_ORDER]["Lose"] += 1;

        zekketsuResult[me.USER_ORDER]["Win"] += 1;
      }else{
        zekketsuResult[me.USER_ORDER]["Miss"] += 1;
      }
    })

    //8人ID順に
    for(let i = 0; i < 8; ++i){
      let playerInfo = OrderToPlayer(i);
      let playerRow = Array(10).fill("");
      let row = dailyLog.findLast(r => r.USER_ID === playerInfo.USER_ID && r.ACTION_ID === 8);
      if(row) {  //絶結使用
        let targets = JSON.parse(row.ACTION_TARGET);
        let target = [NameToPlayer(targets[0]), NameToPlayer(targets[1])];
        playerRow[0] = target[0].USER_ORDER + 1;
        playerRow[1] = target[1].USER_ORDER + 1;
      }
      playerRow[2] = (zekketsuResult[i]["Win"] * 6)
      playerRow[3] = (zekketsuResult[i]["Miss"] * -6);
      if(playerInfo.ROLE <= 4){
        playerRow[3] += (zekketsuResult[i]["Lose"] * -8);
      }else{
        playerRow[4] += (zekketsuResult[i]["Lose"] * -1);
      }

      //護衛：-5
      if(dailyLog.findLast(r => r.USER_ID === playerInfo.USER_ID && r.ACTION_ID === 13)){
        playerRow[5] = -5;
      }
      if(dailyLog.findLast(r => r.USER_ID === playerInfo.USER_ID && r.ACTION_ID === 1)){
        playerRow[6] = "察";
        playerRow[7] = -1;
      }
      if(dailyLog.findLast(r => r.USER_ID === playerInfo.USER_ID && r.ACTION_ID === 2)){
        playerRow[6] = "凝";
        playerRow[7] = -4;
      }
      if(dailyLog.findLast(r => r.USER_ID === playerInfo.USER_ID && r.ACTION_ID === 3)){
        playerRow[6] = "忠";
        playerRow[7] = -4;
      }
      if(dailyLog.findLast(r => r.USER_ID === playerInfo.USER_ID && r.ACTION_ID === 4)){
        playerRow[6] = "見";
        playerRow[7] = -1;
      }
      if(dailyLog.findLast(r => r.USER_ID === playerInfo.USER_ID && r.ACTION_ID === 11)){
        playerRow[8] = "t";
        playerRow[9] = -1;
      }

      outputLog += `${playerRow.join("\t")}\r\n`;
    }
    return (
      <Box className={"flex"} style={{flexDirection: "column"}}>
        <h3
          onClick={() => navigator.clipboard.writeText(outputLog)}
          style={{cursor: 'pointer'}}>(Q{3 + day * 11 - 11}~Z{10 + day * 11 - 11})
          <ContentCopyIcon color={"gray"} style={{marginLeft: "20px", marginTop: "8px"}}/></h3>
        <textarea readOnly={true}
                  className={"CopyTextArea"}
                  value={outputLog}>
        </textarea>
      </Box>
    )
  }

  function LogTextArea2({logList, day}) {
    if(users.length === 0){
      return <></>;
    }

    let outputLog = "";
    let dailyLog = logList.filter(v => v.DAY === day);

    //8人ID順に
    for(let i = 0; i < 8; ++i){
      let playerInfo = OrderToPlayer(i);
      let playerRow = Array(2).fill("");
      let row = dailyLog.findLast(r => r.USER_ID === playerInfo.USER_ID && r.ACTION_ID === 8);

      //裁定
      row = dailyLog.findLast(r => r.USER_ID === playerInfo.USER_ID && r.ACTION_ID === 5);
      if(row) {
        let targets = JSON.parse(row.ACTION_TARGET);
        let target = [NameToPlayer(targets[0]), NameToPlayer(targets[1])];
        playerRow[0] = target[0].USER_ORDER + 1;
        playerRow[1] = target[1].USER_ORDER + 1;
      }

      outputLog += `${playerRow.join("\t")}\r\n`;
    }
    return (
      <Box className={"flex"} style={{flexDirection: "column"}}>
        <h3
          onClick={() => navigator.clipboard.writeText(outputLog)}
          style={{cursor: 'pointer'}}>(AA{3 + day * 11 - 11}~AB{10 + day * 11 - 11})
          <ContentCopyIcon color={"gray"} style={{marginLeft: "20px", marginTop: "8px"}}/></h3>
        <textarea readOnly={true}
                  className={"CopyTextArea"}
                  value={outputLog}>
        </textarea>
      </Box>
    )
  }
  function LogTextArea3({logList, day}) {
    if(users.length === 0){
      return <></>;
    }

    let outputLog = "";
    let dailyLog = logList.filter(v => v.DAY === day);

    //8人ID順に
    for(let i = 0; i < 8; ++i){
      let playerInfo = OrderToPlayer(i);
      let playerRow = Array(10).fill("");
      //こはく
      let rows = dailyLog.filter(r => r.USER_ID === playerInfo.USER_ID && r.ACTION_ID === 6).slice(-3);
       Object.entries(rows).forEach(([index, row]) => {
          let targets = JSON.parse(row.ACTION_TARGET);
          let target = [NameToPlayer(targets[0]), targets[1]];
          playerRow[0 + index * 3] = target[0].USER_ORDER + 1;
          playerRow[1 + index * 3] = target[1];
          if(RoleInfo[target[0].ROLE] === target[1]){
            playerRow[2 + index * 3] = 4;
          }else{
            playerRow[2 + index * 3] = -2;
          }
      })
      outputLog += `${playerRow.join("\t")}\r\n`;
    }
    return (
      <Box className={"flex"} style={{flexDirection: "column"}}>
        <h3
          onClick={() => navigator.clipboard.writeText(outputLog)}
          style={{cursor: 'pointer'}}>(AE{3 + day * 11 - 11}~AM{10 + day * 11 - 11})
          <ContentCopyIcon color={"gray"} style={{marginLeft: "20px", marginTop: "8px"}}/></h3>
        <textarea readOnly={true}
                  className={"CopyTextArea"}
                  value={outputLog}>
        </textarea>
      </Box>
    )
  }
  function LogTextArea4({logList, day}) {
    if(users.length === 0){
      return <></>;
    }

    let outputLog = "";
    let dailyLog = logList.filter(v => v.DAY === day);

    //8人ID順に
    for(let i = 0; i < 8; ++i){
      let playerInfo = OrderToPlayer(i);
      let playerRow = Array(2).fill("");
      //戦闘力
      let row = dailyLog.findLast(r => r.USER_ID === playerInfo.USER_ID && r.ACTION_ID === 7);
      if(row) {
        let targets = JSON.parse(row.ACTION_TARGET);
        let target = [NameToPlayer(targets[0]), targets[1]];
        playerRow[0] = target[1];
        playerRow[1] = target[0].USER_ORDER + 1;;
      }
      outputLog += `${playerRow.join("\t")}\r\n`;
    }
    return (
      <Box className={"flex"} style={{flexDirection: "column"}}>
        <h3
          onClick={() => navigator.clipboard.writeText(outputLog)}
          style={{cursor: 'pointer'}}>(AT{3 + day * 11 - 11}~AU{10 + day * 11 - 11})
          <ContentCopyIcon color={"gray"} style={{marginLeft: "20px", marginTop: "8px"}}/></h3>
        <textarea readOnly={true}
                  className={"CopyTextArea"}
                  value={outputLog}>
        </textarea>
      </Box>
    )
  }

  return (
    <Box className="App" style={{width: "700px"}} m={"auto"}>
      <Header/>
      {/*<PopupOnCursor/>*/}
      <Box className={"Controller"}>
        <Button onClick={toggleTeamOrder}>
          並び替え
        </Button>
        {/*<Button*/}
        {/*  ref={submitRef}*/}
        {/*  onClick={() => {*/}
        {/*    updateUserInfo();*/}
        {/*  }}>HPと魔力を更新</Button>*/}
        <Button onClick={getActionLog}>ログ再取得</Button>
        {!isWatcher ?
        <Button onClick={OnNBackPhase} mx={"auto"} color={"orange"}
        disabled={roomInfo.DAY === 0 || (roomInfo.DAY === 1 && roomInfo.PHASE === 1)}
        >
          <>戻す</>
        </Button>
          : ''}
        {users.length > 0 && !isWatcher ?
          <Button onClick={OnNextPhase} mx={"auto"} color={"red"}>
            {roomInfo.DAY > 0 ? <>進める</> : <>開始</>}
          </Button> : ''}
      </Box>
      <PhaseDisplay roomInfo={roomInfo}/>
      <Box style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        width: "700px",
        // resize: "both",
        margin: "30px auto"
      }}>
        {users.length > 0 && roomInfo.DAY === 0 && !isWatcher &&
          (<>
            <Button style={{
              margin: "30px auto"
            }} m={"lg"} onClick={() => api.SetRoleAutomated(roomInfo.ROOM_ID).then(() => {
              api.GetUserList(roomInfo.ROOM_ID).then(res => {
                setUsers(res.data.users)
              })
            })}>ロールの自動割り当て</Button>
          </>)}
        {users.length > 0 ?
          (
            <Grid container spacing={2} className={"Square Players"}>
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
          (isWatcher? "": <form style={{width: "100%", margin: "auto"}}>
            <>プレイヤーの名前を入力</>
            <InputPlayerNames/>
            <Button m={"xs"} onClick={(event) => {
              for (let i = 0; i < nameInputRefs.current.length; ++i) {
                if (nameInputRefs.current[i].value === "") {
                  return;
                }
              }
              event.preventDefault();
              RegisterUsers();
            }}>プレイヤー名登録
            </Button>
          </form>)}
        </Box>

      <h2 style={{padding: "15px"}}>タイムライン</h2>
      <Box className={"SquareFull ScrollBox"}>
        <PlayerLog player={{USER_ID: "master"}} log={actionLog} users={users}/>
      </Box>

      {isWatcher? "":
      <><h2 style={{padding: "15px"}}>コピー用ログ</h2>
      {Array(roomInfo.DAY).fill(null).map(
        (_, index) => {
          return (
            <div key={"logArea_" + (index + 1)}>
              <h2>{index + 1}日目</h2>
              <Box className={"drac-d-inline-flex"}>
                <LogTextArea key={"logArea1_" + (index + 1)} logList={actionLog} day={index + 1}/>
                <LogTextArea2 key={"logArea2_" + (index + 1)} logList={actionLog} day={index + 1}/>
                <LogTextArea3 key={"logArea3_" + (index + 1)} logList={actionLog} day={index + 1}/>
                <LogTextArea4 key={"logArea4_" + (index + 1)} logList={actionLog} day={index + 1}/>
              </Box>
            </div>)
        }
      )}</>
      }
      {/*<div>*/}
      {/*  <Button m={"lg"} onClick={api.TruncateAll}>TruncateAll</Button>*/}
      {/*</div>*/}
      <Box mb={"lg"} style={{paddingBottom: "200px"}}></Box>
    </Box>
  );
}


function Flex(props) {
  return (
    <div style={{
      // display: "flex",
      // flexDirection: "column",
      // flexWrap: "wrap",
      width: "100%",
      height: "500px",
      margin: "auto",
    }}>{props.children}
    </div>
  )
}