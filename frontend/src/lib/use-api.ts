"use client";

import useSWR, { type SWRConfiguration, mutate as globalMutate } from "swr";
import { api } from "./api-client";

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 2,
};

function swrFetcher<T>(url: string): Promise<T> {
  return api.get<T>(url);
}

export function useApiGet<T>(url: string | null, config?: SWRConfiguration) {
  return useSWR<T>(url, swrFetcher, { ...defaultConfig, ...config });
}

export function useApiList<T>(
  endpoint: string,
  params?: Record<string, string>,
  config?: SWRConfiguration,
) {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const key = `${endpoint}${query}`;
  return useSWR<T>(key, swrFetcher, { ...defaultConfig, ...config });
}

export function mutateAndRevalidate(key: string) {
  return globalMutate(key);
}

export function mutateMany(keys: string[]) {
  return Promise.all(keys.map((k) => globalMutate(k)));
}
