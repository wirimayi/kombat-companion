import { mkdir, copyFile, readdir } from 'node:fs/promises';
await mkdir('public/ocr/core',{recursive:true});
await mkdir('public/ocr/lang',{recursive:true});
await copyFile('node_modules/tesseract.js/dist/worker.min.js','public/ocr/worker.min.js');
for (const file of await readdir('node_modules/tesseract.js-core')) {
  if (file.endsWith('.wasm') || file.endsWith('.wasm.js')) await copyFile(`node_modules/tesseract.js-core/${file}`,`public/ocr/core/${file}`);
}
await copyFile('node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz','public/ocr/lang/eng.traineddata.gz');
console.log('English OCR assets ready for local use.');
