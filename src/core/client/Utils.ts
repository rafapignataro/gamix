import { Movement } from './../types/index';
type ContextUtil = {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  color: string;
}

type ContextUtilCircle = {
  radius: number;
}

type ContextUtilRect = {
  width: number;
  height: number;
}

type ContextUtilText = {
  text: string;
  font: number;
  textAlign?: CanvasTextAlign;
}

export function circle({ context, x, y, radius, color }: ContextUtil & ContextUtilCircle) {
  context.beginPath();
  context.arc(
    x,
    y,
    radius,
    0,
    2 * Math.PI,
    false
  );
  context.fillStyle = color ?? 'black';
  context.fill();
};

export function rect({ context, x, y, width, height, color }: ContextUtil & ContextUtilRect) {
  context.fillStyle = color ?? 'black';
  context.fillRect(x, y, width, height);
};

export function text({ context, x, y, text, color = 'black', font = 12, textAlign = 'start' }: ContextUtil & ContextUtilText) {
  context.fillStyle = color;
  context.font = `${font}px Silkscreen`;
  context.textAlign = textAlign;
  context.fillText(
    text,
    x,
    y
  );
}

export function getTileColor(tile: number) {
  if (tile < 120) return '#6ab04c';

  if (tile >= 120 && tile < 140) return '#f6e58d';

  return '#4834d4';
}

type KeyToMovement = {
  key: KeyboardEvent['key'];
  type: 'down' | 'up';
  current: Movement;
}

export function keyToMovement({ key, type, current }: KeyToMovement) {
  if (type !== 'down' && type !== 'up') return;

  if (key !== 'w' && key !== 's' && key !== 'a' && key !== 'd') return;

  const nextMove = { ...current };

  if (type === 'down') {
    if (key === 'w') {
      nextMove.up = true;
    }
    if (key === 's') {
      nextMove.down = true;
    }
    if (key === 'a') {
      nextMove.left = true;
    }
    if (key === 'd') {
      nextMove.right = true;
    }

    return nextMove;
  }

  if (key === 'w') {
    nextMove.up = false;
  }

  if (key === 's') {
    nextMove.down = false;
  }
  if (key === 'a') {
    nextMove.left = false;
  }
  if (key === 'd') {
    nextMove.right = false;
  }

  return nextMove;
}

