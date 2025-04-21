// imageClassifier.js
import { pipeline } from '@xenova/transformers'; // or 'transformers' if using HuggingFace directly

let classifier = null;

export const getClassifier = async () => {
  if (!classifier) {
    classifier = await pipeline('zero-shot-image-classification');
  }
  return classifier;
};
