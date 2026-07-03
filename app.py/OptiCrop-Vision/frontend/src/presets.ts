import { PresetSpecimen } from "./types";

const tomatoBlightSvg = `<svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#f1f5f9"/>
  <!-- Leaf Stem -->
  <path d="M50,90 Q50,50 50,15" stroke="#16a34a" stroke-width="2.5" fill="none"/>
  <!-- Leaf Blade -->
  <path d="M50,15 C20,35 15,65 50,85 C85,65 80,35 50,15 Z" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>
  <!-- Veins -->
  <path d="M50,30 Q40,25 30,22 M50,45 Q35,38 25,35 M50,60 Q38,55 28,52 M50,30 Q60,25 70,22 M50,45 Q65,38 75,35 M50,60 Q62,55 72,52" stroke="#86efac" stroke-width="1.2" fill="none"/>
  <!-- Late Blight Spots: Large brown necrotic lesions with yellow halos -->
  <!-- Spot 1 -->
  <circle cx="36" cy="38" r="7" fill="#eab308" opacity="0.8"/>
  <circle cx="36" cy="38" r="5" fill="#713f12"/>
  <circle cx="35" cy="37" r="2.5" fill="#451a03"/>
  <!-- Spot 2 -->
  <circle cx="64" cy="54" r="9" fill="#eab308" opacity="0.8"/>
  <circle cx="64" cy="54" r="6.5" fill="#713f12"/>
  <circle cx="63" cy="53" r="3.5" fill="#451a03"/>
  <!-- Spot 3 -->
  <circle cx="48" cy="28" r="4.5" fill="#eab308" opacity="0.8"/>
  <circle cx="48" cy="28" r="3" fill="#713f12"/>
  <!-- Necrotic margins -->
  <path d="M19,45 Q16,55 23,62" stroke="#713f12" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>
  <path d="M81,42 Q83,50 78,58" stroke="#713f12" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.8"/>
  <text x="5" y="94" font-family="sans-serif" font-size="5" font-weight="bold" fill="#334155">TOMATO: LATE BLIGHT SPECIMEN</text>
</svg>`;

const cornRustSvg = `<svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#f1f5f9"/>
  <!-- Long slender corn leaf -->
  <path d="M50,95 Q54,50 48,5 C48,5 25,40 50,95 Z" fill="#4ade80" stroke="#16a34a" stroke-width="1"/>
  <path d="M50,95 Q46,50 52,5 C52,5 75,40 50,95 Z" fill="#22c55e" stroke="#15803d" stroke-width="1"/>
  <!-- Center rib -->
  <path d="M50,95 L50,5" stroke="#fef08a" stroke-width="1.2" fill="none"/>
  <!-- Orange Common Rust Pustules: Small, numerous, raised orange-brown bumps -->
  <circle cx="45" cy="25" r="2" fill="#ea580c"/>
  <circle cx="46" cy="26" r="1" fill="#9a3412"/>
  <circle cx="53" cy="22" r="1.5" fill="#ea580c"/>
  <circle cx="43" cy="42" r="2.5" fill="#ea580c"/>
  <circle cx="43" cy="42" r="1.2" fill="#9a3412"/>
  <circle cx="54" cy="50" r="2" fill="#ea580c"/>
  <circle cx="46" cy="62" r="1.8" fill="#ca8a04"/>
  <circle cx="53" cy="68" r="2.2" fill="#ea580c"/>
  <circle cx="53" cy="68" r="1" fill="#9a3412"/>
  <circle cx="44" cy="15" r="1.5" fill="#ea580c"/>
  <circle cx="51" cy="36" r="2" fill="#ea580c"/>
  <circle cx="41" cy="55" r="1.5" fill="#ea580c"/>
  <circle cx="49" cy="78" r="1.8" fill="#ea580c"/>
  <text x="5" y="94" font-family="sans-serif" font-size="5" font-weight="bold" fill="#334155">CORN: COMMON RUST SPECIMEN</text>
</svg>`;

