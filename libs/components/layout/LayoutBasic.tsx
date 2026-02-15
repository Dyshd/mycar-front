import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import Top from '../Top';
import Footer from '../Footer';
import { Stack } from '@mui/material';
import { getJwtToken, updateUserInfo } from '../../auth';
import Chat from '../Chat';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { useTranslation } from 'next-i18next';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

type HeaderConfig = {
  title: string;
  desc: string;
  bgImage?: string; // optional
  hideHeader?: boolean; // optional
};

const withLayoutBasic = (Component: any) => {
  return (props: any) => {
    const router = useRouter();
    const { t } = useTranslation('common');
    const device = useDeviceDetect();
    const [authHeader, setAuthHeader] = useState<boolean>(false);
    const user = useReactiveVar(userVar);

    // ✅ shu yerda boshqarasan:
    // header rasm ko‘rinsinmi yo‘qmi
    const ENABLE_HEADER_IMAGE = false; // <<<<<< true qilsang rasm chiqadi

    const headerConfig: HeaderConfig = useMemo(() => {
      let cfg: HeaderConfig = { title: '', desc: '' };

      switch (router.pathname) {
        case '/property':
          cfg = {
            title: 'Cars Search',
            desc: 'We are glad to see you again!',
            bgImage: '/img/banner/porsche.avif',
          };
          break;

        case '/agent':
          cfg = {
            title: 'Dealers',
            desc: 'Find trusted dealers and browse their listings',
            bgImage: '/img/banner/porsche2.avif',
          };
          break;

        case '/agent/detail':
          cfg = {
            title: 'Dealer Profile',
            desc: 'View listings and dealer reviews',
            bgImage: '/img/banner/header2.svg',
          };
          break;

        case '/mypage':
          cfg = {
            title: 'My Page',
            desc: 'Manage your profile and activity',
            bgImage: '/img/banner/header1.svg',
          };
          break;

        case '/community':
          cfg = {
            title: 'Community',
            desc: 'Share your thoughts and connect',
            bgImage: '/img/banner/header2.svg',
          };
          break;

        case '/community/detail':
          cfg = {
            title: 'Community Detail',
            desc: 'Read full post and comments',
            bgImage: '/img/banner/header2.svg',
          };
          break;

        case '/cs':
          cfg = {
            title: 'Customer Support',
            desc: 'We are glad to see you again!',
            bgImage: '/img/banner/header2.svg',
          };
          break;

        case '/account/join':
          cfg = {
            title: 'Login/Signup',
            desc: 'Authentication Process',
            bgImage: '/img/banner/header2.svg',
          };
          break;

        case '/member':
          cfg = {
            title: 'Member Page',
            desc: 'Profile and listings',
            bgImage: '/img/banner/header1.svg',
          };
          break;

        default:
          cfg = { title: '', desc: '', hideHeader: true };
          break;
      }

      return cfg;
    }, [router.pathname]);

    /** LIFECYCLES **/
    useEffect(() => {
      const jwt = getJwtToken();
      if (jwt) updateUserInfo(jwt);
    }, []);

    useEffect(() => {
      if (router.pathname === '/account/join') setAuthHeader(true);
      else setAuthHeader(false);
    }, [router.pathname]);

    // ✅ Header style: rasm bo‘lsa ham, bo‘lmasa ham premium ko‘rinish
    const headerStyle: React.CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundImage:
        ENABLE_HEADER_IMAGE && headerConfig.bgImage
          ? `url(${headerConfig.bgImage})`
          : 'none',
    };

    // ✅ Gradient fallback (rasmsiz ham “wow” ko‘rinadi)
    const headerOverlayStyle: React.CSSProperties = {
      position: 'absolute',
      inset: 0,
      background:
        'radial-gradient(900px 220px at 20% 100%, rgba(235,103,83,0.25), rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(17,19,24,0.88), rgba(17,19,24,0.45) 55%, rgba(17,19,24,0.20) 100%)',
      boxShadow: 'inset 10px 40px 160px 40px rgba(0,0,0,0.55)',
      pointerEvents: 'none',
    };

    if (device === 'mobile') {
      return (
        <>
          <Head>
            <title>Nestar</title>
            <meta name={'title'} content={`Nestar`} />
          </Head>

          <Stack id="mobile-wrap">
            <Stack id="top">
              <Top />
            </Stack>

            <Stack id="main">
              <Component {...props} />
            </Stack>

            <Stack id="footer">
              <Footer />
            </Stack>
          </Stack>
        </>
      );
    }

    return (
      <>
        <Head>
          <title>Nestar</title>
          <meta name={'title'} content={`Nestar`} />
        </Head>

        <Stack id="pc-wrap">
          <Stack id="top">
            <Top />
          </Stack>

          {!headerConfig.hideHeader && (
            <Stack className={`header-basic ${authHeader ? 'auth' : ''}`} style={headerStyle}>
              {/* overlay */}
              <div style={headerOverlayStyle} />

              <Stack className="container" style={{ position: 'relative', zIndex: 2 }}>
                <strong>{t(headerConfig.title)}</strong>
                <span>{t(headerConfig.desc)}</span>
              </Stack>
            </Stack>
          )}

          <Stack id="main">
            <Component {...props} />
          </Stack>

          <Chat />

          <Stack id="footer">
            <Footer />
          </Stack>
        </Stack>
      </>
    );
  };
};

export default withLayoutBasic;
