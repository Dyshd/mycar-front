import React, { ChangeEvent, MouseEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Stack, Box, Button, Pagination } from '@mui/material';
import { Menu, MenuItem } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import AgentCard from '../../libs/components/common/AgentCard';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Member } from '../../libs/types/member/member';
import { LIKE_TARGET_MEMBER } from '../../apollo/user/mutation';
import { useMutation, useQuery } from '@apollo/client';
import { T } from '../../libs/types/common';
import { GET_AGENTS } from '../../apollo/user/query';
import { Messages } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const AgentList: NextPage = ({ initialInput }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [filterSortName, setFilterSortName] = useState('Recent');
	const [sortingOpen, setSortingOpen] = useState(false);

	const [searchFilter, setSearchFilter] = useState<any>(
		router?.query?.input ? JSON.parse(router?.query?.input as string) : initialInput,
	);

	const [dealers, setDealers] = useState<Member[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [searchText, setSearchText] = useState<string>('');

	/** APOLLO REQUESTS **/
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

	const { refetch: getAgentsRefetch } = useQuery(GET_AGENTS, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setDealers(data?.getAgents?.list || []);
			setTotal(data?.getAgents?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.input) {
			const inputObj = JSON.parse(router?.query?.input as string);
			setSearchFilter(inputObj);
		} else {
			router.replace(
				`/agent?input=${JSON.stringify(searchFilter)}`,
				`/agent?input=${JSON.stringify(searchFilter)}`,
			);
		}

		setCurrentPage(searchFilter.page === undefined ? 1 : searchFilter.page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router.query.input]);

	/** HANDLERS **/
	const sortingClickHandler = (e: MouseEvent<HTMLElement>) => {
		setAnchorEl(e.currentTarget);
		setSortingOpen(true);
	};

	const sortingCloseHandler = () => {
		setSortingOpen(false);
		setAnchorEl(null);
	};

	const applySort = async (next: any, label: string) => {
		const nextFilter = { ...searchFilter, ...next, page: 1 };
		setSearchFilter(nextFilter);
		setFilterSortName(label);

		await router.push(
			`/agent?input=${JSON.stringify(nextFilter)}`,
			`/agent?input=${JSON.stringify(nextFilter)}`,
			{ scroll: false },
		);

		setSortingOpen(false);
		setAnchorEl(null);
	};

	const sortingHandler = (e: React.MouseEvent<HTMLLIElement>) => {
		switch (e.currentTarget.id) {
			case 'recent':
				applySort({ sort: 'createdAt', direction: 'DESC' }, 'Recent');
				break;
			case 'old':
				applySort({ sort: 'createdAt', direction: 'ASC' }, 'Oldest');
				break;
			case 'likes':
				applySort({ sort: 'memberLikes', direction: 'DESC' }, 'Likes');
				break;
			case 'views':
				applySort({ sort: 'memberViews', direction: 'DESC' }, 'Views');
				break;
		}
	};

	const paginationChangeHandler = async (_: ChangeEvent<unknown>, value: number) => {
		const next = { ...searchFilter, page: value };
		await router.push(`/agent?input=${JSON.stringify(next)}`, `/agent?input=${JSON.stringify(next)}`, { scroll: false });
		setSearchFilter(next);
		setCurrentPage(value);
	};

	const likeMemberHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user?._id) throw new Error(Messages.error2);

			await likeTargetMember({ variables: { input: id } });
			await getAgentsRefetch({ input: searchFilter });

			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const searchEnter = async () => {
		const next = {
			...searchFilter,
			page: 1,
			search: { ...searchFilter.search, text: searchText },
		};

		setSearchFilter(next);
		await router.push(`/agent?input=${JSON.stringify(next)}`, `/agent?input=${JSON.stringify(next)}`, { scroll: false });
	};

	if (device === 'mobile') return <h1>DEALERS PAGE MOBILE</h1>;

	return (
		<Stack className={'dealer-list-page'}>
			<Stack className={'container'}>
				<Stack className={'topbar'}>
					<Box className="title-box">
						<strong>Dealers</strong>
						<span>Find trusted dealers and browse their listings</span>
					</Box>

					<Stack className={'filter'}>
						<Box component={'div'} className={'left'}>
							<input
								type="text"
								placeholder={'Search for a dealer'}
								value={searchText}
								onChange={(e: any) => setSearchText(e.target.value)}
								onKeyDown={(event: any) => {
									if (event.key === 'Enter') searchEnter();
								}}
							/>
						</Box>

						<Box component={'div'} className={'right'}>
							<span>Sort by</span>
							<div>
								<Button onClick={sortingClickHandler} endIcon={<KeyboardArrowDownRoundedIcon />}>
									{filterSortName}
								</Button>

								<Menu anchorEl={anchorEl} open={sortingOpen} onClose={sortingCloseHandler} sx={{ paddingTop: '5px' }}>
									<MenuItem onClick={sortingHandler} id={'recent'} disableRipple>
										Recent
									</MenuItem>
									<MenuItem onClick={sortingHandler} id={'old'} disableRipple>
										Oldest
									</MenuItem>
									<MenuItem onClick={sortingHandler} id={'likes'} disableRipple>
										Likes
									</MenuItem>
									<MenuItem onClick={sortingHandler} id={'views'} disableRipple>
										Views
									</MenuItem>
								</Menu>
							</div>
						</Box>
					</Stack>
				</Stack>

				<Stack className={'card-wrap'}>
					{dealers?.length === 0 ? (
						<div className={'no-data'}>
							<img src="/img/icons/icoAlert.svg" alt="" />
							<p>No dealers found!</p>
						</div>
					) : (
						dealers.map((agent: Member) => (
							<AgentCard agent={agent} key={agent._id} likeMemberHandler={likeMemberHandler} />
						))
					)}
				</Stack>

				<Stack className={'pagination'}>
					{dealers.length !== 0 && Math.ceil(total / searchFilter.limit) > 1 && (
						<Stack className="pagination-box">
							<Pagination
								page={currentPage}
								count={Math.ceil(total / searchFilter.limit)}
								onChange={paginationChangeHandler}
								shape="circular"
								color="primary"
							/>
						</Stack>
					)}

					{dealers.length !== 0 && (
						<span>
							Total {total} dealer{total > 1 ? 's' : ''} available
						</span>
					)}
				</Stack>
			</Stack>
		</Stack>
	);
};

AgentList.defaultProps = {
	initialInput: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withLayoutBasic(AgentList);
