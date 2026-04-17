import * as migration_20260417_014547_init from './20260417_014547_init';

export const migrations = [
  {
    up: migration_20260417_014547_init.up,
    down: migration_20260417_014547_init.down,
    name: '20260417_014547_init'
  },
];
