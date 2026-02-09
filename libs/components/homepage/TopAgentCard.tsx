import React from 'react';
import { useRouter } from 'next/router';
import { Stack } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import StarIcon from '@mui/icons-material/Star';
import VerifiedIcon from '@mui/icons-material/Verified';
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

  const openAgent = async () => {
    // sizda agent detail route bo‘lsa shunga moslang
    await router.push({
      pathname: '/agent/detail',
      query: { id: agent?._id },
    });
  };

  // backend fieldlar bo‘lmasa ham UI yiqilmasin:
  const nick = agent?.memberNick ?? 'Dealer';
  const type = agent?.memberType ?? 'Seller';
  const rank = (agent as any)?.memberRank ?? 0;

  // UI-only: rank'dan rating yasab qo‘yamiz (xavfsiz)
  const rating = Math.max(4.0, Math.min(5.0, 4.3 + (rank % 7) * 0.1));

  return (
    <Stack className={`agentx-card ${device === 'mobile' ? 'is-mobile' : ''}`} onClick={openAgent}>
      <div className="agentx-top">
        <img src={agentImage} alt="" className="agentx-avatar" />

        <div className="agentx-badge">
          <VerifiedIcon className="ic" />
          <span>Verified</span>
        </div>
      </div>

      <div className="agentx-body">
        <strong className="agentx-name">{nick}</strong>
        <span className="agentx-type">{type}</span>

        <div className="agentx-strip">
          <div className="agentx-rating">
            <StarIcon className="star" />
            <span className="val">{rating.toFixed(1)}</span>
            <span className="muted">rating</span>
          </div>

          <div className="agentx-dot" />

          <div className="agentx-rank">
            <span className="muted">rank</span>
            <span className="val">#{rank || 1}</span>
          </div>
        </div>

        <button className="agentx-btn" type="button" onClick={(e) => { e.stopPropagation(); openAgent(); }}>
          View profile
        </button>
      </div>
    </Stack>
  );
};

export default TopAgentCard;
