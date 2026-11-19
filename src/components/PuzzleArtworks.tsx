export interface PuzzleScene {
  id: string;
  title: string;
  subtitle: string;
}

export const PUZZLE_SCENES: PuzzleScene[] = [
  { id: 'jardin', title: 'Le Jardin Fleuri', subtitle: 'Lavandes, rosiers et soleil du matin' },
  { id: 'chat', title: 'Le Chat au Salon', subtitle: 'Sieste paisible près de la fenêtre' },
  { id: 'bouquet', title: 'Bouquet du Matin', subtitle: 'Pivoines fraîches et café chaud' },
  { id: 'mer', title: 'Terrasse sur la Mer', subtitle: 'Rivage méditerranéen et voiliers' },
  { id: 'tournesols', title: 'Champs d’Été', subtitle: 'Tournesols dorés sous le ciel bleu' },
  { id: 'montagne', title: 'Chalet d’Automne', subtitle: 'Sapins verts et lac tranquille' },
];

export function renderPuzzleSceneToCanvas(sceneId: string, size = 600): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const s = size / 600;
  ctx.scale(s, s);

  if (sceneId === 'jardin') {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 340);
    sky.addColorStop(0, '#6AB7E8');
    sky.addColorStop(1, '#DFF2FD');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 600, 600);

    // Sun
    ctx.fillStyle = '#FFE066';
    ctx.beginPath();
    ctx.arc(495, 95, 48, 0, Math.PI * 2);
    ctx.fill();

    // Rolling hills
    ctx.fillStyle = '#8BC37A';
    ctx.beginPath();
    ctx.moveTo(0, 290);
    ctx.quadraticCurveTo(180, 230, 360, 275);
    ctx.quadraticCurveTo(490, 305, 600, 250);
    ctx.lineTo(600, 600);
    ctx.lineTo(0, 600);
    ctx.closePath();
    ctx.fill();

    // Cottage wall on left
    ctx.fillStyle = '#F5EAD7';
    ctx.fillRect(28, 175, 195, 220);
    ctx.fillStyle = '#C86D51';
    ctx.beginPath();
    ctx.moveTo(15, 180);
    ctx.lineTo(125, 105);
    ctx.lineTo(238, 180);
    ctx.closePath();
    ctx.fill();
    // Window
    ctx.fillStyle = '#4C7A67';
    ctx.fillRect(85, 220, 76, 86);
    ctx.fillStyle = '#CBE7F5';
    ctx.fillRect(94, 229, 26, 32);
    ctx.fillRect(126, 229, 26, 32);
    ctx.fillRect(94, 266, 26, 32);
    ctx.fillRect(126, 266, 26, 32);

    // Stone path
    ctx.fillStyle = '#D9CBB8';
    ctx.beginPath();
    ctx.moveTo(270, 350);
    ctx.quadraticCurveTo(325, 460, 220, 600);
    ctx.lineTo(420, 600);
    ctx.quadraticCurveTo(385, 450, 325, 350);
    ctx.closePath();
    ctx.fill();

    // Stepping stones
    ctx.fillStyle = '#B8A690';
    [
      [300, 390, 34, 16],
      [295, 445, 44, 20],
      [330, 505, 48, 22],
      [285, 560, 54, 24],
    ].forEach(([x, y, rx, ry]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0.1, 0, Math.PI * 2);
      ctx.fill();
    });

    // Lavender & flower beds
    for (let i = 0; i < 18; i++) {
      const lx = 38 + (i % 6) * 34;
      const ly = 435 + Math.floor(i / 6) * 44;
      ctx.fillStyle = '#53824A';
      ctx.beginPath();
      ctx.arc(lx, ly + 18, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = i % 2 === 0 ? '#8B5CF6' : '#A78BFA';
      ctx.beginPath();
      ctx.arc(lx - 6, ly, 10, 0, Math.PI * 2);
      ctx.arc(lx + 8, ly - 5, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rose bush on right
    ctx.fillStyle = '#3F7040';
    ctx.beginPath();
    ctx.arc(500, 445, 92, 0, Math.PI * 2);
    ctx.arc(435, 515, 76, 0, Math.PI * 2);
    ctx.arc(545, 535, 75, 0, Math.PI * 2);
    ctx.fill();
    const roses = [
      [460, 410], [520, 395], [555, 450], [490, 470], [425, 495], [510, 540], [450, 555],
    ];
    roses.forEach(([rx, ry]) => {
      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.arc(rx, ry, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDA4AF';
      ctx.beginPath();
      ctx.arc(rx - 4, ry - 4, 7, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (sceneId === 'chat') {
    // Warm sunlit wall
    ctx.fillStyle = '#F7EFE3';
    ctx.fillRect(0, 0, 600, 600);
    // Window frame on right
    ctx.fillStyle = '#D9ECF7';
    ctx.fillRect(350, 35, 215, 295);
    ctx.strokeStyle = '#5B4636';
    ctx.lineWidth = 10;
    ctx.strokeRect(350, 35, 215, 295);
    ctx.beginPath();
    ctx.moveTo(457, 35);
    ctx.lineTo(457, 330);
    ctx.moveTo(350, 182);
    ctx.lineTo(565, 182);
    ctx.stroke();

    // Tree leaves outside window
    ctx.fillStyle = '#68A364';
    ctx.beginPath();
    ctx.arc(410, 110, 45, 0, Math.PI * 2);
    ctx.arc(505, 145, 55, 0, Math.PI * 2);
    ctx.fill();

    // Cozy Armchair
    ctx.fillStyle = '#246A52';
    ctx.beginPath();
    ctx.roundRect(70, 225, 390, 300, 42);
    ctx.fill();
    ctx.fillStyle = '#2F8266';
    ctx.beginPath();
    ctx.roundRect(110, 335, 310, 145, 24);
    ctx.fill();

    // Cream knitted blanket
    ctx.fillStyle = '#FAF5EB';
    ctx.beginPath();
    ctx.roundRect(128, 350, 275, 165, 28);
    ctx.fill();

    // Ginger Cat curled up
    ctx.fillStyle = '#E67E35';
    ctx.beginPath();
    ctx.ellipse(268, 365, 108, 68, 0, 0, Math.PI * 2);
    ctx.fill();
    // Stripes
    ctx.strokeStyle = '#B85418';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    [245, 280, 315].forEach((sx) => {
      ctx.beginPath();
      ctx.moveTo(sx, 310);
      ctx.quadraticCurveTo(sx + 8, 335, sx - 2, 358);
      ctx.stroke();
    });
    // Tail
    ctx.strokeStyle = '#E67E35';
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(350, 385);
    ctx.quadraticCurveTo(405, 425, 330, 445);
    ctx.stroke();
    // Cat Head
    ctx.fillStyle = '#F08C44';
    ctx.beginPath();
    ctx.arc(198, 335, 52, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.beginPath();
    ctx.moveTo(155, 305);
    ctx.lineTo(162, 260);
    ctx.lineTo(192, 290);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(205, 290);
    ctx.lineTo(234, 260);
    ctx.lineTo(240, 305);
    ctx.closePath();
    ctx.fill();
    // Peaceful closed eyes & nose
    ctx.strokeStyle = '#4A2511';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(180, 336, 9, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(214, 336, 9, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.arc(197, 350, 6, 0, Math.PI * 2);
    ctx.fill();

    // Terracotta pot & plant on left
    ctx.fillStyle = '#C96F4B';
    ctx.fillRect(34, 435, 70, 95);
    ctx.fillStyle = '#4E8254';
    ctx.beginPath();
    ctx.ellipse(50, 395, 16, 46, -0.3, 0, Math.PI * 2);
    ctx.ellipse(85, 390, 16, 48, 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (sceneId === 'bouquet') {
    ctx.fillStyle = '#F3ECE1';
    ctx.fillRect(0, 0, 600, 410);
    ctx.fillStyle = '#C8A073';
    ctx.fillRect(0, 410, 600, 190);

    // Vase
    ctx.fillStyle = '#2B6E63';
    ctx.beginPath();
    ctx.moveTo(230, 295);
    ctx.lineTo(370, 295);
    ctx.quadraticCurveTo(405, 420, 350, 495);
    ctx.lineTo(250, 495);
    ctx.quadraticCurveTo(195, 420, 230, 295);
    ctx.closePath();
    ctx.fill();

    // Eucalyptus stems
    ctx.strokeStyle = '#4F7A5B';
    ctx.lineWidth = 5;
    [
      [260, 295, 150, 115],
      [300, 295, 300, 85],
      [340, 295, 455, 125],
      [240, 295, 130, 220],
      [360, 295, 475, 225],
    ].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Leaves
    ctx.fillStyle = '#6A9C78';
    [
      [175, 155], [140, 185], [435, 155], [465, 200], [210, 125], [390, 125], [275, 105], [330, 110],
    ].forEach(([lx, ly]) => {
      ctx.beginPath();
      ctx.arc(lx, ly, 24, 0, Math.PI * 2);
      ctx.fill();
    });

    // Peonies & flowers
    const flowers = [
      { x: 300, y: 185, r: 52, c1: '#F43F5E', c2: '#FDA4AF' },
      { x: 215, y: 235, r: 44, c1: '#EC4899', c2: '#FBCFE8' },
      { x: 388, y: 230, r: 46, c1: '#FB7185', c2: '#FFE4E6' },
      { x: 255, y: 125, r: 38, c1: '#F59E0B', c2: '#FDE68A' },
      { x: 355, y: 138, r: 40, c1: '#E11D48', c2: '#FECDD3' },
      { x: 305, y: 268, r: 38, c1: '#FFFFFF', c2: '#FDE047' },
    ];
    flowers.forEach((f) => {
      ctx.fillStyle = f.c1;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.c2;
      ctx.beginPath();
      ctx.arc(f.x - f.r * 0.15, f.y - f.r * 0.15, f.r * 0.52, 0, Math.PI * 2);
      ctx.fill();
    });

    // Espresso cup
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(435, 445, 76, 60, [6, 6, 26, 26]);
    ctx.fill();
    ctx.fillStyle = '#5C3A21';
    ctx.beginPath();
    ctx.ellipse(473, 448, 34, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E5DDD0';
    ctx.beginPath();
    ctx.ellipse(473, 508, 52, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (sceneId === 'mer') {
    // Mediterranean sky & sea
    const sky = ctx.createLinearGradient(0, 0, 0, 280);
    sky.addColorStop(0, '#38BDF8');
    sky.addColorStop(1, '#BAE6FD');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 600, 290);

    const sea = ctx.createLinearGradient(0, 290, 0, 480);
    sea.addColorStop(0, '#0284C7');
    sea.addColorStop(1, '#14B8A6');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 290, 600, 200);

    // Distant island
    ctx.fillStyle = '#4B7F6E';
    ctx.beginPath();
    ctx.moveTo(40, 290);
    ctx.quadraticCurveTo(150, 215, 290, 290);
    ctx.closePath();
    ctx.fill();

    // Sailboats
    const drawBoat = (bx: number, by: number, scale: number) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 28 * scale, by - 65 * scale);
      ctx.lineTo(bx + 36 * scale, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(bx - 12 * scale, by + 4 * scale);
      ctx.lineTo(bx + 46 * scale, by + 4 * scale);
      ctx.lineTo(bx + 36 * scale, by + 18 * scale);
      ctx.lineTo(bx - 2 * scale, by + 18 * scale);
      ctx.closePath();
      ctx.fill();
    };
    drawBoat(365, 330, 1.0);
    drawBoat(190, 315, 0.65);

    // Stone terrace foreground
    ctx.fillStyle = '#F5EFE6';
    ctx.fillRect(0, 455, 600, 145);
    ctx.fillStyle = '#DFD3C3';
    ctx.fillRect(0, 440, 600, 20);
    for (let x = 25; x < 600; x += 65) {
      ctx.fillStyle = '#E8DFD1';
      ctx.fillRect(x, 460, 24, 140);
    }

    // Bougainvillea vibrant magenta arch on right
    ctx.fillStyle = '#3B7A4B';
    ctx.beginPath();
    ctx.arc(545, 160, 120, 0, Math.PI * 2);
    ctx.arc(465, 95, 80, 0, Math.PI * 2);
    ctx.fill();
    const petals = [
      [445, 85], [495, 65], [545, 110], [490, 145], [560, 185], [510, 215], [420, 115], [565, 60],
    ];
    petals.forEach(([px, py]) => {
      ctx.fillStyle = '#DB2777';
      ctx.beginPath();
      ctx.arc(px, py, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.arc(px - 6, py - 6, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (sceneId === 'tournesols') {
    const sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, '#3B82F6');
    sky.addColorStop(1, '#BFDBFE');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 600, 320);

    // Fluffy clouds
    ctx.fillStyle = '#FFFFFF';
    [
      [130, 95, 36], [165, 90, 44], [205, 98, 32],
      [420, 115, 34], [455, 105, 42], [495, 118, 30],
    ].forEach(([cx, cy, r]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Green field
    ctx.fillStyle = '#4D8B48';
    ctx.fillRect(0, 270, 600, 330);

    const drawSunflower = (sx: number, sy: number, r: number) => {
      // Stem
      ctx.strokeStyle = '#2F662B';
      ctx.lineWidth = r * 0.22;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, 600);
      ctx.stroke();
      // Petals
      ctx.fillStyle = '#FACC15';
      for (let a = 0; a < 12; a++) {
        const ang = (a * Math.PI * 2) / 12;
        ctx.beginPath();
        ctx.ellipse(
          sx + Math.cos(ang) * r * 0.72,
          sy + Math.sin(ang) * r * 0.72,
          r * 0.44,
          r * 0.2,
          ang,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      // Center
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    };

    drawSunflower(115, 305, 58);
    drawSunflower(285, 275, 65);
    drawSunflower(475, 310, 60);
    drawSunflower(195, 425, 76);
    drawSunflower(395, 440, 78);
    drawSunflower(530, 470, 62);
    drawSunflower(75, 475, 62);
  } else {
    // Montagne & Chalet d'automne
    const sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, '#FDBA74');
    sky.addColorStop(1, '#FEF3C7');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 600, 330);

    // Mountains
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(175, 115);
    ctx.lineTo(350, 300);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(220, 300);
    ctx.lineTo(435, 95);
    ctx.lineTo(600, 270);
    ctx.lineTo(600, 300);
    ctx.closePath();
    ctx.fill();

    // Snow caps
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.moveTo(175, 115);
    ctx.lineTo(132, 160);
    ctx.lineTo(168, 152);
    ctx.lineTo(190, 165);
    ctx.lineTo(218, 160);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(435, 95);
    ctx.lineTo(385, 145);
    ctx.lineTo(422, 138);
    ctx.lineTo(448, 152);
    ctx.lineTo(482, 142);
    ctx.closePath();
    ctx.fill();

    // Calm lake
    ctx.fillStyle = '#0EA5E9';
    ctx.fillRect(0, 300, 600, 140);

    // Foreground meadow
    ctx.fillStyle = '#D97706';
    ctx.fillRect(0, 425, 600, 175);

    // Warm Wooden Chalet
    ctx.fillStyle = '#92400E';
    ctx.fillRect(310, 370, 185, 135);
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.moveTo(285, 375);
    ctx.lineTo(402, 295);
    ctx.lineTo(520, 375);
    ctx.closePath();
    ctx.fill();
    // Glowing window
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(345, 408, 48, 46);
    ctx.fillStyle = '#78350F';
    ctx.fillRect(425, 422, 38, 83);

    // Autumn trees & pines
    [
      [90, 405, '#EA580C'],
      [165, 425, '#F59E0B'],
      [545, 415, '#15803D'],
    ].forEach(([tx, ty, color]) => {
      ctx.fillStyle = '#5C3A21';
      ctx.fillRect((tx as number) - 8, (ty as number) + 20, 16, 65);
      ctx.fillStyle = color as string;
      ctx.beginPath();
      ctx.arc(tx as number, ty as number, 48, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  return canvas;
}
