import { describe, expect, it } from 'vitest';
import {
  parseHHMM,
  resolveSchedule,
  type ScheduleEntry,
  type ScheduleOverride,
} from '../src/index.js';

/**
 * Case table for spec §7.3.5: overlaps, midnight-crossing windows, day masks,
 * priorities, overrides, fallback. Local wall-clock time is expressed as
 * UTC-shaped epochs: 2026-11-09 is a Monday.
 */

const MON = Date.UTC(2026, 10, 9); // Monday 00:00 local
const MON_NOON = MON + 12 * 3600000; // Monday 12:00
const MON_2310 = MON + 23 * 3600000 + 10 * 60000; // Monday 23:10
const TUE_0130 = MON + 25 * 3600000 + 30 * 60000; // Tuesday 01:30
const SUN_NOON = Date.UTC(2026, 10, 15, 12); // Sunday 12:00
const HOUR = 3600000;

const SCREEN = 'screen-1';
const GROUP = 'group-entrada';
const OTHER = 'screen-2';

function entry(partial: Partial<ScheduleEntry> & { id: string; layoutId: string }): ScheduleEntry {
  return {
    target: { kind: 'all' },
    priority: 0,
    startsAt: null,
    endsAt: null,
    days: null,
    fromTime: null,
    toTime: null,
    enabled: true,
    createdAt: 1000,
    ...partial,
  };
}

function override(
  partial: Partial<ScheduleOverride> & {
    id: string;
    layoutId: string;
    startsAt: number;
    endsAt: number;
  },
): ScheduleOverride {
  return { target: { kind: 'all' }, createdAt: 1000, ...partial };
}

function resolve(
  input: Partial<Parameters<typeof resolveSchedule>[0]> & {
    entries: ScheduleEntry[];
    overrides: ScheduleOverride[];
  },
  ctx: { nowMs?: number; localMs: number },
) {
  return resolveSchedule(
    {
      screenId: SCREEN,
      groupId: GROUP,
      defaultLayoutId: 'layout-default',
      ...input,
    },
    { nowMs: ctx.nowMs ?? ctx.localMs, localMs: ctx.localMs },
  );
}

describe('parseHHMM', () => {
  it('acepta horas válidas y rechaza inválidas', () => {
    expect(parseHHMM('00:00')).toBe(0);
    expect(parseHHMM('23:59')).toBe(1439);
    expect(parseHHMM('12:30')).toBe(750);
    expect(parseHHMM('24:00')).toBeNull();
    expect(parseHHMM('9:30')).toBeNull();
    expect(parseHHMM('12:60')).toBeNull();
  });
});

describe('resolveSchedule — overrides', () => {
  it('un override activo gana a cualquier entrada programada', () => {
    const decision = resolve(
      {
        entries: [entry({ id: 'e1', layoutId: 'L-entry', fromTime: '00:00', toTime: '23:59' })],
        overrides: [
          override({ id: 'o1', layoutId: 'L-override', startsAt: MON, endsAt: MON + 24 * HOUR }),
        ],
      },
      { localMs: MON_NOON },
    );
    expect(decision).toEqual({ layoutId: 'L-override', reason: 'override', overrideId: 'o1' });
  });

  it('gana el override más específico: pantalla > grupo > todas', () => {
    const overrides = [
      override({
        id: 'o-all',
        layoutId: 'L-all',
        startsAt: 0,
        endsAt: MON + 24 * HOUR,
        createdAt: 100,
      }),
      override({
        id: 'o-group',
        layoutId: 'L-group',
        target: { kind: 'group', groupId: GROUP },
        startsAt: 0,
        endsAt: MON + 24 * HOUR,
        createdAt: 100,
      }),
      override({
        id: 'o-screen',
        layoutId: 'L-screen',
        target: { kind: 'screen', screenId: SCREEN },
        startsAt: 0,
        endsAt: MON + 24 * HOUR,
        createdAt: 100,
      }),
    ];
    expect(resolve({ entries: [], overrides }, { localMs: MON_NOON }).layoutId).toBe('L-screen');

    const withoutScreen = overrides.filter((o) => o.id !== 'o-screen');
    expect(resolve({ entries: [], overrides: withoutScreen }, { localMs: MON_NOON }).layoutId).toBe(
      'L-group',
    );

    const groupOnly = [overrides[0]!];
    expect(resolve({ entries: [], overrides: groupOnly }, { localMs: MON_NOON }).layoutId).toBe(
      'L-all',
    );
  });

  it('a igual especificidad gana el más reciente', () => {
    const decision = resolve(
      {
        entries: [],
        overrides: [
          override({
            id: 'o-viejo',
            layoutId: 'L-viejo',
            startsAt: 0,
            endsAt: MON + 24 * HOUR,
            createdAt: 100,
          }),
          override({
            id: 'o-nuevo',
            layoutId: 'L-nuevo',
            startsAt: 0,
            endsAt: MON + 24 * HOUR,
            createdAt: 200,
          }),
        ],
      },
      { localMs: MON_NOON },
    );
    expect(decision.layoutId).toBe('L-nuevo');
  });

  it('un override expirado se ignora (fin exclusivo)', () => {
    const decision = resolve(
      {
        entries: [],
        overrides: [
          override({ id: 'o1', layoutId: 'L-override', startsAt: MON, endsAt: MON_NOON }),
        ],
      },
      { localMs: MON_NOON },
    );
    expect(decision.reason).toBe('default');
  });
});

