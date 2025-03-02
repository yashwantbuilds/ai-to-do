const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function generateIcon(size) {
  canvas.width = size;
  canvas.height = size;
  
  // Background
  ctx.fillStyle = '#1976d2';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();
  
  // Checkmark
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(size * 0.25, size * 0.5);
  ctx.lineTo(size * 0.45, size * 0.7);
  ctx.lineTo(size * 0.75, size * 0.3);
  ctx.stroke();
  
  return canvas.toDataURL('image/png');
}

// Generate icons
const sizes = [16, 32, 64, 192, 512];
sizes.forEach(size => {
  const dataUrl = generateIcon(size);
  console.log(`Icon ${size}x${size}:`, dataUrl);
}); 