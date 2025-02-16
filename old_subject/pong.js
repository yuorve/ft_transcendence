// import './pong.css'

import * as THREE from 'three';

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 0;
camera.position.y = 50;

// // Crear el renderizador
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Toroide
// const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
// const material = new THREE.MeshStandardMaterial({
//     color: 0x8a2be2,  // Color violeta
//     // wireframe: true   // Mostrar el wireframe
// });
// const torus = new THREE.Mesh(geometry, material);
// scene.add(torus);

// Luces
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(0, 10, -10);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight, pointLight);

//Herramientas
const lightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(200, 50);
scene.add (lightHelper, gridHelper);
const controls = new OrbitControls(camera, renderer.domElement);

//Pulsacion de teclas
const keys = {};
// Detectar cuando una tecla es presionada
window.addEventListener("keydown", (event) => {
    keys[event.key] = true;
});
// Detectar cuando una tecla es soltada
window.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});


// Palas
const paddlePos = 20;
const geometry = new THREE.BoxGeometry(1, 1, 12);
const material = new THREE.MeshStandardMaterial( { color: 0xffffff } );
const paddle = new THREE.Mesh(geometry, material);
const paddle2 = new THREE.Mesh(geometry, material);
paddle.position.x = paddlePos;
paddle2.position.x = -paddlePos;
scene.add(paddle, paddle2);


// Estrellas
function addStar()
{
    const geometry = new THREE.SphereGeometry(0.25, 24, 24);
    const material = new THREE.MeshStandardMaterial(
    {
        color: 0xffffff    
    })
    const star = new THREE.Mesh(geometry, material);
    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
    star.position.set(x, y ,z);
    scene.add(star);
}
Array(200).fill().forEach(addStar);

//Texturas
const spaceTexture = new THREE.TextureLoader().load('space.jpg');
scene.background = spaceTexture;

// const avatarTexture = new THREE.TextureLoader().load('Nave.png');
// const avatar = new THREE.Mesh (
//     new THREE.BoxGeometry(3, 3, 3),
//     new THREE.MeshBasicMaterial( { map: avatarTexture} )
// );
// scene.add(avatar)

// Pelota(luna)
const moonRad = 3;
const moonTexture = new THREE.TextureLoader().load('moon.jpg');
const normalTexture = new THREE.TextureLoader().load('normal.jpg');
const moon = new THREE.Mesh(
    new THREE.SphereGeometry(moonRad, 32 ,32),
    new THREE.MeshStandardMaterial(
    {
        map: moonTexture,
        normalMap: normalTexture
    })
);
// moon.rotation.x = 45;
scene.add(moon)


function collision(object1, object2)
{
    const box1 = new THREE.Box3().setFromObject(object1);
    const box2 = new THREE.Box3().setFromObject(object2);
    // if (box1.intersectsBox(box2))
    //     console.log(box1.intersectsBox(box2));
    return box1.intersectsBox(box2);
}

function ballMovement(directionX, directionZ)
{
    moon.position.x += directionX;
    moon.position.z += directionZ;
    var col1 = collision(paddle, moon);
    var col2 = collision(paddle2, moon);
    return col1 || col2;
}

function paddleMovement()
{
    const speed = 0.5;
    if (keys["ArrowUp"] && paddle.position.z > -10)
        paddle.position.z -= speed;
    if (keys["ArrowDown"] && paddle.position.z < 10)
        paddle.position.z += speed;
    if (keys["w"] && paddle2.position.z > -10)
        paddle2.position.z -= speed;
    if (keys["s"] && paddle2.position.z < 10)
        paddle2.position.z += speed;
}

// Loop
var directionX = 0.3;
var directionZ = 0.3;
function animate() {
    requestAnimationFrame(animate);
    if (moon.position.z > 15 || moon.position.z  < -15)
        directionZ *= -1;
    if (ballMovement(directionX, directionZ))
        directionX *= -1;
    paddleMovement();
    // Rotar el toroide para darle animación
    // torus.rotation.x += 0.01;
    // torus.rotation.y += 0.01;
    controls.update();
    // Renderizar la escena
    renderer.render(scene, camera);
    if (moon.position.x + moonRad >= paddle.position.x || moon.position.x - moonRad <= paddle2.position.x)
        moon.position.x = 0;
}

// Llamar a la función de animación
animate();