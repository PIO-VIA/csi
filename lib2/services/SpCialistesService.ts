/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SpCialistesService {
    /**
     * Lister tous les spécialistes
     * @returns any OK
     * @throws ApiError
     */
    public static getAll3(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/specialistes',
        });
    }
    /**
     * Récupérer un spécialiste par ID
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getById2(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/specialistes/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Filtrer les spécialistes par domaine
     * @param domaine
     * @returns any OK
     * @throws ApiError
     */
    public static getByDomaine(
        domaine: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/specialistes/domaine/{domaine}',
            path: {
                'domaine': domaine,
            },
        });
    }
}
