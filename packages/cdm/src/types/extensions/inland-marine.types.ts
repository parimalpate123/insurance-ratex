/**
 * Inland Marine Product Line Extensions (20% unique)
 * Version: inland-marine-v1.0
 */

import { Policy, Coverage, Location, RatingFactors } from '../base.types';

export type InlandMarineCoverageType =
  | 'contractors-equipment'
  | 'installation-floater'
  | 'builders-risk'
  | 'motor-truck-cargo'
  | 'valuable-papers'
  | 'accounts-receivable'
  | 'signs'
  | 'computer-equipment';

export interface Equipment {
  id: string;
  description: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  year?: number;
  value: number;
  replacementCost?: number;
  category: 'heavy-equipment' | 'tools' | 'electronics' | 'vehicles' | 'specialized';
  storageLocation?: string;
  isScheduled: boolean; // scheduled vs. blanket
}

export interface InlandMarineCoverage extends Coverage {
  type: InlandMarineCoverageType;

  // Coverage territory
  territory: 'USA' | 'USA-Canada' | 'worldwide';

  // Valuation
  valuationMethod: 'actual-cash-value' | 'replacement-cost' | 'agreed-value';

  // Equipment details
  scheduledEquipment?: Equipment[];
  blanketLimit?: number;

  // Transit coverage
  transitCoverage?: boolean;
  storageLocation?: 'on-site' | 'off-site' | 'in-transit' | 'all';

  // Additional features
  newlyAcquiredProperty?: {
    included: boolean;
    limit?: number;
    reportingPeriod?: number; // days
  };

  debrisRemoval?: {
    included: boolean;
    limit?: number;
  };
}

export interface InlandMarineLocation extends Location {
  isJobSite?: boolean;
  jobSiteAddress?: string;
  projectName?: string;
  projectValue?: number;
  estimatedCompletion?: string;
  storageType?: 'enclosed' | 'fenced' | 'open' | 'yard';
  securityFeatures?: string[];
}

export interface InlandMarineRatingFactors extends RatingFactors {
  totalEquipmentValue: number;
  equipmentAge?: number; // average age in years
  hasGPSTracking?: boolean;
  hasSecurity?: boolean;
  radiusOfOperation?: number; // miles
  primaryUse?: string;
  maintenanceProgram?: 'comprehensive' | 'regular' | 'minimal' | 'none';
}

export interface InlandMarineExtensions {
  // Equipment schedule
  equipmentSchedule?: Equipment[];

  // Coverage enhancements
  floodCoverage?: boolean;
  earthquakeCoverage?: boolean;
  leasedEquipment?: {
    included: boolean;
    limit?: number;
  };
  hiredEquipment?: {
    included: boolean;
    limit?: number;
  };

  // Loss prevention
  gpsTracking?: boolean;
  securityRequirements?: string[];
  storageRequirements?: string[];

  // Deductible options
  perItemDeductible?: boolean;
  catastropheDeductible?: number;
}

export interface InlandMarinePolicy extends Policy {
  productLine: 'inland-marine';
  version: 'inland-marine-v1.0';
  locations: InlandMarineLocation[];
  coverages: InlandMarineCoverage[];
  ratingFactors: InlandMarineRatingFactors;
  extensions: InlandMarineExtensions;
}
