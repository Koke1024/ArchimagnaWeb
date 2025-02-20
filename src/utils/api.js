import axios from "axios";

const baseURL = "/api";

class ApiClass{
  constructor(){
    axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
    axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

    axios.interceptors.request.use(request => {
      return request
    })

    axios.interceptors.response.use(response => {
      return response
    })

  }
  AddUser(names, roomId, order){
    let param = {
      USER_NAMES: names,
      ROOM_ID: roomId,
    }
    return axios.post(baseURL + '/user/add', param);
  }

  GetUserList(roomId){
    let param = {
      ROOM_ID: roomId,
      MASTER: 1
    }
    return axios.get(baseURL + '/user/list', {params: param});
  }

  GetUserNames(roomId, userToken){
    let param = {
      ROOM_ID: roomId,
      TOKEN: userToken,
      MASTER: 0
    }
    return axios.get(baseURL + '/user/list', {params: param});
  }

  GetUserInfo(userId, token){
    let param = {
      USER_ID: userId,
      TOKEN: token,
    }
    return axios.get(baseURL + '/user/info', {params: param});
  }

  TestApi(){
    return axios.get(baseURL + '/test');
  }

  CreateRoom(){
    return axios.post(baseURL + '/room/create');
  }
  // GetRoomInfo(roomId){
  //   let param = {
  //     ROOM_ID: roomId,
  //   }
  //   return axios.post(baseURL + '/room/info', param);
  // }

  GetRoomInfo(roomToken){
    let param = {
      TOKEN: roomToken,
    }
    return axios.get(baseURL + '/room/info', {params: param});
  }
  GetRoomInfoFromUser(userId, userToken){
    let param = {
      USER_ID: userId,
      TOKEN: userToken,
    }
    return axios.get(baseURL + '/room/info_by_user', {params: param});
  }
  SetRoleAutomated(roomId){
    let param = {
      ROOM_ID: roomId,
    }
    return axios.post(baseURL + '/room/assign/auto', param);
  }

  NextPhase(roomId){
    let param = {
      ROOM_ID: roomId,
      BACK: false,
    }
    return axios.post(baseURL + '/room/next', param);
  }

  BackPhase(roomId){
    let param = {
      ROOM_ID: roomId,
      BACK: true,
    }
    return axios.post(baseURL + '/room/next', param);
  }

  SendAction(userId, action, target, day, roomId){
    let param = {
      USER_ID: userId,
      ACTION_ID: action,
      TARGET: target,
      DAY: day,
      ROOM_ID: roomId,
    }
    return axios.post(baseURL + '/game/action', param);
  }

  GetActionLog(roomId){
    let param = {
      ROOM_ID: roomId
    }
    return axios.get(baseURL + '/game/log', {params: param});
  }

  GetUserActionLog(roomId, userId){
    let param = {
      ROOM_ID: roomId,
      USER_ID: userId
    }
    return axios.get(baseURL + '/game/log_user', {params: param});
  }

  UpdateUserInfo(roomId, users){
    let usersList = {};
    for(let i = 0; i < users.length; i++){
      usersList[i] = {};
      usersList[i].USER_ID = users[i].USER_ID;
      usersList[i].HP = users[i].HP;
      usersList[i].MANA = users[i].MANA;
    }
    let param = {
      ROOM_ID: roomId,
      USERS: usersList,
    }
    return axios.post(baseURL + '/user/update', param);
  }

  TruncateAll(){
    return axios.post(baseURL + '/truncate');
  }
}

let api = new ApiClass();
export default api;