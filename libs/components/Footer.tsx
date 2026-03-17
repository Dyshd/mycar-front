import React, { useState } from 'react';
import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import TwitterIcon from '@mui/icons-material/Twitter';
import useDeviceDetect from '../hooks/useDeviceDetect';
import { Stack, Box, IconButton, Button } from '@mui/material';
import moment from 'moment';
import Link from 'next/link';

const Footer = () => {
	const device = useDeviceDetect();
	const [email, setEmail] = useState('');

	const onSubscribe = () => {
		// backend bo‘lsa shu yerda API call qilasan
		// hozircha front-only:
		if (!email || !email.includes('@')) {
			alert('Please enter a valid email');
			return;
		}
		alert('Subscribed!');
		setEmail('');
	};

	const Social = () => (
		<div className="media-box">
			<IconButton className="social-btn" aria-label="facebook">
				<FacebookOutlinedIcon />
			</IconButton>
			<IconButton className="social-btn" aria-label="telegram">
				<TelegramIcon />
			</IconButton>
			<IconButton className="social-btn" aria-label="instagram">
				<InstagramIcon />
			</IconButton>
			<IconButton className="social-btn" aria-label="twitter">
				<TwitterIcon />
			</IconButton>
		</div>
	);

	const Links = () => (
		<Box component={'div'} className={'links-grid'}>
			<div>
				<strong>Popular</strong>
				<Link href="/property"><span>Cars for Sale</span></Link>
				<Link href="/property"><span>Cars for Rent</span></Link>
				<Link href="/agent"><span>Top Dealers</span></Link>
			</div>

			<div>
				<strong>Company</strong>
				<Link href="/cs"><span>Support</span></Link>
				<Link href="/cs"><span>FAQs</span></Link>
				<Link href="/cs"><span>Contact</span></Link>
			</div>

			<div>
				<strong>Legal</strong>
				<Link href="/cs"><span>Terms</span></Link>
				<Link href="/cs"><span>Privacy</span></Link>
				<Link href="/cs"><span>Sitemap</span></Link>
			</div>
		</Box>
	);

	if (device === 'mobile') {
		return (
			<Stack id="footer">
				<Stack className={'footer-container'}>
					<Stack className={'main'}>
						<Stack className={'brand'}>
							<Box component="div" className={'logo-row'}>
								<img src="/img/logo/logoWhite.svg" alt="" className={'logo'} />
								<span className="brand-tag">Find your next ride</span>
							</Box>

							<Box component="div" className={'contact-card'}>
								<span className="muted">Customer care</span>
								<p className="strong">+82 10 4867 2909</p>
								<span className="muted">Support (24/7)</span>
							</Box>

							<Box component="div" className={'social-card'}>
								<p className="strong">Follow us</p>
								<Social />
							</Box>
						</Stack>

						<Stack className={'subscribe'}>
							<strong>Get updates</strong>
							<div className={'subscribe-box'}>
								<input
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									type="text"
									placeholder={'Your Email'}
								/>
								<Button className="subscribe-btn" onClick={onSubscribe}>
									Subscribe
								</Button>
							</div>
						</Stack>

						<Links />
					</Stack>

					<Stack className={'second'}>
						<span>© MyCars - All rights reserved. {moment().year()}</span>
						<span>Privacy · Terms · Sitemap</span>
					</Stack>
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack id="footer">
			<Stack className={'footer-container'}>
				<Stack className={'main'}>
					<Stack className={'left'}>
						<Box component="div" className={'footer-box'}>
							<Box component="div" className={'logo-row'}>
								<img src="/img/logo/mycar-logo.png" alt="" className={'logo'} />
								<span className="brand-tag">Find your next ride</span>
							</Box>
						</Box>

						<Box component="div" className={'footer-box'}>
							<span className="muted">total free customer care</span>
							<p className="strong">+82 10 4867 2909</p>
						</Box>

						<Box component="div" className={'footer-box'}>
							<span className="muted">need live support?</span>
							<p className="strong">+82 10 4867 2909</p>
							<span className="muted">We reply fast</span>
						</Box>

						<Box component="div" className={'footer-box'}>
							<p className="strong">follow us on social media</p>
							<Social />
						</Box>
					</Stack>

					<Stack className={'right'}>
						<Box component="div" className={'top'}>
							<strong>Keep yourself up to date</strong>
							<div className={'subscribe-box'}>
								<input
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									type="text"
									placeholder={'Your Email'}
								/>
								<Button className="subscribe-btn" onClick={onSubscribe}>
									Subscribe
								</Button>
							</div>
						</Box>

						<Box component="div"className={'bottom'}>
							<Links />
						</Box>
					</Stack>
				</Stack>

				<Stack className={'second'}>
					<span>© MyCars - All rights reserved. {moment().year()}</span>
					<span>Privacy · Terms · Sitemap</span>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Footer;
