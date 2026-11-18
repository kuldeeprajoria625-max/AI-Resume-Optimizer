# AI Resume Optimizer — Project Documentation

## 1. Project Overview

AI Resume Optimizer is an n8n-based workflow that compares one candidate resume in PDF format with one target job description. It combines semantic matching using text embeddings and cosine similarity with a structured evaluation from a large language model. A deterministic scoring stage aggregates the component scores and returns a human-readable verdict and improvement recommendations.

The system is an advisory tool. It does not make hiring decisions, verify the truth of candidate claims, or reproduce the proprietary decision logic of commercial Applicant Tracking Systems.

## 2. Problem Statement

Manual resume-to-job-description comparison can be slow and inconsistent. Keyword-only approaches may overlook equivalent phrases and related skills, while unconstrained LLM responses can be subjective or unsupported. The project addresses these limitations by combining a mathematical semantic similarity signal with structured contextual feedback and an explicit weighted score.

## 3. Objectives

1. Accept a resume PDF and job description through an n8n form.
2. Extract readable text from the PDF.
3. Normalize resume and job-description text.
4. Divide both documents into sentence-based chunks.
5. Generate embeddings for all chunks.
6. Compare each job-description chunk with resume chunks using cosine similarity.
7. Identify weakly matched job requirements.
8. Use an LLM to assess skills, role alignment, experience, and projects.
9. Return matched skills, missing skills, rewrite suggestions, and priorities.
10. Combine component scores using a documented weighted formula.

## 4. Scope and Intended Users

The documented scope is one resume and one job description per analysis. Intended users include job applicants, students and early-career candidates, placement-support staff, and developers configuring or evaluating the workflow.

The current workflow focuses on text-based PDF files. OCR for scanned PDFs, DOCX extraction, resume rewriting, before-and-after comparisons, ATS layout checks, and vector database integration are future extensions.

## 5. System Architecture

The workflow uses n8n as the orchestration layer.

1. **Form Trigger:** receives the resume PDF, job description, and optional target role.
2. **Extract From File:** extracts text from the PDF.
3. **Prepare Data:** cleans text and creates sentence-based chunks.
4. **Gemini Embeddings:** converts resume and JD chunks into vectors.
5. **Semantic Similarity:** finds the best resume chunk for every JD chunk and identifies weak requirements.
6. **Gemini Evaluation:** assesses skills, role match, experience, project relevance, and improvement opportunities.
7. **Final Score:** combines numerical component scores and creates the verdict.
8. **Form Completion:** returns the structured analysis.

See `../assets/system-architecture.svg` for the system diagram.

## 6. Technologies

| Technology | Purpose |
|---|---|
| n8n | Workflow automation and orchestration |
| Google Gemini Embedding API | Text embeddings |
| Gemini 2.5 Flash | Structured resume evaluation |
| JavaScript | Text preparation, cosine similarity, score aggregation |
| HTTP Request nodes | Gemini API integration |
| Extract From File | PDF text extraction |
| Structured JSON response | Predictable LLM output fields |

The project uses Gemini as the documented default implementation in the supplied workflow. Other providers mentioned in the project design (OpenAI embeddings or local Ollama embeddings) are alternatives, not preconfigured implementations in this repository.

## 7. Scoring Method

For each job-description chunk, the system finds the resume chunk with the highest cosine similarity:

`cosine(A, B) = (A · B) / (||A|| × ||B||)`

The average of the best-match values is converted to a percentage to create the semantic score. A threshold of 0.45 is used as an initial indicator of weakly matched requirements. This threshold is a starting parameter and must be calibrated with representative data.

The final score is:

`FinalScore = 0.40 × Semantic + 0.30 × Skills + 0.20 × RoleMatch + 0.10 × Experience`

| Score | Verdict |
|---|---|
| 80–100 | Strong Match |
| 60–79 | Moderate Match |
| 0–59 | Weak Match |

