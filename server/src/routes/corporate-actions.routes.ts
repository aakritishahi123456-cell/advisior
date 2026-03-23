import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { CorporateActionsService } from '../services/corporateActions.service'

const router = Router()

router.get(
  '/:company',
  asyncHandler(async (req: any, res: any) => {
    const result = await CorporateActionsService.getCompanyCorporateActions(req.params.company)

    res.status(200).json({
      success: true,
      data: result,
    })
  })
)

export default router
