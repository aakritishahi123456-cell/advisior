class BenchmarkDashboard {
    constructor(reportPath) {
        this.reportPath = reportPath;
    }

    renderDashboard() {
        const fs = require('fs');
        if (!fs.existsSync(this.reportPath)) {
            console.error("Report not found!");
            return;
        }

        const report = JSON.parse(fs.readFileSync(this.reportPath, 'utf8'));

        console.log("==================================================");
        console.log("        FinSathi AI Benchmark Dashboard           ");
        console.log("==================================================");
        console.log(`Evaluated At      : ${report.timestamp}`);
        console.log(`Total Questions   : ${report.totalQuestionsProcessed}`);
        console.log(`Overall Accuracy  : ${report.overallAccuracy}%`);
        console.log(`System Confidence : ${report.overallConfidence}%`);
        console.log("--------------------------------------------------");
        console.log("Top Failed Queries:");

        // Find worst performing queries
        const badPerformers = report.detailedResults
            .filter(r => r.accuracyScore < 50)
            .sort((a, b) => a.accuracyScore - b.accuracyScore)
            .slice(0, 3); // Top 3 worst

        if (badPerformers.length === 0) {
            console.log("  No failures detected! System is highly accurate.");
        } else {
            badPerformers.forEach(r => {
                console.log(`\n  Q: ${r.question}`);
                console.log(`  Accuracy: ${r.accuracyScore}%`);
                if (r.error) console.log(`  Error: ${r.error}`);
            });
        }

        console.log("==================================================");
    }
}

module.exports = BenchmarkDashboard;

// Entry point to run the suite from CLI
if (require.main === module) {
    (async () => {
        const EvaluationRunner = require('./evaluationRunner');
        const runner = new EvaluationRunner();
        const results = await runner.runEvaluation();
        const report = runner.generateReport(results);

        // Use regex or find exact filename since generateReport appends timestamp
        const fs = require('fs');
        const files = fs.readdirSync(__dirname);
        const latestReport = files.filter(f => f.startsWith('evaluationReport_')).sort().reverse()[0];

        const dashboard = new BenchmarkDashboard(require('path').join(__dirname, latestReport));
        dashboard.renderDashboard();
    })();
}
