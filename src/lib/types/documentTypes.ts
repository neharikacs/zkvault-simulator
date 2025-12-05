/**
 * Document Types Configuration
 * 
 * Defines all supported certificate/document types and their
 * specific form fields for the ZK-Vault system.
 */

export type DocumentCategory = 'educational' | 'identity' | 'professional' | 'medical';

export interface DocumentField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface DocumentType {
  id: string;
  name: string;
  category: DocumentCategory;
  icon: string;
  description: string;
  fields: DocumentField[];
  disclosureOptions: {
    key: string;
    label: string;
    description: string;
  }[];
}

export const DOCUMENT_TYPES: DocumentType[] = [
  // Educational Documents
  {
    id: 'degree',
    name: 'Degree Certificate',
    category: 'educational',
    icon: '🎓',
    description: 'Bachelor\'s, Master\'s, or Doctoral degree certificates',
    fields: [
      { key: 'institution', label: 'Institution Name', type: 'text', required: true, placeholder: 'Harvard University' },
      { key: 'degree', label: 'Degree Title', type: 'text', required: true, placeholder: 'Bachelor of Science' },
      { key: 'fieldOfStudy', label: 'Field of Study', type: 'text', required: true, placeholder: 'Computer Science' },
      { key: 'graduationDate', label: 'Graduation Date', type: 'date', required: true },
      { key: 'gpa', label: 'GPA (optional)', type: 'number', required: false, placeholder: '3.8' },
      { key: 'honors', label: 'Honors', type: 'select', required: false, options: ['None', 'Cum Laude', 'Magna Cum Laude', 'Summa Cum Laude'] },
    ],
    disclosureOptions: [
      { key: 'degreeVerified', label: 'Degree Verified', description: 'Proves the degree is valid without revealing details' },
      { key: 'institutionAccredited', label: 'Institution Accredited', description: 'Proves institution is accredited' },
      { key: 'graduationYear', label: 'Graduation Year', description: 'Reveals only the graduation year' },
      { key: 'gradeAboveThreshold', label: 'GPA Above Threshold', description: 'Proves GPA is above a certain level' },
    ],
  },
  {
    id: 'diploma',
    name: 'Diploma',
    category: 'educational',
    icon: '📜',
    description: 'High school or vocational diplomas',
    fields: [
      { key: 'institution', label: 'School Name', type: 'text', required: true, placeholder: 'Springfield High School' },
      { key: 'diplomaType', label: 'Diploma Type', type: 'select', required: true, options: ['High School Diploma', 'GED', 'Vocational Diploma', 'Technical Diploma'] },
      { key: 'graduationDate', label: 'Graduation Date', type: 'date', required: true },
      { key: 'specialization', label: 'Specialization (if any)', type: 'text', required: false },
    ],
    disclosureOptions: [
      { key: 'degreeVerified', label: 'Diploma Verified', description: 'Proves diploma is authentic' },
      { key: 'graduationYear', label: 'Graduation Year', description: 'Reveals graduation year only' },
    ],
  },
  {
    id: 'transcript',
    name: 'Academic Transcript',
    category: 'educational',
    icon: '📋',
    description: 'Official academic records and transcripts',
    fields: [
      { key: 'institution', label: 'Institution Name', type: 'text', required: true },
      { key: 'studentId', label: 'Student ID', type: 'text', required: true },
      { key: 'program', label: 'Program/Major', type: 'text', required: true },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date', type: 'date', required: false },
      { key: 'cumulativeGpa', label: 'Cumulative GPA', type: 'number', required: false },
    ],
    disclosureOptions: [
      { key: 'degreeVerified', label: 'Enrollment Verified', description: 'Proves enrollment without details' },
      { key: 'gradeAboveThreshold', label: 'GPA Above Threshold', description: 'Proves GPA meets requirements' },
      { key: 'graduationYear', label: 'Enrollment Period', description: 'Reveals enrollment years' },
    ],
  },

  // Identity Documents
  {
    id: 'passport',
    name: 'Passport',
    category: 'identity',
    icon: '🛂',
    description: 'National passport documents',
    fields: [
      { key: 'passportNumber', label: 'Passport Number', type: 'text', required: true },
      { key: 'nationality', label: 'Nationality', type: 'text', required: true, placeholder: 'United States' },
      { key: 'issueDate', label: 'Issue Date', type: 'date', required: true },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
      { key: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: false },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: false },
    ],
    disclosureOptions: [
      { key: 'identityVerified', label: 'Identity Verified', description: 'Proves identity without revealing details' },
      { key: 'ageOver18', label: 'Age Over 18', description: 'Proves holder is over 18' },
      { key: 'citizenship', label: 'Citizenship', description: 'Reveals nationality/citizenship' },
    ],
  },
  {
    id: 'national_id',
    name: 'National ID Card',
    category: 'identity',
    icon: '🪪',
    description: 'Government-issued national identity cards',
    fields: [
      { key: 'idNumber', label: 'ID Number', type: 'text', required: true },
      { key: 'nationality', label: 'Nationality', type: 'text', required: true },
      { key: 'issueDate', label: 'Issue Date', type: 'date', required: true },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: false },
    ],
    disclosureOptions: [
      { key: 'identityVerified', label: 'Identity Verified', description: 'Proves identity is valid' },
      { key: 'ageOver18', label: 'Age Over 18', description: 'Proves holder is an adult' },
      { key: 'citizenship', label: 'Citizenship', description: 'Reveals citizenship status' },
    ],
  },
  {
    id: 'drivers_license',
    name: 'Driver\'s License',
    category: 'identity',
    icon: '🚗',
    description: 'Government-issued driving licenses',
    fields: [
      { key: 'licenseNumber', label: 'License Number', type: 'text', required: true },
      { key: 'licenseClass', label: 'License Class', type: 'select', required: true, options: ['Class A', 'Class B', 'Class C', 'Class D', 'Motorcycle'] },
      { key: 'issueDate', label: 'Issue Date', type: 'date', required: true },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
      { key: 'issuingState', label: 'Issuing State/Province', type: 'text', required: true },
      { key: 'restrictions', label: 'Restrictions (if any)', type: 'text', required: false },
    ],
    disclosureOptions: [
      { key: 'identityVerified', label: 'License Valid', description: 'Proves license is valid' },
      { key: 'ageOver18', label: 'Age Over 18', description: 'Proves holder is over 18' },
    ],
  },

  // Professional Documents
  {
    id: 'professional_license',
    name: 'Professional License',
    category: 'professional',
    icon: '📄',
    description: 'Professional licenses (medical, legal, engineering, etc.)',
    fields: [
      { key: 'licenseNumber', label: 'License Number', type: 'text', required: true },
      { key: 'profession', label: 'Profession', type: 'select', required: true, options: ['Medical Doctor', 'Lawyer', 'Engineer', 'Accountant', 'Architect', 'Nurse', 'Pharmacist', 'Other'] },
      { key: 'issuingBody', label: 'Issuing Body', type: 'text', required: true, placeholder: 'State Medical Board' },
      { key: 'issueDate', label: 'Issue Date', type: 'date', required: true },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
      { key: 'specialization', label: 'Specialization', type: 'text', required: false },
    ],
    disclosureOptions: [
      { key: 'degreeVerified', label: 'License Active', description: 'Proves license is currently active' },
      { key: 'institutionAccredited', label: 'Issuing Body Verified', description: 'Proves issuing body is legitimate' },
    ],
  },
  {
    id: 'certification',
    name: 'Professional Certification',
    category: 'professional',
    icon: '🏅',
    description: 'Industry certifications (IT, project management, etc.)',
    fields: [
      { key: 'certificationName', label: 'Certification Name', type: 'text', required: true, placeholder: 'AWS Solutions Architect' },
      { key: 'issuingOrganization', label: 'Issuing Organization', type: 'text', required: true, placeholder: 'Amazon Web Services' },
      { key: 'certificationId', label: 'Certification ID', type: 'text', required: true },
      { key: 'issueDate', label: 'Issue Date', type: 'date', required: true },
      { key: 'expiryDate', label: 'Expiry Date (if applicable)', type: 'date', required: false },
      { key: 'level', label: 'Certification Level', type: 'select', required: false, options: ['Associate', 'Professional', 'Expert', 'Master'] },
    ],
    disclosureOptions: [
      { key: 'degreeVerified', label: 'Certification Valid', description: 'Proves certification is valid' },
      { key: 'institutionAccredited', label: 'Issuer Verified', description: 'Proves issuing org is recognized' },
    ],
  },
  {
    id: 'employment_letter',
    name: 'Employment Verification',
    category: 'professional',
    icon: '💼',
    description: 'Employment verification letters',
    fields: [
      { key: 'employer', label: 'Employer Name', type: 'text', required: true },
      { key: 'position', label: 'Position/Title', type: 'text', required: true },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date (if applicable)', type: 'date', required: false },
      { key: 'employmentType', label: 'Employment Type', type: 'select', required: true, options: ['Full-time', 'Part-time', 'Contract', 'Intern'] },
      { key: 'department', label: 'Department', type: 'text', required: false },
    ],
    disclosureOptions: [
      { key: 'employmentVerified', label: 'Employment Verified', description: 'Proves employment without details' },
      { key: 'identityVerified', label: 'Identity Verified', description: 'Proves identity matches employer records' },
    ],
  },

  // Medical Documents
  {
    id: 'vaccination',
    name: 'Vaccination Certificate',
    category: 'medical',
    icon: '💉',
    description: 'Vaccination and immunization records',
    fields: [
      { key: 'vaccineType', label: 'Vaccine Type', type: 'select', required: true, options: ['COVID-19', 'Influenza', 'Hepatitis B', 'MMR', 'Tetanus', 'Other'] },
      { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: true, placeholder: 'Pfizer, Moderna, etc.' },
      { key: 'doseNumber', label: 'Dose Number', type: 'select', required: true, options: ['1st Dose', '2nd Dose', '3rd Dose (Booster)', '4th Dose'] },
      { key: 'administrationDate', label: 'Administration Date', type: 'date', required: true },
      { key: 'batchNumber', label: 'Batch/Lot Number', type: 'text', required: false },
      { key: 'administeringFacility', label: 'Administering Facility', type: 'text', required: true },
    ],
    disclosureOptions: [
      { key: 'identityVerified', label: 'Vaccination Verified', description: 'Proves vaccination status' },
      { key: 'ageOver18', label: 'Age Verified', description: 'Proves age for eligibility' },
    ],
  },
  {
    id: 'health_certificate',
    name: 'Health Certificate',
    category: 'medical',
    icon: '🏥',
    description: 'Medical fitness certificates and health clearances',
    fields: [
      { key: 'certificateType', label: 'Certificate Type', type: 'select', required: true, options: ['Medical Fitness', 'Travel Health', 'Occupational Health', 'Sports Medical', 'Other'] },
      { key: 'issuingFacility', label: 'Issuing Facility', type: 'text', required: true },
      { key: 'physicianName', label: 'Physician Name', type: 'text', required: true },
      { key: 'issueDate', label: 'Issue Date', type: 'date', required: true },
      { key: 'validUntil', label: 'Valid Until', type: 'date', required: true },
      { key: 'purpose', label: 'Purpose', type: 'text', required: false, placeholder: 'Employment, Travel, Sports, etc.' },
    ],
    disclosureOptions: [
      { key: 'identityVerified', label: 'Certificate Valid', description: 'Proves certificate is authentic' },
      { key: 'institutionAccredited', label: 'Facility Verified', description: 'Proves facility is accredited' },
    ],
  },
];

export const getDocumentTypeById = (id: string): DocumentType | undefined => {
  return DOCUMENT_TYPES.find(doc => doc.id === id);
};

export const getDocumentsByCategory = (category: DocumentCategory): DocumentType[] => {
  return DOCUMENT_TYPES.filter(doc => doc.category === category);
};

export const CATEGORY_INFO: Record<DocumentCategory, { label: string; icon: string; color: string }> = {
  educational: { label: 'Educational', icon: '🎓', color: 'bg-blue-500/10 text-blue-500' },
  identity: { label: 'Identity', icon: '🪪', color: 'bg-green-500/10 text-green-500' },
  professional: { label: 'Professional', icon: '💼', color: 'bg-purple-500/10 text-purple-500' },
  medical: { label: 'Medical', icon: '🏥', color: 'bg-red-500/10 text-red-500' },
};
