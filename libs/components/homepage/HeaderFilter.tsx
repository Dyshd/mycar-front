import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stack, Box, Modal, Divider, Button } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { propertySquare, propertyYears } from '../../config';
import { PropertyLocation, PropertyType } from '../../enums/property.enum';
import { PropertiesInquiry } from '../../types/property/property.input';
import router, { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

const style = {
	position: 'absolute' as const,
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 'auto',
	bgcolor: 'background.paper',
	borderRadius: '12px',
	outline: 'none',
	boxShadow: 24,
};

const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: 220,
		},
	},
};

const thisYear = new Date().getFullYear();

interface HeaderFilterProps {
	initialInput: PropertiesInquiry;
}
const pushWithInput = async (next: PropertiesInquiry) => {
	const encoded = encodeURIComponent(JSON.stringify(next));
	await router.push(`/property?input=${encoded}`, undefined, { scroll: false });
};

type DealMode = 'all' | 'sale' | 'rent';

const HeaderFilter = (props: HeaderFilterProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const { t } = useTranslation('common');
	const router = useRouter();


	// ✅ main filter
	const [searchFilter, setSearchFilter] = useState<PropertiesInquiry>(initialInput);

	// dropdown refs
	const locationRef = useRef<HTMLDivElement | null>(null);
	const typeRef = useRef<HTMLDivElement | null>(null);
	const roomsRef = useRef<HTMLDivElement | null>(null);

	// dropdown state
	const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);
	const [openLocation, setOpenLocation] = useState(false);
	const [openType, setOpenType] = useState(false);
	const [openRooms, setOpenRooms] = useState(false);

	const propertyLocation = useMemo(() => Object.values(PropertyLocation), []);
	const propertyType = useMemo(() => Object.values(PropertyType), []);

	// ✅ year + deal option UI state
	const [yearCheck, setYearCheck] = useState<{ start: number; end: number }>({ start: 1970, end: thisYear });
	const [dealMode, setDealMode] = useState<DealMode>('all');

	// outside click close
	useEffect(() => {
		const clickHandler = (event: MouseEvent) => {
			const target = event.target as Node;

			if (locationRef.current && !locationRef.current.contains(target)) setOpenLocation(false);
			if (typeRef.current && !typeRef.current.contains(target)) setOpenType(false);
			if (roomsRef.current && !roomsRef.current.contains(target)) setOpenRooms(false);
		};

		document.addEventListener('mousedown', clickHandler);
		return () => document.removeEventListener('mousedown', clickHandler);
	}, []);

	// helpers
	const closeAllSmallMenus = () => {
		setOpenRooms(false);
		setOpenType(false);
		setOpenLocation(false);
	};

	const advancedFilterHandler = (status: boolean) => {
		closeAllSmallMenus();
		setOpenAdvancedFilter(status);
	};

	const locationStateChangeHandler = () => {
		setOpenLocation((prev) => !prev);
		setOpenRooms(false);
		setOpenType(false);
	};

	const typeStateChangeHandler = () => {
		setOpenType((prev) => !prev);
		setOpenLocation(false);
		setOpenRooms(false);
	};

	const roomStateChangeHandler = () => {
		setOpenRooms((prev) => !prev);
		setOpenType(false);
		setOpenLocation(false);
	};

	// ✅ SELECT handlers
	const propertyLocationSelectHandler = useCallback((value: PropertyLocation) => {
		setSearchFilter((prev) => ({
			...prev,
			page: 1,
			search: { ...prev.search, locationList: [value] },
		}));
		// next dropdown open
		setOpenLocation(false);
		setOpenType(true);
	}, []);

	const propertyTypeSelectHandler = useCallback((value: PropertyType) => {
		setSearchFilter((prev) => ({
			...prev,
			page: 1,
			search: { ...prev.search, typeList: [value] },
		}));
		setOpenType(false);
		setOpenRooms(true);
	}, []);

	const propertyRoomSelectHandler = useCallback((value: number) => {
		setSearchFilter((prev) => ({
			...prev,
			page: 1,
			search: { ...prev.search, roomsList: [value] },
		}));
		closeAllSmallMenus();
	}, []);

	// ✅ Doors (bedsList) toggle — NOTE: number (primitive)
	const propertyDoorSelectHandler = useCallback(
		(value: number) => {
			setSearchFilter((prev) => {
				const list = (prev.search?.bedsList ?? []) as number[];

				if (value === 0) {
					// Any -> remove bedsList
					const next = { ...prev, page: 1, search: { ...prev.search } };
					// @ts-ignore
					delete next.search.bedsList;
					return next;
				}

				const exists = list.includes(value);
				const nextList = exists ? list.filter((x) => x !== value) : [...list, value];

				return {
					...prev,
					page: 1,
					search: { ...prev.search, bedsList: nextList },
				};
			});
		},
		[],
	);

	// ✅ Deal mode -> backend queryga mos
	// sale: propertyRent false/yo‘q
	// rent: propertyRent true
	const propertyDealSelectHandler = useCallback((e: any) => {
		const value = e.target.value as DealMode;
		setDealMode(value);

		setSearchFilter((prev) => {
			const next = { ...prev, page: 1, search: { ...prev.search } as any };

			// tozalash
			delete next.search.propertyRent;

			if (value === 'rent') next.search.propertyRent = true;
			if (value === 'sale') next.search.propertyRent = false;

			return next;
		});
	}, []);

	// ✅ Mileage (squaresRange)
	const mileageHandler = useCallback((e: any, type: 'start' | 'end') => {
		const value = Number(e.target.value);

		setSearchFilter((prev) => ({
			...prev,
			page: 1,
			search: {
				...prev.search,
				// @ts-ignore
				squaresRange: {
					...(prev.search?.squaresRange || { start: 0, end: 500000 }),
					[type]: value,
				},
			},
		}));
	}, []);

	// ✅ Year range (periodsRange)
	const yearStartChangeHandler = (event: any) => {
		const start = Number(event.target.value);

		setYearCheck((p) => ({ ...p, start }));
		setSearchFilter((prev) => ({
			...prev,
			page: 1,
			search: { ...prev.search, periodsRange: { start, end: yearCheck.end } },
		}));
	};

	const yearEndChangeHandler = (event: any) => {
		const end = Number(event.target.value);

		setYearCheck((p) => ({ ...p, end }));
		setSearchFilter((prev) => ({
			...prev,
			page: 1,
			search: { ...prev.search, periodsRange: { start: yearCheck.start, end } },
		}));
	};

	const resetFilterHandler = () => {
		setSearchFilter(initialInput);
		setDealMode('all');
		setYearCheck({ start: 1970, end: thisYear });
	};

	// ✅ CLEAN + PUSH
	const pushSearchHandler = async () => {
		try {
			// deep clone
			const clean: any = JSON.parse(JSON.stringify(searchFilter));
			clean.page = 1; // search bosganda 1-page

			if (!clean.search) clean.search = {};

			// empty arrays remove
			if (Array.isArray(clean.search.locationList) && clean.search.locationList.length === 0) delete clean.search.locationList;
			if (Array.isArray(clean.search.typeList) && clean.search.typeList.length === 0) delete clean.search.typeList;
			if (Array.isArray(clean.search.roomsList) && clean.search.roomsList.length === 0) delete clean.search.roomsList;
			if (Array.isArray(clean.search.bedsList) && clean.search.bedsList.length === 0) delete clean.search.bedsList;

			// empty string remove
			if (typeof clean.search.text === 'string' && clean.search.text.trim() === '') delete clean.search.text;

			// squaresRange sanity
			if (clean.search.squaresRange) {
				const s = Number(clean.search.squaresRange.start ?? 0);
				const e = Number(clean.search.squaresRange.end ?? 0);
				if (!s && !e) delete clean.search.squaresRange;
				else clean.search.squaresRange = { start: s, end: e };
			}

			// periodsRange sanity
			if (clean.search.periodsRange) {
				const s = Number(clean.search.periodsRange.start ?? 0);
				const e = Number(clean.search.periodsRange.end ?? 0);
				if (!s && !e) delete clean.search.periodsRange;
				else clean.search.periodsRange = { start: s, end: e };
			}

			const encoded = encodeURIComponent(JSON.stringify(clean));
			await router.push(`/property?input=${encoded}`, `/property?input=${encoded}`, { scroll: false });
		} catch (err: any) {
			console.log('ERROR, pushSearchHandler:', err);
		}
	};

	if (device === 'mobile') return <div>HEADER FILTER MOBILE</div>;

	return (
		<>
			<Stack className="search-box">
				<Stack className="select-box">
					<Box component="div" className={`box ${openLocation ? 'on' : ''}`} onClick={locationStateChangeHandler}>
						<span>{searchFilter?.search?.locationList?.[0] ?? 'City'}</span>
						<ExpandMoreIcon />
					</Box>

					<Box component="div" className={`box ${openType ? 'on' : ''}`} onClick={typeStateChangeHandler}>
						<span>{searchFilter?.search?.typeList?.[0] ?? 'Brand / Body'}</span>
						<ExpandMoreIcon />
					</Box>

					<Box component="div" className={`box ${openRooms ? 'on' : ''}`} onClick={roomStateChangeHandler}>
						<span>{searchFilter?.search?.roomsList?.[0] ? `${searchFilter.search.roomsList[0]} seats` : 'Seats'}</span>
						<ExpandMoreIcon />
					</Box>
				</Stack>

				<Stack className="search-box-other">
					<Box className="advanced-filter" onClick={() => advancedFilterHandler(true)}>
						<img src="/img/icons/tune.svg" alt="" />
						<span>Advanced</span>
					</Box>

					<Box className="search-btn" onClick={pushSearchHandler}>
						<img src="/img/icons/search_white.svg" alt="" />
					</Box>
				</Stack>

				{/* MENU: City */}
				<div className={`filter-location ${openLocation ? 'on' : ''}`} ref={locationRef}>
					{propertyLocation.map((location) => (
						<div className="menu-item" onClick={() => propertyLocationSelectHandler(location)} key={location}>
							<span>{location}</span>
						</div>
					))}
				</div>

				{/* MENU: Brand/Body */}
				<div className={`filter-type ${openType ? 'on' : ''}`} ref={typeRef}>
					{propertyType.map((type) => (
						<div
							className="menu-item"
							style={{ backgroundImage: `url(/img/banner/types/${String(type).toLowerCase()}.webp)` }}
							onClick={() => propertyTypeSelectHandler(type)}
							key={type}
						>
							<span>{type}</span>
						</div>
					))}
				</div>

				{/* MENU: Seats */}
				<div className={`filter-rooms ${openRooms ? 'on' : ''}`} ref={roomsRef}>
					<div className="rooms-grid">
						{[2, 4, 5, 7, 8].map((seat) => (
							<button
								type="button"
								key={seat}
								className={`room-chip ${searchFilter?.search?.roomsList?.[0] === seat ? 'active' : ''}`}
								onClick={() => propertyRoomSelectHandler(seat)}
							>
								{seat} seats
							</button>
						))}
					</div>
				</div>
			</Stack>

			{/* ADVANCED MODAL */}
			<Modal open={openAdvancedFilter} onClose={() => advancedFilterHandler(false)} disablePortal={false}>
				<Box sx={style}>
					<Box className="advanced-filter-modal">
						<div className="close" onClick={() => advancedFilterHandler(false)}>
							<CloseIcon />
						</div>

						<div className="top">
							<span>Find your car</span>
							<div className="search-input-box">
								<img src="/img/icons/search.svg" alt="" />
								<input
									value={searchFilter?.search?.text ?? ''}
									placeholder="Brand, model, keyword..."
									onChange={(e: any) =>
										setSearchFilter((prev) => ({
											...prev,
											page: 1,
											search: { ...prev.search, text: e.target.value },
										}))
									}
								/>
							</div>
						</div>

						<Divider sx={{ mt: '30px', mb: '35px' }} />

						<div className="middle">
							<div className="row-box">
								<div className="box">
									<span>Doors</span>
									<div className="inside">
										<div
											className={`room ${!searchFilter?.search?.bedsList ? 'active' : ''}`}
											onClick={() => propertyDoorSelectHandler(0)}
										>
											Any
										</div>

										{[2, 3, 4, 5].map((d) => (
											<div
												key={d}
												className={`room ${(searchFilter?.search?.bedsList as number[] | undefined)?.includes(d) ? 'active' : ''}`}
												onClick={() => propertyDoorSelectHandler(d)}
											>
												{d}
											</div>
										))}
									</div>
								</div>

								<div className="box">
									<span>Deal</span>
									<div className="inside">
										<FormControl>
											<Select value={dealMode} onChange={propertyDealSelectHandler} displayEmpty MenuProps={MenuProps}>
												<MenuItem value="all">All</MenuItem>
												<MenuItem value="sale">For sale</MenuItem>
												<MenuItem value="rent">For rent</MenuItem>
											</Select>
										</FormControl>
									</div>
								</div>
							</div>

							<div className="row-box" style={{ marginTop: '44px' }}>
								<div className="box">
									<span>Year</span>
									<div className="inside space-between align-center">
										<FormControl sx={{ width: '122px' }}>
											<Select value={String(yearCheck.start)} onChange={yearStartChangeHandler} MenuProps={MenuProps}>
												{propertyYears.map((year: number) => (
													<MenuItem value={String(year)} disabled={yearCheck.end <= year} key={year}>
														{year}
													</MenuItem>
												))}
											</Select>
										</FormControl>

										<div className="minus-line"></div>

										<FormControl sx={{ width: '122px' }}>
											<Select value={String(yearCheck.end)} onChange={yearEndChangeHandler} MenuProps={MenuProps}>
												{[...propertyYears].reverse().map((year: number) => (
													<MenuItem value={String(year)} disabled={yearCheck.start >= year} key={year}>
														{year}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									</div>
								</div>

								<div className="box">
									<span>Mileage (km)</span>
									<div className="inside space-between align-center">
										<FormControl sx={{ width: '122px' }}>
											<Select
												value={Number(searchFilter?.search?.squaresRange?.start ?? 0)}
												onChange={(e) => mileageHandler(e, 'start')}
												MenuProps={MenuProps}
											>
												{propertySquare.map((km: number) => (
													<MenuItem value={km} key={km}>
														{km}
													</MenuItem>
												))}
											</Select>
										</FormControl>

										<div className="minus-line"></div>

										<FormControl sx={{ width: '122px' }}>
											<Select
												value={Number(searchFilter?.search?.squaresRange?.end ?? 0)}
												onChange={(e) => mileageHandler(e, 'end')}
												MenuProps={MenuProps}
											>
												{propertySquare.map((km: number) => (
													<MenuItem value={km} key={km}>
														{km}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									</div>
								</div>
							</div>
						</div>

						<Divider sx={{ mt: '60px', mb: '18px' }} />

						<div className="bottom">
							<div onClick={resetFilterHandler}>
								<img src="/img/icons/reset.svg" alt="" />
								<span>Reset all filters</span>
							</div>

							<Button startIcon={<img src="/img/icons/search.svg" />} className="search-btn" onClick={pushSearchHandler}>
								Search
							</Button>
						</div>
					</Box>
				</Box>
			</Modal>
		</>
	);
};

HeaderFilter.defaultProps = {
	initialInput: {
		page: 1,
		limit: 9,
		search: {
			// ❌ squaresRange olib tashlandi (km filtr bo‘lib qolmasin)
			pricesRange: { start: 0, end: 2000000 },
		},
	},
};

export default HeaderFilter;
