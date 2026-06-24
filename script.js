import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const canvas = document.getElementById("gameCanvas");
const mainMenu = document.getElementById("mainMenu");
const playButton = document.getElementById("playButton");
const mapButtons = [...document.querySelectorAll("[data-map]")];
const loadoutButtons = [...document.querySelectorAll("[data-loadout-weapon]")];
const confirmLoadoutButton = document.getElementById("confirmLoadout");
const settingsButton = document.getElementById("settingsButton");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsButton = document.getElementById("closeSettings");
const fireStateElement = document.getElementById("fireState");
const shotCountElement = document.getElementById("shotCount");
const weaponAmmoElement = document.getElementById("weaponAmmo");
const playerScoreElement = document.getElementById("playerScore");
const enemyScoreElement = document.getElementById("enemyScore");
const roundResultElement = document.getElementById("roundResult");
const roundResultTextElement = document.getElementById("roundResultText");
const restartMatchButton = document.getElementById("restartMatch");
const playerHealthElement = document.getElementById("playerHealth");
const enemyHealthElement = document.getElementById("enemyHealth");
const sensitivitySlider = document.getElementById("sensitivitySlider");
const sensitivityValue = document.getElementById("sensitivityValue");
const scopeOverlay = document.getElementById("scopeOverlay");
const sniperStatusElement = document.getElementById("sniperStatus");
const molotovStatusElement = document.getElementById("molotovStatus");
const weaponButtons = [...document.querySelectorAll("[data-weapon]")];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x5fc7f3);
scene.fog = new THREE.Fog(0xbfeeff, 42, 118);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 140);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const arena = {
  width: 86,
  depth: 62,
  wallHeight: 6.2,
  halfWidth: 43,
  halfDepth: 31
};

const keys = new Set();
const bullets = [];
const molotovs = [];
const fireZones = [];
const trajectoryDots = [];
const obstacles = [];
const climbZones = [];
const mapObjects = [];
const enemies = [];
const clock = new THREE.Clock();
const player = new THREE.Group();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
const forwardVector = new THREE.Vector3();
const rightVector = new THREE.Vector3();
const tempVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);
const characterHitProbe = new THREE.Vector3();
const enemyMoveVector = new THREE.Vector3();
const enemyAimVector = new THREE.Vector3();
const enemyAvoidVector = new THREE.Vector3();
const enemySideVector = new THREE.Vector3();
const viewModel = new THREE.Group();
const aimForward = new THREE.Vector3();
const weaponViewModels = [];

let yaw = 0;
let pitch = 0.1;
let targetYaw = yaw;
let targetPitch = pitch;
let isFiring = false;
let fireCooldown = 0;
let shotCount = 0;
let verticalVelocity = 0;
let stanceMode = "stand";
let isGrounded = true;
let mouseSensitivity = Number(sensitivitySlider.value);
let activeWeapon = 0;
let isAiming = false;
let sniperReload = 0;
let sniperShotQueued = false;
let weaponCooldown = 0;
let rifleAmmo = 20;
let rifleReload = 0;
let sniperAmmo = 5;
let sniperMagazineReload = 0;
let shotgunAmmo = 6;
let shotgunReload = 0;
let pistolAmmo = 12;
let pistolReload = 0;
let launcherAmmo = 2;
let launcherReload = 0;
let molotovCooldown = 0;
let molotovHoldTime = 0;
let isHoldingMolotov = false;
let targetFov = 62;
let playerHealth = 100;
let gameStarted = false;
let settingsOpen = false;
let gameOver = false;
let roundResetQueued = false;
let lastRecoveryTime = 0;
let lastStepErrorTime = 0;
let pendingMapIndex = 0;
let equippedWeapons = [0, 1];
let enemyEquippedWeapons = [0, 1];
let playerScore = 0;
let enemyScore = 0;
const winningScore = 5;
const rifleMagazineSize = 20;
const rifleReloadDuration = 3;
const sniperMagazineSize = 5;
const sniperMagazineReloadDuration = 4;
const shotgunMagazineSize = 6;
const shotgunReloadDuration = 2.8;
const pistolMagazineSize = 12;
const pistolReloadDuration = 1.8;
const launcherMagazineSize = 2;
const launcherReloadDuration = 4.5;
const enemySecondaryWeapons = [1, 2, 3, 4, 5];
const spawnPoint = new THREE.Vector3(34, 0, -28);
const enemySpawnPoint = new THREE.Vector3(-32, 0, 24);

const materials = {
  player: new THREE.MeshStandardMaterial({ color: 0xc2a678, roughness: 0.76, metalness: 0.02 }),
  enemyPlayer: new THREE.MeshStandardMaterial({ color: 0x9b927f, roughness: 0.76, metalness: 0.02 }),
  camoDark: new THREE.MeshStandardMaterial({ color: 0x665943, roughness: 0.82 }),
  camoGreen: new THREE.MeshStandardMaterial({ color: 0x78805c, roughness: 0.82 }),
  enemyMark: new THREE.MeshStandardMaterial({ color: 0x8f1f1f, roughness: 0.7, emissive: 0x240303 }),
  vest: new THREE.MeshStandardMaterial({ color: 0x4f4634, roughness: 0.78 }),
  visor: new THREE.MeshStandardMaterial({ color: 0x111817, roughness: 0.24, metalness: 0.18, emissive: 0x061211 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xd1b58e, roughness: 0.72 }),
  viewSkin: new THREE.MeshStandardMaterial({ color: 0x1c2024, roughness: 0.84, metalness: 0.02 }),
  gun: new THREE.MeshStandardMaterial({ color: 0x20262b, roughness: 0.45, metalness: 0.35 }),
  viewSleeve: new THREE.MeshStandardMaterial({ color: 0x2b3036, roughness: 0.88, metalness: 0.02 }),
  viewGlove: new THREE.MeshStandardMaterial({ color: 0x101214, roughness: 0.82, metalness: 0.04 }),
  viewGun: new THREE.MeshStandardMaterial({ color: 0x0b0d0e, roughness: 0.48, metalness: 0.42 }),
  viewWood: new THREE.MeshStandardMaterial({ color: 0x4a2c1d, roughness: 0.72, metalness: 0.04 }),
  muzzle: new THREE.MeshStandardMaterial({ color: 0xffd75a, roughness: 0.2, metalness: 0.1, emissive: 0xff8a2a, emissiveIntensity: 0.25 }),
  bullet: new THREE.MeshStandardMaterial({ color: 0xfff1a4, roughness: 0.18, metalness: 0.1, emissive: 0xffb84d, emissiveIntensity: 1.3 }),
  molotovGlass: new THREE.MeshStandardMaterial({ color: 0x0f552b, roughness: 0.34, metalness: 0.08, transparent: true, opacity: 0.86, emissive: 0x082714, emissiveIntensity: 0.18 }),
  molotovLabel: new THREE.MeshBasicMaterial({ color: 0xf2efe7 }),
  molotovCloth: new THREE.MeshStandardMaterial({ color: 0xf4eee6, roughness: 0.72, emissive: 0xff7a18, emissiveIntensity: 0.28 }),
  trajectory: new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.82 }),
  fire: new THREE.MeshBasicMaterial({ color: 0xff5b1f, transparent: true, opacity: 0.62, side: THREE.DoubleSide }),
  fireCore: new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.82, side: THREE.DoubleSide }),
  neonCyan: new THREE.MeshBasicMaterial({ color: 0x58f7ff, transparent: true, opacity: 0.88 }),
  neonPink: new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: 0.82 }),
  neonGold: new THREE.MeshBasicMaterial({ color: 0xffd76b, transparent: true, opacity: 0.8 }),
  floor: new THREE.MeshStandardMaterial({ color: 0xbec3c6, roughness: 0.86 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x8f969a, roughness: 0.78 }),
  wallDark: new THREE.MeshStandardMaterial({ color: 0x24282a, roughness: 0.8 }),
  wallTrim: new THREE.MeshStandardMaterial({ color: 0xd9dee0, roughness: 0.62 }),
  crate: new THREE.MeshStandardMaterial({ color: 0x767d80, roughness: 0.78 }),
  ramp: new THREE.MeshStandardMaterial({ color: 0xa8afb3, roughness: 0.76 })
};

function createSkyTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 16;
  textureCanvas.height = 256;
  const context = textureCanvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, textureCanvas.height);
  gradient.addColorStop(0, "#0788de");
  gradient.addColorStop(0.46, "#41bff2");
  gradient.addColorStop(1, "#d7f5ff");
  context.fillStyle = gradient;
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCloudTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 256;
  const context = textureCanvas.getContext("2d");
  context.clearRect(0, 0, textureCanvas.width, textureCanvas.height);

  for (let index = 0; index < 38; index += 1) {
    const x = 40 + Math.random() * 430;
    const y = 72 + Math.random() * 108;
    const radiusX = 32 + Math.random() * 74;
    const radiusY = 18 + Math.random() * 42;
    const gradient = context.createRadialGradient(x, y, 4, x, y, Math.max(radiusX, radiusY));
    gradient.addColorStop(0, "rgba(255,255,255,0.96)");
    gradient.addColorStop(0.58, "rgba(255,255,255,0.72)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(x, y, radiusX, radiusY, Math.random() * 0.18, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addSky() {
  scene.background = createSkyTexture();
  const cloudTexture = createCloudTexture();
  const cloudMaterial = new THREE.MeshBasicMaterial({
    map: cloudTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const cloudBands = [
    [-48, 34, -54, 46, 18, -0.08],
    [10, 38, -66, 62, 22, 0.04],
    [58, 32, -48, 42, 16, 0.14],
    [-68, 30, 18, 54, 19, -0.18],
    [4, 36, 42, 68, 24, 0.08],
    [70, 33, 22, 48, 18, 0.2]
  ];

  cloudBands.forEach(([x, y, z, width, height, rotation]) => {
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(width, height), cloudMaterial.clone());
    cloud.position.set(x, y, z);
    cloud.rotation.set(-0.34, rotation, 0);
    scene.add(cloud);
  });
}

function addLights() {
  const hemi = new THREE.HemisphereLight(0xf4fbff, 0x4b6f80, 2.1);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.7);
  sun.position.set(-24, 34, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -56;
  sun.shadow.camera.right = 56;
  sun.shadow.camera.top = 46;
  sun.shadow.camera.bottom = -46;
  scene.add(sun);

  const rim = new THREE.PointLight(0x4de0a7, 80, 36);
  rim.position.set(0, 5, -18);
  scene.add(rim);
}

function addArena() {
  setArenaDimensions(86, 62, 6.2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(arena.width, arena.depth, 34, 24), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  addMapObject(floor);

  const grid = new THREE.GridHelper(arena.width, 43, 0xffffff, 0xe3e7e9);
  grid.position.y = 0.025;
  grid.material.opacity = 0.45;
  grid.material.transparent = true;
  addMapObject(grid);

  addWall(0, arena.wallHeight / 2, -arena.halfDepth, arena.width, arena.wallHeight, 0.8);
  addWall(0, arena.wallHeight / 2, arena.halfDepth, arena.width, arena.wallHeight, 0.8);
  addWall(-arena.halfWidth, arena.wallHeight / 2, 0, 0.8, arena.wallHeight, arena.depth);
  addWall(arena.halfWidth, arena.wallHeight / 2, 0, 0.8, arena.wallHeight, arena.depth);

  addTrim(0, arena.wallHeight + 0.15, -arena.halfDepth + 0.05, arena.width, 0.24, 0.28);
  addTrim(0, arena.wallHeight + 0.15, arena.halfDepth - 0.05, arena.width, 0.24, 0.28);
  addTrim(-arena.halfWidth + 0.05, arena.wallHeight + 0.15, 0, 0.28, 0.24, arena.depth);
  addTrim(arena.halfWidth - 0.05, arena.wallHeight + 0.15, 0, 0.28, 0.24, arena.depth);

  addObstacle(-25, 0.75, -14, 11, 1.5, 3.2, materials.ramp);
  addObstacle(-17, 2.5, -13, 2.2, 5, 12.5, materials.wallDark);
  addObstacle(5, 1.8, -18, 13, 3.6, 2.2, materials.crate);
  addObstacle(17, 2.7, -17, 2.4, 5.4, 14, materials.wallDark);
  addObstacle(23, 1.75, -5, 15, 3.5, 2.4, materials.crate);

  addObstacle(-2, 1.75, 0, 16, 3.5, 13, materials.crate);
  addObstacle(-2, 3.95, 0, 11, 0.8, 9, materials.wallTrim);
  addObstacle(-10.2, 2.8, 0, 2.4, 5.6, 13, materials.wallDark);
  addObstacle(6.2, 2.8, 0, 2.4, 5.6, 13, materials.wallDark);
  addObstacle(-2, 3, 6.8, 16, 6, 2.4, materials.wallDark);

  addObstacle(-30, 2.45, 5, 3, 4.9, 17, materials.wallDark);
  addObstacle(-14, 1.05, 17, 17, 2.1, 3, materials.ramp);

  addObstacle(12, 2.75, 10, 3, 5.5, 16, materials.wallDark);
  addObstacle(24, 2.75, 8, 3, 5.5, 16, materials.wallDark);
  addObstacle(31, 1.55, 16, 13, 3.1, 3.2, materials.crate);
  addObstacle(19, 0.95, 23, 19, 1.9, 2.8, materials.ramp);

  addObstacle(-1, 0.8, 14, 6.5, 1.6, 9, materials.ramp);
  addObstacle(-1, 2.65, 24, 2.4, 5.3, 8, materials.wallDark);

  addObstacle(0, 0.45, -25, 15, 0.9, 3.2, materials.wallTrim);
  addObstacle(35, 2.1, 24, 2.4, 4.2, 9, materials.wallDark);
  addObstacle(36, 0.8, -24, 7, 1.6, 3.2, materials.ramp);
}

function addSkylineArena() {
  setArenaDimensions(132, 96, 8.4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(arena.width, arena.depth, 42, 32), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  addMapObject(floor);

  const grid = new THREE.GridHelper(arena.width, 66, 0xffffff, 0xcfd6d9);
  grid.position.y = 0.025;
  grid.material.opacity = 0.36;
  grid.material.transparent = true;
  addMapObject(grid);

  addWall(0, arena.wallHeight / 2, -arena.halfDepth, arena.width, arena.wallHeight, 0.9);
  addWall(0, arena.wallHeight / 2, arena.halfDepth, arena.width, arena.wallHeight, 0.9);
  addWall(-arena.halfWidth, arena.wallHeight / 2, 0, 0.9, arena.wallHeight, arena.depth);
  addWall(arena.halfWidth, arena.wallHeight / 2, 0, 0.9, arena.wallHeight, arena.depth);

  addTrim(0, arena.wallHeight + 0.2, -arena.halfDepth + 0.05, arena.width, 0.28, 0.34);
  addTrim(0, arena.wallHeight + 0.2, arena.halfDepth - 0.05, arena.width, 0.28, 0.34);
  addTrim(-arena.halfWidth + 0.05, arena.wallHeight + 0.2, 0, 0.34, 0.28, arena.depth);
  addTrim(arena.halfWidth - 0.05, arena.wallHeight + 0.2, 0, 0.34, 0.28, arena.depth);

  addBuilding(-42, 8, -30, 16, 16, 14);
  addBuilding(-18, 13, -34, 18, 26, 16);
  addBuilding(16, 10, -32, 20, 20, 14);
  addBuilding(44, 15, -24, 14, 30, 18);
  addBuilding(-48, 11, 6, 18, 22, 16);
  addBuilding(-18, 18, 10, 20, 36, 18);
  addBuilding(18, 14, 6, 18, 28, 18);
  addBuilding(48, 9, 12, 16, 18, 16);
  addBuilding(-36, 7, 34, 22, 14, 12);
  addBuilding(0, 12, 36, 24, 24, 14);
  addBuilding(36, 16, 34, 18, 32, 16);

  addObstacle(-5, 1.1, -14, 48, 2.2, 5, materials.ramp);
  addObstacle(0, 1.1, 22, 50, 2.2, 5, materials.ramp);
  addObstacle(-58, 1.2, -3, 6, 2.4, 24, materials.crate);
  addObstacle(58, 1.2, -8, 6, 2.4, 30, materials.crate);
  addObstacle(0, 1.4, -44, 34, 2.8, 5, materials.wallTrim);
  addObstacle(-6, 1.3, 0, 8, 2.6, 8, materials.crate);

  addObstacle(-32, 1.0, -6, 9, 2, 4, materials.crate);
  addObstacle(-28, 0.7, 22, 6, 1.4, 5, materials.wallTrim);
  addObstacle(-8, 0.75, -22, 7, 1.5, 4, materials.crate);
  addObstacle(9, 0.85, -9, 5, 1.7, 7, materials.crate);
  addObstacle(27, 0.8, 23, 8, 1.6, 4, materials.wallTrim);
  addObstacle(42, 0.85, -2, 5, 1.7, 8, materials.crate);
  addObstacle(-53, 0.65, 25, 7, 1.3, 4, materials.ramp);
  addObstacle(53, 0.65, 31, 7, 1.3, 4, materials.ramp);

  addLadder(-36, 27.65, 14, "z");
  addLadder(48, 20.25, 18, "z");
  addLadder(-50.25, -30, 16, "x");
  addLadder(0, 28.25, 24, "z");
}

function addNeonDocksArena() {
  setArenaDimensions(104, 74, 7.2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(arena.width, arena.depth, 36, 26), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  addMapObject(floor);

  const grid = new THREE.GridHelper(arena.width, 52, 0x7df8ff, 0xd3e1e4);
  grid.position.y = 0.025;
  grid.material.opacity = 0.42;
  grid.material.transparent = true;
  addMapObject(grid);

  addWall(0, arena.wallHeight / 2, -arena.halfDepth, arena.width, arena.wallHeight, 0.9);
  addWall(0, arena.wallHeight / 2, arena.halfDepth, arena.width, arena.wallHeight, 0.9);
  addWall(-arena.halfWidth, arena.wallHeight / 2, 0, 0.9, arena.wallHeight, arena.depth);
  addWall(arena.halfWidth, arena.wallHeight / 2, 0, 0.9, arena.wallHeight, arena.depth);

  addObstacle(-34, 1.25, -20, 24, 2.5, 5, materials.crate);
  addObstacle(34, 1.25, 20, 24, 2.5, 5, materials.crate);
  addObstacle(-30, 1.4, 14, 6, 2.8, 22, materials.wallDark);
  addObstacle(30, 1.4, -14, 6, 2.8, 22, materials.wallDark);
  addObstacle(0, 2.1, 0, 18, 4.2, 12, materials.wallDark);
  addObstacle(0, 4.45, 0, 14, 0.7, 8, materials.wallTrim);
  addObstacle(-13, 0.9, 0, 8, 1.8, 4, materials.ramp);
  addObstacle(13, 0.9, 0, 8, 1.8, 4, materials.ramp);
  addObstacle(-6, 0.75, -26, 36, 1.5, 4, materials.wallTrim);
  addObstacle(6, 0.75, 26, 36, 1.5, 4, materials.wallTrim);
  addObstacle(-44, 0.9, 0, 5, 1.8, 18, materials.crate);
  addObstacle(44, 0.9, 0, 5, 1.8, 18, materials.crate);

  for (const x of [-20, 0, 20]) {
    addObstacle(x, 0.55, -12, 5, 1.1, 5, materials.crate);
    addObstacle(x, 0.55, 12, 5, 1.1, 5, materials.crate);
  }
}

function addRooftopDuelArena() {
  setArenaDimensions(116, 86, 9.2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(arena.width, arena.depth, 38, 28), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  addMapObject(floor);

  const grid = new THREE.GridHelper(arena.width, 58, 0xffffff, 0xcfd6d9);
  grid.position.y = 0.025;
  grid.material.opacity = 0.32;
  grid.material.transparent = true;
  addMapObject(grid);

  addWall(0, arena.wallHeight / 2, -arena.halfDepth, arena.width, arena.wallHeight, 0.9);
  addWall(0, arena.wallHeight / 2, arena.halfDepth, arena.width, arena.wallHeight, 0.9);
  addWall(-arena.halfWidth, arena.wallHeight / 2, 0, 0.9, arena.wallHeight, arena.depth);
  addWall(arena.halfWidth, arena.wallHeight / 2, 0, 0.9, arena.wallHeight, arena.depth);

  addBuilding(0, 6, 0, 24, 12, 22);
  addObstacle(-28, 1.1, -18, 26, 2.2, 5, materials.ramp);
  addObstacle(28, 1.1, 18, 26, 2.2, 5, materials.ramp);
  addObstacle(-14, 3.6, -8, 8, 7.2, 6, materials.wallDark);
  addObstacle(14, 3.6, 8, 8, 7.2, 6, materials.wallDark);
  addObstacle(-44, 1.2, 20, 18, 2.4, 6, materials.crate);
  addObstacle(44, 1.2, -20, 18, 2.4, 6, materials.crate);
  addObstacle(-42, 2.4, -26, 8, 4.8, 14, materials.wallDark);
  addObstacle(42, 2.4, 26, 8, 4.8, 14, materials.wallDark);
  addObstacle(0, 0.85, -34, 34, 1.7, 4, materials.wallTrim);
  addObstacle(0, 0.85, 34, 34, 1.7, 4, materials.wallTrim);

  addLadder(-14, -13.25, 12, "z");
  addLadder(14, 13.25, 12, "z");
  addLadder(-42, -18, 4.8, "z");
  addLadder(42, 18, 4.8, "z");
}

function addLadder(x, z, topHeight, axis = "z") {
  const ladder = new THREE.Group();
  const ladderMaterial = materials.wallTrim;
  const railHeight = topHeight + 0.7;
  const railOffset = 0.62;
  const railGeometry = new THREE.BoxGeometry(0.12, railHeight, 0.12);
  const rungGeometry = axis === "z"
    ? new THREE.BoxGeometry(1.5, 0.11, 0.14)
    : new THREE.BoxGeometry(0.14, 0.11, 1.5);

  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(railGeometry, ladderMaterial);
    rail.position.set(axis === "z" ? side * railOffset : 0, railHeight / 2, axis === "z" ? 0 : side * railOffset);
    rail.castShadow = true;
    ladder.add(rail);
  }

  const rungCount = Math.floor(topHeight / 1.15);
  for (let index = 0; index <= rungCount; index += 1) {
    const rung = new THREE.Mesh(rungGeometry, ladderMaterial);
    rung.position.y = 0.65 + index * 1.15;
    rung.castShadow = true;
    ladder.add(rung);
  }

  ladder.position.set(x, 0, z);
  addMapObject(ladder);

  addLadderClimbCollision(x, z, topHeight, axis);
}

function addLadderClimbCollision(x, z, topHeight, axis = "z") {
  climbZones.push({
    x,
    z,
    width: axis === "z" ? 2.4 : 1.35,
    depth: axis === "z" ? 1.35 : 2.4,
    top: topHeight
  });
}

function addBuilding(x, y, z, width, height, depth) {
  const building = addObstacle(x, y, z, width, height, depth, materials.wallDark);
  const palette = [0x66f6ff, 0xff5fd6, 0xffd76b, 0x8dffb2];
  const color = palette[Math.abs(Math.round(x + z + height)) % palette.length];
  const windowMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.68 });
  const trimMaterial = [materials.neonCyan, materials.neonPink, materials.neonGold][Math.abs(Math.round(x - z)) % 3];
  const rows = Math.max(2, Math.floor(height / 4));
  const cols = Math.max(2, Math.floor(width / 4));

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const windowPane = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.82, 0.045), windowMaterial);
      windowPane.position.set(
        x - width / 2 + 2 + col * ((width - 4) / Math.max(cols - 1, 1)),
        y - height / 2 + 2.2 + row * 3.1,
        z - depth / 2 - 0.03
      );
      addMapObject(windowPane);

      if (depth > 10 && col % 2 === 0) {
        const sidePane = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.72, 0.9), windowMaterial);
        sidePane.position.set(
          x + width / 2 + 0.03,
          y - height / 2 + 2.2 + row * 3.1,
          z - depth / 2 + 2 + col * ((depth - 4) / Math.max(cols - 1, 1))
        );
        addMapObject(sidePane);
      }
    }
  }

  addBuildingNeonTrim(x, y, z, width, height, depth, trimMaterial, color);
  return building;
}

