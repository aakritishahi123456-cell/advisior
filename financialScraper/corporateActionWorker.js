const { scrapeCorporateActions } = require('./corporateActionScraper');
const { PrismaClient } = require('@prisma/client');
const pino = require('pino');

const prisma = new PrismaClient();
const logger = pino({ name: 'corporate-action-worker' });

async function processCorporateActionsJob(sourceUrl) {
    logger.info(`Starting Corporate Action processing for: ${sourceUrl}`);

    try {
        const rawActions = await scrapeCorporateActions(sourceUrl);

        for (const actionData of rawActions) {
            await prisma.$transaction(async (tx) => {
                // 1. Resolve Company
                const company = await tx.company.findUnique({
                    where: { symbol: actionData.symbol }
                });
                
                if (!company) {
                    logger.warn(`Company not found for symbol ${actionData.symbol}, skipping...`);
                    return;
                }

                // 2. Resolve Action Type (Create if missing)
                const actionCode = actionData.actionTypeName.toUpperCase().replace(/\s+/g, '_');
                const actionType = await tx.corporateActionType.upsert({
                    where: { code: actionCode },
                    update: {},
                    create: {
                        code: actionCode,
                        name: actionData.actionTypeName
                    }
                });

                // 3. Upsert Corporate Action
                const corpAction = await tx.corporateAction.upsert({
                    where: {
                        companyId_actionTypeId_announcementDate: {
                            companyId: company.id,
                            actionTypeId: actionType.id,
                            announcementDate: actionData.announcementDate
                        }
                    },
                    update: {
                        recordDate: actionData.recordDate,
                        ratio: actionData.ratio,
                        sourceUrl: actionData.sourceUrl
                    },
                    create: {
                        companyId: company.id,
                        actionTypeId: actionType.id,
                        announcementDate: actionData.announcementDate,
                        recordDate: actionData.recordDate,
                        ratio: actionData.ratio,
                        sourceUrl: actionData.sourceUrl
                    }
                });

                // 4. Create related Dividend entries if applicable
                if (actionData.dividendData) {
                    // Approximate fiscal year or parse it differently logic here
                    const fiscalYr = `${actionData.announcementDate.getFullYear() - 1}/${actionData.announcementDate.getFullYear().toString().substring(2)}`;
                    
                    await tx.dividend.upsert({
                        where: { corporateActionId: corpAction.id },
                        update: {
                            dividendPercentage: actionData.dividendData.totalPercentage,
                            isBonus: actionData.dividendData.bonusPercentage > 0,
                            isCash: actionData.dividendData.cashPercentage > 0
                        },
                        create: {
                            companyId: company.id,
                            corporateActionId: corpAction.id,
                            fiscalYear: fiscalYr,
                            dividendPercentage: actionData.dividendData.totalPercentage,
                            isBonus: actionData.dividendData.bonusPercentage > 0,
                            isCash: actionData.dividendData.cashPercentage > 0
                        }
                    });
                }
                
                logger.info(`Successfully recorded Corporate Action for ${actionData.symbol}`);
            });
        }
    } catch (error) {
        logger.error(`Critical failure in corporate action processing: ${error.message}`);
        throw error;
    }
}

// Optional standalone run mode
if (require.main === module) {
    const url = process.argv[2] || 'https://example-nepse-disclosures.api/v1/latest';
    processCorporateActionsJob(url)
        .then(() => {
            logger.info('Corporate action processing finished.');
            process.exit(0);
        })
        .catch(() => process.exit(1));
}

module.exports = {
    processCorporateActionsJob
};
