const fs = require('fs');
const FinancialQAAgent = require('./financialQAAgent');
const AccuracyCalculator = require('./accuracyCalculator');
const path = require('path');

class EvaluationRunner {
    constructor(questionsFile = 'financialQuestions.json') {
        this.questionsFile = path.join(__dirname, questionsFile);
        this.agent = new FinancialQAAgent();
        this.scorer = new AccuracyCalculator();
        this.results = [];
    }

    async loadQuestions() {
        if (!fs.existsSync(this.questionsFile)) {
            throw new Error(`Questions file not found: ${this.questionsFile}`);
        }
        const data = fs.readFileSync(this.questionsFile, 'utf8');
        return JSON.parse(data);
    }

    /**
     * Executes the evaluation suite against the RAG system.
     * Processes each question, retrieves the answer, and scores it.
     */
    async runEvaluation() {
        console.log("Starting FinSathi AI Benchmarking Evaluation...");
        const questions = await this.loadQuestions();
        let processedCount = 0;

        for (const q of questions) {
            console.log(`\nEvaluating Q${q.id}: ${q.question}`);
            try {
                const startTime = Date.now();
                // 1. Question -> AI Answer
                const response = await this.agent.answerQuestion(q.question);
                const latency = Date.now() - startTime;

                // 2. AI Answer -> Scoring Engine
                const evaluationScore = await this.scorer.evaluateResponse(
                    q.question,
                    q.expected_answer,
                    q.required_facts,
                    response.formattedAnswer,
                    response.internalRawSources
                );

                this.results.push({
                    id: q.id,
                    question: q.question,
                    difficulty: q.difficulty,
                    actual_answer: response.formattedAnswer,
                    latency_ms: latency,
                    ...evaluationScore
                });

            } catch (error) {
                console.error(`Failed to evaluate question ${q.id}:`, error.message);
                this.results.push({
                    id: q.id,
                    question: q.question,
                    error: error.message,
                    accuracyScore: 0,
                    confidenceScore: 0
                });
            }
            processedCount++;
            console.log(`Progress: ${processedCount}/${questions.length}`);
        }

        return this.results;
    }

    /**
     * Generates a final JSON report of the benchmarking run.
     * @param {Array<Object>} results - The detailed results array from runEvaluation.
     */
    generateReport(results) {
        const totalAccuracy = results.reduce((acc, r) => acc + (r.accuracyScore || 0), 0) / results.length;
        const totalConfidence = results.reduce((acc, r) => acc + (r.confidenceScore || 0), 0) / results.length;

        const report = {
            timestamp: new Date().toISOString(),
            totalQuestionsProcessed: results.length,
            overallAccuracy: totalAccuracy.toFixed(2),
            overallConfidence: totalConfidence.toFixed(2),
            detailedResults: results
        };

        const reportPath = path.join(__dirname, `evaluationReport_${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\nEvaluation complete! Report saved to: ${reportPath}`);

        return report;
    }
}

module.exports = EvaluationRunner;
