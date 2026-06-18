// Plano de Fundo Topográfico ---------------------------------------------------------------------------------------------

import * as ChriscoursesPerlinNoise from "https://esm.sh/@chriscourses/perlin-noise";
let showFPS = true;
let MAX_FPS = 0;
let thresholdIncrement = 5;
let thickLineThresholdMultiple = 3;
let res = 8;
let baseZOffset = 0.0003;
let lineColor = '#70707080';
let canvas;
let ctx;
let fpsCount = document.getElementById("fps-count");
let frameValues = [];
let inputValues = [];
let currentThreshold = 0;
let cols = 0;
let rows = 0;
let zOffset = 0;
let zBoostValues = [];
let noiseMin = 100;
let noiseMax = 0;
let mousePos = { x: -99, y: -99 };
let mouseDown = true;
setupCanvas();
animate();
function setupCanvas() {
    let canvasElement = document.getElementById('res-canvas');
    let canvasCtx = canvasElement.getContext('2d');
    if (!canvasCtx) {
        return;
    }
    else {
        canvas = canvasElement;
        ctx = canvasCtx;
    }
    canvasSize();
    window.addEventListener('resize', () => {
        canvasSize();
    });
    canvas.addEventListener('mousemove', (e) => {
        mousePos = { x: e.offsetX, y: e.offsetY };
    });
}
function canvasSize() {

    const width = window.innerWidth;
    const height = window.innerHeight;
  
    canvas.width = width;
    canvas.height = height;
  
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
  
    cols = Math.floor(width / res) + 1;
    rows = Math.floor(height / res) + 1;
  
    zBoostValues = [];
  
    for (let y = 0; y < rows; y++) {
      zBoostValues[y] = [];
  
      for (let x = 0; x <= cols; x++) {
        zBoostValues[y][x] = 0;
      }
    }
  }
function animate() {
    const startTime = performance.now();
    setTimeout(() => {
        const endTime = performance.now();
        const frameDuration = endTime - startTime;
        frameValues.push(Math.round(1000 / frameDuration));
        if (frameValues.length > 60 && showFPS) {
            fpsCount.innerText = Math.round(frameValues.reduce((a, b) => a + b) / frameValues.length);
            frameValues = [];
        }
        requestAnimationFrame(() => animate());
    }, 1000 / MAX_FPS);
    if (mouseDown) {
        mouseOffset();
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    zOffset += baseZOffset;
    generateNoise();
    const roundedNoiseMin = Math.floor(noiseMin / thresholdIncrement) * thresholdIncrement;
    const roundedNoiseMax = Math.ceil(noiseMax / thresholdIncrement) * thresholdIncrement;
    for (let threshold = roundedNoiseMin; threshold < roundedNoiseMax; threshold += thresholdIncrement) {
        currentThreshold = threshold;
        renderAtThreshold();
    }
    noiseMin = 100;
    noiseMax = 0;
}
function mouseOffset() {
    var _a;
    let x = Math.floor(mousePos.x / res);
    let y = Math.floor(mousePos.y / res);
    if (inputValues[y] === undefined || inputValues[y][x] === undefined)
        return;
    const incrementValue = 0.0025;
    const radius = 5;
    for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
            const distanceSquared = i * i + j * j;
            const radiusSquared = radius * radius;
            if (distanceSquared <= radiusSquared && ((_a = zBoostValues[y + i]) === null || _a === void 0 ? void 0 : _a[x + j]) !== undefined) {
                zBoostValues[y + i][x + j] += incrementValue * (1 - distanceSquared / radiusSquared);
            }
        }
    }
}
function generateNoise() {
    var _a, _b;
    for (let y = 0; y < rows; y++) {
        inputValues[y] = [];
        for (let x = 0; x <= cols; x++) {
            inputValues[y][x] = ChriscoursesPerlinNoise.noise(x * 0.02, y * 0.02, zOffset + ((_a = zBoostValues[y]) === null || _a === void 0 ? void 0 : _a[x])) * 100;
            if (inputValues[y][x] < noiseMin)
                noiseMin = inputValues[y][x];
            if (inputValues[y][x] > noiseMax)
                noiseMax = inputValues[y][x];
            if (((_b = zBoostValues[y]) === null || _b === void 0 ? void 0 : _b[x]) > 0) {
                zBoostValues[y][x] *= 0.99;
            }
        }
    }
}
function renderAtThreshold() {
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = currentThreshold % (thresholdIncrement * thickLineThresholdMultiple) === 0 ? 2 : 1;
    for (let y = 0; y < inputValues.length - 1; y++) {
        for (let x = 0; x < inputValues[y].length - 1; x++) {
            if (inputValues[y][x] > currentThreshold && inputValues[y][x + 1] > currentThreshold && inputValues[y + 1][x + 1] > currentThreshold && inputValues[y + 1][x] > currentThreshold)
                continue;
            if (inputValues[y][x] < currentThreshold && inputValues[y][x + 1] < currentThreshold && inputValues[y + 1][x + 1] < currentThreshold && inputValues[y + 1][x] < currentThreshold)
                continue;
            let gridValue = binaryToType(inputValues[y][x] > currentThreshold ? 1 : 0, inputValues[y][x + 1] > currentThreshold ? 1 : 0, inputValues[y + 1][x + 1] > currentThreshold ? 1 : 0, inputValues[y + 1][x] > currentThreshold ? 1 : 0);
            placeLines(gridValue, x, y);
        }
    }
    ctx.stroke();
}
function placeLines(gridValue, x, y) {
    let nw = inputValues[y][x];
    let ne = inputValues[y][x + 1];
    let se = inputValues[y + 1][x + 1];
    let sw = inputValues[y + 1][x];
    let a, b, c, d;
    switch (gridValue) {
        case 1:
        case 14:
            c = [
                x * res + res * linInterpolate(sw, se),
                y * res + res
            ];
            d = [x * res, y * res + res * linInterpolate(nw, sw)];
            line(d, c);
            break;
        case 2:
        case 13:
            b = [
                x * res + res,
                y * res + res * linInterpolate(ne, se)
            ];
            c = [
                x * res + res * linInterpolate(sw, se),
                y * res + res
            ];
            line(b, c);
            break;
        case 3:
        case 12:
            b = [
                x * res + res,
                y * res + res * linInterpolate(ne, se)
            ];
            d = [x * res, y * res + res * linInterpolate(nw, sw)];
            line(d, b);
            break;
        case 11:
        case 4:
            a = [x * res + res * linInterpolate(nw, ne), y * res];
            b = [
                x * res + res,
                y * res + res * linInterpolate(ne, se)
            ];
            line(a, b);
            break;
        case 5:
            a = [x * res + res * linInterpolate(nw, ne), y * res];
            b = [
                x * res + res,
                y * res + res * linInterpolate(ne, se)
            ];
            c = [
                x * res + res * linInterpolate(sw, se),
                y * res + res
            ];
            d = [x * res, y * res + res * linInterpolate(nw, sw)];
            line(d, a);
            line(c, b);
            break;
        case 6:
        case 9:
            a = [x * res + res * linInterpolate(nw, ne), y * res];
            c = [
                x * res + res * linInterpolate(sw, se),
                y * res + res
            ];
            line(c, a);
            break;
        case 7:
        case 8:
            a = [x * res + res * linInterpolate(nw, ne), y * res];
            d = [x * res, y * res + res * linInterpolate(nw, sw)];
            line(d, a);
            break;
        case 10:
            a = [x * res + res * linInterpolate(nw, ne), y * res];
            b = [
                x * res + res,
                y * res + res * linInterpolate(ne, se)
            ];
            c = [
                x * res + res * linInterpolate(sw, se),
                y * res + res
            ];
            d = [x * res, y * res + res * linInterpolate(nw, sw)];
            line(a, b);
            line(c, d);
            break;
        default:
            break;
    }
}
function line(from, to) {
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
}
function linInterpolate(x0, x1, y0 = 0, y1 = 1) {
    if (x0 === x1) {
        return 0;
    }
    return y0 + ((y1 - y0) * (currentThreshold - x0)) / (x1 - x0);
}
function binaryToType(nw, ne, se, sw) {
    let a = [nw, ne, se, sw];
    return a.reduce((res, x) => (res << 1) | x);
}

