import React from 'react';
import { useRouter } from 'next/router';
import { Stack } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Member } from '../../types/member/member';
import { REACT_APP_API_URL } from '../../config';

interface TopAgentProps {
  agent: Member;
}

const TopAgentCard = (props: TopAgentProps) => {
  const { agent } = props;
  const device = useDeviceDetect();
  const router = useRouter();

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? REACT_APP_API_URL;

  const agentImage = agent?.memberImage
    ? `${BASE_URL}${agent.memberImage.startsWith('/') ? '' : '/'}${agent.memberImage}`
    : '/img/profile/defaultUser.svg';

  if (device === 'mobile') {
    return (
      <Stack className="top-agent-card">
        <img src={agentImage} alt="" />
        <strong>{agent?.memberNick}</strong>
        <span>{agent?.memberType}</span>
      </Stack>
    );
  } else {
    return (
      <Stack className="top-agent-card">
        <img src={agentImage} alt="" />
        <strong>{agent?.memberNick}</strong>
        <span>{agent?.memberType}</span>
      </Stack>
    );
  }
};

export default TopAgentCard;
