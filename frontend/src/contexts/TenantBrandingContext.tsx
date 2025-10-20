import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getTenantConfig, type TenantBranding } from '../api/tenants';

interface TenantBrandingContextType {
  branding: TenantBranding;
  loading: boolean;
  error: string | null;
  refreshBranding: () => Promise<void>;
}

const defaultBranding: TenantBranding = {
  logo: null,
  heroImage: null,
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  accentColor: '#ec4899',
};

const TenantBrandingContext = createContext<TenantBrandingContextType | undefined>(undefined);

interface TenantBrandingProviderProps {
  children: ReactNode;
}

export function TenantBrandingProvider({ children }: TenantBrandingProviderProps) {
  const [branding, setBranding] = useState<TenantBranding>(defaultBranding);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranding = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // User not authenticated, use default colors
        setBranding(defaultBranding);
        applyCSSVariables(defaultBranding);
        return;
      }

      const config = await getTenantConfig();
      setBranding(config.branding);
      applyCSSVariables(config.branding);
    } catch (err) {
      console.error('Error loading tenant branding:', err);
      setError(err instanceof Error ? err.message : 'Failed to load branding');
      // Use default colors on error
      setBranding(defaultBranding);
      applyCSSVariables(defaultBranding);
    } finally {
      setLoading(false);
    }
  };

  const applyCSSVariables = (brandingConfig: TenantBranding) => {
    const root = document.documentElement;

    // Apply colors as CSS variables
    root.style.setProperty('--color-primary', brandingConfig.primaryColor);
    root.style.setProperty('--color-secondary', brandingConfig.secondaryColor);
    root.style.setProperty('--color-accent', brandingConfig.accentColor);

    // Calculate lighter/darker versions for hover states
    root.style.setProperty('--color-primary-dark', darkenColor(brandingConfig.primaryColor, 10));
    root.style.setProperty('--color-primary-light', lightenColor(brandingConfig.primaryColor, 90));

    root.style.setProperty('--color-secondary-dark', darkenColor(brandingConfig.secondaryColor, 10));
    root.style.setProperty('--color-secondary-light', lightenColor(brandingConfig.secondaryColor, 90));

    root.style.setProperty('--color-accent-dark', darkenColor(brandingConfig.accentColor, 10));
    root.style.setProperty('--color-accent-light', lightenColor(brandingConfig.accentColor, 90));
  };

  const refreshBranding = async () => {
    await loadBranding();
  };

  useEffect(() => {
    loadBranding();
  }, []);

  return (
    <TenantBrandingContext.Provider value={{ branding, loading, error, refreshBranding }}>
      {children}
    </TenantBrandingContext.Provider>
  );
}

export function useTenantBranding() {
  const context = useContext(TenantBrandingContext);
  if (context === undefined) {
    throw new Error('useTenantBranding must be used within a TenantBrandingProvider');
  }
  return context;
}

// Helper functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = (100 - percent) / 100;
  const r = rgb.r * factor;
  const g = rgb.g * factor;
  const b = rgb.b * factor;

  return rgbToHex(r, g, b);
}

function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  const r = rgb.r + (255 - rgb.r) * factor;
  const g = rgb.g + (255 - rgb.g) * factor;
  const b = rgb.b + (255 - rgb.b) * factor;

  return rgbToHex(r, g, b);
}