function addBuildingNeonTrim(x, y, z, width, height, depth, material, color) {
  const frontZ = z - depth / 2 - 0.07;
  const topY = y + height / 2 + 0.08;
  const bottomY = y - height / 2 + 0.7;

  const topStrip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.78, 0.12, 0.08), material);
  topStrip.position.set(x, topY, frontZ);
  addMapObject(topStrip);

  for (const side of [-1, 1]) {
    const verticalStrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, Math.max(1.5, height * 0.72), 0.08), material);
    verticalStrip.position.set(x + side * (width / 2 - 0.65), y + 0.25, frontZ);
    addMapObject(verticalStrip);
  }

  if (height >= 16) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(width * 0.42, 0.7, 0.09), material);
    sign.position.set(x, bottomY + height * 0.42, frontZ - 0.02);
    addMapObject(sign);

    const roofLight = new THREE.PointLight(color, 18, 20);
    roofLight.position.set(x, topY + 0.8, z);
    addMapObject(roofLight);
  }
}

function setArenaDimensions(width, depth, wallHeight) {
  arena.width = width;
  arena.depth = depth;
  arena.wallHeight = wallHeight;
  arena.halfWidth = width / 2;
  arena.halfDepth = depth / 2;
}

function addMapObject(object) {
  object.userData.mapObject = true;
  scene.add(object);
  mapObjects.push(object);
  return object;
}

function clearMap() {
  while (mapObjects.length > 0) {
    const object = mapObjects.pop();
    scene.remove(object);
    object.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
    });
  }

  obstacles.length = 0;
  climbZones.length = 0;
}

function loadMap(index = 0) {
  clearMap();

  if (index === 1) {
    addSkylineArena();
    spawnPoint.set(54, 0, -38);
    enemySpawnPoint.set(-54, 0, 38);
  } else if (index === 2) {
    addNeonDocksArena();
    spawnPoint.set(40, 0, -26);
    enemySpawnPoint.set(-40, 0, 26);
  } else if (index === 3) {
    addRooftopDuelArena();
    spawnPoint.set(46, 0, -32);
    enemySpawnPoint.set(-46, 0, 32);
  } else {
    addArena();
    spawnPoint.set(34, 0, -28);
    enemySpawnPoint.set(-32, 0, 24);
  }

  player.position.copy(spawnPoint);
  player.position.y = 0;
  verticalVelocity = 0;
  isGrounded = true;

  const enemy = enemies[0];
  if (enemy) {
    enemy.position.copy(enemySpawnPoint);
    enemy.position.y = 0;
    enemy.userData.health = 100;
    enemy.userData.lastSeen.copy(spawnPoint);
    enemy.userData.lastX = enemySpawnPoint.x;
    enemy.userData.lastZ = enemySpawnPoint.z;
    enemy.userData.grounded = true;
    enemy.userData.verticalVelocity = 0;
    enemy.userData.knockbackX = 0;
    enemy.userData.knockbackZ = 0;
    enemy.visible = true;
  }

  updateCombatHud();
}

function addWall(x, y, z, width, height, depth) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), materials.wall);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  addMapObject(wall);
}

function addObstacle(x, y, z, width, height, depth, material = materials.crate) {
  const obstacle = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  obstacle.position.set(x, y, z);
  obstacle.castShadow = true;
  obstacle.receiveShadow = true;
  addMapObject(obstacle);

  obstacles.push({
    x,
    z,
    width,
    depth,
    height,
    top: y + height / 2
  });

  return obstacle;
}

function addTrim(x, y, z, width, height, depth) {
  const trim = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), materials.wallTrim);
  trim.position.set(x, y, z);
  addMapObject(trim);
}

function addPlayer() {
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 1.18, 8, 16), materials.player);
  body.position.y = 1.34;
  body.scale.set(0.92, 1.08, 0.82);
  body.castShadow = true;
  player.add(body);

  addCamoPatch(0.36, 1.58, -0.43, 0.34, 0.18, 0.04, materials.camoGreen);
  addCamoPatch(-0.34, 1.25, -0.44, 0.28, 0.16, 0.04, materials.camoDark);
  addCamoPatch(0.16, 0.95, -0.43, 0.24, 0.13, 0.04, materials.camoGreen);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.52), materials.vest);
  chest.position.set(0, 1.5, -0.08);
  chest.castShadow = true;
  player.add(chest);

  addHumanoidDetails(player, materials.player, false);

  for (let index = 0; index < 5; index += 1) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.2, 0.1), materials.camoDark);
    pouch.position.set(-0.38 + index * 0.19, 1.36, -0.44);
    pouch.castShadow = true;
    player.add(pouch);
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.2, 14), materials.skin);
  neck.position.y = 2.02;
  player.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), materials.skin);
  head.position.y = 2.4;
  head.scale.set(0.88, 1.04, 0.84);
  head.castShadow = true;
  player.add(head);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.39, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), materials.player);
  helmet.position.y = 2.52;
  helmet.scale.set(1.02, 0.74, 0.98);
  helmet.castShadow = true;
  player.add(helmet);

  addCamoPatch(0.16, 2.62, -0.22, 0.18, 0.08, 0.04, materials.camoGreen);
  addCamoPatch(-0.18, 2.56, -0.29, 0.18, 0.08, 0.04, materials.camoDark);

  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.1), materials.visor);
  goggles.position.set(0, 2.38, -0.34);
  player.add(goggles);

  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 0.12), materials.camoDark);
  mask.position.set(0, 2.2, -0.34);
  player.add(mask);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.09), materials.skin);
  nose.position.set(0, 2.32, -0.47);
  player.add(nose);

  addArm(-0.66, 1.58, -0.34, 0.08);
  addArm(0.66, 1.58, -0.34, -0.08);
  addLeg(-0.24);
  addLeg(0.24);

  const gun = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 1.85), materials.gun);
  barrel.position.z = -0.86;
  barrel.castShadow = true;
  gun.add(barrel);

  const upperRail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 1.3), materials.gun);
  upperRail.position.set(0, 0.16, -0.64);
  gun.add(upperRail);

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.6), materials.gun);
  stock.position.set(0, -0.03, 0.31);
  stock.castShadow = true;
  gun.add(stock);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.42, 0.18), materials.gun);
  grip.position.set(0, -0.3, -0.15);
  grip.rotation.x = -0.22;
  gun.add(grip);

  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.58, 16), materials.visor);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, 0.32, -0.58);
  scope.name = "weaponScope";
  gun.add(scope);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), materials.muzzle);
  muzzle.position.z = -1.82;
  muzzle.name = "muzzle";
  gun.add(muzzle);

  gun.position.set(0.44, 1.68, -0.66);
  gun.rotation.x = -0.04;
  gun.name = "gun";
  player.add(gun);

  player.position.copy(spawnPoint);
  scene.add(player);
}

function addEnemy() {
  const enemy = new THREE.Group();
  enemy.userData = {
    health: 100,
    fireCooldown: 0.3,
    rifleAmmo: rifleMagazineSize,
    rifleReload: 0,
    sniperAmmo: sniperMagazineSize,
    sniperBoltCooldown: 0,
    sniperMagazineReload: 0,
    shotgunAmmo: shotgunMagazineSize,
    shotgunReload: 0,
    pistolAmmo: pistolMagazineSize,
    pistolReload: 0,
    launcherAmmo: launcherMagazineSize,
    launcherReload: 0,
    molotovCooldown: 4,
    verticalVelocity: 0,
    grounded: true,
    weapon: 0,
    respawnTimer: 0,
    strafeSign: 1,
    stuckTimer: 0,
    unstuckTimer: 0,
    avoidX: 0,
    avoidZ: 0,
    knockbackX: 0,
    knockbackZ: 0,
    lastX: enemySpawnPoint.x,
    lastZ: enemySpawnPoint.z,
    state: "hunt",
    memory: 0,
    lastSeen: spawnPoint.clone(),
    flankTimer: 0,
    aimError: 0,
    tacticalTimer: 0,
    coverTimer: 0,
    aggression: 0.82,
    reactionDelay: 0.08,
    weapons: enemyEquippedWeapons.slice(0, 2)
  };

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 1.18, 8, 16), materials.enemyPlayer);
  body.position.y = 1.34;
  body.scale.set(0.92, 1.08, 0.82);
  body.castShadow = true;
  enemy.add(body);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.52), materials.vest);
  chest.position.set(0, 1.5, -0.08);
  chest.castShadow = true;
  enemy.add(chest);

  addHumanoidDetails(enemy, materials.enemyPlayer, true);

  const marker = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.08), materials.enemyMark);
  marker.position.set(0, 1.76, -0.38);
  enemy.add(marker);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.2, 14), materials.skin);
  neck.position.y = 2.06;
  enemy.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), materials.skin);
  head.position.y = 2.4;
  head.scale.set(0.88, 1.04, 0.84);
  head.castShadow = true;
  enemy.add(head);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.39, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), materials.enemyPlayer);
  helmet.position.y = 2.52;
  helmet.scale.set(1.02, 0.74, 0.98);
  helmet.castShadow = true;
  enemy.add(helmet);

  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.1), materials.visor);
  goggles.position.set(0, 2.42, -0.32);
  enemy.add(goggles);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.09), materials.skin);
  nose.position.set(0, 2.32, -0.46);
  enemy.add(nose);

  addArm(-0.66, 1.58, -0.34, 0.08, enemy, materials.enemyPlayer);
  addArm(0.66, 1.58, -0.34, -0.08, enemy, materials.enemyPlayer);
  addLeg(-0.24, enemy, materials.enemyPlayer);
  addLeg(0.24, enemy, materials.enemyPlayer);

  const gun = createGun();
  gun.position.set(0.44, 1.68, -0.66);
  gun.rotation.x = -0.04;
  gun.name = "gun";
  enemy.add(gun);

  enemy.position.copy(enemySpawnPoint);
  enemy.rotation.y = Math.PI * 0.8;
  scene.add(enemy);
  enemies.push(enemy);
}

function addFirstPersonViewModel() {
  viewModel.name = "firstPersonViewModel";
  viewModel.position.set(0.12, -0.42, -0.82);

  viewModel.add(createViewForearm("leftArm", -1));
  viewModel.add(createViewForearm("rightArm", 1));
  viewModel.add(createViewHand("leftHand", -1));
  viewModel.add(createViewHand("rightHand", 1));

  const rifle = createRifleViewModel();
  const sniper = createSniperViewModel();
  const molotov = createMolotovViewModel();
  const shotgun = createShotgunViewModel();
  const pistol = createPistolViewModel();
  const launcher = createLauncherViewModel();
  weaponViewModels.push(rifle, sniper, molotov, shotgun, pistol, launcher);
  viewModel.add(rifle);
  viewModel.add(sniper);
  viewModel.add(molotov);
  viewModel.add(shotgun);
  viewModel.add(pistol);
  viewModel.add(launcher);

  camera.add(viewModel);
  scene.add(camera);
  updateWeaponViewModel();
}

