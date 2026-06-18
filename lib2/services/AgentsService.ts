/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentRequestDTO } from '../models/AgentRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AgentsService {
    /**
     * Récupérer un agent par ID
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getById3(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/agents/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Modifier un agent
     * @param id
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static update2(
        id: number,
        requestBody: AgentRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/agents/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Supprimer un agent
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static delete2(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/agents/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Lister tous les agents
     * @returns any OK
     * @throws ApiError
     */
    public static getAll3(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/agents',
        });
    }
    /**
     * Créer un nouvel agent de l'organisme
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static creer1(
        requestBody: AgentRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/agents',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Téléverser/mettre à jour la photo de profil d'un agent (optionnel)
     * @param id
     * @param formData
     * @returns any OK
     * @throws ApiError
     */
    public static uploadPhoto2(
        id: number,
        formData?: {
            photo: Blob;
        },
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/agents/{id}/photo',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}
