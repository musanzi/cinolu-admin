import { HttpParams } from '@angular/common/http';

export type QueryParamValue = string | number | boolean | null | undefined;

export type QueryParams = Record<string, QueryParamValue | QueryParamValue[]>;

export function buildQueryParams(q: unknown): HttpParams | undefined {
  let params = new HttpParams();
  const queryParams = q as Record<string, unknown>;
  Object.keys(queryParams).forEach((key) => {
    const value = queryParams[key];
    if (value == null || value === '') return;
    if (Array.isArray(value)) {
      const values = value
        .map((item) => (item == null ? '' : String(item).trim()))
        .filter((item) => item.length > 0);
      if (!values.length) return;
      params = params.delete(key);
      values.forEach((item) => {
        params = params.append(key, item);
      });
      return;
    }
    params = params.set(key, String(value));
  });
  return params.keys().length ? params : undefined;
}