function createViewForearm(name, side) {
  const arm = new THREE.Group();
  arm.name = name;

  const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.92, 10, 14), materials.viewSleeve);
  sleeve.rotation.x = Math.PI / 2;
  sleeve.scale.set(1.12, 1, 0.86);
  arm.add(sleeve);

  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.105, 0.08, 16), materials.viewGlove);
  cuff.rotation.x = Math.PI / 2;
  cuff.position.z = -0.5;
  arm.add(cuff);

  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.66), materials.viewGlove);
  seam.position.set(side * 0.075, -0.088, -0.08);
  arm.add(seam);

  return arm;
}

function createViewHand(name, side) {
  const hand = new THREE.Group();
  hand.name = name;

  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), materials.viewSkin);
  palm.name = "palm";
  palm.scale.set(1.22, 0.48, 0.76);
  palm.rotation.set(0.08, side * 0.2, side * 0.16);
  hand.add(palm);

  const knucklePad = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.03, 0.07), materials.viewGlove);
  knucklePad.position.set(0, 0.02, -0.07);
  knucklePad.rotation.z = side * 0.04;
  hand.add(knucklePad);

  const wristWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.08, 16), materials.viewGlove);
  wristWrap.rotation.x = Math.PI / 2;
  wristWrap.position.z = 0.105;
  hand.add(wristWrap);

  addGripFingers(hand, side);
  return hand;
}

function addGripFingers(hand, side) {
  const fingerOffsets = [-0.066, -0.022, 0.022, 0.064];

  for (let index = 0; index < 4; index += 1) {
    const finger = new THREE.Group();
    const length = index === 1 || index === 2 ? 0.115 : 0.098;
    const base = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, length, 8, 8), materials.viewSkin);
    base.position.set(side * fingerOffsets[index], -0.018, -0.12);
    base.rotation.set(1.22, side * 0.1, side * (0.16 - index * 0.04));
    finger.add(base);

    const tip = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, length * 0.72, 8, 8), materials.viewSkin);
    tip.position.set(side * fingerOffsets[index], -0.032, -0.19);
    tip.rotation.set(1.55, side * 0.08, side * (0.12 - index * 0.03));
    finger.add(tip);

    const fingertip = new THREE.Mesh(new THREE.SphereGeometry(0.023, 10, 8), materials.viewSkin);
    fingertip.position.set(side * fingerOffsets[index], -0.045, -0.235);
    fingertip.scale.set(1, 0.74, 1);
    finger.add(fingertip);

    hand.add(finger);
  }

  const thumb = new THREE.Group();
  const thumbBase = new THREE.Mesh(new THREE.CapsuleGeometry(0.027, 0.13, 8, 8), materials.viewSkin);
  thumbBase.position.set(side * 0.105, -0.022, -0.025);
  thumbBase.rotation.set(0.82, side * -0.82, side * -0.48);
  thumb.add(thumbBase);

  const thumbTip = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.105, 8, 8), materials.viewSkin);
  thumbTip.position.set(side * 0.14, -0.036, -0.095);
  thumbTip.rotation.set(1.1, side * -0.65, side * -0.42);
  thumb.add(thumbTip);

  hand.add(thumb);
}

function createRifleViewModel() {
  const gun = new THREE.Group();
  gun.name = "viewRifle";
  gun.position.set(0.12, -0.07, -0.78);
  gun.rotation.set(-0.035, -0.018, 0.012);

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.72), materials.viewGun);
  receiver.position.set(0, 0, 0.1);
  gun.add(receiver);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.044, 1.12, 14), materials.viewGun);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.035, -0.68);
  gun.add(barrel);

  const muzzleMarker = new THREE.Object3D();
  muzzleMarker.name = "viewMuzzle";
  muzzleMarker.position.set(0, 0.035, -1.28);
  gun.add(muzzleMarker);

  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.62), materials.viewWood);
  handguard.position.set(0, -0.025, -0.38);
  gun.add(handguard);

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.38), materials.viewGun);
  stock.position.set(0, -0.02, 0.56);
  gun.add(stock);

  const sightPost = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.04), materials.viewGun);
  sightPost.position.set(0, 0.16, -1.12);
  gun.add(sightPost);

  const sightRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.008, 8, 24), materials.viewGun);
  sightRing.position.set(0, 0.18, -1.06);
  sightRing.rotation.y = Math.PI / 2;
  gun.add(sightRing);

  const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.38, 0.2), materials.viewGun);
  magazine.position.set(0, -0.27, 0.05);
  magazine.rotation.x = -0.16;
  gun.add(magazine);

  const pistolGrip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.32, 0.12), materials.viewGun);
  pistolGrip.position.set(0.03, -0.23, 0.26);
  pistolGrip.rotation.x = -0.28;
  gun.add(pistolGrip);

  return gun;
}

function createSniperViewModel() {
  const gun = new THREE.Group();
  gun.name = "viewSniper";
  gun.position.set(0.1, -0.08, -0.98);
  gun.rotation.set(-0.035, -0.012, 0.01);

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 1.08), materials.viewGun);
  mainBody.position.set(0, 0.01, -0.15);
  gun.add(mainBody);

  const cheekRest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.42), materials.viewGun);
  cheekRest.position.set(0, 0.08, 0.5);
  gun.add(cheekRest);

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.19, 0.52), materials.viewGun);
  stock.position.set(0, -0.04, 0.78);
  stock.rotation.x = 0.08;
  gun.add(stock);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 1.7, 18), materials.viewGun);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.04, -1.18);
  gun.add(barrel);

  const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.44, 18), materials.viewGun);
  suppressor.rotation.x = Math.PI / 2;
  suppressor.position.set(0, 0.04, -2.05);
  gun.add(suppressor);

  const muzzleMarker = new THREE.Object3D();
  muzzleMarker.name = "viewMuzzle";
  muzzleMarker.position.set(0, 0.04, -2.32);
  gun.add(muzzleMarker);

  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.035, 0.9), materials.viewGun);
  rail.position.set(0, 0.13, -0.22);
  gun.add(rail);

  const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.78, 24), materials.visor);
  scopeTube.rotation.x = Math.PI / 2;
  scopeTube.position.set(0, 0.25, -0.18);
  gun.add(scopeTube);

  const scopeFront = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.08, 0.12, 24), materials.visor);
  scopeFront.rotation.x = Math.PI / 2;
  scopeFront.position.set(0, 0.25, -0.62);
  gun.add(scopeFront);

  const scopeBack = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.1, 24), materials.visor);
  scopeBack.rotation.x = Math.PI / 2;
  scopeBack.position.set(0, 0.25, 0.27);
  gun.add(scopeBack);

  const mountFront = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.05), materials.viewGun);
  mountFront.position.set(0, 0.18, -0.42);
  gun.add(mountFront);

  const mountBack = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.05), materials.viewGun);
  mountBack.position.set(0, 0.18, 0.08);
  gun.add(mountBack);

  const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 0.05), materials.viewGun);
  bolt.position.set(0.16, 0.06, 0.22);
  bolt.rotation.z = -0.35;
  gun.add(bolt);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.34, 0.13), materials.viewGun);
  grip.position.set(0.02, -0.24, 0.28);
  grip.rotation.x = -0.24;
  gun.add(grip);

  const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.18), materials.viewGun);
  magazine.position.set(0, -0.23, -0.04);
  magazine.rotation.x = -0.1;
  gun.add(magazine);

  const foregripRest = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.1, 0.52), materials.viewWood);
  foregripRest.position.set(0, -0.06, -0.72);
  gun.add(foregripRest);

  return gun;
}

function createMolotovViewModel() {
  const held = new THREE.Group();
  held.name = "viewMolotov";
  held.position.set(0.08, -0.18, -0.62);
  held.rotation.set(-0.45, 0.2, -0.34);

  const bottle = createMolotovModel(0.62);
  bottle.rotation.z = 0.1;
  held.add(bottle);

  const gripHand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 10), materials.viewGlove);
  gripHand.position.set(0.02, -0.05, 0.08);
  gripHand.scale.set(1.15, 0.78, 0.88);
  held.add(gripHand);

  return held;
}

function createShotgunViewModel() {
  const gun = new THREE.Group();
  gun.name = "viewShotgun";
  gun.position.set(0.1, -0.08, -0.82);
  gun.rotation.set(-0.04, -0.018, 0.012);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.82), materials.viewGun);
  body.position.set(0, 0.01, -0.02);
  gun.add(body);

  const pump = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.12, 0.5), materials.viewWood);
  pump.position.set(0, -0.08, -0.48);
  gun.add(pump);

  const barrelA = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.02, 14), materials.viewGun);
  barrelA.rotation.x = Math.PI / 2;
  barrelA.position.set(-0.045, 0.06, -0.72);
  gun.add(barrelA);

  const barrelB = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.02, 14), materials.viewGun);
  barrelB.rotation.x = Math.PI / 2;
  barrelB.position.set(0.045, 0.06, -0.72);
  gun.add(barrelB);

  const muzzleMarker = new THREE.Object3D();
  muzzleMarker.name = "viewMuzzle";
  muzzleMarker.position.set(0, 0.06, -1.28);
  gun.add(muzzleMarker);

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.42), materials.viewWood);
  stock.position.set(0, -0.02, 0.58);
  gun.add(stock);

  return gun;
}

function createPistolViewModel() {
  const gun = new THREE.Group();
  gun.name = "viewPistol";
  gun.position.set(0.18, -0.1, -0.62);
  gun.rotation.set(-0.02, -0.04, 0.02);

  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.52), materials.viewGun);
  slide.position.set(0, 0.06, -0.16);
  gun.add(slide);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.11, 0.36), materials.viewGun);
  frame.position.set(0, -0.02, -0.04);
  gun.add(frame);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.42, 12), materials.viewGun);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.065, -0.46);
  gun.add(barrel);

  const muzzleMarker = new THREE.Object3D();
  muzzleMarker.name = "viewMuzzle";
  muzzleMarker.position.set(0, 0.065, -0.7);
  gun.add(muzzleMarker);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.14), materials.viewGun);
  grip.position.set(0.02, -0.24, 0.12);
  grip.rotation.x = -0.22;
  gun.add(grip);

  return gun;
}

function createLauncherViewModel() {
  const gun = new THREE.Group();
  gun.name = "viewLauncher";
  gun.position.set(0.03, -0.12, -1.02);
  gun.rotation.set(-0.06, -0.03, 0.03);

  const rearCone = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.1, 0.36, 24), materials.viewGun);
  rearCone.rotation.x = Math.PI / 2;
  rearCone.position.set(0, 0.02, 0.78);
  gun.add(rearCone);

  const rearWood = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.13, 0.92, 22), materials.viewWood);
  rearWood.rotation.x = Math.PI / 2;
  rearWood.position.set(0, 0.02, 0.28);
  gun.add(rearWood);

  const rearBandA = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.08, 22), materials.viewGun);
  rearBandA.rotation.x = Math.PI / 2;
  rearBandA.position.set(0, 0.02, 0.75);
  gun.add(rearBandA);

  const rearBandB = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 22), materials.viewGun);
  rearBandB.rotation.x = Math.PI / 2;
  rearBandB.position.set(0, 0.02, -0.18);
  gun.add(rearBandB);

  const centerTube = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.115, 0.82, 24), materials.viewGun);
  centerTube.rotation.x = Math.PI / 2;
  centerTube.position.set(0, 0.02, -0.58);
  gun.add(centerTube);

  const frontNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.095, 0.42, 20), materials.viewGun);
  frontNeck.rotation.x = Math.PI / 2;
  frontNeck.position.set(0, 0.02, -1.18);
  gun.add(frontNeck);

  const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.72, 28), materials.camoDark);
  warhead.rotation.x = -Math.PI / 2;
  warhead.position.set(0, 0.02, -1.78);
  gun.add(warhead);

  const warheadBase = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.13, 0.16, 20), materials.viewGun);
  warheadBase.rotation.x = Math.PI / 2;
  warheadBase.position.set(0, 0.02, -1.42);
  gun.add(warheadBase);

  const muzzleMarker = new THREE.Object3D();
  muzzleMarker.name = "viewMuzzle";
  muzzleMarker.position.set(0, 0.02, -2.12);
  gun.add(muzzleMarker);

  const triggerGrip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.32, 0.13), materials.viewWood);
  triggerGrip.position.set(-0.03, -0.21, -0.36);
  triggerGrip.rotation.x = -0.24;
  gun.add(triggerGrip);

  const foreGrip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.12), materials.viewWood);
  foreGrip.position.set(0.02, -0.24, -0.92);
  foreGrip.rotation.x = -0.08;
  gun.add(foreGrip);

  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.01, 8, 20, Math.PI * 1.25), materials.viewGun);
  triggerGuard.position.set(-0.03, -0.09, -0.43);
  triggerGuard.rotation.set(0.2, 0, Math.PI * 0.5);
  gun.add(triggerGuard);

  const sightPost = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.08), materials.viewGun);
  sightPost.position.set(0.08, 0.22, -0.72);
  sightPost.rotation.z = -0.15;
  gun.add(sightPost);

  const sightTube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.22, 16), materials.visor);
  sightTube.rotation.x = Math.PI / 2;
  sightTube.position.set(0.12, 0.31, -0.78);
  gun.add(sightTube);

  const smallBox = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.18), materials.viewGun);
  smallBox.position.set(-0.08, 0.18, -0.62);
  gun.add(smallBox);

  return gun;
}

function createMolotovModel(scale = 1) {
  const model = new THREE.Group();
  model.scale.setScalar(scale);

  const lowerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.18, 18), materials.molotovGlass);
  lowerBody.position.y = -0.24;
  lowerBody.castShadow = true;
  model.add(lowerBody);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.56, 24), materials.molotovGlass);
  body.position.y = 0.02;
  body.castShadow = true;
  model.add(body);

  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), materials.molotovGlass);
  shoulder.position.y = 0.31;
  shoulder.scale.set(0.9, 0.55, 0.9);
  shoulder.castShadow = true;
  model.add(shoulder);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.32, 18), materials.molotovGlass);
  neck.position.y = 0.53;
  neck.castShadow = true;
  model.add(neck);

  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.07, 18), materials.molotovGlass);
  lip.position.y = 0.72;
  model.add(lip);

  const label = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.012), materials.molotovLabel);
  label.position.set(0, 0.02, -0.188);
  label.rotation.x = 0.04;
  model.add(label);

  const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.08), materials.molotovCloth);
  cloth.position.set(0.03, 0.82, -0.01);
  cloth.rotation.set(0.08, 0.16, -0.36);
  cloth.castShadow = true;
  model.add(cloth);

  const wick = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.22, 8, 8), materials.molotovCloth);
  wick.position.set(0.12, 0.87, -0.02);
  wick.rotation.set(1.2, 0.18, -0.86);
  model.add(wick);

  const glow = new THREE.PointLight(0xff5b2c, 1.2, 1.2);
  glow.position.set(0.03, 0.74, 0);
  model.add(glow);

  return model;
}

function createGun() {
  const gun = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 1.85), materials.gun);
  barrel.position.z = -0.86;
  barrel.castShadow = true;
  gun.add(barrel);

  const upperRail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 1.3), materials.gun);
  upperRail.position.set(0, 0.16, -0.64);
  gun.add(upperRail);

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.6), materials.gun);
  stock.position.set(0, -0.03, 0.31);
  stock.castShadow = true;
  gun.add(stock);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.42, 0.18), materials.gun);
  grip.position.set(0, -0.3, -0.15);
  grip.rotation.x = -0.22;
  gun.add(grip);

  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.58, 16), materials.visor);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, 0.32, -0.58);
  scope.name = "weaponScope";
  gun.add(scope);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), materials.muzzle);
  muzzle.position.z = -1.82;
  muzzle.name = "muzzle";
  gun.add(muzzle);

  return gun;
}

function addCamoPatch(x, y, z, width, height, depth, material, target = player) {
  const patch = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  patch.position.set(x, y, z);
  patch.rotation.z = (Math.random() - 0.5) * 0.6;
  target.add(patch);
}

function addHumanoidDetails(target, uniformMaterial, enemy = false) {
  const shoulder = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.9, 8, 14), uniformMaterial);
  shoulder.position.set(0, 1.92, -0.03);
  shoulder.rotation.z = Math.PI / 2;
  shoulder.scale.set(1, 0.9, 0.72);
  shoulder.castShadow = true;
  target.add(shoulder);

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.26, 0.46), materials.vest);
  pelvis.position.set(0, 0.92, 0.01);
  pelvis.castShadow = true;
  target.add(pelvis);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.12, 0.5), materials.camoDark);
  belt.position.set(0, 1.08, -0.02);
  belt.castShadow = true;
  target.add(belt);

  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.08), enemy ? materials.enemyMark : materials.camoGreen);
  chestPlate.position.set(0, 1.58, -0.38);
  chestPlate.castShadow = true;
  target.add(chestPlate);

  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), materials.skin);
    ear.position.set(side * 0.3, 2.39, -0.02);
    ear.scale.set(0.7, 1, 0.5);
    target.add(ear);

    const hipPad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.18), materials.camoDark);
    hipPad.position.set(side * 0.42, 0.95, -0.08);
    hipPad.castShadow = true;
    target.add(hipPad);
  });
}

