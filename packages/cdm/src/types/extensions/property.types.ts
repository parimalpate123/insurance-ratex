/**
 * Property Product Line Extensions (20% unique)
 * Version: property-v1.0
 */

import { Policy, Coverage, Location, RatingFactors } from '../base.types';

export type PropertyCoverageType =
  | 'building'
  | 'contents'
  | 'business-income'
  | 'extra-expense'
  | 'equipment-breakdown'
  | 'ordinance-or-law';

export type ConstructionType =
  | 'frame'
  | 'joisted-masonry'
  | 'non-combustible'
  | 'masonry-non-combustible'
  | 'modified-fire-resistive'
  | 'fire-resistive';

export type OccupancyType =
  | 'office'
  | 'retail'
  | 'warehouse'
  | 'manufacturing'
  | 'restaurant'
  | 'apartment'
  | 'mixed-use';

export interface PropertyLocation extends Location {
  // Building characteristics
  constructionType: ConstructionType;
  occupancyType: OccupancyType;
  yearBuilt: number;
  yearRoofUpdated?: number;
  areaSquareFeet: number;
  numberOfStories: number;
  basementType?: 'full' | 'partial' | 'none';

  // Protection
  protectionClass: string; // ISO PPC 1-10
  distanceToFireHydrant?: number; // feet
  distanceToFireStation?: number; // miles
  sprinklered: boolean;
  sprinklerType?: 'wet-pipe' | 'dry-pipe' | 'pre-action' | 'deluge';
  fireSuppression?: string[];
  securitySystem?: boolean;
  securityFeatures?: string[];

  // Risk factors
  flatRoof?: boolean;
  roofMaterial?: string;
  wiringType?: 'aluminum' | 'copper' | 'knob-and-tube';
  heatingType?: 'forced-air' | 'boiler' | 'electric' | 'heat-pump';
  plumbingType?: 'copper' | 'pvc' | 'galvanized' | 'pex';

  // Values
  buildingValue: number;
  contentsValue: number;
  businessIncomeValue?: number;
  replacementCost?: number;
}

export interface PropertyCoverage extends Coverage {
  type: PropertyCoverageType;
  coveredProperty: 'building' | 'contents' | 'both';
  valuationMethod: 'actual-cash-value' | 'replacement-cost' | 'agreed-value';
  coinsurancePercent?: number; // 80%, 90%, 100%
  blanketLimit?: boolean;
  inflationGuard?: number; // percentage

  // Perils covered
  perils: 'named-perils' | 'broad-form' | 'special-form' | 'all-risk';

  // Optional coverages
  floodCoverage?: boolean;
  earthquakeCoverage?: boolean;
  ordinanceOrLaw?: {
    included: boolean;
    limit?: number;
  };
  equipmentBreakdown?: {
    included: boolean;
    limit?: number;
  };
}

export interface PropertyRatingFactors extends RatingFactors {
  protectionClass: string;
  constructionType: ConstructionType;
  occupancyType: OccupancyType;
  totalInsuredValue: number;
  distanceToCoast?: number; // miles, for wind/hurricane
  floodZone?: string; // FEMA flood zone
  earthquakeZone?: string; // seismic zone
  wildFireRisk?: 'low' | 'medium' | 'high' | 'extreme';
  crimeScore?: number; // for theft rating
}

export interface PropertyExtensions {
  // Additional coverages
  utilityServices?: {
    included: boolean;
    limit?: number;
  };
  outdoorProperty?: {
    included: boolean;
    limit?: number;
  };
  spoilage?: {
    included: boolean;
    limit?: number;
  };
  valuablePapers?: {
    included: boolean;
    limit?: number;
  };

  // Endorsements
  windHailExcluded?: boolean;
  floodExcluded?: boolean;
  earthquakeExcluded?: boolean;
  functionalReplacementCost?: boolean;

  // Loss history
  priorLosses?: {
    fire?: number;
    water?: number;
    theft?: number;
    wind?: number;
    other?: number;
  };
}

export interface PropertyPolicy extends Policy {
  productLine: 'property';
  version: 'property-v1.0' | 'property-v1.1';
  locations: PropertyLocation[];
  coverages: PropertyCoverage[];
  ratingFactors: PropertyRatingFactors;
  extensions: PropertyExtensions;
}
