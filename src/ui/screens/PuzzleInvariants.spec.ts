import { describe, it, expect } from 'vitest';

describe('Puzzle Mathematical Models & Invariants', () => {
  describe('Hydraulic Manifold Conservation Laws', () => {
    interface ManifoldState {
      basins: [number, number, number];
      capacity: number;
    }

    const transfer = (state: ManifoldState, from: 0 | 1 | 2, to: 0 | 1 | 2): boolean => {
      if (state.basins[from] <= 0) return false;
      if (state.basins[to] >= state.capacity) return false;
      state.basins[from] -= 1;
      state.basins[to] += 1;
      return true;
    };

    const calcDifferentialPsi = (basins: [number, number, number]): number => {
      const max = Math.max(...basins);
      const min = Math.min(...basins);
      return (max - min) * 15.0;
    };

    it('should strictly conserve total fluid volume across arbitrary valve cycles', () => {
      const state: ManifoldState = { basins: [4, 2, 0], capacity: 4 };
      const initialTotal = state.basins.reduce((a, b) => a + b, 0);
      expect(initialTotal).toBe(6);

      // Perform sequence of valid transfers: 1->2, 2->3, 3->1
      transfer(state, 0, 1); // [3, 3, 0]
      transfer(state, 1, 2); // [3, 2, 1]
      transfer(state, 0, 2); // [2, 2, 2]

      const postTotal = state.basins.reduce((a, b) => a + b, 0);
      expect(postTotal).toBe(6);
      expect(calcDifferentialPsi(state.basins)).toBe(0.0);
    });

    it('should reject transfers from empty basins or into full basins', () => {
      const state: ManifoldState = { basins: [4, 2, 0], capacity: 4 };

      // Basin 2 is empty (0 units); transferring 2 -> 0 must fail
      const fromEmpty = transfer(state, 2, 0);
      expect(fromEmpty).toBe(false);

      // Basin 0 is full (4 units); transferring 1 -> 0 must fail
      const intoFull = transfer(state, 1, 0);
      expect(intoFull).toBe(false);

      expect(state.basins).toEqual([4, 2, 0]);
    });
  });

  describe('Galvanometer Grid Resistance Matrix', () => {
    const isChannelBalanced = (resistance: number, target: number = 100): boolean => {
      return Math.abs(resistance - target) <= 2;
    };

    const isGridBalanced = (channels: number[]): boolean => {
      return channels.length === 5 && channels.every(r => isChannelBalanced(r, 100));
    };

    const calcMeterDeflectionDeg = (resistance: number): number => {
      const normalized = Math.max(0, Math.min(200, resistance)) / 200;
      return -45 + normalized * 90;
    };

    it('should trip breaker when channel resistance reaches or exceeds 200 Ohms', () => {
      const isOverloaded = (r: number): boolean => r >= 200;
      expect(isOverloaded(198)).toBe(false);
      expect(isOverloaded(200)).toBe(true);
      expect(isOverloaded(205)).toBe(true);
    });

    it('should calculate symmetric needle deflection degrees', () => {
      expect(calcMeterDeflectionDeg(0)).toBe(-45);
      expect(calcMeterDeflectionDeg(100)).toBe(0);
      expect(calcMeterDeflectionDeg(200)).toBe(45);
    });

    it('should validate grid balance only when all 5 channels achieve 100 Ohms', () => {
      expect(isGridBalanced([100, 100, 100, 100, 100])).toBe(true);
      expect(isGridBalanced([101, 99, 100, 102, 98])).toBe(true);
      expect(isGridBalanced([100, 100, 100, 100, 110])).toBe(false);
    });
  });

  describe('Carriage Clock Escapement & Dial Buffer', () => {
    const stepHour = (current: number, delta: number): number => {
      let next = current + delta;
      while (next > 12) next -= 12;
      while (next < 1) next += 12;
      return next;
    };

    const stepMinute = (current: number, delta: number): number => {
      let next = (current + delta) % 60;
      if (next < 0) next += 60;
      return next;
    };

    const pushDialBuffer = (buffer: string, digit: string, maxLen: number = 8): string => {
      const updated = buffer + digit;
      return updated.length > maxLen ? updated.slice(updated.length - maxLen) : updated;
    };

    it('should independently wrap clock escapement hours between 1 and 12', () => {
      expect(stepHour(12, 1)).toBe(1);
      expect(stepHour(1, -1)).toBe(12);
      expect(stepHour(11, 2)).toBe(1);
    });

    it('should independently wrap clock escapement minutes between 0 and 59', () => {
      expect(stepMinute(59, 1)).toBe(0);
      expect(stepMinute(0, -1)).toBe(59);
      expect(stepMinute(3, -5)).toBe(58);
    });

    it('should maintain fixed-size sliding-window dial buffer', () => {
      let buf = '';
      const digits = ['1', '9', '6', '4', '1', '1', '0', '3', '9'];
      for (const d of digits) {
        buf = pushDialBuffer(buf, d, 8);
      }
      expect(buf.length).toBe(8);
      expect(buf).toBe('96411039');
    });
  });
});
