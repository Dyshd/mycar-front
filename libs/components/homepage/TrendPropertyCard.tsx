import React from "react";
import { Stack, Box, Divider } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import useDeviceDetect from "../../hooks/useDeviceDetect";
import { Property } from "../../types/property/property";
import { REACT_APP_API_URL } from "../../config";
import { useRouter } from "next/router";
import { useReactiveVar } from "@apollo/client";
import { userVar } from "../../../apollo/store";

interface TrendPropertyCardProps {
  property: Property;
  likePropertyHandler: any;
}

const TrendPropertyCard = ({ property, likePropertyHandler }: TrendPropertyCardProps) => {
  const device = useDeviceDetect();
  const router = useRouter();
  const user = useReactiveVar(userVar);

  const pushDetailHandler = async (propertyId: string) => {
    await router.push({ pathname: "/property/detail", query: { id: propertyId } });
  };

  const imgUrl = property?.propertyImages?.[0]
    ? `${REACT_APP_API_URL.replace(/\/$/, "")}/${String(property.propertyImages[0]).replace(/^\//, "")}`
    : "/img/property/default.jpg";

  // backend o‘zgarmasin, faqat label-car bo‘lsin
  const seats = property?.propertyBeds ?? 0;
  const doors = property?.propertyRooms ?? 0;
  const km = property?.propertySquare ?? 0;

  const views = property?.propertyViews ?? 0;
  const likes = property?.propertyLikes ?? 0;

  // “rating”ni random qilmaymiz: likes/viewdan “score”
  const score = Math.min(5, Math.max(4.2, 4.2 + (likes / 100))); // 4.2..5.0 oralig‘ida
  const trips = Math.max(1, Math.floor(views / 10));

  // “HOT” — likes katta bo‘lsa
  const isHot = likes >= 10;

  // “Save $..” — likesdan kelib chiqib
  const save = likes >= 15 ? Math.min(60, likes) : 0;

  const dealText = property?.propertyRent ? "Rent" : "Sale";

  return (
    <Stack className={`trendx-card ${device === "mobile" ? "is-mobile" : ""}`}>
      {/* IMAGE */}
      <Box className="trendx-media" onClick={() => pushDetailHandler(property._id)} style={{ backgroundImage: `url(${imgUrl})` }}>
        <div className="trendx-mediaOverlay" />

        {/* top-left badges */}
        <div className="trendx-badges">
          {isHot ? <div className="badge badge-hot">HOT</div> : null}
          {save ? <div className="badge badge-save">Save ${save}</div> : null}
        </div>

        {/* top-right like */}
        <div
          className="trendx-like"
          onClick={(e) => {
            e.stopPropagation();
            likePropertyHandler(user, property?._id);
          }}
          role="button"
          tabIndex={0}
        >
          {property?.meLiked && property?.meLiked[0]?.myFavorite ? (
            <FavoriteIcon className="liked" />
          ) : (
            <FavoriteIcon />
          )}
        </div>

        {/* bottom floating spec bar */}
        <div className="trendx-floatSpecs">
          <span>{seats} seats</span>
          <span className="dot">•</span>
          <span>{doors} doors</span>
          <span className="dot">•</span>
          <span>{km} km</span>
        </div>
      </Box>

      {/* INFO */}
      <Box className="trendx-info">
        <div className="trendx-titleRow">
          <strong className="trendx-title" onClick={() => pushDetailHandler(property._id)}>
            {property?.propertyTitle}
          </strong>

          <div className="trendx-score">
            <span className="star">★</span>
            <span className="val">{score.toFixed(1)}</span>
            <span className="trips">({trips} trips)</span>
          </div>
        </div>

        <p className="trendx-sub">
          {property?.propertyDesc
            ? property.propertyDesc
            : property?.propertyAddress
            ? property.propertyAddress
            : "Fast & reliable"}
        </p>

        <Divider sx={{ mt: "12px", mb: "12px", opacity: 0.25 }} />

        <div className="trendx-bottom">
          <div className="trendx-chip">{dealText}</div>

          <div className="trendx-price">
            <span className="amount">${property?.propertyPrice ?? 0}</span>
            <span className="per"> / day</span>
          </div>

          <div className="trendx-meta">
            <RemoveRedEyeIcon className="eye" />
            <span>{views}</span>
            <span className="sep">•</span>
            <FavoriteIcon className="heart" />
            <span>{likes}</span>
          </div>
        </div>

        {/* CTA */}
        <button className="trendx-cta" type="button" onClick={() => pushDetailHandler(property._id)}>
          View details
        </button>
      </Box>
    </Stack>
  );
};

export default TrendPropertyCard;
