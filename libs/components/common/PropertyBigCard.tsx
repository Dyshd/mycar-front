import React, { useMemo } from 'react';
import { Stack, Box, Divider, Typography, IconButton } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { Property } from '../../types/property/property';
import { REACT_APP_API_URL, topPropertyRank } from '../../config';
import { formatterStr, getRentUnit } from '../../utils';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { useRouter } from 'next/router';

interface PropertyBigCardProps {
  property: Property;
  likePropertyHandler?: any;
}

const PropertyBigCard = (props: PropertyBigCardProps) => {
  const { property, likePropertyHandler } = props;
  const device = useDeviceDetect();
  const user = useReactiveVar(userVar);
  const router = useRouter();

  const bg = useMemo(() => {
    const first = property?.propertyImages?.[0];
    return first ? `url(${REACT_APP_API_URL}${first})` : `url(/img/banner/header1.svg)`;
  }, [property?.propertyImages]);

  const liked = !!property?.meLiked?.[0]?.myFavorite;

  const goPropertyDetatilPage = (propertyId: string) => {
    router.push(`/property/detail?id=${propertyId}`);
  };

  if (device === 'mobile') return <div>APARTMEND BIG CARD</div>;

  // ✅ unit (util orqali)
  const unit = useMemo(() => {
    if (!property?.propertyRent) return '';
    const u = getRentUnit((property as any)?.propertyRentPeriod);
    return u || '/month'; // xohlasangiz '' qiling
  }, [property?.propertyRent, (property as any)?.propertyRentPeriod]);

  return (
    <Stack className="property-big-card-box" onClick={() => goPropertyDetatilPage(property?._id)}>
      <Box component={'div'} className={'card-img'} style={{ backgroundImage: bg }}>
        {property?.propertyRank && property?.propertyRank >= topPropertyRank && (
          <div className={'status'}>
            <img src="/img/icons/electricity.svg" alt="" />
            <span>top</span>
          </div>
        )}

        <div className="auto-price">
          <b>${formatterStr(property?.propertyPrice)}</b>
          {unit && <span className="unit">{unit}</span>}
        </div>
      </Box>

      <Box component={'div'} className={'info'}>
        <strong className={'title'}>{property?.propertyTitle}</strong>
        <p className={'desc'}>{property?.propertyAddress}</p>

        <div className="options">
          <img src="/img/icons/bed.svg" alt="" />
          <p>
            <b>{property?.propertyBeds ?? 0}</b> Seats
          </p>
        </div>

        <div className="options">
          <img src="/img/icons/room.svg" alt="" />
          <p>
            <b>{property?.propertyRooms ?? 0}</b> Gear
          </p>
        </div>

        <div className="options">
          <img src="/img/icons/expand.svg" alt="" />
          <p>
            <b>{property?.propertySquare ?? 0}</b> km
          </p>
        </div>

        <Divider sx={{ mt: '15px', mb: '17px' }} />

        <div className={'bott'}>
          <div>
            {property?.propertyRent ? <p>Lease</p> : <span>Sale</span>}
            {property?.propertyBarter ? <p>Trade</p> : <span>No Trade</span>}
          </div>

          <div className="buttons-box">
            <IconButton
              color={'default'}
              onClick={(e: { stopPropagation: () => void }) => {
                e.stopPropagation();
              }}
            >
              <RemoveRedEyeIcon />
            </IconButton>
            <Typography className="view-cnt">{property?.propertyViews ?? 0}</Typography>

            <IconButton
              color={'default'}
              onClick={(e: { stopPropagation: () => void }) => {
                e.stopPropagation();
                likePropertyHandler && likePropertyHandler(user, property?._id);
              }}
            >
              {liked ? <FavoriteIcon style={{ color: '#EB6753' }} /> : <FavoriteBorderIcon />}
            </IconButton>
            <Typography className="view-cnt">{property?.propertyLikes ?? 0}</Typography>
          </div>
        </div>
      </Box>
    </Stack>
  );
};

export default PropertyBigCard;