function addArm(x, y, z, tilt, target = player, material = materials.player) {
  const side = x < 0 ? -1 : 1;
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), material);
  shoulder.position.set(side * 0.62, y + 0.17, z + 0.2);
  shoulder.scale.set(1.08, 0.86, 0.9);
  shoulder.castShadow = true;
  target.add(shoulder);

  const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.7, 6, 10), material);
  upperArm.position.set(x * 0.72, y, z + 0.16);
  upperArm.rotation.z = x < 0 ? -0.58 : 0.58;
  upperArm.rotation.x = -1.08 + tilt;
  upperArm.castShadow = true;
  target.add(upperArm);

  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), materials.camoDark);
  elbow.position.set(x * 0.6, y - 0.06, z - 0.22);
  elbow.scale.set(0.9, 0.86, 1.15);
  elbow.castShadow = true;
  target.add(elbow);

  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.72, 6, 10), material);
  forearm.position.set(x * 0.58, y - 0.1, z - 0.36);
  forearm.rotation.z = x < 0 ? -0.28 : 0.28;
  forearm.rotation.x = -1.34 + tilt;
  forearm.castShadow = true;
  target.add(forearm);

  const glove = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), materials.vest);
  glove.position.set(x * 0.5, y - 0.16, z - 0.72);
  glove.scale.set(1.05, 0.72, 1.24);
  glove.castShadow = true;
  target.add(glove);

  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.24), materials.vest);
  palm.position.set(x * 0.47, y - 0.18, z - 0.83);
  palm.rotation.x = -0.42 + tilt;
  palm.rotation.z = side * 0.16;
  palm.castShadow = true;
  target.add(palm);

  for (let index = 0; index < 3; index += 1) {
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.16), materials.camoDark);
    finger.position.set(x * 0.47 + side * (-0.045 + index * 0.045), y - 0.2, z - 0.98);
    finger.rotation.x = -0.5 + tilt;
    finger.castShadow = true;
    target.add(finger);
  }
}

function addLeg(x, target = player, material = materials.player) {
  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), material);
  hip.position.set(x, 1.02, 0.02);
  hip.scale.set(0.9, 0.75, 1);
  hip.castShadow = true;
  target.add(hip);

  const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.82, 6, 10), material);
  thigh.position.set(x, 0.82, 0.02);
  thigh.rotation.x = x < 0 ? 0.08 : -0.04;
  thigh.castShadow = true;
  target.add(thigh);

  const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.78, 6, 10), material);
  shin.position.set(x, 0.26, -0.04);
  shin.rotation.x = x < 0 ? -0.06 : 0.08;
  shin.castShadow = true;
  target.add(shin);

  const knee = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.12), materials.vest);
  knee.position.set(x, 0.55, -0.2);
  knee.castShadow = true;
  target.add(knee);

  const boot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.5), materials.vest);
  boot.position.set(x, 0.02, -0.09);
  boot.castShadow = true;
  target.add(boot);

  const toe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.11, 0.26), materials.camoDark);
  toe.position.set(x, 0, -0.36);
  toe.castShadow = true;
  target.add(toe);
}

function spawnBullet(weapon = "rifle", shooter = player, aimYaw = yaw, owner = "player", aimPitch = pitch, aimTargetPosition = null) {
  const bulletStats = {
    rifle: { radius: 0.14, speed: 34, life: 1.6, damage: 8, spread: 0.018 },
    sniper: { radius: 0.09, speed: 74, life: 2.2, damage: 42, spread: 0.004 },
    shotgun: { radius: 0.105, speed: 30, life: 0.72, damage: 9, spread: 0.035 },
    pistol: { radius: 0.1, speed: 42, life: 1.45, damage: 14, spread: 0.012 },
    launcher: { radius: 0.22, speed: 22, life: 2.4, damage: 18, spread: 0.007, explosive: true, blastRadius: 5.2, blastDamage: 48 }
  };
  const stats = bulletStats[weapon] || bulletStats.rifle;
  const radius = stats.radius;
  const bullet = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 10), materials.bullet);
  const muzzle = shooter.getObjectByName("muzzle");

  if (owner === "player") {
    const visibleWeapon = weaponViewModels[activeWeapon];
    const viewMuzzle = visibleWeapon?.getObjectByName("viewMuzzle");
    const aimTarget = tempVector.copy(camera.position).addScaledVector(aimForward, 120);

    if (viewMuzzle) {
      viewMuzzle.getWorldPosition(bullet.position);
    } else {
      bullet.position.copy(camera.position).addScaledVector(aimForward, 0.8);
    }

    if (weapon === "shotgun") {
      direction.set(0, Math.sin(aimPitch), -Math.cos(aimPitch)).normalize();
      direction.applyAxisAngle(upVector, aimYaw);
    } else {
      direction.copy(aimTarget).sub(bullet.position).normalize();
    }
  } else {
    if (muzzle) {
      muzzle.getWorldPosition(bullet.position);
    } else {
      bullet.position.copy(shooter.position).addScaledVector(upVector, 1.6);
    }

    if (aimTargetPosition) {
      direction.copy(aimTargetPosition).sub(bullet.position).normalize();
    } else {
      direction.set(0, Math.sin(aimPitch), -Math.cos(aimPitch)).normalize();
      direction.applyAxisAngle(upVector, aimYaw);
    }
  }

  const enemySpreadMultiplier = owner === "enemy"
    ? weapon === "sniper"
      ? 2.25
      : weapon === "shotgun"
        ? 1.35
        : 4.2
    : 1;
  const playerSpreadMultiplier = owner === "player" && isAiming ? weapon === "shotgun" ? 0.42 : 0.32 : 1;
  const spreadMultiplier = enemySpreadMultiplier * playerSpreadMultiplier;
  applyBulletSpread(direction, stats.spread * spreadMultiplier);
  bullet.userData.velocity = direction.clone().multiplyScalar(stats.speed);
  bullet.userData.life = stats.life;
  bullet.userData.owner = owner;
  bullet.userData.damage = stats.damage;
  bullet.userData.weapon = weapon;
  bullet.userData.explosive = stats.explosive || false;
  bullet.userData.blastRadius = stats.blastRadius || 0;
  bullet.userData.blastDamage = stats.blastDamage || 0;
  bullet.castShadow = true;
  scene.add(bullet);
  bullets.push(bullet);

  if (owner === "player") {
    shotCount += 1;
    shotCountElement.textContent = shotCount;
  }
}

function applyBulletSpread(vector, spread = 0) {
  if (spread <= 0) {
    return;
  }

  const baseYaw = Math.atan2(vector.x, -vector.z);
  const horizontalDistance = Math.max(Math.hypot(vector.x, vector.z), 0.001);
  const basePitch = Math.atan2(vector.y, horizontalDistance);
  const spreadYaw = baseYaw + (Math.random() - 0.5) * spread;
  const spreadPitch = THREE.MathUtils.clamp(basePitch + (Math.random() - 0.5) * spread * 0.58, -1.2, 1.2);

  vector.set(
    Math.sin(spreadYaw) * Math.cos(spreadPitch),
    Math.sin(spreadPitch),
    -Math.cos(spreadYaw) * Math.cos(spreadPitch)
  ).normalize();
}

function spawnShotgunBlast(shooter = player, baseYaw = yaw, owner = "player", basePitch = pitch, aimTargetPosition = null) {
  const pelletCount = 10;
  const spreadMultiplier = owner === "player" && isAiming ? 0.42 : 1;
  for (let index = 0; index < pelletCount; index += 1) {
    const spreadYaw = baseYaw + (Math.random() - 0.5) * 0.34 * spreadMultiplier;
    const spreadPitch = basePitch + (Math.random() - 0.5) * 0.18 * spreadMultiplier;
    spawnBullet("shotgun", shooter, spreadYaw, owner, spreadPitch, aimTargetPosition);
  }
}

function createTrajectoryDots() {
  const dotGeometry = new THREE.SphereGeometry(0.075, 10, 8);

  for (let index = 0; index < 24; index += 1) {
    const dot = new THREE.Mesh(dotGeometry, materials.trajectory);
    dot.visible = false;
    scene.add(dot);
    trajectoryDots.push(dot);
  }
}

function getThrowStart(thrower = player, throwYaw = yaw, forwardDistance = 1.1) {
  tempVector.set(0, 0, -1).applyAxisAngle(upVector, throwYaw);
  return thrower.position.clone()
    .addScaledVector(upVector, 1.62)
    .addScaledVector(tempVector, forwardDistance);
}

function getMolotovThrowPower(owner = "player") {
  if (owner !== "player") {
    return 1;
  }

  return THREE.MathUtils.clamp(1 - molotovHoldTime / 1.8, 0.22, 1);
}

function getThrowVelocity(throwYaw = yaw, power = 1) {
  tempVector.set(0, 0, -1).applyAxisAngle(upVector, throwYaw);
  const shortThrowBoost = 1 + (1 - power) * 1.65;
  const forwardSpeed = 13.5 * power * shortThrowBoost;
  const upwardSpeed = 5.2 + power * 3.6;
  return tempVector.clone().multiplyScalar(forwardSpeed).addScaledVector(upVector, upwardSpeed);
}

function getQuickDropVelocity(throwYaw = yaw) {
  tempVector.set(0, 0, -1).applyAxisAngle(upVector, throwYaw);
  return tempVector.clone().multiplyScalar(6.5).addScaledVector(upVector, -18);
}

function updateTrajectory() {
  const showTrajectory = activeWeapon === 2 && molotovCooldown <= 0;
  const start = getThrowStart();
  const throwVelocity = getThrowVelocity(yaw, getMolotovThrowPower());
  const gravity = 18;

  trajectoryDots.forEach((dot, index) => {
    dot.visible = showTrajectory;

    if (!showTrajectory) {
      return;
    }

    const time = index * 0.075;
    dot.position.copy(start)
      .addScaledVector(throwVelocity, time)
      .addScaledVector(upVector, -0.5 * gravity * time * time);

    if (dot.position.y < 0.08) {
      dot.visible = false;
    }
  });
}

function throwMolotov(thrower = player, throwYaw = yaw, owner = "player", power = getMolotovThrowPower(owner), quickDrop = false) {
  if (owner === "player" && molotovCooldown > 0) {
    return;
  }

  const bottle = new THREE.Group();
  bottle.add(createMolotovModel(0.9));
  bottle.rotation.z = 0.3;
  bottle.position.copy(getThrowStart(thrower, throwYaw, quickDrop ? 0.58 : 1.1));
  bottle.userData.velocity = quickDrop ? getQuickDropVelocity(throwYaw) : getThrowVelocity(throwYaw, power);
  bottle.userData.spin = quickDrop ? new THREE.Vector3(12, 5, 15) : new THREE.Vector3(7, 4, 9);
  bottle.userData.owner = owner;
  scene.add(bottle);
  molotovs.push(bottle);

  if (owner === "player") {
    molotovCooldown = 10;
    updateWeaponHud();
  }
}

function updateMolotovs(delta) {
  const gravity = 18;

  for (let index = molotovs.length - 1; index >= 0; index -= 1) {
    const molotov = molotovs[index];
    molotov.userData.velocity.y -= gravity * delta;
    molotov.position.addScaledVector(molotov.userData.velocity, delta);
    molotov.rotation.x += molotov.userData.spin.x * delta;
    molotov.rotation.y += molotov.userData.spin.y * delta;
    molotov.rotation.z += molotov.userData.spin.z * delta;

    const hitGround = molotov.position.y <= 0.12;
    const hitWall =
      Math.abs(molotov.position.x) >= arena.halfWidth - 0.7 ||
      Math.abs(molotov.position.z) >= arena.halfDepth - 0.7;

    if (hitGround || hitWall) {
      createFireZone(molotov.position, molotov.userData.owner);
      scene.remove(molotov);
      molotov.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
      });
      molotovs.splice(index, 1);
    }
  }
}

function createFireZone(position, owner = "player") {
  const fire = new THREE.Group();
  fire.position.set(
    THREE.MathUtils.clamp(position.x, -arena.halfWidth + 1, arena.halfWidth - 1),
    0.045,
    THREE.MathUtils.clamp(position.z, -arena.halfDepth + 1, arena.halfDepth - 1)
  );
  fire.userData.life = 5;
  fire.userData.owner = owner;
  fire.userData.damageTick = 0;

  const puddle = new THREE.Mesh(new THREE.CircleGeometry(4.1, 48), materials.fire.clone());
  puddle.rotation.x = -Math.PI / 2;
  fire.add(puddle);

  const core = new THREE.Mesh(new THREE.CircleGeometry(2.0, 36), materials.fireCore.clone());
  core.rotation.x = -Math.PI / 2;
  core.position.y = 0.015;
  fire.add(core);

  for (let index = 0; index < 16; index += 1) {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1.05 + Math.random() * 0.72, 8), materials.fireCore.clone());
    const angle = (index / 16) * Math.PI * 2;
    const radius = 0.65 + Math.random() * 2.75;
    flame.position.set(Math.cos(angle) * radius, 0.36, Math.sin(angle) * radius);
    flame.rotation.z = (Math.random() - 0.5) * 0.4;
    fire.add(flame);
  }

  const glow = new THREE.PointLight(0xff6a22, 28, 10);
  glow.position.y = 1.2;
  fire.add(glow);

  scene.add(fire);
  fireZones.push(fire);
}

function updateFireZones(delta) {
  for (let index = fireZones.length - 1; index >= 0; index -= 1) {
    const fire = fireZones[index];
    fire.userData.life -= delta;
    fire.userData.damageTick -= delta;
    const totalLife = fire.userData.totalLife || 5;
    const lifeRatio = Math.max(fire.userData.life / totalLife, 0);
    const pulse = 1 + Math.sin(performance.now() * 0.012 + index) * 0.08;
    fire.scale.setScalar(pulse);

    if (fire.userData.damageTick <= 0) {
      applyFireDamage(fire);
      fire.userData.damageTick = 0.45;
    }

    fire.children.forEach((child) => {
      if (child.material?.opacity !== undefined) {
        child.material.opacity = Math.min(child.material.opacity, lifeRatio * 0.85);
      }
    });

    if (fire.userData.life <= 0) {
      scene.remove(fire);
      fire.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material?.dispose) {
          child.material.dispose();
        }
      });
      fireZones.splice(index, 1);
    }
  }
}

function updateEnemies(delta) {
  enemies.forEach((enemy) => {
    if (!enemy.visible || enemy.userData.health <= 0) {
      return;
    }

    enemy.userData.fireCooldown -= delta;
    enemy.userData.rifleReload = Math.max(0, enemy.userData.rifleReload - delta);
    enemy.userData.sniperBoltCooldown = Math.max(0, enemy.userData.sniperBoltCooldown - delta);
    enemy.userData.sniperMagazineReload = Math.max(0, enemy.userData.sniperMagazineReload - delta);
    enemy.userData.shotgunReload = Math.max(0, enemy.userData.shotgunReload - delta);
    enemy.userData.pistolReload = Math.max(0, enemy.userData.pistolReload - delta);
    enemy.userData.launcherReload = Math.max(0, enemy.userData.launcherReload - delta);
    enemy.userData.molotovCooldown -= delta;
    enemy.userData.flankTimer -= delta;
    enemy.userData.tacticalTimer -= delta;
    enemy.userData.coverTimer -= delta;
    enemy.userData.reactionDelay = Math.max(0, enemy.userData.reactionDelay - delta);
    enemy.userData.unstuckTimer = Math.max(0, enemy.userData.unstuckTimer - delta);

    if (enemy.userData.rifleReload <= 0 && enemy.userData.rifleAmmo <= 0) {
      enemy.userData.rifleAmmo = rifleMagazineSize;
    }

    if (enemy.userData.sniperMagazineReload <= 0 && enemy.userData.sniperAmmo <= 0) {
      enemy.userData.sniperAmmo = sniperMagazineSize;
    }

    if (enemy.userData.shotgunReload <= 0 && enemy.userData.shotgunAmmo <= 0) {
      enemy.userData.shotgunAmmo = shotgunMagazineSize;
    }

    if (enemy.userData.pistolReload <= 0 && enemy.userData.pistolAmmo <= 0) {
      enemy.userData.pistolAmmo = pistolMagazineSize;
    }

    if (enemy.userData.launcherReload <= 0 && enemy.userData.launcherAmmo <= 0) {
      enemy.userData.launcherAmmo = launcherMagazineSize;
    }

    const canSeePlayer = hasLineOfSight(enemy.position, player.position);
    const targetPosition = canSeePlayer ? player.position : getPredictedPlayerPosition(distanceToPlayer(enemy), 14);

    if (canSeePlayer) {
      enemy.userData.state = "attack";
      enemy.userData.memory = 14;
      enemy.userData.lastSeen.copy(getPredictedPlayerPosition(distanceToPlayer(enemy), 20));
    } else {
      enemy.userData.memory = 6;
      enemy.userData.lastSeen.copy(player.position);
      enemy.userData.state = "hunt";
    }

    enemyAimVector.copy(targetPosition).sub(enemy.position);
    const distance = enemyAimVector.length();
    const aimYaw = Math.atan2(enemyAimVector.x, -enemyAimVector.z);
    enemy.rotation.y = lerpAngle(enemy.rotation.y, aimYaw, 1 - Math.pow(0.001, delta));

    moveEnemy(enemy, distance, delta, targetPosition, canSeePlayer);
    attackWithEnemy(enemy, distance, aimYaw, canSeePlayer);
  });
}

function distanceToPlayer(enemy) {
  return Math.hypot(player.position.x - enemy.position.x, player.position.z - enemy.position.z);
}

