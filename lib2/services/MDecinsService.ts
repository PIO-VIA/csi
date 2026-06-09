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
     * Récupérer un médecin par ID
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getById(
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
    /**
     * Modifier un médecin par ID
     * @param id
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static modifier(
        id: number,
        requestBody: MedecinRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/medecins/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Supprimer un médecin par ID
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static supprimer(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/medecins/{id}',
            path: {
                'id': id,
            },
        });
    }
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
     * Réinitialiser le mot de passe d'un médecin (envoie un nouveau par email)
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static resetPassword(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/medecins/{id}/reset-password',
            path: {
                'id': id,
            },
        });
    }
}
