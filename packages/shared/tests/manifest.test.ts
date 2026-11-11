import { describe, expect, it } from 'vitest';
import { manifestSchema, type Manifest } from '../src/index.js';

function minimalManifest(): Manifest {
  return {
    manifestVersion: 1,
    hash: 'sha256:9f2cabc',
    server: { time: 1762700000000, protocol: 1, minPlayer: 1 },
    screen: {
      id: '01JCSCREEN0000000000000000',
      name: 'Entrada',
      rotation: 0,
      scaleMode: 'fit',
      timezone: 'Europe/Madrid',
      refreshAt: '04:00',
      muted: false,
    },
    layouts: [
      {
        id: '01JCLAYOUT0000000000000000',
        version: 7,
        json: {
          schemaVersion: 1,
          id: '01JCLAYOUT0000000000000000',
          name: 'Carta',
          canvas: {
            width: 1920,
            height: 1080,
            background: { type: 'color', value: '{theme.bg}' },
          },
          elements: [
            {
              id: 'el_hora',
              type: 'clock',
              name: 'Hora',
              frame: { x: 1540, y: 40, w: 320, h: 120, z: 10, rotation: 0, opacity: 1 },
              props: { format: 'HH:mm', showSeconds: false, align: 'right' },
              locked: false,
              hidden: false,
            },
          ],
        },
      },
    ],
    schedule: {
      horizonDays: 7,
      defaultLayoutId: '01JCLAYOUT0000000000000000',
      entries: [
        {
          id: '01JCENTRY0000000000000000',
          target: { kind: 'all' },
          layoutId: '01JCLAYOUT0000000000000000',
          priority: 0,
          startsAt: null,
          endsAt: null,
          days: [1, 2, 3, 4, 5],
          fromTime: '12:00',
          toTime: '16:00',
          enabled: true,
          createdAt: 1762600000000,
        },
      ],
      overrides: [],
    },
    media: [
      { id: '01JCMEDIA0000000000000000', url: '/media/ab12cd.mp4', kind: 'video', bytes: 8123456 },
    ],
    data: { menus: {}, variables: { menu_dia: 'Cocido' }, sources: {} },
  };
}

describe('manifestSchema', () => {
  it('acepta un manifiesto mínimo completo (§7.4)', () => {
    const parsed = manifestSchema.parse(minimalManifest());
    expect(parsed.manifestVersion).toBe(1);
    expect(parsed.screen.refreshAt).toBe('04:00');
  });

  it('rechaza rotaciones fuera de 0/90/180/270', () => {
    const bad = { ...minimalManifest(), screen: { ...minimalManifest().screen, rotation: 45 } };
    expect(manifestSchema.safeParse(bad).success).toBe(false);
  });

  it('rechaza horizontes fuera de 1..31 días', () => {
    const bad = minimalManifest();
    bad.schedule.horizonDays = 90;
    expect(manifestSchema.safeParse(bad).success).toBe(false);
  });

  it('requiere que los diseños del manifiesto sean válidos', () => {
    const bad = minimalManifest();
    bad.layouts[0]!.json = {
      schemaVersion: 1,
      id: 'x',
      name: 'roto',
      canvas: { width: 0, height: 0, background: { type: 'color', value: '#000' } },
      elements: [],
    };
    expect(manifestSchema.safeParse(bad).success).toBe(false);
  });
});
