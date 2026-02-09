import React from 'react';
import { Stack, Box, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { Property } from '../../types/property/property';
import { REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';

interface TopPropertyCardProps {
	property: Property;
	likePropertyHandler: any;
}

const TopPropertyCard = (props: TopPropertyCardProps) => {
	const { property, likePropertyHandler } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);

	const pushDetailHandler = async (propertyId: string) => {
		await router.push({ pathname: '/property/detail', query: { id: propertyId } });
	};

	const imgUrl = property?.propertyImages?.[0]
		? `${REACT_APP_API_URL}${property.propertyImages[0]}`
		: '/img/property/default.jpg';

	// backend o‘zgarmasin — faqat UI label-car
	const seats = property?.propertyBeds ?? 0;
	const doors = property?.propertyRooms ?? 0;
	const km = property?.propertySquare ?? 0;

	const views = property?.propertyViews ?? 0;
	const likes = property?.propertyLikes ?? 0;
	const rank = property?.propertyRank ?? 0;

	return (
		<Stack className={`topx-card ${device === 'mobile' ? 'is-mobile' : ''}`}>
			<Box
				component="div"
				className="topx-media"
				style={{ backgroundImage: `url(${imgUrl})` }}
				onClick={() => pushDetailHandler(property._id)}
			>
				<div className="topx-overlay" />

				{/* rank badge */}
				<div className="topx-rank">
					<LocalFireDepartmentIcon className="ic" />
					<span>#{rank || 1}</span>
				</div>

				{/* price */}
				<div className="topx-price">
					<span className="dollar">$</span>
					<span className="val">{property?.propertyPrice ?? 0}</span>
					<span className="per">/ day</span>
				</div>

				{/* quick stats glass bar */}
				<div className="topx-glass">
					<span>{seats} seats</span>
					<i />
					<span>{doors} doors</span>
					<i />
					<span>{km} km</span>
				</div>
			</Box>

			<Box component="div" className="topx-info">
				<div className="topx-titleRow">
					<strong className="topx-title" onClick={() => pushDetailHandler(property._id)}>
						{property?.propertyTitle}
					</strong>

					<div className="topx-status">Top pick</div>
				</div>

				<p className="topx-sub">
					{property?.propertyAddress ? property.propertyAddress : 'Verified • Clean • Ready'}
				</p>

				<div className="topx-bottomRow">
					<div className="topx-metrics">
						<div className="m">
							<RemoveRedEyeIcon className="m-ic" />
							<Typography className="m-val">{views}</Typography>
						</div>

						<div className="m">
							<FavoriteIcon className="m-ic heart" />
							<Typography className="m-val">{likes}</Typography>
						</div>
					</div>

					<div className="topx-actions">
						<IconButton
							className="topx-likeBtn"
							onClick={() => likePropertyHandler(user, property?._id)}
						>
							{property?.meLiked && property?.meLiked[0]?.myFavorite ? (
								<FavoriteIcon className="liked" />
							) : (
								<FavoriteIcon />
							)}
						</IconButton>

						<button className="topx-btn" type="button" onClick={() => pushDetailHandler(property._id)}>
							View
						</button>
					</div>
				</div>
			</Box>
		</Stack>
	);
};

export default TopPropertyCard;
