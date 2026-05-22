import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AudioEngine } from '@core/audio/AudioEngine';
import { RhythmEngine } from '@core/rhythm/RhythmEngine';
import { SignalSystem, type IssuedCommand } from '@core/battle/SignalSystem';
import {
  KEYBOARD_MAP,
  type JudgmentResult,
  type Note,
  type RhythmChart,
  type StrokeType,
} from '@core/rhythm/types';
import useBattleStore, { createAllyUnit, createEnemyUnit } from '@stores/battleStore';
import useSettingsStore from '@stores/settingsStore';
import useGameStore from '@stores/gameStore';
import useCharacterStore from '@stores/characterStore';
import { loadLevel } from '@core/level/LevelEngine';
import { calculateBattleExp } from '@core/progression/RankSystem';
import BattleStatusBar from '@ui/battle/BattleStatusBar';
import Battlefield from '@ui/battle/Battlefield';
import NoteLane from '@ui/battle/NoteLane';
import JudgmentPopup from '@ui/battle/JudgmentPopup';
import ComboCounter from '@ui/battle/ComboCounter';
import MoraleGauge from '@ui/battle/MoraleGauge';
import FormationAnnouncer from '@ui/battle/FormationAnnouncer';
import RhythmInterface from '@ui/battle/RhythmInterface';
import InstructorDialog from '@ui/battle/InstructorDialog';
import StrokeImpact from '@ui/battle/StrokeImpact';
import MoraleAura from '@ui/battle/MoraleAura';
import SingijeonLaunch from '@ui/battle/SingijeonLaunch';
import { BattleAmbience } from '@core/audio/BattleAmbience';
import hwimoriRaw from '@data/rhythms/hwimori.json';
import jajinmoriRaw from '@data/rhythms/jajinmori.json';
import byeoldalgeoriRaw from '@data/rhythms/byeoldalgeori.json';

const VISIBLE_WINDOW_SEC = 2.0;
const HIT_LINE_RATIO = 0.85;

function asChart(raw: unknown): RhythmChart {
  const r = raw as RhythmChart;
  return { ...r, timeSignature: [r.timeSignature[0], r.timeSignature[1]] };
}

const CHART_BY_RHYTHM: Record<string, RhythmChart> = {
  hwimori: asChart(hwimoriRaw),
  jajinmori: asChart(jajinmoriRaw),
  byeoldalgeori: asChart(byeoldalgeoriRaw),
};

/**
 * BattleScreen — Phase 4의 통합 컴포넌트.
 * RhythmEngine + AudioEngine + SignalSystem + battleStore를 모두 연결한다.
 */
