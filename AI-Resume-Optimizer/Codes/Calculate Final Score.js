// n8n Code node: Calculate Final Score
// Expects parsed Gemini JSON from the preceding LLM HTTP Request.

const semantic = $('Calculate Semantic Similarity').first().json;
const raw = $input.first().json;

function extractText(payload) {
  if (typeof payload === 'string') return payload;
  return payload.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('\n')
    ?? payload.text
    ?? payload.output
    ?? '';
}

const text = extractText(raw).trim();
let evaluation;
try {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  evaluation = JSON.parse(cleaned);
} catch (error) {
  throw new Error(`Could not parse Gemini evaluation as JSON: ${error.message}. Raw response: ${text.slice(0, 500)}`);
}

const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
const skills = clamp(evaluation.skills_score);
const roleMatch = clamp(evaluation.role_match_score);
const experience = clamp(evaluation.experience_score);
const semanticScore = clamp(semantic.semanticScore);

const finalScore = Math.round(
  0.40 * semanticScore +
  0.30 * skills +
  0.20 * roleMatch +
  0.10 * experience
);

const verdict = finalScore >= 80
  ? 'Strong Match'
  : finalScore >= 60
    ? 'Moderate Match'
    : 'Weak Match';

return [{
  json: {
    project: 'AI Resume Optimizer',
    targetRole: semantic.targetRole || evaluation.target_role || 'Not specified',
    finalScore,
    verdict,
    componentScores: {
      semantic: semanticScore,
      skills,
      roleMatch,
      experience
    },
    matchedSkills: evaluation.matched_skills ?? [],
    missingSkills: evaluation.missing_skills ?? [],
    roleFocusFeedback: evaluation.role_focus_feedback ?? '',
    projectFeedback: evaluation.project_feedback ?? '',
    rewriteSuggestions: evaluation.rewrite_suggestions ?? [],
    topPriorities: evaluation.top_priorities ?? [],
    weakRequirements: semantic.weakRequirements,
    chunkMatches: semantic.chunkMatches,
    disclaimer: 'This is an advisory estimate based on the supplied resume and job description, not a hiring decision or a guarantee of ATS performance.'
  }
}];