function moveEnemy(enemy, distance, delta, targetPosition, canSeePlayer) {
  enemyMoveVector.copy(targetPosition).sub(enemy.position);
  enemyMoveVector.y = 0;

  if (enemyMoveVector.lengthSq() > 0) {
    enemyMoveVector.normalize();
  } else {
    enemyMoveVector.set(0, 0, -1).applyAxisAngle(upVector, enemy.rotation.y);
  }

  const movedDistance = Math.hypot(enemy.position.x - enemy.userData.lastX, enemy.position.z - enemy.userData.lastZ);

  if (movedDistance < 0.02 && distance > 2.4) {
    enemy.userData.stuckTimer += delta;
  } else {
    enemy.userData.stuckTimer = Math.max(0, enemy.userData.stuckTimer - delta * 2);
  }

  if (enemy.userData.stuckTimer > 0.24) {
    chooseEnemyAvoidance(enemy, targetPosition);
    enemy.userData.unstuckTimer = 0.85;
    enemy.userData.stuckTimer = 0.08;
  }

  enemy.userData.lastX = enemy.position.x;
  enemy.userData.lastZ = enemy.position.z;

  if (enemy.userData.flankTimer <= 0) {
    enemy.userData.strafeSign = Math.random() > 0.5 ? 1 : -1;
    enemy.userData.flankTimer = 0.75 + Math.random() * 0.9;
  }

  const sideVector = enemySideVector.set(enemyMoveVector.z, 0, -enemyMoveVector.x).multiplyScalar(enemy.userData.strafeSign);
  const lowHealth = enemy.userData.health < 38;
  const rifleEmpty = enemy.userData.rifleAmmo <= 0 || enemy.userData.rifleReload > 0;
  const sniperEmpty = enemy.userData.sniperAmmo <= 0 || enemy.userData.sniperMagazineReload > 0;

  if (canSeePlayer && enemy.userData.tacticalTimer <= 0) {
    if (lowHealth || (rifleEmpty && sniperEmpty)) {
      chooseEnemyCover(enemy);
      enemy.userData.coverTimer = 1.3;
    } else if (distance > 22) {
      chooseEnemyAvoidance(enemy, player.position);
      enemy.userData.unstuckTimer = 0.55;
    }

    enemy.userData.tacticalTimer = 0.55 + Math.random() * 0.45;
  }

  if (!canSeePlayer) {
    enemy.userData.coverTimer = 0;
    chooseEnemyChaseDirection(enemy, targetPosition);
    enemyMoveVector.addScaledVector(sideVector, enemy.userData.stuckTimer > 0.15 ? 0.45 : 0.08);
  } else if (enemy.userData.coverTimer > 0) {
    enemyAvoidVector.set(enemy.userData.avoidX, 0, enemy.userData.avoidZ);
    enemyMoveVector.copy(enemyAvoidVector);
  } else if (canSeePlayer && distance < 5) {
    enemyMoveVector.multiplyScalar(-1.55).addScaledVector(sideVector, 1.2);
  } else if (canSeePlayer && distance < 10) {
    enemyMoveVector.multiplyScalar(-0.85).addScaledVector(sideVector, 1.35);
  } else if (canSeePlayer && distance < 22) {
    enemyMoveVector.multiplyScalar(0.22).addScaledVector(sideVector, 1.22);
  } else if (canSeePlayer && distance > 44) {
    enemyMoveVector.multiplyScalar(0.8).addScaledVector(sideVector, 0.32);
  } else {
    enemyMoveVector.addScaledVector(sideVector, enemy.userData.stuckTimer > 0.15 ? 1.15 : 0.34);
  }

  keepEnemyAwayFromArenaEdge(enemy, enemyMoveVector);

  const frontObstacle = getJumpableObstacleAhead(enemy, enemyMoveVector);

  if (frontObstacle && enemy.userData.grounded) {
    enemy.userData.verticalVelocity = Math.max(enemy.userData.verticalVelocity, 11.8 + frontObstacle.top * 1.1);
    enemy.userData.grounded = false;
    enemy.userData.unstuckTimer = 0;
  } else if (enemy.userData.unstuckTimer > 0) {
    enemyAvoidVector.set(enemy.userData.avoidX, 0, enemy.userData.avoidZ);
    enemyMoveVector.multiplyScalar(0.18).addScaledVector(enemyAvoidVector, 1.1);
  } else if (isBlockedByObstacle(enemy.position.x + enemyMoveVector.x * 1.25, enemy.position.z + enemyMoveVector.z * 1.25, enemy.position.y, enemy.userData.grounded)) {
    chooseEnemyAvoidance(enemy, targetPosition);
    enemyAvoidVector.set(enemy.userData.avoidX, 0, enemy.userData.avoidZ);
    enemyMoveVector.multiplyScalar(0.25).addScaledVector(enemyAvoidVector, 0.95);
    enemy.userData.unstuckTimer = 0.45;
  }

  if (enemyMoveVector.lengthSq() > 0) {
    enemyMoveVector.normalize();
  }

  const speed = canSeePlayer
    ? distance < 22
      ? 13.6
      : distance > 30
        ? 13.2
        : lowHealth
          ? 11.4
          : 9.2
    : 16.5;
  moveCharacterOnGround(enemy, enemyMoveVector, speed, delta, enemy.userData.grounded);

  if (Math.hypot(enemy.userData.knockbackX, enemy.userData.knockbackZ) > 0.05) {
    enemy.position.x += enemy.userData.knockbackX * delta;
    enemy.position.z += enemy.userData.knockbackZ * delta;
    enemy.position.x = THREE.MathUtils.clamp(enemy.position.x, -arena.halfWidth + 1.2, arena.halfWidth - 1.2);
    enemy.position.z = THREE.MathUtils.clamp(enemy.position.z, -arena.halfDepth + 1.2, arena.halfDepth - 1.2);
    enemy.userData.knockbackX *= Math.pow(0.06, delta);
    enemy.userData.knockbackZ *= Math.pow(0.06, delta);
  }

  const jumpTarget = getJumpableObstacleAhead(enemy, enemyMoveVector);
  if (enemy.userData.grounded && distance > 8 && jumpTarget) {
    enemy.userData.verticalVelocity = Math.max(enemy.userData.verticalVelocity, 10.5 + jumpTarget.top * 0.8);
    enemy.userData.grounded = false;
  }

  enemy.userData.verticalVelocity -= 28 * delta;
  enemy.position.y += enemy.userData.verticalVelocity * delta;

  const groundHeight = getGroundHeightAt(enemy.position.x, enemy.position.z, enemy.position.y, enemy.userData.grounded);

  if (enemy.position.y <= groundHeight) {
    enemy.position.y = groundHeight;
    enemy.userData.verticalVelocity = 0;
    enemy.userData.grounded = true;
  } else {
    enemy.userData.grounded = false;
  }

  resolveObstacleOverlap(enemy, enemy.userData.grounded);
}

function keepEnemyAwayFromArenaEdge(enemy, moveVector) {
  const edgePadding = 3.5;
  let inwardX = 0;
  let inwardZ = 0;

  if (enemy.position.x < -arena.halfWidth + edgePadding) {
    inwardX = 1;
  } else if (enemy.position.x > arena.halfWidth - edgePadding) {
    inwardX = -1;
  }

  if (enemy.position.z < -arena.halfDepth + edgePadding) {
    inwardZ = 1;
  } else if (enemy.position.z > arena.halfDepth - edgePadding) {
    inwardZ = -1;
  }

  if (inwardX !== 0 || inwardZ !== 0) {
    moveVector.add(enemyAvoidVector.set(inwardX, 0, inwardZ).normalize().multiplyScalar(1.25));
  }
}

function chooseEnemyAvoidance(enemy, targetPosition) {
  enemyAvoidVector.copy(targetPosition).sub(enemy.position);
  enemyAvoidVector.y = 0;

  if (enemyAvoidVector.lengthSq() < 0.001) {
    enemyAvoidVector.set(0, 0, -1).applyAxisAngle(upVector, enemy.rotation.y);
  } else {
    enemyAvoidVector.normalize();
  }

  const baseAngle = Math.atan2(enemyAvoidVector.x, -enemyAvoidVector.z);
  const candidates = [
    baseAngle + Math.PI * 0.5,
    baseAngle - Math.PI * 0.5,
    baseAngle + Math.PI * 0.32,
    baseAngle - Math.PI * 0.32,
    baseAngle + Math.PI
  ];

  let bestScore = -Infinity;
  let bestX = -enemyAvoidVector.x;
  let bestZ = -enemyAvoidVector.z;

  candidates.forEach((angle) => {
    const x = Math.sin(angle);
    const z = -Math.cos(angle);
    let score = 0;

    for (let step = 1; step <= 4; step += 1) {
      const sampleX = enemy.position.x + x * step * 1.25;
      const sampleZ = enemy.position.z + z * step * 1.25;
      const blocked = isBlockedByObstacle(sampleX, sampleZ, enemy.position.y, enemy.userData.grounded);
      const insideArena = Math.abs(sampleX) < arena.halfWidth - 1.5 && Math.abs(sampleZ) < arena.halfDepth - 1.5;
      score += blocked || !insideArena ? -2.5 : 1;
    }

    score += Math.random() * 0.2;

    if (score > bestScore) {
      bestScore = score;
      bestX = x;
      bestZ = z;
    }
  });

  enemy.userData.avoidX = bestX;
  enemy.userData.avoidZ = bestZ;
  enemy.userData.strafeSign = bestX * enemyAvoidVector.z - bestZ * enemyAvoidVector.x > 0 ? 1 : -1;
}

function chooseEnemyChaseDirection(enemy, targetPosition) {
  const targetX = targetPosition.x - enemy.position.x;
  const targetZ = targetPosition.z - enemy.position.z;
  const baseAngle = Math.atan2(targetX, -targetZ);
  const candidates = [0, 0.22, -0.22, 0.45, -0.45, 0.72, -0.72, 1.05, -1.05, 1.45, -1.45, Math.PI];
  let bestScore = -Infinity;
  let bestX = Math.sin(baseAngle);
  let bestZ = -Math.cos(baseAngle);

  candidates.forEach((offset) => {
    const angle = baseAngle + offset;
    const x = Math.sin(angle);
    const z = -Math.cos(angle);
    let score = 0;

    for (let step = 1; step <= 5; step += 1) {
      const sampleX = enemy.position.x + x * step * 1.45;
      const sampleZ = enemy.position.z + z * step * 1.45;
      const insideArena = Math.abs(sampleX) < arena.halfWidth - 1.5 && Math.abs(sampleZ) < arena.halfDepth - 1.5;
      const blocked = isBlockedByObstacle(sampleX, sampleZ, enemy.position.y, enemy.userData.grounded);
      const distanceToTarget = Math.hypot(targetPosition.x - sampleX, targetPosition.z - sampleZ);
      score += insideArena ? 0.4 : -4;
      score += blocked ? -3.2 : 1.1;
      score -= distanceToTarget * 0.045;
    }

    score -= Math.abs(offset) * 0.18;

    if (score > bestScore) {
      bestScore = score;
      bestX = x;
      bestZ = z;
    }
  });

  enemyMoveVector.set(bestX, 0, bestZ);
}

function getJumpableObstacleAhead(enemy, moveVector) {
  if (!moveVector || moveVector.lengthSq() < 0.001) {
    return null;
  }

  const checkX = enemy.position.x + moveVector.x * 1.35;
  const checkZ = enemy.position.z + moveVector.z * 1.35;

  return obstacles.find((obstacle) => {
    const insideX = Math.abs(checkX - obstacle.x) < obstacle.width / 2 + 0.55;
    const insideZ = Math.abs(checkZ - obstacle.z) < obstacle.depth / 2 + 0.55;

    if (!insideX || !insideZ) {
      return false;
    }

    const heightAboveFeet = obstacle.top - enemy.position.y;
    return heightAboveFeet > 0.35 && heightAboveFeet <= 2.25;
  }) || null;
}

function chooseEnemyCover(enemy) {
  let bestScore = -Infinity;
  let bestX = -Math.sin(enemy.rotation.y);
  let bestZ = Math.cos(enemy.rotation.y);

  obstacles.forEach((obstacle) => {
    if (obstacle.top < 1.8) {
      return;
    }

    const awayX = obstacle.x - player.position.x;
    const awayZ = obstacle.z - player.position.z;
    const length = Math.max(Math.hypot(awayX, awayZ), 0.01);
    const candidateX = obstacle.x + (awayX / length) * (obstacle.width / 2 + 1.8);
    const candidateZ = obstacle.z + (awayZ / length) * (obstacle.depth / 2 + 1.8);

    if (Math.abs(candidateX) > arena.halfWidth - 1.4 || Math.abs(candidateZ) > arena.halfDepth - 1.4) {
      return;
    }

    if (isBlockedByObstacle(candidateX, candidateZ, enemy.position.y, enemy.userData.grounded)) {
      return;
    }

    const coverQuality = hasLineOfSight(player.position, { x: candidateX, y: enemy.position.y, z: candidateZ }) ? 0 : 6;
    const distanceFromEnemy = Math.hypot(candidateX - enemy.position.x, candidateZ - enemy.position.z);
    const distanceFromPlayer = Math.hypot(candidateX - player.position.x, candidateZ - player.position.z);
    const score = coverQuality + THREE.MathUtils.clamp(distanceFromPlayer / 8, 0, 4) - distanceFromEnemy * 0.08;

    if (score > bestScore) {
      bestScore = score;
      bestX = candidateX - enemy.position.x;
      bestZ = candidateZ - enemy.position.z;
    }
  });

  const length = Math.max(Math.hypot(bestX, bestZ), 0.01);
  enemy.userData.avoidX = bestX / length;
  enemy.userData.avoidZ = bestZ / length;
}

