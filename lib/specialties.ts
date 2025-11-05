/**
 * Specialty options for trainers and nutritionists
 */

export const TRAINER_SPECIALTIES = [
  "Weight Loss",
  "Muscle Building",
  "Strength Training",
  "Cardiovascular Training",
  "HIIT (High-Intensity Interval Training)",
  "CrossFit",
  "Powerlifting",
  "Olympic Weightlifting",
  "Bodybuilding",
  "Functional Training",
  "Sports-Specific Training",
  "Injury Rehabilitation",
  "Pre/Postnatal Fitness",
  "Senior Fitness",
  "Youth Fitness",
  "Flexibility & Mobility",
  "Yoga",
  "Pilates",
  "Boxing & Martial Arts",
  "Running & Marathon Training",
  "Calisthenics",
  "TRX/Suspension Training",
] as const;

export const NUTRITIONIST_SPECIALTIES = [
  "Weight Management",
  "Sports Nutrition",
  "Clinical Nutrition",
  "Pediatric Nutrition",
  "Geriatric Nutrition",
  "Prenatal/Postnatal Nutrition",
  "Diabetes Management",
  "Heart Health",
  "Digestive Health",
  "Food Allergies & Intolerances",
  "Plant-Based/Vegan Nutrition",
  "Ketogenic Diet",
  "Mediterranean Diet",
  "Eating Disorders",
  "Autoimmune Conditions",
  "Hormone Balance",
  "Mental Health & Nutrition",
  "Meal Planning",
  "Supplement Guidance",
  "Metabolic Health",
  "Renal Nutrition",
  "Oncology Nutrition",
] as const;

export type TrainerSpecialty = (typeof TRAINER_SPECIALTIES)[number];
export type NutritionistSpecialty = (typeof NUTRITIONIST_SPECIALTIES)[number];
