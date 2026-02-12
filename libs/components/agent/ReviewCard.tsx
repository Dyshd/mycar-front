import React from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Stack, Box, Typography } from '@mui/material';
import { Comment } from '../../types/comment/comment';
import Moment from 'react-moment';
import { REACT_APP_API_URL } from '../../config';

interface ReviewCardProps {
	fromMyPage?: string;
	comment: Comment;
}

const ReviewCard = (props: ReviewCardProps) => {
	const { fromMyPage, comment } = props;
	const device = useDeviceDetect();

	const imagePath: string = comment?.memberData?.memberImage
		? `${REACT_APP_API_URL}/${comment?.memberData?.memberImage}`
		: '/img/profile/defaultUser.svg';

	if (device === 'mobile') return <div>REVIEW CARD</div>;

	return (
		<Box component={'div'} className={'dealer-review-card'}>
			<div className={'header'}>
				<div className={'left'}>
					<img src={imagePath} alt="" />
					<div className={'meta'}>
						<strong>{comment.memberData?.memberNick}</strong>
						<span>
							<Moment format={'DD MMMM, YYYY'}>{comment.createdAt}</Moment>
						</span>
					</div>
				</div>

				{fromMyPage && (
					<Stack className="reply-button-box">
						<Typography className="reply-text">Reply</Typography>
					</Stack>
				)}
			</div>

			<p className="text">{comment.commentContent}</p>
		</Box>
	);
};

export default ReviewCard;
