import pkg from '../package.json' with { type: 'json' };

export const version: string = pkg.version;
export const serviceName = 'cartelera';
