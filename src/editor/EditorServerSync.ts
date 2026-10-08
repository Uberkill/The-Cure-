import { RoomLayoutData } from '../types';

export class EditorServerSync {
  public static async saveLayout(data: RoomLayoutData): Promise<boolean> {
    try {
      const response = await fetch('/api/save-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        console.log('[Dev Editor] Saved layout to server successfully.');
        return true;
      } else {
        console.error('[Dev Editor] Server responded with error:', await response.text());
        return false;
      }
    } catch (err) {
      console.warn('[Dev Editor] Failed to save to local dev server. Falling back to LocalStorage.', err);
      try {
        const current = localStorage.getItem('vault_editor_layout');
        let parsed = {};
        if (current) {
          parsed = JSON.parse(current);
        }
        const merged = { ...parsed, ...data };
        localStorage.setItem('vault_editor_layout', JSON.stringify(merged));
        return true;
      } catch (lsErr) {
        console.error('[Dev Editor] LocalStorage fallback failed.', lsErr);
        return false;
      }
    }
  }

  public static getFallbackLayout(): Partial<RoomLayoutData> {
    try {
      const stored = localStorage.getItem('vault_editor_layout');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error(err);
    }
    return {};
  }
}
