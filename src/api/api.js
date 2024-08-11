import axios from "axios";

const baseURL = "http://localhost:8080";

class ApiClass{
  constructor(){
    axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
    axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

    axios.interceptors.request.use(request => {
      console.log('Starting Request: ', request)
      return request
    })

    axios.interceptors.response.use(response => {
      console.log('Response: ', response)
      return response
    })

  }
  AddUser(names, roomId){
    let param = {
      USER_NAMES: names,
      ROOM_ID: roomId,
    }
    return axios.post(baseURL + '/user/add', param);
  }

  GetUserList(roomId){
    let param = {
      ROOM_ID: roomId
    }
    console.log(param)
    return axios.get(baseURL + '/user/list', {params: param});
  }

  GetUserInfo(userId, token){
    let param = {
      USER_ID: userId,
      TOKEN: token,
    }
    return axios.get(baseURL + '/user/info', {params: param});
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

  GetRoomInfo(token){
    let param = {
      TOKEN: token,
    }
    console.log(param)
    return axios.get(baseURL + '/room/info', {params: param});
  }

  TruncateAll(){
    return axios.post(baseURL + '/truncate');
  }
}

let api = new ApiClass();
export default api;