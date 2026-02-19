import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { NextPage } from 'next';
import Review from '../../libs/components/property/Review';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay, Navigation, Pagination } from 'swiper';
import PropertyBigCard from '../../libs/components/common/PropertyBigCard';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { Property } from '../../libs/types/property/property';
import moment from 'moment';
import { formatterStr } from '../../libs/utils';
import { REACT_APP_API_URL } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Pagination as MuiPagination } from '@mui/material';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import 'swiper/css';
import 'swiper/css/pagination';
import { GET_COMMENTS, GET_PROPERTIES, GET_PROPERTY } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CREATE_COMMENT, LIKE_TARGET_PROPERTY } from '../../apollo/user/mutation';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

// ✅ SHUNI QO‘SH
import { transmissionLabel } from '../../libs/utils/transmission';

SwiperCore.use([Autoplay, Navigation, Pagination]);

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** =========================
 * DISPLAY HELPERS (UI only)
 * Backend fieldlar o‘zgarmaydi
 * ========================= */

const getSeatsLabel = (beds?: any) => {
	const v = Number(beds);
	if (!Number.isFinite(v) || v <= 0) return 'N/A';
	return `${v} Seats`;
};

const getMileageLabel = (square?: any) => {
	// AddProperty’da endi qo‘lda yoziladigan km -> propertySquare’ga tushyapti
	const v = Number(square);
	if (!Number.isFinite(v) || v <= 0) return 'N/A';
	return `${v.toLocaleString('en-US')} km`;
};

