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

  const goPropertyDetailPage = () => {
    if (!property?._id) return;
    router.push(`/property/detail?id=${property._id}`);
  };

  if (device === 'mobile') return <div>PROPERTY BIG CARD MOBILE</div>;

  // ✅ unit (rent bo‘lsa)
  const unit = useMemo(() => {
    if (!property?.propertyRent) return '';
    const u = getRentUnit((property as any)?.propertyRentPeriod);
    return u || '/month';
  }, [property?.propertyRent, (property as any)?.propertyRentPeriod]);

  // ✅ 0 bo‘lsa yashirish uchun
  const beds = property?.propertyBeds ?? 0;
  const rooms = property?.propertyRooms ?? 0;
  const square = property?.propertySquare ?? 0;
  const views = property?.propertyViews ?? 0;
  const likes = property?.propertyLikes ?? 0;

  return (
    <Stack className="property-big-card-box" onClick={goPropertyDetailPage}>
      <Box component={'div'} className={'card-img'} style={{ backgroundImage: bg }}>
        <div className="img-overlay" />

        {property?.propertyRank && property?.propertyRank >= topPropertyRank && (
          <div className={'status'}>
            <img src="/img/icons/electricity.svg" alt="" />
            <span>top</span>
          </div>
        )}

        <div className="auto-price">
          <b>${formatterStr(property?.propertyPrice)}</b>
          {unit ? <span className="unit">{unit}</span> : null}
        </div>
      </Box>

      <Box component={'div'} className={'info'}>
        <strong className={'title'}>{property?.propertyTitle}</strong>
        <p className={'desc'}>{property?.propertyAddress}</p>

        <div className="options-grid">
          {beds > 0 && (
            <div className="opt">
              <img src="/img/icons/bed.svg" alt="" />
              <p>
                <b>{beds}</b> Seats
              </p>
            </div>
          )}

          {rooms > 0 && (
            <div className="opt">
              <img src="/img/icons/room.svg" alt="" />
              <p>
                <b>{rooms}</b> Gear
              </p>
            </div>
          )}

          {square > 0 && (
            <div className="opt">
              <img src="/img/icons/expand.svg" alt="" />
              <p>
                <b>{square}</b> km
              </p>
            </div>
          )}
        </div>

        <Divider className="divider" />

        <div className={'bott'}>
          <div className="tags">
            <span className={property?.propertyRent ? 'tag on' : 'tag'}>
              {property?.propertyRent ? 'Lease' : 'Sale'}
            </span>

            <span className={property?.propertyBarter ? 'tag on' : 'tag'}>
              {property?.propertyBarter ? 'Trade' : 'No Trade'}
            </span>
          </div>

          <div className="buttons-box">
            {/* ✅ Views 0 bo‘lsa chiqmaydi */}
            {views > 0 && (
              <div className="mini-pill">
                <IconButton
                  className="mini-btn"
                  color={'default'}
                  onClick={(e: { stopPropagation: () => void; }) => {
                    e.stopPropagation();
                  }}
                >
                  <RemoveRedEyeIcon />
                </IconButton>
                <Typography className="cnt">{views}</Typography>
              </div>
            )}

            {/* ✅ Likes 0 bo‘lsa chiqmaydi */}
            {likes > 0 && (
              <div className="mini-pill">
                <IconButton
                  className="mini-btn"
                  color={'default'}
                  onClick={(e: { stopPropagation: () => void; }) => {
                    e.stopPropagation();
                    likePropertyHandler && likePropertyHandler(user, property?._id);
                  }}
                >
                  {liked ? <FavoriteIcon className="liked" /> : <FavoriteBorderIcon />}
                </IconButton>
                <Typography className="cnt">{likes}</Typography>
              </div>
            )}
          </div>
        </div>
      </Box>
    </Stack>
  );
};

export default PropertyBigCard;
