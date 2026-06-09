/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PrescriptionRequestDTO } from '../models/PrescriptionRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PrescriptionsService {
    /**
     * Prescrire un médicament
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static prescrireMedicament(
        requestBody: PrescriptionRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/prescriptions/medicament',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Prescrire une consultation chez un spécialiste
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static prescrireConsultation(
        requestBody: PrescriptionRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/prescriptions/consultation',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Lister toutes les prescriptions d'une consultation
     * @param consultationId
     * @returns any OK
     * @throws ApiError
     */
    public static getByConsultation(
        consultationId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/prescriptions/consultation/{consultationId}',
            path: {
                'consultationId': consultationId,
            },
        });
    }
}
