import type { AudioEngine } from '@core/audio/AudioEngine';
import {
  JUDGMENT_WINDOWS_MS,
  type JudgmentGrade,
  type JudgmentResult,
  type Note,
  type RhythmChart,
  type RhythmDiagnostics,
  type StrokeType,
} from './types';

/**
 * RhythmEngine — 게임의 심장.
 *
 * 설계 원칙 (claude.md Phase 2 명세):
 *   1. setInterval/RAF가 아닌 AudioContext.currentTime 기준 스케줄링
 *   2. Look-ahead: 25ms마다 다음 100ms 구간의 노트를 미리 트리거 큐에 넣음
 *   3. 판정: |delta| ≤ 25/50/100/150ms → Perfect/Great/Good/Bad, 그 외 Miss
 *   4. 입력 지연 보정: audioOffsetMs를 입력 시점에서 차감
 *   5. 진단: 입력 지연, 프레임 시간, 누락 노트 카운트
 */

const SCHEDULER_INTERVAL_MS = 25;
const SCHEDULER_LOOK_AHEAD_MS = 100;

interface NoteState {
  note: Note;
  /** 이미 판정되었거나(Miss 포함) 트리거된 노트는 true */
  resolved: boolean;
  /** 사운드 재생이 스케줄된 시각 (초). 중복 스케줄 방지용. */
  scheduledAt: number | null;
}

export type JudgmentCallback = (result: JudgmentResult) => void;
export type NoteHitCallback = (note: Note, time: number) => void;

export class RhythmEngine {
  private audio: AudioEngine;

  private chart: RhythmChart | null = null;

  private noteStates: NoteState[] = [];

  /** 트랙 시작 시점의 AudioContext 시간 (초). RhythmEngine.start() 호출 시 캡처. */
  private trackStartContextTime = 0;

  private running = false;

  private schedulerTimer: ReturnType<typeof setInterval> | null = null;

  private onJudgment: JudgmentCallback | null = null;

  private onNoteHit: NoteHitCallback | null = null;

  // 진단 누적
  private inputLatencyAccumulator = 0;

  private inputLatencyCount = 0;

  private frameTimeAccumulator = 0;

  private frameTimeCount = 0;

  private lastSchedulerTime = 0;

  private missedNoteCount = 0;

  constructor(audio: AudioEngine) {
    this.audio = audio;
  }

  loadChart(chart: RhythmChart): void {
    this.chart = chart;
    this.noteStates = chart.notes
      .slice()
      .sort((a, b) => a.time - b.time)
      .map((note) => ({ note, resolved: false, scheduledAt: null }));
    this.resetDiagnostics();
  }

  setJudgmentCallback(cb: JudgmentCallback | null): void {
    this.onJudgment = cb;
  }

  setNoteHitCallback(cb: NoteHitCallback | null): void {
    this.onNoteHit = cb;
  }

  start(): void {
    if (!this.chart) throw new Error('RhythmEngine: chart가 로드되지 않았습니다.');
    if (this.running) return;
    this.audio.setBpm(this.chart.bpm);
    this.audio.startTransport();
    this.trackStartContextTime = this.audio.getContextTime();
    this.running = true;
    this.lastSchedulerTime = performance.now();
    // 시작 즉시 한 번 스케줄 후 인터벌
    this.schedulerTick();
    this.schedulerTimer = setInterval(() => this.schedulerTick(), SCHEDULER_INTERVAL_MS);
  }

