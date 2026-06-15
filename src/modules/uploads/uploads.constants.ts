import { join } from 'path';

export const UPLOAD_ROOT_DIR = join(process.cwd(), 'uploads');
export const UPLOAD_PRODUCTS_DIR = join(UPLOAD_ROOT_DIR, 'products');

export const UPLOAD_STATIC_PREFIX = '/uploads';
export const UPLOAD_PRODUCTS_URL_PREFIX = `${UPLOAD_STATIC_PREFIX}/products`;

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
