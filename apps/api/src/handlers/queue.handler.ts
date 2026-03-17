import { NextFunction, Request, Response } from 'express';
import { queueService } from '../services/queue.service';
import {
    QueueWithdrawTxQuery,
    UnqueueWithdrawTxQuery,
    RedeemWithdrawTxQuery,
} from '../types/api.types';

export const queueHandler = {
    buildQueueWithdrawTx: async (
        req: Request<{}, {}, {}, QueueWithdrawTxQuery>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { userAddress, vaultAddress, tokensToWithdraw, withdrawTokenAddress } =
                req.query;

            if (!userAddress || !vaultAddress || !tokensToWithdraw || !withdrawTokenAddress) {
                res.status(400).json({
                    error: 'Missing required query params: userAddress, vaultAddress, tokensToWithdraw, withdrawTokenAddress',
                    statusCode: 400,
                });
                return;
            }

            const data = await queueService.buildQueueWithdrawTx(
                userAddress,
                vaultAddress,
                tokensToWithdraw,
                withdrawTokenAddress,
            );
            res.json({ data, message: 'Queue withdraw transaction built', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    buildUnqueueWithdrawTx: async (
        req: Request<{}, {}, {}, UnqueueWithdrawTxQuery>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { userAddress, vaultAddress, oTokenAddress, requestId } = req.query;

            if (!userAddress || !vaultAddress || !oTokenAddress) {
                res.status(400).json({
                    error: 'Missing required query params: userAddress, vaultAddress, oTokenAddress',
                    statusCode: 400,
                });
                return;
            }

            const data = await queueService.buildUnqueueWithdrawTx(
                userAddress,
                vaultAddress,
                oTokenAddress,
                requestId,
            );
            res.json({ data, message: 'Unqueue withdraw transaction built', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    buildRedeemWithdrawTx: async (
        req: Request<{}, {}, {}, RedeemWithdrawTxQuery>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { userAddress, vaultAddress, oTokens, batchCounter } = req.query;

            if (!userAddress || !vaultAddress || !oTokens || !batchCounter) {
                res.status(400).json({
                    error: 'Missing required query params: userAddress, vaultAddress, oTokens, batchCounter',
                    statusCode: 400,
                });
                return;
            }

            const data = await queueService.buildRedeemWithdrawTx(
                userAddress,
                vaultAddress,
                oTokens,
                batchCounter,
            );
            res.json({ data, message: 'Redeem withdraw transaction built', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },
};
