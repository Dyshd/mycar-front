import React, { useCallback, useMemo, useState } from "react";
import {
	Stack,
	Typography,
	Checkbox,
	Button,
	OutlinedInput,
	Tooltip,
	IconButton,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
} from "@mui/material";
import useDeviceDetect from "../../hooks/useDeviceDetect";
import { PropertyLocation, PropertyType } from "../../enums/property.enum";
import { PropertiesInquiry } from "../../types/property/property.input";
import { useRouter } from "next/router";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import { propertySquare } from "../../config";
import { TRANSMISSIONS } from "../../utils/transmission";

const MenuProps = { PaperProps: { style: { maxHeight: "220px" } } };

interface FilterType {
	searchFilter: PropertiesInquiry;
	setSearchFilter: any;
	initialInput: PropertiesInquiry;
}

const Filter = (props: FilterType) => {
	const { searchFilter, setSearchFilter, initialInput } = props;
	const device = useDeviceDetect();
	const router = useRouter();

	const [propertyLocation] = useState<PropertyLocation[]>(Object.values(PropertyLocation));
	const [propertyType] = useState<PropertyType[]>(Object.values(PropertyType));
	const [searchText, setSearchText] = useState<string>("");
	const [showAllLocations, setShowAllLocations] = useState<boolean>(false);

	const pushWithInput = useCallback(
		async (next: PropertiesInquiry) => {
			const encoded = encodeURIComponent(JSON.stringify(next));
			await router.push(`/property?input=${encoded}`, `/property?input=${encoded}`, { scroll: false });
		},
		[router]
	);
	const transmissionSelectHandler = (value: number) => {
		setSearchFilter((prev: any) => {
			const prevList = prev?.search?.roomsList || [];

			let next;

			if (value === 0) {
				next = {
					...prev,
					search: {
						...prev.search,
						roomsList: undefined,
					},
				};
			} else {
				let newList = [...prevList];

				if (newList.includes(value)) {
					newList = newList.filter((v) => v !== value);
				} else {
					newList.push(value);
				}

				next = {
					...prev,
					search: {
						...prev.search,
						roomsList: newList,
					},
				};
			}

			pushWithInput(next); // ✅ filter ishlashi uchun muhim

			return next;
		});
	};

	const seatsSelectHandler = useCallback(
		async (seats: number) => {
			const next: PropertiesInquiry = { ...searchFilter, search: { ...(searchFilter.search || {}) } };

			if (seats === 0) {
				delete (next.search as any).bedsList;
			} else {
				(next.search as any).bedsList = [seats]; // single select
			}

			setSearchFilter(next);
			await pushWithInput(next);
		},
		[searchFilter, setSearchFilter, pushWithInput]
	);

	const propertyLocationSelectHandler = useCallback(
		async (e: any) => {
			const isChecked = e.target.checked;
			const value = e.target.value;

			const next: PropertiesInquiry = { ...searchFilter, search: { ...(searchFilter.search || {}) } };
			const cur = ((next.search as any).locationList || []) as string[];

			(next.search as any).locationList = isChecked ? [...cur, value] : cur.filter((x) => x !== value);

			setSearchFilter(next);
			await pushWithInput(next);
		},
		[searchFilter, setSearchFilter, pushWithInput]
	);

	const propertyTypeSelectHandler = useCallback(
		async (e: any) => {
			const isChecked = e.target.checked;
			const value = e.target.value;

			const next: PropertiesInquiry = { ...searchFilter, search: { ...(searchFilter.search || {}) } };
			const cur = ((next.search as any).typeList || []) as string[];

			(next.search as any).typeList = isChecked ? [...cur, value] : cur.filter((x) => x !== value);

			setSearchFilter(next);
			await pushWithInput(next);
		},
		[searchFilter, setSearchFilter, pushWithInput]
	);

	const propertyOptionSelectHandler = useCallback(
		async (e: any) => {
			const isChecked = e.target.checked;
			const value = e.target.value;

			const next: PropertiesInquiry = { ...searchFilter, search: { ...(searchFilter.search || {}) } };
			const cur = ((next.search as any).options || []) as string[];

			(next.search as any).options = isChecked ? [...cur, value] : cur.filter((x) => x !== value);

			setSearchFilter(next);
			await pushWithInput(next);
		},
		[searchFilter, setSearchFilter, pushWithInput]
	);

	const propertySquareHandler = useCallback(
		async (e: any, type: "start" | "end") => {
			const value = Number(e.target.value);

			const next: PropertiesInquiry = { ...searchFilter, search: { ...(searchFilter.search || {}) } };
			const cur = (next.search as any).squaresRange || { start: 0, end: 500 };

			(next.search as any).squaresRange = { ...cur, [type]: value };

			setSearchFilter(next);
			await pushWithInput(next);
		},
		[searchFilter, setSearchFilter, pushWithInput]
	);

	const propertyPriceHandler = useCallback(
		async (value: number, type: "start" | "end") => {
			const next: PropertiesInquiry = { ...searchFilter, search: { ...(searchFilter.search || {}) } };
			const cur = (next.search as any).pricesRange || { start: 0, end: 0 };

			(next.search as any).pricesRange = { ...cur, [type]: Number(value) };

			setSearchFilter(next);
			await pushWithInput(next);
		},
		[searchFilter, setSearchFilter, pushWithInput]
	);

	const refreshHandler = async () => {
		setSearchText("");
		setSearchFilter(initialInput);
		await pushWithInput(initialInput);
	};

	const selectedLocationCount = useMemo(
		() => (((searchFilter?.search as any)?.locationList || []) as any[]).length,
		[searchFilter]
	);

	if (device === "mobile") return <div>PROPERTIES FILTER</div>;

	return (
		<Stack className={"filter-main v2"}>
			{/* SEARCH */}
			<Stack className={"filter-card"}>
				<Stack className={"filter-head"}>
					<Typography className={"title-main"}>Find your car</Typography>
					<Typography className={"subtitle"}>Search, filter and compare quickly</Typography>
				</Stack>

				<Stack className={"input-row"}>
					<OutlinedInput
						value={searchText}
						type={"text"}
						className={"search-input"}
						placeholder={"Search by name, city, keyword..."}
						onChange={(e: any) => setSearchText(e.target.value)}
						onKeyDown={(event: any) => {
							if (event.key === "Enter") {
								const next: PropertiesInquiry = {
									...searchFilter,
									search: { ...(searchFilter.search || {}), text: searchText },
									page: 1,
								};
								setSearchFilter(next);
								pushWithInput(next).then();
							}
						}}
						endAdornment={
							<CancelRoundedIcon
								className="clear-icon"
								onClick={() => {
									setSearchText("");
									const next: PropertiesInquiry = {
										...searchFilter,
										search: { ...(searchFilter.search || {}), text: "" },
										page: 1,
									};
									setSearchFilter(next);
									pushWithInput(next).then();
								}}
							/>
						}
					/>
					<Tooltip title="Reset all">
						<IconButton className="reset-btn" onClick={refreshHandler}>
							<RefreshIcon />
						</IconButton>
					</Tooltip>
				</Stack>
			</Stack>

			{/* LOCATION */}
			<Stack className={"filter-card"}>
				<Stack className="section-title">
					<Typography className={"title"}>Location</Typography>
					<div className="mini-pill">{selectedLocationCount > 0 ? `${selectedLocationCount} selected` : "All"}</div>
				</Stack>

				<Stack className={`property-location v2 ${showAllLocations ? "open" : ""}`}>
					{propertyLocation.map((location: string) => (
						<Stack className={"input-box"} key={location}>
							<Checkbox
								id={location}
								className="property-checkbox"
								color="default"
								size="small"
								value={location}
								checked={(((searchFilter?.search as any)?.locationList || []) as any[]).includes(location as any)}
								onChange={propertyLocationSelectHandler}
							/>
							<label htmlFor={location} style={{ cursor: "pointer" }}>
								<Typography className="property-type">{location}</Typography>
							</label>
						</Stack>
					))}
				</Stack>

				{propertyLocation.length > 10 && (
					<Button className="showmore-btn" variant="outlined" onClick={() => setShowAllLocations((p) => !p)}>
						{showAllLocations ? "Show less" : "Show more"}
					</Button>
				)}
			</Stack>

			{/* TYPE */}
			<Stack className={"filter-card"}>
				<Typography className={"title"}>Car Type</Typography>

				<Stack className="two-col">
					{propertyType.map((type: string) => (
						<Stack className={"input-box"} key={type}>
							<Checkbox
								id={type}
								className="property-checkbox"
								color="default"
								size="small"
								value={type}
								onChange={propertyTypeSelectHandler}
								checked={(((searchFilter?.search as any)?.typeList || []) as any[]).includes(type as any)}
							/>
							<label htmlFor={type} style={{ cursor: "pointer" }}>
								<Typography className="property-type">{type}</Typography>
							</label>
						</Stack>
					))}
				</Stack>
			</Stack>

			{/* TRANSMISSION */}
			<Stack className={"find-your-home"} mb={"30px"}>
				<Typography className={"title"}>Transmission</Typography>

				<Stack className="button-group cars">
					<Button className={!searchFilter?.search?.roomsList ? "active" : ""} onClick={() => transmissionSelectHandler(0)}>
						Any
					</Button>

					{TRANSMISSIONS.map((t) => (
						<Button
							key={t.value}
							className={(searchFilter?.search?.roomsList || []).includes(t.value) ? "active" : ""}
							onClick={() => transmissionSelectHandler(t.value)}
						>
							{t.label}
						</Button>
					))}
				</Stack>
			</Stack>

			{/* SEATS */}
			{/* <Stack className={"find-your-home"} mb={"30px"}>
				<Typography className={"title"}>Seats</Typography>

				<Stack className="button-group cars">
					<Button className={!searchFilter?.search?.bedsList ? "active" : ""} onClick={() => seatsSelectHandler(0)}>
						Any
					</Button>

					{[2, 4, 5, 7, 8].map((s) => (
						<Button
							key={s}
							className={(searchFilter?.search?.bedsList || []).includes(s) ? "active" : ""}
							onClick={() => seatsSelectHandler(s)}
						>
							{s}
						</Button>
					))}
				</Stack>
			</Stack> */}

			{/* OPTIONS */}
			<Stack className={"filter-card"}>
				<Typography className={"title"}>Options</Typography>

				<Stack className={"input-box"}>
					<Checkbox
						id={"Barter"}
						className="property-checkbox"
						color="default"
						size="small"
						value={"propertyBarter"}
						checked={(((searchFilter?.search as any)?.options || []) as string[]).includes("propertyBarter")}
						onChange={propertyOptionSelectHandler}
					/>
					<label htmlFor={"Barter"} style={{ cursor: "pointer" }}>
						<Typography className="property-type">Barter</Typography>
					</label>
				</Stack>

				<Stack className={"input-box"}>
					<Checkbox
						id={"Rent"}
						className="property-checkbox"
						color="default"
						size="small"
						value={"propertyRent"}
						checked={(((searchFilter?.search as any)?.options || []) as string[]).includes("propertyRent")}
						onChange={propertyOptionSelectHandler}
					/>
					<label htmlFor={"Rent"} style={{ cursor: "pointer" }}>
						<Typography className="property-type">Rent</Typography>
					</label>
				</Stack>
			</Stack>

			{/* MILEAGE RANGE (siz xohlasangiz select emas input qilamiz, lekin hozircha sizdagi ko‘rinish) */}
			<Stack className={"filter-card"}>
				<Typography className={"title"}>Mileage range (km)</Typography>

				<Stack className="range-row">
					<FormControl className="range-select">
						<InputLabel>Min</InputLabel>
						<Select
							value={((searchFilter?.search as any)?.squaresRange?.start ?? 0) as any}
							label="Min"
							onChange={(e: any) => propertySquareHandler(e, "start")}
							MenuProps={MenuProps}
						>
							{propertySquare.map((square: number) => (
								<MenuItem
									value={square}
									key={square}
									disabled={(((searchFilter?.search as any)?.squaresRange?.end || 500) as number) < square}
								>
									{square}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<div className="range-divider" />

					<FormControl className="range-select">
						<InputLabel>Max</InputLabel>
						<Select
							value={((searchFilter?.search as any)?.squaresRange?.end ?? 500) as any}
							label="Max"
							onChange={(e: any) => propertySquareHandler(e, "end")}
							MenuProps={MenuProps}
						>
							{propertySquare.map((square: number) => (
								<MenuItem
									value={square}
									key={square}
									disabled={(((searchFilter?.search as any)?.squaresRange?.start || 0) as number) > square}
								>
									{square}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Stack>
			</Stack>

			{/* PRICE */}
			<Stack className={"filter-card"}>
				<Typography className={"title"}>Price range</Typography>

				<Stack className="range-row">
					<input
						className="range-input"
						type="number"
						placeholder="$ min"
						min={0}
						value={((searchFilter?.search as any)?.pricesRange?.start ?? 0) as any}
						onChange={(e: any) => {
							if (Number(e.target.value) >= 0) propertyPriceHandler(Number(e.target.value), "start");
						}}
					/>
					<div className="range-divider" />
					<input
						className="range-input"
						type="number"
						placeholder="$ max"
						min={0}
						value={((searchFilter?.search as any)?.pricesRange?.end ?? 0) as any}
						onChange={(e: any) => {
							if (Number(e.target.value) >= 0) propertyPriceHandler(Number(e.target.value), "end");
						}}
					/>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Filter;
