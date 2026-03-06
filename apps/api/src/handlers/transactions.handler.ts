import { NextFunction, Request, Response } from 'express';
import { depositService } from '../services/deposit.service';
import { withdrawService } from '../services/withdraw.service';
import {
    DepositTxQuery,
    WithdrawTxQuery,
} from '../types/api.types';

export const transactionsHandler = {
    buildDepositTx: async (
        req: Request<{}, {}, {}, DepositTxQuery>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { userAddress, vaultAddress, depositTokenAddress, depositAmount } =
                req.query;

            if (!userAddress || !vaultAddress || !depositTokenAddress || !depositAmount) {
                res.status(400).json({
                    error: 'Missing required query params: userAddress, vaultAddress, depositTokenAddress, depositAmount',
                    statusCode: 400,
                });
                return;
            }

            const data = await depositService.buildDepositTx(
                userAddress,
                vaultAddress,
                depositTokenAddress,
                depositAmount,
            );
            res.json({ data, message: 'Deposit transaction built', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    buildWithdrawTx: async (
        req: Request<{}, {}, {}, WithdrawTxQuery>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const {
                userAddress,
                vaultAddress,
                oTokenAddress,
                sharesToWithdraw,
                slippage,
                simulate,
            } = req.query;

            if (!userAddress || !vaultAddress || !oTokenAddress || !sharesToWithdraw) {
                res.status(400).json({
                    error: 'Missing required query params: userAddress, vaultAddress, oTokenAddress, sharesToWithdraw',
                    statusCode: 400,
                });
                return;
            }

            const data = await withdrawService.buildWithdrawTx({
                userAddress,
                vaultAddress,
                oTokenAddress,
                sharesToWithdraw,
                slippage: slippage !== undefined ? Number(slippage) : undefined,
                simulate: simulate === 'true',
            });
            res.json({ data, message: 'Withdraw transaction built', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },
};
