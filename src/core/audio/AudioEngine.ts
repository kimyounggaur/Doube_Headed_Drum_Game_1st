import * as Tone from 'tone';
import type { StrokeType } from '@core/rhythm/types';

/**
 * 장구 음색 합성 — Phase 7에서 실제 샘플로 교체.
 * 현 시점은 MembraneSynth + 필터로 6타법 음색을 모사한다.
 *
 * 음향 설계 (claude.md Phase 7 명세 따름):
 *   - 궁편(좌): ~80Hz 저음
 *   - 채편(우): ~400Hz 고음
 *   - 강타: 긴 sustain, 높은 velocity
 *   - 약타: 짧은 envelope, ghost note 느낌
 *   - 양손: 두 음을 동시에, 약간의 chorus
 */
interface StrokePatch {
  pitch: string;
  velocity: number;
  envelope: { attack: number; decay: number; sustain: number; release: number };
}

const STROKE_PATCHES: Record<StrokeType, StrokePatch> = {
  Gung: {
    pitch: 'C2',
    velocity: 1.0,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 },
  },
  Gu: {
    pitch: 'C2',
    velocity: 0.55,
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.15 },
  },
  Tta: {
    pitch: 'G3',
    velocity: 1.0,
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 },
  },
  Da: {
    pitch: 'G3',
    velocity: 0.5,
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
  },
  Dung: {
    pitch: 'C2',
    velocity: 1.0,
    envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.45 },
  },
  Deo: {
    pitch: 'C2',
    velocity: 0.5,
    envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.18 },
  },
};

export interface AudioEngineDiagnostics {
  sampleRate: number;
  baseLatencyMs: number;
  outputLatencyMs: number;
}

export class AudioEngine {
  private gungSynth: Tone.MembraneSynth | null = null;

  private chaeSynth: Tone.MembraneSynth | null = null;

  private metronomeSynth: Tone.MembraneSynth | null = null;

  private metronomeLoop: Tone.Loop | null = null;

  private started = false;

  /** 사용자 입력 지연 보정(ms). 양수 = 입력이 늦게 도착하므로 그만큼 빼서 보정. */
  private audioOffsetMs = 0;

  /** AudioContext 시작은 사용자 제스처 이후에만 가능. 첫 호출은 main UI에서 트리거. */
  async start(): Promise<void> {
    if (this.started) return;
    await Tone.start();
    this.initSynths();
    this.started = true;
    // 메인 출력에 약간의 마스터링 — 한지 질감의 따뜻한 잔향
    const masterReverb = new Tone.Reverb({ decay: 0.6, wet: 0.08 }).toDestination();
    this.gungSynth?.connect(masterReverb);
    this.chaeSynth?.connect(masterReverb);
  }

  private initSynths(): void {
    // 궁편(저음) — 가죽 진동의 무거운 어택
    this.gungSynth = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: STROKE_PATCHES.Gung.envelope,
    }).toDestination();
    this.gungSynth.volume.value = -6;

    // 채편(고음) — 가는 채로 가죽을 치는 날카로운 어택
    this.chaeSynth = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 2,
      oscillator: { type: 'triangle' },
      envelope: STROKE_PATCHES.Tta.envelope,
    }).toDestination();
    this.chaeSynth.volume.value = -8;

    // 메트로놈 — 디버그용 클릭
    this.metronomeSynth = new Tone.MembraneSynth({
      pitchDecay: 0.005,
      octaves: 1,
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
    }).toDestination();
    this.metronomeSynth.volume.value = -18;
  }

  /** 즉시 발음 (사용자 입력 등 외부 트리거). time 미지정 시 즉시. */
  playStroke(stroke: StrokeType, time?: number): void {
    if (!this.started) return;
    const patch = STROKE_PATCHES[stroke];
    const synth =
      stroke === 'Gung' || stroke === 'Gu' || stroke === 'Dung' || stroke === 'Deo'
        ? this.gungSynth
        : this.chaeSynth;
    synth?.triggerAttackRelease(patch.pitch, '8n', time ?? Tone.now(), patch.velocity);

    // 양손(덩/더)은 채편도 동시에
    if (stroke === 'Dung' || stroke === 'Deo') {
      const chaePatch = stroke === 'Dung' ? STROKE_PATCHES.Tta : STROKE_PATCHES.Da;
      this.chaeSynth?.triggerAttackRelease(
        chaePatch.pitch,
        '8n',
        time ?? Tone.now(),
        chaePatch.velocity * 0.9,
      );
    }
  }

  // ------ Transport / BPM ------

  setBpm(bpm: number): void {
    Tone.getTransport().bpm.value = bpm;
  }

  getBpm(): number {
    return Tone.getTransport().bpm.value;
  }

  /** 트랜스포트를 0초부터 시작. RhythmEngine은 이 시각 기준으로 노트를 스케줄링. */
  startTransport(): void {
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    Tone.getTransport().start();
  }

  stopTransport(): void {
    Tone.getTransport().stop();
  }

  pauseTransport(): void {
    Tone.getTransport().pause();
  }

  /** AudioContext 시간(초). 모든 노트 타이밍의 절대 기준. */
  getContextTime(): number {
    return Tone.getContext().currentTime;
  }

  /** Transport가 시작된 이후 경과 시간(초). 트랙 0초 시작점 기준. */
  getTransportSeconds(): number {
    return Tone.getTransport().seconds;
  }

  // ------ 메트로놈 ------

  enableMetronome(timeSignature: [number, number]): void {
    const [beatsPerBar] = timeSignature;
    let beatCount = 0;
    this.metronomeLoop?.dispose();
    this.metronomeLoop = new Tone.Loop((time) => {
      const isDownbeat = beatCount % beatsPerBar === 0;
      this.metronomeSynth?.triggerAttackRelease(isDownbeat ? 'C5' : 'C4', '32n', time);
      beatCount += 1;
    }, '4n').start(0);
  }

  disableMetronome(): void {
    this.metronomeLoop?.dispose();
    this.metronomeLoop = null;
  }

  // ------ 캘리브레이션 ------

  setAudioOffsetMs(ms: number): void {
    this.audioOffsetMs = ms;
  }

  getAudioOffsetMs(): number {
    return this.audioOffsetMs;
  }

  // ------ 진단 ------

  getDiagnostics(): AudioEngineDiagnostics {
    const ctx = Tone.getContext();
    const raw = ctx.rawContext as AudioContext;
    return {
      sampleRate: ctx.sampleRate,
      baseLatencyMs: (raw.baseLatency ?? 0) * 1000,
      outputLatencyMs: (raw.outputLatency ?? 0) * 1000,
    };
  }

  dispose(): void {
    this.metronomeLoop?.dispose();
    this.gungSynth?.dispose();
    this.chaeSynth?.dispose();
    this.metronomeSynth?.dispose();
    this.gungSynth = null;
    this.chaeSynth = null;
    this.metronomeSynth = null;
    this.started = false;
  }
}
