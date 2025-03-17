// Only updating the part with the spread type error
// Find what is causing the spread type error and fix it

// If there is a spread operation causing the error around line 49 that looks like:
// const someData = { ...someObject };
// Replace it with:
// const someData = Object.assign({}, someObject);

// For example, if the error is in a function like:
// export function createPdfData(data) {
//   return { ...data }; // This causes TS2698: Spread types may only be created from object types.
// }

// Change it to:
// export function createPdfData(data) {
//   return Object.assign({}, data); // Fixed version
// }

// Without seeing the exact code in the file, this serves as an approach to fix
// the spread type error specifically reported in the error message.

// Since we can't see the exact implementation of pdfGenerator.ts, 
// please use the approach above to fix the specific error at line 49.
