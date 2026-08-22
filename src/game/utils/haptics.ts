/**
 * Haptic Vibration Engine for Cyber-Deck Controls
 * Integrates with navigator.vibrate() with safe fallback checks and tactile waveforms.
 */

export type HapticType =
  | 'click'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'pulse'
  | 'double'
  | 'radar'
  | 'warning'
  | 'success'
  | 'overcharge';

class CyberHapticEngine {
  private enabled: boolean = true;

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public trigger(type: HapticType = 'click') {
    if (!this.enabled) return;
    if (typeof window === 'undefined' || !('navigator' in window) || !('vibrate' in navigator)) {
      return;
    }

    try {
      switch (type) {
        case 'click':
        case 'light':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(45);
          break;
        case 'pulse':
        case 'double':
          navigator.vibrate([15, 30, 15]);
          break;
        case 'radar':
          navigator.vibrate([12, 40, 20]);
          break;
        case 'warning':
          navigator.vibrate([40, 50, 40, 50, 80]);
          break;
        case 'success':
          navigator.vibrate([15, 25, 20, 25, 35]);
          break;
        case 'overcharge':
          navigator.vibrate([60, 40, 70, 40, 100]);
          break;
        default:
          navigator.vibrate(15);
      }
    } catch (e) {
      // Haptics not allowed or unsupported in current container context
    }
  }
}

export const haptics = new CyberHapticEngine();
