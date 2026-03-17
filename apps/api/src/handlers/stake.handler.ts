import { NextFunction, Request, Response } from 'express';
import { stakeService } from '../services/stake.service';
import { StakeTxQuery, UnstakeTxQuery } from '../types/api.types';

export const stakeHandler = {
    buildStakeTx: async (
        req: Request<{}, {}, {}, StakeTxQuery>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { userAddress, vaultAddress, lockPeriodIndex, stakeAmount } = req.query;

            if (!userAddress || !vaultAddress || lockPeriodIndex === undefined || !stakeAmount) {
                res.status(400).json({
                    error: 'Missing required query params: userAddress, vaultAddress, lockPeriodIndex, stakeAmount',
                    statusCode: 400,
                });
                return;
            }

            const data = await stakeService.buildStakeTx(
                userAddress,
                vaultAddress,
                parseInt(lockPeriodIndex, 10),
                stakeAmount,
            );
            res.json({ data, message: 'Stake transaction built', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    buildUnstakeTx: async (
        req: Request<{}, {}, {}, UnstakeTxQuery>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { userAddress, vaultAddress, stakeIndex, unstakeAmount } = req.query;

            if (!userAddress || !vaultAddress || stakeIndex === undefined || !unstakeAmount) {
                res.status(400).json({
                    error: 'Missing required query params: userAddress, vaultAddress, stakeIndex, unstakeAmount',
                    statusCode: 400,
                });
                return;
            }

            const data = await stakeService.buildUnstakeTx(
                userAddress,
                vaultAddress,
                parseInt(stakeIndex, 10),
                unstakeAmount,
            );
            res.json({ data, message: 'Unstake transaction built', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },
};
