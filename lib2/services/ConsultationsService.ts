/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConsultationRequestDTO } from '../models/ConsultationRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConsultationsService {
    /**
     * Créer une consultation
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static creer(
        requestBody: ConsultationRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/consultations',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Récupérer les détails d'une consultation
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getById7(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/consultations/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Lister les consultations par généraliste — Réservé aux médecins généralistes (médecin traitant). Renvoie 400 si l'ID fourni correspond à un spécialiste.
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getByGeneraliste(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/consultations/generaliste/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Lister les consultations par assuré
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getByAssure1(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/consultations/assure/{id}',
            path: {
                'id': id,
            },
        });
    }
}
