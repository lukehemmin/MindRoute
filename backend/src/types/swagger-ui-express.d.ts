declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';
  
  export interface SwaggerOptions {
    explorer?: boolean;
    swaggerUrl?: string;
    swaggerUrls?: { url: string, name: string }[];
    customCss?: string;
    customJs?: string;
    customfavIcon?: string;
    swaggerOptions?: Record<string, any>;
    customSiteTitle?: string;
    [key: string]: any;
  }
  
  export function serve(path?: string): RequestHandler[];
  export function setup(spec: any, options?: SwaggerOptions, customCss?: string, customJs?: string, swaggerUrl?: string): RequestHandler;
  export function serveFiles(options?: any): RequestHandler;
  export function serveUiHtml(options?: any): RequestHandler;
  export function generateHTML(spec: any, options?: SwaggerOptions, customCss?: string, customJs?: string, swaggerUrl?: string): string;
} 