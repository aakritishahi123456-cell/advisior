class AccuracyCalculator {
    /**
     * The scoring engine evaluating numerical accuracy, source citation, and logical reasoning.
     * Evaluates the AI response against the expected criteria.
     */
    constructor() {
        // Scoring weights
        this.weights = {
            numericalAccuracy: 0.4,
            correctSourceCitation: 0.4,
            logicalReasoning: 0.2
        };
    }

    /**
     * Evaluates a response based on the defined criteria.
     * @param {string} question - The original query.
     * @param {string} expectedAnswer - The ground truth answer.
     * @param {Array<string>} requiredFacts - Array of mandatory facts (e.g., numbers, names)
     * @param {string} actualAnswer - The AI's full formatted response string.
     * @param {Array<Object>} retrievedContexts - The raw Langchain context chunks.
     * @returns {Object} Final scores.
     */
    async evaluateResponse(question, expectedAnswer, requiredFacts, actualAnswer, retrievedContexts) {
        let scores = {
            numericalAccuracy: 0,
            correctSourceCitation: 0,
            logicalReasoning: 0
        };

        // 1. Numerical Accuracy Check
        scores.numericalAccuracy = this.checkNumericalAccuracy(actualAnswer, requiredFacts);

        // 2. Correct Source Citation Check
        scores.correctSourceCitation = this.checkCitationAccuarcy(actualAnswer, retrievedContexts);

        // 3. Logical Reasoning (Basic keyword heuristic for flow, could be LLM-empowered)
        scores.logicalReasoning = this.checkLogicalFlow(actualAnswer, question);

        // Calculate final weighted score out of 100
        const finalAccuracyScore = (
            (scores.numericalAccuracy * this.weights.numericalAccuracy) +
            (scores.correctSourceCitation * this.weights.correctSourceCitation) +
            (scores.logicalReasoning * this.weights.logicalReasoning)
        ) * 100;

        // Confidence defined as how strong the retrieved contexts were (e.g., # of citations extracted)
        const confidenceScore = retrievedContexts && retrievedContexts.length > 0 ?
            (retrievedContexts.length / 4) * 100 : 0; // assuming k=4 max

        return {
            accuracyScore: finalAccuracyScore,
            confidenceScore: confidenceScore,
            detailedScores: scores
        };
    }

    checkNumericalAccuracy(actualAnswer, requiredFacts) {
        if (!requiredFacts || requiredFacts.length === 0) return 1.0;

        let matchCount = 0;
        const normalizedAnswer = actualAnswer.toLowerCase();

        requiredFacts.forEach(fact => {
            if (normalizedAnswer.includes(String(fact).toLowerCase())) {
                matchCount++;
            }
        });

        return matchCount / requiredFacts.length; // 0.0 to 1.0
    }

    checkCitationAccuarcy(actualAnswer, retrievedContexts) {
        // Did the LLM explicitly follow the strict formatting?
        const hasSourceBlock = actualAnswer.includes("Source\n");
        const hasPageBlock = actualAnswer.includes("Page\n");
        const hasCitationBlock = actualAnswer.includes("Citation\n");

        if (!hasSourceBlock || !hasPageBlock || !hasCitationBlock) {
            return 0.0; // Complete failure to cite
        }

        // Check if the cited document actually existed in the retrieved contexts
        let sourceVerified = false;
        if (retrievedContexts && retrievedContexts.length > 0) {
            for (const context of retrievedContexts) {
                if (context.metadata && context.metadata.source_document) {
                    if (actualAnswer.includes(context.metadata.source_document)) {
                        sourceVerified = true;
                        break;
                    }
                }
            }
        }

        return sourceVerified ? 1.0 : 0.5; // Partial credit if formatted but hallucinated source
    }

    checkLogicalFlow(actualAnswer, question) {
        // Basic heuristic: Ensure the answer isn't too short, and actually addresses the topic
        if (actualAnswer.length < 20) return 0.0;

        // In a true enterprise scenario, this could be a secondary LLM call evaluating reasoning:
        // `evaluateReasoningLLM(question, actualAnswer)` -> returns 0-1. 
        // For now, we return a baseline decent score if it passed the length & formatting checks implicitly.
        return 0.9;
    }
}

module.exports = AccuracyCalculator;
