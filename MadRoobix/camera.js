pc.script.attribute('maxElevation', 'number', 70, {
	displayName: "Max Elevation"
});

pc.script.create("camera", function(app){
	 
	var Camera = function(entity){
		this.entity = entity;

		// Position
		this.viewPos = new pc.Vec3();
		this.targetViewPos = new pc.Vec3();
		this.tempVec = new pc.Vec3();
		// Distance
		this.distance = 3;
		this.targetDistance = 8;
		this.tempDistance = 8;
		// Rotations
		this.rotX = -180;
		this.rotY = 0;
		this.targetRotX = -40;
		this.targetRotY = 30;
		this.quatX = new pc.Quat();
		this.quatY = new pc.Quat();

		this.cubeScript = null;			// Connects to cube.js
		this.hammer = 0;				// Hammer object
		this.pinch = new pc.Vec2();		// Tracks pinch position
		this.moveActive = false;		// Is there an active touchMove

		this.w = 0;						// Keeps width of canvas
		app.mouse.disableContextMenu();
	};

	Camera.prototype = {
		initialize: function(){
			var touchOptions ={
				recognizers:[
					[Hammer.Pan,	{direction: Hammer.DIRECTION_ALL}],
					[Hammer.Pinch, 	{enable: true}],
					[Hammer.Press, 	{enable: true, time: 5}]
				]
			};

			// Touch events
			this.hammer = new Hammer(app.graphicsDevice.canvas, touchOptions);
			this.hammer.on('press', 		this.touchStart.bind(this));
			this.hammer.on('pressup', 		this.touchEnd.bind(this));
			this.hammer.on('pan', 			this.touchMove.bind(this));
			this.hammer.on('panend', 		this.touchEnd.bind(this));
			this.hammer.on('pinchstart',	this.touchPinchStart.bind(this));
			this.hammer.on('pinch', 		this.touchPinch.bind(this));
			this.hammer.on('pinchend', 		this.touchPinchEnd.bind(this));

			// Mouse / Keyboard events
			app.mouse.on(pc.input.EVENT_MOUSEMOVE, this.onMouseMove, this);
			app.mouse.on(pc.input.EVENT_MOUSEWHEEL, this.onMouseWheel, this);

			this.cubeScript = app.root.findByName("Cube").script.cube;

			window.addEventListener('orientationchange', this.getWidth.bind(this));
			window.addEventListener('resize', this.getWidth.bind(this));
			this.getWidth();
		},
		
		update: function(dt){
			// Implement a delay in camera controls by lerping towards a target
			this.viewPos.lerp(this.viewPos, this.targetViewPos, dt / 0.1);
			this.distance = pc.math.lerp(this.distance, this.targetDistance, dt / 0.2);
			this.rotX = pc.math.lerp(this.rotX, this.targetRotX, dt / 0.2);
			this.rotY = pc.math.lerp(this.rotY, this.targetRotY, dt / 0.2);

			// Calculate the camera's rotation
			this.quatX.setFromAxisAngle(pc.Vec3.RIGHT, -this.rotY);
			this.quatY.setFromAxisAngle(pc.Vec3.UP, -this.rotX);
			this.quatY.mul(this.quatX);

			// Set the camera's current position and orientation
			this.entity.setPosition(this.viewPos);
			this.entity.setRotation(this.quatY);
			this.entity.translateLocal(0, 0, this.distance);
		},
		
		reset: function(target, distance){
			this.viewPos.copy(target);
			this.targetViewPos.copy(target);

			this.targetDistance = distance;
			this.targetRotX = -45;
			this.targetRotY = 30;
		},

		pan: function(movex, movey){
			// Pan around in the camera's local XY plane
			this.tempVec.copy(this.entity.right).scale(movex);
			this.targetViewPos.add(this.tempVec);
			this.tempVec.copy(this.entity.up).scale(movey);
			this.targetViewPos.add(this.tempVec);
		},

		dolly: function(movez){
			// Dolly along the Z axis of the camera's local transform
			this.targetDistance += movez;
			if (this.targetDistance < 4){
				this.targetDistance = 4;
			}
		},

		orbit: function(movex, movey){
			this.targetRotX += movex;
			this.targetRotX = pc.math.clamp(this.targetRotX, -90, 0);
			this.targetRotY += movey;
			this.targetRotY = pc.math.clamp(this.targetRotY, -this.maxElevation, this.maxElevation);
		},

		onMouseWheel: function(event){
			event.event.preventDefault();
			this.targetDistance += event.wheel * -0.25;
			if (this.targetDistance < 5){
				this.targetDistance = 5;
			}
		},

		onMouseMove: function(event){
			if (event.buttons[pc.input.MOUSEBUTTON_RIGHT]){
				this.orbit(event.dx * 0.2, event.dy * 0.2);
			}
		},

		////////////////////// TOUCH EVENT LISTENERS //////////////////////
		// Selects a face
		touchStart: function(ev){
			var from = this.entity.getPosition();
			var to = this.entity.camera.screenToWorld(ev.center.x, ev.center.y, this.entity.camera.farClip);

			app.systems.rigidbody.raycastFirst(from, to, function(result){
				this.cubeScript.pick(result.entity);
			}.bind(this));

			this.moveActive = true;
		},

		// Deselects active face
		touchEnd: function(ev){
			this.cubeScript.faceDeselect();
			this.moveActive = false;
		},

		// Tracks movement, triggers rotations
		touchMove: function(ev){
			if(this.moveActive === false){return false;}

			switch (this.cubeScript.faceAxis){
				case null:
					this.moveCube(ev);
				break;
				case "x":
					this.moveFaceX(ev);
				break;
				case "y":
					this.moveFaceY(ev);
				break;
				case "z":
					this.moveFaceZ(ev);
				break;
			}
		},

		// Set center of pinch
		touchPinchStart: function(ev){
			this.pinch.set(ev.center.x, ev.center.y);
		},

		// Pinch zooms and orbits
		touchPinch: function(ev){
			this.orbit((ev.center.x - this.pinch.x) * 0.2, (ev.center.y - this.pinch.y) * 0.2);
			this.pinch.set(ev.center.x, ev.center.y);

			this.targetDistance = this.tempDistance * (2 - ev.scale);
			if (this.targetDistance < 6){
				this.targetDistance = 6;
			}
		},

		// Pinch end
		touchPinchEnd : function(ev){
			this.tempDistance = this.targetDistance;
		},

		////////////////////// MOVE CUBE FACES //////////////////////
		moveCube: function(ev){
			// Checks X motion
			if(ev.deltaX < -10){
				this.cubeScript.rotate("-y");
				this.moveActive = false;
			}else if(ev.deltaX > 10){
				this.cubeScript.rotate("y");
				this.moveActive = false;
			}

			// Checks Y motion
			else if(ev.deltaY < -10){
				if(ev.center.x < this.w){
					this.cubeScript.rotate("-x");
				}else{
					this.cubeScript.rotate("-z");
				}
				this.moveActive = false;
			}else if(ev.deltaY > 10){
				if(ev.center.x < this.w){
					this.cubeScript.rotate("x");
				}else{
					this.cubeScript.rotate("z");
				}
				this.moveActive = false;
			}
		},

		moveFaceX:function(ev){
			// Left
			if(ev.deltaX < -10){
				this.cubeScript.rotate("-y");
				this.moveActive = false;
			}
			// Right
			else if(ev.deltaX > 10){
				this.cubeScript.rotate("y");
				this.moveActive = false;
			}
			// Up
			else if(ev.deltaY < -10){
				this.cubeScript.rotate("-z");
				this.moveActive = false;
			}
			// Down
			else if(ev.deltaY > 10){
				this.cubeScript.rotate("z");
				this.moveActive = false;
			}
		},

		moveFaceY:function(ev){
			// Up-left
			if(ev.deltaX < -10 && ev.deltaY < -10){
				this.cubeScript.rotate("-z");
				this.moveActive = false;
			}
			// Up-right
			else if(ev.deltaX > 10 && ev.deltaY < -10){
				this.cubeScript.rotate("-x");
				this.moveActive = false;
			}
			// Down-right
			else if(ev.deltaX > 10 && ev.deltaY > 10){
				this.cubeScript.rotate("z");
				this.moveActive = false;
			}
			// Down-left
			else if(ev.deltaX < -10 && ev.deltaY > 10){
				this.cubeScript.rotate("x");
				this.moveActive = false;
			}
		},

		moveFaceZ:function(ev){
			// Left
			if(ev.deltaX < -10){
				this.cubeScript.rotate("-y");
				this.moveActive = false;
			}
			// Right
			else if(ev.deltaX > 10){
				this.cubeScript.rotate("y");
				this.moveActive = false;
			}
			// Up
			else if(ev.deltaY < -10){
				this.cubeScript.rotate("-x");
				this.moveActive = false;
			}
			// Down
			else if(ev.deltaY > 10){
				this.cubeScript.rotate("x");
				this.moveActive = false;
			}
		},

		// Get the width of entire window
		getWidth: function(){
			this.w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
			this.w /= 2;
		}
	};
	
	return Camera;
});

// Using JQuery http://answers.playcanvas.com/questions/1034/how-to-call-a-script-function-from-outside-the-canvas

// Font ideas:
/*
	Exo
	Exo 2
	Josefin Sans
	Jura - display
	Source code Pro - timer
*/