describe('resolveSchedule — entradas', () => {
  it('activa la entrada cuya ventana horaria incluye ahora', () => {
    const decision = resolve(
      {
        entries: [
          entry({ id: 'e1', layoutId: 'L-manana', fromTime: '06:00', toTime: '12:00' }),
          entry({ id: 'e2', layoutId: 'L-tarde', fromTime: '12:00', toTime: '16:00' }),
        ],
        overrides: [],
      },
      { localMs: MON + 12 * 3600000 + 5 * 60000 },
    );
    expect(decision).toEqual({ layoutId: 'L-tarde', reason: 'entry', entryId: 'e2' });
  });

  it('respeta la máscara de días (laborables vs domingo)', () => {
    const entries = [
      entry({
        id: 'e-lab',
        layoutId: 'L-laborable',
        days: [1, 2, 3, 4, 5],
        fromTime: '08:00',
        toTime: '20:00',
      }),
    ];
    expect(resolve({ entries, overrides: [] }, { localMs: MON_NOON }).layoutId).toBe('L-laborable');
    expect(resolve({ entries, overrides: [] }, { localMs: SUN_NOON }).reason).toBe('default');
  });

  it('ventana que cruza medianoche: tramo nocturno del mismo día', () => {
    const entries = [
      entry({ id: 'e-noche', layoutId: 'L-noche', days: [1], fromTime: '22:00', toTime: '02:00' }),
    ];
    // Lunes 23:10 → activa (lunes está en la máscara)
    expect(resolve({ entries, overrides: [] }, { localMs: MON_2310 }).layoutId).toBe('L-noche');
  });

  it('ventana que cruza medianoche: madrugada cuenta con el día anterior', () => {
    const entries = [
      entry({ id: 'e-noche', layoutId: 'L-noche', days: [1], fromTime: '22:00', toTime: '02:00' }),
    ];
    // Martes 01:30 → activa porque la noche empezó el lunes
    expect(resolve({ entries, overrides: [] }, { localMs: TUE_0130 }).layoutId).toBe('L-noche');

    // Con máscara solo martes, la madrugada del martes NO entra (la noche es del lunes)
    const entriesTue = [
      entry({
        id: 'e-noche2',
        layoutId: 'L-noche2',
        days: [2],
        fromTime: '22:00',
        toTime: '02:00',
      }),
    ];
    expect(resolve({ entries: entriesTue, overrides: [] }, { localMs: TUE_0130 }).reason).toBe(
      'default',
    );
  });

  it('ignora entradas deshabilitadas', () => {
    const decision = resolve(
      {
        entries: [
          entry({
            id: 'e1',
            layoutId: 'L-off',
            enabled: false,
            fromTime: '00:00',
            toTime: '23:59',
          }),
        ],
        overrides: [],
      },
      { localMs: MON_NOON },
    );
    expect(decision.reason).toBe('default');
  });

  it('respeta el rango de fechas: inicio inclusivo, fin exclusivo', () => {
    const entries = [
      entry({ id: 'e1', layoutId: 'L-rango', startsAt: MON_NOON, endsAt: MON_NOON + HOUR }),
    ];
    expect(resolve({ entries, overrides: [] }, { localMs: MON_NOON }).layoutId).toBe('L-rango');
    expect(resolve({ entries, overrides: [] }, { localMs: MON_NOON - 1 }).reason).toBe('default');
    expect(resolve({ entries, overrides: [] }, { localMs: MON_NOON + HOUR }).reason).toBe(
      'default',
    );
  });

  it('ordena por prioridad: mayor gana', () => {
    const decision = resolve(
      {
        entries: [
          entry({
            id: 'e-baja',
            layoutId: 'L-baja',
            priority: 1,
            fromTime: '00:00',
            toTime: '23:59',
          }),
          entry({
            id: 'e-alta',
            layoutId: 'L-alta',
            priority: 10,
            fromTime: '00:00',
            toTime: '23:59',
          }),
        ],
        overrides: [],
      },
      { localMs: MON_NOON },
    );
    expect(decision.layoutId).toBe('L-alta');
  });

  it('empate de prioridad: gana la ventana más estrecha', () => {
    const decision = resolve(
      {
        entries: [
          entry({
            id: 'e-ancha',
            layoutId: 'L-ancha',
            priority: 5,
            fromTime: '08:00',
            toTime: '20:00',
          }),
          entry({
            id: 'e-estrecha',
            layoutId: 'L-estrecha',
            priority: 5,
            fromTime: '11:00',
            toTime: '13:00',
          }),
        ],
        overrides: [],
      },
      { localMs: MON_NOON },
    );
    expect(decision.layoutId).toBe('L-estrecha');
  });

  it('doble empate: gana la creada más recientemente', () => {
    const decision = resolve(
      {
        entries: [
          entry({
            id: 'e-vieja',
            layoutId: 'L-vieja',
            priority: 5,
            fromTime: '11:00',
            toTime: '13:00',
            createdAt: 100,
          }),
          entry({
            id: 'e-nueva',
            layoutId: 'L-nueva',
            priority: 5,
            fromTime: '11:00',
            toTime: '13:00',
            createdAt: 200,
          }),
        ],
        overrides: [],
      },
      { localMs: MON_NOON },
    );
    expect(decision.layoutId).toBe('L-nueva');
  });

  it('aplica la entrada del grupo a pantallas del grupo y solo a ellas', () => {
    const entries = [
      entry({
        id: 'e-grupo',
        layoutId: 'L-grupo',
        target: { kind: 'group', groupId: GROUP },
        fromTime: '00:00',
        toTime: '23:59',
      }),
    ];
    const inGroup = resolveSchedule(
      { screenId: SCREEN, groupId: GROUP, defaultLayoutId: null, entries, overrides: [] },
      { nowMs: MON_NOON, localMs: MON_NOON },
    );
    expect(inGroup.layoutId).toBe('L-grupo');
    const other = resolveSchedule(
      { screenId: OTHER, groupId: 'group-otro', defaultLayoutId: null, entries, overrides: [] },
      { nowMs: MON_NOON, localMs: MON_NOON },
    );
    expect(other.reason).toBe('none');
  });

  it('entrada dirigida a otra pantalla no se aplica', () => {
    const entries = [
      entry({
        id: 'e-otra',
        layoutId: 'L-otra',
        target: { kind: 'screen', screenId: OTHER },
        fromTime: '00:00',
        toTime: '23:59',
      }),
    ];
    expect(resolve({ entries, overrides: [] }, { localMs: MON_NOON }).reason).toBe('default');
  });
});

describe('resolveSchedule — respuestas', () => {
  it('cae al diseño por defecto y luego a none (pantalla en espera)', () => {
    const withDefault = resolve({ entries: [], overrides: [] }, { localMs: MON_NOON });
    expect(withDefault).toEqual({ layoutId: 'layout-default', reason: 'default' });

    const withoutDefault = resolveSchedule(
      { screenId: SCREEN, groupId: null, defaultLayoutId: null, entries: [], overrides: [] },
      { nowMs: MON_NOON, localMs: MON_NOON },
    );
    expect(withoutDefault).toEqual({ layoutId: null, reason: 'none' });
  });

  it('es determinista: mismas entradas, mismo resultado', () => {
    const entries = [
      entry({ id: 'e1', layoutId: 'L1', priority: 5, fromTime: '08:00', toTime: '20:00' }),
      entry({
        id: 'e2',
        layoutId: 'L2',
        priority: 5,
        fromTime: '10:00',
        toTime: '14:00',
        createdAt: 500,
      }),
    ];
    const first = resolve({ entries, overrides: [] }, { localMs: MON_NOON });
    const second = resolve({ entries, overrides: [] }, { localMs: MON_NOON });
    expect(first).toEqual(second);
  });
});
