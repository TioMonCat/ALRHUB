/**
 * Helper to get the corresponding car image path based on keywords in the car model name.
 * 
 * Supported GT3 Cars:
 * - Lexus: "LEXUS" -> img/LEXUS_GT3.JPG
 * - Porsche: "PORSCHE", "992", "911" -> img/PORSCHE_GT3.JPG
 * - BMW: "BMW", "M4" -> img/BMW_GT3.JPG
 * - Fallback GT3: "GT3" -> img/GT3.JPG
 * 
 * Supported Prototype:
 * - LMP2 / Oreca: "LMP2", "ORECA", "LMP", "07" -> img/LMP2.JPG
 */
export const getCarImage = (carName?: string | null): string | null => {
  if (!carName) return null;
  const c = carName.toUpperCase();

  if (c.includes("LEXUS")) return "img/LEXUS_GT3.JPG";
  if (c.includes("PORSCHE") || c.includes("992") || c.includes("911")) return "img/PORSCHE_GT3.JPG";
  if (c.includes("BMW") || c.includes("M4")) return "img/BMW_GT3.JPG";
  if (c.includes("LMP2") || c.includes("ORECA") || c.includes("LMP") || c.includes("07")) return "img/LMP2.JPG";
  if (c.includes("GT3")) return "img/GT3.JPG";

  return null;
};
