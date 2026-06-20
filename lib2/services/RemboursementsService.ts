/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RemboursementsService {
    /**
     * Confirmer le remboursement d'une feuille (agent) : définit le mode de paiement et passe le statut à EFFECTUE
     * @param feuilleMaladieId
     * @param modePaiement
     * @returns any OK
     * @throws ApiError
     */
    public static confirmer(
        feuilleMaladieId: number,
        modePaiement: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/remboursements/{feuilleMaladieId}/confirmer',
            path: {
                'feuilleMaladieId': feuilleMaladieId,
            },
            query: {
                'modePaiement': modePaiement,
            },
        });
    }
    /**
     * Récupérer un remboursement par ID
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getById5(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/remboursements/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Montant total de tous les remboursements
     * @returns any OK
     * @throws ApiError
     */
    public static getTotal(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/remboursements/stats/total',
        });
    }
    /**
     * Lister les feuilles de maladie non remboursées
     * @returns any OK
     * @throws ApiError
     */
    public static getNonRembourses(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/remboursements/non-rembourses',
        });
    }
    /**
     * Lister les remboursements en attente de confirmation
     * @returns any OK
     * @throws ApiError
     */
    public static getEnAttente(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/remboursements/en-attente',
        });
    }
}