function attackWithEnemy(enemy, distance, aimYaw, canSeePlayer) {
  if (!canSeePlayer) {
    return;
  }

  if (enemy.userData.reactionDelay > 0) {
    return;
  }

  const rifleTarget = getPredictedPlayerPosition(distance, 34);
  const sniperTarget = getPredictedPlayerPosition(distance, 74);
  const rifleYaw = Math.atan2(rifleTarget.x - enemy.position.x, -(rifleTarget.z - enemy.position.z));
  const sniperYaw = Math.atan2(sniperTarget.x - enemy.position.x, -(sniperTarget.z - enemy.position.z));
  const facingError = Math.abs(getAngleDifference(enemy.rotation.y, rifleYaw));

  if (facingError > (distance < 12 ? 0.46 : 0.3)) {
    return;
  }

  const rifleAimPoint = getEnemyAimPoint(rifleTarget, distance, "rifle", 1.28);
  const sniperAimPoint = getEnemyAimPoint(sniperTarget, distance, "sniper", 1.34);
  const shotgunAimPoint = getEnemyAimPoint(rifleTarget, distance, "shotgun", 1.2);
  const pistolAimPoint = getEnemyAimPoint(rifleTarget, distance, "pistol", 1.25);
  const launcherAimPoint = getEnemyAimPoint(rifleTarget, distance, "launcher", 1.05);
  const riflePitch = getAimPitch(enemy.position, rifleTarget, 1.55, 1.25);
  const sniperPitch = getAimPitch(enemy.position, sniperTarget, 1.55, 1.25);
  const pressure = THREE.MathUtils.clamp(1 - distance / 60, 0, 1);
  const rifleReady = enemyHasWeapon(enemy, 0) && enemy.userData.fireCooldown <= 0 && enemy.userData.rifleReload <= 0 && enemy.userData.rifleAmmo > 0;
  const sniperReady = enemyHasWeapon(enemy, 1) && enemy.userData.sniperBoltCooldown <= 0 && enemy.userData.sniperMagazineReload <= 0 && enemy.userData.sniperAmmo > 0;
  const shotgunReady = enemyHasWeapon(enemy, 3) && enemy.userData.fireCooldown <= 0 && enemy.userData.shotgunReload <= 0 && enemy.userData.shotgunAmmo > 0;
  const pistolReady = enemyHasWeapon(enemy, 4) && enemy.userData.fireCooldown <= 0 && enemy.userData.pistolReload <= 0 && enemy.userData.pistolAmmo > 0;
  const launcherReady = enemyHasWeapon(enemy, 5) && enemy.userData.fireCooldown <= 0 && enemy.userData.launcherReload <= 0 && enemy.userData.launcherAmmo > 0;
  const molotovReady = enemyHasWeapon(enemy, 2) && enemy.userData.molotovCooldown <= 0;

  const playerNearCover = obstacles.some((obstacle) => (
    obstacle.top > 1.2 &&
    Math.abs(player.position.x - obstacle.x) < obstacle.width / 2 + 2.4 &&
    Math.abs(player.position.z - obstacle.z) < obstacle.depth / 2 + 2.4
  ));

  if (distance > 8 && distance < 34 && molotovReady && (playerNearCover || Math.random() < 0.09)) {
    enemy.userData.weapon = 2;
    throwMolotov(enemy, aimYaw, "enemy", distance < 15 ? 0.42 : 0.82);
    enemy.userData.molotovCooldown = 10;
    return;
  }

  if (distance > 14 && distance < 42 && launcherReady && (playerNearCover || Math.random() < 0.06)) {
    enemy.userData.weapon = 5;
    spawnBullet("launcher", enemy, rifleYaw, "enemy", riflePitch, launcherAimPoint);
    enemy.userData.launcherAmmo -= 1;
    enemy.userData.fireCooldown = 1.15;

    if (enemy.userData.launcherAmmo <= 0) {
      enemy.userData.launcherReload = launcherReloadDuration;
    }

    return;
  }

  if (distance < 11 && shotgunReady) {
    enemy.userData.weapon = 3;
    spawnShotgunBlast(enemy, rifleYaw, "enemy", riflePitch, shotgunAimPoint);
    enemy.userData.shotgunAmmo -= 1;
    enemy.userData.fireCooldown = 0.78;

    if (enemy.userData.shotgunAmmo <= 0) {
      enemy.userData.shotgunReload = shotgunReloadDuration;
    }

    return;
  }

  if (distance >= 34 && sniperReady) {
    enemy.userData.weapon = 1;
    spawnBullet("sniper", enemy, sniperYaw + (Math.random() - 0.5) * 0.012, "enemy", sniperPitch, sniperAimPoint);
    enemy.userData.sniperAmmo -= 1;
    enemy.userData.sniperBoltCooldown = 1.15;

    if (enemy.userData.sniperAmmo <= 0) {
      enemy.userData.sniperMagazineReload = sniperMagazineReloadDuration;
    }

    return;
  }

  if (distance < 52 && rifleReady) {
    enemy.userData.weapon = 0;
    spawnBullet("rifle", enemy, rifleYaw + (Math.random() - 0.5) * (0.045 - pressure * 0.028), "enemy", riflePitch, rifleAimPoint);
    enemy.userData.rifleAmmo -= 1;
    enemy.userData.fireCooldown = distance > 34 ? 0.22 : 0.2;

    if (enemy.userData.rifleAmmo <= 0) {
      enemy.userData.rifleReload = rifleReloadDuration;
    }

    return;
  }

  if (distance < 34 && pistolReady) {
    enemy.userData.weapon = 4;
    spawnBullet("pistol", enemy, rifleYaw + (Math.random() - 0.5) * 0.035, "enemy", riflePitch, pistolAimPoint);
    enemy.userData.pistolAmmo -= 1;
    enemy.userData.fireCooldown = 0.24;

    if (enemy.userData.pistolAmmo <= 0) {
      enemy.userData.pistolReload = pistolReloadDuration;
    }

    return;
  }

  if (rifleReady) {
    enemy.userData.weapon = 0;
    spawnBullet("rifle", enemy, rifleYaw + (Math.random() - 0.5) * (0.038 - pressure * 0.024), "enemy", riflePitch, rifleAimPoint);
    enemy.userData.rifleAmmo -= 1;
    enemy.userData.fireCooldown = distance > 40 ? 0.22 : 0.2;

    if (enemy.userData.rifleAmmo <= 0) {
      enemy.userData.rifleReload = rifleReloadDuration;
    }

    return;
  }

  if (pistolReady) {
    enemy.userData.weapon = 4;
    spawnBullet("pistol", enemy, rifleYaw + (Math.random() - 0.5) * 0.04, "enemy", riflePitch, pistolAimPoint);
    enemy.userData.pistolAmmo -= 1;
    enemy.userData.fireCooldown = 0.24;

    if (enemy.userData.pistolAmmo <= 0) {
      enemy.userData.pistolReload = pistolReloadDuration;
    }

    return;
  }

  if (distance < 18 && shotgunReady) {
    enemy.userData.weapon = 3;
    spawnShotgunBlast(enemy, rifleYaw, "enemy", riflePitch, shotgunAimPoint);
    enemy.userData.shotgunAmmo -= 1;
    enemy.userData.fireCooldown = 0.78;

    if (enemy.userData.shotgunAmmo <= 0) {
      enemy.userData.shotgunReload = shotgunReloadDuration;
    }

    return;
  }

  if (distance > 7 && launcherReady) {
    enemy.userData.weapon = 5;
    spawnBullet("launcher", enemy, rifleYaw, "enemy", riflePitch, launcherAimPoint);
    enemy.userData.launcherAmmo -= 1;
    enemy.userData.fireCooldown = 1.15;

    if (enemy.userData.launcherAmmo <= 0) {
      enemy.userData.launcherReload = launcherReloadDuration;
    }

    return;
  }

  if (distance >= 24 && sniperReady) {
    enemy.userData.weapon = 1;
    spawnBullet("sniper", enemy, sniperYaw + (Math.random() - 0.5) * 0.018, "enemy", sniperPitch, sniperAimPoint);
    enemy.userData.sniperAmmo -= 1;
    enemy.userData.sniperBoltCooldown = 1.15;

    if (enemy.userData.sniperAmmo <= 0) {
      enemy.userData.sniperMagazineReload = sniperMagazineReloadDuration;
    }
  }
}

function getEnemyAimPoint(targetPosition, distance, weapon, targetHeight) {
  const aimPoint = targetPosition.clone().addScaledVector(upVector, targetHeight);
  const baseError = {
    rifle: 8.0,
    sniper: 2.2,
    shotgun: 3.4,
    pistol: 6.4,
    launcher: 3.8
  }[weapon] || 0.95;
  const distanceScale = THREE.MathUtils.clamp(distance / 28, 0.5, 1.55);
  const movementScale = velocity.lengthSq() > 8 ? 1.25 : 1;
  const error = baseError * distanceScale * movementScale;

  aimPoint.x += (Math.random() - 0.5) * error;
  aimPoint.z += (Math.random() - 0.5) * error;
  aimPoint.y += (Math.random() - 0.5) * error * 0.34;
  return aimPoint;
}

function getAimPitch(fromPosition, targetPosition, fromHeight = 1.6, targetHeight = 1.2) {
  const dx = targetPosition.x - fromPosition.x;
  const dz = targetPosition.z - fromPosition.z;
  const horizontalDistance = Math.max(Math.hypot(dx, dz), 0.01);
  const verticalDistance = targetPosition.y + targetHeight - (fromPosition.y + fromHeight);
  return THREE.MathUtils.clamp(Math.atan2(verticalDistance, horizontalDistance), -1.1, 1.1);
}

function updateCombatHud() {
  playerHealthElement.textContent = Math.ceil(playerHealth);
  enemyHealthElement.textContent = enemies[0]?.visible ? Math.ceil(enemies[0].userData.health) : "Down";
  playerScoreElement.textContent = playerScore;
  enemyScoreElement.textContent = enemyScore;
}

function lerpAngle(from, to, amount) {
  const difference = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + difference * amount;
}

function getAngleDifference(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function applyFireDamage(fire) {
  const radius = 4.2;

  if (fire.userData.owner !== "enemy" && enemies[0]?.visible && enemies[0].position.distanceTo(fire.position) < radius) {
    damageEnemy(enemies[0], 6);
  }

  if (fire.userData.owner !== "player" && player.position.distanceTo(fire.position) < radius) {
    damagePlayer(6);
  }
}

function hasLineOfSight(fromPosition, toPosition) {
  const start = fromPosition.clone().addScaledVector(upVector, 1.55);
  const end = toPosition.clone().addScaledVector(upVector, 1.25);
  const dx = end.x - start.x;
  const dz = end.z - start.z;

  return !obstacles.some((obstacle) => {
    if (obstacle.top < 1.2) {
      return false;
    }

    return segmentIntersectsAabb2D(
      start.x,
      start.z,
      end.x,
      end.z,
      obstacle.x - obstacle.width / 2 - 0.25,
      obstacle.z - obstacle.depth / 2 - 0.25,
      obstacle.x + obstacle.width / 2 + 0.25,
      obstacle.z + obstacle.depth / 2 + 0.25
    ) && Math.max(start.y, end.y) > 0.6;
  });
}

function segmentIntersectsAabb2D(x1, z1, x2, z2, minX, minZ, maxX, maxZ) {
  let tMin = 0;
  let tMax = 1;
  const dx = x2 - x1;
  const dz = z2 - z1;

  const checks = [
    [-dx, x1 - minX],
    [dx, maxX - x1],
    [-dz, z1 - minZ],
    [dz, maxZ - z1]
  ];

  for (const [p, q] of checks) {
    if (Math.abs(p) < 0.0001) {
      if (q < 0) {
        return false;
      }
      continue;
    }

    const t = q / p;

    if (p < 0) {
      tMin = Math.max(tMin, t);
    } else {
      tMax = Math.min(tMax, t);
    }

    if (tMin > tMax) {
      return false;
    }
  }

  return true;
}

function getPredictedPlayerPosition(distance, bulletSpeed) {
  const leadTime = THREE.MathUtils.clamp(distance / bulletSpeed, 0, 0.9);
  const lateralFactor = velocity.lengthSq() > 10 ? 0.72 : 0.5;
  return player.position.clone().addScaledVector(velocity, leadTime * lateralFactor);
}

function updateInput(delta) {
  forwardVector.set(0, 0, -1).applyAxisAngle(upVector, yaw);
  rightVector.set(1, 0, 0).applyAxisAngle(upVector, yaw);
  direction.set(0, 0, 0);

  if (keys.has("KeyW") || keys.has("ArrowUp")) direction.add(forwardVector);
  if (keys.has("KeyS") || keys.has("ArrowDown")) direction.sub(forwardVector);
  if (keys.has("KeyD") || keys.has("ArrowRight")) direction.add(rightVector);
  if (keys.has("KeyA") || keys.has("ArrowLeft")) direction.sub(rightVector);

  if (direction.lengthSq() > 0) {
    direction.normalize();
  }

  const ctrlCrouch = keys.has("ControlLeft") || keys.has("ControlRight");
  const stance = ctrlCrouch ? "crouch" : stanceMode;
  const runPressed = keys.has("ShiftLeft") || keys.has("ShiftRight");
  const canRun = runPressed && stance === "stand" && direction.lengthSq() > 0;
  const baseSpeed = stance === "prone" ? 3.2 : stance === "crouch" ? 5.4 : canRun ? 17 : 11;

  velocity.lerp(direction.multiplyScalar(baseSpeed), 1 - Math.pow(0.0008, delta));
  moveCharacterOnGround(player, velocity.clone().normalize(), velocity.length(), delta, isGrounded);

  verticalVelocity -= 28 * delta;
  player.position.y += verticalVelocity * delta;

  const groundHeight = getGroundHeightAt(player.position.x, player.position.z, player.position.y, isGrounded);

  if (player.position.y <= groundHeight) {
    player.position.y = groundHeight;
    verticalVelocity = 0;
    isGrounded = true;
  } else {
    isGrounded = false;
  }

  player.position.x = THREE.MathUtils.clamp(player.position.x, -arena.halfWidth + 1.2, arena.halfWidth - 1.2);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -arena.halfDepth + 1.2, arena.halfDepth - 1.2);
  resolveObstacleOverlap(player, isGrounded);
  if (direction.lengthSq() === 0) {
    velocity.multiplyScalar(Math.pow(0.22, delta));
  }
  player.rotation.y = yaw;
  updatePlayerStance(stance, delta);
}

function moveCharacterOnGround(character, moveVector, speed, delta, grounded) {
  if (!Number.isFinite(moveVector.x) || !Number.isFinite(moveVector.z) || moveVector.lengthSq() === 0 || speed <= 0) {
    return;
  }

  const deltaX = moveVector.x * speed * delta;
  const deltaZ = moveVector.z * speed * delta;
  const nextX = character.position.x + deltaX;

  if (!isBlockedByObstacle(nextX, character.position.z, character.position.y, grounded)) {
    character.position.x = THREE.MathUtils.clamp(nextX, -arena.halfWidth + 1.2, arena.halfWidth - 1.2);
  } else if (character === player) {
    velocity.x = 0;
  }

  const nextZ = character.position.z + deltaZ;

  if (!isBlockedByObstacle(character.position.x, nextZ, character.position.y, grounded)) {
    character.position.z = THREE.MathUtils.clamp(nextZ, -arena.halfDepth + 1.2, arena.halfDepth - 1.2);
  } else if (character === player) {
    velocity.z = 0;
  }
}

function isBlockedByObstacle(x, z, currentY, grounded = isGrounded) {
  const playerRadius = 0.48;
  const stepHeight = grounded ? 0.95 : 0.2;

  return obstacles.some((obstacle) => {
    const insideX = Math.abs(x - obstacle.x) < obstacle.width / 2 + playerRadius;
    const insideZ = Math.abs(z - obstacle.z) < obstacle.depth / 2 + playerRadius;

    if (!insideX || !insideZ) {
      return false;
    }

    return obstacle.top > currentY + stepHeight;
  });
}

function resolveObstacleOverlap(character, grounded) {
  const radius = 0.5;
  const stepHeight = grounded ? 0.95 : 0.2;

  obstacles.forEach((obstacle) => {
    const dx = character.position.x - obstacle.x;
    const dz = character.position.z - obstacle.z;
    const overlapX = obstacle.width / 2 + radius - Math.abs(dx);
    const overlapZ = obstacle.depth / 2 + radius - Math.abs(dz);
    const blocksBody = obstacle.top > character.position.y + stepHeight;

    if (overlapX <= 0 || overlapZ <= 0 || !blocksBody) {
      return;
    }

    if (overlapX < overlapZ) {
      character.position.x += Math.sign(dx || 1) * (overlapX + 0.03);
    } else {
      character.position.z += Math.sign(dz || 1) * (overlapZ + 0.03);
    }
  });
}

function getGroundHeightAt(x, z, currentY, grounded = isGrounded) {
  const playerRadius = 0.38;
  let groundHeight = 0;

  obstacles.forEach((obstacle) => {
    const onX = Math.abs(x - obstacle.x) <= obstacle.width / 2 + playerRadius;
    const onZ = Math.abs(z - obstacle.z) <= obstacle.depth / 2 + playerRadius;
    const canStepUp = grounded && obstacle.top <= currentY + 0.95;
    const canLand = canStepUp || (currentY >= obstacle.top - 0.35 && currentY <= obstacle.top + 1.25);

    if (onX && onZ && canLand) {
      groundHeight = Math.max(groundHeight, obstacle.top);
    }
  });

  climbZones.forEach((zone) => {
    const onX = Math.abs(x - zone.x) <= zone.width / 2 + playerRadius;
    const onZ = Math.abs(z - zone.z) <= zone.depth / 2 + playerRadius;

    if (onX && onZ && currentY < zone.top + 0.9) {
      groundHeight = Math.max(groundHeight, Math.min(zone.top, currentY + 0.58));
    }
  });

  return groundHeight;
}

function updatePlayerStance(stance, delta) {
  const targetScale = stance === "prone" ? 0.36 : stance === "crouch" ? 0.62 : 1;
  const targetGunY = stance === "prone" ? 0.68 : stance === "crouch" ? 1.05 : 1.55;
  const targetGunZ = stance === "prone" ? -0.95 : -0.6;
  const blend = 1 - Math.pow(0.0003, delta);
  const gun = player.getObjectByName("gun");

  player.scale.y = THREE.MathUtils.lerp(player.scale.y, targetScale, blend);

  if (gun) {
    gun.position.y = THREE.MathUtils.lerp(gun.position.y, targetGunY, blend);
    gun.position.z = THREE.MathUtils.lerp(gun.position.z, targetGunZ, blend);
    gun.rotation.x = THREE.MathUtils.lerp(gun.rotation.x, stance === "prone" ? -0.18 : 0.02, blend);
  }
}

function updateShooting(delta) {
  fireCooldown -= delta;
  rifleReload = Math.max(0, rifleReload - delta);
  sniperReload = Math.max(0, sniperReload - delta);
  weaponCooldown = Math.max(0, weaponCooldown - delta);
  sniperMagazineReload = Math.max(0, sniperMagazineReload - delta);
  shotgunReload = Math.max(0, shotgunReload - delta);
  pistolReload = Math.max(0, pistolReload - delta);
  launcherReload = Math.max(0, launcherReload - delta);
  molotovCooldown = Math.max(0, molotovCooldown - delta);

  if (rifleReload <= 0 && rifleAmmo <= 0) {
    rifleAmmo = rifleMagazineSize;
  }

  if (sniperMagazineReload <= 0 && sniperAmmo <= 0) {
    sniperAmmo = sniperMagazineSize;
  }

  if (shotgunReload <= 0 && shotgunAmmo <= 0) {
    shotgunAmmo = shotgunMagazineSize;
  }

  if (pistolReload <= 0 && pistolAmmo <= 0) {
    pistolAmmo = pistolMagazineSize;
  }

  if (launcherReload <= 0 && launcherAmmo <= 0) {
    launcherAmmo = launcherMagazineSize;
  }

  if (activeWeapon === 2 && isHoldingMolotov && molotovCooldown <= 0) {
    molotovHoldTime += delta;
  }

  if (activeWeapon === 0 && isFiring && fireCooldown <= 0 && rifleReload <= 0 && rifleAmmo > 0) {
    spawnBullet("rifle");
    rifleAmmo -= 1;
    fireCooldown = 0.085;

    if (rifleAmmo <= 0) {
      rifleReload = rifleReloadDuration;
    }
  }

  if (activeWeapon === 1 && sniperShotQueued) {
    if (sniperReload <= 0 && sniperMagazineReload <= 0 && sniperAmmo > 0) {
      spawnBullet("sniper");
      sniperAmmo -= 1;
      sniperReload = 1.35;
      isAiming = false;

      if (sniperAmmo <= 0) {
        sniperMagazineReload = sniperMagazineReloadDuration;
      }
    }

    sniperShotQueued = false;
    isFiring = false;
  }

  if (activeWeapon === 3 && sniperShotQueued) {
    if (weaponCooldown <= 0 && shotgunReload <= 0 && shotgunAmmo > 0) {
      spawnShotgunBlast();
      shotgunAmmo -= 1;
      weaponCooldown = 0.82;

      if (shotgunAmmo <= 0) {
        shotgunReload = shotgunReloadDuration;
      }
    }

    sniperShotQueued = false;
    isFiring = false;
  }

  if (activeWeapon === 4 && sniperShotQueued) {
    if (weaponCooldown <= 0 && pistolReload <= 0 && pistolAmmo > 0) {
      spawnBullet("pistol");
      pistolAmmo -= 1;
      weaponCooldown = 0.22;

      if (pistolAmmo <= 0) {
        pistolReload = pistolReloadDuration;
      }
    }

    sniperShotQueued = false;
    isFiring = false;
  }

  if (activeWeapon === 5 && sniperShotQueued) {
    if (weaponCooldown <= 0 && launcherReload <= 0 && launcherAmmo > 0) {
      spawnBullet("launcher");
      launcherAmmo -= 1;
      weaponCooldown = 1.1;

      if (launcherAmmo <= 0) {
        launcherReload = launcherReloadDuration;
      }
    }

    sniperShotQueued = false;
    isFiring = false;
  }

  updateWeaponHud();
}

