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
     * Récupérer une feuille de maladie par ID
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getById1(
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
     * Modifier une feuille de maladie
     * @param id
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static update(
        id: number,
        requestBody: FeuillemMaladieRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/feuilles-maladie/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Supprimer une feuille de maladie
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static delete(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/feuilles-maladie/{id}',
            path: {
                'id': id,
            },
        });
    }
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
     * Annuler une feuille de maladie (agent)
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static annuler(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/feuilles-maladie/{id}/annuler',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Lister les feuilles de maladie créées par le médecin connecté
     * @returns any OK
     * @throws ApiError
     */
    public static getMesFeuilles(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/feuilles-maladie/medecin/me',
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
