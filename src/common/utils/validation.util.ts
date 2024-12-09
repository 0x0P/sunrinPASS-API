import { ValidatorOptions, validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export async function validateDto<T>(
  dto: new () => T,
  data: any,
  options: ValidatorOptions = {},
): Promise<T> {
  const object = plainToClass(dto, data);
  const errors = await validate(object as object, options);

  if (errors.length > 0) {
    throw new Error(
      errors
        .map((error) => Object.values(error.constraints || {}))
        .flat()
        .join(', '),
    );
  }

  return object;
}
