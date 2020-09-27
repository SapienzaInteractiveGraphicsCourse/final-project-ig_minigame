
"use strict"


/**
 * This model will contain the Tank class and its method definition.
*/



class Tank {


    /** 
     * @param {Array} tankMeshes  an array of BABYLON.Mesh objects. It represents the set of meshes
     *                            that represent the components of the imported tank.
     * @param {BABYLON.Mesh} rootMesh the BABYLON.Mesh object representing the root of the hierarchical model.
     * @param {BABYLON.Scene} scene the object representing the current scene.
     * @param {Number} id the id of the model. It will be used to give the model a (hopefully unique although this is not double checked in the code)
     *                     so that it can be easily referenced somewhere else in the code.
     * @param {Float} scaling scaling factor applied along each dimension to all the tank meshes. It
     *                    is used to enlarge or tighten the tank model.
     * @param {String} name a string representing the name of the tank.
     * @param {String} team a string representing the team of the tank. It could be 'red', 'blue' or 'neutral'.
     * @param {Boolean} isClone a boolean parameter determining whether this tank is not a clone.
     * @todo Check the bounding box constant parameters. The bounding boxes and the collision
     * system may be buggy and cause undesired behaviour. 
     */

    constructor(tankMeshes, rootMesh, scene, id, scaling, name = 'tank', team = 'neutral', isClone = false) {

        this.tankMeshes = tankMeshes;

        this.name = name;

        this.scene = scene;

        var root = rootMesh;


        this.id = id;

        this.team = team;

        root.parent = null;


        this.isClone = isClone;

        //Define the parent of the children nodes.

        /**
         * The wheels must be children of the root. 
        */


        var wheels = this.getWheels();
        if (!this.isClone) {
            for (var i = 0; i < wheels.length; ++i) {
                wheels[i].parent = root;
                root.addChild(wheels[i]);
            }
        }


        /**
         * Also the body must be a child of the root. 
        */

        var body = this.getBody();
        if (!this.isClone) {
            body.parent = root;
            root.addChild(body);
        }




        /**
         * The turret must be a child of the root 
        */

        var turret = this.getTurret();
        if (!this.isClone) {
            turret.parent = root;
            root.addChild(turret);
        }




        /**
         * The cannon must be a child of the turret. 
        */


        var cannon = this.getCannon();

        if (!this.isClone) {
            cannon.parent = turret;
            turret.addChild(cannon);
            //Adjust the initial position of the cannon.
            cannon.position.y -= 1.2;
            cannon.position.z += 0.66;
        }


        /**
         * The wings must be children of the root 
        */

        var wings = this.getWings();
        if (!this.isClone) {
            for (var i = 0; i < wings.length; ++i) {
                wings[i].parent = root;
                root.addChild(wings[i]);
            }
        }




        /**
         * The side wheels must be children of the root
        */
        var sideWheels = this.getSideWheels();
        if (!this.isClone) {
            for (var i = 0; i < sideWheels.length; ++i) {
                sideWheels[i].parent = root;
                root.addChild(sideWheels[i]);

            }
        }



        root.Tank = this;
        this.root = root;




        //The root box of the model is somehow bugged and we do not want to display it.
        root.isVisible = false;



        this.speed = 0;
        this.scaling = scaling;



        this.scaleTank(this.scaling);


        /**Handle the rotation of the tank. This front vector determines the orientation of 
         * the tank with respect to its movement direction. In this case it will be  a property of the
         * Mesh.
        **/

        this.frontVector = new BABYLON.Vector3(0.0, 0.0, 1.0);



        //Initialize some constants determining the (forward/backward) maximum movement speed for the tank.
        if (Tank.MAX_MOVEMENT_SPEED_FORWARD == undefined) {
            Tank.MAX_MOVEMENT_SPEED_FORWARD = 2.5;
        }


        if (Tank.MAX_MOVEMENT_SPEED_BACKWARD == undefined) {
            Tank.MAX_MOVEMENT_SPEED_BACKWARD = -1.5;
        }




        //Adjust the initial position of the tank
        this.root.rotate(new BABYLON.Vector3(0, 1, 0), Math.PI);




        /**
         * Boolean paramter used "outside" the class in order to avoid calling the enableTexture
         * function at every render loop (it increases efficiency).
        */
        this.isTextureEnabled = false;


        /**
         * To define the tank fire ratio. You can't fire every single time you press the 
         * mouse left button.
        */
        this.canFireCannonBall = true;

        //Same for the machine gun
        this.canFireGun = true;



        /**
         * Define constant weapon names as static variables for the class Tank 
        */

        if (Tank.CANNON == undefined) {
            Tank.CANNON = 0;
        }


        if (Tank.MACHINE_GUN == undefined) {
            Tank.MACHINE_GUN = 1;
        }

        if (Tank.START_CANNON_BULLET == undefined) {
            Tank.START_CANNON_BULLET = 10;
        }


        if (Tank.CANNON_DAMAGE == undefined) {
            Tank.CANNON_DAMAGE = 2;
        }

        if (Tank.START_MACHINE_GUN_BULLET == undefined) {
            Tank.START_MACHINE_GUN_BULLET = 100;
        }

        if (Tank.MAX_CANNON_BULLET == undefined) {
            Tank.MAX_CANNON_BULLET = 30;
        }


        if (Tank.MAX_MACHINE_GUN_BULLETS == undefined) {
            Tank.MAX_MACHINE_GUN_BULLETS = 200;
        }


        if (Tank.MACHINE_GUN_DAMAGE == undefined) {
            Tank.MACHINE_GUN_DAMAGE = 1;
        }


        if (Tank.MACHINE_GUN_COOLDOWN_HEROTANK == undefined) {
            Tank.MACHINE_GUN_COOLDOWN_HEROTANK = 750;
        }

        if (Tank.MACHINE_GUN_COOLDOWN_CLONETANK == undefined) {
            Tank.MACHINE_GUN_COOLDOWN_CLONETANK = 4500;
        }



        //Initialize the current count for cannon bullets and machine gun bullets.
        this.currentWeapon = Tank.CANNON;
        this.cannonBullet = Tank.START_CANNON_BULLET;
        this.machineGunBullet = Tank.START_MACHINE_GUN_BULLET;





        /** 
         * Define some constant parameters that will serve the purpose of building the bounding
         * boxes. The bounding box parameter computation is not perfect and needs to be adjested at 
         * run time in order to make the tank able to collide with objects.
         * Tune directly these parameters to change the behaviour of the tank bounding box.
        */

        if (Tank.bounderXScaleMultiplier == undefined) {
            Tank.bounderXScaleMultiplier = 11.0;
        }

        if (Tank.bounderYScaleMultiplier == undefined) {
            Tank.bounderYScaleMultiplier = 1.5;
        }


        if (Tank.bounderZScaleMultiplier == undefined) {
            Tank.bounderZScaleMultiplier = 11.0;
        }


        if (Tank.bounderXPositionMultiplier == undefined) {
            Tank.bounderXPositionMultiplier = 1.8;
        }


        if (Tank.bounderYPositionMultiplier == undefined) {
            Tank.bounderYPositionMultiplier = 0.098;
        }

        if (Tank.bounderZPositionMultiplier == undefined) {
            Tank.bounderZPositionMultiplier = 2.0;
        }


        /**
         * Calculate the parameters of the bounding box of the tank.
         * Store them as a "static" (class) variable that will be computed just once. 
        */




        if (Tank.boundingBoxParameters == undefined) {
            Tank.boundingBoxParameters = this.CalculateBoundingBoxParameters();
        }

        //Create then, the bounding box with all the relevant parameters
        this.bounder = this.createBoundingBox();
        this.bounder.isVisible = false;






        /**Define constants for the Tank armor type (to be used later to define some advanced)
         * interaction.
        */

        if (Tank.ARMOR_TYPE_HEAVY == undefined) {
            Tank.ARMOR_TYPE_HEAVY = 0;
        }

        if (Tank.ARMOR_TYPE_LIGHT == undefined) {
            Tank.ARMOR_TYPE_LIGHT = 1;
        }




        /**
         * Now we need to define the status of the hero tank: the health, the bullets
         * the current weapon, bonus malus etc
         *  
        */

        //Define some constants
        if (Tank.START_HEALTH == undefined) {
            Tank.START_HEALTH = 10;
        }


        if (Tank.MAX_HEALTH == undefined) {
            Tank.MAX_HEALTH = 30;
        }

        if (Tank.STARTING_POINTS == undefined) {
            Tank.STARTING_POINTS = 0;
        }

        this.tankStatus = {
            'health': Tank.START_HEALTH,
            'currentWeapon': Tank.CANNON,
            'cannonBullets': Tank.START_CANNON_BULLET,
            'machineGunBullets': Tank.START_MACHINE_GUN_BULLET,
            'armorType': Tank.ARMOR_TYPE_HEAVY,
            'points': Tank.STARTING_POINTS
        }





        //Define a proba value for the AI random behaviour
        if (this.isClone) {
            this.probaValue = 0.1;
        }



        //Define some constants that will be used for the particle system
        if (Tank.CANNON_BALL_TIMEOUT == undefined) {
            Tank.CANNON_BALL_TIMEOUT = 1500;
        }

        //If it is undefined, create the particle system
        var particleSystemObject = this.createTankParticleSystem("Cannon Particle".concat(this.id.toString()));

        //Collect the sphere emitter and the particle system.
        this.cannonParticleSystem = particleSystemObject.particleSystem;
        this.cannonSphereEmitter = particleSystemObject.sphereEmitter;


        //Create another particle system that will be used when the ball hits the tank.

        particleSystemObject = this.createTankParticleSystem("Tank Particle".concat(this.id.toString()));

        //Collect the sphere emitter and the particle system.
        this.tankParticleSystem = particleSystemObject.particleSystem;
        this.tankSphereEmitter = particleSystemObject.sphereEmitter;




        //Customize the tank particle sytem that will model explosions.

        this.tankParticleSystem.minEmitPower = 15;
        this.tankParticleSystem.maxEmitPower = 20;
        this.tankParticleSystem.emitRate = 10000;

        this.tankParticleSystem.minSize = 1.7;
        this.tankParticleSystem.maxSize = 1.9;

        // Life time of each particle (random between...
        this.tankParticleSystem.minLifeTime = 0.5;
        this.tankParticleSystem.maxLifeTime = 0.8;

        //Customize the radius of the sphere emitter to model explosions.
        this.tankSphereEmitter.radius = 1.5;









        //Join the red/blue team according to the preassigned team stored in this.team
        if (this.team == 'red') {
            this.joinRedTeam();
        }
        else if (this.team == 'blue') {
            this.joinBlueTeam();
        }


        //Create a different bounding box for hit purposes


        /**
         * Define some constants for the hit bounding box
        */


        if (Tank.bounderHitXScaleMultiplier == undefined) {
            Tank.bounderHitXScaleMultiplier = 4.0;
        }

        if (Tank.bounderHitYScaleMultiplier == undefined) {
            Tank.bounderHitYScaleMultiplier = 1.0;
        }


        if (Tank.bounderHitZScaleMultiplier == undefined) {
            Tank.bounderHitZScaleMultiplier = 4.0;
        }


        if (Tank.bounderHitXPositionMultiplier == undefined) {
            Tank.bounderHitXPositionMultiplier = 1.8;
        }


        if (Tank.bounderHitYPositionMultiplier == undefined) {
            Tank.bounderHitYPositionMultiplier = 0.098;
        }

        if (Tank.bounderHitZPositionMultiplier == undefined) {
            Tank.bounderHitZPositionMultiplier = 2.0;
        }



        this.hitBoundingBox = this.createHitBoundingBox();
        this.hitBoundingBox.isVisible = false;


        //It works with the hitBoundingBox.
        this.tankParticleSystem.emitter = this.hitBoundingBox;



        //Define a class static variable that determines the AI shooting.
        if (Tank.AI_SHOOTING_DISTANCE == undefined) {
            Tank.AI_SHOOTING_DISTANCE = 550;
        }


    }


