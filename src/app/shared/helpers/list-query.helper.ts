import { DestroyRef, WritableSignal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

export interface ListQueryParams {
  page: string | null;
  q: string | null;
}

export function toSearchQueryValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmedValue = value.trim();
  return trimmedValue.length ? trimmedValue : null;
}

export function toPageQueryValue(page: number): string | null {
  return page <= 1 ? null : String(page);
}

export function bindSearchControlToQuery<T extends ListQueryParams>(
  control: AbstractControl<string | null> | null,
  queryParams: WritableSignal<T>,
  destroyRef: DestroyRef,
  debounceMs = 500
): void {
  control?.valueChanges
    .pipe(
      map((value) => toSearchQueryValue(value)),
      debounceTime(debounceMs),
      distinctUntilChanged(),
      takeUntilDestroyed(destroyRef)
    )
    .subscribe((searchValue) => {
      queryParams.update((qp) => ({ ...qp, q: searchValue, page: null }));
    });
}
