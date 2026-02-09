import React from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Link from 'next/link';

interface EventData {
	eventTitle: string;
	city: string;
	description: string;
	imageSrc: string;
}

const eventsData: EventData[] = [
	{
		eventTitle: 'Car Meet & Night Cruise',
		city: 'Tashkent',
		description: 'Weekend night cruise with top builds, music and safe route. Join the community ride!',
		imageSrc: '/img/events/tashkent.jpg',
	},
	{
		eventTitle: 'Track Day Training',
		city: 'Samarkand',
		description: 'Improve your driving skills on a controlled track. Limited slots, helmets required.',
		imageSrc: '/img/events/samarqand.jpg',
	},
	{
		eventTitle: 'Detailing & Wrap Show',
		city: 'Nukus',
		description: 'Best detailing studios and wrap artists. Live demo, discounts, and giveaways.',
		imageSrc: '/img/events/nukus.jpg',
	},
	{
		eventTitle: 'Auto Expo Weekend',
		city: 'Bukhara',
		description: 'New models, test drives, and dealer offers. Family-friendly expo with activities.',
		imageSrc: '/img/events/bukhara.jpg',
	},
];

const EventCard = ({ event }: { event: EventData }) => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return (
			<Stack
				className="event-card"
				style={{
					backgroundImage: `url(${event?.imageSrc})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
				}}
			>
				<Box className="overlay" />
				<Box className="event-top">
					<span className="city-pill">{event?.city}</span>
				</Box>

				<Box className="event-bottom">
					<strong className="title">{event?.eventTitle}</strong>
					<span className="desc">{event?.description}</span>
					<Box className="cta-row">
						<span className="cta">View details</span>
						<span className="arrow">→</span>
					</Box>
				</Box>
			</Stack>
		);
	}

	return (
		<Stack
			className="event-card"
			style={{
				backgroundImage: `url(${event?.imageSrc})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
			}}
		>
			<Box className="overlay" />
			<Box className="event-top">
				<span className="city-pill">{event?.city}</span>
				<span className="badge">LIVE</span>
			</Box>

			<Box className="event-bottom">
				<strong className="title">{event?.eventTitle}</strong>
				<span className="desc">{event?.description}</span>
				<Box className="cta-row">
					<span className="cta">Explore event</span>
					<span className="arrow">→</span>
				</Box>
			</Box>
		</Stack>
	);
};

const Events = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return (
			<Stack className={'events'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box className={'left'}>
							<span className={'white'}>Events</span>
							<p className={'white'}>New meets, track days & community rides</p>
						</Box>
					</Stack>

					<Stack className={'card-wrapper'}>
						{eventsData.map((event: EventData) => (
							<EventCard event={event} key={event?.eventTitle} />
						))}
					</Stack>
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack className={'events'}>
			<Stack className={'container'}>
				<Stack className={'info-box'}>
					<Box className={'left'}>
						<span className={'white'}>Events</span>
						<p className={'white'}>New meets, track days & community rides</p>
					</Box>
					<Box className={'right'}>
						<Link href="/events" passHref legacyBehavior>
							<a className="see-all-link">
								<span>See all</span>
								<span className="arrow">↗</span>
							</a>
						</Link>
					</Box>

				</Stack>

				<Stack className={'card-wrapper'}>
					{eventsData.map((event: EventData) => (
						<EventCard event={event} key={event?.eventTitle} />
					))}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Events;
