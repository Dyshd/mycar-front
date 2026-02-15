import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useRouter } from 'next/router';
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
			maxHeight: '200px',
		},
	},
};

const thisYear = new Date().getFullYear();

interface HeaderFilterProps {
	initialInput: PropertiesInquiry;
}

const HeaderFilter = (props: HeaderFilterProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const { t } = useTranslation('common');

	const [searchFilter, setSearchFilter] = useState<PropertiesInquiry>(initialInput);

	const locationRef: any = useRef();
	const typeRef: any = useRef();
	const roomsRef: any = useRef();

	const router = useRouter();

	const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);
	const [openLocation, setOpenLocation] = useState(false);
	const [openType, setOpenType] = useState(false);
	const [openRooms, setOpenRooms] = useState(false);

	const [propertyLocation] = useState<PropertyLocation[]>(Object.values(PropertyLocation));
	const [propertyType] = useState<PropertyType[]>(Object.values(PropertyType));

	const [yearCheck, setYearCheck] = useState({ start: 1970, end: thisYear });
	const [optionCheck, setOptionCheck] = useState('all');

	useEffect(() => {
		const clickHandler = (event: MouseEvent) => {
			if (!locationRef?.current?.contains(event.target)) setOpenLocation(false);
			if (!typeRef?.current?.contains(event.target)) setOpenType(false);
			if (!roomsRef?.current?.contains(event.target)) setOpenRooms(false);
		};

		document.addEventListener('mousedown', clickHandler);
		return () => document.removeEventListener('mousedown', clickHandler);
	}, []);

	const advancedFilterHandler = (status: boolean) => {
		setOpenLocation(false);
		setOpenRooms(false);
		setOpenType(false);
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

	const disableAllStateHandler = () => {
		setOpenRooms(false);
		setOpenType(false);
		setOpenLocation(false);
	};

	const propertyLocationSelectHandler = useCallback(async (value: any) => {
		setSearchFilter((prev) => ({
			...prev,
			search: { ...prev.search, locationList: [value] },
		}));
		typeStateChangeHandler();
	}, []);

	const propertyTypeSelectHandler = useCallback(async (value: any) => {
		setSearchFilter((prev) => ({
			...prev,
			search: { ...prev.search, typeList: [value] },
		}));
		roomStateChangeHandler();
	}, []);

	const propertyRoomSelectHandler = useCallback(async (value: any) => {
		setSearchFilter((prev) => ({
			...prev,
			search: { ...prev.search, roomsList: [value] },
		}));
		disableAllStateHandler();
	}, []);

	const propertyDoorSelectHandler = useCallback(
		async (number: Number) => {
			try {
				if (number !== 0) {
					if (searchFilter?.search?.bedsList?.includes(number)) {
						setSearchFilter({
							...searchFilter,
							search: {
								...searchFilter.search,
								bedsList: searchFilter?.search?.bedsList?.filter((item: Number) => item !== number),
							},
						});
					} else {
						setSearchFilter({
							...searchFilter,
							search: { ...searchFilter.search, bedsList: [...(searchFilter?.search?.bedsList || []), number] },
						});
					}
				} else {
					delete searchFilter?.search.bedsList;
					setSearchFilter({ ...searchFilter });
				}
			} catch (err) {
				console.log('ERROR, propertyDoorSelectHandler:', err);
			}
		},
		[searchFilter],
	);

	const propertyOptionSelectHandler = useCallback(
		async (e: any) => {
			try {
				const value = e.target.value;
				setOptionCheck(value);

				if (value !== 'all') {
					setSearchFilter({
						...searchFilter,
						search: { ...searchFilter.search, options: [value] },
					});
				} else {
					delete searchFilter.search.options;
					setSearchFilter({ ...searchFilter, search: { ...searchFilter.search } });
				}
			} catch (err) {
				console.log('ERROR, propertyOptionSelectHandler:', err);
			}
		},
		[searchFilter],
	);

	const mileageHandler = useCallback(async (e: any, type: 'start' | 'end') => {
		const value = parseInt(e.target.value);
		setSearchFilter((prev) => ({
			...prev,
			search: {
				...prev.search,
				// @ts-ignore
				squaresRange: {
					...(prev.search.squaresRange || { start: 0, end: 500000 }),
					[type]: value,
				},
			},
		}));
	}, []);

	const yearStartChangeHandler = async (event: any) => {
		const start = Number(event.target.value);
		setYearCheck((p) => ({ ...p, start }));

		setSearchFilter((prev) => ({
			...prev,
			search: {
				...prev.search,
				periodsRange: { start, end: yearCheck.end },
			},
		}));
	};

	const yearEndChangeHandler = async (event: any) => {
		const end = Number(event.target.value);
		setYearCheck((p) => ({ ...p, end }));

		setSearchFilter((prev) => ({
			...prev,
			search: {
				...prev.search,
				periodsRange: { start: yearCheck.start, end },
			},
		}));
	};

	const resetFilterHandler = () => {
		setSearchFilter(initialInput);
		setOptionCheck('all');
		setYearCheck({ start: 1970, end: thisYear });
	};

	const pushSearchHandler = async () => {
		try {
			const clean: any = JSON.parse(JSON.stringify(searchFilter));

			if (clean?.search?.locationList?.length === 0) delete clean.search.locationList;
			if (clean?.search?.typeList?.length === 0) delete clean.search.typeList;
			if (clean?.search?.roomsList?.length === 0) delete clean.search.roomsList;
			if (clean?.search?.options?.length === 0) delete clean.search.options;
			if (clean?.search?.bedsList?.length === 0) delete clean.search.bedsList;

			const encoded = encodeURIComponent(JSON.stringify(clean));
			await router.push(`/property?input=${encoded}`, `/property?input=${encoded}`);
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
						<span>{searchFilter?.search?.locationList ? searchFilter.search.locationList[0] : 'City'}</span>
						<ExpandMoreIcon />
					</Box>

					<Box component="div" className={`box ${openType ? 'on' : ''}`} onClick={typeStateChangeHandler}>
						<span>{searchFilter?.search?.typeList ? searchFilter.search.typeList[0] : 'Brand / Body'}</span>
						<ExpandMoreIcon />
					</Box>

					<Box component="div" className={`box ${openRooms ? 'on' : ''}`} onClick={roomStateChangeHandler}>
						<span>{searchFilter?.search?.roomsList ? `${searchFilter.search.roomsList[0]} seats` : 'Seats'}</span>
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
					{propertyLocation.map((location: string) => (
						<div
							className="menu-item"
							onClick={() => propertyLocationSelectHandler(location)}
							key={location}
						>
							<span>{location}</span>
						</div>
					))}
				</div>


				{/* MENU: Brand/Body */}
				<div className={`filter-type ${openType ? 'on' : ''}`} ref={typeRef}>
					{propertyType.map((type: string) => (
						<div
							className="menu-item"
							style={{ backgroundImage: `url(/img/banner/types/${type.toLowerCase()}.webp)` }}
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
						{[2, 4, 5, 7, 8].map((seat: number) => (
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
			<Modal
				open={openAdvancedFilter}
				onClose={() => advancedFilterHandler(false)}
				disablePortal={false} // portal ishlasin
			>
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
										<div className={`room ${!searchFilter?.search?.bedsList ? 'active' : ''}`} onClick={() => propertyDoorSelectHandler(0)}>
											Any
										</div>
										{[2, 3, 4, 5].map((d: number) => (
											<div
												key={d}
												className={`room ${searchFilter?.search?.bedsList?.includes(d as any) ? 'active' : ''}`}
												onClick={() => propertyDoorSelectHandler(d as any)}
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
											<Select value={optionCheck} onChange={propertyOptionSelectHandler} displayEmpty MenuProps={MenuProps}>
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
											<Select value={yearCheck.start.toString()} onChange={yearStartChangeHandler} MenuProps={MenuProps}>
												{propertyYears?.slice(0)?.map((year: number) => (
													<MenuItem value={year} disabled={yearCheck.end <= year} key={year}>
														{year}
													</MenuItem>
												))}
											</Select>
										</FormControl>

										<div className="minus-line"></div>

										<FormControl sx={{ width: '122px' }}>
											<Select value={yearCheck.end.toString()} onChange={yearEndChangeHandler} MenuProps={MenuProps}>
												{propertyYears
													?.slice(0)
													.reverse()
													.map((year: number) => (
														<MenuItem value={year} disabled={yearCheck.start >= year} key={year}>
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
											<Select value={searchFilter?.search?.squaresRange?.start ?? 0} onChange={(e) => mileageHandler(e, 'start')} MenuProps={MenuProps}>
												{propertySquare.map((km: number) => (
													<MenuItem value={km} key={km}>
														{km}
													</MenuItem>
												))}
											</Select>
										</FormControl>

										<div className="minus-line"></div>

										<FormControl sx={{ width: '122px' }}>
											<Select value={searchFilter?.search?.squaresRange?.end ?? 0} onChange={(e) => mileageHandler(e, 'end')} MenuProps={MenuProps}>
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
			squaresRange: { start: 0, end: 500 },
			pricesRange: { start: 0, end: 2000000 },
		},
	},
};

export default HeaderFilter;
