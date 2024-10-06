import logo from './img/archi_magna.png';
import './App.css';
import React, {useContext, useEffect, useState} from "react";
import api from "./api/api";
import {useNavigate, useParams} from "react-router-dom";
import {ActionInfo, DefaultHP, RoleInfo, TeamInfo} from "./api/ArchiMagnaDefine";
import {Grid, Typography} from "@mui/material";
import {Box} from "dracula-ui";
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


  const PlayerInformation = (props) => {
    const [user,] = useState(props.player);
    console.dir(user);
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


        {users && users.map(user => {
          return <Box key={'id_' + user.USER_ID}>{user.USER_NAME}</Box>
        })}

        {myInfo ?
          <><Grid item xs={3}></Grid>
          <Grid item xs={6} md={6}>現在可能なアクション
            {Object.entries(ActionInfo).filter(r => {
              return (r[1].Role.length === 0 || r[1].Role.find(v => v === roomInfo.PHASE)) && (r[1].Role.find(v => v === myInfo.ROLE));
            }).map(r => {
              return <Grid key={"action_" + r[0]}>{r[1].Name}</Grid>
            })}
          </Grid></> : ''
        }
      </Grid>
    </Box>
  );
}

export default Player;
