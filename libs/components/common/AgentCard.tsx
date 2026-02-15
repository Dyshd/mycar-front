import React from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Stack, Box, Typography, IconButton } from '@mui/material';
import Link from 'next/link';
import { REACT_APP_API_URL } from '../../config';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';

interface AgentCardProps {
  agent: any;
  likeMemberHandler: any;
}

const AgentCard = ({ agent, likeMemberHandler }: AgentCardProps) => {
  const device = useDeviceDetect();
  const user = useReactiveVar(userVar);

  const imagePath =
    agent?.memberImage
      ? `${REACT_APP_API_URL}/${agent.memberImage}`
      : '/img/profile/defaultUser.svg';

  if (device === 'mobile') return <div>DEALER CARD</div>;

  return (
    <Stack className="agent-wow-card">
      <Link
        href={{
          pathname: '/agent/detail',
          query: { agentId: agent?._id },
        }}
      >
        <Box
          className="agent-wow-image"
          style={{ backgroundImage: `url(${imagePath})` }}
        >
          <div className="overlay" />

          <div className="top-badges">
            <span className="badge dealer">Dealer</span>
            <span className="badge cars">
              {agent?.memberProperties} cars
            </span>
          </div>

          <div className="bottom-info">
            <strong>
              {agent?.memberFullName ?? agent?.memberNick}
            </strong>
            <span>Professional Dealer</span>
          </div>
        </Box>
      </Link>

      <Stack className="agent-wow-footer">
        <div className="stats">
          <div className="pill">
            <RemoveRedEyeIcon />
            <span>{agent?.memberViews ?? 0}</span>
            <small>Views</small>
          </div>

          <div className="pill">
            {agent?.meLiked?.[0]?.myFavorite ? (
              <FavoriteIcon className="liked" />
            ) : (
              <FavoriteBorderIcon />
            )}
            <span>{agent?.memberLikes ?? 0}</span>
            <small>Likes</small>
          </div>
        </div>

        <Link
          href={{ pathname: '/agent/detail', query: { agentId: agent?._id } }}
          className="cta"
        >
          View profile
        </Link>
      </Stack>

    </Stack>
  );
};

export default AgentCard;
