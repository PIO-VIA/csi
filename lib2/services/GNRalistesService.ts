/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GNRalistesService {
    /**
     * Lister tous les généralistes
     * @returns any OK
     * @throws ApiError
     */
    public static getAll4(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/generalistes',
        });
    }
    /**
     * Récupérer un généraliste par ID
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getById4(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/generalistes/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Lister les assurés d'un généraliste
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getAssuresByGeneraliste(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/generalistes/{id}/assures',
            path: {
                'id': id,
            },
        });
    }
}
