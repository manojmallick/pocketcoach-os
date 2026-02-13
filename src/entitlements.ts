import { requirePro, useProStatus } from '@/state/entitlements';

type ProState = { isPro: boolean };

export const selectIsPro = (state: ProState) => state.isPro;

export function useIsPro(): boolean {
  return useProStatus(selectIsPro);
}

export { requirePro, useProStatus };