Illustrative arithmetic: semantic 78, skills 70, role match 75, and experience 80 produce 75.7, rounded to 76. This is an example only, not a measured result.

## 8. Input and Output

**Inputs**
- Resume PDF (required)
- Job Description (required)
- Target Role (optional)

**Outputs**
- Overall suitability score and verdict
- Semantic, skills, role-match, and experience scores
- Matched skills
- Missing or weakly evidenced skills
- Role-focus feedback
- Project feedback
- Rewrite suggestions
- Top improvement priorities
- Weakly matched JD requirements and chunk-level evidence

## 9. Installation and Setup

### Prerequisites
- An n8n Cloud or self-hosted instance.
- A Google AI Studio API key with access to the Gemini embedding and generation models.
- A text-based PDF resume for testing.

### Import
1. Open n8n.
2. Import `workflow/ai-resume-optimizer-workflow.json`.
3. Review the form file field's binary property name. It may need to be changed to match the binary property emitted by the Form Trigger.
4. Configure the `GEMINI_API_KEY` environment variable for the n8n process, or replace the header expression with a credential-backed configuration supported by your n8n installation.
5. Ensure the n8n environment permits the `$env` expression used in the HTTP Request nodes. If not, use n8n Credentials.
6. Save the workflow and open its form URL.

### Local n8n example
```bash
npm install -g n8n
n8n
```
Open `http://localhost:5678`.

### Environment variable
Set `GEMINI_API_KEY` in the environment where n8n runs. Never commit the real key. The workflow JSON contains only an environment-variable expression.

## 10. Usage

1. Open the n8n form.
2. Upload a text-based PDF resume.
3. Paste the complete target job description.
4. Optionally enter the target role.
5. Submit the form.
6. Wait for extraction, embedding generation, semantic comparison, and LLM evaluation.
7. Review the score, matched and missing skills, and recommendations.

## 11. Validation Plan

The project should be tested with:
- A strongly relevant resume.
- A partially relevant resume.
- An unrelated resume.
- A synonym case (for example, “ML” in the resume and “machine learning” in the JD).
- A scanned or unreadable PDF.
- Empty or malformed form input.
- Gemini API authentication, quota, timeout, and malformed response failures.

Expected ordering is strong match > partial match > unrelated resume. These are test expectations, not reported results. Record anonymized inputs, component scores, final scores, and failures before claiming measured performance.

## 12. Limitations

- The semantic score measures textual similarity, not proof of skill.
- LLM scores can be subjective and may misinterpret ambiguous statements.
- The similarity threshold and weights are not empirically calibrated.
- Scanned PDFs require OCR, which is not included in the core workflow.
- The workflow depends on external Gemini API availability and account limits.
- The current implementation analyzes one resume against one job description per run.
- The result is advisory and must not be used as the sole basis for hiring decisions.

## 13. Privacy and Security

Resumes contain personal information. Avoid storing full resume text unnecessarily, do not log sensitive content, use secure n8n credentials, restrict access to workflow executions, set appropriate retention periods, and obtain user consent before processing or retaining resumes. Never commit API keys or real resumes to GitHub.

## 14. Future Scope

1. Add OCR for scanned PDF files.
2. Add DOCX extraction.
3. Add resume rewriting while preserving factual accuracy.
4. Add before-and-after resume comparison.
5. Add ATS format and section checks.
6. Build an anonymized evaluation dataset and calibrate score weights.
7. Compare embedding providers for quality, cost, latency, and privacy.
8. Add explicit consent, retention, secure deletion, and access controls.

## 15. Status and Evidence

This repository provides an n8n workflow export, reusable JavaScript node code, prompts, documentation, and illustrative visual assets. The workflow has not been executed against the user's external n8n instance or API credentials in this environment. The UI mockup and architecture diagram are illustrative; they are not screenshots of a running deployment. Verify node settings, credentials, binary field names, and node compatibility in the target n8n version before relying on the workflow.
