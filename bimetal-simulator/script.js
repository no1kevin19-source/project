const materials = [
  { id: "aluminum", name: "알루미늄", coefficient: 23.1, color: "#8aa0ad" },
  { id: "copper", name: "구리", coefficient: 16.5, color: "#bd693b" },
  { id: "brass", name: "황동", coefficient: 19.0, color: "#c8a044" },
  { id: "iron", name: "철", coefficient: 11.8, color: "#59666a" },
  { id: "steel", name: "강철", coefficient: 12.0, color: "#78848c" },
  { id: "zinc", name: "아연", coefficient: 30.2, color: "#9aa7bf" },
  { id: "glass", name: "유리", coefficient: 8.5, color: "#48a6a6" }
];

const CUSTOM_MATERIAL_STORAGE_KEY = "thermalExpansionCustomMaterials";
const MAX_CUSTOM_MATERIALS = 100;
const customMaterials = loadCustomMaterials();
materials.push(...customMaterials);

const materialGrid = document.querySelector("#materialGrid");
const dropZone = document.querySelector("#dropZone");
const emptyState = document.querySelector("#emptyState");
const simulation = document.querySelector("#simulation");
const statusText = document.querySelector("#statusText");
const resetButton = document.querySelector("#resetButton");
const temperatureSlider = document.querySelector("#temperatureSlider");
const coolButton = document.querySelector("#coolButton");
const heatButton = document.querySelector("#heatButton");
const temperatureLabel = document.querySelector("#temperatureLabel");
const bendLabel = document.querySelector("#bendLabel");
const deflectionValue = document.querySelector("#deflectionValue");
const lengthChangeValue = document.querySelector("#lengthChangeValue");
const bimetal = document.querySelector("#bimetal");
const topStrip = document.querySelector("#topStrip");
const bottomStrip = document.querySelector("#bottomStrip");
const topLabel = document.querySelector("#topLabel");
const bottomLabel = document.querySelector("#bottomLabel");
const selectedList = document.querySelector("#selectedList");
const firstParticleTitle = document.querySelector("#firstParticleTitle");
const secondParticleTitle = document.querySelector("#secondParticleTitle");
const customMaterialModal = document.querySelector("#customMaterialModal");
const customMaterialForm = document.querySelector("#customMaterialForm");
const customMaterialName = document.querySelector("#customMaterialName");
const customMaterialCoefficient = document.querySelector("#customMaterialCoefficient");
const customMaterialMessage = document.querySelector("#customMaterialMessage");
const customColorPreview = document.querySelector("#customColorPreview");
const customCardPreviewSwatch = document.querySelector("#customCardPreviewSwatch");
const customCardPreviewName = document.querySelector("#customCardPreviewName");
const customCardPreviewCoefficient = document.querySelector("#customCardPreviewCoefficient");
const closeCustomModal = document.querySelector("#closeCustomModal");
const cancelCustomMaterial = document.querySelector("#cancelCustomMaterial");
const rgbControls = {
  r: {
    slider: document.querySelector("#rgbR"),
    number: document.querySelector("#rgbRNumber")
  },
  g: {
    slider: document.querySelector("#rgbG"),
    number: document.querySelector("#rgbGNumber")
  },
  b: {
    slider: document.querySelector("#rgbB"),
    number: document.querySelector("#rgbBNumber")
  }
};
const particleCanvases = [
  document.querySelector("#firstParticleCanvas"),
  document.querySelector("#secondParticleCanvas")
];

let selectedMaterials = [];
let dragState = null;
let lastParticleTime = 0;

const particleSets = particleCanvases.map((canvas) => ({
  canvas,
  context: canvas.getContext("2d"),
  particles: createParticles(canvas)
}));