const PropertyDetail: NextPage = ({ initialComment }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);

	const [propertyId, setPropertyId] = useState<string | null>(null);
	const [property, setProperty] = useState<Property | null>(null);
	const [slideImage, setSlideImage] = useState<string>('');

	const [destinationProperties, setDestinationProperties] = useState<Property[]>([]);
	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>(initialComment);
	const [propertyComments, setPropertyComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);

	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.CAR,
		commentContent: '',
		commentRefId: '',
	});

	/** APOLLO **/
	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY);
	const [createComment] = useMutation(CREATE_COMMENT);

	// 1) property id set
	useEffect(() => {
		if (router.query.id) {
			const id = router.query.id as string;
			setPropertyId(id);

			setCommentInquiry((prev) => ({
				...prev,
				search: { commentRefId: id },
			}));

			setInsertCommentData((prev) => ({
				...prev,
				commentRefId: id,
			}));
		}
	}, [router.query.id]);

	// 2) GET_PROPERTY
	const { loading: getPropertyLoading, refetch: getPropertyRefetch } = useQuery(GET_PROPERTY, {
		fetchPolicy: 'network-only',
		variables: { input: propertyId },
		skip: !propertyId,
		notifyOnNetworkStatusChange: true,
		onCompleted(data: T) {
			if (data?.getProperty) {
				setProperty(data.getProperty);
				setSlideImage(data.getProperty?.propertyImages?.[0] || '');
			}
		},
	});

	// 3) similar list vars (property kelgandan keyin)
	const destinationVariables = useMemo(() => {
		const loc = property?.propertyLocation ? [property.propertyLocation] : [];
		return {
			input: {
				page: 1,
				limit: 4,
				sort: 'createdAt',
				direction: Direction.DESC,
				search: { locationList: loc },
			},
		};
	}, [property?.propertyLocation]);

	const { refetch: getPropertiesRefetch } = useQuery(GET_PROPERTIES, {
		fetchPolicy: 'cache-and-network',
		variables: destinationVariables,
		skip: !propertyId || !property?.propertyLocation,
		notifyOnNetworkStatusChange: true,
		onCompleted(data: T) {
			if (data?.getProperties?.list) setDestinationProperties(data.getProperties.list);
		},
	});

	// 4) comments
	const { refetch: getCommentsRefetch } = useQuery(GET_COMMENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialComment },
		skip: !commentInquiry.search.commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			if (data?.getComments?.list) setPropertyComments(data.getComments.list);
			setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
		},
	});

	useEffect(() => {
		if (commentInquiry.search.commentRefId) getCommentsRefetch({ input: commentInquiry });
	}, [commentInquiry.search.commentRefId]);

	/** HANDLERS **/
	const changeImageHandler = (image: string) => setSlideImage(image);

	const likePropertyHandler = async (u: T, id: string) => {
		try {
			if (!id) return;
			if (!u?._id) throw new Error(Message.NOT_AUTHENTICATED);

			await likeTargetProperty({ variables: { input: id } });

			await getPropertyRefetch({ input: id });
			if (property?.propertyLocation) {
				await getPropertiesRefetch(destinationVariables);
			}

			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likePropertyHandler');
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const commentPaginationChangeHandler = (_: ChangeEvent<unknown>, value: number) => {
		setCommentInquiry((prev) => ({ ...prev, page: value }));
	};

	const createCommentHandler = async () => {
		try {
			if (!user?._id) throw new Error(Message.NOT_AUTHENTICATED);

			await createComment({ variables: { input: insertCommentData } });

			setInsertCommentData((prev) => ({ ...prev, commentContent: '' }));
			await getCommentsRefetch({ input: commentInquiry });
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	if (getPropertyLoading) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '1080px' }}>
				<CircularProgress size={'4rem'} />
			</Stack>
		);
	}

	if (device === 'mobile') return <div>PROPERTY DETAIL PAGE</div>;

	const mainImageSrc = slideImage ? `${REACT_APP_API_URL}${slideImage}` : '/img/property/bigImage.png';
	const memberImg = property?.memberData?.memberImage
		? `${REACT_APP_API_URL}${property.memberData.memberImage}`
		: '/img/profile/defaultUser.svg';

	const isLiked = !!property?.meLiked?.[0]?.myFavorite;

	return (
		<div id={'property-detail-page'} className="auto-detail">
			<div className={'container'}>
				<Stack className={'property-detail-config'}>
					<Stack className={'property-info-config'}>
						<Stack className={'info'}>
							<Stack className={'left-box'}>
								<Typography className={'title-main'}>{property?.propertyTitle}</Typography>

								<Stack className={'top-box'}>
									<Typography className={'city'}>{property?.propertyLocation}</Typography>
									<Stack className={'divider'} />
									<Stack className={'buy-rent-box'}>
										{property?.propertyBarter && (
											<>
												<Stack className={'circle'}>
													<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6" fill="none">
														<circle cx="3" cy="3" r="3" fill="#EB6753" />
													</svg>
												</Stack>
												<Typography className={'buy-rent'}>Trade</Typography>
											</>
										)}

										{property?.propertyRent && (
											<>
												<Stack className={'circle'}>
													<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6" fill="none">
														<circle cx="3" cy="3" r="3" fill="#EB6753" />
													</svg>
												</Stack>
												<Typography className={'buy-rent'}>Lease</Typography>
											</>
										)}

										{!property?.propertyRent && !property?.propertyBarter && <Typography className={'buy-rent'}>Sale</Typography>}
									</Stack>

									<Stack className={'divider'} />

									<Typography className={'date'}>
										{property?.createdAt ? `${moment().diff(property.createdAt, 'days')} days ago` : '—'}
									</Typography>
								</Stack>

								<Stack className={'bottom-box'}>
									<Stack className="option">
										<img src="/img/icons/bed.svg" alt="" />
										<Typography>{getSeatsLabel(property?.propertyBeds)}</Typography>
									</Stack>

									<Stack className="option">
										<img src="/img/icons/room.svg" alt="" />
										{/* ✅ SHU YER O‘ZGARDI */}
										<Typography>{transmissionLabel(property?.propertyRooms)}</Typography>
									</Stack>

									<Stack className="option">
										<img src="/img/icons/expand.svg" alt="" />
										<Typography>{getMileageLabel(property?.propertySquare)}</Typography>
									</Stack>
								</Stack>
							</Stack>

							<Stack className={'right-box'}>
								<Stack className="buttons">
									<Stack className="button-box">
										<RemoveRedEyeIcon fontSize="medium" />
										<Typography>{property?.propertyViews ?? 0}</Typography>
									</Stack>

									<Stack className="button-box">
										<Box
											component="span"
											sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
											onClick={() => likePropertyHandler(user, property?._id as string)}
										>
											{isLiked ? <FavoriteIcon color="primary" fontSize={'medium'} /> : <FavoriteBorderIcon fontSize={'medium'} />}
										</Box>
										<Typography>{property?.propertyLikes ?? 0}</Typography>
									</Stack>
								</Stack>

								<Typography>${formatterStr(property?.propertyPrice)}</Typography>
							</Stack>
						</Stack>

						<Stack className={'images'}>
							<Stack className={'main-image'}>
								<img src={mainImageSrc} alt={'main-image'} />
							</Stack>

							<Stack className={'sub-images'}>
								{property?.propertyImages?.map((subImg: string) => {
									const imagePath = `${REACT_APP_API_URL}${subImg}`;
									return (
										<Stack className={'sub-img-box'} onClick={() => changeImageHandler(subImg)} key={subImg}>
											<img src={imagePath} alt={'sub-image'} />
										</Stack>
									);
								})}
							</Stack>
						</Stack>
					</Stack>

					<Stack className={'property-desc-config'}>
						<Stack className={'left-config'}>
							<Stack className={'options-config'}>
								<Stack className={'option'}>
									<Stack className={'svg-box'}>
										<img src="/img/icons/bed.svg" alt="" />
									</Stack>
									<Stack className={'option-includes'}>
										<Typography className={'title'}>Seats</Typography>
										<Typography className={'option-data'}>{getSeatsLabel(property?.propertyBeds)}</Typography>
									</Stack>
								</Stack>

								<Stack className={'option'}>
									<Stack className={'svg-box'}>
										<img src={'/img/icons/room.svg'} alt="" />
									</Stack>
									<Stack className={'option-includes'}>
										<Typography className={'title'}>Transmission</Typography>
										{/* ✅ SHU YER O‘ZGARDI */}
										<Typography className={'option-data'}>{transmissionLabel(property?.propertyRooms)}</Typography>
									</Stack>
								</Stack>

								<Stack className={'option'}>
									<Stack className={'svg-box'}>
										<img src={'/img/icons/expand.svg'} alt="" />
									</Stack>
									<Stack className={'option-includes'}>
										<Typography className={'title'}>Mileage</Typography>
										<Typography className={'option-data'}>{getMileageLabel(property?.propertySquare)}</Typography>
									</Stack>
								</Stack>

								<Stack className={'option'}>
									<Stack className={'svg-box'}>
										<img src={'/img/icons/calendar.svg'} alt="" />
									</Stack>
									<Stack className={'option-includes'}>
										<Typography className={'title'}>Listing Year</Typography>
										<Typography className={'option-data'}>{property?.createdAt ? moment(property.createdAt).format('YYYY') : '—'}</Typography>
									</Stack>
								</Stack>
							</Stack>

							<Stack className={'prop-desc-config'}>
								<Stack className={'top'}>
									<Typography className={'title'}>Car Description</Typography>
									<Typography className={'desc'}>{property?.propertyDesc ?? 'No Description!'}</Typography>
								</Stack>

								<Stack className={'bottom'}>
									<Typography className={'title'}>Car Details</Typography>
									<Stack className={'info-box'}>
										<Stack className={'left'}>
											<Box component={'div'} className={'info'}>
												<Typography className={'title'}>Price</Typography>
												<Typography className={'data'}>${formatterStr(property?.propertyPrice)}</Typography>
											</Box>

											<Box component={'div'} className={'info'}>
												<Typography className={'title'}>Mileage</Typography>
												<Typography className={'data'}>{getMileageLabel(property?.propertySquare)}</Typography>
											</Box>

											<Box component={'div'} className={'info'}>
												<Typography className={'title'}>Transmission</Typography>
												{/* ✅ SHU YER O‘ZGARDI */}
												<Typography className={'data'}>{transmissionLabel(property?.propertyRooms)}</Typography>
											</Box>

											<Box component={'div'} className={'info'}>
												<Typography className={'title'}>Seats</Typography>
												<Typography className={'data'}>{getSeatsLabel(property?.propertyBeds)}</Typography>
											</Box>
										</Stack>

										<Stack className={'right'}>
											<Box component={'div'} className={'info'}>
												<Typography className={'title'}>Listing Year</Typography>
												<Typography className={'data'}>{property?.createdAt ? moment(property.createdAt).format('YYYY') : '—'}</Typography>
											</Box>

											<Box component={'div'} className={'info'}>
												<Typography className={'title'}>Type</Typography>
												<Typography className={'data'}>{property?.propertyType ?? '—'}</Typography>
											</Box>

											<Box component={'div'} className={'info'}>
												<Typography className={'title'}>Options</Typography>
												<Typography className={'data'}>
													{property?.propertyBarter ? 'Trade' : 'No Trade'}
													{' • '}
													{property?.propertyRent ? 'Lease' : 'Sale'}
												</Typography>
											</Box>
										</Stack>
									</Stack>
								</Stack>
							</Stack>

							<Stack className={'address-config'}>
								<Typography className={'title'}>Address</Typography>
								<Stack className={'map-box'}>
									<iframe
										src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d25867.098915951767!2d128.68632810247993!3d35.86402299180927!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35660bba427bf179%3A0x1fc02da732b9072f!2sGeumhogangbyeon-ro%2C%20Dong-gu%2C%20Daegu!5e0!3m2!1suz!2skr!4v1695537640704!5m2!1suz!2skr"
										width="100%"
										height="100%"
										style={{ border: 0 }}
										allowFullScreen={true}
										loading="lazy"
										referrerPolicy="no-referrer-when-downgrade"
									/>
								</Stack>
							</Stack>

							{commentTotal !== 0 && (
								<Stack className={'reviews-config'}>
									<Stack className={'filter-box'}>
										<Stack className={'review-cnt'}>
											<Typography className={'reviews'}>{commentTotal} reviews</Typography>
										</Stack>
									</Stack>

									<Stack className={'review-list'}>
										{propertyComments?.map((comment: Comment) => <Review comment={comment} key={comment?._id} />)}

										<Box component={'div'} className={'pagination-box'}>
											<MuiPagination
												page={commentInquiry.page}
												count={Math.ceil(commentTotal / commentInquiry.limit)}
												onChange={commentPaginationChangeHandler}
												shape="circular"
												color="primary"
											/>
										</Box>
									</Stack>
								</Stack>
							)}

							<Stack className={'leave-review-config'}>
								<Typography className={'main-title'}>Leave A Review</Typography>
								<Typography className={'review-title'}>Review</Typography>

								<textarea
									onChange={({ target: { value } }: any) => setInsertCommentData((prev) => ({ ...prev, commentContent: value }))}
									value={insertCommentData.commentContent}
								/>

								<Box className={'submit-btn'} component={'div'}>
									<Button
										className={'submit-review'}
										disabled={insertCommentData.commentContent === '' || !user?._id}
										onClick={createCommentHandler}
									>
										<Typography className={'title'}>Submit Review</Typography>
									</Button>
								</Box>
							</Stack>
						</Stack>

						<Stack className={'right-config'}>
							<Stack className={'info-box'}>
								<Typography className={'main-title'}>Get More Information</Typography>

								<Stack className={'image-info'}>
									<img className={'member-image'} src={memberImg} alt="member" />

									<Stack className={'name-phone-listings'}>
										<Link href={`/member?memberId=${property?.memberData?._id}`}>
											<Typography className={'name'}>{property?.memberData?.memberNick}</Typography>
										</Link>

										<Stack className={'phone-number'}>
											<Typography className={'number'}>{property?.memberData?.memberPhone}</Typography>
										</Stack>

										<Typography className={'listings'}>View Listings</Typography>
									</Stack>
								</Stack>
							</Stack>

							<Stack className={'info-box'}>
								<Typography className={'sub-title'}>Name</Typography>
								<input type={'text'} placeholder={'Enter your name'} />
							</Stack>

							<Stack className={'info-box'}>
								<Typography className={'sub-title'}>Phone</Typography>
								<input type={'text'} placeholder={'Enter your phone'} />
							</Stack>

							<Stack className={'info-box'}>
								<Typography className={'sub-title'}>Email</Typography>
								<input type={'text'} placeholder={'Enter your email'} />
							</Stack>

							<Stack className={'info-box'}>
								<Typography className={'sub-title'}>Message</Typography>
								<textarea placeholder={'Hello, I am interested in this car...'} />
							</Stack>

							<Stack className={'info-box'}>
								<Button className={'send-message'}>
									<Typography className={'title'}>Send Message</Typography>
								</Button>
							</Stack>
						</Stack>
					</Stack>

					{destinationProperties.length !== 0 && (
						<Stack className={'similar-properties-config'}>
							<Stack className={'title-pagination-box'}>
								<Stack className={'title-box'}>
									<Typography className={'main-title'}>More Cars Near You</Typography>
									<Typography className={'sub-title'}>Same city, fresh listings</Typography>
								</Stack>

								<Stack className={'pagination-box'}>
									<WestIcon className={'swiper-similar-prev'} />
									<div className={'swiper-similar-pagination'} />
									<EastIcon className={'swiper-similar-next'} />
								</Stack>
							</Stack>

							<Stack className={'cards-box'}>
								<Swiper
									className={'similar-homes-swiper'}
									slidesPerView={'auto'}
									spaceBetween={35}
									modules={[Autoplay, Navigation, Pagination]}
									navigation={{
										nextEl: '.swiper-similar-next',
										prevEl: '.swiper-similar-prev',
									}}
									pagination={{
										el: '.swiper-similar-pagination',
									}}
								>
									{destinationProperties.map((p: Property) => (
										<SwiperSlide className={'similar-homes-slide'} key={p?._id}>
											<PropertyBigCard property={p} likePropertyHandler={likePropertyHandler} />
										</SwiperSlide>
									))}
								</Swiper>
							</Stack>
						</Stack>
					)}
				</Stack>
			</div>
		</div>
	);
};

PropertyDetail.defaultProps = {
	initialComment: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: { commentRefId: '' },
	},
};

export default withLayoutFull(PropertyDetail);
