/**
 * Created by jon on 08/12/2015.
 */
window.onload = function() {

    var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, 'phaser-example', {preload: Preload, create: Create, update: Update, render: Render });

    var data = [];
    var polyLine = [];
    var tracing = false;
    var canDraw = false;
    var clearedDrawing = false;
    var current;
    var dropZone;
    var graphics;
    var body;
    var scale = 0.2;
    var clearButton;
    var addWheelButton;
    var makePhysicsItem;
    var wheels = [];
    var driveJoints = [];

    function Preload() {

        game.load.image('ball', 'assets/sprites/wheel.png');
        game.load.image('firstaid', 'assets/sprites/firstaid.png');
        game.load.spritesheet('button', 'assets/buttons/button_sprite_sheet.png', 193, 71);
        game.load.spritesheet('clearButton', 'assets/buttons/ClearButton.png', 193, 71);
        game.load.spritesheet('addWheelButton', 'assets/buttons/AddWheel.png', 193, 71);
        game.load.spritesheet('startButton', 'assets/buttons/StartButton.png', 193, 71);
    }

    function Create () {

        game.stage.backgroundColor = 0x000000;

        game.input.onDown.add(OnDown, this);
        game.input.onUp.add(OnUp,this);
        game.input.addMoveCallback(DrawLine,this);


        graphics = game.add.graphics(0, 0);

        // Enable Box2D physics
        game.physics.startSystem(Phaser.Physics.BOX2D);
        game.physics.box2d.gravity.y = 500;
        game.physics.box2d.friction = 0.8;

        body = new Phaser.Physics.Box2D.Body(this.game, null, 0, 0, 0);
        body.static = true;


        clearedDrawing = true;

        var ground = new Phaser.Physics.Box2D.Body(this.game, null, 0, game.world._height);

        var terrain = game.add.graphics(0,  game.world._height);
        ground.addEdge(0, -100, 0, -500);
        ground.addEdge(0, -100, 100, -100);

        terrain.lineStyle(3, 0x00aa00, 1);
        terrain.moveTo(0, -100);
        var lastY = -100;
        for(var i = 0; i < 50; ++i)
        {
            var y = game.rnd.integerInRange(0,100);
            ground.addEdge(100 * (i+1), lastY, 100* (i+2), -y);
            terrain.lineTo(100 * (i+1), lastY);
            lastY = -y;
        }
        ground.addEdge(100 * (i+1), lastY, 100 * (i+1), -500);
        terrain.lineTo(100 * (i+1), lastY);

        game.world.setBounds(0, 0, 100 * (i+1)*2, window.innerHeight);
        ground.static = true;

        cursors = game.input.keyboard.createCursorKeys();

        AddNextStepButtons();
    }

    function DrawLine(pointer)
    {
        if(canDraw)
        {
            if(tracing)
            {
                var x = current.end.x;
                var y = current.end.y;

                var x1 = current.end.x;
                var y1 = current.end.y;

                if(polyLine.length > 0)
                {
                    x1 = polyLine[polyLine.length-1].end.x;
                    y1 = polyLine[polyLine.length-1].end.y;
                }

                if(game.math.distance(x,y,x1,y1) > 20 || polyLine.length < 1)
                {
                    polyLine.push(current.clone());
                }

                if(x == dropZone.x && y == dropZone.y && polyLine.length > 20)
                {
                    EndDrawing();
                }
                else
                {
                    current = new Phaser.Line(x,y, pointer.x, pointer.y);
                }

            }
            else
            {
                current = new Phaser.Line(pointer.x, pointer.y, pointer.x, pointer.y);
                dropZone = new Phaser.Circle(pointer.x, pointer.y, 16);
                tracing = true;
            }

            Trace(pointer);
        }
        else
        {
            game.physics.box2d.mouseDragMove(game.input.mousePointer);
        }
    }

    function EndDrawing()
    {
        if(canDraw)
        {
            if(polyLine.length > 2) {
                data.push(polyLine.slice(0));


                polyLine = [];
                current = null;

                clearedDrawing = false;
                Redraw();

            }

            tracing = false;
            canDraw = false;
        }

    }

    function Redraw() {

        if(data[0].length > 2)
        {
            DrawLargeBody();
        }
    }

    function AddNextStepButtons()
    {
        clearButton = game.add.button(0,0, 'clearButton', ClearButtonClicked, this, 2, 1, 0);
        clearButton.fixedToCamera = true;
        addWheelButton = game.add.button(193,0, 'addWheelButton', AddWheel, this, 2, 1, 0);
        addWheelButton.fixedToCamera = true;
        makePhysicsItem = game.add.button(193*2,0, 'startButton', MakePhysicsItem, this, 2, 1, 0);
        makePhysicsItem.fixedToCamera = true;
    }

    function ClearButtonClicked()
    {
        graphics.clear();
        polyLine = [];
        data = [];
        clearedDrawing = true;
        for(var i = 0; i < wheels.length; ++i)
        {
            wheels[i].destroy();
        }
        wheels = [];
        driveJoints = [];
        body.reset(0,0);
        body.static = true;
        body.rotation = 0;
        graphics.x = 0;
        graphics.y = 0;
        graphics.rotation = 0;
    }

    function AddWheel()
    {
        var wheel = game.add.sprite(window.innerWidth/2, game.world.centerY, 'ball');
        wheel.anchor.x = 0.5;
        wheel.anchor.y = 0.5;
        wheel.inputEnabled = true;
        wheel.input.enableDrag(true);

        wheels.push(wheel);
    }

    function MakePhysicsItem()
    {
        var frequency = 3.5;
        var damping = 0.5;
        var motorTorque = 60;
        var rideHeight = 0.5;

        for(var i = 0; i < wheels.length; ++i)
        {
            game.physics.box2d.enable(wheels[i]);
            wheels[i].body.setCircle(60);
            driveJoints.push(game.physics.box2d.wheelJoint(body, wheels[i], wheels[i].position.x,wheels[i].position.y + rideHeight, 0,0, 0,1, frequency, damping, 0, motorTorque, true ));
        }

        body.static = false;

    }

    function DrawLargeBody()
    {
        poly = new Phaser.Polygon();

        graphics.lineStyle(10,0x00aa00,1);
        var path = data[0];
        var vertices = [];

        for(var i = 0; i < path.length; i++)
        {
            vertices.push(path[i].end.x, path[i].end.y);
        }

        poly.setTo(vertices);

        graphics.beginFill(0x00aa00,0.5);
        graphics.drawPolygon(poly.points);
        graphics.endFill();

        body.clearFixtures();

        if (vertices.length >= 6)
        {
            body.setPolygon( vertices );
        }
    }

    function OnDown(pointer)
    {
        if(clearedDrawing) {
            canDraw = true;
        }

        game.physics.box2d.mouseDragStart(game.input.mousePointer);
    }

    function OnUp(pointer)
    {
        EndDrawing();
        game.physics.box2d.mouseDragEnd();
    }

    function Trace(pointer)
    {
        if (current)
        {
            if (dropZone.contains(pointer.x, pointer.y) && polyLine.length > 1)
            {
                current.end.setTo(dropZone.x, dropZone.y);
            }
            else
            {
                current.end.setTo(pointer.x, pointer.y);
            }
        }
    }

    function Update()
    {
        var motorSpeed = 1000; // rad/s
        var motorEnabled = true;

        if (cursors.down.isDown) { motorSpeed = 0; } // prioritize braking
        else if (cursors.left.isDown && !cursors.right.isDown) { motorSpeed *= -1; }
        else if (cursors.right.isDown && !cursors.left.isDown) {  }
        else { motorEnabled = false; } // roll if no keys pressed

        for (var i = 0; i < driveJoints.length; i++) {
            driveJoints[i].EnableMotor(motorEnabled);
            driveJoints[i].SetMotorSpeed(motorSpeed);
        }


        if(data.length > 0) {

            graphics.x = body.x;
            graphics.y = body.y;

            graphics.pivot.x = 0;
            graphics.pivot.y = 0;
            graphics.rotation = body.rotation;
        }

        var ar = [];
        ar.push(game.camera.x);
        ar.push(body.x - body.offset.x);
        game.camera.x = game.math.linearInterpolation(ar , 0.1);
    }

    function Render()
    {
//             game.debug.box2dWorld();
        if (current)
        {
            if(polyLine.length > 0) {
                graphics.clear();
                graphics.lineStyle(10, 0x00aa00, 1);
                var path = polyLine;
                graphics.moveTo(path[0].end.x, path[0].end.y);

                for (var i = 1; i < path.length; i++) {
                    graphics.lineTo(path[i].end.x, path[i].end.y);
                }
            }
        }


    }

};