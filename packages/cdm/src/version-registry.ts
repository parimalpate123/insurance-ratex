/**
 * CDM Version Registry
 * Manages versioning and compatibility across product lines
 */

import * as semver from 'semver';

export interface SchemaVersion {
  productLine: string;
  version: string;
  releaseDate: string;
  deprecated?: boolean;
  deprecationDate?: string;
  supportedUntil?: string;
  breakingChanges?: string[];
  changelog?: string;
}

export class VersionRegistry {
  private static versions: Map<string, SchemaVersion[]> = new Map();

  static {
    // Register all supported versions
    this.registerVersion({
      productLine: 'base',
      version: '1.0.0',
      releaseDate: '2026-01-01',
      changelog: 'Initial CDM base schema release',
    });

    this.registerVersion({
      productLine: 'general-liability',
      version: '1.0.0',
      releaseDate: '2026-01-01',
      changelog: 'Initial GL schema release',
    });

    this.registerVersion({
      productLine: 'general-liability',
      version: '1.1.0',
      releaseDate: '2026-02-01',
      changelog: 'Added liquor liability and contractual liability extensions',
    });

    this.registerVersion({
      productLine: 'general-liability',
      version: '1.2.0',
      releaseDate: '2026-03-01',
      changelog: 'Added blanket additional insured and primary/non-contributory options',
    });

    this.registerVersion({
      productLine: 'property',
      version: '1.0.0',
      releaseDate: '2026-01-01',
      changelog: 'Initial property schema release',
    });

    this.registerVersion({
      productLine: 'property',
      version: '1.1.0',
      releaseDate: '2026-02-15',
      changelog: 'Added equipment breakdown and utility services extensions',
    });

    this.registerVersion({
      productLine: 'inland-marine',
      version: '1.0.0',
      releaseDate: '2026-01-15',
      changelog: 'Initial inland marine schema release',
    });
  }

  static registerVersion(version: SchemaVersion): void {
    const existing = this.versions.get(version.productLine) || [];
    existing.push(version);
    this.versions.set(version.productLine, existing);
  }

  static getLatestVersion(productLine: string): string | null {
    const versions = this.versions.get(productLine);
    if (!versions || versions.length === 0) return null;

    const active = versions.filter((v) => !v.deprecated);
    if (active.length === 0) return null;

    active.sort((a, b) => semver.compare(b.version, a.version));
    return active[0].version;
  }

  static isVersionSupported(productLine: string, version: string): boolean {
    const versions = this.versions.get(productLine);
    if (!versions) return false;

    const schemaVersion = versions.find((v) => v.version === version);
    if (!schemaVersion) return false;

    if (schemaVersion.deprecated) {
      if (schemaVersion.supportedUntil) {
        const supportEndDate = new Date(schemaVersion.supportedUntil);
        return new Date() < supportEndDate;
      }
      return false;
    }

    return true;
  }

  static isCompatible(
    productLine: string,
    fromVersion: string,
    toVersion: string
  ): boolean {
    if (!semver.valid(fromVersion) || !semver.valid(toVersion)) {
      return false;
    }

    // Major version changes are breaking
    if (semver.major(fromVersion) !== semver.major(toVersion)) {
      return false;
    }

    // Minor version upgrades are backward compatible
    // Patch version upgrades are always compatible
    return semver.gte(toVersion, fromVersion);
  }

  static parseVersionString(versionString: string): {
    productLine: string;
    major: number;
    minor: number;
  } | null {
    // Format: "gl-v1.2" or "property-v1.0"
    const match = versionString.match(/^([a-z-]+)-v(\d+)\.(\d+)$/);
    if (!match) return null;

    return {
      productLine: match[1],
      major: parseInt(match[2], 10),
      minor: parseInt(match[3], 10),
    };
  }

  static formatVersionString(productLine: string, major: number, minor: number): string {
    return `${productLine}-v${major}.${minor}`;
  }

  static getAllVersions(productLine: string): SchemaVersion[] {
    return this.versions.get(productLine) || [];
  }

  static getVersionInfo(productLine: string, version: string): SchemaVersion | null {
    const versions = this.versions.get(productLine);
    if (!versions) return null;
    return versions.find((v) => v.version === version) || null;
  }

  static deprecateVersion(
    productLine: string,
    version: string,
    deprecationDate: string,
    supportedUntil: string
  ): void {
    const versions = this.versions.get(productLine);
    if (!versions) return;

    const schemaVersion = versions.find((v) => v.version === version);
    if (schemaVersion) {
      schemaVersion.deprecated = true;
      schemaVersion.deprecationDate = deprecationDate;
      schemaVersion.supportedUntil = supportedUntil;
    }
  }
}
