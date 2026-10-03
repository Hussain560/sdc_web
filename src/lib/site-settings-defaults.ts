/** What the public site reads from `site_settings` (public keys only). Defaults equal the previous hard-coded values. */
export type PublicSettings = {
  socialInstagram: string;
  socialLinkedin: string;
  socialX: string;
  contactEmail: string;
  footerRightsAr: string;
  footerRightsEn: string;
};

export const DEFAULT_SETTINGS: PublicSettings = {
  socialInstagram: 'https://instagram.com',
  socialLinkedin:
    'https://www.linkedin.com/company/sdc-%D8%A7%D9%84%D9%85%D8%AC%D8%AA%D9%85%D8%B9-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A-%D9%84%D9%84%D9%85%D8%B7%D9%88%D8%B1%D9%8A%D9%86/',
  socialX: 'https://x.com/sdc_saudi?s=21&t=XwrJBduv3_FE7Zi5Vp45Dw',
  contactEmail: '',
  footerRightsAr: '',
  footerRightsEn: '',
};
