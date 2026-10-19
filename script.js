// Plano de Fundo Topográfico ---------------------------------------------------------------------------------------------

import * as ChriscoursesPerlinNoise from "https://esm.sh/@chriscourses/perlin-noise";
let showFPS = false;
let MAX_FPS = 60;
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
let lastFrameTime = 0;
setupCanvas();
requestAnimationFrame(animate);
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
function animate(currentTime) {
    if (currentTime - lastFrameTime >= 1000 / MAX_FPS) {
        lastFrameTime = currentTime;
        const frameDuration = currentTime - lastFrameTime;
        frameValues.push(Math.round(1000 / frameDuration));
        if (frameValues.length > 60 && showFPS) {
            fpsCount.innerText = Math.round(frameValues.reduce((a, b) => a + b) / frameValues.length);
            frameValues = [];
        }
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
    requestAnimationFrame(animate);
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
          document.body.style.overflow = 'hidden';

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
        document.body.style.overflow = '';
      });

      modal.addEventListener('click', (e) => {
        if (!modalImg.contains(e.target)) {
          modal.style.display = 'none';
          modalImg.src = '';
          document.body.style.overflow = '';
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
          document.body.style.overflow = '';
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

// Theme Toggle Functionality -----------------------------------------------------------

const themeToggle = document.getElementById('theme-toggle');
const emoji = document.getElementById('emoji');
const logo = document.getElementById('Logo');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  if (theme === 'light') {
    emoji.textContent = ': D';
    logo.src = 'imagens/Logo Alex B.png';
  } else {
    emoji.textContent = ': )';
    logo.src = 'imagens/Logo Alex W.png';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
}

themeToggle.addEventListener('click', toggleTheme);

const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

const projectData = {

  grimon: {
    title: 'E-commerce - Grimon',                                  // Título do projeto (topo do modal)
    description: 'Desenvolvimento de e-commerce completo para a Grimon, incluindo catálogo de produtos, carrinho de compras, checkout e integração com meios de pagamento. Cliente: Grimon. Motivação: Criar uma plataforma de vendas online robusta e escalável.', // Descrição (parágrafo)
    tags: ['HTML5', 'CSS3', 'JavaScript', 'PHP', 'MySQL'],        // Tags (coloridos abaixo da descrição)
    link: 'https://seu-link-1.com',                                // Link do botão "Acessar projeto"
    images: [                                                      // 3 imagens do carrossel (lado esquerdo)
      'imagens/Grimon.png',                                        // Imagem 1 (ativa por padrão)
      'imagens/design1.jpg',                                       // Imagem 2
      'imagens/design2.jpg'                                        // Imagem 3
    ]
  },

  junta: {
    title: 'Ideiathon Fatec - <span class="Laranja">Juntaê</span>',
    description: 'Projeto desenvolvido durante Ideiathon na Fatec. Plataforma para conectar pessoas em eventos colaborativos. Cliente: Fatec Tatuí. Motivação: Solução para networking em hackathons e eventos acadêmicos.',
    tags: ['Prototipação', 'Figma', 'UI/UX'],
    link: 'https://www.figma.com/proto/6oBuXB3dEhhuHMzrkzVNyT/Junta%C3%AA-Site---PointMedia?node-id=1873-1410',
    images: [
      'imagens/projetos/Juntae 1.png',
      'imagens/projetos/Juntae 2.png',
      'imagens/projetos/Juntae 3.png'
    ]
  },

  cerbela: {
    title: 'Sistema de Pedidos - <span class="Laranja">Cerbela</span>',
    description: 'Sistema de gestão de pedidos para a Cerbela, com controle de estoque, emissão de notas fiscais e relatórios gerenciais. Cliente: Cerbela. Motivação: Automatizar processos manuais e reduzir erros operacionais.',
    tags: ['HTML5', 'CSS3', 'JavaScript'],
    link: 'https://alexptavella.github.io/Gestao-de-Pedidos/',
    images: [
      'imagens/projetos/Sistemas de pedido - Cerbela 1.png',
      'imagens/projetos/Sistemas de pedido - Cerbela - 2.png',
      'imagens/projetos/Sistemas de pedido - Cerbela - 3.png'
    ]
  },

  isaias: {
    title: 'Oficina Digital - <span class="Laranja">Isaias Motos</span>',
    description: 'Sistema ERP para oficina mecânica com agendamento, controle de serviços, estoque de peças e financeiro. Cliente: Isaias Motos. Motivação: Digitalizar a gestão da oficina substituindo planilhas e papel.',
    tags: ['HTML5', 'CSS3', 'JavaScript', 'PHP', 'MySQL'],
    link: 'https://alexptavella.github.io/Projeto-Erp-Oficina-Mecanica/',
    images: [
      'imagens/projetos/Oficina Digital - Isaias Motos 1.png',
      'imagens/projetos/Oficina Digital - Isaias Motos 2.png',
      'imagens/projetos/Oficina Digital - Isaias Motos 3.png'
    ]
  },

  softcars: {
    title: 'App Mobile - <span class="Laranja">SoftCars</span>',
    description: 'Aplicativo mobile para gestão de frotas e veículos, com rastreamento, manutenção preventiva e relatórios. Cliente: SoftCars. Motivação: Modernizar a gestão de frotas com tecnologia mobile.',
    tags: ['Prototipação', 'Figma', 'UI/UX'],
    link: 'https://www.figma.com/design/EW469ZnuJO82PaiWIvK9LG',
    images: [
      'imagens/projetos/Softcars 1.png',
      'imagens/projetos/Softcars 2.png',
      'imagens/projetos/Spftcars 3.png'
    ]
  }
};

const projectModal = document.getElementById('project-modal');
const modalClose = projectModal.querySelector('.project-modal-close');
const carouselTrack = document.getElementById('carousel-track');
const carouselDots = document.getElementById('carousel-dots');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.querySelector('.modal-project-description');
const modalTags = document.getElementById('modal-tags');
const modalLink = document.getElementById('modal-link');
const carouselPrev = projectModal.querySelector('.carousel-prev');
const carouselNext = projectModal.querySelector('.carousel-next');

let currentProject = null;
let currentSlide = 0;

function openProjectModal(projectKey) {
  const project = projectData[projectKey];
  if (!project) return;
  
  currentProject = projectKey;
  currentSlide = 0;
  
  modalTitle.innerHTML = project.title;
  modalDescription.textContent = project.description;
  modalLink.href = project.link;
  
  modalTags.innerHTML = '';
  project.tags.forEach((tag, tagIndex) => {
    const span = document.createElement('span');
    span.className = 'modal-tag';
    span.style.setProperty('--tag-index', tagIndex);
    span.textContent = tag;
    modalTags.appendChild(span);
  });
  
  carouselTrack.innerHTML = '';
  carouselDots.innerHTML = '';
  project.images.forEach((imgSrc, index) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = `${project.title} - Imagem ${index + 1}`;
    img.loading = index === 0 ? 'eager' : 'lazy';
    slide.appendChild(img);
    
    carouselTrack.appendChild(slide);
    
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
    dot.style.setProperty('--dot-index', index);
    dot.setAttribute('aria-label', `Ir para imagem ${index + 1}`);
    dot.addEventListener('click', () => goToSlide(index));
    carouselDots.appendChild(dot);
    
    // Clique na imagem para abrir zoom
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      openZoomModal(img.src);
    });
  });
  
  updateCarousel();
  projectModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  projectModal.classList.remove('open');
  document.body.style.overflow = '';
}

