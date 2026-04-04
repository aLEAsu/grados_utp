import { BadRequestException } from "@nestjs/common";
import { ALLOWED_MODALITIES, ModalityCode } from "shared/constants/modality.constants";

// Función para normalizar y validar el código de modalidad, 
// asegurando que se acepte en mayúsculas, 
// minúsculas o con espacios, y que se convierta a un formato estándar (mayúsculas con guiones bajos) antes de la validación.

export function normalizeAndValidateModalityCode(code: string): ModalityCode {
    const normalizedCode = code.toUpperCase().replace(/\s+/g, '_') as ModalityCode;


    if (!ALLOWED_MODALITIES.includes(normalizedCode)) {
        throw new BadRequestException(`Código de modalidad inválido: ${code}`);
    }
    return normalizedCode;
};