import React, { useMemo } from 'react';
import { Stack, Typography, Box, IconButton } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { Property } from '../../types/property/property';
import { formatterStr } from '../../utils';
import { REACT_APP_API_URL, topPropertyRank } from '../../config';

interface PropertyCardType {
	property: Property;
	likePropertyHandler?: any;
	myFavorites?: boolean;
	recentlyVisited?: boolean;
}

const getTransmissionLabel = (rooms?: any) => {
	const v = Number(rooms);
	if (!Number.isFinite(v) || v <= 0) return 'N/A';
	if (v === 1) return 'Manual';
	if (v === 2) return 'Automatic';
	if (v === 3) return 'CVT';
	return `${v} Gear`;
};
const getSeatsLabel = (beds?: any) => {
	const v = Number(beds);
	if (!Number.isFinite(v) || v <= 0) return 'N/A';
	return `${v} Seats`;
};
const getMileageLabel = (square?: any) => {
	const v = Number(square);
	if (!Number.isFinite(v) || v <= 0) return 'N/A';
	return `${v.toLocaleString()} km`;
};

// Unique inline icons (other projectga o‘xshamasin)
const SeatIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
		<path d="M7 13V6a3 3 0 0 1 6 0v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		<path d="M5 20v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
	</svg>
);
const GearIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
		<path d="M12 8v8M8 12h8M7 3h10M7 21h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
	</svg>
);
const SpeedIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
		<path d="M21 14a9 9 0 1 0-18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		<path d="M12 13l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
	</svg>
);

const PropertyCard = (props: PropertyCardType) => {
	const { property, likePropertyHandler, myFavorites, recentlyVisited } = props;
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);

	const imagePath = useMemo(() => {
		const first = property?.propertyImages?.[0];
		return first ? `${REACT_APP_API_URL}${first}` : '/img/banner/header1.svg';
	}, [property?.propertyImages]);

	if (device === 'mobile') return <div>PROPERTY CARD</div>;

	const liked = myFavorites ? true : !!(property?.meLiked && property?.meLiked[0]?.myFavorite);

	const dealTag = property?.propertyRent ? 'Lease' : 'Sale';
	const tradeTag = property?.propertyBarter ? 'Trade OK' : 'No Trade';

	return (
		<Stack className="auto-card">
			<Box className="auto-media">
				<Link
					href={{
						pathname: '/property/detail',
						query: { id: property?._id },
					}}
				>
					<img src={imagePath} alt={property?.propertyTitle || 'car'} />
				</Link>

				<div className="auto-overlay" />

				<div className="auto-toprow">
					<div className="auto-chips">
						{property?.propertyRank > topPropertyRank && <div className="chip chip-hot">HOT</div>}
						<div className={`chip chip-deal ${property?.propertyRent ? 'lease' : 'sale'}`}>{dealTag}</div>
						<div className={`chip chip-trade ${property?.propertyBarter ? 'on' : 'off'}`}>{tradeTag}</div>
					</div>

					<div className="auto-price">
						<span>$</span>
						<b>{formatterStr(property?.propertyPrice)}</b>
					</div>
				</div>

				<div className="auto-actions">
					<div className="mini">
						<RemoveRedEyeIcon />
						<span>{property?.propertyViews ?? 0}</span>
					</div>

					{!recentlyVisited && (
						<IconButton
							className={`fav ${liked ? 'liked' : ''}`}
							onClick={(e: { preventDefault: () => void; stopPropagation: () => void; }) => {
								e.preventDefault();
								e.stopPropagation();
								likePropertyHandler && likePropertyHandler(user, property?._id);
							}}
						>
							{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
						</IconButton>
					)}
				</div>
			</Box>

			<Stack className="auto-body">
				<Link
					href={{
						pathname: '/property/detail',
						query: { id: property?._id },
					}}
				>
					<Typography className="auto-title">{property?.propertyTitle}</Typography>
				</Link>

				<Typography className="auto-sub">
					{property?.propertyAddress}
					{property?.propertyLocation ? `, ${property?.propertyLocation}` : ''}
				</Typography>

				<div className="auto-specs">
					<div className="spec">
						<span className="ico">
							<SeatIcon />
						</span>
						<div className="txt">
							<b>{getSeatsLabel(property?.propertyBeds)}</b>
							<small>Seats</small>
						</div>
					</div>

					<div className="spec">
						<span className="ico">
							<GearIcon />
						</span>
						<div className="txt">
							<b>{getTransmissionLabel(property?.propertyRooms)}</b>
							<small>Transmission</small>
						</div>
					</div>

					<div className="spec">
						<span className="ico">
							<SpeedIcon />
						</span>
						<div className="txt">
							<b>{getMileageLabel(property?.propertySquare)}</b>
							<small>Mileage</small>
						</div>
					</div>
				</div>

				<div className="auto-bottom">
					<div className="likes">
						<FavoriteIcon className="mini-heart" />
						<span>{property?.propertyLikes ?? 0}</span>
					</div>
				</div>
			</Stack>
		</Stack>
	);
};

export default PropertyCard;
