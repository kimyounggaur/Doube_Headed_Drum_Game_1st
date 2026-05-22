import * as Tone from 'tone';
import type { CommandType } from '@core/battle/types';

/**
 * 전장 환경 사운드 — 명령 종류별 효과음을 Tone.js로 합성.
 * 실제 샘플 음원은 Phase 8 후속 작업에서 교체.
 */
export class BattleAmbience {
  private noiseSynth: Tone.NoiseSynth | null = null; // 함성·바람

  private metalSynth: Tone.MetalSynth | null = null; // 화살·금속

  private cannonSynth: Tone.MembraneSynth | null = null; // 화포·신기전

  private started = false;

  start(): void {
    if (this.started) return;
    this.noiseSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.05, decay: 0.4, sustain: 0, release: 0.2 },
    }).toDestination();
    this.noiseSynth.volume.value = -22;

    this.metalSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.2, release: 0.1 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).toDestination();
    this.metalSynth.volume.value = -25;

    this.cannonSynth = new Tone.MembraneSynth({
      pitchDecay: 0.2,
      octaves: 8,
      envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.6 },
    }).toDestination();
    this.cannonSynth.volume.value = -10;

    this.started = true;
  }

  /** 명령 종류에 따라 적절한 효과음 발음. 사용자 입력 직후 호출. */
  playCommandEffect(command: CommandType): void {
    if (!this.started) this.start();
    const now = Tone.now();
    switch (command) {
      case 'VolleyFire':
        // 화살 일제사격: 메탈 신스 짧은 5연속
        for (let i = 0; i < 5; i += 1) {
          this.metalSynth?.triggerAttackRelease('8n', now + i * 0.03);
        }
        break;
      case 'AllOutAttack':
        // 전군 총공격: 함성 + 큰 북
        this.noiseSynth?.triggerAttackRelease('4n', now);
        this.cannonSynth?.triggerAttackRelease('A1', '8n', now, 0.7);
        break;
      case 'Special_Singijeon':
        // 신기전: 화포 발사음 16발
        for (let i = 0; i < 6; i += 1) {
          this.cannonSynth?.triggerAttackRelease('D2', '4n', now + i * 0.08, 1.0);
        }
        break;
      case 'AdvanceShieldWall':
        // 보병 전진: 짧은 함성
        this.noiseSynth?.triggerAttackRelease('16n', now);
        break;
      case 'Retreat':
        // 후퇴: 낮은 함성
        this.noiseSynth?.triggerAttackRelease('8n', now);
        break;
      default:
        break;
    }
  }

  /** 사기 단계에 따른 BGM 레이어 강도 변경 (Phase 7 AdaptiveMusicEngine 단순 버전) */
  setIntensity(_morale: number, _combo: number): void {
    // TODO: 실제 4레이어 BGM은 음원 확보 후 구현. 현재는 효과음만 동작.
  }

  dispose(): void {
    this.noiseSynth?.dispose();
    this.metalSynth?.dispose();
    this.cannonSynth?.dispose();
    this.noiseSynth = null;
    this.metalSynth = null;
    this.cannonSynth = null;
    this.started = false;
  }
}