function createMaterialCard(material) {
  const card = document.createElement("div");
  card.className = "material-card";
  card.role = "button";
  card.tabIndex = 0;
  card.draggable = true;
  card.dataset.id = material.id;
  card.innerHTML = `
    <span class="swatch" style="background:${material.color}"></span>
    <span class="material-name">${material.name}</span>
    <span class="coefficient">열팽창 정도 ${material.coefficient} (선팽창계수, ×10⁻⁶/°C)</span>
  `;

  const addButton = document.createElement("button");
  addButton.className = "material-action";
  addButton.type = "button";
  addButton.textContent = "+";
  addButton.setAttribute("aria-label", "사용자 정의 물질 추가");
  addButton.addEventListener("pointerdown", (event) => event.stopPropagation());
  addButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openCustomMaterialModal();
  });
  card.append(addButton);

  if (material.isCustom) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-material";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `${material.name} 삭제`);
    deleteButton.addEventListener("pointerdown", (event) => event.stopPropagation());
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteCustomMaterial(material.id);
    });
    card.append(deleteButton);
  }

  card.addEventListener("dragstart", (event) => {
    if (isSelected(material.id) || selectedMaterials.length >= 2) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", material.id);
    event.dataTransfer.effectAllowed = "copy";
  });

  card.addEventListener("pointerdown", (event) => startPointerDrag(event, material.id, card));
  card.addEventListener("click", (event) => {
    if (card.dataset.suppressClick === "true") {
      event.preventDefault();
      card.dataset.suppressClick = "false";
      return;
    }
    addMaterial(material.id);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    addMaterial(material.id);
  });
  return card;
}

function renderMaterials() {
  materialGrid.innerHTML = "";
  materials.forEach((material) => {
    const card = createMaterialCard(material);
    if (isSelected(material.id) || selectedMaterials.length >= 2) {
      card.classList.add("is-used");
    }
    materialGrid.append(card);
  });
  materialGrid.append(createAddMaterialCard());
}

function createAddMaterialCard() {
  const card = document.createElement("button");
  card.className = "material-card add-material-card";
  card.type = "button";
  card.innerHTML = `
    <span class="add-material-plus">+</span>
    <span class="material-name">사용자 정의 물질</span>
    <span class="coefficient">${customMaterials.length}/${MAX_CUSTOM_MATERIALS}</span>
  `;
  card.addEventListener("click", openCustomMaterialModal);
  if (customMaterials.length >= MAX_CUSTOM_MATERIALS) {
    card.disabled = true;
    card.classList.add("is-used");
  }
  return card;
}

function isSelected(id) {
  return selectedMaterials.some((material) => material.id === id);
}

function loadCustomMaterials() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_MATERIAL_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((material) => (
        typeof material.id === "string" &&
        typeof material.name === "string" &&
        Number.isFinite(Number(material.coefficient)) &&
        typeof material.color === "string"
      ))
      .slice(0, MAX_CUSTOM_MATERIALS)
      .map((material) => ({
        id: material.id,
        name: material.name.slice(0, 20),
        coefficient: clampNumber(Number(material.coefficient), 0, 100),
        color: material.color,
        isCustom: true
      }));
  } catch {
    return [];
  }
}

function saveCustomMaterials() {
  localStorage.setItem(CUSTOM_MATERIAL_STORAGE_KEY, JSON.stringify(customMaterials));
}

function openCustomMaterialModal() {
  if (customMaterials.length >= MAX_CUSTOM_MATERIALS) {
    window.alert("사용자 정의 물질은 최대 100개까지 만들 수 있습니다.");
    return;
  }

  customMaterialForm.reset();
  customMaterialName.value = "";
  customMaterialCoefficient.value = "";
  setRgbValue("r", 80);
  setRgbValue("g", 160);
  setRgbValue("b", 160);
  customMaterialMessage.textContent = "";
  updateCustomPreview();
  customMaterialModal.hidden = false;
  customMaterialName.focus();
}

function closeCustomMaterialModalDialog() {
  customMaterialModal.hidden = true;
}

function getRgbValue(channel) {
  return clampNumber(Number(rgbControls[channel].number.value), 0, 255);
}

function setRgbValue(channel, value) {
  const nextValue = String(Math.round(clampNumber(Number(value), 0, 255)));
  rgbControls[channel].slider.value = nextValue;
  rgbControls[channel].number.value = nextValue;
}

function getCustomColor() {
  const r = getRgbValue("r");
  const g = getRgbValue("g");
  const b = getRgbValue("b");
  return `rgb(${r}, ${g}, ${b})`;
}

