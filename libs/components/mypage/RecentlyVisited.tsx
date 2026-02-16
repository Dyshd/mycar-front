import React, { useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Pagination, Stack, Typography } from '@mui/material';
import PropertyCard from '../property/PropertyCard';
import { Property } from '../../types/property/property';
import { T } from '../../types/common';
import { useQuery } from '@apollo/client';
import { GET_VISITED } from '../../../apollo/user/query';

const RecentlyVisited: NextPage = () => {
	const device = useDeviceDetect();
	const [recentlyVisited, setRecentlyVisited] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchVisited, setSearchVisited] = useState<T>({ page: 1, limit: 6 });

	/** APOLLO REQUESTS **/
	useQuery(GET_VISITED, {
		fetchPolicy: 'network-only',
		variables: {
			input: searchVisited,
		},
		notifyOnNetworkStatusChange: true,
		onCompleted(data: T) {
			setRecentlyVisited(data.getVisited?.list);
			setTotal(data.getVisited?.metaCounter?.[0]?.total || 0);
		},
	});

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchVisited({ ...searchVisited, page: value });
	};

	if (device === 'mobile') {
		return <div>RECENTLY VISITED MOBILE</div>;
	}

	return (
		<div id="recently-visited-page" className="recently-visited-glass">
			<Stack className="main-title-box">
				<Stack className="right-box">
					<Typography className="main-title">Recently Visited</Typography>
					<Typography className="sub-title">We are glad to see you again!</Typography>
				</Stack>

				{/* optional stats */}
				<Stack className="rv-stats">
					<div className="stat-pill">
						<span className="label">TOTAL</span>
						<span className="value">{total}</span>
					</div>
					<div className="stat-pill">
						<span className="label">PER PAGE</span>
						<span className="value">{searchVisited.limit}</span>
					</div>
				</Stack>
			</Stack>

			<Stack className="visited-list-box">
				{recentlyVisited?.length ? (
					recentlyVisited.map((property: Property) => (
						<PropertyCard
							key={(property as any)?._id ?? `${(property as any)?.propertyTitle}-${Math.random()}`}
							property={property}
							recentlyVisited={true}
						/>
					))
				) : (
					<div className={'no-data'}>
						<img src="/img/icons/icoAlert.svg" alt="" />
						<p>No Recently Visited Properties found!</p>
					</div>
				)}
			</Stack>

			{recentlyVisited?.length ? (
				<Stack className="pagination-config">
					<Stack className="pagination-box">
						<Pagination
							count={Math.ceil(total / searchVisited.limit)}
							page={searchVisited.page}
							shape="circular"
							color="primary"
							onChange={paginationHandler}
						/>
					</Stack>
					<Stack className="total-result">
						<Typography>
							Total {total} recently visited propert{total > 1 ? 'ies' : 'y'}
						</Typography>
					</Stack>
				</Stack>
			) : null}
		</div>
	);
};

export default RecentlyVisited;
