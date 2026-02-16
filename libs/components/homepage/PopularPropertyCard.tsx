import React, { useMemo } from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Property } from '../../types/property/property';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { REACT_APP_API_URL, topPropertyRank } from '../../config';
import { useRouter } from 'next/router';
import { formatterStr, getRentUnit } from '../../utils';

interface PopularPropertyCardProps {
  property: Property;
}

const PopularPropertyCard = (props: PopularPropertyCardProps) => {
  const { property } = props;
  const device = useDeviceDetect();
  const router = useRouter();

  const pushDetailHandler = async (propertyId: string) => {
    await router.push({ pathname: '/property/detail', query: { id: propertyId } });
  };

  const imgUrl = useMemo(() => {
    const first = property?.propertyImages?.[0];
    return first ? `${REACT_APP_API_URL}${first}` : '/img/property/default.jpg';
  }, [property?.propertyImages]);

  // backend o‘zgarmasin — faqat UI label-car
  const seats = property?.propertyBeds ?? 0;
  const doors = property?.propertyRooms ?? 0;
  const km = property?.propertySquare ?? 0;

  const views = property?.propertyViews ?? 0;
  const likes = property?.propertyLikes ?? 0;

  // Popular = views asosida
  const isPopular = views >= 50;

  // “rating” — views asosida (4.3..5.0)
  const score = Math.min(5, Math.max(4.3, 4.3 + views / 250));
  const trips = Math.max(1, Math.floor(views / 8));

  // “Save” — views katta bo‘lsa
  const save = views >= 60 ? Math.min(90, Math.floor(views / 2)) : 0;

  // ✅ unit
  const unit = useMemo(() => {
    if (!property?.propertyRent) return '';
    const u = getRentUnit((property as any)?.propertyRentPeriod);
    return u || '/month';
  }, [property?.propertyRent, (property as any)?.propertyRentPeriod]);

  return (
    <Stack className={`popx-card ${device === 'mobile' ? 'is-mobile' : ''}`}>
      {/* IMAGE */}
      <Box
        component="div"
        className="popx-media"
        style={{ backgroundImage: `url(${imgUrl})` }}
        onClick={() => pushDetailHandler(property._id)}
      >
        <div className="popx-topRow">
          {property?.propertyRank && property?.propertyRank >= topPropertyRank ? (
            <div className="popx-pill popx-pill-top">TOP</div>
          ) : isPopular ? (
            <div className="popx-pill popx-pill-hot">POPULAR</div>
          ) : (
            <div className="popx-pill popx-pill-new">NEW</div>
          )}

          <div className="popx-views">
            <RemoveRedEyeIcon className="eye" />
            <span>{views}</span>
          </div>
        </div>

        {/* ✅ bottom price strip (unit hardcode emas) */}
        <div className="popx-priceStrip">
          <span className="amount">${formatterStr(property?.propertyPrice ?? 0)}</span>
          {property?.propertyRent && unit ? <span className="per"> {unit}</span> : null}
        </div>
      </Box>

      {/* INFO */}
      <Box component="div" className="popx-info">
        <div className="popx-titleRow">
          <strong className="popx-title" onClick={() => pushDetailHandler(property._id)}>
            {property?.propertyTitle}
          </strong>

          <div className="popx-score">
            <span className="star">★</span>
            <span className="val">{score.toFixed(1)}</span>
            <span className="trips">({trips} trips)</span>
          </div>
        </div>

        <p className="popx-sub">
          {property?.propertyAddress ? property.propertyAddress : 'Comfortable & clean'}
        </p>

        <div className="popx-chips">
          <div className="chip">{seats} seats</div>
          <div className="chip">{doors} Gear</div>
          <div className="chip">{km} km</div>
        </div>

        <Divider sx={{ mt: '12px', mb: '12px', opacity: 0.2 }} />

        <div className="popx-bottom">
          <div className="popx-left">
            {save ? <div className="save">Save ${save}</div> : <div className="save muted">Good deal</div>}
          </div>

          <div className="popx-right">
            <div className="likes">
              <FavoriteIcon className="heart" />
              <Typography className="cnt">{likes}</Typography>
            </div>

            <button className="popx-btn" type="button" onClick={() => pushDetailHandler(property._id)}>
              Details
            </button>
          </div>
        </div>
      </Box>
    </Stack>
  );
};

export default PopularPropertyCard;
