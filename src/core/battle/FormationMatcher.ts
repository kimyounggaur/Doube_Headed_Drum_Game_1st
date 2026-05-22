import type { StrokeType } from '@core/rhythm/types';
import formationsData from '@data/formations.json';
import { FORMATION_WINDOW_SEC, type FormationId, type StrokeWithTime } from './types';

interface FormationDef {
  id: string;
  name: string;
  nameHanja: string;
  patternRelaxed: string[];
  effect: {
    type: string;
    description?: string;
    buffs: {
      attackSpeed?: number;
      defense?: number;
      speed?: number;
      survivability?: number;
      durationMs: number;
    };
  };
  historicalNote?: string;
}

interface SpecialDef {
  id: string;
  name: string;
  rhythm: string;
  patternRelaxed: string[];
  effect: { type: string; damage?: number; areaOfEffect?: number; description?: string };
}

const FORMATIONS: FormationDef[] = (formationsData as { formations: FormationDef[] }).formations;
const SPECIALS: SpecialDef[] = (formationsData as { specials: SpecialDef[] }).specials;

/** 진법 id 문자열을 enum FormationId로 변환 */
function toFormationId(id: string): FormationId | null {
  switch (id) {
    case 'crane':
      return 'Crane';
    case 'line':
      return 'Line';
    case 'snake':
      return 'Snake';
    case 'circle':
      return 'Circle';
    default:
      return null;
  }
}

export interface FormationMatch {
  kind: 'formation';
  formationId: FormationId;
  formationDef: FormationDef;
  /** 매칭에 사용된 노트 수 (UI에서 콤보 마커 제거용) */
  consumedNotes: number;
}

export interface SpecialMatch {
  kind: 'special';
  specialDef: SpecialDef;
  consumedNotes: number;
}

export type MatchResult = FormationMatch | SpecialMatch;

/**
 * 진법 콤보 매칭 엔진.
 *
 * 동작:
 *   - 4초 슬라이딩 윈도우의 stroke 시퀀스를 받아 패턴 매칭
 *   - 모든 콤보 노트가 Good 이상이어야 발동 (claude.md Phase 3)
 *   - 잘못된 타법(isCorrectStroke=false)은 윈도우에서 제외
 *   - 긴 패턴 우선 (특수기 > 진법, 동일 카테고리 내에서는 패턴 길이순)
 *   - REST는 패턴 안에서 '쉼' 의미 — 매칭 시 시간 간격으로 검증 (단순 구현은 무시)
 */
export class FormationMatcher {
  /** 윈도우 내 최근 입력. SignalSystem이 push, matcher가 prune. */
  private recentStrokes: StrokeWithTime[] = [];

  /** 새 입력 추가 + 윈도우 정리. */
  pushStroke(stroke: StrokeWithTime, currentTime: number): void {
    if (stroke.grade === 'Miss' || stroke.grade === 'Bad' || !stroke.isCorrectStroke) {
      // 콤보 끊김: 윈도우 전체 폐기 (진법은 모두 Good 이상이어야 함)
      this.recentStrokes = [];
      return;
    }
    this.recentStrokes.push(stroke);
    this.prune(currentTime);
  }

  /** 윈도우 밖 입력 제거 */
  private prune(currentTime: number): void {
    const cutoff = currentTime - FORMATION_WINDOW_SEC;
    this.recentStrokes = this.recentStrokes.filter((s) => s.time >= cutoff);
  }

  /** 현재 윈도우 내용으로 매칭 시도. 매칭 시 윈도우에서 해당 노트 소진. */
  tryMatch(): MatchResult | null {
    if (this.recentStrokes.length === 0) return null;
    const strokes: StrokeType[] = this.recentStrokes.map((s) => s.stroke);

    // 특수기를 진법보다 우선
    for (const sp of SPECIALS) {
      if (this.matchesTail(strokes, sp.patternRelaxed)) {
        const consumed = sp.patternRelaxed.filter((p) => p !== 'REST').length;
        this.consume(consumed);
        return { kind: 'special', specialDef: sp, consumedNotes: consumed };
      }
    }

    // 진법은 패턴 길이 내림차순으로 (긴 것 우선)
    const sortedFormations = [...FORMATIONS].sort(
      (a, b) => b.patternRelaxed.length - a.patternRelaxed.length,
    );
    for (const f of sortedFormations) {
      if (this.matchesTail(strokes, f.patternRelaxed)) {
        const fid = toFormationId(f.id);
        if (!fid) continue;
        const consumed = f.patternRelaxed.length;
        this.consume(consumed);
        return { kind: 'formation', formationId: fid, formationDef: f, consumedNotes: consumed };
      }
    }
    return null;
  }

  /** 입력 시퀀스의 *꼬리*가 패턴과 일치하는지 검사 (REST 무시) */
  private matchesTail(strokes: StrokeType[], pattern: string[]): boolean {
    const filteredPattern = pattern.filter((p) => p !== 'REST') as StrokeType[];
    if (strokes.length < filteredPattern.length) return false;
    const tail = strokes.slice(strokes.length - filteredPattern.length);
    return filteredPattern.every((p, i) => p === tail[i]);
  }

  private consume(count: number): void {
    this.recentStrokes = this.recentStrokes.slice(0, this.recentStrokes.length - count);
  }

  reset(): void {
    this.recentStrokes = [];
  }

  /** 디버깅·UI용 — 현재 윈도우 내용 미리보기 */
  peek(): StrokeWithTime[] {
    return [...this.recentStrokes];
  }
}
