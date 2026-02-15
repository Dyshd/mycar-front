import {
	PropertyLocation,
	PropertyRentPeriod,
	PropertyStatus,
	PropertyType,
} from '../../enums/property.enum';
import { Direction } from '../../enums/common.enum';

export interface PropertyInput {
	propertyType: PropertyType;
	propertyLocation: PropertyLocation;
	propertyAddress: string;
	propertyTitle: string;
	propertyPrice: number;

	// UI mapping:
	// propertySquare = mileage (km)
	// propertyBeds = seats
	// propertyRooms = transmission
	propertySquare: number;
	propertyBeds: number;
	propertyRooms: number;

	propertyImages: string[];

	propertyDesc?: string;
	propertyBarter?: boolean;
	propertyRent?: boolean;

	// ✅ Rent period
	propertyRentPeriod?: PropertyRentPeriod;

	memberId?: string;
	constructedAt?: Date;
}

/* ================= SEARCH ================= */

interface PISearch {
	memberId?: string;
	locationList?: PropertyLocation[];
	typeList?: PropertyType[];

	roomsList?: number[]; // transmission
	bedsList?: number[];  // seats

	options?: string[];
	pricesRange?: Range;
	periodsRange?: PeriodsRange;
	squaresRange?: Range; // mileage
	text?: string;
}

export interface PropertiesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: PISearch;
}

/* ================= AGENT ================= */

interface APISearch {
	propertyStatus?: PropertyStatus;
}

export interface AgentPropertiesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: APISearch;
}

/* ================= ADMIN ================= */

interface ALPISearch {
	propertyStatus?: PropertyStatus;
	propertyLocationList?: PropertyLocation[];
}

export interface AllPropertiesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: ALPISearch;
}

/* ================= HELPERS ================= */

interface Range {
	start: number;
	end: number;
}

interface PeriodsRange {
	start: Date | number;
	end: Date | number;
}
