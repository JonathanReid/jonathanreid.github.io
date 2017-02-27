/*
	Three.js "tutorials by example"
	Author: Lee Stemkoski
	Date: July 2013 (three.js v59dev)
*/

// MAIN

// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var sphere;

// custom global variables
var targetList = [];
var projector, mouse = { x: 0, y: 0 };

init();
animate();

// FUNCTIONS 		
function init() 
{
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,150,400);
	camera.lookAt(scene.position);	
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.getElementById( 'container' );
	container.appendChild( renderer.domElement );
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,250,0);
	scene.add(light);
	// FLOOR
	var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
	floorTexture.repeat.set( 10, 10 );
	var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);
	// SKYBOX/FOG
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	scene.add(skyBox);
	
	////////////
	// CUSTOM //
	////////////

	
	//////////////////////////////////////////////////////////////////////

	// this material causes a mesh to use colors assigned to faces
	var faceColorMaterial = new THREE.MeshBasicMaterial( 
	{ color: 0xffffff, vertexColors: THREE.FaceColors } );
	
	var sphereGeometry = new THREE.SphereGeometry( 80, 32, 16 );
	for ( var i = 0; i < sphereGeometry.faces.length; i++ ) 
	{
		face = sphereGeometry.faces[ i ];	
		face.color.setRGB( 0, 0, 0.8 * Math.random() + 0.2 );		
	}
	sphere = new THREE.Mesh( sphereGeometry, faceColorMaterial );
	sphere.position.set(0, 50, 0);
	scene.add(sphere);
	
	targetList.push(sphere);
	
	//////////////////////////////////////////////////////////////////////
	
	// initialize object to perform world/screen calculations
	projector = new THREE.Projector();
	
	// when the mouse moves, call the given function
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );
	document.addEventListener("touchstart", touchHandler, true);
    document.addEventListener("touchmove", touchHandler, true);
    document.addEventListener("touchend", touchHandler, true);
    document.addEventListener("touchcancel", touchHandler, true); 
}

function touchHandler(event)
{
    var touches = event.changedTouches,
        first = touches[0],
        type = "";
    switch(event.type)
    {
        case "touchstart": type = "mousedown"; break;
        case "touchmove":  type = "mousemove"; break;        
        case "touchend":   type = "mouseup";   break;
        default:           return;
    }

    // initMouseEvent(type, canBubble, cancelable, view, clickCount, 
    //                screenX, screenY, clientX, clientY, ctrlKey, 
    //                altKey, shiftKey, metaKey, button, relatedTarget);

    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1, 
                                  first.screenX, first.screenY, 
                                  first.clientX, first.clientY, false, 
                                  false, false, false, 0/*left*/, null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
}

var _mouseDown;
var _mouseEvent;
function onDocumentMouseDown( event ) 
{
	_mouseDown = true;
	_mouseEvent = event;
}

function onDocumentMouseMove(event)
{
	_mouseEvent = event;
}

function onDocumentMouseUp( event ) 
{
	_mouseDown = false;
}

function PullVertices()
{
	// the following line would stop any other event handler from firing
	// (such as the mouse's TrackballControls)
	// event.preventDefault();
	
	// update the mouse variable
	mouse.x = ( _mouseEvent.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( _mouseEvent.clientY / window.innerHeight ) * 2 + 1;
	
	// find intersections

	// create a Ray with origin at the mouse position
	//   and direction into the scene (camera direction)

	var points = [];
	points[0] = new THREE.Vector3( mouse.x, mouse.y, 1 );
	points[1] = new THREE.Vector3( mouse.x-0.1, mouse.y, 1 );
	points[2] = new THREE.Vector3( mouse.x+0.1, mouse.y, 1 );
	points[3] = new THREE.Vector3( mouse.x, mouse.y-0.1, 1 );
	points[4] = new THREE.Vector3( mouse.x, mouse.y+0.1, 1 );
	for(var i = 0; i < points.length; ++i)
	{
		var vector = points[i];
		vector.unproject(camera );
		var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

		// create an array containing all objects in the scene with which the ray intersects
		var intersects = ray.intersectObjects( targetList );
		
		// if there is one (or more) intersections
		if ( intersects.length > 0 )
		{
			// change the color of the closest face.

			var dir = new THREE.Vector3( );
			dir.add(intersects[ 0 ].object.geometry.vertices[intersects[ 0 ].face.a]);
			dir.add(intersects[ 0 ].object.geometry.vertices[intersects[ 0 ].face.b]);
			dir.add(intersects[ 0 ].object.geometry.vertices[intersects[ 0 ].face.c]);
			dir.divideScalar(3);

			dir.normalize();
			dir.divideScalar(5);

			intersects[ 0 ].object.geometry.vertices[intersects[ 0 ].face.a].add(dir);
			intersects[ 0 ].object.geometry.vertices[intersects[ 0 ].face.b].add(dir);
			intersects[ 0 ].object.geometry.vertices[intersects[ 0 ].face.c].add(dir);
			
			// intersects[ 0 ].face.color.setRGB( 0.8 * Math.random() + 0.2, 0, 0 ); 
			// intersects[ 0 ].object.geometry.colorsNeedUpdate = true;
			intersects[ 0 ].object.geometry.verticesNeedUpdate = true;
			intersects[ 0 ].object.geometry.normalsNeedUpdate = true;
		}	
		else 
		{
			_mouseDown = false;
		}
	}
}

function toString(v) { return "[ " + v.x + ", " + v.y + ", " + v.z + " ]"; }

function animate() 
{
    requestAnimationFrame( animate );
	render();		
	update();
}

function update()
{
	if ( keyboard.pressed("z") ) 
	{ 
		// do something
	}
	if(_mouseDown)
	{
		PullVertices();
	}
	else
	{
		controls.update();
	}
		
	stats.update();
}

function render() 
{
	renderer.render( scene, camera );
}