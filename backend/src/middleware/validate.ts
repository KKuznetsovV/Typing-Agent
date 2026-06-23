import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (
  schema: Joi.ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      res.status(400).json({ errors: error.details.map((d) => d.message) });
      return;
    }
    req[property] = value;
    next();
  };
};