  stop(): void {
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.audio.stopTransport();
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  /** 트랙 시작부터의 경과 시간 (초). */
  getCurrentTime(): number {
    if (!this.running) return 0;
    return this.audio.getContextTime() - this.trackStartContextTime;
  }

  getCurrentBeat(): number {
    if (!this.chart) return 0;
    return this.getCurrentTime() * (this.chart.bpm / 60);
  }

  /** 앞으로 lookAheadMs 안에 도래할 미판정 노트. UI 렌더링용. */
  getUpcomingNotes(lookAheadMs: number): Note[] {
    const now = this.getCurrentTime();
    const horizon = now + lookAheadMs / 1000;
    return this.noteStates
      .filter((s) => !s.resolved && s.note.time >= now && s.note.time <= horizon)
      .map((s) => s.note);
  }

  /** 화면에 표시 중인 모든 노트 (지나갔지만 아직 판정 안 된 것도 포함). */
  getActiveNotes(visibleWindowMs: number): Note[] {
    const now = this.getCurrentTime();
    const horizon = now + visibleWindowMs / 1000;
    const past = now - JUDGMENT_WINDOWS_MS.Bad / 1000;
    return this.noteStates
      .filter((s) => !s.resolved && s.note.time >= past && s.note.time <= horizon)
      .map((s) => s.note);
  }

  /**
   * 플레이어 입력 등록. 가장 가까운 미판정 노트와 매칭하여 판정.
   * @param strokeType 사용자가 친 타법
   * @param inputContextTime 입력 시점의 AudioContext 시간 (초). 미지정 시 현재 시각.
   */
  registerInput(strokeType: StrokeType, inputContextTime?: number): JudgmentResult {
    const inputTime = inputContextTime ?? this.audio.getContextTime();
    // 트랙 기준 시간으로 변환 + 사용자 캘리브레이션 보정
    const offsetSec = this.audio.getAudioOffsetMs() / 1000;
    const trackTime = inputTime - this.trackStartContextTime - offsetSec;

    // 가장 가까운 미판정 노트 (Bad 윈도우 내) 찾기
    const window = JUDGMENT_WINDOWS_MS.Bad / 1000;
    let bestIdx = -1;
    let bestDelta = Infinity;
    for (let i = 0; i < this.noteStates.length; i += 1) {
      const s = this.noteStates[i];
      if (!s || s.resolved) continue;
      const delta = trackTime - s.note.time;
      if (delta < -window) break; // 노트는 시간순 정렬, 이 이후는 더 멀어짐
      if (Math.abs(delta) > window) continue;
      if (Math.abs(delta) < Math.abs(bestDelta)) {
        bestDelta = delta;
        bestIdx = i;
      }
    }

    let result: JudgmentResult;
    if (bestIdx === -1) {
      // 윈도우 안에 매칭되는 노트 없음 — 헛침
      result = { grade: 'Miss', delta: 0, note: null, isCorrectStroke: false };
    } else {
      const matched = this.noteStates[bestIdx];
      if (!matched) throw new Error('RhythmEngine: noteStates index out of bounds');
      const deltaMs = bestDelta * 1000;
      const grade = this.classifyDelta(Math.abs(deltaMs));
      const isCorrectStroke = matched.note.stroke === strokeType;
      result = {
        grade: isCorrectStroke ? grade : 'Bad',
        delta: deltaMs,
        note: matched.note,
        isCorrectStroke,
      };
      // 잘못된 타법이어도 노트는 소진 (그렇지 않으면 계속 재시도 가능 — 게임 디자인적 선택)
      matched.resolved = true;
    }

    // 입력 지연 진단: 가장 가까운 노트와의 절대 오차를 평균에 누적
    if (bestIdx !== -1) {
      this.inputLatencyAccumulator += Math.abs(bestDelta * 1000);
      this.inputLatencyCount += 1;
    }

    this.onJudgment?.(result);
    return result;
  }

  private classifyDelta(absMs: number): JudgmentGrade {
    if (absMs <= JUDGMENT_WINDOWS_MS.Perfect) return 'Perfect';
    if (absMs <= JUDGMENT_WINDOWS_MS.Great) return 'Great';
    if (absMs <= JUDGMENT_WINDOWS_MS.Good) return 'Good';
    if (absMs <= JUDGMENT_WINDOWS_MS.Bad) return 'Bad';
    return 'Miss';
  }

  /** 25ms마다 호출. 다음 100ms 안의 노트 발음을 미리 스케줄 + 시간 지난 노트 Miss 처리. */
  private schedulerTick(): void {
    const perfNow = performance.now();
    const dt = perfNow - this.lastSchedulerTime;
    if (this.lastSchedulerTime !== 0) {
      this.frameTimeAccumulator += dt;
      this.frameTimeCount += 1;
    }
    this.lastSchedulerTime = perfNow;

    const ctxNow = this.audio.getContextTime();
    const trackNow = ctxNow - this.trackStartContextTime;
    const horizonTrack = trackNow + SCHEDULER_LOOK_AHEAD_MS / 1000;
    const missThreshold = JUDGMENT_WINDOWS_MS.Bad / 1000;

    for (const state of this.noteStates) {
      if (state.resolved) continue;

      // 1) 발음 스케줄 (룩어헤드 윈도우 안에 들어오면)
      if (state.scheduledAt === null && state.note.time <= horizonTrack) {
        const absoluteCtxTime = this.trackStartContextTime + state.note.time;
        if (!state.note.isGhost) {
          this.audio.playStroke(state.note.stroke, absoluteCtxTime);
        }
        state.scheduledAt = absoluteCtxTime;
        this.onNoteHit?.(state.note, absoluteCtxTime);
      }

      // 2) 자동 Miss 처리 (노트가 Bad 윈도우를 지나가도록 입력이 없으면)
      if (trackNow - state.note.time > missThreshold) {
        state.resolved = true;
        this.missedNoteCount += 1;
        this.onJudgment?.({
          grade: 'Miss',
          delta: (trackNow - state.note.time) * 1000,
          note: state.note,
          isCorrectStroke: false,
        });
      }
    }

    // 모든 노트 소진 시 자동 정지
    if (this.chart && trackNow > this.chart.duration + 1 && this.running) {
      this.stop();
    }
  }

  // ------ 진단 ------

  getDiagnostics(): RhythmDiagnostics {
    const audioDiag = this.audio.getDiagnostics();
    return {
      audioSampleRate: audioDiag.sampleRate,
      averageInputLatencyMs:
        this.inputLatencyCount > 0 ? this.inputLatencyAccumulator / this.inputLatencyCount : 0,
      averageFrameTimeMs:
        this.frameTimeCount > 0 ? this.frameTimeAccumulator / this.frameTimeCount : 0,
      missedNoteCount: this.missedNoteCount,
    };
  }

  private resetDiagnostics(): void {
    this.inputLatencyAccumulator = 0;
    this.inputLatencyCount = 0;
    this.frameTimeAccumulator = 0;
    this.frameTimeCount = 0;
    this.missedNoteCount = 0;
  }

  dispose(): void {
    this.stop();
    this.chart = null;
    this.noteStates = [];
    this.onJudgment = null;
    this.onNoteHit = null;
  }
}
