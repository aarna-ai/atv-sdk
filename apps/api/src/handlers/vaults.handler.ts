import { NextFunction, Request, Response } from 'express';
import { vaultService } from '../services/vault.service';
import { engineService } from '../services/engine.service';
import { ListVaultsQuery, HistoricalNavQuery } from '../types/api.types';

export const vaultsHandler = {
    listVaults: async (
        req: Request<{}, {}, {}, ListVaultsQuery>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const data = await vaultService.listVaults(req.query);
            res.json({ data, message: 'Vaults retrieved', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    getVault: async (
        req: Request<{ address: string }, {}, {}, { userAddress?: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const data = await vaultService.getVault(req.params.address, req.query.userAddress);
            res.json({ data, message: 'Vault retrieved', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    getNAV: async (
        req: Request<{ address: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const data = await vaultService.getNAV(req.params.address);
            res.json({ data, message: 'NAV retrieved', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    getTVL: async (
        req: Request<{ address: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const data = await vaultService.getTVL(req.params.address);
            res.json({ data, message: 'TVL retrieved', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    getAPY: async (
        req: Request<{ address: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const data = await vaultService.getAPY(req.params.address);
            res.json({ data, message: 'APY retrieved', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    getDepositStatus: async (
        req: Request<{ address: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const data = await vaultService.getDepositStatus(req.params.address);
            res.json({ data, message: 'Deposit status retrieved', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    getWithdrawStatus: async (
        req: Request<{ address: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const data = await vaultService.getWithdrawStatus(req.params.address);
            res.json({ data, message: 'Withdraw status retrieved', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    getQueueWithdrawStatus: async (
        req: Request<{ address: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const data = await vaultService.getQueueWithdrawStatus(req.params.address);
            res.json({ data, message: 'Queue withdraw status retrieved', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    getVaultBalance: async (
        req: Request<{ address: string }>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const data = await engineService.getVaultBalance(req.params.address);
            res.json({ data, message: 'Vault balance retrieved', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },

    getHistoricalNav: async (
        req: Request<{ address: string }, {}, {}, HistoricalNavQuery>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const days = req.query.days ? parseInt(req.query.days, 10) : 30;
            const data = await engineService.getHistoricalNav(req.params.address, days);
            res.json({ data, message: 'Historical NAV retrieved', statusCode: 200 });
        } catch (err) {
            next(err);
        }
    },
};
