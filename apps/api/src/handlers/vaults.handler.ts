import { NextFunction, Request, Response } from 'express';
import { vaultService } from '../services/vault.service';
import { ListVaultsQuery } from '../types/api.types';

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
};
