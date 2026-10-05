import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { MAX_PLAYER_HP } from "../game/battleState";
import { RESET_HOLD_DURATION_MS } from "../hooks/useRunKeyboardControls";

type MapTopbarProps = {
  runPlayerHp: number;
  maxPlayerHp: number;
  gold: number;
  deckCardCount: number;
  mapTraveling: boolean;
  canEditDeck: boolean;
  onGoldDebugClick: () => void;
  onOpenDeckViewer: () => void;
  onWait: () => void;
  onEditDeck: () => void;
  onRestart: () => void;
};

export function MapTopbar({
  runPlayerHp,
  maxPlayerHp,
  gold,
  deckCardCount,
  mapTraveling,
  canEditDeck,
  onGoldDebugClick,
  onOpenDeckViewer,
  onWait,
  onEditDeck,
  onRestart,
}: MapTopbarProps) {
  const [restartHoldProgress, setRestartHoldProgress] = useState(0);
  const restartHoldStartedAtRef = useRef<number | null>(null);
  const restartHoldTimerRef = useRef<number | null>(null);

  const stopRestartHold = () => {
    restartHoldStartedAtRef.current = null;
    if (restartHoldTimerRef.current !== null) window.clearInterval(restartHoldTimerRef.current);
    restartHoldTimerRef.current = null;
    setRestartHoldProgress(0);
  };

  const startRestartHold = () => {
    if (restartHoldTimerRef.current !== null) return;
    restartHoldStartedAtRef.current = performance.now();
    restartHoldTimerRef.current = window.setInterval(() => {
      const startedAt = restartHoldStartedAtRef.current;
      if (startedAt === null) return;
      const progress = Math.min(1, (performance.now() - startedAt) / RESET_HOLD_DURATION_MS);
      setRestartHoldProgress(progress);
      if (progress < 1) return;
      if (restartHoldTimerRef.current !== null) window.clearInterval(restartHoldTimerRef.current);
      restartHoldTimerRef.current = null;
      restartHoldStartedAtRef.current = null;
      onRestart();
    }, 50);
  };

  useEffect(() => () => {
    if (restartHoldTimerRef.current !== null) window.clearInterval(restartHoldTimerRef.current);
  }, []);

  const handleRestartPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    startRestartHold();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer may already have ended on older mobile browsers.
    }
  };

  const handleRestartKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if ((event.key !== " " && event.key !== "Enter") || event.repeat) return;
    event.preventDefault();
    startRestartHold();
  };

  const restartButtonStyle = { "--restart-hold-progress": restartHoldProgress } as CSSProperties;

  return (
    <header className="topbar map-topbar">
      <div className="map-top-actions">
        <div className="map-run-stats">
          <div
            className="healthbar map-health"
            aria-label={`체력 ${runPlayerHp} 중 ${maxPlayerHp}`}
            style={{ "--map-health-width": `${165 * Math.min(2, Math.max(1, maxPlayerHp / MAX_PLAYER_HP))}px` } as CSSProperties}
          >
            <i style={{ width: `${(runPlayerHp / maxPlayerHp) * 100}%` }} />
            <span>{runPlayerHp} / {maxPlayerHp}</span>
          </div>
          <button
            type="button"
            className="map-gold map-gold-debug-trigger"
            onClick={onGoldDebugClick}
            aria-label={`골드 ${gold}`}
          >
            <strong>$ {gold}</strong>
          </button>
        </div>
        <button
          type="button"
          className="deck-viewer-trigger"
          onClick={onOpenDeckViewer}
          aria-label={`덱 보기, 현재 ${deckCardCount}장`}
        >
          <span className="deck-stack-icon" aria-hidden="true" />
          <span>덱 보기</span>
        </button>
        <button
          type="button"
          className="map-wait-trigger"
          onClick={onWait}
          disabled={mapTraveling}
          aria-label="한 턴 쉬기: 현재 칸에 머물며 적만 행동하게 합니다"
        >
          한 턴 쉼
        </button>
        <button
          type="button"
          className="map-restart-trigger"
          style={restartButtonStyle}
          title="길게 눌러 다시하기 · 현재 진행을 초기화합니다"
          aria-label="길게 눌러 다시하기. 현재 진행을 초기화합니다"
          onPointerDown={handleRestartPointerDown}
          onPointerUp={stopRestartHold}
          onPointerCancel={stopRestartHold}
          onPointerLeave={stopRestartHold}
          onKeyDown={handleRestartKeyDown}
          onKeyUp={stopRestartHold}
          onBlur={stopRestartHold}
          onContextMenu={(event) => event.preventDefault()}
        >
          <span className="map-restart-progress" aria-hidden="true" />
          <span className="map-restart-label">다시하기</span>
        </button>
        {canEditDeck && (
          <button
            type="button"
            className="deck-editor-trigger"
            onClick={onEditDeck}
            aria-label={`덱 편집, 현재 ${deckCardCount}장`}
          >
            <span className="deck-stack-icon" aria-hidden="true" />
            <span>덱 편집</span>
          </button>
        )}
      </div>
    </header>
  );
}
