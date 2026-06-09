/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssureRequestDTO } from '../models/AssureRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AssurSService {
    /**
     * Récupérer un assuré par ID
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getById1(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/assures/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Modifier un assuré
     * @param id
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static update(
        id: number,
        requestBody: AssureRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/assures/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Supprimer un assuré
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static delete(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/assures/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Lister tous les assurés
     * @returns any OK
     * @throws ApiError
     */
    public static getAll2(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/assures',
        });
    }
    /**
     * Inscrire un nouvel assuré
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static inscrire(
        requestBody: AssureRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/assures',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Choisir son médecin traitant
     * @param assureId
     * @param generalisteId
     * @returns any OK
     * @throws ApiError
     */
    public static choisirMedecin(
        assureId: number,
        generalisteId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/assures/{assureId}/choisir-medecin/{generalisteId}',
            path: {
                'assureId': assureId,
                'generalisteId': generalisteId,
            },
        });
    }
}