    /** According to the predefined model we get the side wheels of the tank.
     * The names are visible in the sandbox.
     * The function returns an array of meshes containing the meshes of the tank.
     * Be aware of the fact that the body and the root are separate.
    */

    getSideWheels() {
        var scene = this.scene;
        var sideWheels = [];

        if (!this.isClone) {
            sideWheels.push(scene.getMeshByName("Box6"));
            sideWheels.push(scene.getMeshByName("Box12"));
        }
        else {

            /**
             * We will address the name of the cloned meshes using the BABYLON js naming conventions.
             * In BABYLON js each cloned mesh is named in the following way:
             * - If the cloned is a root of a hierarchical model then the name of the cloned mesh will be assigned
             *      to the string that is passed as argument of the mesh.clone() function. Let's say this name
             *      is "clone_1".
             * - If the cloned mesh has at least one children, the name of each child mesh will be given in the following
             *      way:
             *      Let's say the name of the root is "clone_1", the name of the cloned mesh will be
             *      "clone_1.<NameOriginalChildMesh>".
             *      If the child mesh has another child mesh then the convention name will be
             *      "clone_1.<NameOriginalChildMesh>.<NameOriginalChildOfChildMesh>" and so on and so forth.  
            */

            sideWheels.push(scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box6')));
            sideWheels.push(scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box12')));
        }
        return sideWheels;


    }



    /** According to the predefined model we get the body of the tank.
     * The names are visible in the sandbox.
     * The function returns an array of meshes containing the meshes of the tank.
     * Be aware of the fact that the body and the root are separate.
    */
    getBody() {
        var scene = this.scene;


        if (!this.isClone) {
            var body = scene.getMeshByName("Box13");
        }

        else {
            //See getSideWheels() for the documentation of the following lines.
            var body = scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box13'));
        }

        return body;
    }



    /** According to the predefined model we get the wings (minigonne) of the tank.
     * The names are visible in the sandbox.
     * The function returns an array of meshes containing the meshes of the tank.
    */
    getWings() {
        var scene = this.scene;
        var wings = [];

        if (!this.isClone) {
            wings.push(scene.getMeshByName("Box11"));
            wings.push(scene.getMeshByName("Box5"));
        }
        else {


            //See getSideWheels() for the documentation of the following lines.
            wings.push(scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box11')));
            wings.push(scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box5')));
        }
        return wings;
    }


    /** According to the predefined model we get the turret of the tank.
     * The names are visible in the sandbox.
     * The function returns an array of meshes containing the meshes of the tank.
    */

    getTurret() {
        var scene = this.scene;

        if (!this.isClone) {
            var turret = scene.getMeshByName("Box14");
        }
        else {

            //See getMesh() for the documentation of the following lines.
            var turret = scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box14'));
        }
        return turret;
    }


    /** According to the predefined model we get the cannon of the tank.
     * The names are visible in the sandbox.
     * The function returns an array of meshes containing the meshes of the tank.
    */
    getCannon() {
        var scene = this.scene;


        if (!this.isClone) {
            var cannon = scene.getMeshByName("Box15");
        }
        else {
            //See getSideWheels() for the documentation of the following lines.
            var cannon = scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box14.Box15'));
        }

        return cannon;
    }

    /** According to the predefined model we get the wheels of the tank.
     * The names are visible in the sandbox.
     * The function returns an array of meshes containing the meshes of the tank.
    */


    getWheels() {
        var wheels = [];

        var scene = this.scene;

        if (!this.isClone) {
            wheels.push(scene.getMeshByName("Box1"));
            wheels.push(scene.getMeshByName("Box10"));
            wheels.push(scene.getMeshByName("Box7"));
            wheels.push(scene.getMeshByName("Box9"));
            wheels.push(scene.getMeshByName("Box4"));
            wheels.push(scene.getMeshByName("Box3"));
        }
        else {

            //See getSideWheels() for the documentation of the following lines.
            wheels.push(scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box1')));
            wheels.push(scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box10')));
            wheels.push(scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box7')));
            wheels.push(scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box9')));
            wheels.push(scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box4')));
            wheels.push(scene.getMeshByName("clone_".concat(this.id.toString()).concat('.Box3')));
        }



        return wheels;

    }



    /**
     * This function adjust the position of the children of the mesh "mesh"
     * @param {BABYLON.Mesh} mesh the mesh which is the root of the subtree that needs to be updated.
     * @param {BABYLON.Vector3} movement a three dimensional vector representing the movement direction
     *                                    for the mesh to be updated.
     * @todo This code may be buggy for physical interactions. Handle it with care.
     */
    adjustChildrenPosition(mesh, movement) {
        var children = mesh.children;
        if (children == undefined) return;
        if (children.length == 0) return;


        /**
         * Update the position for every child.
         */
        for (var i = 0; i < children.length; ++i) {

            children[i].position = children[i].orPosition.add(movement);
            //Check if a child has a set of children (preorder visit).
            var ch = children[i].children;

            //Adjust recursively the position of the children.
            if (ch != undefined && ch.length != 0) {
                this.adjustChildrenPosition(children[i], movement);
            }


        }

    }


    /**
     * This function performs a rotation of the object using the root mesh as reference.
     * Thanks to Babylon js API, the rotation that is applied to the root node of the hierarchical model
     * is applied to each and every child in the mesh.
     * 
     * @param {BABYLON.Vector3} axes a BABYLON.Vector3 representing the direction of the desired rotation.
     * @param {Float} angle angle representing the rotaion angle 
    */

    rotateTank(axes, angle) {
        this.root.rotate(axes, angle);
    }


    /**
     * This function performs a movement of the hierarchical model (the Tank) without checking for
     * collisions. The movement is applied only to the root of the hierarchical model.Thanks to Babylon js API, the rotation that is 
     * applied to the root node of the hierarchical model is applied to each and every child in the mesh.
     * @param {BABYLON.Vector3} direction specifies the movement direction.
    */
    moveTank(direction) {
        this.root.move(direction)
    }


    /**
     * Get the vector representing the spawn point of the tank.
    */
    getSpawnPoint() {
        if (this.spawnPoint)
            return this.spawnPoint;
    }


    /**
     * Set the spawn position of the tank.
     * @param {BABYLON.Vector3} spawnPoint the three dimensional vector representing the spawn
     *                                      position of the tank.
    */
    setSpawnPoint(spawnPoint) {
        this.spawnPoint = new BABYLON.Vector3(spawnPoint.x, spawnPoint.y, spawnPoint.z);
        return;
    }


    /**
     * Instantly teleport the tank to its spawn position. The spawn position is a three dimensional
     * vector in the class. 
    */
    teleportSpawn() {

        //Use the moveTank function to adjust also the position of the bounding boxes (collision and hit bounding boxes).
        this.moveTank(new BABYLON.Vector3(this.spawnPoint.x, this.spawnPoint.y, this.spawnPoint.z));
        return;
    }

    /**
    * This function performs a movement of the hierarchical model (the Tank)  checking for
    * collisions. The movement is applied only to the root of the hierarchical model.Thanks to Babylon js API, the rotation that is applied to the root node of the hierarchical model
    * is applied to each and every child in the mesh.
    * @param {BABYLON.Vector3} direction specifies the movement direction.
   */
    moveWithCollisionsTank(direction) {
        this.root.moveWithCollisions(direction);
    }

    /**
     * A simple wrapper to change the position of the tank. It will change the position of the 
     * tank root as well as of the bounding boxes (movement and hit bounding boxes). 
     * @param {BABYLON.Vector3} position a three dimensional vector representing the new position 
     *                          of the tank.
    */
    moveTank(position) {

        //Move the bounding boxes.
        this.bounder.position.x = position.x;
        this.bounder.position.y = position.y;
        this.bounder.position.z = position.z;



        //Move the hit bounding boxes
        this.hitBoundingBox.position.x = position.x;
        this.hitBoundingBox.position.y = position.y;
        this.hitBoundingBox.position.z = position.z;


        //Move the root of the tank.
        this.root.position.x = position.x;
        this.root.position.y = position.y;
        this.root.position.z = position.z;


        return;

    }


    /**
     * Define a uniform scaling for the root and the children. The
     * scaling will be applied to the children automatically by BABYLON if applied to the root. 
     * @param {Float} scaling Define a uniform scaling factor for the three dimensions of the hierarchical Tank.
    */
    scaleTank(scaling) {
        this.root.scaling = new BABYLON.Vector3(scaling, scaling, scaling);
        return;
    }


    move() {



        /**
         * Before anything happens, check that the bounding box is defined 
        */


        if (!this.bounder && !this.hitBoundingBox) return;

        //Check that the object containing the bounding box paramters is defined.
        if (Tank.boundingBoxParameters == undefined) return;




        /**
         * Adjust the position of the root so that it matches the position of the tank,
         * the root position of the tank. In this way the bounding box and the root of the
         * tank will move togheter.
        */

        this.root.position = new BABYLON.Vector3(this.bounder.position.x,
            this.bounder.position.y,
            this.bounder.position.z);


        //Adjust the position of the hit bounding box.
        this.hitBoundingBox.position = new BABYLON.Vector3(this.root.position.x,
            this.root.position.y, this.root.position.z);



        var tankMesh = this.root;



        if (scene.activeCamera != scene.heroTankFollowCamera) return;




        //tank.speed contains the current vector that define the speed of the tank.
        if (WASD_handler.isWPressed || WASD_handler.isSPressed || WASD_handler.isAPressed || WASD_handler.isDPressed) {

            if (WASD_handler.isWPressed) {

                //Rotate the wheels clockwise to simulate movement.
                var speedWheels = -0.1;
                this.animateWheels(speedWheels);



                //Increase the speed up to a maximum value (the tank is accelerating).
                this.speed += 0.05;


                if (this.speed > Tank.MAX_MOVEMENT_SPEED_FORWARD)
                    this.speed = Tank.MAX_MOVEMENT_SPEED_FORWARD;



                //Now we move the bounding box according to the current achieved speed. 
                this.bounder.moveWithCollisions(this.frontVector.multiplyByFloats(this.speed, this.speed, this.speed));

            }

            if (WASD_handler.isSPressed) {

                //Animate wheels counter clockwise to  simulate backward movement.
                var speedWheels = 0.1;
                this.animateWheels(speedWheels);


                //Decrease the speed up to a maximum value (the tank is breaking).
                this.speed -= 0.02;

                if (this.speed < Tank.MAX_MOVEMENT_SPEED_BACKWARD)
                    this.speed = Tank.MAX_MOVEMENT_SPEED_BACKWARD;


                //Now we move the bounding box according to the current achieved speed.     
                this.bounder.moveWithCollisions(this.frontVector.multiplyByFloats(this.speed, this.speed, this.speed));




            }
            if (WASD_handler.isAPressed) {
                tankMesh.rotation.y -= .01;


                //Rotate the mesh counter-clockwise as A is pressed
                this.rotateTank(new BABYLON.Vector3(0, 1, 0), -.01);
                this.frontVector = new BABYLON.Vector3(Math.sin(tankMesh.rotation.y), 0, Math.cos(tankMesh.rotation.y));


                //Do not freeze the tank is neither W nor S are pressed.
                if (!WASD_handler.isWPressed && !WASD_handler.isSPressed) {
                    this.slowDown(0.2);
                }

            }
            if (WASD_handler.isDPressed) {
                tankMesh.rotation.y += .01;

                //Rotate the mesh clockwise as D is pressed.
                this.rotateTank(new BABYLON.Vector3(0, 1, 0), .01);
                this.frontVector = new BABYLON.Vector3(Math.sin(tankMesh.rotation.y), 0, Math.cos(tankMesh.rotation.y));


                //Do not freeze the tank is neither W nor S are pressed.
                if (!WASD_handler.isWPressed && !WASD_handler.isSPressed) {
                    this.slowDown(0.2);
                }
            }
        }


        /**
         * Implement some "freno motore" deceleration due to the (simulated) friction with ground.
        */
        else {
            this.slowDown(0.02);
        }

    }


    /**
     * 
     * @param {*} slowDownParameter 
     * @param {*} slowDownCutoff 
    */
    slowDown(slowDownParameter, slowDownCutoff = 0.2) {

        if (!this.bounder) return;

        if (slowDownParameter < 0) {
            var slowDownParameter = Math.abs(slowDownParameter);
        }


        if (Math.abs(this.speed) < 0.02) {

            this.speed = 0;
        }
        else {
            if (this.speed > 0) {
                var animateWheelsSpeed = -0.1;
                this.animateWheels(animateWheelsSpeed);
                this.speed = this.speed - 0.02;
            }
            else {

                var animateWheelsSpeed = 0.1;
                this.animateWheels(animateWheelsSpeed);
                this.speed = this.speed + 0.02;
            }
        }
        this.bounder.moveWithCollisions(this.frontVector.multiplyByFloats(this.speed, this.speed, this.speed));

    }








    /**
     * This function animates the tank wheels. For now it will animate the wheels in a 0/1 fashion 
     * when W or S are pressed so that you simulate the contact with the ground.
     * @param {Float} speed the angle representing the rotation speed of the wheels used when the 
     *                       tank moves. 
    */
    animateWheels(speed) {
        var wheels = this.getWheels();
        for (var i = 0; i < wheels.length; i++) {
            wheels[i].rotate(new BABYLON.Vector3(1, 0, 0), speed);
        }
        return;
    }

    /**
     * This function animates the turret of the tank. The turret should rotate so that its position
     * will be always oriented towards the position of the tank followCamera.
     * @param {BABYLON.Scene} scene the object representing the scene
     */
    animateTurret(scene) {


        //Check if the current scene argument function is the level that is currently played.
        if (scene != Game.scenes[Game.activeScene])
            return;
        if (!scene.heroTankFollowCamera)
            return;


        //If the current active camera is not the camera that should follow the tank we should not rotate the turret.
        var camera = scene.activeCamera;
        if (camera != scene.heroTankFollowCamera)
            return;



        /**Inspired from the documentation.
         * https://www.babylonjs-playground.com/#1RHSYU#16
         * The position of the object in front of the camera is subtracted to the position of the
         * camera. Since the camera target is the hero tank we know that the position of the camera
         * equals the position of the Tank object. 
         * Then the angle is extracted using a simple mathematical formula: atan(x/z). 
        */


        var forward = camera.getFrontPosition(1).subtract(camera.position);


        //We want the turret to rotate only along the Y axis.
        forward.y = 0;


        //Extract the angle using the atan function.
        var diffAngle = Math.atan2(forward.x, forward.z);

        /**
         * Next we get the reference to the mesh of the turret of the tank.
         * Then we perform a manual rotation using quaternions (BABYLON.Quaternion.RotationAxis(...)).
         * The rotation angle is the angle computed so far in the animateTurret function subtracted to the
         * actual rotation angle of the root mesh.
         * This is done because we do not want that the turret is rotated when the WASD key are 
         * pressed but only when the mouse is moved (the player visual is actually rotated).
         * If we do not subtract the angle stored in "this.root.rotation.y" whenever we press D or A the
         * orientation of the tank (which is expressed by camera.position) will be affected and it will be
         * affected also the computation of the variable "diffAngle". So the rotation of the tank mesh must
         * be "countered/balanced" by subracting  "this.root.rotation.y" in order to get rid of this 
         * undesired effect when rotating the tank turret.  
         * 
        */

        var turret = this.getTurret();
        var quaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 1, 0), diffAngle - this.root.rotation.y);
        turret.rotationQuaternion = quaternion;

        return;

    }




    /**
     * Shooting.
     * Here below there a re the functions that will handle the shooting (all the weapons
     * that the tank could use).
    */



    /**
     * This function enables the cannon ball fire actions for the tank.
     * @param {BABYLON.Scene} scene the object representing the scene.
     * @todo adjust the position of the crosshair so that it matches the direction of the ball 
     *      that is shot.
     * @todo Make the cannon ball to explode when it touches the ground or another mesh.
     * @todo Adjust the position of the emitter of the particle system when the cannon ball is disposed.
     *        Stop "hiding the dust under the carpet"
     */
    fireCannonBalls(scene) {



        //Sanity check. We can't fire cannon balls with the hero tank if we are not controlling it with the camera.
        if (scene.activeCamera != scene.heroTankFollowCamera && !this.isClone) {
            return;
        }


        //If the tank actions are not enabled, we can't fire any cannon ball.
        if (!this.isClone)
            if (!TankAction_handler)
                return;

        //If the button designated to fire the cannon balls is not pressed, we can't fire.
        if (!this.isClone)
            if (!scene.arleadyLocked || !TankAction_handler.isLeftMousePressed)
                return;

        TankAction_handler.isLeftMousePressed = false;





        //Check if the current weapon of the tank is the cannon.
        if (this.currentWeapon != Tank.CANNON) return;


        //Check if the tank has some cannon bullets left.
        if (!this.isClone) {

            if (this.tankStatus.cannonBullets <= 0)
                return;
        }





        //Change the position of the ball
        var tank = this;

        if (!tank.canFireCannonBall) return;
        tank.canFireCannonBall = false;


        //Create the cannon ball.
        var cannonBall = new BABYLON.Mesh.CreateSphere("CannonBall", 32, 2, scene);


        //Need to fix the behaviour of the cannon ball. It can't always fire.
        if (Game.activeScene == FIRST_LEVEL_SCENE_VALUE) {
            setTimeout(function () {
                tank.canFireCannonBall = true;
            }, Tank.CANNON_BALL_TIMEOUT);
        }
        else if (Game.activeScene == MAIN_MENU_SCENE_VALUE || Game.activeScene == END_MENU_SCENE_VALUE) {
            setTimeout(function () {
                tank.canFireCannonBall = true;
            }, Tank.CANNON_BALL_TIMEOUT + 4000);
        }


        /** Define a set of offsets that serves the purpose of rendering the ball
        * exactly in front of the cannon. 
        */

        const OFFSET_Y = 0.3;
        const OFFSET_X = 0.0;
        const OFFSET_Z = 0.0;



        //Get the absolute position of the cannon to spawn the cannonball.
        var cannon = this.getCannon();
        if (!cannon) return;
        var pos = cannon.getAbsolutePosition();




        //Generate the cannon ball and give it a material.
        cannonBall.position = new BABYLON.Vector3(pos.x + OFFSET_X, pos.y + OFFSET_Y, pos.z + OFFSET_Z);

        cannonBall.material = new BABYLON.StandardMaterial('Fire', scene);
        cannonBall.material.emissiveColor = new BABYLON.Color3.Red;




        /**Give a physics to the cannon ball thanks to the PhysicsImpostor.
         * The object produces a sort of bounding box around the cannon ball that makes
         * the physics engine (cannon.js in this case) able to compute physics interaction 
         * between the object  and the surrounding world.
        */
        cannonBall.physicsImpostor = new BABYLON.PhysicsImpostor(cannonBall, BABYLON.PhysicsImpostor.SphereImpostor,
            { mass: 1 }, scene);




        /**Define a vector: the force to be applied to the ball. Be aware of the fact that the
         * direction of the impulse determines the direction towards which the cannon ball will be cast
        */
        var fVector = this.getCannon().getDirection(new BABYLON.Vector3(0, 0, -1));

        const FORCE_SCALE = 6;
        var force = new BABYLON.Vector3((fVector.x + OFFSET_X) * FORCE_SCALE,
            (fVector.y + OFFSET_Y) * FORCE_SCALE, (fVector.z + OFFSET_Z) * FORCE_SCALE);

        //The second parameter is the point of the application of the impulse.
        //Need to add an Impulse to the cannon ball.  
        cannonBall.physicsImpostor.applyImpulse(force, cannonBall.getAbsolutePosition());


        //Play the sound of firing cannon ball  if and only if we are in the main level scenario.
        if (soundEnabled && Game.activeScene == FIRST_LEVEL_SCENE_VALUE)
            scene.assets["cannonSound"].play();




        /**
         * Need to set a timeout interval after which the cannon ball is no longer displayed.
        */






        /**
         *  When we fire the cannon ball, we display the "fire" particle system having as 
         *  emitter the cannon ball that is thrown away with the system.
        */
        if (this.cannonParticleSystem) {




            //Set the emitter of the particle system as the cannon ball.
            this.cannonParticleSystem.emitter = cannonBall;
            this.cannonParticleSystem.emitRate = 2000;

            this.cannonParticleSystem.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
            this.cannonParticleSystem.maxEmitBox = new BABYLON.Vector3(1, 0, 1);


            //Start the particle system,
            this.cannonParticleSystem.start();



            var tank = this
            setTimeout(function () {
                tank.cannonParticleSystem.stop();



                //Temporary source for the emitter. If the emitter is disposed, the particle system stops working.
                tank.cannonParticleSystem.emitter = new BABYLON.Vector3(0, -100, 0);

                cannonBall.dispose();

            }, Tank.CANNON_BALL_TIMEOUT);

        }




        //Decrease the amount of the cannon bullets
        this.decreaseCannonBullets(1);




        //Register an action manager for the tank cannon ball.
        cannonBall.actionManager = new BABYLON.ActionManager(scene);



        /**
         * We register a separate block of code for the red tanks and for the blue tanks.
         * A red tank cannonBall is set to trigger an OnIntersectionEnterTrigger if and only 
         * if a blue team tank hit box is intersected. It means that no friendly fire is 
         * allowed in this game. 
        */
        if (this.team == 'red') {
            //Register a separate action function for each of the opposite team tanks.
            //Friendly fire is not allowed.


            var redTank = this;
            scene.blueTanks.forEach(function (tank) {

                /**
                 * For simplicity, we trigger the event "a tank is hit" when the cannon ball
                 * intersect a predefined "hit bounding box" which has been set to simplify the 
                 * computation. The bounding box is a BABYLON.Mesh.Box object that surrounds the 
                 * tank and moves along with it. 
                */
                cannonBall.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter: tank.hitBoundingBox
                }


                    ,
                    function () {

                        redTank.cannonParticleSystem.stop();
                        //Temporary source for the emitter. If the emitter is disposed, the particle system stops working.
                        redTank.cannonParticleSystem.emitter = new BABYLON.Vector3(0, -100, 0);


                        /**The cannon ball must "explode". From the pratical point of view 
                         * the BABYLON.Mesh.Sphere object that represents the cannon ball must
                         * be disposed in order to free some memory. The particle system associated
                         * to the cannon ball must be stopped (moved somewhere else invisible in the scene and then stopped. See bug.txt for additional information) and
                         * the particle system that represents the explosion has to be enabled. 
                        */
                        cannonBall.dispose();



                        tank.tankParticleSystem.start();



                        if (scene.assets) {
                            if (soundEnabled)
                                scene.assets['explosionSound'].play();
                        }



                        //The particle system that renders the explosion needs to be stopped after some seconds.
                        var hitTank = tank;
                        setTimeout(function () {
                            hitTank.tankParticleSystem.stop();
                        }, 400);


                        //A cannon ball hits a tank. The target of the cannon ball loses some health points.
                        tank.decreaseHealth(Tank.CANNON_DAMAGE);

                        if (tank.tankStatus.health == 0) {



                            if (!scene.heroTank) return;

                            var heroTank = scene.heroTank;


                            if (tank != heroTank) {
                                //Respawn.
                                var spawnPosition = tank.getSpawnPoint();

                                var tankId = tank.id;




                                //Set a timeout for the respawn.
                                setTimeout(function () {



                                    //Clone a tank (from the hero tank) and istantiate a Tank object that represents the blue team tank.

                                    var clone = DoClone(heroTank.root, null, tankId);
                                    var blueTank = new Tank(clone, clone, scene, tankId, 4, 'clone_'.concat(tankId.toString()), 'blue', true);


                                    var quaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 1, 0), 0);
                                    blueTank.getTurret().rotationQuaternion = quaternion;


                                    blueTank.setSpawnPoint(spawnPosition);
                                    blueTank.teleportSpawn();

                                }, TANK_RESPAWN_TIME);
                            }

                            //change the emitter of the particle system
                            //Temporary source for the emitter. If the emitter is disposed, the particle system stops working.
                            tank.tankParticleSystem.emitter = new BABYLON.Vector3(0, -100, 0);


                            tank.gotKilled();
                        }
                    }
                )
                );
            });
        }

        /**
         * We register a separate block of code for the blue tanks and for the blue tanks.
         * A red tank cannonBall is set to trigger an OnIntersectionEnterTrigger if and only 
         * if a red team tank hit box is intersected. It means that no friendly fire is 
         * allowed in this game. 
        */
        else if (this.team == 'blue') {
            //Register a separate action function for each of the opposite team tanks.
            //Friendly fire is not allowed.


            var blueTank = this;
            scene.redTanks.forEach(function (tank) {


                cannonBall.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter: tank.hitBoundingBox
                },
                    function () {

                        blueTank.cannonParticleSystem.stop();
                        //Temporary source for the emitter. If the emitter is disposed, the particle system stops working.
                        blueTank.cannonParticleSystem.emitter = new BABYLON.Vector3(0, -100, 0);
                        cannonBall.dispose();


                        //Trigger the tank particle system for explosions

                        tank.tankParticleSystem.start();



                        if (scene.assets) {
                            if (soundEnabled && Game.activeScene == FIRST_LEVEL_SCENE_VALUE)
                                scene.assets['explosionSound'].play();
                        }



                        var hitTank = tank;
                        setTimeout(function () {
                            hitTank.tankParticleSystem.stop();
                        }, 400);
                        tank.decreaseHealth(Tank.CANNON_DAMAGE);

                        if (tank.tankStatus.health == 0) {


                            if (!scene.heroTank) return;
                            var heroTank = scene.heroTank;


                            if (tank != heroTank) {
                                //Respawn.
                                var spawnPosition = tank.getSpawnPoint();

                                var tankId = tank.id;

                                var theTank = tank;

                                //Set a timeout for the respawn.
                                setTimeout(function () {

                                    //Clone a tank (from the hero tank) and istantiate a Tank object that represents the blue team tank.
                                    var clone = DoClone(heroTank.root, null, tankId);
                                    var redTank = new Tank(clone, clone, scene, tankId, 4, 'clone_'.concat(tankId.toString()), 'red', true);


                                    var quaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 1, 0), 0);
                                    redTank.getTurret().rotationQuaternion = quaternion;

                                    //Spawn the opponent tanks in a row.

                                    redTank.setSpawnPoint(spawnPosition);
                                    redTank.teleportSpawn();

                                }, TANK_RESPAWN_TIME);
                            }




                            tank.gotKilled();
                        }
                    }
                )
                );
            });

        }


        return;
    }



    /**
     * This function will determine the behaviour of the tank machineGun (the secondary weapon).
     * The machine gun ammos are rendered with BABYLON js yellow "Rays".
     * @param {BABYLON.Scene} scene the scene object.
     * @todo make the tank able to rotate the turret along the z axis (move upside down).
     * @todo make the tank machine gun damage decrease as the distance between the two tanks increases.
     */
    fireGun(scene) {

        const Y_UP_THRESHOLD = 2.5;
        const Y_DOWN_THRESHOLD = -0.4


        //Check wheter the given scene is correct.
        if (scene != Game.scenes[Game.activeScene]) {
            return;
        }

        /*
         * Check whether the current active camera is the tank follow camera.
        */
        var camera = scene.activeCamera;
        if (!this.isClone)
            if (camera != scene.heroTankFollowCamera)
                return;




        var tank = this;


        //If the the left mouse button is not pressed the tank is not allowed to shoot
        if (!this.isClone)
            if (!scene.arleadyLocked || !TankAction_handler.isLeftMousePressed)
                return;

        TankAction_handler.isLeftMousePressed = false;




        //Check the fire ratio. The turrent must not be allowed to always shoot.
        if (!tank.canFireGun) return;
        tank.canFireGun = false;

        if (!this.isClone) {
            setTimeout(function () {
                tank.canFireGun = true;
            }, Tank.MACHINE_GUN_COOLDOWN_HEROTANK);
        }
        else {
            setTimeout(function () {
                tank.canFireGun = true;
            }, Tank.MACHINE_GUN_COOLDOWN_CLONETANK);
        }

        //Check whether the hero tank has some bullets left.
        if (!this.isClone)
            if (tank.tankStatus.machineGunBullets <= 0)
                return;


        //Check whether the current weapon used by the tank is the machine gun 
        if (tank.currentWeapon != Tank.MACHINE_GUN) return;




        //Play the sound of the machine gun (to be improved: select another sound).

        if (soundEnabled)
            scene.assets['gunSound'].play();



        //By default the ray is shot from the center of the tank and will hit the tank ( from the inside). We have to adjust it in order to
        //target the other objects.

        /*If the current tank is a clone we slightly rotate the turret so that the tank is not
            perfect when shooting at the player.
        */



        var origin = this.getCannon().getAbsolutePosition();
        var cannonDirection = this.getCannon().getDirection(new BABYLON.Vector3(0, 0, -1));


        var random_orientation = Math.random() * 10.0;
        if (this.isClone) {
            var direction = new BABYLON.Vector3(cannonDirection.x + random_orientation, cannonDirection.y,
                cannonDirection.z);
        }
        else {
            var direction = new BABYLON.Vector3(cannonDirection.x, cannonDirection.y,
                cannonDirection.z);
        }

        /**
         * We use a BABYLON.Ray object to represent the machine gun bullets. This will
         * allow us to precisely track the trajectory of the bullets as well as the picked
         * meshes.
        */
        var ray = new BABYLON.Ray(origin, direction, 1000);
        var rayHelper = new BABYLON.RayHelper(ray);


        //If randomly rotated adjust the position of the clone turret


        rayHelper.show(scene, new BABYLON.Color3.Yellow);



        //Set a timeout for the ray to disappear.
        setTimeout(function () {
            rayHelper.hide(ray);
        }, 150);

        //Three bullets are consumed in this process.
        this.decreaseMachineGunBullets(3);



        //Hit the tanks when the machine gun beam intersects them. Use ray picking information.

        /**scene.pickWithRay can accept a boolean predicate also as argument.
        * It loops through all the meshes that are intersected with the ray and
        * if this predicate returns false for the current analized mesh, then the mesh will be ignored
        * by the function.
        */
        //scene.multiPickWithRay returns an array with all the picked meshes!!!

        //Use scene.pickWithRay or scene.multiPickWithRay is completely up to your design choices.

        var tank = this;





        if (this.team == 'red') {

            /**
             * A boolean condition that filters the meshes picked by the yellow ray (meshes that satisfies the
             * condition are ignored, others are considered by the ray). This is done to avoid blue tanks
             * to make friendly fire when using the machine gun. 
            */


            var pickInfo = scene.pickWithRay(ray, function (mesh) {
                if (mesh.name == tank.name || mesh.name.startsWith('bounder')
                    || mesh.name.startsWith('CannonBall') || mesh.name.startsWith('HitBounder')
                    || mesh.name.startsWith('lootBox') || mesh.name.startsWith('skybox')) return false;
                else
                    return true;
            });
        }

        else if (this.team == 'blue') {

            /**
             * A boolean condition that filters the meshes picked by the yellow ray (meshes that satisfies the
             * condition are ignored, others are considered by the ray). This is done to avoid blue tanks
             * to make friendly fire when using the machine gun. 
            */

            var pickInfo = scene.pickWithRay(ray, function (mesh) {
                if (mesh.name == tank.name || mesh.name.startsWith('bounder')
                    || mesh.name.startsWith('CannonBall') || mesh.name.startsWith('HitBounder')
                    || mesh.name.startsWith('lootBox') || mesh.name.startsWith('skybox')
                    || mesh.name.startsWith('clone')) return false;
                else
                    return true;
            });

        }




        //I must be sure that I picked a Mesh with the machine gun.
        if (pickInfo.pickedMesh) {
            var pickedMesh = pickInfo.pickedMesh;

            //Get the root of the picked mesh and decrease the health.


            //Use regular expressions to match the name of the picked mesh. This is a regular expression for clone tanks.
            var regExpNameClones = new RegExp("clone_1+.Box|clone_2+.Box|clone_3+.Box|clone_4+.Box|clone_5+.Box|clone_6+.Box|clone_7+.Box|clone_8+.Box|clone_9+.Box");

            //This regular expression is built for the hero tank.
            var regExpNameHeroTank = new RegExp("Box1+|Box2+|Box3+|Box4+|Box5+|Box6+|Box7+|Box8+|Box9+|")


            /** 
             * If the name of the picked mesh matches one of the two regular expressions defined above,
             * it means that the ray (the machine gun bullets) has hit a child mesh of the objective.
            */
            var pickedMeshParent = pickedMesh;
            if (regExpNameClones.test(pickedMesh.name) || regExpNameHeroTank.test(pickedMesh.name)) {

                //Get the root of the picked mesh
                while (pickedMeshParent.parent != null) {
                    pickedMeshParent = pickedMeshParent.parent;
                }

                var pickedTank = pickedMeshParent.Tank;
                if (!pickedTank) {
                    //console.log(pickedMeshParent.name);
                    return;
                }

                pickedTank.decreaseHealth(Tank.MACHINE_GUN_DAMAGE);


                //If the picked tank has no more life points, then it must die.
                if (pickedTank.tankStatus.health == 0) {

                    //Pick the hero tank.
                    if (!scene.heroTank) return;
                    var heroTank = scene.heroTank;



                    if (pickedTank != heroTank) {

                        //Respawn.
                        var spawnPosition = pickedTank.getSpawnPoint();

                        var tankId = pickedTank.id;

                        var theTank = pickedTank;

                        //Set a timeout for the respawn.
                        setTimeout(function () {

                            //Clone a tank (from the hero tank) and istantiate a Tank object that represents the blue team tank.


                            var clone = DoClone(heroTank.root, null, tankId);
                            var blueTank = new Tank(clone, clone, scene, tankId, 4, 'clone_'.concat(tankId.toString()), 'blue', true);


                            var quaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 1, 0), 0);
                            blueTank.getTurret().rotationQuaternion = quaternion;

                            //Spawn the opponent tanks in a row.

                            blueTank.setSpawnPoint(spawnPosition);
                            blueTank.teleportSpawn();

                        }, TANK_RESPAWN_TIME);


                    }

                    pickedTank.gotKilled();


                }
            }

            /**
             * Else, the machine gun bullet has hit the root of the objective tank.   
            */
            else {


                var pickedTank = pickedMesh.Tank;
                pickedTank.decreaseHealth(Tank.MACHINE_GUN_DAMAGE);
                //If the picked tank has no more life points, then it must die.
                if (pickedTank.tankStatus.health == 0) {

                    //Pick the hero tank.
                    if (!scene.heroTank) return;
                    var heroTank = scene.heroTank;



                    if (pickedTank != heroTank) {

                        //Respawn.
                        var spawnPosition = pickedTank.getSpawnPoint();

                        var tankId = pickedTank.id;

                        var theTank = pickedTank;

                        //Set a timeout for the respawn.
                        setTimeout(function () {

                            //Clone a tank (from the hero tank) and istantiate a Tank object that represents the blue team tank.


                            var clone = DoClone(heroTank.root, null, tankId);
                            var blueTank = new Tank(clone, clone, scene, tankId, 4, 'clone_'.concat(tankId.toString()), 'blue', true);


                            var quaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 1, 0), 0);
                            blueTank.getTurret().rotationQuaternion = quaternion;

                            //Spawn the opponent tanks in a row.

                            blueTank.setSpawnPoint(spawnPosition);
                            blueTank.teleportSpawn();

                        }, TANK_RESPAWN_TIME);


                    }

                    pickedTank.gotKilled();

                }

            }
        }

        return;
    }



    /**
     * This function decreases the amount of cannon bullets of the tank.
     * @param {Number} quantity an integer number specifying the amount of cannon bullets that 
     *                          have been shot.
    */

    decreaseCannonBullets(quantity) {

        if (quantity > 0 && this.tankStatus.cannonBullets > 0) {

            /**
             * We use Math.floor since if by any chance a floating point is passed as 
             * argument, it will be automatically converted to an integer number
            */

            this.tankStatus.cannonBullets = this.tankStatus.cannonBullets - Math.floor(quantity);

            /**
             * If the count goes below zero, we will adjust this count to zero: it means
             * that the tank has run out of cannon bullets. 
            */
            if (this.tankStatus.cannonBullets < 0) {
                this.tankStatus.cannonBullets = 0;
            }
        }

        return;
    }


    /**
     * This function increase the amount of cannon bullets of the tank.
     * @param {Number} quantity an integer number specifying the amount of cannon bullets that 
     *                          have been taken.
    */

    increaseCannonBullets(quantity) {

        if (quantity > 0 && this.tankStatus.cannonBullets < Tank.MAX_CANNON_BULLET) {

            /**
             * We use Math.floor since if by any chance a floating point is passed as 
             * argument, it will be automatically converted to an integer number
            */


            this.tankStatus.cannonBullets = this.tankStatus.cannonBullets + Math.floor(quantity);


            /**
             * If the count goes below zero, we will adjust this count to zero: it means
             * that the tank has run out of cannon bullets. 
            */
            if (this.tankStatus.cannonBullets > Tank.MAX_CANNON_BULLET) {
                this.tankStatus.cannonBullets = Tank.MAX_CANNON_BULLET;
            }
        }

        return;
    }

    /**
     * This function decreases the amount of cannon bullets of the tank.
     * @param {Number} quantity an integer number specifying the amount of machine gun bullets that 
     *                          have been shot.
    */
    decreaseMachineGunBullets(quantity) {

        if (quantity > 0 && this.tankStatus.machineGunBullets > 0) {

            /**
             * We use Math.floor since if by any chance a floating point is passed as 
             * argument, it will be automatically converted to an integer number
            */

            this.tankStatus.machineGunBullets = this.tankStatus.machineGunBullets - Math.floor(quantity);

            /**
             * If the count goes below zero, we will adjust this count to zero: it means
             * that the tank has run out of machine gun bullets. 
            */
            if (this.tankStatus.machineGunBullets < 0) {
                this.tankStatus.machineGunBullets = 0;
            }
        }

        return;
    }



    /**
     * This function increases the amount of cannon bullets of the tank.
     * @param {Number} quantity an integer number specifying the amount of machine gun bullets that 
     *                          have been shot.
    */
    increaseMachineGunBullets(quantity) {

        if (quantity > 0 && this.tankStatus.machineGunBullets < Tank.MAX_MACHINE_GUN_BULLETS) {

            /**
             * We use Math.floor since if by any chance a floating point is passed as 
             * argument, it will be automatically converted to an integer number
            */


            this.tankStatus.machineGunBullets = this.tankStatus.machineGunBullets + Math.floor(quantity);

            /**
             * If the count goes below zero, we will adjust this count to zero: it means
             * that the tank has run out of machine gun bullets. 
            */
            if (this.tankStatus.machineGunBullets > Tank.MAX_MACHINE_GUN_BULLET) {
                this.tankStatus.machineGunBullets = Tank.MAX_MACHINE_GUN_BULLET;
            }
        }

        return;
    }



    /**
     * This function decreases the tank life points by the quantity "quantity".
     * @param {Number} quantity the amount of life points that will be decreased.
    */
    decreaseHealth(quantity) {
        if (!this.tankStatus) return;

        if (quantity > 0 && this.tankStatus.health > 0) {
            this.tankStatus.health = this.tankStatus.health - quantity;

            //If the health of the tank goes below zero, set it to zero.
            if (this.tankStatus.health <= 0) {
                this.tankStatus.health = 0;
            }
        }

        return;
    }




    /**
     * This function increases the tank life points by the quantity "quantity".
     * @param {Number} quantity the amount of life points that will be increased.
    */
    increaseHealth(quantity) {
        if (!this.tankStatus) return;

        if (quantity > 0 && this.tankStatus.health <= Tank.MAX_HEALTH) {
            this.tankStatus.health = this.tankStatus.health + quantity;

            //If the health of the tank goes below zero, set it to zero.
            if (this.tankStatus.health > Tank.MAX_HEALTH) {
                this.tankStatus.health = Tank.MAX_HEALTH;
            }
        }

        return;
    }




    /**
     * Calculate the parameters of the bounding box to help the system to detect collisions.
    */
    CalculateBoundingBoxParameters() {



        /**
         * Initialize the minimum and the maximum x,y,z components of the bounding box.
        */
        var maxX = Number.MIN_SAFE_INTEGER;
        var maxY = Number.MIN_SAFE_INTEGER;
        var maxZ = Number.MIN_SAFE_INTEGER;

        var minX = Number.MAX_SAFE_INTEGER;
        var minY = Number.MAX_SAFE_INTEGER;
        var minZ = Number.MAX_SAFE_INTEGER;



        //Get the children meshes of the tank.
        var children = this.root.getChildren();



        //There are actually 12 childeren meshes.


        for (var i = 0; i < children.length; i++) {

            //The positions are returned in the model reference frame. The positions are stored
            //in the (x,y,z),(x,y,z) fashion.
            var positions = new BABYLON.VertexData.ExtractFromGeometry(children[i]).positions;
            if (!positions) continue;

            var index = 0;


            //Starting from j = 0, in j+3, j+6 .... there are all the x components.
            for (var j = index; j < positions.length; j += 3) {
                if (positions[j] < minX)
                    minX = positions[j];
                if (positions[j] > maxX)
                    maxX = positions[j];
            }

            index = 1;
            //Starting from j = 1, in j+3, j+6 .... there are all the y components.
            for (var j = index; j < positions.length; j += 3) {
                if (positions[j] < minY)
                    minY = positions[j];
                if (positions[j] > maxY)
                    maxY = positions[j];
            }

            //Starting from j = 2, in j+3, j+6 .... there are all the z components.
            index = 2;
            for (var j = index; j < positions.length; j += 3) {
                if (positions[j] < minZ)
                    minZ = positions[j];
                if (positions[j] > maxZ)
                    maxZ = positions[j];

            }


            /** 
             * Take the length of the segment with a simple yet effective mathematical 
             * formula: the absolute value of the maximum value - the minimum value for 
             * each component.
            */

            var _lengthX = Math.abs(maxX - minX);
            var _lengthY = Math.abs(maxY - minY);
            var _lengthZ = Math.abs(maxZ - minZ);



        }



        //Return an object with all the three variables (the dimensions of the bounding box).
        return { lengthX: _lengthX, lengthY: _lengthY, lengthZ: _lengthZ }



    }




    /**
     * Create the bounding box parameters according to the parameters computed in the 
     * ComputeBoundingBoxParameters function defined above and to some adjustment constants
     * defined in the Tank class.
    */
    createBoundingBox() {

        var scene = this.scene;



        /**
         * Extract the bounding box parameters. The dimension of the bounding box may not be
         * 100% accurate. This may depend from several factors: the way meshes are defined 
         * into the imported model, their hierarchical structure, the scaling etc...
         * Then, the bounding box dimension need to be adjusted.
        */
        var lengthX = Tank.boundingBoxParameters.lengthX;
        var lengthY = Tank.boundingBoxParameters.lengthY;
        var lengthZ = Tank.boundingBoxParameters.lengthZ;



        //Create the bounding box as a simple box.

        var bounder = new BABYLON.Mesh.CreateBox("bounder" + this.id.toString(), 1, this.scene);




        /**
         * Adjust the dimension of the bouding box according to the scaling of the mesh and some
         * adjusting costant defined in the Tank class.
        */

        bounder.scaling.x = lengthX * this.scaling * Tank.bounderXScaleMultiplier;
        bounder.scaling.y = lengthY * this.scaling * Tank.bounderYScaleMultiplier;
        bounder.scaling.z = lengthZ * this.scaling * Tank.bounderZScaleMultiplier;



        //These are all adjustment. Feel free to make changes wherever it fits.
        //Adjust the orientation of the bounding box so that it matches the shape of the hero tank.
        bounder.rotation.y = Math.PI / 2;


        //Make the bounding box visible
        bounder.isVisible = true;

        //For debugging
        var bounderMaterial = new BABYLON.StandardMaterial("bounderMaterial", this.scene);
        bounderMaterial.alpha = .5;
        bounder.material = bounderMaterial;
        bounder.checkCollisions = true;


        var rootPosition = this.root.getAbsolutePosition();



        /**Because the box meshes are created with their center at the origin of the world reference frame. We need to adjust the 
         * Initial position of the mesh so that it matches the root position. Plus we need to perfom some adjustment
         * in order to place the tank perfectly inside the bounding box.
        */
        bounder.position = new BABYLON.Vector3(rootPosition.x + Tank.bounderXPositionMultiplier * this.scaling * (lengthX), rootPosition.y +
            this.scaling * Tank.bounderYPositionMultiplier * (lengthY), rootPosition.z + Tank.bounderZPositionMultiplier * this.scaling * (lengthZ));

        return bounder;

    }


    /**
     * This function will create a separate bounding box that will be used for damage purposes.
     * This bounding box is invisible and follows the tank everytime it moves. Whenever a 
     * cannon ball hit this bounding box, the tank health will be decreased. This is a bounding
     * box that is built just for hit purposes and has no collision system enabled. 
     * @todo Make it invisible. 
    */
    createHitBoundingBox() {

        var scene = this.scene;



        /**
         * Extract the bounding box parameters. The dimension of the bounding box may not be
         * 100% accurate. This may depend from several factors: the way meshes are defined 
         * into the imported model, their hierarchical structure, the scaling etc...
         * Then, the bounding box dimension need to be adjusted.
        */
        var lengthX = Tank.boundingBoxParameters.lengthX;
        var lengthY = Tank.boundingBoxParameters.lengthY;
        var lengthZ = Tank.boundingBoxParameters.lengthZ;



        //Create the bounding box as a simple box.

        var bounder = new BABYLON.Mesh.CreateBox("HitBounder" + this.id.toString(), 1, this.scene);




        /**
         * Adjust the dimension of the bouding box according to the scaling of the mesh and some
         * adjusting costant defined in the Tank class.
        */

        bounder.scaling.x = lengthX * this.scaling * Tank.bounderHitXScaleMultiplier;
        bounder.scaling.y = lengthY * this.scaling * Tank.bounderHitYScaleMultiplier;
        bounder.scaling.z = lengthZ * this.scaling * Tank.bounderHitZScaleMultiplier;



        //These are all adjustment. Feel free to make changes wherever it fits.
        //Adjust the orientation of the bounding box so that it matches the shape of the hero tank.
        bounder.rotation.y = Math.PI / 2;


        //Make the bounding box visible
        bounder.isVisible = true;

        //For debugging
        var bounderMaterial = new BABYLON.StandardMaterial("bounderHitMaterial", this.scene);
        bounderMaterial.alpha = .5;
        bounder.material = bounderMaterial;
        bounder.checkCollisions = false;
        bounder.material.emissiveColor = new BABYLON.Color3.Green;


        var rootPosition = this.root.getAbsolutePosition();



        /**Because the box meshes are created with their center at the origin of the world reference frame. We need to adjust the 
         * Initial position of the mesh so that it matches the root position. Plus we need to perfom some adjustment
         * in order to place the tank perfectly inside the bounding box.
        */
        bounder.position = new BABYLON.Vector3(rootPosition.x + Tank.bounderHitXPositionMultiplier * this.scaling * (lengthX), rootPosition.y +
            this.scaling * Tank.bounderHitYPositionMultiplier * (lengthY), rootPosition.z + Tank.bounderHitZPositionMultiplier * this.scaling * (lengthZ));

        return bounder;

    }





    /**
     * This function is used by the clone tanks to follow the player tank and try to hunt it
     * down.
     * @param {BABYLON.Mesh} tank the mesh (the root of the tank object that will be followed)
    */

    followTank(tank) {

        var scene = this.scene;

        //If the bounder is still undefined return.
        if (!this.bounder && !this.hitBoundingBox) return;

        /**
         * Adjust the position of the root so that it matches the position of the tank,
         * the root position of the tank. In this way the bounding box and the root of the
         * tank will move togheter.
        */
        this.root.position = new BABYLON.Vector3(this.bounder.position.x, this.bounder.position.y,
            this.bounder.position.z);

        //Adjust the position of the hit bounding box so that it "perfectly" follows the hero tank.
        this.hitBoundingBox.position = new BABYLON.Vector3(this.root.position.x, this.root.position.y,
            this.root.position.z);


        //We want the dude to always look at the direction of the tank and to always follow the tank.
        var direction = tank.position.subtract(this.root.position);


        //Obtain the length of the vector. 
        var distance = direction.length();


        var dir = direction.normalize();

        //this.dudeMesh.moveWithCollisions(dir.multiplyByFloats(this.speed,this.speed,this.speed));
        var alpha = Math.atan2(dir.x, dir.z);



        /**Rotate the target mesh along the y axis by the angle alpha so that we have the clone
         *  tank always facing towards the hero tank.
        */

        var quaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 1, 0), alpha + Math.PI);
        this.root.rotationQuaternion = quaternion;


        /**
         * Define a "standard" following speed for the clone tank so that it can follow the hero tank. 
        */
        var followSpeed = 1.0


        //Then, move the bounding box of the tank.
        this.bounder.moveWithCollisions(dir.multiplyByFloats(followSpeed, followSpeed, followSpeed));


        return distance;

    }

    /**
     * This function will set the diffuse colour of the tank to red so that it can 
     * effectively join the red team.
     * Inside this function the tank is pushed to the redTanks array.
    */
    joinRedTeam() {

        var scene = this.scene;

        var body = this.getBody();
        var bodyMaterial = new BABYLON.StandardMaterial("bodyMaterial".concat(this.id.toString()), scene);
        bodyMaterial.diffuseColor = new BABYLON.Color3.Red;
        //bodyMaterial.specularColor = new BABYLON.Color3.Black;


        body.material = bodyMaterial;

        this.getTurret().material = bodyMaterial;


        /**
         * Use the same material for all the child meshes (memory efficiency). 
        */
        for (var i = 0; i < this.getWings().length; ++i) {
            this.getWings()[i].material = body.material;
        }

        this.getCannon().material = bodyMaterial;
        for (var i = 0; i < this.getWheels().length; ++i) {
            this.getWheels()[i].material = body.material;
        }
        for (var i = 0; i < this.getSideWheels().length; ++i) {
            this.getSideWheels()[i].material = body.material;
        }




        //Add the current tank to the scene red tanks.
        if (!scene.redTanks) {
            scene.redTanks = [];
        }

        scene.redTanks.push(this);

        return;



    }



    /**
     * This function will set the diffuse colour of the tank to red so that it can 
     * effectively join the blue team. 
     * Inside this function the tank is pushed to the blueTanks array.
    */
    joinBlueTeam() {


        var scene = this.scene;

        var body = this.getBody();
        if (!body) return;



        var bodyMaterial = new BABYLON.StandardMaterial("bodyMaterial".concat(this.id.toString()), scene);
        bodyMaterial.diffuseColor = new BABYLON.Color3.Blue;
        //bodyMaterial.specularColor = new BABYLON.Color3.Black;

        body.material = bodyMaterial;

        this.getTurret().material = bodyMaterial;


        /**
         * Use the same material for all the child meshes (memory efficiency). 
        */
        for (var i = 0; i < this.getWings().length; ++i) {
            this.getWings()[i].material = body.material;
        }

        this.getCannon().material = bodyMaterial;
        for (var i = 0; i < this.getWheels().length; ++i) {
            this.getWheels()[i].material = body.material;
        }
        for (var i = 0; i < this.getSideWheels().length; ++i) {
            this.getSideWheels()[i].material = body.material;
        }



        //Add the current tank to the blue theme in the scene.      
        if (!scene.blueTanks) {
            scene.blueTanks = [];
        }

        scene.blueTanks.push(this);
        return;

    }


    /**
     * This function will create the tank parcicle system, for explosion and things like
     * that. We create the particle system as a class variable since it might be computationally
     * expensive to store a different particle system for each and every istance of the Tank
     * class.
     * @param {String} name the name of the particle system.
    */
    createTankParticleSystem(name) {

        /**
         * Taken from the babylon js documentation.
        */


        // Create a particle system
        var particleSystem = new BABYLON.ParticleSystem(name, 2000, scene);

        //Texture of each particle
        particleSystem.particleTexture = new BABYLON.Texture("texture/Fire.jpeg", scene);

        // Where the particles come from
        particleSystem.emitter = new BABYLON.Vector3(0, 0, 0);



        // Colors of all particles



        // Emission rate
        particleSystem.emitRate = 1500;



        /**The particles will be emitted in the local reference frame of the emitter mesh.
         * In this case, since the emitter will be the cannon ball and the cannonball moves
         * towards to the target, also the particles need to move towards the target along 
         * with the cannon ball.
        */
        particleSystem.isLocal = true;


        // Set the gravity of all particles
        particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);


        const RADIUS = 2;
        /**
         * This allows the particle system to create a spherical emission space. The 
         * particles will be spread "uniformly" in a spherical region of a certain RADIUS.
         * The center of this region is the emitter mesh of the particle system. 
        */
        var sphereEmitter = particleSystem.createSphereEmitter(RADIUS);



        //Define some parameters.
        particleSystem.minEmitPower = 6;
        particleSystem.maxEmitPower = 10;
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 4.5;


        return {
            particleSystem: particleSystem,
            sphereEmitter: sphereEmitter
        };

    }





    /**
     * This function will be triggered whenever a tank is killed.
     * The function will be called for the CPU tanks (the clone tanks) and for the hero tank.
     * It destroys all the objects that are related to the tank (root mesh, bouding boxes etc..)
     * to free some memory and delete the dead tank from the scene object. 
    */
    gotKilled() {


        var scene = this.scene;
        //Delete the bounder
        this.bounder.dispose();

        //Dispose the hit bounding box as well.
        this.hitBoundingBox.dispose();

        this.tankParticleSystem.stop();
        this.cannonParticleSystem.stop();

        this.tankParticleSystem.emitter = new BABYLON.Vector3(0, -200, 0);

        this.cannonParticleSystem.emitter = new BABYLON.Vector3(0, -200, 0);

        this.tankParticleSystem.dispose();
        this.cannonParticleSystem.dispose();

        this.tankSphereEmitter = null;
        this.cannonSphereEmitter = null;


        /** 
         * This block of code will be executed when a red team tank (for example the hero tank)
         * dies (tank.tankStatus.health == 0).  
        */
        if (this.team == 'red') {
            if (!scene.redTanks) return;


            //This flag is set to avoid any call to the scene.redTanks array in the "startRedTeamTanks" function (to be implemented).
            managing_redTanksArray = true;



            //Refactoring completely the redTanks array. Create a new array without the dead tank.
            var newArray = [];
            for (var i = 0; i < scene.redTanks.length; ++i) {
                if (scene.redTanks[i] != this) {
                    newArray.push(scene.redTanks[i]);
                }
            }


            //Clear the scene.redTanks array by setting its length to zero.
            scene.redTanks.length = 0;



            //
            scene.redTanks = newArray;

            this.root.dispose();

            //Set this variable back to false.
            managing_redTanksArray = false;



            /** 
             * If the hero tank dies we need to do something more: display the death menu.
            */
            if (scene.heroTank && this == scene.heroTank) {

                //We kill the hero tank.
                scene.heroTank = null;
                //Special function that will render a death screen menu.
                this.gotKilledHeroTank();

            }
        }


        /** 
         * This block of code will be executed when a blue team tank (one of the clone tanks)
         * dies (tank.tankStatus.health == 0).  
        */
        else if (this.team == 'blue') {
            if (!scene.blueTanks) return;


            //This flag is set to avoid any call to the scene.blueTanks array in the "startBlueTeamTanks" function (to be implemented).
            managing_blueTanksArray = true;



            //Refactoring completely the blueTanks array.
            var newArray = [];
            for (var i = 0; i < scene.blueTanks.length; ++i) {
                if (scene.blueTanks[i] != this) {
                    newArray.push(scene.blueTanks[i]);
                }
            }

            //Clear the array.
            scene.blueTanks.length = 0;


            scene.blueTanks = newArray;

            //Set the variable back to false.
            managing_blueTanksArray = false;

            this.root.dispose();
        }


        return;
    }

    /**
     * This function is called when the hero tank dies. It trigger the switch to 
     * another scene, where the death menu is displayed.
    */
    gotKilledHeroTank() {

        //Move completely to another scene.

        engine.stopRenderLoop();

        var scene = Game.scenes[Game.activeScene];

        Game.activeScene = END_MENU_SCENE_VALUE;
        //Stop playing the game music
        if (soundEnabled) {
            if (scene.assets) {
                if (scene.assets['gameMusic']) {
                    scene.assets['gameMusic'].stop();
                }
            }
        }

        scene.dispose();


        //Free the user from the pointer lock
        document.exitPointerLock();





        //Render the death menu
        startDeathMenu();

        return;


    }

}

