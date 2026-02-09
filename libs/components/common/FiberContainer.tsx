import React from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Stack } from '@mui/material';

const HeroVideo  = () => {
	const device = useDeviceDetect();

	return (
		<Stack
			className={'video-frame'}
			sx={{
				position: 'relative',
				width: '100%',
				height: '520px',
				overflow: 'hidden',
				background: '#0B0F1A',
			}}
		>
			{/* VIDEO */}
			<video
				autoPlay
				muted
				loop
				playsInline
				preload="auto"
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: 'cover',
				}}
			>
				<source src="/video/car.webm" type="video/webm" />
				<source src="/video/car.mp4" type="video/mp4" />
			</video>

			{/* DARK OVERLAY */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)',
				}}
			/>

			{/* TEXT (optional) */}
			<div
				style={{
					position: 'absolute',
					left: '6%',
					top: '50%',
					transform: 'translateY(-50%)',
					color: 'white',
					zIndex: 2,
				}}
			>
				<div style={{ fontSize: 44, fontWeight: 800 }}>MyCar</div>
				<div style={{ marginTop: 10, fontSize: 18 }}>
					Mashina topish — tez va ishonchli
				</div>
			</div>
		</Stack>
	);
};

export default HeroVideo;