function updateBullets(delta) {
  for (let index = bullets.length - 1; index >= 0; index -= 1) {
    const bullet = bullets[index];
    const previousPosition = bullet.position.clone();
    bullet.position.addScaledVector(bullet.userData.velocity, delta);
    bullet.userData.life -= delta;

    const hitWall =
      Math.abs(bullet.position.x) >= arena.halfWidth - 0.35 ||
      Math.abs(bullet.position.z) >= arena.halfDepth - 0.35 ||
      bullet.position.y <= 0 ||
      bullet.userData.life <= 0;
    const hitObstacle = segmentHitsObstacle(previousPosition, bullet.position);

    const hitTarget = handleBulletHit(bullet, previousPosition);

    if (hitWall || hitObstacle || hitTarget) {
      if (bullet.userData.explosive) {
        createExplosion(bullet.position, bullet.userData.owner, bullet.userData.blastRadius, bullet.userData.blastDamage);
      }
      scene.remove(bullet);
      bullet.geometry.dispose();
      bullets.splice(index, 1);
    }
  }
}

function createExplosion(position, owner, radius = 5, damage = 45) {
  const explosion = new THREE.Group();
  explosion.position.copy(position);
  explosion.position.y = Math.max(0.15, explosion.position.y);
  explosion.userData.life = 0.38;
  explosion.userData.totalLife = 0.38;
  explosion.userData.damageTick = Infinity;

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.32, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.86 })
  );
  explosion.add(core);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.5, 0.05, 8, 42),
    new THREE.MeshBasicMaterial({ color: 0xff5b1f, transparent: true, opacity: 0.75 })
  );
  ring.rotation.x = Math.PI / 2;
  explosion.add(ring);

  scene.add(explosion);
  fireZones.push(explosion);

  if (owner !== "enemy" && enemies[0]?.visible) {
    const distance = enemies[0].position.distanceTo(position);
    if (distance < radius) {
      damageEnemy(enemies[0], damage * (1 - distance / radius) + 12);
      applyKnockback(enemies[0], position, radius, 34);
    }
  }

  const playerDistance = player.position.distanceTo(position);
  if (playerDistance < radius) {
    if (owner === "player") {
      applyKnockback(player, position, radius, 40);
    } else {
      const distance = playerDistance;
      damagePlayer(damage * (1 - distance / radius) + 12);
      applyKnockback(player, position, radius, 34);
    }
  }
}

function applyKnockback(target, origin, radius, strength = 34) {
  const awayX = target.position.x - origin.x;
  const awayZ = target.position.z - origin.z;
  const distance = Math.max(Math.hypot(awayX, awayZ), 0.25);
  const force = THREE.MathUtils.clamp(1 - distance / radius, 0.2, 0.95) * strength;
  const pushX = (awayX / distance) * force;
  const pushZ = (awayZ / distance) * force;
  const lift = 8 + force * 0.38;

  if (target === player) {
    velocity.x += pushX;
    velocity.z += pushZ;
    verticalVelocity = Math.max(verticalVelocity, lift);
    isGrounded = false;
    return;
  }

  target.userData.knockbackX = (target.userData.knockbackX || 0) + pushX;
  target.userData.knockbackZ = (target.userData.knockbackZ || 0) + pushZ;
  target.userData.verticalVelocity = Math.max(target.userData.verticalVelocity || 0, lift);
  target.userData.grounded = false;
}

function hitsObstacle(position) {
  return obstacles.some((obstacle) => (
    position.x >= obstacle.x - obstacle.width / 2 &&
    position.x <= obstacle.x + obstacle.width / 2 &&
    position.z >= obstacle.z - obstacle.depth / 2 &&
    position.z <= obstacle.z + obstacle.depth / 2 &&
    position.y >= 0 &&
    position.y <= obstacle.top + 0.15
  ));
}

function segmentHitsObstacle(start, end) {
  return obstacles.some((obstacle) => {
    if (Math.max(start.y, end.y) < 0 || Math.min(start.y, end.y) > obstacle.top + 0.15) {
      return false;
    }

    return hitsObstacle(end) || segmentIntersectsAabb2D(
      start.x,
      start.z,
      end.x,
      end.z,
      obstacle.x - obstacle.width / 2,
      obstacle.z - obstacle.depth / 2,
      obstacle.x + obstacle.width / 2,
      obstacle.z + obstacle.depth / 2
    );
  });
}

function handleBulletHit(bullet, previousPosition = bullet.position) {
  if (bullet.userData.owner === "player") {
    const enemy = enemies.find((candidate) => candidate.visible && candidate.userData.health > 0);
    const hit = enemy ? getCharacterSegmentHit(previousPosition, bullet.position, enemy.position) : null;

    if (enemy && hit) {
      damageEnemy(enemy, bullet.userData.damage * hit.multiplier);
      return true;
    }
  }

  if (bullet.userData.owner === "enemy") {
    const hit = getCharacterSegmentHit(previousPosition, bullet.position, player.position);

    if (hit) {
      damagePlayer(bullet.userData.damage * hit.multiplier);
      return true;
    }
  }

  return false;
}

function getCharacterSegmentHit(startPosition, endPosition, characterPosition) {
  const distance = startPosition.distanceTo(endPosition);
  const steps = Math.max(1, Math.ceil(distance / 0.18));
  let bodyHit = null;

  for (let index = 0; index <= steps; index += 1) {
    characterHitProbe.lerpVectors(startPosition, endPosition, index / steps);
    const hit = getCharacterHitZone(characterHitProbe, characterPosition);

    if (hit?.zone === "head") {
      return hit;
    }

    if (hit) {
      bodyHit = hit;
    }
  }

  return bodyHit;
}

function getCharacterHitZone(projectilePosition, characterPosition) {
  const horizontalDistance = Math.hypot(
    projectilePosition.x - characterPosition.x,
    projectilePosition.z - characterPosition.z
  );
  const localY = projectilePosition.y - characterPosition.y;

  if (horizontalDistance < 0.5 && localY >= 2.05 && localY <= 2.75) {
    return { zone: "head", multiplier: 1.5 };
  }

  if (horizontalDistance < 0.82 && localY >= 0.25 && localY <= 2.1) {
    return { zone: "body", multiplier: 1 };
  }

  return null;
}

function damageEnemy(enemy, amount) {
  if (gameOver || roundResetQueued || !enemy?.visible || enemy.userData.health <= 0) {
    return;
  }

  const damage = Number.isFinite(amount) ? amount : 0;
  enemy.userData.health = Math.max(0, enemy.userData.health - damage);
  updateCombatHud();

  if (enemy.userData.health <= 0) {
    enemy.visible = false;
    addScore("player");
  }
}

function damagePlayer(amount) {
  if (gameOver || roundResetQueued || playerHealth <= 0) {
    return;
  }

  const damage = Number.isFinite(amount) ? amount : 0;
  playerHealth = Math.max(0, playerHealth - damage);
  updateCombatHud();

  if (playerHealth <= 0) {
    addScore("enemy");
  }
}

function addScore(winner) {
  if (gameOver || roundResetQueued) {
    return;
  }

  roundResetQueued = true;

  if (winner === "player") {
    playerScore += 1;
  } else {
    enemyScore += 1;
  }

  updateCombatHud();

  if (playerScore >= winningScore || enemyScore >= winningScore) {
    endMatch(playerScore >= winningScore ? "YOU WIN" : "AI WINS");
  }
}

function resetRound() {
  roundResetQueued = false;
  playerHealth = 100;
  player.position.copy(spawnPoint);
  player.position.y = 0;
  verticalVelocity = 0;
  isGrounded = true;
  velocity.set(0, 0, 0);
  isFiring = false;
  sniperShotQueued = false;
  isAiming = false;
  isHoldingMolotov = false;
  molotovHoldTime = 0;

  rifleAmmo = rifleMagazineSize;
  rifleReload = 0;
  sniperAmmo = sniperMagazineSize;
  sniperReload = 0;
  sniperMagazineReload = 0;
  weaponCooldown = 0;
  shotgunAmmo = shotgunMagazineSize;
  shotgunReload = 0;
  pistolAmmo = pistolMagazineSize;
  pistolReload = 0;
  launcherAmmo = launcherMagazineSize;
  launcherReload = 0;
  molotovCooldown = 0;

  const enemy = enemies[0];
  if (enemy) {
    enemy.visible = true;
    enemy.position.copy(enemySpawnPoint);
    enemy.position.y = 0;
    enemy.userData.health = 100;
    enemy.userData.respawnTimer = 0;
    enemy.userData.lastX = enemySpawnPoint.x;
    enemy.userData.lastZ = enemySpawnPoint.z;
    enemy.userData.stuckTimer = 0;
    enemy.userData.unstuckTimer = 0;
    enemy.userData.memory = 0;
    enemy.userData.state = "hunt";
    enemy.userData.lastSeen.copy(spawnPoint);
    enemy.userData.weapons = enemyEquippedWeapons.slice(0, 2);
    enemy.userData.weapon = enemyEquippedWeapons[0];
    enemy.userData.fireCooldown = 0.18;
    enemy.userData.reactionDelay = 0.04;
    enemy.userData.rifleAmmo = rifleMagazineSize;
    enemy.userData.rifleReload = 0;
    enemy.userData.sniperAmmo = sniperMagazineSize;
    enemy.userData.sniperBoltCooldown = 0;
    enemy.userData.sniperMagazineReload = 0;
    enemy.userData.shotgunAmmo = shotgunMagazineSize;
    enemy.userData.shotgunReload = 0;
    enemy.userData.pistolAmmo = pistolMagazineSize;
    enemy.userData.pistolReload = 0;
    enemy.userData.launcherAmmo = launcherMagazineSize;
    enemy.userData.launcherReload = 0;
    enemy.userData.molotovCooldown = 4;
    enemy.userData.grounded = true;
    enemy.userData.verticalVelocity = 0;
    enemy.userData.knockbackX = 0;
    enemy.userData.knockbackZ = 0;
  }

  clearRoundProjectiles();

  updateWeaponHud();
  updateCombatHud();
}

function clearRoundProjectiles() {
  for (let index = bullets.length - 1; index >= 0; index -= 1) {
    scene.remove(bullets[index]);
    bullets[index].geometry?.dispose();
    bullets.splice(index, 1);
  }

  for (let index = molotovs.length - 1; index >= 0; index -= 1) {
    const molotov = molotovs[index];
    scene.remove(molotov);
    molotov.traverse((child) => {
      child.geometry?.dispose?.();
    });
    molotovs.splice(index, 1);
  }

  for (let index = fireZones.length - 1; index >= 0; index -= 1) {
    const fire = fireZones[index];
    scene.remove(fire);
    fire.traverse((child) => {
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    });
    fireZones.splice(index, 1);
  }

  trajectoryDots.forEach((dot) => {
    dot.visible = false;
  });
}

function endMatch(message) {
  gameOver = true;
  roundResetQueued = false;
  keys.clear();
  isFiring = false;
  isAiming = false;
  isHoldingMolotov = false;
  roundResultTextElement.textContent = message;
  document.body.classList.add("match-ended");
  roundResultElement.setAttribute("aria-hidden", "false");
  document.exitPointerLock?.();
}

function restartMatch() {
  playerScore = 0;
  enemyScore = 0;
  gameOver = false;
  roundResetQueued = false;
  document.body.classList.remove("match-ended");
  roundResultElement.setAttribute("aria-hidden", "true");
  chooseEnemyLoadout();
  resetRound();

  if (gameStarted) {
    canvas.requestPointerLock?.();
  }
}

function updateCamera(delta) {
  tempVector.set(0, 0, -1).applyAxisAngle(upVector, yaw);
  aimForward.set(0, Math.sin(pitch), -Math.cos(pitch)).normalize().applyAxisAngle(upVector, yaw);
  const stance = keys.has("ControlLeft") || keys.has("ControlRight") ? "crouch" : stanceMode;
  const stanceHeight = stance === "prone" ? 0.62 : stance === "crouch" ? 1.1 : 1.65;
  const scoped = isAiming;
  const cameraHeight = stanceHeight + 0.35;
  const targetDistance = scoped ? 34 : 22;

  player.visible = false;
  targetFov = scoped ? activeWeapon === 1 ? 20 : 46 : 62;
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 1 - Math.pow(0.0008, delta));
  camera.updateProjectionMatrix();

  desiredCameraPosition.copy(player.position)
    .addScaledVector(upVector, cameraHeight);

  keepCameraInsideArena(desiredCameraPosition);
  camera.position.lerp(desiredCameraPosition, 1 - Math.pow(0.001, delta));
  cameraTarget.copy(camera.position)
    .addScaledVector(aimForward, targetDistance);
  camera.lookAt(cameraTarget);
  updateViewModel(scoped);
}

function updateViewModel(scoped) {
  const weaponOffsets = [
    scoped ? [0, -0.37, -0.7] : [0.12, -0.42, -0.82],
    scoped ? [0, -0.34, -0.72] : [0.08, -0.42, -0.78],
    [0.22, -0.3, -0.68],
    scoped ? [0.02, -0.38, -0.78] : [0.1, -0.42, -0.84],
    scoped ? [0.04, -0.34, -0.58] : [0.18, -0.4, -0.66],
    scoped ? [0.02, -0.39, -0.92] : [0.12, -0.46, -1.04]
  ];
  const [targetX, targetY, targetZ] = weaponOffsets[activeWeapon] || weaponOffsets[0];
  viewModel.position.x = THREE.MathUtils.lerp(viewModel.position.x, targetX, 0.18);
  viewModel.position.y = THREE.MathUtils.lerp(viewModel.position.y, targetY, 0.18);
  viewModel.position.z = THREE.MathUtils.lerp(viewModel.position.z, targetZ, 0.18);
  viewModel.visible = true;

  const sniper = weaponViewModels[1];
  if (sniper) {
    sniper.visible = activeWeapon === 1 && !(scoped && isAiming);
  }

  const molotov = weaponViewModels[2];
  if (molotov) {
    molotov.rotation.x = THREE.MathUtils.lerp(molotov.rotation.x, isHoldingMolotov ? -0.48 : -0.18, 0.12);
    molotov.position.z = THREE.MathUtils.lerp(molotov.position.z, isHoldingMolotov ? -0.78 : -0.62, 0.12);
  }

  updateViewArms();
}

function updateViewArms() {
  const leftArm = viewModel.getObjectByName("leftArm");
  const rightArm = viewModel.getObjectByName("rightArm");
  const leftHand = viewModel.getObjectByName("leftHand");
  const rightHand = viewModel.getObjectByName("rightHand");
  const molotovMode = activeWeapon === 2;

  const targets = molotovMode
    ? {
      leftArm: [-0.46, -0.52, 0.02, 0.36, -0.88, 0.34],
      rightArm: [0.28, -0.38, -0.36, 0.18, 0.48, -0.3],
      leftHand: [-0.43, -0.45, -0.32, 0.2, -0.7, 0.16],
      rightHand: [0.12, -0.16, -0.64, -0.22, 0.35, -0.1]
    }
    : {
      leftArm: [-0.3, -0.5, -0.32, 0.84, -0.5, 0.22],
      rightArm: [0.5, -0.56, 0.1, 0.42, 0.6, -0.36],
      leftHand: [-0.04, -0.18, -0.72, 0.18, 0.44, -0.12],
      rightHand: [0.19, -0.24, -0.14, -0.08, -0.38, 0.22]
    };

  applyArmTarget(leftArm, targets.leftArm);
  applyArmTarget(rightArm, targets.rightArm);
  applyHandTarget(leftHand, targets.leftHand);
  applyHandTarget(rightHand, targets.rightHand);
}

function applyArmTarget(mesh, target) {
  mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, target[0], 0.16);
  mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, target[1], 0.16);
  mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, target[2], 0.16);
  mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, target[3], 0.16);
  mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, target[4], 0.16);
  mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, target[5], 0.16);
}

function applyHandTarget(mesh, target) {
  mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, target[0], 0.16);
  mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, target[1], 0.16);
  mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, target[2], 0.16);
  mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, target[3], 0.16);
  mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, target[4], 0.16);
  mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, target[5], 0.16);
}

function keepCameraInsideArena(position) {
  const wallPadding = 1.6;
  position.x = THREE.MathUtils.clamp(position.x, -arena.halfWidth + wallPadding, arena.halfWidth - wallPadding);
  position.z = THREE.MathUtils.clamp(position.z, -arena.halfDepth + wallPadding, arena.halfDepth - wallPadding);
}

function setActiveWeapon(index) {
  if (!equippedWeapons.includes(index)) {
    return;
  }

  activeWeapon = index;
  isFiring = false;
  sniperShotQueued = false;
  isAiming = false;
  isHoldingMolotov = false;
  molotovHoldTime = 0;

  updateWeaponViewModel();
  updateWeaponHud();
}