function updateCustomPreview() {
  const name = customMaterialName.value.trim() || "신소재A";
  const coefficient = customMaterialCoefficient.value === "" ? "45.2" : customMaterialCoefficient.value;
  const color = getCustomColor();
  customColorPreview.style.background = color;
  customCardPreviewSwatch.style.background = color;
  customCardPreviewName.textContent = name.slice(0, 20);
  customCardPreviewCoefficient.textContent = `열팽창 정도 ${coefficient} (선팽창계수, ×10⁻⁶/°C)`;
}

function createCustomMaterial(event) {
  event.preventDefault();
  customMaterialMessage.textContent = "";

  if (customMaterials.length >= MAX_CUSTOM_MATERIALS) {
    customMaterialMessage.textContent = "사용자 정의 물질은 최대 100개까지 만들 수 있습니다.";
    return;
  }

  const name = customMaterialName.value.trim().slice(0, 20);
  const coefficient = Number(customMaterialCoefficient.value);
  if (!name) {
    customMaterialMessage.textContent = "물질 이름을 입력해 주세요.";
    return;
  }

  if (!Number.isFinite(coefficient) || coefficient < 0 || coefficient > 100) {
    customMaterialMessage.textContent = "열팽창 정도는 0 이상 100 이하로 입력해 주세요.";
    return;
  }

  const material = {
    id: `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    coefficient: Math.round(coefficient * 1000) / 1000,
    color: getCustomColor(),
    isCustom: true
  };

  customMaterials.push(material);
  materials.push(material);
  saveCustomMaterials();
  renderMaterials();
  closeCustomMaterialModalDialog();
}

function deleteCustomMaterial(id) {
  const customIndex = customMaterials.findIndex((material) => material.id === id);
  if (customIndex === -1) return;

  customMaterials.splice(customIndex, 1);
  const materialIndex = materials.findIndex((material) => material.id === id);
  if (materialIndex !== -1) materials.splice(materialIndex, 1);
  selectedMaterials = selectedMaterials.filter((material) => material.id !== id);
  saveCustomMaterials();
  updateSimulation();
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function addMaterial(id) {
  const material = materials.find((item) => item.id === id);
  if (!material || isSelected(id) || selectedMaterials.length >= 2) return;
  selectedMaterials.push(material);
  updateSimulation();
}

function resetSimulation() {
  selectedMaterials = [];
  temperatureSlider.value = 20;
  updateSimulation();
}

function updateSimulation() {
  const temperature = Number(temperatureSlider.value);
  const delta = temperature - 20;
  const hasBimetal = selectedMaterials.length === 2;

  emptyState.hidden = selectedMaterials.length > 0;
  simulation.hidden = selectedMaterials.length === 0;
  temperatureLabel.textContent = `${temperature}°C`;
  selectedList.innerHTML = "";
  updateParticleTitles();

  if (selectedMaterials.length === 0) {
    statusText.textContent = "서로 다른 물질 2개를 놓아주세요.";
    bendLabel.textContent = "휘어짐 없음";
    drawBimetal(null, null, 0, temperature);
    renderMaterials();
    return;
  }

  selectedMaterials.forEach((material, index) => {
    const chip = document.createElement("span");
    chip.className = "selected-chip";
    chip.style.setProperty("--chip-color", material.color);
    chip.textContent = `${index + 1}. ${material.name}`;
    selectedList.append(chip);
  });

  if (!hasBimetal) {
    statusText.textContent = "물질을 하나 더 놓으면 바이메탈이 완성됩니다.";
    bendLabel.textContent = "대기 중";
    drawBimetal(selectedMaterials[0], null, 0, temperature);
    renderMaterials();
    return;
  }

  const [top, bottom] = selectedMaterials;
  const bend = getBend(top, bottom, delta);
  drawBimetal(top, bottom, bend, temperature);

  statusText.textContent = `${top.name} + ${bottom.name} 바이메탈`;
  bendLabel.textContent = getBendText(top, bottom, delta, bend);
  renderMaterials();
}

function getBend(top, bottom, delta) {
  if (delta === 0) return 0;

  const difference = Math.abs(top.coefficient - bottom.coefficient);
  if (difference < 0.2) return 0;

  const high = top.coefficient > bottom.coefficient ? top : bottom;
  const low = high === top ? bottom : top;
  const target = delta > 0 ? low : high;
  const direction = target === top ? -1 : 1;
  const thermalScale = Math.abs(delta) / 80;
  const strength = difference * thermalScale * 4.2;
  return direction * Math.min(165, strength);
}

function getBendText(top, bottom, delta, bend) {
  if (Math.abs(bend) < 4) return "휘어짐 거의 없음";

  const high = top.coefficient > bottom.coefficient ? top : bottom;
  const low = high === top ? bottom : top;
  if (delta > 0) {
    return `가열: 열팽창 정도가 작은 ${low.name} 쪽으로 구부러집니다`;
  }
  return `냉각: 더 많이 수축하는 ${high.name} 쪽으로 구부러집니다`;
}

function drawBimetal(top, bottom, bend, temperature = 20) {
  const startX = 78;
  const endX = 650 - Math.abs(bend) * 0.34;
  const centerY = 130;
  const baseLayerThickness = 48;
  const length = endX - startX;
  const stripLengthMeters = 1;
  const start = { x: startX, y: centerY };
  const end = { x: endX, y: centerY + bend };
  const startTangent = { x: 1, y: 0 };
  const endTangent = normalizeVector(length, bend * 1.6);
  const handle = Math.max(160, length * 0.42);
  const interfaceCurve = {
    start,
    c1: {
      x: start.x + startTangent.x * handle,
      y: start.y + startTangent.y * handle
    },
    c2: {
      x: end.x - endTangent.x * handle,
      y: end.y - endTangent.y * handle
    },
    end
  };
  const topPath = makeSmoothLayerPath(interfaceCurve, -baseLayerThickness, 0);
  const bottomPath = makeSmoothLayerPath(interfaceCurve, 0, baseLayerThickness);

  topStrip.setAttribute("d", topPath);
  bottomStrip.setAttribute("d", bottomPath);
  topStrip.style.fill = top?.color ?? "#b9c5bf";
  bottomStrip.style.fill = bottom?.color ?? "#d0d8d4";
  topStrip.style.stroke = "none";
  bottomStrip.style.stroke = "none";
  topLabel.textContent = top?.name ?? "";
  bottomLabel.textContent = bottom?.name ?? "두 번째 물질 대기";
  topLabel.setAttribute("y", String(centerY - 22));
  bottomLabel.setAttribute("y", String(centerY + 30));
  bimetal.style.setProperty("--tip-y", `${bend}px`);
  updateDeflectionValue(bend, length, stripLengthMeters);
  updateLengthChangeValue(top, bottom, temperature, stripLengthMeters);
}

function updateDeflectionValue(bend, visualLength, stripLengthMeters) {
  if (!deflectionValue) return;

  const deflectionMeters = Math.abs(bend) / Math.max(1, visualLength) * stripLengthMeters;
  const direction = bend < -1 ? "위쪽" : bend > 1 ? "아래쪽" : "없음";
  if (direction === "없음") {
    deflectionValue.textContent = "0.000 m";
    return;
  }

  deflectionValue.textContent = `${deflectionMeters.toFixed(3)} m (${direction})`;
}

function updateLengthChangeValue(firstMaterial, secondMaterial, temperature, stripLengthMeters) {
  if (!lengthChangeValue) return;

  const firstChange = getLengthChange(firstMaterial, temperature, stripLengthMeters);
  const secondChange = getLengthChange(secondMaterial, temperature, stripLengthMeters);
  const firstName = firstMaterial?.name ?? "물질 없음";
  const secondName = secondMaterial?.name ?? "물질 없음";
  lengthChangeValue.innerHTML = `
    <span>첫번째(${firstName}) ${formatLengthChange(firstChange)}</span>
    <span>두번째(${secondName}) ${formatLengthChange(secondChange)}</span>
  `;
}

function getLengthChange(material, temperature, stripLengthMeters) {
  if (!material) return 0;
  return (getIsotropicExpansionScale(material, temperature) - 1) * stripLengthMeters;
}

function formatLengthChange(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(6)} m`;
}

function normalizeVector(x, y) {
  const length = Math.hypot(x, y) || 1;
  return {
    x: x / length,
    y: y / length
  };
}

function makeSmoothLayerPath(interfaceCurve, outerOffset, innerOffset) {
  const startNormal = { x: 0, y: 1 };
  const endTangent = normalizeVector(
    interfaceCurve.end.x - interfaceCurve.c2.x,
    interfaceCurve.end.y - interfaceCurve.c2.y
  );
  const endNormal = { x: -endTangent.y, y: endTangent.x };
  const outer = offsetCurve(interfaceCurve, outerOffset, startNormal, endNormal);
  const inner = offsetCurve(interfaceCurve, innerOffset, startNormal, endNormal);
  return [
    `M ${outer.start.x} ${outer.start.y}`,
    `C ${outer.c1.x} ${outer.c1.y}, ${outer.c2.x} ${outer.c2.y}, ${outer.end.x} ${outer.end.y}`,
    `L ${inner.end.x} ${inner.end.y}`,
    `C ${inner.c2.x} ${inner.c2.y}, ${inner.c1.x} ${inner.c1.y}, ${inner.start.x} ${inner.start.y}`,
    "Z"
  ].join(" ");
}

function offsetCurve(curve, offset, startNormal, endNormal) {
  return {
    start: offsetPoint(curve.start, startNormal, offset),
    c1: offsetPoint(curve.c1, startNormal, offset),
    c2: offsetPoint(curve.c2, endNormal, offset),
    end: offsetPoint(curve.end, endNormal, offset)
  };
}

function offsetPoint(point, normal, offset) {
  return {
    x: point.x + normal.x * offset,
    y: point.y + normal.y * offset
  };
}

function updateParticleTitles() {
  firstParticleTitle.textContent = selectedMaterials[0]?.name ?? "첫 번째 물질";
  secondParticleTitle.textContent = selectedMaterials[1]?.name ?? "두 번째 물질";
}

function createParticles(canvas) {
  const columns = 14;
  const rows = 9;
  const overflowX = 90;
  const overflowY = 80;
  const startX = -overflowX;
  const startY = -overflowY;
  const usableWidth = canvas.width + overflowX * 2;
  const usableHeight = canvas.height + overflowY * 2;
  const particles = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      particles.push({
        baseX: startX + (usableWidth * column) / (columns - 1),
        baseY: startY + (usableHeight * row) / (rows - 1),
        phase: Math.random() * Math.PI * 2,
        r: 4.4
      });
    }
  }

  return particles;
}

