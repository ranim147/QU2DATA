export interface PageDimensions {
  width: number;
  height: number;
}

export const PAGE_FORMAT_DIMENSIONS: Record<string, PageDimensions | null> = {
 
  A4: { width: 794, height: 1123 },       // 210 x 297 mm
  A3: { width: 1123, height: 1587 },       // 297 x 420 mm
  A2: { width: 1587, height: 2245 },       // 420 x 594 mm
  A1: { width: 2245, height: 3179 },       // 594 x 841 mm
  A0: { width: 3179, height: 4494 },       // 841 x 1189 mm
  LETTER: { width: 816, height: 1056 },    // 8.5 x 11 in
  LEGAL: { width: 816, height: 1344 },     // 8.5 x 14 in
  TABLOID: { width: 1056, height: 1632 },  // 11 x 17 in


  SIXTEEN_NINE: { width: 1280, height: 720 },
  FOUR_THREE: { width: 1024, height: 768 },

  
  CUSTOM: null,
};


export const PAGE_FORMAT_VALUES = Object.keys(PAGE_FORMAT_DIMENSIONS);


export const DEFAULT_PAGE_FORMAT = "SIXTEEN_NINE";