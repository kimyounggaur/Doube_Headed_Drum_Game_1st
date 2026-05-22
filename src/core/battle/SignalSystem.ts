import type { JudgmentResult } from '@core/rhythm/types';
import { FormationMatcher, type MatchResult } from './FormationMatcher';
import {
  COMMAND_PREP_MS,
  GRADE_TO_INTENSITY,
  STROKE_TO_COMMAND,
  type CommandType,
  type StrokeWithTime,
} from './types';

export interface IssuedCommand {
  command: CommandType;
  intensity: number;
  /** 명령이 실제로 효과를 발휘하기 시작하는 시각 (트랙 시간, 초) */
  executeAt: number;
  /** 진법/특수기에서 비롯되었으면 매치 결과 포함 */
  match?: MatchResult;
}

export type CommandIssuedCallback = (cmd: IssuedCommand) => void;

/**
 * SignalSystem — 리듬 입력을 전술 명령으로 변환하는 게임 문법의 구현부.
 *
 * 동작 흐름 (claude.md Phase 3):
 *   1. RhythmEngine이 JudgmentResult를 콜백으로 전달
 *   2. processStrokeInput()이 즉시 명령(Single Stroke)을 발동
 *   3. FormationMatcher가 4박 윈도우에서 진법/특수기 매칭 시도
 *   4. 매칭 성공 시 별도 Formation_XXX 명령을 추가 발동
 *   5. issueCommand()는 0.5초 prep delay 후 효과 발동 시점을 반환
 *
 * 사기는 외부(battleStore)에서 관리하고, SignalSystem은 average morale만 받아 modifier 계산.
 */
export class SignalSystem {
  private matcher = new FormationMatcher();

  private onCommand: CommandIssuedCallback | null = null;

  /** 외부에서 주입하는 현재 평균 사기 (0~100). modifier 계산용. */
  private averageMorale = 70;

  setCommandCallback(cb: CommandIssuedCallback | null): void {
    this.onCommand = cb;
  }

  setAverageMorale(morale: number): void {
    this.averageMorale = Math.max(0, Math.min(100, morale));
  }

  /**
   * RhythmEngine 콜백에서 호출. 판정 결과를 명령으로 변환.
   * @returns 단일 명령 + (성립한 경우) 진법 명령
   */
  processStrokeInput(judgment: JudgmentResult, currentTime: number): IssuedCommand[] {
    const issued: IssuedCommand[] = [];

    // 잘못된 타법 / Miss는 명령 발동 안 함
    if (!judgment.note || !judgment.isCorrectStroke || judgment.grade === 'Miss') {
      // 단, 매칭 윈도우는 비워야 진법이 깨짐
      this.matcher.pushStroke(
        {
          stroke: judgment.note?.stroke ?? 'Gung',
          time: currentTime,
          grade: judgment.grade,
          isCorrectStroke: judgment.isCorrectStroke,
        },
        currentTime,
      );
      return issued;
    }

    const intensity = GRADE_TO_INTENSITY[judgment.grade];

    // 1) 즉시 단일 명령
    const command = STROKE_TO_COMMAND[judgment.note.stroke];
    const singleCmd: IssuedCommand = {
      command,
      intensity: intensity * this.getMoraleModifier(),
      executeAt: currentTime + COMMAND_PREP_MS / 1000,
    };
    this.issueCommand(singleCmd);
    issued.push(singleCmd);

    // 2) 진법/특수기 매칭 시도
    this.matcher.pushStroke(
      {
        stroke: judgment.note.stroke,
        time: currentTime,
        grade: judgment.grade,
        isCorrectStroke: true,
      },
      currentTime,
    );
    const match = this.matcher.tryMatch();
    if (match) {
      const fcmd: IssuedCommand = {
        command:
          match.kind === 'special'
            ? 'Special_Singijeon'
            : (`Formation_${match.formationId}` as CommandType),
        intensity: intensity * this.getMoraleModifier(),
        executeAt: currentTime + COMMAND_PREP_MS / 1000,
        match,
      };
      this.issueCommand(fcmd);
      issued.push(fcmd);
    }

    return issued;
  }

  /** 외부에서 직접 명령을 발동 (디버그/스크립트용) */
  issueCommand(cmd: IssuedCommand): void {
    this.onCommand?.(cmd);
  }

  /**
   * 사기 → 능력치 배율 변환.
   * 0% = 0.5x, 70% = 1.0x, 100% = 1.5x (선형 보간)
   */
  getMoraleModifier(): number {
    const m = this.averageMorale;
    if (m >= 70) {
      return 1.0 + ((m - 70) / 30) * 0.5; // 70~100 → 1.0~1.5
    }
    return 0.5 + (m / 70) * 0.5; // 0~70 → 0.5~1.0
  }

  reset(): void {
    this.matcher.reset();
  }

  /** UI 디버깅용 */
  peekRecentStrokes(): StrokeWithTime[] {
    return this.matcher.peek();
  }
}