function animateParticles(time = 0) {
  const dt = Math.min(32, time - lastParticleTime || 16) / 16;
  lastParticleTime = time;
  const temperature = Number(temperatureSlider.value);
  const vibration = getParticleVibration(temperature);

  particleSets.forEach((set, index) => {
    const material = selectedMaterials[index];
    drawParticleSet(set, material, temperature, vibration, dt, time);
  });

  requestAnimationFrame(animateParticles);
}

function getParticleVibration(temperature) {
  const distanceFromRoomTemperature = Math.abs(temperature - 20) / 120;
  return 0.18 + Math.pow(distanceFromRoomTemperature, 1.2) * 1.6;
}

function getIsotropicExpansionScale(material, temperature) {
  if (!material) return 1;
  const delta = temperature - 20;
  return 1 + material.coefficient * delta * 0.000001;
}

function getParticleSpacingScale(material, temperature) {
  if (!material) return 1;
  const delta = temperature - 20;
  return Math.exp(material.coefficient * delta * 0.000035);
}

function drawParticleSet(set, material, temperature, vibration, dt, time) {
  const { canvas, context, particles } = set;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const spacingScale = getParticleSpacingScale(material, temperature);
  const color = material?.color ?? "#b9c5bf";

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255, 255, 255, 0.76)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(97, 112, 104, 0.22)";
  context.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

  const cellCenterX = canvas.width / 2;
  const cellCenterY = canvas.height / 2;
  const positions = particles.map((particle) => {
    const pulse = time * 0.006 + particle.phase;
    const jitter = material ? vibration : 0.4;
    return {
      x: cellCenterX + (particle.baseX - cellCenterX) * spacingScale + Math.cos(pulse) * jitter,
      y: cellCenterY + (particle.baseY - cellCenterY) * spacingScale + Math.sin(pulse * 1.17) * jitter,
      r: particle.r
    };
  });

  context.strokeStyle = colorWithAlpha(color, 0.22);
  context.lineWidth = 1;
  for (let i = 0; i < positions.length; i += 1) {
    for (let j = i + 1; j < positions.length; j += 1) {
      const dx = positions[i].x - positions[j].x;
      const dy = positions[i].y - positions[j].y;
      const distance = Math.hypot(dx, dy);
      if (distance < 43 * spacingScale) {
        context.beginPath();
        context.moveTo(positions[i].x, positions[i].y);
        context.lineTo(positions[j].x, positions[j].y);
        context.stroke();
      }
    }
  }

  positions.forEach((particle) => {
    context.beginPath();
    context.fillStyle = color;
    context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    context.fill();
  });
}

