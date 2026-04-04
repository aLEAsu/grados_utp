// Archivo qiue define las modalidades permitidas para los cursos

export const ALLOWED_MODALITIES = [
    'PRESENCIAL', 
    'SEMIPRESENCIAL', 
    'VIRTUAL', 
    'OTRA'] as const;

    export type ModalityCode = typeof ALLOWED_MODALITIES[number];