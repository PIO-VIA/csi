/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MedecinRequestDTO } from '../models/MedecinRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MDecinsService {
    /**
     * Lister tous les médecins
     * @returns any OK
     * @throws ApiError
     */
    public static getAll(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/medecins',
        });
    }
    /**
     * Enregistrer un nouveau médecin
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static enregistrer(
        requestBody: MedecinRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/medecins',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Récupérer un médecin par ID
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getById3(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/medecins/{id}',
            path: {
                'id': id,
            },
        });
    }
}
