import * as BABYLON from '@babylonjs/core'
import earcut from "earcut";
import { reactive } from 'vue';
import { createGame } from "../api";

(window as any).earcut = earcut;

export const puntuation = reactive({
	pl: 0,
	pr: 0,
});

let gameState = 'playing'; // Posibles estados: 'playing', 'gameOver'
let username = localStorage.getItem("username") || "";
let maxscore = 5; //Máxima puntuación para detener el juego

export default function initPong() {
	const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;  //lugar donde se renderiza

	const engine = new BABYLON.Engine(canvas); //motor 3d BABYLON

	var inputMap: { [key: string]: boolean } = {};  // Mapea teclas a valores booleanos
	window.addEventListener("keydown", function (evt) {
		inputMap[evt.key] = true;  // Marca la tecla como presionada
	});
	window.addEventListener("keyup", function (evt) {
		inputMap[evt.key] = false;  // Marca la tecla como liberada
	});

	const CreateScene = function ()    //funcion de la escena donde se crea todo
	{
		const scene = new BABYLON.Scene(engine);

		//BACKGROUD
		// @ts-ignore
		const background = new BABYLON.Layer('background', 'space.jpg', scene, true);

		// LIGHTS
		const light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
		light.intensity = 0.5; // Máxima iluminación
		light.groundColor = new BABYLON.Color3(1, 1, 1); // Ilumina todo por igual
		// @ts-ignore
		const lightCenter = new BABYLON.PointLight("lightCenter", new BABYLON.Vector3(0, 0, 0), scene);

		// CAMERA
		const camera = new BABYLON.ArcRotateCamera('camera', 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene); //camara
		// camera.attachControl(true);	//comentado para que no se mueva
		camera.setPosition(new BABYLON.Vector3(0, 0, -15));
		camera.lowerBetaLimit = Math.PI / 4; //limite movimiento arriba
		camera.upperBetaLimit = Math.PI / 1.5; //limite movimiento abajo
		camera.upperAlphaLimit = -Math.PI / 4; //limite movimiento derecha
		camera.lowerAlphaLimit = -Math.PI / 1.5; //limite movimiento izquierda
		camera.lowerRadiusLimit = 2; //zoom maximo
		camera.upperRadiusLimit = 40; //zoom minimo

		// MESH VARS
		var ballSpeed = 0.10;
		var ballInitDir = new BABYLON.Vector3(0, 0, 0);
		var sphereRadius = 0.5;
		var paddleWidth = 0.5;
		var paddleHeight = 2;
		var paddleDepth = 1;
		var paddleDistance = 4;
		var paddleSpeed = 0.15;
		var maxUpDown = paddleDistance / 2;

		// GAME FRAME
		const frameUp = BABYLON.MeshBuilder.CreateBox('frameUp', {
			width: paddleDistance * 2 + paddleWidth * 2,
			height: paddleWidth,
			//  depth: paddleDepth
		}, scene);
		frameUp.position.y = maxUpDown + paddleHeight / 2 + sphereRadius + paddleWidth / 2;

		const frameDown = BABYLON.MeshBuilder.CreateBox('frameDown', {
			width: paddleDistance * 2 + paddleWidth * 2,
			height: paddleWidth,
			//  depth: paddleDepth
		}, scene);
		frameDown.position.y = -(maxUpDown + paddleHeight / 2 + sphereRadius + paddleWidth / 2);

		// BALL
		const sphere = BABYLON.MeshBuilder.CreateSphere('mysphere', {
			segments: 6,
			diameter: sphereRadius * 2
		}, scene);
		const sphereMaterial = new BABYLON.StandardMaterial('speheMat', scene);
		sphereMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1); //color del objeto
		// scene.ambientColor = new BABYLON.Color3(0, 0, 1);
		sphereMaterial.ambientColor = new BABYLON.Color3();
		sphereMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0); //color que emite
		sphereMaterial.wireframe = true;
		sphere.material = sphereMaterial;

		// PADDLES
		const paddle1 = BABYLON.MeshBuilder.CreateBox('paddle1', {
			width: paddleWidth,
			height: paddleHeight,
			depth: paddleDepth
		}, scene);

		paddle1.position = new BABYLON.Vector3(-paddleDistance, 0, 0);
		const paddle1Mat = new BABYLON.StandardMaterial('pad1Mat', scene);
		paddle1Mat.diffuseColor = new BABYLON.Color3(0, 1, 1);
		paddle1Mat.emissiveColor = new BABYLON.Color3(0, 0, 1);
		paddle1.material = paddle1Mat;

		const paddle2 = BABYLON.MeshBuilder.CreateBox('paddle2', {
			width: paddleWidth,
			height: paddleHeight,
			depth: paddleDepth
		}, scene);
		paddle2.position = new BABYLON.Vector3(paddleDistance, 0, 0);
		const paddle2Mat = new BABYLON.StandardMaterial('pad2Mat', scene);
		paddle2Mat.diffuseColor = new BABYLON.Color3(0, 1, 0);
		paddle2Mat.emissiveColor = new BABYLON.Color3(1, 0, 0);
		paddle2.material = paddle2Mat;

		// TEXT
		async function loadFontData() {
			const response = await fetch('/Knewave_Regular.json');
			const fontData = await response.json();
			const text = BABYLON.MeshBuilder.CreateText('', 'THE PONG', fontData, {
				size: 2,
				depth: 0.5
			});
			if (text)
				text.position = new BABYLON.Vector3(0, -1, 3);
			return fontData;
		}
		loadFontData();

		// RESET BALL
		function resetBall() {
			sphere.position.x = 0;
			sphere.position.y = 0;
			// Asignar una nueva dirección aleatoria (ángulo pequeño al restar en math random)
			var angle = (Math.random()) * Math.PI / 3;
			var direction = Math.random() > 0.5 ? 1 : -1;
			ballInitDir.x = ballSpeed * direction * Math.cos(angle);
			ballInitDir.y = ballSpeed * direction * Math.sin(angle);
		}

		// INIT BALL
		resetBall();

		// MOVEMENT
		scene.onBeforeRenderObservable.add(function () {
			if (gameState === 'playing') {
				sphere.position.x += ballInitDir.x;
				sphere.position.y += ballInitDir.y;
				sphere.rotation.x += ballInitDir.x;
				sphere.rotation.y += ballInitDir.y;

				// collisions with paddles
				if (sphere.intersectsMesh(paddle2, true) && ballInitDir.x > 0) { //false for less precission, more efficiency 
					ballInitDir.x *= -1;
				}
				if (sphere.intersectsMesh(paddle1, true) && ballInitDir.x < 0) {
					ballInitDir.x *= -1;
				}

				// collisions up and down
				if (sphere.position.y >= maxUpDown + paddleHeight / 2)
					ballInitDir.y *= -1;
				if (sphere.position.y <= -maxUpDown - paddleHeight / 2)
					ballInitDir.y *= -1;

				// out of table
				if (sphere.position.x >= paddleDistance + paddleWidth / 2) {
					puntuation.pl++;
					resetBall();
				}
				if (sphere.position.x <= -paddleDistance - paddleWidth / 2)
				{
					puntuation.pr++;
					resetBall();
				}

				if (puntuation.pl >= maxscore || puntuation.pr >= maxscore) {
					gameState = 'gameOver';
					// Guardar partida
					createGame("pong",username,"Invitado",puntuation.pl,puntuation.pr);
				}

				// paddle controls
				if (inputMap['w'] && paddle1.position.y < maxUpDown + sphereRadius / 2 && !paddle1.intersectsMesh(sphere, true))
					paddle1.position.y += paddleSpeed;
				if (inputMap['s'] && paddle1.position.y > -maxUpDown - sphereRadius / 2 && !paddle1.intersectsMesh(sphere, true))
					paddle1.position.y -= paddleSpeed;
				if (inputMap['ArrowUp'] && paddle2.position.y < maxUpDown + sphereRadius / 2 && !paddle2.intersectsMesh(sphere, true))
					paddle2.position.y += paddleSpeed;
				if (inputMap['ArrowDown'] && paddle2.position.y > -maxUpDown - sphereRadius / 2 && !paddle2.intersectsMesh(sphere, true))
					paddle2.position.y -= paddleSpeed;
			}
		});
		return scene;
	}
	
	const scene = CreateScene();
	
	engine.runRenderLoop(function ()   //loop
	{
		scene.render();
	});

	window.addEventListener('resize', function ()  //evita que los objetos 3d se deformen
	{
		engine.resize();
	});
	return { scene, engine };
}
