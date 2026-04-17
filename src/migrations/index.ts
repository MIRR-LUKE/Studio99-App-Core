import * as migration_20260417_014547_init from './20260417_014547_init';
import * as migration_20260417_043029 from './20260417_043029';

export const migrations = [
  {
    up: migration_20260417_014547_init.up,
    down: migration_20260417_014547_init.down,
    name: '20260417_014547_init',
  },
  {
    up: migration_20260417_043029.up,
    down: migration_20260417_043029.down,
    name: '20260417_043029'
  },
];
