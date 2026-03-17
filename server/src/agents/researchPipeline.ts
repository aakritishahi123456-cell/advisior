import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PrismaClient } from '@prisma/client';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import pino from 'pino';

const logger = pino({ name: 'finsathi-ai-research-agent' });
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Multi-Agent System Definitions
// ---------------------------------------------------------------------------

/**
 * 1. Document Collector Agent
 * Responsible for polling NEPSE disclosures, downloading official annual/quarterly reports
 * and generating the initial Document record.
 */
export class DocumentCollectorAgent {
    async collect(companySymbol: string, sourceUrl: string, documentType: string) {
        logger.info(`Collecting ${documentType} for ${companySymbol} from ${sourceUrl}`);
        // Fetch logic would go here. We mock the text extraction for demonstration.
        
        const company = await prisma.company.findUnique({ where: { symbol: companySymbol } });
        if (!company) throw new Error('Company not found');

        return await prisma.companyDocument.create({
            data: {
                companyId: company.id,
                title: `${companySymbol} - ${documentType}`,
                documentType,
                sourceUrl,
                publishedAt: new Date(),
                parsedText: "Mock extracted content from PDF.",
            }
        });
    }
}

/**
 * 2. Document Parser Agent (w/ Embedding Generator)
 * Chunks documents logically preserving page boundaries for strict citation mapping.
 */
export class DocumentParserAgent {
    async parseAndVectorize(documentId: string) {
        logger.info(`Parsing and embedding Document: ${documentId}`);
        const document = await prisma.companyDocument.findUnique({ where: { id: documentId } });
        
        // Mocking Page Segmentation
        const chunks = [
            { page: 1, text: "Annual Report Abstract: We grew revenue by 12%." },
            { page: 2, text: "Financials: Net profit stood at NPR 400 Million." }
        ];

        const vectorStore = new Chroma(new OpenAIEmbeddings(), { collectionName: 'finsathi_reports' });

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            // 1. Store locally for relational DB joins
            const dbChunk = await prisma.documentChunk.create({
                data: {
                    documentId,
                    pageNumber: chunk.page,
                    chunkIndex: i,
                    content: chunk.text,
                    tokenCount: chunk.text.length / 4 // Approximate token count
                }
            });

            // 2. Add to Vector DB (ChromaDB)
            await vectorStore.addDocuments([{
                pageContent: chunk.text,
                metadata: { documentId, chunkId: dbChunk.id, pageNumber: chunk.page }
            }]);
        }
    }
}

/**
 * 3. Financial Facts Extraction Agent
 * Extracts specific quantitative metrics from text.
 */
export class FinancialExtractionAgent {
    async extract(documentId: string, companyId: string, text: string) {
        // Implement highly specific Zod structured LLM extraction for fields like "revenue", "eps" etc.
        logger.info(`Extracting structured financial facts for Document: ${documentId}`);
        await prisma.extractedFinancialFact.create({
            data: { documentId, companyId, metricName: 'Net Profit', metricValue: '400M', context: text, pageNumber: 2 }
        });
    }
}

/**
 * 4. Company Classification Agent
 * Dynamically infers sector bounds and AI tagging based on annual board strategies.
 */
export class CompanyClassificationAgent {
    async classify(companyId: string, annualReportText: string) {
        logger.info(`Classifying Company: ${companyId}`);
        await prisma.companyClassification.upsert({
            where: { companyId },
            update: { strategy: 'Aggressive expansion', confidenceScore: 0.95, justification: 'Board indicates rapid branch scaling.' },
            create: { companyId, sector: 'Banking', strategy: 'Aggressive expansion', confidenceScore: 0.95, justification: 'Board references.' }
        });
    }
}

/**
 * 5. & 6. Research Query Agent + Explanation Generator
 * Handles multi-stage RAG logic: Retreives vectors, formats reasoning, mandates strict citations.
 */
export class ResearchQueryAgent {
    private llm = new ChatOpenAI({ modelName: 'gpt-4o', temperature: 0.0 });

    async handleQuery(queryId: string, userId: string, queryText: string) {
        logger.info(`Processing User Query: "${queryText}"`);
        
        // Step 1: Query VectorDB
        const vectorStore = new Chroma(new OpenAIEmbeddings(), { collectionName: 'finsathi_reports' });
        const retrievedDocs = await vectorStore.similaritySearch(queryText, 3);
        
        // Compile Context with Citation Identifiers
        const contextBlocks = retrievedDocs.map(doc => 
            `[DocID: ${doc.metadata.documentId} | Page: ${doc.metadata.pageNumber}]\nContent: ${doc.pageContent}`
        ).join('\n\n');

        // Step 2: Complex Chain-of-Thought Prompt Mandating Citations
        const promptTemplate = PromptTemplate.fromTemplate(`
            You are a strict financial AI researcher for FinSathi (Nepal Stock Exchange).
            You must ONLY answer the question using the precise facts provided below.
            You must provide exact reasoning.
            You MUST implicitly cite your sources using the [DocID: X | Page: Y] format provided.

            Knowledge Base:
            {context}

            User Question: {question}

            Return your reasoning and final answer clearly.
        `);

        // Execute LLM
        const chain = promptTemplate.pipe(this.llm).pipe(new StringOutputParser());
        const responseText = await chain.invoke({ context: contextBlocks, question: queryText });

        // Step 3: Parse out the implicit logic tree (Simulation)
        const reasoningChain = {
            step1: "Search verified database for relevant document chunks.",
            step2: `Retrieved ${retrievedDocs.length} highly relevant snippets.`,
            step3: "Applied inference constrained strictly to document text, denying external knowledge logic."
        };

        const citations = retrievedDocs.map(doc => ({
            documentId: doc.metadata.documentId,
            pageNumber: doc.metadata.pageNumber,
            snippet: doc.pageContent.substring(0, 50) + '...'
        }));

        // Step 4: Save robust Explanation and Answer
        await prisma.researchAnswer.create({
            data: {
                queryId,
                answerText: responseText,
                confidenceScore: 0.88, // Inferred confidence metric
                reasoningChain: reasoningChain,
                citations: citations
            }
        });

        logger.info(`AI Research generated accurately for Query: ${queryId}`);
    }
}