const grapeChlorosisSvg = `<svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#f1f5f9"/>
  <!-- Grapevine Leaf - Lobed shape, severe chlorosis (pale yellow leaf body, dark green veins) -->
  <!-- Stem -->
  <path d="M50,92 L50,78" stroke="#4d7c0f" stroke-width="3" fill="none"/>
  <!-- Pale Yellow Leaf Body -->
  <path d="M50,15 C60,10 75,20 70,35 C78,35 88,45 80,60 C85,65 80,80 50,80 C20,80 15,65 20,60 C12,45 22,35 30,35 C25,20 40,10 50,15 Z" fill="#fef08a" stroke="#eab308" stroke-width="1.5"/>
  <!-- Dark green veins (classic interveinal chlorosis signature) -->
  <path d="M50,80 L50,20" stroke="#166534" stroke-width="2" fill="none"/>
  <path d="M50,70 Q65,55 75,45" stroke="#166534" stroke-width="1.8" fill="none"/>
  <path d="M50,70 Q35,55 25,45" stroke="#166534" stroke-width="1.8" fill="none"/>
  <path d="M50,55 Q68,45 78,35" stroke="#166534" stroke-width="1.5" fill="none"/>
  <path d="M50,55 Q32,45 22,35" stroke="#166534" stroke-width="1.5" fill="none"/>
  <path d="M50,35 Q60,25 65,18" stroke="#166534" stroke-width="1.2" fill="none"/>
  <path d="M50,35 Q40,25 35,18" stroke="#166534" stroke-width="1.2" fill="none"/>
  <!-- Minor subveins keeping some green nearby -->
  <path d="M38,62 L32,60 M62,62 L68,60 M33,51 L28,48 M67,51 L72,48 M42,48 L38,44 M58,48 L62,44" stroke="#15803d" stroke-width="0.8" fill="none"/>
  <text x="5" y="94" font-family="sans-serif" font-size="5" font-weight="bold" fill="#334155">GRAPE: IRON CHLOROSIS SPECIMEN</text>
</svg>`;

const appleHealthySvg = `<svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#f1f5f9"/>
  <!-- Stem -->
  <path d="M50,90 Q50,75 50,15" stroke="#14532d" stroke-width="2.5" fill="none"/>
  <!-- Vibrant dark green leaf blade -->
  <path d="M50,15 C22,32 18,62 50,84 C82,62 78,32 50,15 Z" fill="#15803d" stroke="#166534" stroke-width="1.5"/>
  <!-- Bright, healthy green details -->
  <path d="M50,15 C24,32 20,62 50,84" fill="#22c55e" opacity="0.15"/>
  <!-- Healthy veins -->
  <path d="M50,30 Q40,24 30,22 M50,45 Q35,37 25,34 M50,60 Q38,53 28,50 M50,72 Q42,67 34,65 M50,30 Q60,24 70,22 M50,45 Q65,37 75,34 M50,60 Q62,53 72,50 M50,72 Q58,67 66,65" stroke="#86efac" stroke-width="1" fill="none" opacity="0.8"/>
  <text x="5" y="94" font-family="sans-serif" font-size="5" font-weight="bold" fill="#15803d">APPLE: HEALTHY SPECIMEN</text>
</svg>`;

function svgToDataUrl(svgString: string): string {
  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  return `data:image/svg+xml;base64,${base64}`;
}

export const PRESET_SPECIMENS: PresetSpecimen[] = [
  {
    id: "tomato_blight",
    name: "Tomato Specimen",
    plantType: "Tomato",
    expectedIssue: "Late Blight (Phytophthora infestans)",
    imagePreview: svgToDataUrl(tomatoBlightSvg),
    fullBase64: svgToDataUrl(tomatoBlightSvg),
  },
  {
    id: "corn_rust",
    name: "Corn Specimen",
    plantType: "Corn (Maize)",
    expectedIssue: "Common Rust (Puccinia sorghi)",
    imagePreview: svgToDataUrl(cornRustSvg),
    fullBase64: svgToDataUrl(cornRustSvg),
  },
  {
    id: "grape_chlorosis",
    name: "Grapevine Specimen",
    plantType: "Grapevine",
    expectedIssue: "Iron Chlorosis (Nutrient Deficiency)",
    imagePreview: svgToDataUrl(grapeChlorosisSvg),
    fullBase64: svgToDataUrl(grapeChlorosisSvg),
  },
  {
    id: "apple_healthy",
    name: "Apple Leaf Specimen",
    plantType: "Apple",
    expectedIssue: "None (Healthy Crop)",
    imagePreview: svgToDataUrl(appleHealthySvg),
    fullBase64: svgToDataUrl(appleHealthySvg),
  },
];
