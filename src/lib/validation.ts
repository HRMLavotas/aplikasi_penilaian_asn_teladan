export interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

export class DataValidator {
  private rules: ValidationRule[] = [];

  constructor(rules: ValidationRule[]) {
    this.rules = rules;
  }

  validate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string[]> = {};
    const warnings: Record<string, string[]> = {};

    this.rules.forEach((rule) => {
      const value = data[rule.field];
      const fieldErrors: string[] = [];
      const fieldWarnings: string[] = [];

      // Required validation
      if (rule.required && (!value || value === "")) {
        fieldErrors.push(rule.message || `${rule.field} wajib diisi`);
      }

      // Skip other validations if value is empty and not required
      if (!value && !rule.required) return;

      // Length validations
      if (rule.minLength && String(value).length < rule.minLength) {
        fieldErrors.push(`${rule.field} minimal ${rule.minLength} karakter`);
      }

      if (rule.maxLength && String(value).length > rule.maxLength) {
        fieldErrors.push(`${rule.field} maksimal ${rule.maxLength} karakter`);
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(String(value))) {
        fieldErrors.push(rule.message || `Format ${rule.field} tidak valid`);
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          fieldErrors.push(customError);
        }
      }

      if (fieldErrors.length > 0) {
        errors[rule.field] = fieldErrors;
      }

      if (fieldWarnings.length > 0) {
        warnings[rule.field] = fieldWarnings;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }
}

// Predefined validation rules for ASN data
export const asnValidationRules: ValidationRule[] = [
  {
    field: "nama",
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\.\']+$/,
    message: "Nama hanya boleh mengandung huruf, spasi, titik, dan apostrof",
  },
  {
    field: "nip",
    required: true,
    minLength: 18,
    maxLength: 18,
    pattern: /^\d{18}$/,
    message: "NIP harus 18 digit angka",
  },
  {
    field: "jabatan",
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  {
    field: "unit_kerja_nama",
    required: true,
    minLength: 5,
    maxLength: 200,
  },
  {
    field: "status_jabatan",
    required: true,
    custom: (value) => {
      const validStatuses = [
        "administrator",
        "pengawas",
        "pelaksana",
        "fungsional",
      ];
      return validStatuses.includes(value)
        ? null
        : "Status jabatan harus: administrator, pengawas, pelaksana, atau fungsional";
    },
  },
  {
    field: "masa_kerja_tahun",
    required: true,
    custom: (value) => {
      const num = Number(value);
      if (isNaN(num)) return "Masa kerja harus berupa angka";
      if (num < 0) return "Masa kerja tidak boleh negatif";
      if (num > 50) return "Masa kerja tidak boleh lebih dari 50 tahun";
      if (num < 5)
        return "Warning: Masa kerja kurang dari 5 tahun, tidak memenuhi syarat ASN Teladan";
      return null;
    },
  },
];

// NIP validation utility
export const validateNIP = (
  nip: string,
): { isValid: boolean; errors: string[]; info?: any } => {
  const errors: string[] = [];

  if (!nip || nip.length !== 18) {
    errors.push("NIP harus 18 digit");
    return { isValid: false, errors };
  }

  if (!/^\d{18}$/.test(nip)) {
    errors.push("NIP hanya boleh mengandung angka");
    return { isValid: false, errors };
  }

  // Parse NIP structure (YYYYMMDDXXXXXXPPPP)
  const birthYear = parseInt(nip.substring(0, 4));
  const birthMonth = parseInt(nip.substring(4, 6));
  const birthDay = parseInt(nip.substring(6, 8));
  const sequenceNumber = nip.substring(8, 14);
  const checkDigit = nip.substring(14, 18);

  // Validate birth date
  const currentYear = new Date().getFullYear();
  if (birthYear < 1940 || birthYear > currentYear - 17) {
    errors.push("Tahun lahir dalam NIP tidak valid");
  }

  if (birthMonth < 1 || birthMonth > 12) {
    errors.push("Bulan lahir dalam NIP tidak valid");
  }

  if (birthDay < 1 || birthDay > 31) {
    errors.push("Tanggal lahir dalam NIP tidak valid");
  }

  // Calculate age
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  const age = currentYear - birthYear;

  const info = {
    birthDate: birthDate.toLocaleDateString("id-ID"),
    age,
    sequenceNumber,
    checkDigit,
  };

  return {
    isValid: errors.length === 0,
    errors,
    info,
  };
};

// Email validation for government emails
export const validateGovernmentEmail = (email: string): boolean => {
  const govDomains = [
    "@kemenkeu.go.id",
    "@kemenaker.go.id",
    "@kemendagri.go.id",
    "@kemlu.go.id",
    "@kemenkumham.go.id",
    "@kemenkopmk.go.id",
    ".go.id",
  ];

  return govDomains.some((domain) => email.toLowerCase().includes(domain));
};

// Data quality scoring
export const calculateDataQuality = (
  data: Record<string, any>,
): {
  score: number;
  details: {
    completeness: number;
    accuracy: number;
    consistency: number;
  };
} => {
  const requiredFields = [
    "nama",
    "nip",
    "jabatan",
    "unit_kerja_nama",
    "status_jabatan",
  ];
  const optionalFields = ["bukti_inovasi", "bukti_penghargaan"];

  // Completeness (40% of score)
  const filledRequired = requiredFields.filter(
    (field) => data[field] && data[field] !== "",
  ).length;
  const filledOptional = optionalFields.filter(
    (field) => data[field] && data[field] !== "",
  ).length;
  const completeness =
    (filledRequired / requiredFields.length) * 0.8 +
    (filledOptional / optionalFields.length) * 0.2;

  // Accuracy (40% of score)
  const validator = new DataValidator(asnValidationRules);
  const validation = validator.validate(data);
  const accuracy = validation.isValid
    ? 1
    : Math.max(
        0,
        1 - Object.keys(validation.errors).length / requiredFields.length,
      );

  // Consistency (20% of score)
  let consistency = 1;

  // Check if innovation/award claims are consistent with evidence
  if (data.memiliki_inovasi && !data.bukti_inovasi) consistency -= 0.3;
  if (data.memiliki_penghargaan && !data.bukti_penghargaan) consistency -= 0.3;
  if (!data.memiliki_inovasi && data.bukti_inovasi) consistency -= 0.2;
  if (!data.memiliki_penghargaan && data.bukti_penghargaan) consistency -= 0.2;

  consistency = Math.max(0, consistency);

  const score = (completeness * 0.4 + accuracy * 0.4 + consistency * 0.2) * 100;

  return {
    score: Math.round(score),
    details: {
      completeness: Math.round(completeness * 100),
      accuracy: Math.round(accuracy * 100),
      consistency: Math.round(consistency * 100),
    },
  };
};
