import { NextFunction, Request, Response } from 'express';
import { engineService } from '../services/engine.service';
import { UserInvestmentsQuery } from '../types/api.types';

export const analyticsHandler = {
    getTotalTvl: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const data = await engineService.getTotalTvl();
            res.json({ data, message: 'Total TVL retrieved', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    getUserInvestments: async (
        req: Request<{}, {}, {}, UserInvestmentsQuery>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { userAddress, vaultAddress } = req.query;

            if (!userAddress) {
                res.status(400).json({
                    error: 'Missing required query param: userAddress',
                    statusCode: 400,
                });
                return;
            }

            const data = await engineService.getUserInvestments(userAddress, vaultAddress);
            res.json({ data, message: 'User investments retrieved', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },
};
