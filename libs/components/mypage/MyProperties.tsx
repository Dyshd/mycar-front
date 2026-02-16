import React, { useState } from 'react';
import { NextPage } from 'next';
import { Pagination, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { PropertyCard } from './PropertyCard';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Property } from '../../types/property/property';
import { AgentPropertiesInquiry } from '../../types/property/property.input';
import { T } from '../../types/common';
import { PropertyStatus } from '../../enums/property.enum';
import { userVar } from '../../../apollo/store';
import { useRouter } from 'next/router';
import { UPDATE_PROPERTY } from '../../../apollo/user/mutation';
import { GET_AGENT_PROPERTIES } from '../../../apollo/user/query';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';

const MyProperties: NextPage = ({ initialInput }: any) => {
	const device = useDeviceDetect();
	const [searchFilter, setSearchFilter] = useState<AgentPropertiesInquiry>(initialInput);
	const [agentProperties, setAgentProperties] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0);
	const user = useReactiveVar(userVar);
	const router = useRouter();

	const [updateProperty] = useMutation(UPDATE_PROPERTY);

	const { refetch } = useQuery(GET_AGENT_PROPERTIES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		onCompleted: (data: T) => {
			setAgentProperties(data?.getAgentProperties?.list || []);
			setTotal(data?.getAgentProperties?.metaCounter?.[0]?.total || 0);
		},
	});

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const changeStatusHandler = (value: PropertyStatus) => {
		setSearchFilter({ ...searchFilter, search: { propertyStatus: value }, page: 1 });
	};

	const deletePropertyHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Delete this property?')) {
				await updateProperty({
					variables: {
						input: {
							_id: id,
							propertyStatus: 'DELETE',
						},
					},
				});
				await refetch({ input: searchFilter });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const updatePropertyHandler = async (status: string, id: string) => {
		try {
			if (await sweetConfirmAlert(`Change status to ${status}?`)) {
				await updateProperty({
					variables: {
						input: {
							_id: id,
							propertyStatus: status,
						},
					},
				});
				await refetch({ input: searchFilter });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	if (user?.memberType !== 'DEALER') {
		router.back();
	}

	if (device === 'mobile') {
		return <div>MY PROPERTIES MOBILE</div>;
	}

	return (
		<div id="my-property-page">
			{/* ===== HEADER ===== */}
			<Stack className="main-title-box">
				<Stack className="right-box">
					<Typography className="main-title">My Properties</Typography>
					<Typography className="sub-title">
						Manage your listings in one place.
					</Typography>
				</Stack>

				<Stack className="mp-stats">
					<div className="stat-pill">
						<span className="label">TOTAL</span>
						<span className="value">{total}</span>
					</div>
					<div className="stat-pill">
						<span className="label">PER PAGE</span>
						<span className="value">{searchFilter.limit}</span>
					</div>
				</Stack>
			</Stack>

			{/* ===== LIST ===== */}
			<Stack className="property-list-box">
				<Stack className="tab-name-box">
					<Typography
						onClick={() => changeStatusHandler(PropertyStatus.ACTIVE)}
						className={
							searchFilter.search.propertyStatus === 'ACTIVE'
								? 'active-tab-name'
								: 'tab-name'
						}
					>
						On Sale
					</Typography>

					<Typography
						onClick={() => changeStatusHandler(PropertyStatus.SOLD)}
						className={
							searchFilter.search.propertyStatus === 'SOLD'
								? 'active-tab-name'
								: 'tab-name'
						}
					>
						On Sold
					</Typography>
				</Stack>

				<Stack className="list-box">
					{agentProperties.length === 0 ? (
						<div className="no-data">
							<img src="/img/icons/icoAlert.svg" alt="" />
							<p>No Property found!</p>
						</div>
					) : (
						agentProperties.map((property: Property) => (
							<PropertyCard
								key={property._id}
								property={property}
								deletePropertyHandler={deletePropertyHandler}
								updatePropertyHandler={updatePropertyHandler}
							/>
						))
					)}

					{agentProperties.length !== 0 && (
						<Stack className="pagination-config">
							<Pagination
								count={Math.ceil(total / searchFilter.limit)}
								page={searchFilter.page}
								shape="circular"
								color="primary"
								onChange={paginationHandler}
							/>
							<Typography className="total-result">
								{total} properties
							</Typography>
						</Stack>
					)}
				</Stack>
			</Stack>
		</div>
	);
};

MyProperties.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		search: {
			propertyStatus: 'ACTIVE',
		},
	},
};

export default MyProperties;
