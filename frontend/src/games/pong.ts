import * as BABYLON from '@babylonjs/core'
import { GUI3DManager, HolographicButton } from '@babylonjs/gui';
import earcut from "earcut";
import { reactive } from 'vue';
// import { createGame } from "../api";

(window as any).earcut = earcut;

export const puntuation = reactive({
	pl: 0,
	pr: 0,
	dx: 0.0,
	dy: 0.0,
	gameState: 'playing',
	gameMode: 'newGame',
	gameOver: 0,
	online: 0,
	isHost: false,
	playerPaddle: null as BABYLON.Nullable<BABYLON.Mesh>,
	opponentPaddle: null as BABYLON.Nullable<BABYLON.Mesh>,
});

// let username = localStorage.getItem("username") || "";
let maxscore = 5; //Máxima puntuación para detener el juego

function triangleWave(step: number, amplitude: number, start: number, slope: number) {
	return Math.abs((amplitude - start - slope * step) % (2 * amplitude) - amplitude)
}

export default function initPong() {
	//let gameState = 'playing'; // Posibles estados: 'playing', 'gameOver'
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
		let cameraZoom = -15;
		// camera.attachControl(true);	//comentado para que no se mueva
		camera.setPosition(new BABYLON.Vector3(0, 0, cameraZoom));
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

		//MOVEMENT BUTTONS
		const manager = new GUI3DManager(scene);
		var buttons: HolographicButton[][] = [];
		for (let y = 0; y < 3; y++) {
			buttons[y] = [];
			for (let x = 0; x < 3; x++) {
				let button = new HolographicButton(`button${y},${x}`);
				buttons[y][x] = button;
			}
		}

		type ButtonRepeatControl = {
			intervalId: number | null;
			isHeld: boolean;
		};

		function createButton(y: number, x: number, posY: number, posX: number, onHold: () => void) {
			buttons[y][x].position = new BABYLON.Vector3(posY, posX, -0.5);
			buttons[y][x].scaling = new BABYLON.Vector3(6, 3.5, 1);
			manager.addControl(buttons[y][x]);
			if (buttons[y][x].backMaterial) {
				buttons[y][x].backMaterial.alpha = 0;
			}
			if (buttons[y][x].frontMaterial) {
				buttons[y][x].frontMaterial.alpha = 0;
			}
			buttons[y][x].pointerEnterAnimation = () => { }; // nada
			buttons[y][x].pointerOutAnimation = () => { };
			buttons[y][x].pointerDownAnimation = () => { };
			buttons[y][x].pointerUpAnimation = () => { };
			const control: ButtonRepeatControl = { intervalId: null, isHeld: false };

			// Mantener pulsado
			buttons[y][x].pointerDownAnimation = () => {
				if (!control.isHeld) {
					control.isHeld = true;
					control.intervalId = window.setInterval(onHold, 5);
				}
			};

			// Soltar botón
			buttons[y][x].pointerUpAnimation = () => {
				control.isHeld = false;
				if (control.intervalId !== null) {
					clearInterval(control.intervalId);
					control.intervalId = null;
				}
			};

			// Por seguridad, también al salir del área del botón
			buttons[y][x].pointerOutAnimation = () => {
				control.isHeld = false;
				if (control.intervalId !== null) {
					clearInterval(control.intervalId);
					control.intervalId = null;
				}
			};
			// console.log("gamemode es ", puntuation.gameMode);
			// console.log(" puntuation.online es  ", puntuation.online);
		}

		if (puntuation.online === 0)
		{
			createButton(0, 0, -paddleDistance, paddleDistance / 2 - 0.25, handleTopLeftClick);
			createButton(1, 0, -paddleDistance, -paddleDistance / 2 + 0.25, handleBotLeftClick);
			createButton(0, 2, paddleDistance, paddleDistance / 2 - 0.25, handleTopRightClick);
			createButton(0, 1, paddleDistance, -paddleDistance / 2 + 0.25, handleBotRightClick);
		}
		else if (puntuation.online === 0 || (puntuation.online === 1 && puntuation.gameMode === 'newGame')) {
			createButton(0, 0, -paddleDistance, paddleDistance / 2 - 0.25, handleTopLeftClick);
			createButton(1, 0, -paddleDistance, -paddleDistance / 2 + 0.25, handleBotLeftClick);
		}
		else {
			createButton(0, 2, paddleDistance, paddleDistance / 2 - 0.25, handleTopRightClick);
			createButton(0, 1, paddleDistance, -paddleDistance / 2 + 0.25, handleBotRightClick);
		}

		function handleTopLeftClick() {
			console.log("Top Left button clicked – acción A");
			if (paddle1.position.y < maxUpDown + sphereRadius / 2 && !paddle1.intersectsMesh(sphere, true))
				paddle1.position.y += paddleSpeed;
		}

		function handleBotLeftClick() {
			console.log("Bot Left button clicked – acción B");
			if (paddle1.position.y > -maxUpDown - sphereRadius / 2 && !paddle1.intersectsMesh(sphere, true))
				paddle1.position.y -= paddleSpeed;
		}

		function handleTopRightClick() {
			console.log("Top Right button clicked – acción C");
			if (paddle2.position.y < maxUpDown + sphereRadius / 2 && !paddle2.intersectsMesh(sphere, true))
				paddle2.position.y += paddleSpeed;
		}

		function handleBotRightClick() {
			console.log("Bot Right button clicked – acción D");
			if (paddle2.position.y > -maxUpDown - sphereRadius / 2 && !paddle2.intersectsMesh(sphere, true))
				paddle2.position.y -= paddleSpeed;
		}

		//CAMERA ZOOM BUTTONS
		var ZoomInVar: HolographicButton = new HolographicButton("ZoomIn");
		function  createZoomInButton(posY: number, posX: number, onHold: () => void) {
			ZoomInVar.position = new BABYLON.Vector3(posY, posX, -0.7);
			ZoomInVar.scaling = new BABYLON.Vector3(6, 1, 1);
            ZoomInVar.text = `Zoom In`;
			ZoomInVar.pointerEnterAnimation = () => {true }; // nada
			ZoomInVar.pointerOutAnimation = () => {true };
			ZoomInVar.pointerDownAnimation = () => { true};
			ZoomInVar.pointerUpAnimation = () => {true };
			manager.addControl(ZoomInVar);
			const control: ButtonRepeatControl = { intervalId: null, isHeld: false };
			// Mantener pulsado
			ZoomInVar.pointerDownAnimation = () => {
				if (!control.isHeld) {
					control.isHeld = true;
					control.intervalId = window.setInterval(onHold, 50);
				}
			};
			// Soltar botón
			ZoomInVar.pointerUpAnimation = () => {
				control.isHeld = false;
				if (control.intervalId !== null) {
					clearInterval(control.intervalId);
					control.intervalId = null;
				}
			};

			// Por seguridad, también al salir del área del botón
			ZoomInVar.pointerOutAnimation = () => {
				control.isHeld = false;
				if (control.intervalId !== null) {
					clearInterval(control.intervalId);
					control.intervalId = null;
				}
			};
			// console.log("gamemode es ", puntuation.gameMode);
			// console.log(" puntuation.online es  ", puntuation.online);
		}
		function ZoomIn() {
			console.log("Zoom In pushed");
			if (cameraZoom < -10)
			cameraZoom += 1;
		// camera.attachControl(true);	//comentado para que no se mueva
		camera.setPosition(new BABYLON.Vector3(0, 0, cameraZoom));
		}
		createZoomInButton(0,maxUpDown + paddleHeight / 2 + sphereRadius + paddleWidth / 2 ,ZoomIn)

		var ZoomOutVar: HolographicButton = new HolographicButton("ZoomOut");
		function  createZoomOutButton(posY: number, posX: number, onHold: () => void) {
			ZoomOutVar.position = new BABYLON.Vector3(posY, posX, -0.7);
			ZoomOutVar.scaling = new BABYLON.Vector3(6, 1, 1);
            ZoomOutVar.text = `Zoom Out`;
			ZoomOutVar.pointerEnterAnimation = () => {true }; // nada
			ZoomOutVar.pointerOutAnimation = () => {true };
			ZoomOutVar.pointerDownAnimation = () => { true};
			ZoomOutVar.pointerUpAnimation = () => {true };
			manager.addControl(ZoomOutVar);
			const control: ButtonRepeatControl = { intervalId: null, isHeld: false };
			// Mantener pulsado
			ZoomOutVar.pointerDownAnimation = () => {
				if (!control.isHeld) {
					control.isHeld = true;
					control.intervalId = window.setInterval(onHold, 50);
				}
			};
			// Soltar botón
			ZoomOutVar.pointerUpAnimation = () => {
				control.isHeld = false;
				if (control.intervalId !== null) {
					clearInterval(control.intervalId);
					control.intervalId = null;
				}
			};

			// Por seguridad, también al salir del área del botón
			ZoomOutVar.pointerOutAnimation = () => {
				control.isHeld = false;
				if (control.intervalId !== null) {
					clearInterval(control.intervalId);
					control.intervalId = null;
				}
			};
			// console.log("gamemode es ", puntuation.gameMode);
			// console.log(" puntuation.online es  ", puntuation.online);
		}
		function ZoomOut() {
			console.log("Zoom Out pushed");
			if (cameraZoom > -20)
			cameraZoom -= 1;
		// camera.attachControl(true);	//comentado para que no se mueva
		camera.setPosition(new BABYLON.Vector3(0, 0, cameraZoom));
		}
		createZoomOutButton(0,-(maxUpDown + paddleHeight / 2 + sphereRadius + paddleWidth / 2) ,ZoomOut)

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
			puntuation.dx = ballInitDir.x;
			puntuation.dy = ballInitDir.y;
		}

		// INIT BALL
		resetBall();

		// MOVEMENT
		scene.onBeforeRenderObservable.add(function () {
			if (puntuation.gameState === 'playing') {
				// 	// Sincronización con el oponente
				// 	ballInitDir.x = puntuation.dx;
				// 	ballInitDir.y = puntuation.dy;
				// 	//
				// 	// Formula guay
				// 	//
				// 	sphere.position.x += ballInitDir.x;
				// 	sphere.position.y += ballInitDir.y;
				// 	sphere.rotation.x += ballInitDir.x;
				// 	sphere.rotation.y += ballInitDir.y;

				// 	// collisions with paddles
				// 	if (sphere.intersectsMesh(paddle2, true) && ballInitDir.x > 0) { //false for less precission, more efficiency 
				// 		ballInitDir.x *= -1;
				// 		puntuation.dx = ballInitDir.x;
				// 	}
				// 	if (sphere.intersectsMesh(paddle1, true) && ballInitDir.x < 0) {
				// 		ballInitDir.x *= -1;
				// 		puntuation.dx = ballInitDir.x;
				// 	}

				// 	// collisions up and down
				// 	if (sphere.position.y >= maxUpDown + paddleHeight / 2)
				// 		ballInitDir.y *= -1;
				// 		puntuation.dy = ballInitDir.y;
				// 	if (sphere.position.y <= -maxUpDown - paddleHeight / 2)
				// 		ballInitDir.y *= -1;
				// 		puntuation.dy = ballInitDir.y;

				// 	// out of table
				// 	if (sphere.position.x >= paddleDistance + paddleWidth / 2) {
				// 		puntuation.pl++;
				// 		resetBall();
				// 	}
				// 	if (sphere.position.x <= -paddleDistance - paddleWidth / 2)
				// 	{
				// 		puntuation.pr++;
				// 		resetBall();
				// 	}

				/////////

				// Solo el anfitrión (newGame) calcula la física de la bola
				if (puntuation.online === 0 || (puntuation.online === 1 && puntuation.gameMode === 'newGame')) {
					// Movimiento de la bola
					sphere.position.x += ballInitDir.x;
					sphere.position.y += ballInitDir.y;
					sphere.rotation.x += ballInitDir.x;
					sphere.rotation.y += ballInitDir.y;

					// collisions with paddles
					if (sphere.intersectsMesh(paddle2, true) && ballInitDir.x > 0) {
						ballInitDir.x *= -1;
						puntuation.dx = ballInitDir.x;
					}
					if (sphere.intersectsMesh(paddle1, true) && ballInitDir.x < 0) {
						ballInitDir.x *= -1;
						puntuation.dx = ballInitDir.x;
					}

					// collisions up and down
					if (sphere.position.y >= maxUpDown + paddleHeight / 2) {
						ballInitDir.y *= -1;
						puntuation.dy = ballInitDir.y;
					}
					if (sphere.position.y <= -maxUpDown - paddleHeight / 2) {
						ballInitDir.y *= -1;
						puntuation.dy = ballInitDir.y;
					}

					// out of table
					if (sphere.position.x >= paddleDistance + paddleWidth / 2) {
						puntuation.pl++;
						resetBall();
					}
					if (sphere.position.x <= -paddleDistance - paddleWidth / 2) {
						puntuation.pr++;
						resetBall();
					}
				} else {
					// Los clientes solo actualizan la posición según los datos recibidos
					sphere.position.x += puntuation.dx;
					sphere.position.y += puntuation.dy;
					sphere.rotation.x += puntuation.dx;
					sphere.rotation.y += puntuation.dy;
				}

				//////////

				if (puntuation.pl >= maxscore || puntuation.pr >= maxscore) {
					puntuation.gameState = 'gameOver';
					// // Guardar partida
					// createGame("pong",username,"Invitado",puntuation.pl,puntuation.pr);
				}

				// paddle controls
				if (puntuation.online === 0) {
					if (inputMap['w'] && paddle1.position.y < maxUpDown + sphereRadius / 2 && !paddle1.intersectsMesh(sphere, true))
						paddle1.position.y += paddleSpeed;
					if (inputMap['s'] && paddle1.position.y > -maxUpDown - sphereRadius / 2 && !paddle1.intersectsMesh(sphere, true))
						paddle1.position.y -= paddleSpeed;
					if (inputMap['ArrowUp'] && paddle2.position.y < maxUpDown + sphereRadius / 2 && !paddle2.intersectsMesh(sphere, true))
						paddle2.position.y += paddleSpeed;
					if (inputMap['ArrowDown'] && paddle2.position.y > -maxUpDown - sphereRadius / 2 && !paddle2.intersectsMesh(sphere, true))
						paddle2.position.y -= paddleSpeed;
				} else {
					if (puntuation.playerPaddle) {
						if (inputMap['ArrowUp'] && puntuation.playerPaddle.position.y < maxUpDown + sphereRadius / 2 && !puntuation.playerPaddle.intersectsMesh(sphere, true))
							puntuation.playerPaddle.position.y += paddleSpeed;
						if (inputMap['ArrowDown'] && puntuation.playerPaddle.position.y > -maxUpDown - sphereRadius / 2 && !puntuation.playerPaddle.intersectsMesh(sphere, true))
							puntuation.playerPaddle.position.y -= paddleSpeed;
					}
				}
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