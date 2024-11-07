import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {Box} from "dracula-ui";
import {Grid, Typography} from "@mui/material";
import {PhaseInfo, TargetSelectFormat} from "../api/ArchiMagnaDefine";
import {minWidth} from "@mui/system";  // 必要ならPropTypesを追加

const PhaseDisplay = ({roomInfo}) => {
  if (!roomInfo) {
    return <></>;
  }
  return (
    <>
      <Box
        className={"day_info"}
        style={{
          backgroundColor: 'var(--blackSecondary)',
          letterSpacing: '10px'
        }}>
        <Typography
          variant={"h4"}>{roomInfo.DAY > 0 ? <>{roomInfo.DAY}日目 {PhaseInfo[roomInfo.PHASE]}</> : <>開始前</>}</Typography>
      </Box>
      <Box style={{display: "flex", justifyContent: "space-around"}} mx={"xxs"} className={"Phase"}>
          {Object.keys(PhaseInfo).map(i =>
            <Box
              bgcolor={(i === `${roomInfo.PHASE}`) ? "yellow" : "gray"}
              sx={{backgroundColor: "red"}}
              className={"phase_box" + ((i === `${roomInfo.PHASE}`) ? " current_phase" : "")}
              mx={"xxs"}
              key={"phase_box_" + i}
            >
            <Typography color={"black"} key={"phase_" + i}>{PhaseInfo[i]}</Typography>
            </Box>
          )}
      </Box>
    </>
  );
};

// PropTypesの設定（必須ではないが、ドキュメントとして便利）
PhaseDisplay.propTypes = {
  roomInfo: PropTypes.object.isRequired,
};


export const PlayerLog = (props) => {
  const [user, ] = useState(props.player);
  const [log, ] = useState(props.log)

  if(!log || log.length === 0){
    return <></>;
  }

  return (<Box key={"user_action_log_box_" + user.USER_ID} className={"Log"}
  >
    {log && log.map(r => {
        var args = JSON.parse(r.ACTION_TARGET);
        return (<Grid key={"user_action_log_" + r.ACTION_LOG_ID} item xs={12} className={"drac-text-left"}>
          <Box>{r.DAY}日目：{TargetSelectFormat(args, r.ACTION_ID, args[1])}</Box>
        </Grid>)
      }
    )}
  </Box>)
}

export default PhaseDisplay;