// ------------------------------------------------------------------------------------------------------------------------

// Script para a Galeria de Imagens ---------------------------------------------------------------------------------------
const imagens = document.querySelectorAll('.imagem-galeria');
      const modal = document.getElementById('modal');
      const modalImg = document.getElementById('imgModal');
      const fechar = document.getElementById('fecharModal');
      const imgContainer = document.getElementById('imgContainer');

      let scale = 1;
      let posX = 0, posY = 0;
      let isDragging = false;
      let startX, startY;

      imagens.forEach(img => {
        img.addEventListener('click', () => {
          modal.style.display = 'flex';
          modalImg.src = img.src;

          modalImg.onload = () => {
            scale = 1;
            posX = 0;
            posY = 0;
            modalImg.style.transform = 'none';
          };
        });
      });

      fechar.addEventListener('click', () => {
        modal.style.display = 'none';
        modalImg.src = '';
      });

      modal.addEventListener('click', (e) => {
        if (!modalImg.contains(e.target)) {
          modal.style.display = 'none';
          modalImg.src = '';
        }
      });

      modalImg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        scale += delta;
        scale = Math.max(0.5, Math.min(scale, 5));
        applyTransform();
      });

      function applyTransform() {
        modalImg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
      }

      modalImg.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - posX;
        startY = e.clientY - posY;
        modalImg.style.cursor = 'grabbing';
      });

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        posX = e.clientX - startX;
        posY = e.clientY - startY;
        applyTransform();
      });

      document.addEventListener('mouseup', () => {
        isDragging = false;
        modalImg.style.cursor = 'default';
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          modal.style.display = 'none';
          modalImg.src = '';
        }
      });

// ------------------------------------------------------------------------------------------------------------------------

// Animação Fade-up dos elementos -----------------------------------------------------------------------------------------

const observer = new IntersectionObserver((entries) => {

    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);

        }

    });

}, {

    // Dispara quando cerca de 50% do elemento
    threshold: 0.50,
    rootMargin: "0px 0px -100px 0px"

});

document.querySelectorAll('.fade-up').forEach((el) => {
    observer.observe(el);
});

document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener('click', function (e) {

        e.preventDefault();

        const target = document.querySelector(
            this.getAttribute('href')
        );

        if (!target) return;

        const y =
            target.getBoundingClientRect().top +
            window.pageYOffset -
            (window.innerHeight / 2) +
            (target.offsetHeight / 2);

        window.scrollTo({
            top: y,
            behavior: 'smooth'
        });

    });

});