function goToSlide(index) {
  const project = projectData[currentProject];
  if (!project) return;
  currentSlide = Math.max(0, Math.min(index, project.images.length - 1));
  updateCarousel();
}

function updateCarousel() {
  const project = projectData[currentProject];
  if (!project) return;
  
  carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
  
  const dots = carouselDots.querySelectorAll('.carousel-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
  
  carouselPrev.style.display = currentSlide === 0 ? 'none' : 'flex';
  carouselNext.style.display = currentSlide === project.images.length - 1 ? 'none' : 'flex';
}

document.querySelectorAll('.card[data-project]').forEach(card => {
  card.addEventListener('click', () => {
    openProjectModal(card.dataset.project);
  });
  
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openProjectModal(card.dataset.project);
    }
  });
});

modalClose.addEventListener('click', closeProjectModal);

modalLink.addEventListener('click', (e) => {
  e.stopPropagation();
  e.preventDefault();
  if (modalLink.href && modalLink.href !== '#') {
    window.open(modalLink.href, '_blank', 'noopener,noreferrer');
  }
});

projectModal.addEventListener('click', (e) => {
  if (e.target === projectModal) {
    closeProjectModal();
  }
});

carouselPrev.addEventListener('click', () => goToSlide(currentSlide - 1));
carouselNext.addEventListener('click', () => goToSlide(currentSlide + 1));

// ============================================================================
// ZOOM DE IMAGEM DO CARROSSEL - Mesma função da galeria inicial
// Ao clicar em uma imagem do carrossel, abre zoom suave na tela
// ============================================================================

// Cria o elemento do modal de zoom dinamicamente
const zoomModal = document.createElement('div');
zoomModal.id = 'project-zoom-modal';
zoomModal.className = 'project-zoom-modal';
zoomModal.setAttribute('role', 'dialog');
zoomModal.setAttribute('aria-modal', 'true');
zoomModal.style.display = 'none';
zoomModal.style.position = 'fixed';
zoomModal.style.inset = '0';
zoomModal.style.zIndex = '3000';
zoomModal.style.backdropFilter = 'blur(4px)';
zoomModal.style.webkitBackdropFilter = 'blur(4px)';
zoomModal.style.background = 'rgba(0, 0, 0, 0.45)';
zoomModal.style.justifyContent = 'center';
zoomModal.style.alignItems = 'center';
zoomModal.style.padding = '20px';
zoomModal.style.boxSizing = 'border-box';
document.body.appendChild(zoomModal);

