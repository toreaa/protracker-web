const canvas = document.getElementById('screen') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

ctx.fillStyle = '#888888';
ctx.fillRect(0, 0, 640, 480);
ctx.fillStyle = '#000000';
ctx.font = '12px monospace';
ctx.fillText('ProTracker 2.3F — Loading...', 200, 240);

console.log('ProTracker Web initialized');