function colorWithAlpha(hexColor, alpha) {
  const rgbMatch = hexColor.match(/\d+/g);
  if (hexColor.startsWith("rgb") && rgbMatch?.length >= 3) {
    const [r, g, b] = rgbMatch.map(Number);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function nudgeTemperature(amount) {
  const nextValue = Math.max(
    Number(temperatureSlider.min),
    Math.min(Number(temperatureSlider.max), Number(temperatureSlider.value) + amount)
  );
  temperatureSlider.value = nextValue;
  updateSimulation();
}

function startPointerDrag(event, id, card) {
  if (event.button !== 0 || isSelected(id) || selectedMaterials.length >= 2) return;
  dragState = {
    id,
    card,
    startX: event.clientX,
    startY: event.clientY,
    ghost: null,
    isDragging: false
  };
  card.setPointerCapture(event.pointerId);
}

function movePointerDrag(event) {
  if (!dragState) return;

  const distance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
  if (!dragState.isDragging && distance > 8) {
    dragState.isDragging = true;
    dragState.card.dataset.suppressClick = "true";
    dragState.ghost = dragState.card.cloneNode(true);
    dragState.ghost.classList.add("drag-ghost");
    document.body.append(dragState.ghost);
  }

  if (!dragState.isDragging) return;
  event.preventDefault();
  dragState.ghost.style.left = `${event.clientX}px`;
  dragState.ghost.style.top = `${event.clientY}px`;
  dropZone.classList.toggle("is-over", isPointInsideDropZone(event.clientX, event.clientY));
}

function endPointerDrag(event) {
  if (!dragState) return;
  if (dragState.isDragging && isPointInsideDropZone(event.clientX, event.clientY)) {
    addMaterial(dragState.id);
  }

  dragState.ghost?.remove();
  dropZone.classList.remove("is-over");
  dragState = null;
}

function isPointInsideDropZone(x, y) {
  const rect = dropZone.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-over");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-over");
  addMaterial(event.dataTransfer.getData("text/plain"));
});