function chooseEnemyLoadout() {
  const secondary = enemySecondaryWeapons[Math.floor(Math.random() * enemySecondaryWeapons.length)];
  enemyEquippedWeapons = [0, secondary];

  enemies.forEach((enemy) => {
    enemy.userData.weapons = enemyEquippedWeapons.slice(0, 2);
    enemy.userData.weapon = enemyEquippedWeapons[0];
  });
}

function setEnemyLoadout(weapons) {
  const uniqueWeapons = [...new Set(weapons)]
    .map((weapon) => Number(weapon))
    .filter((weapon) => Number.isInteger(weapon) && weapon >= 0 && weapon <= 5)
    .slice(0, 2);

  if (uniqueWeapons.length < 2) {
    uniqueWeapons.push(...[0, 1].filter((weapon) => !uniqueWeapons.includes(weapon)));
  }

  enemyEquippedWeapons = uniqueWeapons.slice(0, 2);
  enemies.forEach((enemy) => {
    enemy.userData.weapons = enemyEquippedWeapons.slice(0, 2);
    enemy.userData.weapon = enemyEquippedWeapons[0];
  });
}

function enemyHasWeapon(enemy, index) {
  const weapons = enemy.userData.weapons || enemyEquippedWeapons;
  return weapons.includes(index);
}

function updateWeaponViewModel() {
  weaponViewModels.forEach((weapon, index) => {
    weapon.visible = index === activeWeapon && equippedWeapons.includes(index);
  });
}

function updateWeaponHud() {
  const weaponLabels = ["Auto Rifle", "Sniper", "Molotov", "Shotgun", "Pistol", "Launcher"];
  const activeLabel = weaponLabels[activeWeapon] || "Auto Rifle";
  const rifleReloading = rifleReload > 0;
  const sniperMagazineReloading = sniperMagazineReload > 0;
  const shotgunReloading = shotgunReload > 0;
  const pistolReloading = pistolReload > 0;
  const launcherReloading = launcherReload > 0;
  const sniperReady = sniperReload <= 0 && !sniperMagazineReloading && sniperAmmo > 0;
  const sniperText = sniperMagazineReloading
    ? `Reload ${sniperMagazineReload.toFixed(1)}s`
    : sniperReload > 0
      ? `Bolt ${sniperReload.toFixed(1)}s`
      : "Ready";
  const molotovReady = molotovCooldown <= 0;
  const molotovText = molotovReady ? "Ready" : `Cooldown ${molotovCooldown.toFixed(1)}s`;

  weaponButtons.forEach((button) => {
    const weaponIndex = Number(button.dataset.weapon);
    const equippedIndex = equippedWeapons.indexOf(weaponIndex);
    const isEquipped = equippedIndex >= 0;
    button.hidden = !isEquipped;
    button.classList.toggle("is-unequipped", !isEquipped);
    button.classList.toggle("active", weaponIndex === activeWeapon);
    const slotNumber = button.querySelector("span");
    if (slotNumber && isEquipped) {
      slotNumber.textContent = String(equippedIndex + 1);
    }
  });

  sniperStatusElement.textContent = sniperText;
  molotovStatusElement.textContent = molotovText;
  if (activeWeapon === 0) {
    weaponAmmoElement.parentElement.hidden = false;
    weaponAmmoElement.textContent = rifleReloading ? `Reload ${rifleReload.toFixed(1)}s` : `${rifleAmmo}/${rifleMagazineSize}`;
    weaponAmmoElement.style.color = rifleReloading ? "var(--danger)" : "var(--accent)";
  } else if (activeWeapon === 1) {
    weaponAmmoElement.parentElement.hidden = false;
    weaponAmmoElement.textContent = sniperMagazineReloading
      ? `Reload ${sniperMagazineReload.toFixed(1)}s`
      : `${sniperAmmo}/${sniperMagazineSize}`;
    weaponAmmoElement.style.color = sniperMagazineReloading ? "var(--danger)" : "var(--accent)";
  } else if (activeWeapon === 3) {
    weaponAmmoElement.parentElement.hidden = false;
    weaponAmmoElement.textContent = shotgunReloading ? `Reload ${shotgunReload.toFixed(1)}s` : `${shotgunAmmo}/${shotgunMagazineSize}`;
    weaponAmmoElement.style.color = shotgunReloading ? "var(--danger)" : "var(--accent)";
  } else if (activeWeapon === 4) {
    weaponAmmoElement.parentElement.hidden = false;
    weaponAmmoElement.textContent = pistolReloading ? `Reload ${pistolReload.toFixed(1)}s` : `${pistolAmmo}/${pistolMagazineSize}`;
    weaponAmmoElement.style.color = pistolReloading ? "var(--danger)" : "var(--accent)";
  } else if (activeWeapon === 5) {
    weaponAmmoElement.parentElement.hidden = false;
    weaponAmmoElement.textContent = launcherReloading ? `Reload ${launcherReload.toFixed(1)}s` : `${launcherAmmo}/${launcherMagazineSize}`;
    weaponAmmoElement.style.color = launcherReloading ? "var(--danger)" : "var(--accent)";
  } else {
    weaponAmmoElement.parentElement.hidden = true;
  }
  scopeOverlay.classList.toggle("active", activeWeapon === 1 && isAiming);

  if (activeWeapon === 0 && rifleReloading) {
    fireStateElement.textContent = "Reloading";
    fireStateElement.style.color = "var(--danger)";
    return;
  }

  if (activeWeapon === 1 && !sniperReady) {
    fireStateElement.textContent = "Reloading";
    fireStateElement.style.color = "var(--danger)";
    return;
  }

  if (activeWeapon === 2 && !molotovReady) {
    fireStateElement.textContent = "Cooldown";
    fireStateElement.style.color = "var(--danger)";
    return;
  }

  if (
    (activeWeapon === 3 && (shotgunReloading || weaponCooldown > 0)) ||
    (activeWeapon === 4 && (pistolReloading || weaponCooldown > 0)) ||
    (activeWeapon === 5 && (launcherReloading || weaponCooldown > 0))
  ) {
    fireStateElement.textContent = shotgunReloading || pistolReloading || launcherReloading ? "Reloading" : "Cooldown";
    fireStateElement.style.color = "var(--danger)";
    return;
  }

  fireStateElement.textContent = activeWeapon === 0 && isFiring ? "Firing" : activeLabel;
  fireStateElement.style.color = activeWeapon === 0 && isFiring ? "var(--danger)" : "var(--accent)";
}

function animate() {
  try {
    const delta = Math.min(clock.getDelta(), 0.033);
    if (!settingsOpen && !gameOver) {
      updateGameplayFrame(delta);
    }
    renderer.render(scene, camera);
  } catch (error) {
    recoverGameplayLoop(error);
  } finally {
    requestAnimationFrame(animate);
  }
}

function updateGameplayFrame(delta) {
  runGameplayStep("look", () => updateLookSmoothing(delta));
  runGameplayStep("input", () => updateInput(delta));
  runGameplayStep("shooting", () => updateShooting(delta));
  runGameplayStep("bullets", () => updateBullets(delta));
  runGameplayStep("molotovs", () => updateMolotovs(delta));
  runGameplayStep("fire", () => updateFireZones(delta));
  runGameplayStep("enemies", () => updateEnemies(delta));
  if (roundResetQueued && !gameOver) {
    resetRound();
  }
  runGameplayStep("trajectory", () => updateTrajectory());
  updateCamera(delta);
}

function runGameplayStep(name, update) {
  try {
    update();
  } catch (error) {
    const now = performance.now();
    if (now - lastStepErrorTime > 900) {
      console.error(`Recovered ${name} step`, error);
      lastStepErrorTime = now;
    }

    if (name === "bullets" || name === "molotovs" || name === "fire") {
      clearRoundProjectiles();
    }
  }
}

function recoverGameplayLoop(error) {
  console.error("Recovered gameplay loop", error);

  const now = performance.now();
  if (now - lastRecoveryTime < 600) {
    return;
  }

  lastRecoveryTime = now;
  roundResetQueued = false;
  keys.clear();
  isFiring = false;
  sniperShotQueued = false;
  isAiming = false;
  isHoldingMolotov = false;
  molotovHoldTime = 0;
  try {
    updateWeaponHud();
    updateCombatHud();
  } catch (recoveryError) {
    console.error("Recovery cleanup failed", recoveryError);
  }
}

function updateLookSmoothing(delta) {
  const smoothing = 1 - Math.pow(0.0006, delta);
  yaw = lerpAngle(yaw, targetYaw, smoothing);
  pitch = THREE.MathUtils.lerp(pitch, targetPitch, smoothing);
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

document.addEventListener("keydown", (event) => {
  if (event.code === "Escape" && settingsOpen) {
    closeSettingsModal();
    return;
  }

  if (!gameStarted) {
    return;
  }

  if (event.code === "Escape") {
    openSettingsModal();
    return;
  }

  if (settingsOpen) {
    return;
  }

  if (event.code === "Digit1") {
    setActiveWeapon(equippedWeapons[0]);
    return;
  }

  if (event.code === "Digit2") {
    setActiveWeapon(equippedWeapons[1]);
    return;
  }

  if (event.code === "Digit3") {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    if (isGrounded && stanceMode !== "prone") {
      verticalVelocity = 13;
      isGrounded = false;
    }
    return;
  }

  if (event.code === "KeyC" && !event.repeat) {
    stanceMode = stanceMode === "stand" ? "crouch" : stanceMode === "crouch" ? "prone" : "stand";
    return;
  }

  keys.add(event.code);
});

document.addEventListener("keyup", (event) => {
  if (!gameStarted) {
    return;
  }

  if (settingsOpen) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    return;
  }

  keys.delete(event.code);
});

document.addEventListener("mousemove", (event) => {
  if (!gameStarted) {
    return;
  }

  if (settingsOpen) {
    return;
  }

  const lockMultiplier = document.pointerLockElement === canvas ? 0.0022 : 0.0011;
  const scopedMultiplier = isAiming ? activeWeapon === 1 ? 0.45 : 0.72 : 1;
  const sensitivity = lockMultiplier * mouseSensitivity * scopedMultiplier;
  const movementX = THREE.MathUtils.clamp(event.movementX, -38, 38);
  const movementY = THREE.MathUtils.clamp(event.movementY, -38, 38);
  targetYaw -= movementX * sensitivity;
  targetPitch = THREE.MathUtils.clamp(targetPitch - movementY * sensitivity, -1.15, 1.15);
});

canvas.addEventListener("mousedown", (event) => {
  if (!gameStarted) {
    return;
  }

  if (settingsOpen) {
    return;
  }

  canvas.requestPointerLock?.();

  if (event.button === 0) {
    if (activeWeapon === 0) {
      isFiring = true;
    } else if (activeWeapon === 1 || activeWeapon === 3 || activeWeapon === 4 || activeWeapon === 5) {
      sniperShotQueued = true;
    } else {
      isHoldingMolotov = molotovCooldown <= 0;
      molotovHoldTime = 0;
    }
  }

  if (event.button === 2 && activeWeapon === 2) {
    throwMolotov(player, yaw, "player", 0.22, true);
    isHoldingMolotov = false;
    molotovHoldTime = 0;
    updateWeaponHud();
  } else if (event.button === 2) {
    isAiming = true;
    updateWeaponHud();
  }
});

document.addEventListener("mouseup", (event) => {
  if (!gameStarted) {
    return;
  }

  if (settingsOpen) {
    return;
  }

  if (event.button === 0) {
    isFiring = false;

    if (activeWeapon === 2 && isHoldingMolotov) {
      throwMolotov(player, yaw, "player", getMolotovThrowPower());
      isHoldingMolotov = false;
      molotovHoldTime = 0;
    }
  }

  if (event.button === 2) {
    isAiming = false;
    updateWeaponHud();
  }
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

sensitivitySlider.addEventListener("input", () => {
  mouseSensitivity = Number(sensitivitySlider.value);
  sensitivityValue.textContent = mouseSensitivity.toFixed(2);
});

settingsButton.addEventListener("click", () => {
  if (!gameStarted) {
    return;
  }

  openSettingsModal();
});

closeSettingsButton.addEventListener("click", () => {
  closeSettingsModal();
});

settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    closeSettingsModal();
  }
});

weaponButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveWeapon(Number(button.dataset.weapon));
  });
});

playButton.addEventListener("click", () => {
  mainMenu.classList.add("selecting-map");
});

mapButtons.forEach((button) => {
  button.addEventListener("click", () => {
    pendingMapIndex = Number(button.dataset.map);
    mainMenu.classList.remove("selecting-map");
    mainMenu.classList.add("selecting-loadout");
  });
});

loadoutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const weaponIndex = Number(button.dataset.loadoutWeapon);
    const existingIndex = equippedWeapons.indexOf(weaponIndex);

    if (existingIndex >= 0) {
      if (equippedWeapons.length > 1) {
        equippedWeapons.splice(existingIndex, 1);
      }
    } else if (equippedWeapons.length < 2) {
      equippedWeapons.push(weaponIndex);
    } else {
      equippedWeapons.shift();
      equippedWeapons.push(weaponIndex);
    }

    updateLoadoutSelect();
  });
});

confirmLoadoutButton.addEventListener("click", () => {
  if (equippedWeapons.length !== 2) {
    return;
  }

  playerScore = 0;
  enemyScore = 0;
  gameOver = false;
  document.body.classList.remove("match-ended");
  roundResultElement.setAttribute("aria-hidden", "true");
  loadMap(pendingMapIndex);
  chooseEnemyLoadout();
  setActiveWeapon(equippedWeapons[0]);
  resetRound();
  startGame();
});

restartMatchButton.addEventListener("click", () => {
  restartMatch();
});

function updateLoadoutSelect() {
  loadoutButtons.forEach((button) => {
    const weaponIndex = Number(button.dataset.loadoutWeapon);
    const selectedIndex = equippedWeapons.indexOf(weaponIndex);
    button.classList.toggle("selected", selectedIndex >= 0);
    const slot = button.querySelector("span");
    if (slot) {
      slot.textContent = selectedIndex >= 0 ? String(selectedIndex + 1) : String(weaponIndex + 1);
    }
  });

  confirmLoadoutButton.disabled = equippedWeapons.length !== 2;
}

function startGame() {
  gameStarted = true;
  document.body.classList.remove("menu-active");
  mainMenu.classList.remove("selecting-map", "selecting-loadout");
  mainMenu.setAttribute("aria-hidden", "true");
  canvas.requestPointerLock?.();
}

function openSettingsModal() {
  settingsOpen = true;
  keys.clear();
  isFiring = false;
  isAiming = false;
  isHoldingMolotov = false;
  molotovHoldTime = 0;
  document.body.classList.add("settings-open");
  settingsModal.setAttribute("aria-hidden", "false");
  document.exitPointerLock?.();
  updateWeaponHud();
}

function closeSettingsModal() {
  settingsOpen = false;
  document.body.classList.remove("settings-open");
  settingsModal.setAttribute("aria-hidden", "true");

  if (gameStarted) {
    canvas.requestPointerLock?.();
  }
}

window.addEventListener("resize", resize);
window.addEventListener("blur", () => {
  keys.clear();
  isFiring = false;
  isAiming = false;
  isHoldingMolotov = false;
  molotovHoldTime = 0;
  updateWeaponHud();
});

window.__backviewDebug = {
  start(mapIndex = 0, weapons = [0, 1]) {
    equippedWeapons = weapons.slice(0, 2);
    pendingMapIndex = mapIndex;
    loadMap(mapIndex);
    chooseEnemyLoadout();
    setActiveWeapon(equippedWeapons[0]);
    resetRound();
    startGame();
  },
  setEnemyLoadout(weapons = [0, 1]) {
    setEnemyLoadout(weapons);
  },
  setPlayerPosition(x, z, y = 0) {
    player.position.set(x, y, z);
    verticalVelocity = 0;
    isGrounded = true;
  },
  setEnemyPosition(x, z, y = 0) {
    const enemy = enemies[0];
    if (!enemy) {
      return;
    }
    enemy.position.set(x, y, z);
    enemy.userData.lastX = x;
    enemy.userData.lastZ = z;
    enemy.userData.knockbackX = 0;
    enemy.userData.knockbackZ = 0;
    enemy.userData.verticalVelocity = 0;
    enemy.userData.grounded = true;
    enemy.visible = true;
    enemy.userData.health = 100;
  },
  getState() {
    const enemy = enemies[0];
    return {
      gameStarted,
      player: { x: player.position.x, y: player.position.y, z: player.position.z, health: playerHealth },
      loadout: equippedWeapons.slice(0, 2),
      enemyLoadout: enemyEquippedWeapons.slice(0, 2),
      enemy: enemy ? {
        x: enemy.position.x,
        y: enemy.position.y,
        z: enemy.position.z,
        health: enemy.userData.health,
        state: enemy.userData.state,
        weapon: enemy.userData.weapon,
        weapons: enemy.userData.weapons?.slice(0, 2),
        visible: enemy.visible,
        canSeePlayer: hasLineOfSight(enemy.position, player.position)
      } : null,
      distance: enemy ? distanceToPlayer(enemy) : null
    };
  },
  simulate(seconds = 1) {
    const steps = Math.max(1, Math.floor(seconds * 60));
    for (let index = 0; index < steps; index += 1) {
      updateGameplayFrame(1 / 60);
    }
    return this.getState();
  }
};

addSky();
addLights();
addPlayer();
addEnemy();
loadMap(0);
addFirstPersonViewModel();
createTrajectoryDots();
updateLoadoutSelect();
updateWeaponHud();
updateCombatHud();
updateCamera(1);
animate();
