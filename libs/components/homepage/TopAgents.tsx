import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper';
import TopAgentCard from './TopAgentCard';
import { Member } from '../../types/member/member';
import { AgentsInquiry } from '../../types/member/member.input';
import { GET_AGENTS } from '../../../apollo/user/query';
import { useQuery } from '@apollo/client';
import { T } from '../../types/common';

interface TopAgentsProps {
	initialInput: AgentsInquiry;
}

const TopAgents = (props: TopAgentsProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const [topAgents, setTopAgents] = useState<Member[]>([]);

	useQuery(GET_AGENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTopAgents(data?.getAgents?.list);
		},
	});

	const goAgents = async () => {
		// sizda agents route qanday bo‘lsa shunga moslang
		await router.push('/agent');
	};

	if (device === 'mobile') {
		return (
			<Stack className={'top-agents'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Top Dealers</span>
					</Stack>

					<Stack className={'wrapper'}>
						<Swiper
							className={'top-agents-swiper'}
							slidesPerView={'auto'}
							centeredSlides={true}
							spaceBetween={16}
							modules={[Autoplay]}
						>
							{topAgents.map((agent: Member) => (
								<SwiperSlide className={'top-agents-slide'} key={agent?._id}>
									<TopAgentCard agent={agent} />
								</SwiperSlide>
							))}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack className={'top-agents'}>
			<Stack className={'container'}>
				<Stack className={'info-box'}>
					<Box component={'div'} className={'left'}>
						<span>Top Dealers</span>
						<p>Verified sellers • Fast response</p>
					</Box>

					<Box component={'div'} className={'right'}>
						<div className={'more-box'} role="button" tabIndex={0} onClick={goAgents} onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') goAgents();
						}}>
							<span>See All Dealers</span>
							<img src="/img/icons/rightup.svg" alt="" />
						</div>
					</Box>
				</Stack>

				<Stack className={'wrapper'}>
					{/* <Box component={'div'} className={'switch-btn swiper-agents-prev'}>
						<ArrowBackIosNewIcon />
					</Box> */}

					<Box component={'div'} className={'card-wrapper'}>
						<Swiper
							className={'top-agents-swiper'}
							slidesPerView={'auto'}
							spaceBetween={18}
							modules={[Autoplay, Navigation]}
							navigation={{
								nextEl: '.swiper-agents-next',
								prevEl: '.swiper-agents-prev',
							}}
						>
							{topAgents.map((agent: Member) => (
								<SwiperSlide className={'top-agents-slide'} key={agent?._id}>
									<TopAgentCard agent={agent} />
								</SwiperSlide>
							))}
						</Swiper>
					</Box>
{/* 
					<Box component={'div'} className={'switch-btn swiper-agents-next'}>
						<ArrowBackIosNewIcon />
					</Box> */}
				</Stack>
			</Stack>
		</Stack>
	);
};

TopAgents.defaultProps = {
	initialInput: {
		page: 1,
		limit: 10,
		sort: 'memberRank',
		direction: 'DESC',
		search: {},
	},
};

export default TopAgents;
