import React, { ChangeEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import PropertyBigCard from '../../libs/components/common/PropertyBigCard';
import ReviewCard from '../../libs/components/agent/ReviewCard';
import { Box, Button, Pagination, Stack, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { Property } from '../../libs/types/property/property';
import { Member } from '../../libs/types/member/member';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { userVar } from '../../apollo/store';
import { PropertiesInquiry } from '../../libs/types/property/property.input';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Messages, REACT_APP_API_URL } from '../../libs/config';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CREATE_COMMENT, LIKE_TARGET_PROPERTY } from '../../apollo/user/mutation';
import { GET_COMMENTS, GET_MEMBER, GET_PROPERTIES } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const AgentDetail: NextPage = ({ initialInput, initialComment }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);

	const [dealerId, setDealerId] = useState<string | null>(null);
	const [dealer, setDealer] = useState<Member | null>(null);

	const [searchFilter, setSearchFilter] = useState<PropertiesInquiry>(initialInput);
	const [dealerCars, setDealerCars] = useState<Property[]>([]);
	const [propertyTotal, setPropertyTotal] = useState<number>(0);

	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>(initialComment);
	const [dealerComments, setDealerComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);

	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.MEMBER,
		commentContent: '',
		commentRefId: '',
	});

	/** APOLLO **/
	const [createComment] = useMutation(CREATE_COMMENT);
	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY);

	const { refetch: getMemberRefetch } = useQuery(GET_MEMBER, {
		fetchPolicy: 'network-only',
		variables: { input: dealerId },
		skip: !dealerId,
		onCompleted: (data: T) => {
			setDealer(data?.getMember);

			setSearchFilter((prev) => ({
				...prev,
				search: { memberId: data?.getMember?._id },
				page: 1,
			}));

			setCommentInquiry((prev) => ({
				...prev,
				search: { commentRefId: data?.getMember?._id },
				page: 1,
			}));

			setInsertCommentData((prev) => ({
				...prev,
				commentRefId: data?.getMember?._id,
			}));
		},
	});

	const { refetch: getPropertiesRefetch } = useQuery(GET_PROPERTIES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		skip: !searchFilter.search.memberId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setDealerCars(data?.getProperties?.list || []);
			setPropertyTotal(data?.getProperties?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const { refetch: getCommentsRefetch } = useQuery(GET_COMMENTS, {
		fetchPolicy: 'network-only',
		variables: { input: commentInquiry },
		skip: !commentInquiry.search.commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setDealerComments(data?.getComments?.list || []);
			setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.agentId) setDealerId(router.query.agentId as string);
	}, [router.query.agentId]);

	useEffect(() => {
		if (dealerId) getMemberRefetch({ input: dealerId }).then();
	}, [dealerId]);

	useEffect(() => {
		if (searchFilter.search.memberId) getPropertiesRefetch({ input: searchFilter }).then();
	}, [searchFilter]);

	useEffect(() => {
		if (commentInquiry.search.commentRefId) getCommentsRefetch({ input: commentInquiry }).then();
	}, [commentInquiry]);

	/** HANDLERS **/
	const redirectToMemberPageHandler = async (memberId: string) => {
		try {
			if (memberId === user?._id) await router.push(`/mypage?memberId=${memberId}`);
			else await router.push(`/member?memberId=${memberId}`);
		} catch (error) {
			await sweetErrorHandling(error);
		}
	};

	const propertyPaginationChangeHandler = async (_: ChangeEvent<unknown>, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const commentPaginationChangeHandler = async (_: ChangeEvent<unknown>, value: number) => {
		setCommentInquiry({ ...commentInquiry, page: value });
	};

	const createCommentHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (user._id === dealerId) throw new Error('Cannot write a review for yourself');

			await createComment({ variables: { input: insertCommentData } });
			setInsertCommentData({ ...insertCommentData, commentContent: '' });

			await getCommentsRefetch({ input: commentInquiry });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const likePropertyHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user?._id) throw new Error(Messages.error2);

			await likeTargetProperty({ variables: { input: id } });
			await getPropertiesRefetch({ input: searchFilter });

			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (device === 'mobile') return <div>DEALER DETAIL PAGE MOBILE</div>;

	return (
		<Stack className={'dealer-detail-page'}>
			<Stack className={'container'}>
				<Stack className={'dealer-hero'}>
					<div className="avatar">
						<img
							src={dealer?.memberImage ? `${REACT_APP_API_URL}/${dealer?.memberImage}` : '/img/profile/defaultUser.svg'}
							alt=""
						/>
					</div>

					<Box className={'info'} onClick={() => redirectToMemberPageHandler(dealer?._id as string)}>
						<strong>{dealer?.memberFullName ?? dealer?.memberNick}</strong>

						<div className="chips">
							<span className="chip">Dealer</span>
							{dealer?.memberType && <span className="chip soft">{dealer.memberType}</span>}
						</div>

						<div className="phone">
							<img src="/img/icons/call.svg" alt="" />
							<span>{dealer?.memberPhone}</span>
						</div>
					</Box>
				</Stack>

				<Stack className={'dealer-cars'}>
					<div className="section-head">
						<strong>Dealer Listings</strong>
						<span>{propertyTotal ? `${propertyTotal} cars` : 'No cars yet'}</span>
					</div>

					<Stack className={'card-wrap'}>
						{dealerCars.map((property: Property) => (
							<div className={'wrap-main'} key={property?._id}>
								<PropertyBigCard property={property} likePropertyHandler={likePropertyHandler} />
							</div>
						))}
					</Stack>

					<Stack className={'pagination'}>
						{propertyTotal ? (
							<>
								<Stack className="pagination-box">
									<Pagination
										page={searchFilter.page}
										count={Math.ceil(propertyTotal / searchFilter.limit) || 1}
										onChange={propertyPaginationChangeHandler}
										shape="circular"
										color="primary"
									/>
								</Stack>
								<span>
									Total {propertyTotal} car{propertyTotal > 1 ? 's' : ''} available
								</span>
							</>
						) : (
							<div className={'no-data'}>
								<img src="/img/icons/icoAlert.svg" alt="" />
								<p>No listings found!</p>
							</div>
						)}
					</Stack>
				</Stack>

				<Stack className={'review-box'}>
					<Stack className={'main-intro'}>
						<span>Dealer Reviews</span>
						<p>Leave your honest feedback</p>
					</Stack>

					{commentTotal !== 0 && (
						<Stack className={'review-wrap'}>
							<Box component={'div'} className={'title-box'}>
								<StarIcon />
								<span>
									{commentTotal} review{commentTotal > 1 ? 's' : ''}
								</span>
							</Box>

							{dealerComments?.map((comment: Comment) => (
								<ReviewCard comment={comment} key={comment?._id} />
							))}

							<Box component={'div'} className={'pagination-box'}>
								<Pagination
									page={commentInquiry.page}
									count={Math.ceil(commentTotal / commentInquiry.limit) || 1}
									onChange={commentPaginationChangeHandler}
									shape="circular"
									color="primary"
								/>
							</Box>
						</Stack>
					)}

					<Stack className={'leave-review-config'}>
						<Typography className={'main-title'}>Leave A Review</Typography>
						<Typography className={'review-title'}>Your review</Typography>

						<textarea
							onChange={({ target: { value } }: any) => setInsertCommentData({ ...insertCommentData, commentContent: value })}
							value={insertCommentData.commentContent}
							placeholder="Write something helpful..."
						/>

						<Box className={'submit-btn'} component={'div'}>
							<Button
								className={'submit-review'}
								disabled={insertCommentData.commentContent === '' || user?._id === ''}
								onClick={createCommentHandler}
							>
								<Typography className={'title'}>Submit Review</Typography>
							</Button>
						</Box>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

AgentDetail.defaultProps = {
	initialInput: {
		page: 1,
		limit: 9,
		search: { memberId: '' },
	},
	initialComment: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'ASC',
		search: { commentRefId: '' },
	},
};

export default withLayoutBasic(AgentDetail);
