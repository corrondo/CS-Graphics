pc.script.create('box', function(app){
	// Creates a new Box instance
	var Box = function (entity){
		this.entity = entity;
		this.posNow = new pc.Vec3();    // Current pos -1, 0, or 1
		this.vecTemp = new pc.Vec3();	// Used for lerping
		this.posEnd = new pc.Vec3();	// Start position
		this.posStrt = new pc.Vec3();	// End position
		this.faces = null;				// All faces
		this.base = null;				// Base for easy positioning
		this.cubicle = null;			// Entity containing faces + base
		this.type = "";					// Wether box is a corner, center, or edge
		this.status = "";				// Current action performed by box
		this.quatNow = new pc.Quat();	// Current Quaternion
		this.quatTrg = new pc.Quat();	// Target Quaternion
		this.quatTmp = new pc.Quat();	// Temporary Quaternion
		this.frameCount = 0;			// Turn counter
		this.t = 0;						// Time (0 - 1)
		this.speed = 2;
	};

	Box.prototype = {
		// Called once after all resources are loaded and before the first update
		initialize: function(){
			console.log("initializing");
			// Filters children that aren't a face
			function isAFace(thisChild){
				if(thisChild.getName() === "Base"){
					return false;
				}else{
					return true;
				}
			}

			this.cubicle = this.entity.findByName("Cubicle");
			this.base = this.entity.findByName("Base");
			this.faces = this.cubicle.getChildren().filter(isAFace);
			this.setNewPos();
			this.setType();
               if(this.status === "rotating"){
                this.cubicle.translateLocal(3, 3, 3);
            }
		},

		// Called every frame, dt is time in seconds since last update
		update: function(dt){
			switch(this.status){
				case "rotating":
				case "autoRotating":
				case "superFlipping":
					this.updateRotation(dt);
				break;
				case "extruding":
					this.updateExtrusion(dt);
				break;
				case "intruding":
					this.updateIntrusion(dt);
				break;
			}
         
		},
		
		// Sets new properties after a rotation
		setNewPos: function(){
			this.posNow.set(
				Math.min(Math.max(Math.round(this.base.getPosition().x), -1), 1),
				Math.min(Math.max(Math.round(this.base.getPosition().y), -1), 1),
				Math.min(Math.max(Math.round(this.base.getPosition().z), -1), 1)
			);
		},

		// Determines wether a corner, center, or edge piece
		setType: function(){
			// Counts number of '1's
			switch(this.entity.getName().split("1").length - 1){
				case 0: this.type = "corner"; 	break;
				case 1: this.type = "edge"; 	break;
				case 2: this.type = "center"; 	break;
			}
		},

		// Returns Vec3 of current position if not busy
		getPos: function(){
			if(this.status){
				return false;
			}else{
				return this.posNow;
			}
		},

		// Sets target rotation
		setTargetRotation: function(axis){
			this.quatNow = this.entity.getRotation();

			// Add 90-degree rotation
			switch(axis){
				case "-x":
					this.quatTmp.setFromAxisAngle(pc.Vec3.RIGHT, -90);
				break;
				case "x":
					this.quatTmp.setFromAxisAngle(pc.Vec3.RIGHT, +90);
				break;
				case "-y":
					this.quatTmp.setFromAxisAngle(pc.Vec3.UP, -90);
				break;
				case "y":
					this.quatTmp.setFromAxisAngle(pc.Vec3.UP, +90);
				break;
				case "-z":
					this.quatTmp.setFromAxisAngle(pc.Vec3.FORWARD, -90);
				break;
				case "z":
					this.quatTmp.setFromAxisAngle(pc.Vec3.FORWARD, +90);
				break;
			}

			// Multiply to overall target rotation
			this.quatTrg.mul2(this.quatTmp, this.quatTrg);
		},

		////////////////////// CALLS FROM BOX.JS //////////////////////
		// Triggers rotation motion
		rotate: function(axis){
			if(this.status !== ""){return false;}
			this.speed = 0.8;
			this.setTargetRotation(axis);
			this.frameCount = 0;
			this.status = "rotating";
			return true;
		},

		// Triggers auto rotation
		autoRotate: function(axis){
			if(this.status !== ""){return false;}
			this.speed = 2;
			this.setTargetRotation(axis);
			this.frameCount = 0;
			this.status = "autoRotating";
			return true;
		},

		// Starts superflip procedure
		startSuperflip: function(axis, startDelay){
			this.speed = .2;
			this.setTargetRotation(axis);
			this.frameCount = startDelay * -1;
			this.posEnd = this.posNow;
			this.status = "extruding";
		},

		// Lights up face, returns its axis
		faceActivate: function(face){
			// Substitute material to on state
			face.model.materialAsset = app.assets.find(face.getName() + "-on");

			// Returns axis
			if(Math.abs(face.getPosition().x) > 1.2){
				return "x";
			}
			else if(Math.abs(face.getPosition().y) > 1.2){
				return "y";
			}
			else if(Math.abs(face.getPosition().z) > 1.2){
				return "z";
			}
		},

		// Turns off face
		faceDeactivate: function(face){
			face.model.materialAsset = app.assets.find(face.getName());
		},

		// Turns face white
		faceWhiteout: function(face){
			face.model.materialAsset = app.assets.find("myMat1");
		},

		// Returns color to faces
		faceColorize: function(face){
			face.model.materialAsset = app.assets.find(face.getName());
		},

		// Returns random face
		getRandomFace: function(){
			return this.faces[Math.round(Math.random() * (this.faces.length - 1))];
		},

		////////////////////// ANIMATION UPDATERS //////////////////////
		// Animates rotation
		updateRotation: function(dt){
			this.frameCount += (dt * this.speed);
			this.t = 1 - Math.pow((1 - this.frameCount), 3);
			this.entity.setRotation(this.quatTmp.slerp(this.quatNow, this.quatTrg, this.t));
			
            
			// When animation is over
			if(this.t >= 1){
				this.rotationComplete();
			}
		},

		// Animates extrusion
		updateExtrusion: function(dt){
			this.frameCount += (dt * 2);
			if(this.frameCount >= 0){
				this.t = 1 - Math.pow((1 - this.frameCount), 3);
			}else{
				this.t = 0;
			}

			this.cubicle.setPosition(this.vecTemp.lerp(
				pc.Vec3.ZERO,
				this.posEnd,
				this.t
			));
			
			if(this.t >= 1){
				this.frameCount = 0;
				this.status = "superFlipping";
			}
		},

		// Animates intrusion
		updateIntrusion: function(dt){
			this.frameCount += (dt * 2);
			this.t = 1 - Math.pow((1 - this.frameCount), 3);

			this.cubicle.setPosition(this.vecTemp.lerp(
				this.posNow,
				pc.Vec3.ZERO,
				this.t
			));
			
			if(this.t >= 1){
				this.frameCount = 0;
				this.status = "";
				this.setNewPos();
			}
		},

		// At the end of a rotation
		rotationComplete: function(){
			this.setNewPos();
			if(this.status === "superFlipping"){
				this.frameCount = 0;
				this.status = "intruding";
			}else{
				this.frameCount = 0;
				this.status = "";
				this.entity.getParent().script.cube.rotationComplete();
			}
		}
	};

	return Box;
});