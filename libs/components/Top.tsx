import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, withRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { Stack, Box, Button, Menu, MenuItem, IconButton, Divider } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import { CaretDown } from 'phosphor-react';
import { useReactiveVar } from '@apollo/client';

import useDeviceDetect from '../hooks/useDeviceDetect';
import { getJwtToken, logOut, updateUserInfo } from '../auth';
import { userVar } from '../../apollo/store';
import { REACT_APP_API_URL } from '../config';

import type { MenuProps } from '@mui/material/Menu';

const StyledMenu = styled((props: MenuProps) => (
	<Menu
		elevation={0}
		anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
		transformOrigin={{ vertical: 'top', horizontal: 'right' }}
		{...props}
	/>
))(({ theme }) => ({
	'& .MuiPaper-root': {
		borderRadius: 12,
		marginTop: theme.spacing(1),
		minWidth: 180,
		background: 'rgba(17, 19, 24, 0.92)',
		backdropFilter: 'blur(10px)',
		border: '1px solid rgba(255,255,255,0.10)',
		color: 'rgba(255,255,255,0.92)',
		boxShadow: '0 10px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)',
		'& .MuiMenu-list': { padding: '8px' },
		'& .MuiMenuItem-root': {
			borderRadius: 10,
			fontSize: 14,
			fontWeight: 600,
			padding: '10px 10px',
			'&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
			'&:active': {
				backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
			},
		},
	},
}));