customMaterialForm.addEventListener("submit", createCustomMaterial);
closeCustomModal.addEventListener("click", closeCustomMaterialModalDialog);
cancelCustomMaterial.addEventListener("click", closeCustomMaterialModalDialog);
customMaterialModal.addEventListener("click", (event) => {
  if (event.target === customMaterialModal) closeCustomMaterialModalDialog();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !customMaterialModal.hidden) {
    closeCustomMaterialModalDialog();
  }
});
customMaterialName.addEventListener("input", updateCustomPreview);
customMaterialCoefficient.addEventListener("input", updateCustomPreview);
Object.entries(rgbControls).forEach(([channel, controls]) => {
  controls.slider.addEventListener("input", () => {
    setRgbValue(channel, controls.slider.value);
    updateCustomPreview();
  });
  controls.number.addEventListener("input", () => {
    setRgbValue(channel, controls.number.value);
    updateCustomPreview();
  });
});

temperatureSlider.addEventListener("input", updateSimulation);
coolButton.addEventListener("click", () => nudgeTemperature(-10));
heatButton.addEventListener("click", () => nudgeTemperature(10));
resetButton.addEventListener("click", resetSimulation);
document.addEventListener("pointermove", movePointerDrag);
document.addEventListener("pointerup", endPointerDrag);
document.addEventListener("pointercancel", endPointerDrag);

renderMaterials();
updateSimulation();
requestAnimationFrame(animateParticles);
