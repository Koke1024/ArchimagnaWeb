import {Input, ListItemText, Menu, MenuItem, Select, styled} from "@mui/material";
import {Button} from "dracula-ui";

export const CustomSelect = styled(Select)({
  color: '#21222c', // 文字色
  backgroundColor: '#a7abbe', // 背景色
  '&:hover': {
    backgroundColor: '#ffffff', // ホバー時の背景色
  },
  '&:active': {
    backgroundColor: '#ffffff', // ホバー時の背景色
  },
  // '&:not(.Mui-focused)': {
  //   backgroundColor: '#ffffff', // ホバー時の背景色
  // },
  '&.Mui-focused': {
    backgroundColor: '#ffffff', // ホバー時の背景色
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#21222c', // ボーダー色
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#FF9800', // ホバー時のボーダー色
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#FF5722', // フォーカス時のボーダー色
  },
});

// カスタムスタイルのMenuItemコンポーネント
export const CustomMenuItem = styled(MenuItem)({
  height: '25px',
  color: '#21222c', // ドロップダウンの文字色
  '&:hover': {
    backgroundColor: '#a7abbe', // ホバー時の背景色
  },
});

// カスタムスタイルのMenuItemコンポーネント
export const CustomMenu = styled(Menu)({
  color: '#21222c', // ドロップダウンの文字色
  position: 'absolute',
  '&:hover': {
    // backgroundColor: '#a7abbe', // ホバー時の背景色
  },
});

// カスタムスタイルのMenuItemコンポーネント
export const CustomListItemText = styled(ListItemText)({
  color: '#21222c', // ドロップダウンの文字色
  '&:hover': {
    // backgroundColor: '#a7abbe', // ホバー時の背景色
  },
});

// カスタムスタイルのMenuItemコンポーネント
export const CustomInput = styled(Input)({
  height: '30px',
  padding: '4px',
  backgroundColor: '#a7abbe', // ホバー時の背景色
  borderRadius: '10px',
});