function BattleScreen() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  const audioRef = useRef<AudioEngine | null>(null);
  const engineRef = useRef<RhythmEngine | null>(null);
  const signalRef = useRef<SignalSystem | null>(null);
  const ambienceRef = useRef<BattleAmbience | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());

  const { audioOffsetMs } = useSettingsStore();
  const { recordScore } = useGameStore();
  const battle = useBattleStore();

  const [started, setStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [visibleNotes, setVisibleNotes] = useState<Note[]>([]);
  const [lastJudgment, setLastJudgment] = useState<JudgmentResult | null>(null);
  const [judgmentTriggeredAt, setJudgmentTriggeredAt] = useState(0);
  const [instructorLine, setInstructorLine] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const level = useMemo(() => loadLevel(levelId ?? 'level_1_basic'), [levelId]);
  const chart = useMemo(() => {
    const rhythmKey = level.chartRhythm ?? 'hwimori';
    return CHART_BY_RHYTHM[rhythmKey] ?? CHART_BY_RHYTHM.hwimori!;
  }, [level]);

  // ----- 초기 부대 배치 -----
  useEffect(() => {
    const allies = level.allies.map((a) => createAllyUnit(a.type, a.position));
    const enemies = level.enemies.map((e) => createEnemyUnit(e.type, e.position, e.health));
    battle.setupBattle(allies, enemies);
    battle.updateMorale(70 - battle.morale); // morale 70으로 reset
    setInstructorLine(level.instructorLines.intro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  // ----- 판정 콜백 -----
  const handleJudgment = useCallback(
    (result: JudgmentResult) => {
      setLastJudgment(result);
      setJudgmentTriggeredAt(performance.now());

      if (result.grade === 'Miss' || result.grade === 'Bad') {
        battle.resetCombo();
        battle.updateMorale(-10);
        if (result.grade === 'Miss' && Math.random() < 0.3) {
          setInstructorLine(level.instructorLines.scold_miss);
        }
      } else if (result.isCorrectStroke) {
        battle.incrementCombo();
        const moraleGain = result.grade === 'Perfect' ? 3 : result.grade === 'Great' ? 2 : 1;
        battle.updateMorale(moraleGain);
        if (result.grade === 'Perfect' && battle.comboCount > 0 && battle.comboCount % 10 === 0) {
          setInstructorLine(level.instructorLines.praise_perfect);
        }
      }

      // SignalSystem에 전달
      const signal = signalRef.current;
      if (signal && engineRef.current) {
        signal.setAverageMorale(useBattleStore.getState().morale);
        const trackTime = engineRef.current.getCurrentTime();
        signal.processStrokeInput(result, trackTime);
      }
    },
    [battle, level.instructorLines],
  );

  // ----- 명령 콜백 (SignalSystem → battleStore) -----
  const handleCommand = useCallback((cmd: IssuedCommand) => {
    // Phase 7: 명령 종류별 환경 사운드
    ambienceRef.current?.playCommandEffect(cmd.command);
    // prep delay 후 실행 (0.5초)
    window.setTimeout(() => {
      if (cmd.match?.kind === 'formation') {
        const fid = cmd.match.formationId;
        const def = cmd.match.formationDef;
        const duration = (def.effect.buffs.durationMs as number) ?? 8000;
        useBattleStore.getState().applyFormationBuff(fid, duration);
        useBattleStore.getState().setFormationEvent({
          id: def.id,
          nameKorean: def.name,
          nameHanja: def.nameHanja,
          at: performance.now(),
        });
        // 1.2초 후 announcer 제거
        window.setTimeout(() => {
          useBattleStore.getState().setFormationEvent(null);
        }, 1200);
      } else if (cmd.match?.kind === 'special') {
        const def = cmd.match.specialDef;
        useBattleStore.getState().setFormationEvent({
          id: def.id,
          nameKorean: def.name,
          nameHanja: '神機箭',
          at: performance.now(),
        });
        useBattleStore.getState().applyCommand(cmd.command, cmd.intensity);
        window.setTimeout(() => {
          useBattleStore.getState().setFormationEvent(null);
        }, 1500);
      } else {
        useBattleStore.getState().applyCommand(cmd.command, cmd.intensity);
      }
    }, 500);
  }, []);

  // ----- 엔진 lazy 생성 + 시작 -----
  const startBattle = useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = new AudioEngine();
      await audioRef.current.start();
    }
    audioRef.current.setAudioOffsetMs(audioOffsetMs);
    if (!engineRef.current) engineRef.current = new RhythmEngine(audioRef.current);
    if (!signalRef.current) signalRef.current = new SignalSystem();
    if (!ambienceRef.current) {
      ambienceRef.current = new BattleAmbience();
      ambienceRef.current.start();
    }

    engineRef.current.loadChart(chart);
    engineRef.current.setJudgmentCallback(handleJudgment);
    signalRef.current.setCommandCallback(handleCommand);
    signalRef.current.reset();

    engineRef.current.start();
    setStarted(true);
    setFinished(false);
  }, [audioOffsetMs, chart, handleCommand, handleJudgment]);

  // ----- 입력 처리 -----
  const inputStroke = useCallback((stroke: StrokeType) => {
    audioRef.current?.playStroke(stroke);
    if (engineRef.current?.isRunning()) {
      engineRef.current.registerInput(stroke);
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space') {
        e.preventDefault();
        inputStroke(e.shiftKey ? 'Deo' : 'Dung');
        return;
      }
      const mapping = KEYBOARD_MAP[e.code];
      if (mapping) {
        e.preventDefault();
        inputStroke(mapping.stroke);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inputStroke]);

  // ----- 매 프레임 갱신 + 종료 감지 -----
  const tick = useCallback(() => {
    const engine = engineRef.current;
    const now = performance.now();
    const dt = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    if (engine?.isRunning()) {
      const t = engine.getCurrentTime();
      setCurrentTime(t);
      setVisibleNotes(engine.getActiveNotes(VISIBLE_WINDOW_SEC * 1000));
      useBattleStore.getState().expireBuffs(dt);

      // 종료 조건 체크
      const state = useBattleStore.getState();
      const aliveAllies = state.units.filter((u) => u.health > 0).length;
      const aliveEnemies = state.enemyUnits.filter((u) => u.health > 0).length;
      if ((aliveEnemies === 0 || aliveAllies === 0 || t > chart.duration + 1) && !finished) {
        engine.stop();
        setFinished(true);
        recordScore(state.maxCombo * 10, state.maxCombo);

        // Phase 6: EXP 적립 + 승진/칭호 처리
        const victory = aliveEnemies === 0;
        if (victory) {
          const exp = calculateBattleExp({
            accuracy: 80, // TODO: 실제 정확도로 교체 (RhythmEngine 진단 활용)
            maxCombo: state.maxCombo,
            clearTimeSec: t,
            minMorale: state.morale,
            baseReward: level.rewards.exp,
          });
          useCharacterStore.getState().addExp(exp);
          if (level.rewards.title) useCharacterStore.getState().awardTitle(level.rewards.title);
          if (state.maxCombo >= 100) useCharacterStore.getState().awardTitle('백련 콤보');
          if (state.morale >= 95) useCharacterStore.getState().awardTitle('사기의 화신');
        }

        setInstructorLine(
          victory ? level.instructorLines.victory : level.instructorLines.scold_miss,
        );
        // 결과 화면으로 이동 (2초 뒤)
        window.setTimeout(() => navigate('/result'), 2500);
      }
    }
    frameRef.current = requestAnimationFrame(tick);
  }, [chart.duration, finished, level.instructorLines, navigate, recordScore]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [tick]);

  // ----- 정리 -----
  useEffect(
    () => () => {
      engineRef.current?.dispose();
      audioRef.current?.dispose();
      ambienceRef.current?.dispose();
      engineRef.current = null;
      audioRef.current = null;
      signalRef.current = null;
      ambienceRef.current = null;
    },
    [],
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-ink text-hanji">
      {/* 상태바 */}
      <BattleStatusBar />

      {/* 전장 */}
      <div className="relative flex-1">
        <Battlefield />
        <MoraleAura />
        <SingijeonLaunch />
        <FormationAnnouncer />
        <InstructorDialog
          line={instructorLine}
          instructorName={level.instructorName}
          onDismiss={() => setInstructorLine(null)}
        />
      </div>

      {/* 사기 + 콤보 + 시작 버튼 */}
      <div className="flex items-center justify-between gap-3 border-y border-dancheong-yellow/30 bg-ink/80 px-3 py-1">
        <MoraleGauge />
        <ComboCounter />
        {!started && !finished && (
          <button
            type="button"
            onClick={startBattle}
            className="rounded bg-dancheong-red px-4 py-1 font-bold text-hanji hover:bg-dancheong-red/80"
          >
            전투 시작
          </button>
        )}
        {finished && <span className="text-sm font-bold text-dancheong-yellow">전투 종료</span>}
      </div>

      {/* 노트 영역 */}
      <div className="relative h-[28%] overflow-hidden border-b border-dancheong-yellow/40 bg-ink">
        {/* 레인 구분 */}
        <div className="absolute inset-0 grid grid-cols-3">
          <div className="border-r border-hanji/10 bg-dancheong-blue/20" />
          <div className="border-r border-hanji/10 bg-dancheong-yellow/10" />
          <div className="bg-dancheong-red/20" />
        </div>
        {/* Hit Line */}
        <div
          className="absolute left-0 right-0 z-10 h-1 bg-dancheong-yellow shadow-[0_0_12px_rgba(232,182,71,0.8)]"
          style={{ top: `${HIT_LINE_RATIO * 100}%` }}
        />
        <NoteLane
          notes={visibleNotes}
          currentTime={currentTime}
          visibleWindowSec={VISIBLE_WINDOW_SEC}
          hitLineRatio={HIT_LINE_RATIO}
        />
        <JudgmentPopup judgment={lastJudgment} triggeredAt={judgmentTriggeredAt} />
        <StrokeImpact judgment={lastJudgment} triggeredAt={judgmentTriggeredAt} />
      </div>

      {/* 인터페이스 */}
      <div className="h-[18%]">
        <RhythmInterface onStroke={inputStroke} />
      </div>
    </div>
  );
}

export default BattleScreen;
