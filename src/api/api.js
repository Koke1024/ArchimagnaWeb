import axios from "axios";

export let baseURL = "http://localhost:8080";

export function AddUser(name){
  let param = {
    USER_NAME: name,
  }
  return axios.post(baseURL + '/user/add', param);
}

export function GetUserList(){
  return axios.get(baseURL + '/user/list');
}