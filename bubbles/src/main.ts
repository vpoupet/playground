import { Arena, Bubble, Vector } from './bubbles';
import './style.scss';

const width: number = 1024;
const height: number = 768;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const playerBubble = new Bubble(new Vector(width/2, height/2), 40, new Vector());


function run(): void {
  const currentTime = performance.now();
  const dt = (currentTime - previousTime) / 1000;
  previousTime = currentTime;

  arena.update(Math.min(dt, 1 / 15));
  arena.draw(ctx);

  requestAnimationFrame(run);
}

canvas.addEventListener('click', (e: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const bubble = playerBubble.eject(new Vector(x, y).subtract(playerBubble.position).normalize());
  arena.bubbles.push(bubble);
});

let previousTime: number = performance.now();
const arena: Arena = new Arena(width, height, playerBubble);

for (let i = 0; i < 10; i++) {
  const x = Math.random() * width;
  const y = Math.random() * height;
  const radius = Math.random() * 40 + 20;
  const bubble = new Bubble(new Vector(x, y), radius, new Vector());
  arena.bubbles.push(bubble);
}
run();
