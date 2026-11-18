// n8n Code node: Calculate Semantic Similarity
// Expects the Gemini batchEmbedContents response in $input and Prepare Data upstream.

const prepared = $('Prepare Data').first().json;
const response = $input.first().json;
const embeddings = response.embeddings ?? response.data ?? [];

const resumeCount = prepared.resumeChunks.length;
const jdCount = prepared.jdChunks.length;
const expectedCount = resumeCount + jdCount;

if (!Array.isArray(embeddings) || embeddings.length !== expectedCount) {
  throw new Error(`Embedding count mismatch. Expected ${expectedCount}, received ${embeddings.length}.`);
}

const vectors = embeddings.map((item, index) => {
  const values = item.values ?? item.embedding?.values ?? item.embedding;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`Missing embedding vector at position ${index}.`);
  }
  return values;
});

const resumeVectors = vectors.slice(0, resumeCount);
const jdVectors = vectors.slice(resumeCount);

function cosine(a, b) {
  if (a.length !== b.length) throw new Error('Embedding dimensions do not match.');
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

const threshold = 0.45;
const matches = jdVectors.map((jdVector, index) => {
  let bestScore = -1;
  let bestIndex = -1;
  resumeVectors.forEach((resumeVector, resumeIndex) => {
    const score = cosine(jdVector, resumeVector);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = resumeIndex;
    }
  });
  return {
    jdChunk: prepared.jdChunks[index],
    bestResumeChunk: prepared.resumeChunks[bestIndex] ?? '',
    similarity: Math.max(0, bestScore),
    matchedResumeChunkIndex: bestIndex
  };
});

const average = matches.reduce((sum, item) => sum + item.similarity, 0) / matches.length;
const semanticScore = Math.round(average * 100);
const weakRequirements = matches
  .filter(item => item.similarity < threshold)
  .map(item => item.jdChunk);

return [{
  json: {
    resume: prepared.resume,
    jobDescription: prepared.jobDescription,
    targetRole: prepared.targetRole,
    semanticScore,
    weakRequirements,
    chunkMatches: matches,
    similarityThreshold: threshold
  }
}];
