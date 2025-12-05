/**
 * Sistema de validación multi-capa (Cliente, API, DB)
 * Asegura que los datos sean validados en todos los niveles
 */

import { z } from 'zod';

/**
 * Tipos de validación
 */
export enum ValidationLayer {
  CLIENT = 'client',
  API = 'api',
  DATABASE = 'database',
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  layer: ValidationLayer;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validador multi-capa
 */
export class MultiLayerValidator<T> {
  private schema: z.ZodSchema<T>;
  private layer: ValidationLayer;

  constructor(schema: z.ZodSchema<T>, layer: ValidationLayer) {
    this.schema = schema;
    this.layer = layer;
  }

  /**
   * Valida los datos
   */
  validate(data: unknown): ValidationResult {
    try {
      this.schema.parse(data);
      return {
        valid: true,
        errors: [],
        layer: this.layer,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return {
          valid: false,
          errors,
          layer: this.layer,
        };
      }

      return {
        valid: false,
        errors: [{
          field: 'unknown',
          message: 'Validation failed',
          code: 'UNKNOWN_ERROR',
        }],
        layer: this.layer,
      };
    }
  }

  /**
   * Valida y retorna los datos parseados o lanza error
   */
  validateOrThrow(data: unknown): T {
    const result = this.validate(data);

    if (!result.valid) {
      throw new ValidationException(result.errors, this.layer);
    }

    return this.schema.parse(data);
  }
}

/**
 * Excepción de validación personalizada
 */
export class ValidationException extends Error {
  public errors: ValidationError[];
  public layer: ValidationLayer;

  constructor(errors: ValidationError[], layer: ValidationLayer) {
    super(`Validation failed at ${layer} layer`);
    this.name = 'ValidationException';
    this.errors = errors;
    this.layer = layer;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors,
      layer: this.layer,
    };
  }
}

/**
 * Middleware de validación para Next.js API routes
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  layer: ValidationLayer = ValidationLayer.API
) {
  return async (data: unknown): Promise<T> => {
    const validator = new MultiLayerValidator(schema, layer);
    return validator.validateOrThrow(data);
  };
}

/**
 * Hook de validación para cliente
 */
export function useClientValidation<T>(schema: z.ZodSchema<T>) {
  const validator = new MultiLayerValidator(schema, ValidationLayer.CLIENT);

  return {
    validate: (data: unknown) => validator.validate(data),
    validateOrThrow: (data: unknown) => validator.validateOrThrow(data),
  };
}

/**
 * Validación a nivel de base de datos (antes de Prisma)
 */
export function validateBeforeDB<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const validator = new MultiLayerValidator(schema, ValidationLayer.DATABASE);
  return validator.validateOrThrow(data);
}
