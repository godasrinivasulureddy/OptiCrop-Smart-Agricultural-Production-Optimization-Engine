export type HealthStatus = "Healthy" | "Disease Detected" | "Nutrient Deficiency" | "Pest Infestation" | "Abiotic Stress";
export type UrgencyLevel = "Low" | "Medium" | "High";

export interface DiagnosticResult {
  plantType: string;
  healthStatus: HealthStatus;
  diseaseName: string;
  scientificName: string;
  confidence: number;
  urgencyLevel: UrgencyLevel;
  diagnosisSummary: string;
  symptoms: string[];
  preventionAdvice: string[];
  remedialActions: string[];
}

export interface PresetSpecimen {
  id: string;
  name: string;
  plantType: string;
  expectedIssue: string;
  imagePreview: string;
  fullBase64: string;
}

// Core App Types
export interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface CropCatalogItem {
  id?: number;
  name: string;
  min_N: number;
  max_N: number;
  min_P: number;
  max_P: number;
  min_K: number;
  max_K: number;
  min_temp: number;
  max_temp: number;
  min_humidity: number;
  max_humidity: number;
  min_ph: number;
  max_ph: number;
  min_rainfall: number;
  max_rainfall: number;
  optimal_season: string;
}

export interface SoilPrediction {
  id: number;
  user_id: number;
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  season: string;
  predicted_crop: string;
  confidence: number;
  timestamp: string;
}

export interface CultivationReport {
  id: number;
  prediction_id: number;
  title: string;
  summary: string;
  action_plan: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_predictions: number;
  total_crops: number;
  top_predicted_crops: { crop: string; count: number }[];
  system_status: string;
}

export type MainNavigation = "predict" | "history" | "catalog" | "vision" | "admin" | "report";
