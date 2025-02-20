import React from 'react';
import PropTypes from 'prop-types';
import {Box} from "dracula-ui";
import {Grid, Typography} from "@mui/material";
import {PhaseInfo, TargetSelectFormat} from "../utils/ArchiMagnaDefine";

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

PhaseDisplay.propTypes = {
  roomInfo: PropTypes.object.isRequired,
};

export const PlayerLog = (props) => {
  const [user, log, users] = [props.player, props.log, props.users]
  function IDToPlayer(id){
    return users.find(row => row.USER_ID === id);
  }

  if (!log || log.length === 0 || !users || users.length === 0) {
    return (<Box key={"user_action_log_box_" + user.USER_ID} className={"Log"}>NO LOG</Box>);
  }
  let day = -1;

  return (<Box key={"user_action_log_box_" + user.USER_ID} className={"Log"}
  >
    {log && log.slice().reverse().map(r => {
      var args = JSON.parse(r.ACTION_TARGET);
        let dayString;
        if (day !== r.DAY) {
          day = r.DAY;
          dayString = <Box variant={"caption"} color={"white"} px={"xxs"} fontSize={"x-large"}>{day}日目</Box>
        }
        return (<Grid key={"user_action_log_" + r.ACTION_LOG_ID} item xs={12} className={"drac-text-left"}>
          {dayString}
          <Box px={"xs"}>
            <span className={"log_user"}>{user.USER_ID === "master"? `${IDToPlayer(r.USER_ID).USER_ORDER + 1}.${IDToPlayer(r.USER_ID).USER_NAME}：`: ""}</span>
            {
              TargetSelectFormat((r.ACTION_ID === 11 || r.ACTION_ID === 12) ? args.slice(0, -1) : args, r.ACTION_ID, (r.ACTION_ID === 7) ? args[1] : args[args.length - 1])
            }
          </Box>
        </Grid>)
      }
    )}
  </Box>)
}

export default PhaseDisplay;