const Top = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');
	const router = useRouter();

	const [lang, setLang] = useState<string>('en');

	const [scrolled, setScrolled] = useState(false);

	const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
	const langOpen = Boolean(langAnchor);

	const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
	const userOpen = Boolean(userAnchor);

	const [mobileOpen, setMobileOpen] = useState(false);

	const forceTransparent = useMemo(() => {
		return router.pathname === '/property/detail';
	}, [router.pathname]);

	/** LIFECYCLES **/
	useEffect(() => {
		const stored = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
		if (!stored) {
			if (typeof window !== 'undefined') localStorage.setItem('locale', 'en');
			setLang('en');
		} else {
			setLang(stored);
		}
	}, [router.asPath]);

	useEffect(() => {
		const jwt = getJwtToken();
		if (jwt) updateUserInfo(jwt);
	}, []);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY >= 40);
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	/** HANDLERS **/
	const openLang = (e: any) => setLangAnchor(e.currentTarget);
	const closeLang = () => setLangAnchor(null);

	const chooseLang = useCallback(
		async (code: 'en' | 'ru' | 'kr') => {
			setLang(code);
			localStorage.setItem('locale', code);
			setLangAnchor(null);
			await router.push(router.asPath, router.asPath, { locale: code });
		},
		[router],
	);

	const openUserMenu = (e: any) => setUserAnchor(e.currentTarget);
	const closeUserMenu = () => setUserAnchor(null);

	const doLogout = async () => {
		closeUserMenu();
		logOut();
	};

	// ✅ AGENTS → DEALERS
	const NavLinks = () => (
		<>
			<Link href={'/'}>
				<div className="nav-link">{t('Home')}</div>
			</Link>

			<Link href={'/property'}>
				<div className="nav-link">{t('Cars')}</div>
			</Link>

			{/* Eslatma: agar sizda route hali /agent bo‘lsa, /dealer ni /agent qilib qoldiring */}
			<Link href={'/agent'}>
				<div className="nav-link">{t('Dealers')}</div>
			</Link>


			<Link href={'/community?articleCategory=FREE'}>
				<div className="nav-link">{t('Community')}</div>
			</Link>

			{user?._id && (
				<Link href={'/mypage'}>
					<div className="nav-link">{t('My Page')}</div>
				</Link>
			)}

			<Link href={'/cs'}>
				<div className="nav-link">{t('CS')}</div>
			</Link>
		</>
	);

	// MOBILE
	if (device === 'mobile') {
		return (
			<Stack id="top" className="top-mobile">
				<Stack className={`navbar-main ${scrolled ? 'transparent' : ''} ${forceTransparent ? 'transparent' : ''}`}>
					<Stack className="container">
						<Box className="logo-box">
							<Link href={'/'}>
								<img src="/img/logo/mycar-logo.png" alt="" />
							</Link>
						</Box>

						<Stack direction="row" alignItems="center" gap={1}>
							{user?._id && (
								<IconButton className="icon-btn" aria-label="notifications">
									<NotificationsOutlinedIcon />
								</IconButton>
							)}

							<IconButton className="icon-btn" onClick={() => setMobileOpen((p) => !p)} aria-label="menu">
								{mobileOpen ? <CloseIcon /> : <MenuIcon />}
							</IconButton>
						</Stack>
					</Stack>
				</Stack>

				{mobileOpen && (
					<Stack className="mobile-drawer">
						<NavLinks />
						<Divider className="divider" />
						<Stack direction="row" justifyContent="space-between" alignItems="center" className="mobile-bottom">
							{!user?._id ? (
								<Link href={'/account/join'}>
									<div className="join-box">
										<AccountCircleOutlinedIcon />
										<span>
											{t('Login')} / {t('Register')}
										</span>
									</div>
								</Link>
							) : (
								<Button className="logout-btn" startIcon={<LogoutIcon />} onClick={doLogout}>
									Logout
								</Button>
							)}

							<Button
								disableRipple
								className="btn-lang"
								onClick={openLang}
								endIcon={<CaretDown size={14} color="#C9C9C9" weight="fill" />}
							>
								<img className="img-flag" src={`/img/flag/lang${lang}.png`} alt="flag" />
							</Button>
						</Stack>
					</Stack>
				)}

				<StyledMenu anchorEl={langAnchor} open={langOpen} onClose={closeLang}>
					<MenuItem onClick={() => chooseLang('en')}>
						<img className="img-flag" src={'/img/flag/langen.png'} alt="en" />
						{t('English')}
					</MenuItem>
					<MenuItem onClick={() => chooseLang('kr')}>
						<img className="img-flag" src={'/img/flag/langkr.png'} alt="kr" />
						{t('Korean')}
					</MenuItem>
					<MenuItem onClick={() => chooseLang('ru')}>
						<img className="img-flag" src={'/img/flag/langru.png'} alt="ru" />
						{t('Russian')}
					</MenuItem>
				</StyledMenu>
			</Stack>
		);
	}

	// DESKTOP
	return (
		<Stack id="top">
			<Stack className="navbar">
				<Stack className={`navbar-main ${scrolled ? 'transparent' : ''} ${forceTransparent ? 'transparent' : ''}`}>
					<Stack className="container">
						<Box className="logo-box">
							<Link href={'/'}>
								<img src="/img/logo/mycar-logo.png" alt="" />
							</Link>
						</Box>

						<Box className="router-box">
							<NavLinks />
						</Box>

						<Box className="user-box">
							{user?._id ? (
								<Stack direction="row" alignItems="center" gap={1.2}>
									<IconButton className="icon-btn" aria-label="notifications">
										<NotificationsOutlinedIcon className="notification-icon" />
									</IconButton>

									<div className="login-user" onClick={openUserMenu}>
										<img
											src={user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'}
											alt="user"
										/>
									</div>

									<Menu
										anchorEl={userAnchor}
										open={userOpen}
										onClose={closeUserMenu}
										sx={{ mt: '10px' }}
										PaperProps={{
											sx: {
												borderRadius: '12px',
												overflow: 'hidden',
												background: 'rgba(17, 19, 24, 0.92)',
												backdropFilter: 'blur(10px)',
												border: '1px solid rgba(255,255,255,0.10)',
												color: 'rgba(255,255,255,0.92)',
												minWidth: 180,
											},
										}}
									>
										<MenuItem
											onClick={() => {
												closeUserMenu();
												router.push('/mypage');
											}}
										>
											My Page
										</MenuItem>
										<Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
										<MenuItem onClick={doLogout}>
											<LogoutIcon fontSize="small" style={{ marginRight: 10 }} />
											Logout
										</MenuItem>
									</Menu>
								</Stack>
							) : (
								<Link href={'/account/join'}>
									<div className="join-box">
										<AccountCircleOutlinedIcon />
										<span>
											{t('Login')} / {t('Register')}
										</span>
									</div>
								</Link>
							)}

							<div className="lan-box">
								<Button
									disableRipple
									className="btn-lang"
									onClick={openLang}
									endIcon={<CaretDown size={14} color="#C9C9C9" weight="fill" />}
								>
									<img className="img-flag" src={`/img/flag/lang${lang}.png`} alt="flag" />
								</Button>

								<StyledMenu anchorEl={langAnchor} open={langOpen} onClose={closeLang}>
									<MenuItem onClick={() => chooseLang('en')}>
										<img className="img-flag" src={'/img/flag/langen.png'} alt="en" />
										{t('English')}
									</MenuItem>
									<MenuItem onClick={() => chooseLang('kr')}>
										<img className="img-flag" src={'/img/flag/langkr.png'} alt="kr" />
										{t('Korean')}
									</MenuItem>
									<MenuItem onClick={() => chooseLang('ru')}>
										<img className="img-flag" src={'/img/flag/langru.png'} alt="ru" />
										{t('Russian')}
									</MenuItem>
								</StyledMenu>
							</div>
						</Box>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withRouter(Top);
