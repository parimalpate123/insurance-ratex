import { VersionRegistry } from '../version-registry';

describe('VersionRegistry', () => {
  describe('getLatestVersion', () => {
    it('should return latest version for GL', () => {
      const latest = VersionRegistry.getLatestVersion('general-liability');
      expect(latest).toBe('1.2.0');
    });

    it('should return latest version for Property', () => {
      const latest = VersionRegistry.getLatestVersion('property');
      expect(latest).toBe('1.1.0');
    });

    it('should return null for unknown product line', () => {
      const latest = VersionRegistry.getLatestVersion('unknown');
      expect(latest).toBeNull();
    });
  });

  describe('isVersionSupported', () => {
    it('should return true for supported versions', () => {
      expect(VersionRegistry.isVersionSupported('general-liability', '1.2.0')).toBe(true);
      expect(VersionRegistry.isVersionSupported('general-liability', '1.1.0')).toBe(true);
      expect(VersionRegistry.isVersionSupported('property', '1.0.0')).toBe(true);
    });

    it('should return false for unsupported versions', () => {
      expect(VersionRegistry.isVersionSupported('general-liability', '9.9.9')).toBe(false);
      expect(VersionRegistry.isVersionSupported('unknown', '1.0.0')).toBe(false);
    });
  });

  describe('isCompatible', () => {
    it('should return true for minor version upgrades', () => {
      expect(VersionRegistry.isCompatible('general-liability', '1.0.0', '1.1.0')).toBe(true);
      expect(VersionRegistry.isCompatible('general-liability', '1.1.0', '1.2.0')).toBe(true);
    });

    it('should return true for patch version upgrades', () => {
      expect(VersionRegistry.isCompatible('general-liability', '1.0.0', '1.0.1')).toBe(true);
    });

    it('should return false for major version changes', () => {
      expect(VersionRegistry.isCompatible('general-liability', '1.2.0', '2.0.0')).toBe(false);
    });

    it('should return false for downgrades', () => {
      expect(VersionRegistry.isCompatible('general-liability', '1.2.0', '1.1.0')).toBe(false);
    });
  });

  describe('parseVersionString', () => {
    it('should parse valid version strings', () => {
      const parsed = VersionRegistry.parseVersionString('gl-v1.2');
      expect(parsed).toEqual({
        productLine: 'gl',
        major: 1,
        minor: 2,
      });
    });

    it('should parse property version strings', () => {
      const parsed = VersionRegistry.parseVersionString('property-v1.0');
      expect(parsed).toEqual({
        productLine: 'property',
        major: 1,
        minor: 0,
      });
    });

    it('should handle multi-word product lines', () => {
      const parsed = VersionRegistry.parseVersionString('inland-marine-v1.0');
      expect(parsed).toEqual({
        productLine: 'inland-marine',
        major: 1,
        minor: 0,
      });
    });

    it('should return null for invalid format', () => {
      expect(VersionRegistry.parseVersionString('invalid')).toBeNull();
      expect(VersionRegistry.parseVersionString('gl-1.2')).toBeNull();
      expect(VersionRegistry.parseVersionString('v1.2')).toBeNull();
    });
  });

  describe('formatVersionString', () => {
    it('should format version strings correctly', () => {
      expect(VersionRegistry.formatVersionString('gl', 1, 2)).toBe('gl-v1.2');
      expect(VersionRegistry.formatVersionString('property', 1, 0)).toBe('property-v1.0');
      expect(VersionRegistry.formatVersionString('inland-marine', 1, 1)).toBe('inland-marine-v1.1');
    });
  });

  describe('getAllVersions', () => {
    it('should return all versions for a product line', () => {
      const versions = VersionRegistry.getAllVersions('general-liability');
      expect(versions.length).toBeGreaterThan(0);
      expect(versions[0]).toHaveProperty('version');
      expect(versions[0]).toHaveProperty('releaseDate');
      expect(versions[0]).toHaveProperty('changelog');
    });

    it('should return empty array for unknown product line', () => {
      const versions = VersionRegistry.getAllVersions('unknown');
      expect(versions).toEqual([]);
    });
  });

  describe('getVersionInfo', () => {
    it('should return version information', () => {
      const info = VersionRegistry.getVersionInfo('general-liability', '1.2.0');
      expect(info).not.toBeNull();
      expect(info?.version).toBe('1.2.0');
      expect(info?.productLine).toBe('general-liability');
      expect(info?.releaseDate).toBe('2026-03-01');
    });

    it('should return null for non-existent version', () => {
      const info = VersionRegistry.getVersionInfo('general-liability', '9.9.9');
      expect(info).toBeNull();
    });
  });
});
