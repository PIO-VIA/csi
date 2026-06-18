/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentRequestDTO } from '../models/AgentRequestDTO';
import type { ChangePasswordRequestDTO } from '../models/ChangePasswordRequestDTO';
import type { LoginRequestDTO } from '../models/LoginRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthentificationService {
    /**
     * Inscription d'un nouvel agent de l'organisme
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static registerOrganisme(
        requestBody: AgentRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/register-organisme',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Connexion pour les médecins et l'organisme
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static login(
        requestBody: LoginRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Modifier son mot de passe (médecin connecté)
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static changePassword(
        requestBody: ChangePasswordRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/auth/change-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Récupérer le profil de l'utilisateur connecté
     * @returns any OK
     * @throws ApiError
     */
    public static me(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/me',
        });
    }
}
