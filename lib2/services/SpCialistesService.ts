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
    public static getAll4(): CancelablePromise<Record<string, any>> {
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
    public static getById4(
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
     * Lister les assurés attribués à un spécialiste par son ID
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getAssuresBySpecialiste(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/specialistes/{id}/assures',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Lister les assurés attribués au spécialiste connecté
     * @returns any OK
     * @throws ApiError
     */
    public static getMyAssures(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/specialistes/me/assures',
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
