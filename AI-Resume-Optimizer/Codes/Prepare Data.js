// n8n Code node: Prepare Data
// Expected input: Extract From File output, plus original Form Trigger fields.
// Update the node name in $('AI Resume Optimizer Form') if you rename the trigger.

const extracted = $input.first()?.json ?? {};
const form = $('AI Resume Optimizer Form').first()?.json ?? {};

function cleanText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function chunkSentences(text, sentencesPerChunk = 3) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  const chunks = [];
  for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
    const chunk = sentences.slice(i, i + sentencesPerChunk).join(' ');
    if (chunk) chunks.push(chunk);
  }
  return chunks.length ? chunks : (text.length > 0 ? [text] : []);
}

const resume = cleanText(
  extracted.text ?? extracted.extractedText ?? extracted.data ?? ''
);
const jobDescription = cleanText(
  form["Job Description"] ?? form.jobDescription ?? form.job_description ?? ''
);
const targetRole = cleanText(form["Target Role"] ?? form.targetRole ?? '');

if (!resume) {
  throw new Error(
    'No readable text was extracted from the uploaded PDF. Use a text-based PDF or add an OCR service for scanned resumes.'
  );
}
if (!jobDescription) {
  throw new Error('Job Description is required.');
}

const resumeChunks = chunkSentences(resume);
const jdChunks = chunkSentences(jobDescription);

if (!resumeChunks.length || !jdChunks.length) {
  throw new Error('Unable to create text chunks from the resume or job description.');
}

const allChunks = [...resumeChunks, ...jdChunks];

return [{
  json: {
    resume,
    jobDescription,
    targetRole,
    resumeChunks,
    jdChunks,
    resumeChunkCount: resumeChunks.length,
    jdChunkCount: jdChunks.length,
    embeddingRequests: allChunks.map(text => ({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
      outputDimensionality: 768
    }))
  }
}];
