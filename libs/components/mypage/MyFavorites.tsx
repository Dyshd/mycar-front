import React, { useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Pagination, Stack, Typography } from '@mui/material';
import PropertyCard from '../property/PropertyCard';
import { Property } from '../../types/property/property';
import { T } from '../../types/common';
import { LIKE_TARGET_PROPERTY } from '../../../apollo/user/mutation';
import { GET_FAVORITES } from '../../../apollo/user/query';
import { useMutation, useQuery } from '@apollo/client';
import { Messages } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';

const MyFavorites: NextPage = () => {
	const device = useDeviceDetect();
	const [myFavorites, setMyFavorites] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFavorites, setSearchFavorites] = useState<T>({ page: 1, limit: 6 });

	/** APOLLO REQUESTS **/
	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY);

	const { refetch: getFavoritesRefetch } = useQuery(GET_FAVORITES, {
		fetchPolicy: 'network-only',
		variables: {
			input: searchFavorites,
		},
		notifyOnNetworkStatusChange: true,
		onCompleted(data: T) {
			setMyFavorites(data.getFavorites?.list);
			setTotal(data.getFavorites?.metaCounter?.[0]?.total || 0);
		},
	});

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchFavorites({ ...searchFavorites, page: value });
	};

	const likePropertyHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);
			await likeTargetProperty({
				variables: {
					input: id,
				},
			});
			await getFavoritesRefetch({ input: searchFavorites });
		} catch (err: any) {
			console.log('ERROR, likePropertyHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (device === 'mobile') {
		return <div>NESTAR MY FAVORITES MOBILE</div>;
	}

	return (
		<div id="my-favorites-page" className="my-favorites-glass">
			<Stack className="main-title-box">
				<Stack className="right-box">
					<Typography className="main-title">My Favorites</Typography>
					<Typography className="sub-title">We are glad to see you again!</Typography>
				</Stack>

				{/* ixtiyoriy: stat pill (xohlasangiz qoldiring) */}
				<Stack className="fav-stats">
					<div className="stat-pill">
						<span className="label">TOTAL</span>
						<span className="value">{total}</span>
					</div>
					<div className="stat-pill">
						<span className="label">PER PAGE</span>
						<span className="value">{searchFavorites.limit}</span>
					</div>
				</Stack>
			</Stack>

			<Stack className="favorites-list-box">
				{myFavorites?.length ? (
					myFavorites.map((property: Property) => (
						<PropertyCard
							key={(property as any)?._id ?? `${(property as any)?.propertyTitle}-${Math.random()}`}
							property={property}
							likePropertyHandler={likePropertyHandler}
							myFavorites={true}
						/>
					))
				) : (
					<div className={'no-data'}>
						<img src="/img/icons/icoAlert.svg" alt="" />
						<p>No Favorites found!</p>
					</div>
				)}
			</Stack>

			{myFavorites?.length ? (
				<Stack className="pagination-config">
					<Stack className="pagination-box">
						<Pagination
							count={Math.ceil(total / searchFavorites.limit)}
							page={searchFavorites.page}
							shape="circular"
							color="primary"
							onChange={paginationHandler}
						/>
					</Stack>
					<Stack className="total-result">
						<Typography>
							Total {total} favorite propert{total > 1 ? 'ies' : 'y'}
						</Typography>
					</Stack>
				</Stack>
			) : null}
		</div>
	);
};

export default MyFavorites;