const zoomImg = document.createElement('img');
zoomImg.id = 'project-zoom-img';
zoomImg.style.maxWidth = '90vw';
zoomImg.style.maxHeight = '90vh';
zoomImg.style.objectFit = 'contain';
zoomImg.style.borderRadius = '8px';
zoomImg.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.5)';
zoomImg.style.cursor = 'grab';
zoomModal.appendChild(zoomImg);

const zoomClose = document.createElement('button');
zoomClose.id = 'project-zoom-close';
zoomClose.innerHTML = '&times;';
zoomClose.style.position = 'absolute';
zoomClose.style.top = '20px';
zoomClose.style.right = '30px';
zoomClose.style.color = 'var(--text-primary)';
zoomClose.style.fontSize = '35px';
zoomClose.style.fontWeight = 'bold';
zoomClose.style.cursor = 'pointer';
zoomClose.style.display = 'flex';
zoomClose.style.alignItems = 'center';
zoomClose.style.justifyContent = 'center';
zoomClose.style.zIndex = '3100';
zoomClose.style.transition = 'color 0.2s';
zoomClose.style.background = 'none';
zoomClose.style.backgroundColor = 'transparent';
zoomClose.style.border = 'none';
zoomClose.style.padding = '0';
zoomClose.style.margin = '0';
zoomClose.style.appearance = 'none';
zoomClose.style.webkitAppearance = 'none';
zoomModal.appendChild(zoomClose);

zoomClose.addEventListener('mouseenter', () => {
  zoomClose.style.color = 'var(--orange)';
  zoomClose.style.backgroundColor = 'transparent';
});

zoomClose.addEventListener('mouseleave', () => {
  zoomClose.style.color = 'var(--text-primary)';
  zoomClose.style.backgroundColor = 'transparent';
});
zoomClose.addEventListener('mouseleave', () => {
  zoomClose.style.color = 'var(--text-primary)';
});

let zoomScale = 1;
let zoomPosX = 0, zoomPosY = 0;
let zoomIsDragging = false;
let zoomStartX, zoomStartY;

function applyZoomTransform() {
  zoomImg.style.transform = `translate(${zoomPosX}px, ${zoomPosY}px) scale(${zoomScale})`;
}

function openZoomModal(src) {
  zoomImg.src = src;
  zoomScale = 1;
  zoomPosX = 0;
  zoomPosY = 0;
  zoomImg.style.transform = 'none';
  zoomModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeZoomModal() {
  zoomModal.style.display = 'none';
  document.body.style.overflow = '';
}

// Eventos do modal de zoom
zoomClose.addEventListener('click', closeZoomModal);

zoomModal.addEventListener('click', (e) => {
  if (e.target === zoomModal) {
    closeZoomModal();
  }
});


// Wheel para zoom
zoomModal.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  zoomScale += delta;
  zoomScale = Math.max(0.5, Math.min(zoomScale, 5));
  applyZoomTransform();
}, { passive: false });

// Drag para pan
zoomImg.addEventListener('mousedown', (e) => {
  zoomIsDragging = true;
  zoomStartX = e.clientX - zoomPosX;
  zoomStartY = e.clientY - zoomPosY;
  zoomImg.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
  if (!zoomIsDragging) return;
  zoomPosX = e.clientX - zoomStartX;
  zoomPosY = e.clientY - zoomStartY;
  applyZoomTransform();
});

document.addEventListener('mouseup', () => {
  zoomIsDragging = false;
  zoomImg.style.cursor = 'grab';
});

// Teclado
document.addEventListener('keydown', (e) => {
  if (!zoomModal.style.display || zoomModal.style.display === 'none') return;
  if (e.key === 'Escape') {
    closeZoomModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (!projectModal.classList.contains('open')) return;
  if (e.key === 'Escape') {
    if (zoomModal.style.display === 'flex') {
      closeZoomModal();
    } else {
      closeProjectModal();
    }
  } else if (e.key === 'ArrowLeft') {
    if (zoomModal.style.display !== 'flex') goToSlide(currentSlide - 1);
  } else if (e.key === 'ArrowRight') {
    if (zoomModal.style.display !== 'flex') goToSlide(currentSlide + 1);
  }
});

let touchStartX = 0;
carouselTrack.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

carouselTrack.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].screenX;
  const diff = touchStartX - touchEndX;
  if (Math.abs(diff) > 50) {
    goToSlide(currentSlide + (diff > 0 ? 1 : -1));
  }
}, { passive: true });
