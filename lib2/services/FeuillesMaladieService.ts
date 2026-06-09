/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeuillemMaladieRequestDTO } from '../models/FeuillemMaladieRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FeuillesMaladieService {
    /**
     * Lister toutes les feuilles de maladie
     * @returns any OK
     * @throws ApiError
     */
    public static getAll1(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/feuilles-maladie',
        });
    }
    /**
     * Enregistrer une feuille de maladie
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static enregistrer1(
        requestBody: FeuillemMaladieRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/feuilles-maladie',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Récupérer une feuille de maladie par ID
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getById5(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/feuilles-maladie/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Récupérer les feuilles de maladie d'un assuré
     * @param assureId
     * @returns any OK
     * @throws ApiError
     */
    public static getByAssure(
        assureId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/feuilles-maladie/assure/{assureId}',
            path: {
                'assureId': assureId,
            },
        });
    }
}
