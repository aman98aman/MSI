export const CONSENT_VERSION = 'v1.0';

export const MSI_MOCK_CONSENT_TITLE = 'MSI GROUP OF INSTITUTES';
export const MSI_MOCK_CONSENT_SUBTITLE = 'Mock Test Series – Declaration & Consent';

export const MSI_MOCK_CONSENT_PARAGRAPHS = [
  'I hereby declare that I am voluntarily participating in the Mock Test Series conducted by MSI Group of Institutes.',
  'I hereby grant my consent to MSI Group of Institutes to publish, display and announce my mock test performance, marks, rank and final competitive examination ( OFFICIAL CLAT 2027 ) results for academic, promotional and advertising purposes.',
  'In the event of my selection or qualification in the respective competitive examination, I authorise MSI Group of Institutes to declare and showcase my result as an achievement of its Mock Test Series student.',
  'I further authorise the institute to use my name, photograph, marks, rank and achievements on its official website, social media platforms, banners, brochures and other promotional materials, accurately representing my association with the Mock Test Series.',
  'I confirm that I am providing this consent voluntarily, without any pressure, coercion or undue influence. I understand that I may withdraw my consent for future publication through a written request to the institute.',
  'By clicking the consent button below, I acknowledge that I have read, understood and agreed to the above declaration. For students below 18 years of age, consent must be provided by their parent or legal guardian.',
];

export const MSI_CONSENT_CHECKBOX_TEXT =
  'I hereby declare that the information provided by me during registration is correct and accurate. I agree to follow all examination rules, guidelines, and instructions. I understand that any violation of examination rules may result in cancellation of my examination, and I accept the above Declaration & Consent.';

export const MSI_CONSENT_BUTTON_TEXT = 'I Agree & Give My Consent';

export const MSI_FULL_CONSENT_STATEMENT = [
  `${MSI_MOCK_CONSENT_TITLE} — ${MSI_MOCK_CONSENT_SUBTITLE}`,
  ...MSI_MOCK_CONSENT_PARAGRAPHS,
  `Declaration: ${MSI_CONSENT_CHECKBOX_TEXT}`,
].join('\n\n');
