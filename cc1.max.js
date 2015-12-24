/**
 * @author Tom
 *
 * copyright CloudCalc, Inc. 2014
 * file = cc1.js    -- included in cc.html
 */

/* print routine for IE

Downloadify.create('downloadify',{
      filename: 'Example.pdf',
      data: function(){ 
          var doc = new jsPDF();
          doc.text(20, 20, 'PDF Generation using client-side Javascript');
          doc.addPage();
          doc.text(20, 20, 'Do you like that?');
          return doc.output();
      },
      onComplete: function(){ alert('Your File Has Been Saved!'); },
      onCancel: function(){ alert('You have cancelled the saving of this file.'); },
      onError: function(){ alert('You must put something in the File Contents or there will be nothing to save!'); },
      swf: '../libs/downloadify/media/downloadify.swf',
      downloadImage: '../libs/downloadify/images/download.png',
      width: 100,
      height: 30,
      transparent: true,
      append: false
  });

*/

// three.js stuff

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

//Orbit Controls
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 */

THREE.OrbitControls = function ( object, domElement ) {

    this.object = object;
    this.domElement = ( domElement !== undefined ) ? domElement : document;

    // API

    this.enabled = true;

    this.center = new THREE.Vector3();

    this.userZoom = true;
    this.userZoomSpeed = 1.0;

    this.userRotate = true;
    this.userRotateSpeed = 1.0;

    this.userPan = true;
    this.userPanSpeed = 3.0;

    this.autoRotate = false;
    this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    this.minDistance = 0;
    this.maxDistance = Infinity;

    // 65 /*A*/, 83 /*S*/, 68 /*D*/
    this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40, ROTATE: 65, ZOOM: 83, PAN: 68 };

    // internals
    var scope = this;

    var EPS = 0.000001;
    var PIXELS_PER_ROUND = 1800;

    var rotateStart = new THREE.Vector2();
    var rotateEnd = new THREE.Vector2();
    var rotateDelta = new THREE.Vector2();

    var zoomStart = new THREE.Vector2();
    var zoomEnd = new THREE.Vector2();
    var zoomDelta = new THREE.Vector2();

    var touchZoomDistanceStart = 0 ;
    var touchZoomDistanceEnd =0; 
    var panStart = new THREE.Vector2();
    var lastMove = null;

    var phiDelta = 0;
    var thetaDelta = 0;
    var scale = 1;

    var lastPosition = new THREE.Vector3();

    var STATE = { NONE: -1, PAN: 0, ZOOM: 1, ROTATE: 2 ,TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4};
    var state = STATE.NONE;

    // events

    var changeEvent = { type: 'change' };
    var startEvent = { type: 'start'};
    var endEvent = { type: 'end'};
    
    var firstTouch = 0;
    var firstTouchPos;
    var startTime;


    this.rotateLeft = function ( angle ) {

        if ( angle === undefined ) {

            angle = getAutoRotationAngle();

        }

        thetaDelta -= angle;

    };

    this.rotateRight = function ( angle ) {

        if ( angle === undefined ) {

            angle = getAutoRotationAngle();

        }

        thetaDelta += angle;

    };

    this.rotateUp = function ( angle ) {

        if ( angle === undefined ) {

            angle = getAutoRotationAngle();

        }

        phiDelta -= angle;

    };

    this.rotateDown = function ( angle ) {

        if ( angle === undefined ) {

            angle = getAutoRotationAngle();

        }

        phiDelta += angle;

    };

    this.zoomIn = function ( zoomScale ) {

        if ( zoomScale === undefined ) {

            zoomScale = getZoomScale();

        }
        
        
        if (this.object.zoom > .2){
            this.object.zoom -= .1
        }
        else{
            this.object.zoom -= this.object.zoom/2
        }
        
        this.object.updateProjectionMatrix();
        
    };

    this.zoomOut = function ( zoomScale ) {

        if ( zoomScale === undefined ) {

            zoomScale = getZoomScale();

        }
        if (this.object.zoom < 15){
            this.object.zoom += .1;
            this.object.updateProjectionMatrix();
        }        
        
    };

    this.zoomCamera = function () {

        if ( state === STATE.TOUCH_ZOOM_PAN ) {

            var factor = touchZoomDistanceStart / touchZoomDistanceEnd;
            touchZoomDistanceStart = touchZoomDistanceEnd;
            //if (Math.abs(factor - 1) > .01) {
            var zoomResult = this.object.zoom + (1 - factor);
            if (zoomResult > 0){

                this.object.zoom = zoomResult;
                this.object.updateProjectionMatrix();
            }
        }
    };

    this.pan = function ( distance ) {

        distance.transformDirection( this.object.matrix );
        distance.multiplyScalar( scope.userPanSpeed );

        this.object.position.add( distance );
        this.center.add( distance );

    };

    this.update = function () {

        var position = this.object.position;
        var offset = position.clone().sub( this.center );

        // angle from z-axis around y-axis

        var theta = Math.atan2( offset.x, offset.z );

        // angle from y-axis

        var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

        if ( this.autoRotate ) {

            this.rotateLeft( getAutoRotationAngle() );

        }

        theta += thetaDelta;
        phi += phiDelta;

        // restrict phi to be between desired limits
        phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

        // restrict phi to be betwee EPS and PI-EPS
        phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

        var radius = offset.length() * scale;

        // restrict radius to be between desired limits
        radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

        offset.x = radius * Math.sin( phi ) * Math.sin( theta );
        offset.y = radius * Math.cos( phi );
        offset.z = radius * Math.sin( phi ) * Math.cos( theta );

        position.copy( this.center ).add( offset );

        this.object.lookAt( this.center );

        thetaDelta = 0;
        phiDelta = 0;
        scale = 1;

        this.zoomCamera();

        if ( lastPosition.distanceTo( this.object.position ) > 0 ) {

            this.dispatchEvent( changeEvent );

            lastPosition.copy( this.object.position );

        }

    };


    function getAutoRotationAngle() {

        return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

    }

    function getZoomScale() {

        return Math.pow( 0.95, scope.userZoomSpeed );

    }

    function onMouseDown( event ) {

        lastDownTarget = canvas;
        if (( elSelectMode || nodSelectMode) && event.button === 0){	        
            getDownCoords(event);
            document.addEventListener( 'mousemove', onMouseMove, false );
            document.addEventListener( 'mouseup', onMouseUp, false );
            return;
        }

        if ( scope.enabled === false ) return;
        if ( scope.userRotate === false ) return;

        event.preventDefault();

        if ( state === STATE.NONE )
        {
            if ( event.button === 0 && keyboard.shift )
                state = STATE.ROTATE;
            if ( event.button === 1 )
                state = STATE.ZOOM;
            if ( event.button === 0 && !keyboard.shift)
                state = STATE.PAN;
        }
		
        
        
        //console.log(state);
        if ( state === STATE.ROTATE ) {

            //state = STATE.ROTATE;

            rotateStart.set( event.clientX, event.clientY );

        } else if ( state === STATE.ZOOM ) {

            //state = STATE.ZOOM;

            zoomStart.set( event.clientX, event.clientY );

        } else if ( state === STATE.PAN ) {

            //state = STATE.PAN;

        }

        document.addEventListener( 'mousemove', onMouseMove, false );
        document.addEventListener( 'mouseup', onMouseUp, false );

    }
    function rotateControls ( event, isTouch ){

        if ( isTouch ) {
            rotateEnd.set( event.touches[0].pageX, event.touches[0].pageY)
        }
        else{
            rotateEnd.set( event.clientX, event.clientY );
        }
        rotateDelta.subVectors( rotateEnd, rotateStart );

        scope.rotateLeft( 2 * Math.PI * rotateDelta.x / PIXELS_PER_ROUND * scope.userRotateSpeed );
        scope.rotateUp( 2 * Math.PI * rotateDelta.y / PIXELS_PER_ROUND * scope.userRotateSpeed );

        rotateStart.copy( rotateEnd );
    }

    function onMouseMove( event ) {

        if (drag){
            drawBox(event);
            return;
        }

        if ( scope.enabled === false ) return;

        event.preventDefault();

		
		
        if ( state === STATE.ROTATE ) {

            rotateControls ( event, false );

        } else if ( state === STATE.ZOOM ) {

            zoomEnd.set( event.clientX, event.clientY );
            zoomDelta.subVectors( zoomEnd, zoomStart );

            if ( zoomDelta.y > 0 ) {

                scope.zoomIn();

            } else {

                scope.zoomOut();

            }

            zoomStart.copy( zoomEnd );

        } else if ( state === STATE.PAN ) {

            var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            scope.pan( new THREE.Vector3( - movementX, movementY, 0 ) );

        }

    }

    function onMouseUp( event ) {

        
        if (drag){
            multiSelect(event);
        }
        if (scope.enabled === false) return;
        if ( scope.userRotate === false ) return;

        //document.removeEventListener('mouseup', onMouseUp, false);
        document.removeEventListener( 'mousemove', onMouseMove, false );
		

        state = STATE.NONE;

    }

    function onMouseWheel( event ) {

        if ( scope.enabled === false ) return;
        if ( scope.userZoom === false ) return;

        
        var delta = 0;

        if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

            delta = event.wheelDelta;

        } else if ( event.detail ) { // Firefox

            delta = - event.detail;

        }

        if ( delta > 0 ) {

            scope.zoomOut();

        } else {

            scope.zoomIn();

        }

    }

    function onKeyDown( event ) {

        if ( scope.enabled === false ) return;
        if ( scope.userPan === false ) return;

        switch ( event.keyCode ) {

            case scope.keys.ROTATE:
                state = STATE.ROTATE;
                break;
            case scope.keys.ZOOM:
                state = STATE.ZOOM;
                break;
            case scope.keys.PAN:
                state = STATE.PAN;
                break;
				
        }

    }
	
    function onKeyUp( event ) {

        switch ( event.keyCode ) {

            case scope.keys.ROTATE:
            case scope.keys.ZOOM:
            case scope.keys.PAN:
                state = STATE.NONE;
                break;
        }

    }

    function touchstart( event ) {

        lastDownTarget = canvas;
        if (( elSelectMode || nodSelectMode)){	        
            getDownCoords(event.touches[0]);
            scope.dispatchEvent( startEvent );
            return;
        }
       
        lastMove = event.touches[0];

        if ( scope.enabled === false ) return;

        switch ( event.touches.length ) {

            case 1:
                state = STATE.TOUCH_ROTATE; //set state
                rotateStart.set( event.touches[0].pageX, event.touches[0].pageY ); //set the start vector
                break;

            case 2:
                state = STATE.TOUCH_ZOOM_PAN;

                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                touchZoomDistanceEnd = touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy ); //touchZoomDistanceEnd and touchZoomDistanceStart variables

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                panStart.set( x , y );
                break;

            default:
                state = STATE.NONE;

        }
        scope.dispatchEvent( startEvent ); //dispatchEvent funciton


    }

    function touchmove( event ) {

        if (drag){
            
            event.preventDefault();
            event.stopPropagation();

            drawBox(event.touches[0]);
            lastMove = event.touches[0];
            return;
        }
        
        lastMove = event.touches[0];
        

        if ( scope.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        switch ( event.touches.length ) {

            case 1:
                if (state == STATE.TOUCH_ROTATE){
                    //_rotateEnd.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) ); //rotateEnd variable
                    rotateControls(event, true);
                }
                break;

            case 2:
                if ( state == STATE.TOUCH_ZOOM_PAN ){
                    var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                    var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                    touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy ); //touchZoomDistance
                

                    var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                    var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                    movementX = x - panStart.x;
                    movementY = y - panStart.y;
                    scope.pan( new THREE.Vector3( -movementX, movementY, 0));
                    panStart.set ( x , y );
                
                }
                break;

            default:
                state = STATE.NONE;

        }

    }

    function touchend( event ) {

        if (drag){
            multiSelect(lastMove);
            state = STATE.NONE;
            scope.dispatchEvent( endEvent );
            return;
        }
        if ( !firstTouch ){
            var d = new Date();
            firstTouch = d.getTime();
            firstTouchPos = lastMove;
        }

        else{
            var d = new Date();

            //check time and location of both taps for a touble tap select
            if ( (d.getTime() - firstTouch) < 300 ){
                var dx = lastMove.pageX - firstTouchPos.pageX;
                var dy = lastMove.pageY - firstTouchPos.pageY;
                var dist = Math.sqrt (dx * dx + dy * dy );
                if ( dist < 50 ) {
                    mouse.x = (lastMove.pageX + firstTouchPos.pageX) / 2;
                    mouse.y = (lastMove.pageY + firstTouchPos.pageY) / 2;
                    if (event.touches.length == 1){ //make sure only one touchwas made. 
                        click = true;
                    }
                }
            }
            firstTouch = 0;
            if ( click )
                return;
        }
        if ( scope.enabled === false ) return;

        switch ( event.touches.length ) {

            case 1:
                //rotateEnd.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) ); //rotateend
                //rotateStart.copy( _rotateEnd ); //rotatestart //use rotate function from orbit control
                break;

            case 2:
                touchZoomDistanceStart = touchZoomDistanceEnd = 0;

                //var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                //var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                //panEnd.copy( getMouseOnScreen( x, y ) );
                //panStart.copy( panEnd );
                break;

        }

        state = STATE.NONE;
        scope.dispatchEvent( endEvent );

    }

    this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
    
    this.domElement.addEventListener('mousedown', onMouseDown, false);
    this.domElement.addEventListener('mouseup', onMouseUp, false);

    this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
    this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
    this.domElement.addEventListener( 'mousewheel', zoomDebounce, false );

    this.domElement.addEventListener( 'touchstart', touchstart, false );
    this.domElement.addEventListener( 'touchend', touchend, false );
    this.domElement.addEventListener( 'touchmove', touchmove, false );


};
document.addEventListener( 'keydown', handleKeyDown, false );
document.addEventListener( 'keyup', handleKeyUp, false );

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
document.addEventListener('mousedown', function(){
    lastDownTarget = null;
}, false);

var mobileDevice;
var isMobile = false;
var bBox;    // used to manipulate the occasional bootbox

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    mobileDevice = true;
    isMobile = true;
}
else{
    mobileDevice = false;
    isMobile = false;
}

var shareID;
var isSharing = false;

// introJS

var intro;
function introHelp(iTour) {

    if( isMobile ) {
        if( iTour == 3 ) {  // big main help button
            if( !allGraphics ) {
                if( savedScreen == "loadCaseBuilder" ) 
                    iTour = 9;
                else {
                    if( savedScreen == "nodalCoords" ) 
                        iTour = 7;
                    else {
                        if (savedScreen == "modelListView") 
                            iTour = 8;
                        else {
                            if (savedScreen == "inputWiz") 
                                iTour = 6;
                            else {
                                if (savedScreen == "inputDescr") 
                                    iTour = 10;
                            }
                        }
                    }
                }
            }
        }
    }

    switch (iTour) {
        case 1: // quick start screen
            intro = introJs().setOptions({
                skipLabel: "Exit",
                tooltipPosition: "bottom",
                steps: [{
                    element: '#modalQuickStart1',
                    intro: "Download our pre-built sample model to use as your starting point.",
                    position: "left"
                }, {
                    element: '#modalQuickStart2',
                    intro: "Use the Design Wizard, which lets you instantly build parametric models using selected standard layouts."
                }, {
                    element: '#modalQuickStart3',
                    intro: 'Follow the CloudCalc Tutorial, which leads you through the construction of a more complex model, while exploring most of the capabilities of the program.'
                }, {
                    element: '#modalQuickStart4',
                    intro: 'Start using CloudCalc on your own.  User documentation is always available from the <b>Help-User Documentation</b> Menu Option.',
                    position: 'right'
                }]
            });
            break;
        case 2: // graphics screen
            if (isMobile) {
                intro = introJs().setOptions({
                    skipLabel: "Exit",
                    tooltipPosition: "top",
                    steps: [{
                        /*element:'#modelGraphics',  */
                        intro: "The CloudCalc model may be built or edited in Graphics mode.<br><br>Double-clicking on any element in the model selects that element (making it the current element for modeling/editing purposes).  " +
                        "When elements or nodes are selected, right clicking the mouse brings up available editing commands.<br><br>" +
                        "Additionally many Commands/ Actions/Hot keys are active in this Graphic Area (you may need to click in Graphics Area first to ensure Hot Keys are active), click <b>Next--></b> to review them.",
                        position: "left"
                    }, {
                        element: '#panTools',
                        intro: "<b>Pan Model:</b>   Click Left Mouse Button then drag (except when Selection Modes <img src='assets/ico/ico_select.png'>, <img src='assets/ico/ico_selectels.png'>, or <img src='assets/ico/ico_selectnods.png'> are activated).<br><br>" +
                        "Note:  Hot Key <b>P</b> activates mouse pan mode (by deactivating Selection Modes).<br><br>" +
                        "Also click <b>Hand</b> icons to pan in corresponding direction.<br><br>" +
                        "<b>+</b> and <b>-</b> icons move model into and out of the Cutting Plane respectively.",
                        position: 'top'
                    }, {
                        element: '#rotTools',
                        intro: "<b>Rotate Model:</b>   Use Left, Right, Up, Down arrow keys or click <b>Arrow</b> icons",
                        position: 'top'
                    }, {
                        element: '#zoomTools',
                        intro: "<b>Zoom Model:</b>   Use <b>Mousewheel</b>, <b>+/-</b> keys on Numeric Keypad , or <b>Microscope</b> icons.<br>",
                        position: 'top'
                    }, {
                        element: '#drawImage',
                        intro: "<b>Draw an Element Between 2 Points:</b><br><br>Elements may be drawn between any two points (points = ends of elements, or nodes on the grid), using the mouse.<br><br>" +
                        "First activate <b>Element Draw Mode</b> by clicking this icon, then... (click <b>Next--></b>)",
                        position: 'top'
                    }, {
                        element: '#newEl',
                        intro: "<b>Draw an Element Between 2 Points:</b><br><br>Elements may be drawn between any two points (points = ends of elements, or nodes on the grid), using the mouse.<br><br>" +
                        "...Then click <b>+ New</b> and Left Mouse Click on the two points/nodes between which you wish to draw the element.<br><br>" +
                        "Pressing the <b>[PgDn]</b>,<b>[PgUp]</b>,<b>[Home]</b>,or <b>[End]</b> keys, or <b>First</b>,<b>Prev</b>,<b>Next</b>,or <b>Last</b> icons will process and save the element.<br><br>" +
                        "Click <b>Next--></b> to watch a Demo Video.",
                        position: 'right'
                    }, {
                        element: '#drawImage',
                        intro: "<b>Draw an Element Between 2 Points:</b><br><br>Elements may be drawn between any two points (points = ends of elements, or nodes on the grid), using the mouse.<br><br>" +
                        '<video width="300" height="225" controls><source src="assets/videos/elDraw.mp4" type="video/mp4">' +
                        'Your browser does not support the video tag.</video>',
                        position: 'top'
                    }, {
                        element: '#elSelectMode',
                        intro: "<b>Select Elements</b> for editing: Click the 'Element Select by Window' icon (or use Hot key <b>E</b>) to put CloudCalc into Element Select Mode.  " +
                        "Left-click and then drag a window to select elements (highlighted in yellow).  " +
                        "Activate the <b>Ctrl</b> button (just to the left of <b>Select Elements</b>) in order to add to the current selection set, rather than replace.<br><br>" +
                        "When elements are selected they may be edited via the <b>Graphic Editing</b> menu:<br><br>" +
                        '<img height="150" src="assets/img/contextMenu.png" alt="Context Menu"><br><br>' +
                        "Click <b>Next--></b> to watch a Demo Video.",
                        position: 'top'
                    }, {
                        element: '#elSelectMode',
                        intro: "<b>Select Elements</b> for editing: Click the 'Element Select by Window' icon (or use Hot key <b>E</b>) to put CloudCalc into Element Select Mode.  " +
                        '<video width="300" height="225" controls><source src="assets/videos/elSelect.mp4" type="video/mp4">' +
                        'Your browser does not support the video tag.</video>',
                        position: 'top'
                    }, {
                        element: '#nodSelectMode',
                        intro: "<b>Select Nodes</b> for editing: Click the 'Node Select by Window' icon (or use Hot key <b>N</b>) to put CloudCalc into Node Select Mode.  " +
                        "Left-click and then drag a window to select nodes (highlighted in orange).  " +
                        "Activate the <b>Ctrl</b> button (two buttons to the left) in order to add to the current selection set, rather than replace.<br><br>" +
                        "Pressing the <b>Ctrl</b> while dragging the window adds to the current selection set.<br><br>" +
                        "When nodes are selected they may be edited via the <b>Graphic Editing</b> menu:<br><br>" +
                        '<img height="150" src="assets/img/contextMenu1.png" alt="Context Menu"><br><br>' +
                        "Click <b>Next--></b> to watch a Demo Video.",
                        position: 'top'
                    }, {
                        element: '#nodSelectMode',
                        intro: "<b>Select Nodes</b> for editing: Click the 'Node Select by Window' icon (or use Hot key <b>N</b>) to put CloudCalc into Node Select Mode.  " +
                        '<video width="300" height="225" controls><source src="assets/videos/nodSelect.mp4" type="video/mp4">' +
                        'Your browser does not support the video tag.</video>',
                        position: 'top'
                    }, {
                        element: '#gridMode',
                        intro: "<b>Grid Mode:</b>  Displays the nodal grid created in <b>Input->Nodal Coordinates</b> (otherwise only the nodes associated with elements are displayed).",
                        position: 'top'
                    }, {
                        element: '#viewTools',
                        intro: "<b>Change View Oriention:</b>   Click these icons (or use Hot keys <b>3</b>, <b>X</b>, <b>Y</b>, or <b>Z</b>) to view along the 3D Iso, X-, Y-, or Z- axes.",
                        position: 'top'
                    }, {
                        element: '#toggleTexture',
                        intro: "<b>Texture:</b>  Click this icon to display the model with metal texture.<br><br>Note that double clicking to select an element will not work when Texture is activated.",
                        position: 'top'
                    }, {
                        element: '#dynamicAnimation',
                        intro: "<b>Dynamic Animation:</b>  Once dynamic analysis has been run, clicking this icon animates the current mode shape.",
                        position: 'top'
                    }, {
                        element: '#stickFigure',
                        intro: "<b>Center Line Mode:</b>  Clicking this icon displays the elements' Center Lines only.",
                        position: 'top'
                    }, {
                        element: '#nodesOn',
                        intro: "<b>Node Number Display:</b>  This icon activates/deactivates node number labels.",
                        position: 'top'
                    }, {
                        element: '#resetGraph',
                        intro: "<b>Redraw</b>  This icon re-initializes/redraws the graphics.",
                        position: 'top'
                    }]
                });
            }
            else {
                intro = introJs().setOptions({
                    skipLabel: "Exit",
                    tooltipPosition: "top",
                    steps: [{
                        element: '#modelGraphics',
                        intro: "The CloudCalc model may be built or edited in Graphics mode.<br><br>Double-clicking on any element in the model selects that element (making it the current element for modeling/editing purposes).  " +
                        "When elements or nodes are selected, right clicking the mouse brings up available editing commands.<br><br>" +
                        "Additionally many Commands/ Actions/Hot keys are active in this Graphic Area (you may need to click in Graphics Area first to ensure Hot Keys are active), click <b>Next--></b> to review them.",
                        position: "left"
                    }, {
                        element: '#panTools',
                        intro: "<b>Pan Model:</b>   Click Left Mouse Button then drag (except when Selection Modes <img src='assets/ico/ico_select.png'>, <img src='assets/ico/ico_selectels.png'>, or <img src='assets/ico/ico_selectnods.png'> are activated).<br><br>" +
                        "Note:  Hot Key <b>P</b> activates mouse pan mode (by deactivating Selection Modes).<br><br>" +
                        "Also click <b>Hand</b> icons to pan in corresponding direction.<br><br>" +
                        "<b>+</b> and <b>-</b> icons move model into and out of the Cutting Plane respectively.",
                        position: 'top'
                    }, {
                        element: '#rotTools',
                        intro: "<b>Rotate Model:</b>   Use Left, Right, Up, Down arrow keys or click <b>Arrow</b> icons",
                        position: 'top'
                    }, {
                        element: '#zoomTools',
                        intro: "<b>Zoom Model:</b>   Use <b>Mousewheel</b>, <b>+/-</b> keys on Numeric Keypad , or <b>Microscope</b> icons.<br>",
                        position: 'top'
                    }, {
                        element: '#drawImage',
                        intro: "<b>Draw an Element Between 2 Points:</b><br><br>Elements may be drawn between any two points (points = ends of elements, or nodes on the grid), using the mouse.<br><br>" +
                        "First activate <b>Element Draw Mode</b> by clicking this icon, then... (click <b>Next--></b>)",
                        position: 'top'
                    }, {
                        element: '#newEl',
                        intro: "<b>Draw an Element Between 2 Points:</b><br><br>Elements may be drawn between any two points (points = ends of elements, or nodes on the grid), using the mouse.<br><br>" +
                        "...Then click <b>+ New</b> and Left Mouse Click on the two points/nodes between which you wish to draw the element.<br><br>" +
                        "Pressing the <b>[PgDn]</b>,<b>[PgUp]</b>,<b>[Home]</b>,or <b>[End]</b> keys, or <b>First</b>,<b>Prev</b>,<b>Next</b>,or <b>Last</b> icons will process and save the element.<br><br>" +
                        "Click <b>Next--></b> to watch a Demo Video.",
                        position: 'right'
                    }, {
                        element: '#drawImage',
                        intro: "<b>Draw an Element Between 2 Points:</b><br><br>Elements may be drawn between any two points (points = ends of elements, or nodes on the grid), using the mouse.<br><br>" +
                        '<video width="300" height="225" controls><source src="assets/videos/elDraw.mp4" type="video/mp4">' +
                        'Your browser does not support the video tag.</video>',
                        position: 'top'
                    }, {
                        element: '#elSelectMode',
                        intro: "<b>Select Elements</b> for editing: Click the 'Element Select by Window' icon (or use Hot key <b>E</b>) to put CloudCalc into Element Select Mode.  " +
                        "Left-click and then drag a window to select elements (highlighted in yellow).  " +
                        "Pressing the <b>Ctrl</b> (or alternatively activate the <b>Ctrl</b> button to the left) while dragging the window adds to the current selection set.<br><br>" +
                        "When elements are selected, right-click or use the <b>Graphic Editing</b> menu to get available editing commands:<br><br>" +
                        '<img height="150" src="assets/img/contextMenu.png" alt="Context Menu"><br><br>' +
                        "Click <b>Next--></b> to watch a Demo Video.",
                        position: 'top'
                    }, {
                        element: '#elSelectMode',
                        intro: "<b>Select Elements</b> for editing: Click the 'Element Select by Window' icon (or use Hot key <b>E</b>) to put CloudCalc into Element Select Mode.  " +
                        '<video width="300" height="225" controls><source src="assets/videos/elSelect.mp4" type="video/mp4">' +
                        'Your browser does not support the video tag.</video>',
                        position: 'top'
                    }, {
                        element: '#nodSelectMode',
                        intro: "<b>Select Nodes</b> for editing: Click the 'Node Select by Window' icon (or use Hot key <b>N</b>) to put CloudCalc into Node Select Mode.  " +
                        "Left-click and then drag a window to select nodes (highlighted in orange).  " +
                        "Pressing the <b>Ctrl</b> (or alternatively activate the <b>Ctrl</b> button to the left) while dragging the window adds to the current selection set.<br><br>" +
                        "When nodes are selected, right-click or use the <b>Graphic Editing</b> menu to get available editing commands:<br><br>" +
                        '<img height="150" src="assets/img/contextMenu1.png" alt="Context Menu"><br><br>' +
                        "Click <b>Next--></b> to watch a Demo Video.",
                        position: 'top'
                    }, {
                        element: '#nodSelectMode',
                        intro: "<b>Select Nodes</b> for editing: Click the 'Node Select by Window' icon (or use Hot key <b>N</b>) to put CloudCalc into Node Select Mode.  " +
                        '<video width="300" height="225" controls><source src="assets/videos/nodSelect.mp4" type="video/mp4">' +
                        'Your browser does not support the video tag.</video>',
                        position: 'top'
                    }, {
                        element: '#gridMode',
                        intro: "<b>Grid Mode:</b>  Displays the nodal grid created in <b>Input->Nodal Coordinates</b> (otherwise only the nodes associated with elements are displayed).",
                        position: 'top'
                    }, {
                        element: '#viewTools',
                        intro: "<b>Change View Oriention:</b>   Click these icons (or use Hot keys <b>3</b>, <b>X</b>, <b>Y</b>, or <b>Z</b>) to view along the 3D Iso, X-, Y-, or Z- axes.",
                        position: 'top'
                    }, {
                        element: '#toggleTexture',
                        intro: "<b>Texture:</b>  Click this icon to display the model with metal texture.<br><br>Note that double clicking to select an element will not work when Texture is activated.",
                        position: 'top'
                    }, {
                        element: '#dynamicAnimation',
                        intro: "<b>Dynamic Animation:</b>  Once dynamic analysis has been run, clicking this icon animates the current mode shape.",
                        position: 'top'
                    }, {
                        element: '#stickFigure',
                        intro: "<b>Center Line Mode:</b>  Clicking this icon displays the elements' Center Lines only.",
                        position: 'top'
                    }, {
                        element: '#nodesOn',
                        intro: "<b>Node Number Display:</b>  This icon activates/deactivates node number labels.",
                        position: 'top'
                    }, {
                        element: '#resetGraph',
                        intro: "<b>Redraw</b>  This icon re-initializes/redraws the graphics.",
                        position: 'top'
                    }]
                });
            }
            break;
        case 3: // general tour
            if (isMobile) {
                if (allGraphics) // don't give tour of spreadsheet
                    intro = introJs().setOptions({
                        skipLabel: "Exit",
                        tooltipPosition: "right",
                        showStepNumbers: "false",
                        steps: [{ /* element:'#modelContainer', */
                            intro: "The structural model is displayed in this Graphics Area.<br><br>" +
                            "The model may also be built using graphics commands (without having to use the Data Entry Sheet).<br><br>" +
                            "Click the Help icon <img src='assets/ico/ico_question_mark.png' alt='Help'> at the lower-right of the Graphics Area for more information on those commands.",
                            position: "left"
                        }, {
                            element: '#hero1',
                            intro: "Clicking the CloudCalc Logo opens (or hides) the Data Entry Sheet, for an alternative to Graphic editing.",
                            position: 'right'
                        }, {
                            element: '#menu1',
                            intro: "Any specific element can be set as the current element by clicking <b>First</b>, <b>Prev</b>, <b>Next</b>, <b>Last</b> (or by pressing " +
                            "<b>Ctrl-Home</b>, <b>PgUp</b>, <b>PgDn</b>, or <b>Ctrl-End</b>), or by clicking <b>Find</b>.<br><br>" +
                            "The chronological number of the current element is shown at the top of this menu, along with the total number of elements in the model.<br><br>" +
                            "Plus unlimited <b>Undo</b> (ctrl-Z) and <b>Redo</b> (ctrl-Y).",
                            position: 'right'
                        }, {
                            element: '#fileHead',
                            intro: "The <b>File Menu</b> is used to start a New Job, open an Existing Job, Save As (under a new name), or Upload or Download a model. ",
                            position: 'bottom'
                        }, {
                            element: '#inputMenu',
                            intro: "The <b>Input Menu</b> is used to switch between Input Mode:<br><br><b>Design Wizard</b> -- Parametrically build standard structures<br><br>" +
                            "<b>Description/Notes</b> -- Add descriptive information to your job<br><br><b>Nodal Coordinates</b> -- Define a nodal grid for your structure<br><br>" +
                            "<b>Modeling</b> -- Standard Data Entry Sheet<br><br><b>List View</b> -- Review the elements in a list<br><br>" +
                            "<b>Load Cases</b> -- Set up your Load Cases",
                            position: 'bottom'
                        }, {
                            element: '#analysisMenu',
                            intro: "The <b>Analysis Menu</b> is used to run the <b>Static</b> or <b>Dynamic</b> analysis.<br><br>" +
                            "Dynamic Analysis calculates the first 5 Modes of Vibration.",
                            position: 'bottom'
                        }, {
                            element: '#outputMenu',
                            intro: "The <b>Output Menu</b> is used to switch back to the Output Reports if the user has switched back to Modeling Mode after running an analysis.",
                            position: 'bottom'
                        }, {
                            element: '#collabMenu',
                            intro: "The <b>Collaboration Menu</b> is used to facilitate sharing of your model with other users, either by a) granting permission to specific users (or the Public) or b) creating a direct URL link to the model which can be emailed to anyone, whether they are a registered CloudCalc user or not.",
                            position: 'bottom'
                        }, {
                            element: '#toolsMenu',
                            intro: "The <b>Tools Menu</b> provides several Program Utilities:<br><br><b>Configuration</b> -- used to customize your experience, by setting defaults, such as for Units, Language, modeling defaults for Columns, Beams, or Braces.<br><br>" +
                            "<b>Units</b> -- set Units for a New Job, or convert an existing one.<br><br>" +
                            "<b>Update User Profile</b> -- change your Password, etc.",
                            position: 'bottom'
                        }, {
                            element: '#graphEdit',
                            intro: "The <b>Graphic Editing Menu</b> provides all of the available editing options once Elements or Nodes have been selected graphically." +
                            '<br><br>For Elements:<br><br><img height="160" src="assets/img/contextMenu.png" alt="Context Menu">' +
                            '<br><br>For Nodes:<br><br><img height="80" src="assets/img/contextMenu1.png" alt="Context Menu"><br><br>',
                            position: 'bottom'
                        }, {
                            element: '#helpMenu',
                            intro: "The <b>Help Menu</b> provides access to many forms of Application Help: User Documentation, Tutorial, Quick Start Screen, Technical Support Forum, Email CloudCalc, etc.",
                            position: 'bottom'
                        }]
                    });
                else {
                    showScreen("inputScreen");
                    intro = introJs().setOptions({
                        skipLabel: "Exit",
                        tooltipPosition: "right",
                        showStepNumbers: "false",
                        steps: [{
                            /* element: '#inputScreen', */
                            intro: "This Data Entry Sheet is used to enter/edit/review data relating to each individual structural element.<br><br>" +
                            "Click the Help icon <img src='assets/ico/ico_question_mark.png' alt='Help'> at the upper-right of the Data Entry Sheet for more information on this screen.",
                            position: 'right'
                        }, {
                            element: '#hero1',
                            intro: "Clicking the CloudCalc Logo hides (or unhides) the Data Entry Sheet, revealing the Graphics Display (and permitting Graphic Editing).",
                            position: 'bottom'
                        }, {
                            element: '#menu1',
                            intro: "The Data Entry Sheet for any specific element can be displayed by clicking <b>First</b>, <b>Prev</b>, <b>Next</b>, <b>Last</b> (or by pressing " +
                            "<b>Ctrl-Home</b>, <b>PgUp</b>, <b>PgDn</b>, or <b>Ctrl-End</b>), or by clicking <b>Find</b>.<br><br>" +
                            "The chronological number of the element being displayed is shown at the top of this menu, along with the total number of elements in the model.<br><br>" +
                            "Plus unlimited <b>Undo</b> (ctrl-Z) and <b>Redo</b> (ctrl-Y).",
                            position: 'right'
                        }, {
                            element: '#fileHead',
                            intro: "The <b>File Menu</b> is used to start a New Job, open an Existing Job, Save As (under a new name), or Upload or Download a model. ",
                            position: 'bottom'
                        }, {
                            element: '#inputMenu',
                            intro: "The <b>Input Menu</b> is used to switch between Input Mode:<br><br><b>Design Wizard</b> -- Parametrically build standard structures<br><br>" +
                            "<b>Description/Notes</b> -- Add descriptive information to your job<br><br><b>Nodal Coordinates</b> -- Define a nodal grid for your structure<br><br>" +
                            "<b>Modeling</b> -- Standard Data Entry Sheet<br><br><b>List View</b> -- Review the elements in a list<br><br>" +
                            "<b>Load Cases</b> -- Set up your Load Cases",
                            position: 'bottom'
                        }, {
                            element: '#analysisMenu',
                            intro: "The <b>Analysis Menu</b> is used to run the <b>Static</b> or <b>Dynamic</b> analysis.<br><br>" +
                            "Dynamic Analysis calculates the first 5 Modes of Vibration.",
                            position: 'bottom'
                        }, {
                            element: '#outputMenu',
                            intro: "The <b>Output Menu</b> is used to switch back to the Output Reports if the user has switched back to Modeling Mode after running an analysis.",
                            position: 'bottom'
                        }, {
                            element: '#toolsMenu',
                            intro: "The <b>Tools Menu</b> provides several Program Utilities:<br><br><b>Configuration</b> -- used to customize your experience, by setting defaults, such as for Units, Language, modeling defaults for Columns, Beams, or Braces.<br><br>" +
                            "<b>Units</b> -- set Units for a New Job, or convert an existing one.<br><br><b>Update User Profile</b> -- change your Password, etc.",
                            position: 'bottom'
                        }, {
                            element: '#graphEdit',
                            intro: "The <b>Graphic Editing Menu</b> provides all of the available editing options once Elements or Nodes have been selected graphically." +
                            '<br><br>For Elements:<br><br><img height="160" src="assets/img/contextMenu.png" alt="Context Menu">' +
                            '<br><br>For Nodes:<br><br><img height="80" src="assets/img/contextMenu1.png" alt="Context Menu"><br><br>',
                            position: 'bottom'
                        }, {
                            element: '#helpMenu',
                            intro: "The <b>Help Menu</b> provides access to many forms of Application Help: User Documentation, Tutorial, Quick Start Screen, Technical Support Forum, Email CloudCalc, etc.",
                            position: 'bottom'
                        }]
                    });
                }
            }
            else {
                intro = introJs().setOptions({
                    skipLabel: "Exit",
                    tooltipPosition: "right",
                    showStepNumbers: "false",
                    steps: [{
                        element: '#inputScreen',
                        intro: "This Data Entry Sheet is used to enter/edit/review data relating to each individual structural element.<br><br>" +
                        "Click the Help icon <img src='assets/ico/ico_question_mark.png' alt='Help'> at the upper-right of the Data Entry Sheet for more information on this screen.",
                        position: 'right'
                    }, {
                        element: '#menu1',
                        intro: "The Data Entry Sheet for any specific element can be displayed by clicking <b>First</b>, <b>Prev</b>, <b>Next</b>, <b>Last</b> (or by pressing " +
                        "<b>Ctrl-Home</b>, <b>PgUp</b>, <b>PgDn</b>, or <b>Ctrl-End</b>), or by clicking <b>Find</b>.<br><br>" +
                        "The chronological number of the element being displayed is shown at the top of this menu, along with the total number of elements in the model.",
                        position: 'right'
                    }, {
                        element: '#modelContainer',
                        intro: "The structural model is displayed in theis Graphics Area.<br><br>" +
                        "The model may also be built using graphics commands (without having to use the Data Entry Sheet).<br><br>" +
                        "Click the Help icon <img src='assets/ico/ico_question_mark.png' alt='Help'> at the lower-right of the Graphics Area for more information on those commands.",
                        position: "left"
                    }, {
                        element: '#hero',
                        intro: "Clicking the CloudCalc Logo hides (or unhides) the Data Entry Sheet, maximizing the screen space available for the graphics display.",
                        position: 'bottom'
                    }, {
                        element: '#fileHead',
                        intro: "The <b>File Menu</b> is used to start a New Job, open an Existing Job, Save As (under a new name), or Upload or Download a model. ",
                        position: 'bottom'
                    }, {
                        element: '#inputMenu',
                        intro: "The <b>Input Menu</b> is used to switch between Input Mode:<br><br><b>Design Wizard</b> -- Parametrically build standard structures<br><br>" +
                        "<b>Description/Notes</b> -- Add descriptive information to your job<br><br><b>Nodal Coordinates</b> -- Define a nodal grid for your structure<br><br>" +
                        "<b>Modeling</b> -- Standard Data Entry Sheet<br><br><b>List View</b> -- Review the elements in a list<br><br>" +
                        "<b>Load Cases</b> -- Set up your Load Cases<br><br><b>Show Full Screen Graphics</b> -- Hide the Text area to maximize Graphics area",
                        position: 'bottom'
                    }, {
                        element: '#analysisMenu',
                        intro: "The <b>Analysis Menu</b> is used to run the <b>Static</b> or <b>Dynamic</b> analysis.<br><br>" +
                        "Dynamic Analysis calculates the first 5 Modes of Vibration.",
                        position: 'bottom'
                    }, {
                        element: '#outputMenu',
                        intro: "The <b>Output Menu</b> is used to switch back to the Output Reports if the user has switched back to Modeling Mode after running an analysis.",
                        position: 'bottom'
                    }, {
                        element: '#collabMenu',
                        intro: "The <b>Collaboration Menu</b> is used to facilitate sharing of your model with other users, either by a) granting permission to specific users (or the Public) or b) creating a direct URL link to the model which can be emailed to anyone, whether they are a registered CloudCalc user or not.",
                        position: 'bottom'
                    }, {
                        element: '#toolsMenu',
                        intro: "The <b>Tools Menu</b> provides several Program Utilities:<br><br><b>Configuration</b> -- used to customize your experience, by setting defaults, such as for Units, Language, modeling defaults for Columns, Beams, or Braces.<br><br>" +
                        "<b>Units</b> -- set Units for a New Job, or convert an existing one.<br><br><b>Catalog</b> -- add Member Types or Materials from the on-line database to those available to the current modeling session.<br><br>" +
                        "<b>Update User Profile</b> -- change your Password, etc.",
                        position: 'bottom'
                    }, {
                        element: '#graphEdit',
                        intro: "The <b>Graphic Editing Menu</b> provides all of the available editing options once Elements or Nodes have been selected graphically." +
                        '<br><br>For Elements:<br><br><img height="160" src="assets/img/contextMenu.png" alt="Context Menu">' +
                        '<br><br>For Nodes:<br><br><img height="80" src="assets/img/contextMenu1.png" alt="Context Menu"><br><br>',
                        position: 'bottom'
                    }, {
                        element: '#helpMenu',
                        intro: "The <b>Help Menu</b> provides access to many forms of Application Help: User Documentation, Tutorial, Quick Start Screen, Technical Support Forum, Email CloudCalc, etc.",
                        position: 'bottom'
                    }]
                });
            }
            break;
        case 4: // data input screen
            intro = introJs().setOptions({
                skipLabel: "Exit",
                tooltipPosition: "right",
                steps: [{
                    element: '#nodeFields',
                    intro: "Enter <b>From/To Nodes</b> here to define each Element.<br><br>Connectivity of the elements is determined by the End Nodes.<br><br>" +
                    "Note -- if these fields are grayed-out it means that you need to define a Job Name using Menu Option <b>File->New</b>.",
                    position: 'right'
                }, {
                    element: '#deltaFields',
                    intro: "Enter the distance from Start (From Node) to End (To Node) of the element in each of the Coordinate Directions.<br><br>" +
                    "Note -- if these fields are grayed-out it means that you need to define a Job Name using Menu Option <b>File->New</b>.",
                    position: 'right'
                }, {
                    element: '#memberField',
                    intro: "Select the Structural Member Type of this Element from the dropdown list.<br><br>If you need to add or delete members to/from the " +
                    "dropdown list, you can do so using Menu Option <b>Tools->Catalog->Member Types</b>.",
                    position: "right"
                }, {
                    element: '#betaField',
                    intro: "Define the Beta Angle (in degrees) representing the Angle of Rotation about the Center Line from 'Standard Orientation' (as represented by the diagrams in the AISC Manual).",
                    position: "right"
                }, {
                    element: '#materialField',
                    intro: "Select the Material Member Type for this Element from the dropdown list.<br><br>If you need to add or delete materials to/from the " +
                    "dropdown list, you can do so using Menu Option <b>Tools->Catalog->Materials</b>.",
                    position: "right"
                }, {
                    element: '#accordion0',
                    intro: "Check the boxes indicating any Moment Releases for this element here.<br><br>The <b>x-axis</b> represents the element Center Line, " +
                    "The <b>y-axis</b> represents the local Weak Axis, and the <b>z-axis</b> represents the local Strong Axis." +
                    "<br><br>Creating too many member releases could create an unstable configuration.",
                    position: "top"
                }, {
                    element: '#accordion1',
                    intro: "Check the boxes indicating any Restraints acting at the ends of this element here.<br><br>Note that the available directions indicate <b>Global</b> axes.",
                    position: "top"
                }, {
                    element: '#accordionA',
                    intro: "Enter information required for <b>Code Check</b> (Note that axis references correspond to AISC terminology):<br><br><b>lx</b>,<b>ly</b>,<b>lz</b> -- Unbraced length of this element, if different from modeled length, relative to local Strong Axis, Weak Axis, or Torsional Buckling center line." +
                    "<br><br><b>kx</b>,<b>ky</b>,<b>kz</b> -- Effective Length Factor for element (if not 1.0), relative to element's local axes." +
                    "<br><br><b>cb-x</b>,<b>cb-y</b> -- Lateral-Torsional Buckling Modification Factor to be used, if element's actual length is different from modeled length. If blank, CloudCalc calculates <b>cb</b> based on moment values occurring along length of the modeled element.  Values are relative to local Strong and Weak Axes respectively." +
                    "<br><br><b>Contributes to Stability?</b> -- Check box if the element Contributes to Stability of structure; if so, element will receive reduced stiffness (based on compressive loading).",
                    position: "right"
                }, {
                    element: '#accordionAA',
                    intro: "Enter data for any Stiffeners resisting Shear Loads:<br><br><b>Dist between Stiffener</b> -- Enter the greatest distance between stiffeners along this element's length.<br><br>" +
                    "<b>Moment of Inertia</b> -- Enter Moment of Inertia of Stiffener cross section.<br><br><b>Tension Field Action Permitted?</b> -- Check this box if Tension Field Action is permitted on this element.",
                    position: "right"
                }, {
                    element: '#unifFields',
                    intro: "Enter <b>Uniform Forces</b> acting on this element.<br><br>The loads should be specified as <b>Dead</b>, <b>Live</b>, or <b>Occasional</b> Loads.<br><br>Note Uniform Loads should be specified relative to Global Axes.",
                    position: "left"
                }, {
                    element: '#concFields',
                    intro: "Enter <b>Concentrated Loads</b> may be applied at the <br>From</b> and/or <br>To</b> nodes of this element.<br><br>The loads should be specified as <b>Dead</b>, <b>Live</b>, or <b>Occasional</b> Loads.<br><br>Note Concentrated Loads should be specified relative to Global Axes.",
                    position: "left"
                }, {
                    element: '#groupField',
                    intro: "Assign <b>Group Name(s)</b> to the element (examples might be 'Second Floor', 'Col A', etc.).<br><br>Elements may be selected graphically, for editing, by Group Name(s)." +
                    "<br><br>Note that assigning the Group Name <b>Column</b>, <b>Beam</b>, or <b>Brace</b> overrules CloudCalc's assumption of which elements fall in that category (normally it is based on whehter the element is Vertical, Horizontal, or Skewed).",
                    position: "left"
                }]
            });
            break;
        case 5: // mini-tour
            intro = introJs().setOptions({
                skipLabel: "Exit",
                tooltipPosition: "right",
                steps: [{
                    element: '#tourApp2',
                    intro: 'Welcome to CloudCalc!<br><br>You can get Help wherever you see this symbol: <img src="assets/ico/ico_question_mark.png" alt="Help">.<br><br>' +
                    "Click here for a Tour of the entire application, or...",
                    position: 'bottom'
                }, {
                    element: '#graphHelp',
                    intro: "...click here for Help on Graphics Commands, and modelling graphically...<br><br>" +
                    "...or anywhere else, such as on the Data Entry Sheet.",
                    position: "top"
                }]
            });
            break;
        case 6: // design wiz
            intro = introJs().setOptions({
                skipLabel: "Exit",
                tooltipPosition: "right",
                steps: [{
                    element: '#wizField',
                    intro: "The <b>Design Wizard</b> helps you quickly geenrate3D models of common structural configurations.<br><br>" +
                    "Click on one of the Templates (Portal Frame or Kneebrace) and you will then be asked to fill in dimensions, from which the structure is built parametrically.<br><br>" +
                    "Member Types will be selected based upon Defaults selected in your Configuration.",
                    position: 'bottom'
                }]
            });
            break;
        case 7: // Node Coords
            intro = introJs().setOptions({
                skipLabel: "Exit",
                tooltipPosition: "bottom",
                steps: [{
                    element: '#newNodeCoord',
                    intro: "The <b>Nodal Coordinates Screen</b> is used to define an optional Nodal Grid for placing your elements.<br><br>Clicking <b>+ Add...</b> lets you define a new node location -- remember to <b>SAVE</b> after adding!",
                    position: 'right'
                }, {
                    element: '#nodeEdit',
                    intro: "Existing Nodes may be <b>Edited</b> here (make sure you <b>SAVE</b> after editing), or...",
                    position: 'bottom'
                }, {
                    element: '#nodeDelete',
                    intro: "...they may be <b>Deleted</b> here (note that Nodes may be Deleted in quantity using the Graphics Commands), or...",
                    position: 'bottom'
                }, {
                    element: '#nodeCopy',
                    intro: "...they may be <b>Arrayed</b> (Copied) here (note that Nodes may be Arrayed/Copied quantity using the Graphics Commands)",
                    position: 'bottom'
                }, {
                    element: '#nodeNode',
                    intro: "Define the <b>Node Number</b> associated with this location)",
                    position: 'bottom'
                }, {
                    element: '#nodeCoords',
                    intro: "Specify the <b>Absolute Coordinate</b> locations of the Nodes, relative to Global Axes here.",
                    position: 'bottom'
                }]
            });
            break;
        case 8: // list view
            intro = introJs().setOptions({
                skipLabel: "Exit",
                tooltipPosition: "bottom",
                steps: [{
                    element: '#modelListTable',
                    intro: "Review the <b>Model Elements</b> in List Format.<br><br>Currently this is <b>Read-only Format</b> -- Editing is not available at this time.",
                    position: 'top'
                }]
            });
            break;
        case 9: // load case
            intro = introJs().setOptions({
                skipLabel: "Exit",
                tooltipPosition: "bottom",
                steps: [{
                    element: '#newLoadCase',
                    intro: "Add additonal Load Cases (up to 4 total)",
                    position: 'right'
                }, {
                    element: '#editLoad',
                    intro: "Existing Load Cases may be <b>Edited</b> here (make sure you <b>SAVE</b> after editing), or...",
                    position: 'bottom'
                }, {
                    element: '#delLoad',
                    intro: "...they may be <b>Deleted</b> here.",
                    position: 'bottom'
                }, {
                    element: '#selfLoad',
                    intro: "Enter the Load Case Multiples for <b>Self Weight</b>, <b>Dead Load</b>, <b>Live Load</b>, and <b>Occasional Load</b> in these four fields",
                    position: 'bottom'
                }, {
                    element: '#codeLoad',
                    intro: "Specify the <b>AISC Code</b> (ASD or LRFD) to be used for this Load Case",
                    position: 'bottom'
                }, {
                    element: '#deltaLoad',
                    intro: "Specify whether non-linear <b>P-Delta effects</b> should be evaluated for this Load Case",
                    position: 'bottom'
                }, {
                    element: '#redLoad',
                    intro: "Specify whether <b>Stiffness Reduction</b> should be implemented for elements Contributing to Stability",
                    position: 'bottom'
                }, {
                    element: '#divbyLoad',
                    intro: "Enter the value, if any, by which to divide the factored load results",
                    position: 'bottom'
                }, {
                    element: '#warpLoad',
                    intro: "Specify whether <b>Warping</b> effects should be calculated on open sections subject to torsion",
                    position: 'bottom'
                }]
            });
            break;
        case 10: // input desc
            intro = introJs().setOptions({
                skipLabel: "Exit",
                tooltipPosition: "right",
                steps: [{
                    intro: "Enter Information associated with this Model/Analysis here.",
                    position: 'bottom'
                }]
            });
            break;
    }
    intro.start();
}

var savedScreen;
var nRow1 = -1;
  
var xCirc, yCirc, zCirc = 0.0;
var drawCirc = false;
var activeTab = null;

function dot(a,b) {
    return ( a[0] * b[0] + a[1] * b[1] + a[2] * b[2]);   
}

// globals -- Graphics

var isTextured = false;
var showcaseMode = false;
var lastFloorColor;
var showFloor = true;
var lastDownTarget;
var oldLastDownTarget;
var highLight = true;

var cWidth;  // secondary canvas size
var cHeight;

// var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel"; //FF doesn't recognize mousewheel as of FF3.x

var stickFigure = false;

var canvas = null;
var container1 = null;
var context = null;
var labelCanvas = null;
var labelContext = null;

var selectionSet = [];
var nodSelectionSet = [];

var isNodMenu = false;
var fromFixedNodes = true;

var yLookAngle = Math.PI/8;
var orthoMultiplier = 100.0;

var xCenter = 0.0;
var yCenter = 0.0;
var zCenter = 0.0;

var xmin;
var ymin;
var zmin;
var xmax;
var ymax;
var zmax;

var bigJobEls = 200;
var bigJob = false;

var bigTimer;
var isBigTimer = false;

var oTable1;
var oTable2;
var oTable3;
var oTable4;
var oTable5;
var oTableF;

// Globals -- other

var showShared = false;
var oldlLC;
var jobNotes = "";
var jobNotes1 = "";

var ccStrings = [];
var chinese = false;

var ctrlKeyDown = false;
var onModelingScreen = false;
var quick = false;

var gN;    // magicselect group names
var gNM;
var gNS;
var groupList = ["Column", "Beam", "Brace"];

//Get Browser Info
navigator.sayswho= (function(){
    var ua= navigator.userAgent, tem, 
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    if(M[1]=== 'Chrome'){
        tem= ua.match(/\bOPR\/(\d+)/)
        if(tem!= null) return 'Opera '+tem[1];
    }
    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    return M.join(' ');
})();

function getModalNodes(){

    var from = 0;
    var to = 0;
    var first = true;

    var modalNodeCols = ($('#modalNodeCols').is(':checked'));
    var modalNodeBeams = ($('#modalNodeBeams').is(':checked'));
    var modalNodeBraces = ($('#modalNodeBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalNodeCols && isAColumn(modelElements[i])) ||
        (modalNodeBeams && isABeam(modelElements[i])) ||
        (modalNodeBraces && isABrace(modelElements[i]))) {

            if (first) {
                from = modelElements[i].fromNode;
                to = modelElements[i].toNode;
                first = false;
            }
            else {
                if (from != modelElements[i].fromNode)
                    from = -1.234;
                if (to != modelElements[i].toNode)
                    to = -1.234;
                if (from == -1.234 && to == -1.234)
                    break;
            }
        }
    }

    if (from == -1.234)
        $('#fromM').val('(various)');
    else {
        if (from == 0)
            $('#fromM').val('');
        else
            $('#fromM').val(' ' + from);
    }

    if (to == -1.234)
        $('#toM').val('(various)');
    else {
        if (to == 0)
            $('#toM').val('');
        else
            $('#toM').val(' ' + to);
    }

    //            $('#modalNode').modal('show');
}

function nodeCallback1(){
    //            event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalNodes();

    $('#modalNode').modal('show');

};

var nodeCallback = function(target,element){
    //            event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalNodes();

    $('#modalNode').modal('show');

};

function getModalDimensions(){

    var dx = 0.0;
    var dy = 0.0;
    var dz = 0.0;
    var first = true;

    var modalCols = ($('#modalDimensionCols').is(':checked'));
    var modalBeams = ($('#modalDimensionBeams').is(':checked'));
    var modalBraces = ($('#modalDimensionBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
        (modalBeams && isABeam(modelElements[i])) ||
        (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                dx = modelElements[i].dX;
                dy = modelElements[i].dY;
                dz = modelElements[i].dZ;
                first = false;
            }
            else {
                if (dx != modelElements[i].dX)
                    dx = -101.234;
                if (dy != modelElements[i].dY)
                    dy = -101.234;
                if (dz != modelElements[i].dZ)
                    dz = -101.234;

                if (dx == -101.234 && dy == -101.234 && dz == -101.234 )
                    break;
            }
        }
    }

    if (dx == -101.234)
        $('#dXM').val('(various)');
    else {
        if (dx == 0.0)
            $('#dXM').val('');
        else {
            $('#dXM').val(' ' + dx);
        }
    }

    if (dy == -101.234)
        $('#dYM').val('(various)');
    else {
        if (dy == 0.0)
            $('#dYM').val('');
        else {
            $('#dYM').val(' ' + dy);
        }
    }

    if (dz == -101.234)
        $('#dZM').val('(various)');
    else {
        if (dz == 0.0)
            $('#dZM').val('');
        else {
            $('#dZM').val(' ' + dz);
        }
    }
}

function dimensionCallback1(){
    //            event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalDimensions();

    $('#modalDimension').modal('show');
};

var dimensionCallback = function(target,element){
    //            event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalDimensions();

    $('#modalDimension').modal('show');
};

function getModalMember(){

    var mem = '(various)';
    var first = true;
    var pipOD = "";
    var pipTh = "";

    var modalCols = ($('#modalMemberCols').is(':checked'));
    var modalBeams = ($('#modalMemberBeams').is(':checked'));
    var modalBraces = ($('#modalMemberBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
        (modalBeams && isABeam(modelElements[i])) ||
        (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                mem = modelElements[i].memberType;
                first = false;
                if( mem == "PipeCustom" ) {
                    pipOD = modelElements[i].pipOD;
                    pipTh = modelElements[i].pipTh;
                }
        
            }
            else {
                if (mem != modelElements[i].memberType) {
                    mem = '(various)';
                    break;
                }

                if (pipOD != modelElements[i].pipOD) 
                    pipOD = '(various)';

                if (pipTh != modelElements[i].pipTh) 
                    pipTh = '(various)';
        
            }
        }
    }

    $('#memberTypeM').val(mem);
    if (mem == "PipeCustom") {
        $('#custPipeM').show();
        $('#pipeODM').val(pipOD);
        $('#pipeThM').val(pipTh);
    }
    else { 
        $('#custPipeM').hide(); 
        $('#pipeODM').val(pipOD);
        $('#pipeThM').val(pipTh);
    }
}

function memberCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalMember();

    $('#modalMember').modal('show');
};

var memberCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalMember();

    $('#modalMember').modal('show');
};

function getModalBeta(){

    var beta = 0.0;
    var first = true;

    var modalCols = ($('#modalBetaCols').is(':checked'));
    var modalBeams = ($('#modalBetaBeams').is(':checked'));
    var modalBraces = ($('#modalBetaBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
            (modalBeams && isABeam(modelElements[i])) ||
            (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                beta = modelElements[i].betaAngle;
                first = false;
            }
            else {
                if (beta != modelElements[i].betaAngle) {
                    beta = -101.234;
                    break;
                }
            }
        }
    }

    if (beta == -101.234)
        $('#betaM').val('(various)');
    else
        $('#betaM').val(' ' + beta);
}

function betaCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalBeta();

    $('#modalBeta').modal('show');
};

var betaCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalBeta();

    $('#modalBeta').modal('show');
};

function getModalMaterial(){

    var mat = '(various)';
    var first = true;

    var modalCols = ($('#modalMaterialCols').is(':checked'));
    var modalBeams = ($('#modalMaterialBeams').is(':checked'));
    var modalBraces = ($('#modalMaterialBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
        (modalBeams && isABeam(modelElements[i])) ||
        (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                mat = modelElements[i].material;
                first = false;
            }
            else {
                if (mat != modelElements[i].material) {
                    mat = '(various)';
                    break;
                }
            }
        }
    }

    $('#materialM').val(mat);
}

function materialCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalMaterial();

    $('#modalMaterial').modal('show');
};

var materialCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalMaterial();

    $('#modalMaterial').modal('show');
};

function getModalReleases(){

    var ffx = -1;
    var ffy = -1;
    var ffz = -1;
    var fmx = -1;
    var fmy = -1;
    var fmz = -1;

    var tfx = -1;
    var tfy = -1;
    var tfz = -1;
    var tmx = -1;
    var tmy = -1;
    var tmz = -1;

    var first = true;

    var modalCols = ($('#modalReleaseCols').is(':checked'));
    var modalBeams = ($('#modalReleaseBeams').is(':checked'));
    var modalBraces = ($('#modalReleaseBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
        (modalBeams && isABeam(modelElements[i])) ||
        (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                if( modelElements[i].fromFXMemb )
                    ffx = 1;
                else
                    ffx = 0;
                if( modelElements[i].fromFYMemb )
                    ffy = 1;
                else
                    ffy = 0;
                if( modelElements[i].fromFZMemb )
                    ffz = 1;
                else
                    ffz = 0;
                if( modelElements[i].fromMXMemb )
                    fmx = 1;
                else
                    fmx = 0;
                if( modelElements[i].fromMYMemb )
                    fmy = 1;
                else
                    fmy = 0;
                if( modelElements[i].fromMZMemb )
                    fmz = 1;
                else
                    fmz = 0;

                if( modelElements[i].toFXMemb )
                    tfx = 1;
                else
                    tfx = 0;
                if( modelElements[i].toFYMemb )
                    tfy = 1;
                else
                    tfy = 0;
                if( modelElements[i].toFZMemb )
                    tfz = 1;
                else
                    tfz = 0;
                if( modelElements[i].toMXMemb )
                    tmx = 1;
                else
                    tmx = 0;
                if( modelElements[i].toMYMemb )
                    tmy = 1;
                else
                    tmy = 0;
                if( modelElements[i].toMZMemb )
                    tmz = 1;
                else
                    tmz = 0;

                first = false;
            }
            else {
                if( (modelElements[i].fromFXMemb && (ffx==0)) || (!modelElements[i].fromFXMemb && (ffx==1)) )
                    ffx = -1;
                if( (modelElements[i].fromFYMemb && (ffy==0)) || (!modelElements[i].fromFYMemb && (ffy==1)) )
                    ffy = -1;
                if( (modelElements[i].fromFZMemb && (ffz==0)) || (!modelElements[i].fromFZMemb && (ffz==1)) )
                    ffz = -1;
                if( (modelElements[i].fromMXMemb && (fmx==0)) || (!modelElements[i].fromMXMemb && (fmx==1)) )
                    fmx = -1;
                if( (modelElements[i].fromMYMemb && (fmy==0)) || (!modelElements[i].fromMYMemb && (fmy==1)) )
                    fmy = -1;
                if( (modelElements[i].fromMZMemb && (fmz==0)) || (!modelElements[i].fromMZMemb && (fmz==1)) )
                    fmz = -1;

                if( (modelElements[i].toFXMemb && (tfx==0)) || (!modelElements[i].toFXMemb && (tfx==1)) )
                    tfx = -1;
                if( (modelElements[i].toFYMemb && (tfy==0)) || (!modelElements[i].toFYMemb && (tfy==1)) )
                    tfy = -1;
                if( (modelElements[i].toFZMemb && (tfz==0)) || (!modelElements[i].toFZMemb && (tfz==1)) )
                    tfz = -1;
                if( (modelElements[i].toMXMemb && (tmx==0)) || (!modelElements[i].toMXMemb && (tmx==1)) )
                    tmx = -1;
                if( (modelElements[i].toMYMemb && (tmy==0)) || (!modelElements[i].toMYMemb && (tmy==1)) )
                    tmy = -1;
                if( (modelElements[i].toMZMemb && (tmz==0)) || (!modelElements[i].toMZMemb && (tmz==1)) )
                    tmz = -1;

                if( (ffx==-1) && (ffy==-1) && (ffz==-1) && (fmx==-1) && (fmy==-1) && (fmz==-1) &&
                    (tfx==-1) && (tfy==-1) && (tfz==-1) && (tmx==-1) && (tmy==-1) && (tmz==-1) )
                    break;
            }
        }
    }

    $("#ffx1").text('');
    if( ffx==1 )
        $('#fromFXReleaseM').prop('checked', true);
    else {
        $('#fromFXReleaseM').prop('checked', false);
        if( ffx==-1 )
            $("#ffx1").text(' (various)');
    }

    $("#ffy1").text('');
    if( ffy==1 )
        $('#fromFYReleaseM').prop('checked', true);
    else {
        $('#fromFYReleaseM').prop('checked', false);
        if( ffy==-1 )
            $("#ffy1").text(' (various)');
    }

    $("#ffz1").text('');
    if( ffz==1 )
        $('#fromFZReleaseM').prop('checked', true);
    else {
        $('#fromFZReleaseM').prop('checked', false);
        if( ffz==-1 )
            $("#ffz1").text(' (various)');
    }

    $("#fmx1").text('');
    if( fmx==1 )
        $('#fromMXReleaseM').prop('checked', true);
    else {
        $('#fromMXReleaseM').prop('checked', false);
        if( fmx==-1 )
            $("#fmx1").text(' (various)');
    }

    $("#fmy1").text('');
    if( fmy==1 )
        $('#fromMYReleaseM').prop('checked', true);
    else {
        $('#fromMYReleaseM').prop('checked', false);
        if( fmy==-1 )
            $("#fmy1").text(' (various)');
    }

    $("#fmz1").text('');
    if( fmz==1 )
        $('#fromMZReleaseM').prop('checked', true);
    else {
        $('#fromMZReleaseM').prop('checked', false);
        if( fmz==-1 )
            $("#fmz1").text(' (various)');
    }

    $("#tfx1").text('');
    if( tfx==1 )
        $('#toFXReleaseM').prop('checked', true);
    else {
        $('#toFXReleaseM').prop('checked', false);
        if( tfx==-1 )
            $("#tfx1").text(' (various)');
    }

    $("#tfy1").text('');
    if( tfy==1 )
        $('#toFYReleaseM').prop('checked', true);
    else {
        $('#toFYReleaseM').prop('checked', false);
        if( tfy==-1 )
            $("#tfy1").text(' (various)');
    }

    $("#tfz1").text('');
    if( tfz==1 )
        $('#toFZReleaseM').prop('checked', true);
    else {
        $('#toFZReleaseM').prop('checked', false);
        if( tfz==-1 )
            $("#tfz1").text(' (various)');
    }

    $("#tmx1").text('');
    if( tmx==1 )
        $('#toMXReleaseM').prop('checked', true);
    else {
        $('#toMXReleaseM').prop('checked', false);
        if( tmx==-1 )
            $("#tmx1").text(' (various)');
    }

    $("#tmy1").text('');
    if( tmy==1 )
        $('#toMYReleaseM').prop('checked', true);
    else {
        $('#toMYReleaseM').prop('checked', false);
        if( tmy==-1 )
            $("#tmy1").text(' (various)');
    }

    $("#tmz1").text('');
    if( tmz==1 )
        $('#toMZReleaseM').prop('checked', true);
    else {
        $('#toMZReleaseM').prop('checked', false);
        if( tmz==-1 )
            $("#tmz1").text(' (various)');
    }
}

function relCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalReleases();

    $('#modalReleases').modal('show');
};

var relCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalReleases();

    $('#modalReleases').modal('show');
};

function getModalRestraints(){

    var ffx = -1;
    var ffy = -1;
    var ffz = -1;
    var fmx = -1;
    var fmy = -1;
    var fmz = -1;

    var tfx = -1;
    var tfy = -1;
    var tfz = -1;
    var tmx = -1;
    var tmy = -1;
    var tmz = -1;

    var first = true;

    var modalCols = ($('#modalRestCols').is(':checked'));
    var modalBeams = ($('#modalRestBeams').is(':checked'));
    var modalBraces = ($('#modalRestBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
        (modalBeams && isABeam(modelElements[i])) ||
        (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                if( modelElements[i].fromFXRest )
                    ffx = 1;
                else
                    ffx = 0;
                if( modelElements[i].fromFYRest )
                    ffy = 1;
                else
                    ffy = 0;
                if( modelElements[i].fromFZRest )
                    ffz = 1;
                else
                    ffz = 0;
                if( modelElements[i].fromMXRest )
                    fmx = 1;
                else
                    fmx = 0;
                if( modelElements[i].fromMYRest )
                    fmy = 1;
                else
                    fmy = 0;
                if( modelElements[i].fromMZRest )
                    fmz = 1;
                else
                    fmz = 0;

                if( modelElements[i].toFXRest )
                    tfx = 1;
                else
                    tfx = 0;
                if( modelElements[i].toFYRest )
                    tfy = 1;
                else
                    tfy = 0;
                if( modelElements[i].toFZRest )
                    tfz = 1;
                else
                    tfz = 0;
                if( modelElements[i].toMXRest )
                    tmx = 1;
                else
                    tmx = 0;
                if( modelElements[i].toMYRest )
                    tmy = 1;
                else
                    tmy = 0;
                if( modelElements[i].toMZRest )
                    tmz = 1;
                else
                    tmz = 0;

                first = false;
            }
            else {
                if( (modelElements[i].fromFXRest && (ffx==0)) || (!modelElements[i].fromFXRest && (ffx==1)) )
                    ffx = -1;
                if( (modelElements[i].fromFYRest && (ffy==0)) || (!modelElements[i].fromFYRest && (ffy==1)) )
                    ffy = -1;
                if( (modelElements[i].fromFZRest && (ffz==0)) || (!modelElements[i].fromFZRest && (ffz==1)) )
                    ffz = -1;
                if( (modelElements[i].fromMXRest && (fmx==0)) || (!modelElements[i].fromMXRest && (fmx==1)) )
                    fmx = -1;
                if( (modelElements[i].fromMYRest && (fmy==0)) || (!modelElements[i].fromMYRest && (fmy==1)) )
                    fmy = -1;
                if( (modelElements[i].fromMZRest && (fmz==0)) || (!modelElements[i].fromMZRest && (fmz==1)) )
                    fmz = -1;

                if( (modelElements[i].toFXRest && (tfx==0)) || (!modelElements[i].toFXRest && (tfx==1)) )
                    tfx = -1;
                if( (modelElements[i].toFYRest && (tfy==0)) || (!modelElements[i].toFYRest && (tfy==1)) )
                    tfy = -1;
                if( (modelElements[i].toFZRest && (tfz==0)) || (!modelElements[i].toFZRest && (tfz==1)) )
                    tfz = -1;
                if( (modelElements[i].toMXRest && (tmx==0)) || (!modelElements[i].toMXRest && (tmx==1)) )
                    tmx = -1;
                if( (modelElements[i].toMYRest && (tmy==0)) || (!modelElements[i].toMYRest && (tmy==1)) )
                    tmy = -1;
                if( (modelElements[i].toMZRest && (tmz==0)) || (!modelElements[i].toMZRest && (tmz==1)) )
                    tmz = -1;

                if( (ffx==-1) && (ffy==-1) && (ffz==-1) && (fmx==-1) && (fmy==-1) && (fmz==-1) &&
                    (tfx==-1) && (tfy==-1) && (tfz==-1) && (tmx==-1) && (tmy==-1) && (tmz==-1) )
                    break;
            }
        }
    }

    $("#ffx2").text('');
    if( ffx==1 )
        $('#fromFXRestraintM').prop('checked', true);
    else {
        $('#fromFXRestraintM').prop('checked', false);
        if( ffx==-1 )
            $("#ffx2").text(' (various)');
    }

    $("#ffy2").text('');
    if( ffy==1 )
        $('#fromFYRestraintM').prop('checked', true);
    else {
        $('#fromFYRestraintM').prop('checked', false);
        if( ffy==-1 )
            $("#ffy2").text(' (various)');
    }

    $("#ffz2").text('');
    if( ffz==1 )
        $('#fromFZRestraintM').prop('checked', true);
    else {
        $('#fromFZRestraintM').prop('checked', false);
        if( ffz==-1 )
            $("#ffz2").text(' (various)');
    }

    $("#fmx2").text('');
    if( fmx==1 )
        $('#fromMXRestraintM').prop('checked', true);
    else {
        $('#fromMXRestraintM').prop('checked', false);
        if( fmx==-1 )
            $("#fmx2").text(' (various)');
    }

    $("#fmy2").text('');
    if( fmy==1 )
        $('#fromMYRestraintM').prop('checked', true);
    else {
        $('#fromMYRestraintM').prop('checked', false);
        if( fmy==-1 )
            $("#fmy2").text(' (various)');
    }

    $("#fmz2").text('');
    if( fmz==1 )
        $('#fromMZRestraintM').prop('checked', true);
    else {
        $('#fromMZRestraintM').prop('checked', false);
        if( fmz==-1 )
            $("#fmz2").text(' (various)');
    }

    $("#tfx2").text('');
    if( tfx==1 )
        $('#toFXRestraintM').prop('checked', true);
    else {
        $('#toFXRestraintM').prop('checked', false);
        if( tfx==-1 )
            $("#tfx2").text(' (various)');
    }

    $("#tfy2").text('');
    if( tfy==1 )
        $('#toFYRestraintM').prop('checked', true);
    else {
        $('#toFYRestraintM').prop('checked', false);
        if( tfy==-1 )
            $("#tfy2").text(' (various)');
    }

    $("#tfz2").text('');
    if( tfz==1 )
        $('#toFZRestraintM').prop('checked', true);
    else {
        $('#toFZRestraintM').prop('checked', false);
        if( tfz==-1 )
            $("#tfz2").text(' (various)');
    }

    $("#tmx2").text('');
    if( tmx==1 )
        $('#toMXRestraintM').prop('checked', true);
    else {
        $('#toMXRestraintM').prop('checked', false);
        if( tmx==-1 )
            $("#tmx2").text(' (various)');
    }

    $("#tmy2").text('');
    if( tmy==1 )
        $('#toMYRestraintM').prop('checked', true);
    else {
        $('#toMYRestraintM').prop('checked', false);
        if( tmy==-1 )
            $("#tmy2").text(' (various)');
    }

    $("#tmz2").text('');
    if( tmz==1 )
        $('#toMZRestraintM').prop('checked', true);
    else {
        $('#toMZRestraintM').prop('checked', false);
        if( tmz==-1 )
            $("#tmz2").text(' (various)');
    }
}

function resCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalRestraints();

    $('#modalRestraints').modal('show');
};

var resCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalRestraints();

    $('#modalRestraints').modal('show');
};

function getModalLengths(){

    var lx = -101.234;
    var ly = -101.234;
    var lz = -101.234;
    var kx = -101.234;
    var ky = -101.234;
    var kz = -101.234;
    var cbx = -101.234;
    var cby = -101.234;
    var stable = -1;

    var first = true;

    var modalCols = ($('#modalLenCols').is(':checked'));
    var modalBeams = ($('#modalLenBeams').is(':checked'));
    var modalBraces = ($('#modalLenBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
            (modalBeams && isABeam(modelElements[i])) ||
            (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                lx = modelElements[i].lX;
                ly = modelElements[i].lY;
                lz = modelElements[i].lZ;
                kx = modelElements[i].kX;
                ky = modelElements[i].kY;
                kz = modelElements[i].kZ;
                cbx = modelElements[i].cBZ;
                cby = modelElements[i].cBY;
                if( modelElements[i].stable )
                    stable = 1;
                else
                    stable = 0;

                first = false;
            }
            else {
                if( lx != modelElements[i].lX )
                    lx = -101.234;
                if( ly != modelElements[i].lY )
                    ly = -101.234;
                if( lz != modelElements[i].lZ )
                    lz = -101.234;
                if( kx != modelElements[i].kX )
                    kx = -101.234;
                if( ky != modelElements[i].kY )
                    ky = -101.234;
                if( kz != modelElements[i].kZ )
                    kz = -101.234;
                if( cbx != modelElements[i].cBZ )
                    cbx = -101.234;
                if( cby != modelElements[i].cBY )
                    cby = -101.234;

                if( (modelElements[i].stable && stable == 0) || (!modelElements[i].stable && stable == 1))
                    stable = -1;

                if( (lx == -101.234) && (ly == -101.234) && (lz == -101.234) &&
                    (kx == -101.234) && (ky == -101.234) && (kz == -101.234) &&
                    (cbx == -101.234) && (cby == -101.234) && (stable == -1) )
                    break;
            }
        }
    }

    if (lx == -101.234)
        $('#lXM').val('(various)');
    else {
        if (lx == 0.0)
            $('#lXM').val('');
        else
            $('#lXM').val(' ' + lx);
    }
    if (ly == -101.234)
        $('#lYM').val('(various)');
    else {
        if (ly == 0.0)
            $('#lYM').val('');
        else
            $('#lYM').val(' ' + ly);
    }
    if (lz == -101.234)
        $('#lZM').val('(various)');
    else {
        if (lz == 0.0)
            $('#lZM').val('');
        else
            $('#lZM').val(' ' + lz);
    }

    if (kx == -101.234)
        $('#kXM').val('(various)');
    else {
        if (kx == 0.0)
            $('#kXM').val('');
        else
            $('#kXM').val(' ' + kx);
    }
    if (ky == -101.234)
        $('#kYM').val('(various)');
    else {
        if (ky == 0.0)
            $('#kYM').val('');
        else
            $('#kYM').val(' ' + ky);
    }
    if (kz == -101.234)
        $('#kZM').val('(various)');
    else {
        if (kz == 0.0)
            $('#kZM').val('');
        else
            $('#kZM').val(' ' + kz);
    }

    if (cbx == -101.234)
        $('#cBZM').val('(various)');
    else {
        if (cbx == 0.0)
            $('#cBZM').val('');
        else
            $('#cBZM').val(' ' + cbx);
    }
    if (cby == -101.234)
        $('#cBYM').val('(various)');
    else {
        if (cby == 0.0)
            $('#cBYM').val('');
        else
            $('#cBYM').val(' ' + cby);
    }

    $("#stab").text('');
    if( stable==1 )
        $('#contribStabilityM').prop('checked', true);
    else {
        $('#contribStabilityM').prop('checked', false);
        if( stable==-1 )
            $("#stab").text(' (various)');
    }
}

function lenCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalLengths();

    $('#modalLengths').modal('show');
};

var lenCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalLengths();

    $('#modalLengths').modal('show');
};

function getModalStiffs(){

    var dist = -101.234;
    var iStiff = -101.234;
    var tfa = -1;

    var first = true;

    var modalCols = ($('#modalStiffCols').is(':checked'));
    var modalBeams = ($('#modalStiffBeams').is(':checked'));
    var modalBraces = ($('#modalStiffBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
            (modalBeams && isABeam(modelElements[i])) ||
            (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                dist = modelElements[i].stiffDist;
                iStiff = modelElements[i].stiffI;
                if( modelElements[i].tfaStiff)
                    tfa = 1;
                else
                    tfa = 0;

                first = false;
            }
            else {
                if( dist != modelElements[i].stiffDist )
                    dist = -101.234;
                if( iStiff != modelElements[i].stiffI )
                    iStiff = -101.234;

                if( (modelElements[i].tfaStiff && tfa == 0) || (!modelElements[i].tfaStiff && tfa == 1))
                    tfa = -1;

                if( (dist == -101.234) && (iStiff == -101.234) && (tfa == -1) )
                    break;
            }
        }
    }

    if (dist == -101.234)
        $('#stiffDistM').val('(various)');
    else {
        if (dist == 0.0)
            $('#stiffDistM').val('');
        else
            $('#stiffDistM').val(' ' + dist);
    }
    if (iStiff == -101.234)
        $('#stiffIM').val('(various)');
    else {
        if (iStiff == 0.0)
            $('#stiffIM').val('');
        else
            $('#stiffIM').val(' ' + iStiff);
    }

    $("#tfal").text('');
    if( tfa==1 )
        $('#tfaStiffM').prop('checked', true);
    else {
        $('#tfaStiffM').prop('checked', false);
        if( tfa==-1 )
            $("#tfal").text(' (various)');
    }
}

function stiffCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalStiffs();

    $('#modalStiff').modal('show');
};

var stiffCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    getModalStiffs();

    $('#modalStiff').modal('show');
};

function getModalUnifDead(){

    var ux = -101.234;
    var uy = -101.234;
    var uz = -101.234;

    var first = true;

    var modalCols = ($('#modalUnifCols').is(':checked'));
    var modalBeams = ($('#modalUnifBeams').is(':checked'));
    var modalBraces = ($('#modalUnifBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
            (modalBeams && isABeam(modelElements[i])) ||
            (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                ux = modelElements[i].uX;
                uy = modelElements[i].uY;
                uz = modelElements[i].uZ;

                first = false;
            }
            else {
                if( ux != modelElements[i].uX )
                    ux = -101.234;
                if( uy != modelElements[i].uY )
                    uy = -101.234;
                if( uz != modelElements[i].uZ )
                    uz = -101.234;

                if( (ux == -101.234) && (uy == -101.234) && (uz == -101.234) )
                    break;
            }
        }
    }

    if (ux == -101.234)
        $('#uXM').val('(various)');
    else {
        if (ux == 0.0)
            $('#uXM').val('');
        else
            $('#uXM').val(' ' + ux);
    }
    if (uy == -101.234)
        $('#uYM').val('(various)');
    else {
        if (uy == 0.0)
            $('#uYM').val('');
        else
            $('#uYM').val(' ' + uy);
    }
    if (uz == -101.234)
        $('#uZM').val('(various)');
    else {
        if (uz == 0.0)
            $('#uZM').val('');
        else
            $('#uZM').val(' ' + uz);
    }
}

function unifDeadCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalUnifDead();

    $('#modalUniformDead').modal('show');
};

var unifDeadCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalUnifDead();

    $('#modalUniformDead').modal('show');
};

function getModalConcDead(){

    var ffx = -101.234;
    var ffy = -101.234;
    var ffz = -101.234;
    var fmx = -101.234;
    var fmy = -101.234;
    var fmz = -101.234;
    var tfx = -101.234;
    var tfy = -101.234;
    var tfz = -101.234;
    var tmx = -101.234;
    var tmy = -101.234;
    var tmz = -101.234;

    var first = true;

    var modalCols = ($('#modalConcCols').is(':checked'));
    var modalBeams = ($('#modalConcBeams').is(':checked'));
    var modalBraces = ($('#modalConcBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
            (modalBeams && isABeam(modelElements[i])) ||
            (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                ffx = modelElements[i].fromFXLoad;
                ffy = modelElements[i].fromFYLoad;
                ffz = modelElements[i].fromFZLoad;
                fmx = modelElements[i].fromMXLoad;
                fmy = modelElements[i].fromMYLoad;
                fmz = modelElements[i].fromMZLoad;

                tfx = modelElements[i].toFXLoad;
                tfy = modelElements[i].toFYLoad;
                tfz = modelElements[i].toFZLoad;
                tmx = modelElements[i].toMXLoad;
                tmy = modelElements[i].toMYLoad;
                tmz = modelElements[i].toMZLoad;

                first = false;
            }
            else {
                if( ffx != modelElements[i].fromFXLoad )
                    ffx = -101.234;
                if( ffy != modelElements[i].fromFYLoad )
                    ffy = -101.234;
                if( ffz != modelElements[i].fromFZLoad )
                    ffz = -101.234;
                if( fmx != modelElements[i].fromMXLoad )
                    fmx = -101.234;
                if( fmy != modelElements[i].fromMYLoad )
                    fmy = -101.234;
                if( fmz != modelElements[i].fromMZLoad )
                    fmz = -101.234;

                if( tfx != modelElements[i].toFXLoad )
                    tfx = -101.234;
                if( tfy != modelElements[i].toFYLoad )
                    tfy = -101.234;
                if( tfz != modelElements[i].toFZLoad )
                    tfz = -101.234;
                if( tmx != modelElements[i].toMXLoad )
                    tmx = -101.234;
                if( tmy != modelElements[i].toMYLoad )
                    tmy = -101.234;
                if( tmz != modelElements[i].toMZLoad )
                    tmz = -101.234;

                if( (ffx == -101.234) && (ffy == -101.234) && (ffz == -101.234) &&
                    (fmx == -101.234) && (fmy == -101.234) && (fmz == -101.234) &&
                    (tfx == -101.234) && (tfy == -101.234) && (tfz == -101.234) &&
                    (tmx == -101.234) && (tmy == -101.234) && (tmz == -101.234) )
                    break;
            }
        }
    }

    if (ffx == -101.234)
        $('#fromFXLoadM').val('(various)');
    else {
        if (ffx == 0.0)
            $('#fromFXLoadM').val('');
        else
            $('#fromFXLoadM').val(' ' + ffx);
    }
    if (ffy == -101.234)
        $('#fromFYLoadM').val('(various)');
    else {
        if (ffy == 0.0)
            $('#fromFYLoadM').val('');
        else
            $('#fromFYLoadM').val(' ' + ffy);
    }
    if (ffz == -101.234)
        $('#fromFZLoadM').val('(various)');
    else {
        if (ffz == 0.0)
            $('#fromFZLoadM').val('');
        else
            $('#fromFZLoadM').val(' ' + ffz);
    }
    if (fmx == -101.234)
        $('#fromMXLoadM').val('(various)');
    else {
        if (fmx == 0.0)
            $('#fromMXLoadM').val('');
        else
            $('#fromMXLoadM').val(' ' + fmx);
    }
    if (fmy == -101.234)
        $('#fromMYLoadM').val('(various)');
    else {
        if (fmy == 0.0)
            $('#fromMYLoadM').val('');
        else
            $('#fromMYLoadM').val(' ' + fmy);
    }
    if (fmz == -101.234)
        $('#fromMZLoadM').val('(various)');
    else {
        if (fmz == 0.0)
            $('#fromMZLoadM').val('');
        else
            $('#fromMZLoadM').val(' ' + fmz);
    }

    if (tfx == -101.234)
        $('#toFXLoadM').val('(various)');
    else {
        if (tfx == 0.0)
            $('#toFXLoadM').val('');
        else
            $('#toFXLoadM').val(' ' + tfx);
    }
    if (tfy == -101.234)
        $('#toFYLoadM').val('(various)');
    else {
        if (tfy == 0.0)
            $('#toFYLoadM').val('');
        else
            $('#toFYLoadM').val(' ' + tfy);
    }
    if (tfz == -101.234)
        $('#toFZLoadM').val('(various)');
    else {
        if (tfz == 0.0)
            $('#toFZLoadM').val('');
        else
            $('#toFZLoadM').val(' ' + tfz);
    }
    if (tmx == -101.234)
        $('#toMXLoadM').val('(various)');
    else {
        if (tmx == 0.0)
            $('#toMXLoadM').val('');
        else
            $('#toMXLoadM').val(' ' + tmx);
    }
    if (fmy == -101.234)
        $('#toMYLoadM').val('(various)');
    else {
        if (tmy == 0.0)
            $('#toMYLoadM').val('');
        else
            $('#toMYLoadM').val(' ' + tmy);
    }
    if (tmz == -101.234)
        $('#toMZLoadM').val('(various)');
    else {
        if (tmz == 0.0)
            $('#toMZLoadM').val('');
        else
            $('#toMZLoadM').val(' ' + tmz);
    }
}

function concDeadCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalConcDead();

    $('#modalConcDead').modal('show');
};

var concDeadCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalConcDead();

    $('#modalConcDead').modal('show');
};

function getModalUnifLive(){

    var ux = -101.234;
    var uy = -101.234;
    var uz = -101.234;

    var first = true;

    var modalCols = ($('#modalUnifLCols').is(':checked'));
    var modalBeams = ($('#modalUnifLBeams').is(':checked'));
    var modalBraces = ($('#modalUnifLBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
            (modalBeams && isABeam(modelElements[i])) ||
            (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                ux = modelElements[i].uXL;
                uy = modelElements[i].uYL;
                uz = modelElements[i].uZL;

                first = false;
            }
            else {
                if( ux != modelElements[i].uXL )
                    ux = -101.234;
                if( uy != modelElements[i].uYL )
                    uy = -101.234;
                if( uz != modelElements[i].uZL )
                    uz = -101.234;

                if( (ux == -101.234) && (uy == -101.234) && (uz == -101.234) )
                    break;
            }
        }
    }

    if (ux == -101.234)
        $('#uXML').val('(various)');
    else {
        if (ux == 0.0)
            $('#uXML').val('');
        else
            $('#uXML').val(' ' + ux);
    }
    if (uy == -101.234)
        $('#uYML').val('(various)');
    else {
        if (uy == 0.0)
            $('#uYML').val('');
        else
            $('#uYML').val(' ' + uy);
    }
    if (uz == -101.234)
        $('#uZML').val('(various)');
    else {
        if (uz == 0.0)
            $('#uZML').val('');
        else
            $('#uZML').val(' ' + uz);
    }
}

function unifLiveCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalUnifLive();

    $('#modalUniformLive').modal('show');
};

var unifLiveCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalUnifLive();

    $('#modalUniformLive').modal('show');
};

function getModalConcLive(){

    var ffx = -101.234;
    var ffy = -101.234;
    var ffz = -101.234;
    var fmx = -101.234;
    var fmy = -101.234;
    var fmz = -101.234;
    var tfx = -101.234;
    var tfy = -101.234;
    var tfz = -101.234;
    var tmx = -101.234;
    var tmy = -101.234;
    var tmz = -101.234;

    var first = true;

    var modalCols = ($('#modalConcLCols').is(':checked'));
    var modalBeams = ($('#modalConcLBeams').is(':checked'));
    var modalBraces = ($('#modalConcLBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
            (modalBeams && isABeam(modelElements[i])) ||
            (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                ffx = modelElements[i].fromFXLoadL;
                ffy = modelElements[i].fromFYLoadL;
                ffz = modelElements[i].fromFZLoadL;
                fmx = modelElements[i].fromMXLoadL;
                fmy = modelElements[i].fromMYLoadL;
                fmz = modelElements[i].fromMZLoadL;

                tfx = modelElements[i].toFXLoadL;
                tfy = modelElements[i].toFYLoadL;
                tfz = modelElements[i].toFZLoadL;
                tmx = modelElements[i].toMXLoadL;
                tmy = modelElements[i].toMYLoadL;
                tmz = modelElements[i].toMZLoadL;

                first = false;
            }
            else {
                if( ffx != modelElements[i].fromFXLoadL )
                    ffx = -101.234;
                if( ffy != modelElements[i].fromFYLoadL )
                    ffy = -101.234;
                if( ffz != modelElements[i].fromFZLoadL )
                    ffz = -101.234;
                if( fmx != modelElements[i].fromMXLoadL )
                    fmx = -101.234;
                if( fmy != modelElements[i].fromMYLoadL )
                    fmy = -101.234;
                if( fmz != modelElements[i].fromMZLoadL )
                    fmz = -101.234;

                if( tfx != modelElements[i].toFXLoadL )
                    tfx = -101.234;
                if( tfy != modelElements[i].toFYLoadL )
                    tfy = -101.234;
                if( tfz != modelElements[i].toFZLoadL )
                    tfz = -101.234;
                if( tmx != modelElements[i].toMXLoadL )
                    tmx = -101.234;
                if( tmy != modelElements[i].toMYLoadL )
                    tmy = -101.234;
                if( tmz != modelElements[i].toMZLoadL )
                    tmz = -101.234;

                if( (ffx == -101.234) && (ffy == -101.234) && (ffz == -101.234) &&
                    (fmx == -101.234) && (fmy == -101.234) && (fmz == -101.234) &&
                    (tfx == -101.234) && (tfy == -101.234) && (tfz == -101.234) &&
                    (tmx == -101.234) && (tmy == -101.234) && (tmz == -101.234) )
                    break;
            }
        }
    }

    if (ffx == -101.234)
        $('#fromFXLoadML').val('(various)');
    else {
        if (ffx == 0.0)
            $('#fromFXLoadML').val('');
        else
            $('#fromFXLoadML').val(' ' + ffx);
    }
    if (ffy == -101.234)
        $('#fromFYLoadML').val('(various)');
    else {
        if (ffy == 0.0)
            $('#fromFYLoadML').val('');
        else
            $('#fromFYLoadML').val(' ' + ffy);
    }
    if (ffz == -101.234)
        $('#fromFZLoadML').val('(various)');
    else {
        if (ffz == 0.0)
            $('#fromFZLoadML').val('');
        else
            $('#fromFZLoadML').val(' ' + ffz);
    }
    if (fmx == -101.234)
        $('#fromMXLoadML').val('(various)');
    else {
        if (fmx == 0.0)
            $('#fromMXLoadML').val('');
        else
            $('#fromMXLoadML').val(' ' + fmx);
    }
    if (fmy == -101.234)
        $('#fromMYLoadML').val('(various)');
    else {
        if (fmy == 0.0)
            $('#fromMYLoadML').val('');
        else
            $('#fromMYLoadML').val(' ' + fmy);
    }
    if (fmz == -101.234)
        $('#fromMZLoadML').val('(various)');
    else {
        if (fmz == 0.0)
            $('#fromMZLoadML').val('');
        else
            $('#fromMZLoadML').val(' ' + fmz);
    }

    if (tfx == -101.234)
        $('#toFXLoadML').val('(various)');
    else {
        if (tfx == 0.0)
            $('#toFXLoadML').val('');
        else
            $('#toFXLoadML').val(' ' + tfx);
    }
    if (tfy == -101.234)
        $('#toFYLoadML').val('(various)');
    else {
        if (tfy == 0.0)
            $('#toFYLoadML').val('');
        else
            $('#toFYLoadML').val(' ' + tfy);
    }
    if (tfz == -101.234)
        $('#toFZLoadML').val('(various)');
    else {
        if (tfz == 0.0)
            $('#toFZLoadML').val('');
        else
            $('#toFZLoadML').val(' ' + tfz);
    }
    if (tmx == -101.234)
        $('#toMXLoadML').val('(various)');
    else {
        if (tmx == 0.0)
            $('#toMXLoadML').val('');
        else
            $('#toMXLoadML').val(' ' + tmx);
    }
    if (fmy == -101.234)
        $('#toMYLoadML').val('(various)');
    else {
        if (tmy == 0.0)
            $('#toMYLoadML').val('');
        else
            $('#toMYLoadML').val(' ' + tmy);
    }
    if (tmz == -101.234)
        $('#toMZLoadML').val('(various)');
    else {
        if (tmz == 0.0)
            $('#toMZLoadML').val('');
        else
            $('#toMZLoadML').val(' ' + tmz);
    }
}

function concLiveCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalConcLive();

    $('#modalConcLive').modal('show');
};

var concLiveCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalConcLive();

    $('#modalConcLive').modal('show');
};

function getModalUnifOcc(){

    var ux = -101.234;
    var uy = -101.234;
    var uz = -101.234;

    var first = true;

    var modalCols = ($('#modalUnifOCols').is(':checked'));
    var modalBeams = ($('#modalUnifOBeams').is(':checked'));
    var modalBraces = ($('#modalUnifOBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
            (modalBeams && isABeam(modelElements[i])) ||
            (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                ux = modelElements[i].uXO;
                uy = modelElements[i].uYO;
                uz = modelElements[i].uZO;

                first = false;
            }
            else {
                if( ux != modelElements[i].uXO )
                    ux = -101.234;
                if( uy != modelElements[i].uYO )
                    uy = -101.234;
                if( uz != modelElements[i].uZO )
                    uz = -101.234;

                if( (ux == -101.234) && (uy == -101.234) && (uz == -101.234) )
                    break;
            }
        }
    }

    if (ux == -101.234)
        $('#uXMO').val('(various)');
    else {
        if (ux == 0.0)
            $('#uXMO').val('');
        else
            $('#uXMO').val(' ' + ux);
    }
    if (uy == -101.234)
        $('#uYMO').val('(various)');
    else {
        if (uy == 0.0)
            $('#uYMO').val('');
        else
            $('#uYMO').val(' ' + uy);
    }
    if (uz == -101.234)
        $('#uZMO').val('(various)');
    else {
        if (uz == 0.0)
            $('#uZMO').val('');
        else
            $('#uZMO').val(' ' + uz);
    }
}

function unifOccCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalUnifOcc();

    $('#modalUniformOcc').modal('show');
};

var unifOccCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalUnifOcc();

    $('#modalUniformOcc').modal('show');
};

function getModalConcOcc(){

    var ffx = -101.234;
    var ffy = -101.234;
    var ffz = -101.234;
    var fmx = -101.234;
    var fmy = -101.234;
    var fmz = -101.234;
    var tfx = -101.234;
    var tfy = -101.234;
    var tfz = -101.234;
    var tmx = -101.234;
    var tmy = -101.234;
    var tmz = -101.234;

    var first = true;

    var modalCols = ($('#modalConcOCols').is(':checked'));
    var modalBeams = ($('#modalConcOBeams').is(':checked'));
    var modalBraces = ($('#modalConcOBraces').is(':checked'));

    for( var ii=0; ii<selectionSet.length; ii++ ) {
        i = selectionSet[ii];

        if ((modalCols && isAColumn(modelElements[i])) ||
            (modalBeams && isABeam(modelElements[i])) ||
            (modalBraces && isABrace(modelElements[i]))) {

            if (first) {
                ffx = modelElements[i].fromFXLoadO;
                ffy = modelElements[i].fromFYLoadO;
                ffz = modelElements[i].fromFZLoadO;
                fmx = modelElements[i].fromMXLoadO;
                fmy = modelElements[i].fromMYLoadO;
                fmz = modelElements[i].fromMZLoadO;

                tfx = modelElements[i].toFXLoadO;
                tfy = modelElements[i].toFYLoadO;
                tfz = modelElements[i].toFZLoadO;
                tmx = modelElements[i].toMXLoadO;
                tmy = modelElements[i].toMYLoadO;
                tmz = modelElements[i].toMZLoadO;

                first = false;
            }
            else {
                if( ffx != modelElements[i].fromFXLoadO )
                    ffx = -101.234;
                if( ffy != modelElements[i].fromFYLoadO )
                    ffy = -101.234;
                if( ffz != modelElements[i].fromFZLoadO )
                    ffz = -101.234;
                if( fmx != modelElements[i].fromMXLoadO )
                    fmx = -101.234;
                if( fmy != modelElements[i].fromMYLoadO )
                    fmy = -101.234;
                if( fmz != modelElements[i].fromMZLoadO )
                    fmz = -101.234;

                if( tfx != modelElements[i].toFXLoadO )
                    tfx = -101.234;
                if( tfy != modelElements[i].toFYLoadO )
                    tfy = -101.234;
                if( tfz != modelElements[i].toFZLoadO )
                    tfz = -101.234;
                if( tmx != modelElements[i].toMXLoadO )
                    tmx = -101.234;
                if( tmy != modelElements[i].toMYLoadO )
                    tmy = -101.234;
                if( tmz != modelElements[i].toMZLoadO )
                    tmz = -101.234;

                if( (ffx == -101.234) && (ffy == -101.234) && (ffz == -101.234) &&
                    (fmx == -101.234) && (fmy == -101.234) && (fmz == -101.234) &&
                    (tfx == -101.234) && (tfy == -101.234) && (tfz == -101.234) &&
                    (tmx == -101.234) && (tmy == -101.234) && (tmz == -101.234) )
                    break;
            }
        }
    }

    if (ffx == -101.234)
        $('#fromFXLoadMO').val('(various)');
    else {
        if (ffx == 0.0)
            $('#fromFXLoadMO').val('');
        else
            $('#fromFXLoadMO').val(' ' + ffx);
    }
    if (ffy == -101.234)
        $('#fromFYLoadMO').val('(various)');
    else {
        if (ffy == 0.0)
            $('#fromFYLoadMO').val('');
        else
            $('#fromFYLoadMO').val(' ' + ffy);
    }
    if (ffz == -101.234)
        $('#fromFZLoadMO').val('(various)');
    else {
        if (ffz == 0.0)
            $('#fromFZLoadMO').val('');
        else
            $('#fromFZLoadMO').val(' ' + ffz);
    }
    if (fmx == -101.234)
        $('#fromMXLoadMO').val('(various)');
    else {
        if (fmx == 0.0)
            $('#fromMXLoadMO').val('');
        else
            $('#fromMXLoadMO').val(' ' + fmx);
    }
    if (fmy == -101.234)
        $('#fromMYLoadMO').val('(various)');
    else {
        if (fmy == 0.0)
            $('#fromMYLoadMO').val('');
        else
            $('#fromMYLoadMO').val(' ' + fmy);
    }
    if (fmz == -101.234)
        $('#fromMZLoadMO').val('(various)');
    else {
        if (fmz == 0.0)
            $('#fromMZLoadMO').val('');
        else
            $('#fromMZLoadMO').val(' ' + fmz);
    }

    if (tfx == -101.234)
        $('#toFXLoadMO').val('(various)');
    else {
        if (tfx == 0.0)
            $('#toFXLoadMO').val('');
        else
            $('#toFXLoadMO').val(' ' + tfx);
    }
    if (tfy == -101.234)
        $('#toFYLoadMO').val('(various)');
    else {
        if (tfy == 0.0)
            $('#toFYLoadMO').val('');
        else
            $('#toFYLoadMO').val(' ' + tfy);
    }
    if (tfz == -101.234)
        $('#toFZLoadMO').val('(various)');
    else {
        if (tfz == 0.0)
            $('#toFZLoadMO').val('');
        else
            $('#toFZLoadMO').val(' ' + tfz);
    }
    if (tmx == -101.234)
        $('#toMXLoadMO').val('(various)');
    else {
        if (tmx == 0.0)
            $('#toMXLoadMO').val('');
        else
            $('#toMXLoadMO').val(' ' + tmx);
    }
    if (fmy == -101.234)
        $('#toMYLoadMO').val('(various)');
    else {
        if (tmy == 0.0)
            $('#toMYLoadMO').val('');
        else
            $('#toMYLoadMO').val(' ' + tmy);
    }
    if (tmz == -101.234)
        $('#toMZLoadMO').val('(various)');
    else {
        if (tmz == 0.0)
            $('#toMZLoadMO').val('');
        else
            $('#toMZLoadMO').val(' ' + tmz);
    }
}

function elemMenu() {
    isNodMenu = false;
    if( !isMobile ) {
        $('#modelContainer').contextMenu('enable','nodes');
        $('#modelContainer').contextMenu('enable','dimensions');
        $('#modelContainer').contextMenu('enable','member');
        $('#modelContainer').contextMenu('enable','betaAngle');
        $('#modelContainer').contextMenu('enable','s1');
        $('#modelContainer').contextMenu('enable','material');
        $('#modelContainer').contextMenu('enable','memberReleases');
        $('#modelContainer').contextMenu('enable','restraints');
        $('#modelContainer').contextMenu('enable','lengths');
        $('#modelContainer').contextMenu('enable','stiff');
        $('#modelContainer').contextMenu('enable','s2');
        $('#modelContainer').contextMenu('enable','uniform');
        $('#modelContainer').contextMenu('enable','concentrated');
        $('#modelContainer').contextMenu('enable','s2a');
        $('#modelContainer').contextMenu('enable','piping');
        $('#modelContainer').contextMenu('enable','group');
        $('#modelContainer').contextMenu('enable','select');
        $('#modelContainer').contextMenu('enable','s3');
        $('#modelContainer').contextMenu('disable','renumber');
        $('#modelContainer').contextMenu('disable','move');
        $('#modelContainer').contextMenu('enable','hide');
        $('#modelContainer').contextMenu('enable','del');
        $('#modelContainer').contextMenu('enable','brek');
        $('#modelContainer').contextMenu('enable','copy');
    }
    $('#graphNodes').show();
    $('#graphDims').show();
    $('#graphMems').show();
    $('#graphBeta').show();
    $('#graphMats').show();
    $('#graphRels').show();
    $('#graphRests').show();
    $('#graphCodes').show();
    $('#graphStiff').show();
    $('#graphUnif').show();
    $('#graphConc').show();
    $('#graphPiping').show();
    $('#graphGroup').show();
    $('#graphSelGroup').show();
    $('#graphRenum').hide();
    $('#graphMove').hide();
    $('#graphDel').show();
    $('#graphBrek').show();
    $('#graphCopy').show();
    $('#graphHide').show();
    $('#graphS1').show();
    $('#graphS2').show();
    $('#graphS3').show();
    $('#graphS4').show();
  
    if (!editRights) {
        if( !isMobile ) {
            //              $('#modelContainer').contextMenu('disable','move');
            $('#modelContainer').contextMenu('disable','del');
            $('#modelContainer').contextMenu('disable','brek');
            $('#modelContainer').contextMenu('disable','copy');
        }
        //              $('#graphMove').hide();
        $('#graphDel').hide();
        $('#graphBrek').hide();
        $('#graphCopy').hide();
    }
}

function nodMenu() {
    isNodMenu = true;
    if( !isMobile ) {
        $('#modelContainer').contextMenu('disable','nodes');
        $('#modelContainer').contextMenu('disable','dimensions');
        $('#modelContainer').contextMenu('disable','member');
        $('#modelContainer').contextMenu('disable','betaAngle');
        $('#modelContainer').contextMenu('disable','s1');
        $('#modelContainer').contextMenu('disable','material');
        $('#modelContainer').contextMenu('disable','memberReleases');
        $('#modelContainer').contextMenu('disable','restraints');
        $('#modelContainer').contextMenu('disable','lengths');
        $('#modelContainer').contextMenu('disable','stiff');
        $('#modelContainer').contextMenu('disable','s2');
        $('#modelContainer').contextMenu('disable','uniform');
        $('#modelContainer').contextMenu('disable','concentrated');
        $('#modelContainer').contextMenu('disable','s2a');
        $('#modelContainer').contextMenu('disable','piping');
        $('#modelContainer').contextMenu('disable','group');
        $('#modelContainer').contextMenu('disable','select');
        $('#modelContainer').contextMenu('disable','s3');
        $('#modelContainer').contextMenu('enable','renumber');
        $('#modelContainer').contextMenu('enable','move');
        $('#modelContainer').contextMenu('disable','hide');
        $('#modelContainer').contextMenu('enable','del');
        $('#modelContainer').contextMenu('disable','brek');
        $('#modelContainer').contextMenu('enable','copy');
    }
    $('#graphNodes').hide();
    $('#graphDims').hide();
    $('#graphMems').hide();
    $('#graphBeta').hide();
    $('#graphMats').hide();
    $('#graphRels').hide();
    $('#graphRests').hide();
    $('#graphCodes').hide();
    $('#graphStiff').hide();
    $('#graphUnif').hide();
    $('#graphConc').hide();
    $('#graphPiping').hide();
    $('#graphGroup').hide();
    $('#graphSelGroup').hide();
    $('#graphRenum').show();
    $('#graphMove').show();
    $('#graphDel').hide();
    $('#graphBrek').hide();
    $('#graphCopy').hide();
    $('#graphHide').hide();
    $('#graphS1').hide();
    $('#graphS2').hide();
    $('#graphS3').hide();
    $('#graphS4').hide();
    if (!editRights) {
        if( !isMobile ) {
            $('#modelContainer').contextMenu('disable','move');
            $('#modelContainer').contextMenu('disable','del');
            //              $('#modelContainer').contextMenu('disable','brek');
            $('#modelContainer').contextMenu('disable','copy');
        }
        $('#graphMove').hide();
        $('#graphDel').hide();
        //              $('#graphBrek').hide();
        $('#graphCopy').hide();
    }
}

function concOccCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalConcOcc();

    $('#modalConcOcc').modal('show');
};

var concOccCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalConcOcc();

    $('#modalConcOcc').modal('show');
};

function getModalPiping(){

    var first = true;
    var press = 0.0;
    var fluid = 0.0;
  
    var modalPipingCols = ($('#modalPipingCols').is(':checked'));
    var modalPipingBeams = ($('#modalPipingBeams').is(':checked'));
    var modalPipingBraces = ($('#modalPipingBraces').is(':checked'));
  
    for (var ii = 0; ii < selectionSet.length; ii++) {
        i = selectionSet[ii];
    
        if ((modalPipingCols && isAColumn(modelElements[i])) ||
        (modalPipingBeams && isABeam(modelElements[i])) ||
        (modalPipingBraces && isABrace(modelElements[i]))) {
    
            if (first) {
                press = modelElements[i].pressure;
                fluid = modelElements[i].fluid;
                first = false;
            }
            else {
                if (press != modelElements[i].pressure) 
                    press = -101.234;
                if (fluid != modelElements[i].fluid)
                    fluid = -101.234;

                if (press == -101.234 && fluid == -101.234 )
                    break;
            }
        }
    }

    if (press == -101.234)
        $('#pressureLoadM').val('(various)');
    else {
        if (press == 0.0)
            $('#pressureLoadM').val('');
        else {
            $('#pressureLoadM').val(' ' + press);
        }
    }

    if (fluid == -101.234)
        $('#fluidLoadM').val('(various)');
    else {
        if (fluid == 0.0)
            $('#fluidLoadM').val('');
        else {
            $('#fluidLoadM').val(' ' + fluid);
        }
    }
}

function getModalGroups(){

    var first = true;
    var gp = "";
  
    var modalGroupNameCols = ($('#modalGroupNameCols').is(':checked'));
    var modalGroupNameBeams = ($('#modalGroupNameBeams').is(':checked'));
    var modalGroupNameBraces = ($('#modalGroupNameBraces').is(':checked'));
  
    for (var ii = 0; ii < selectionSet.length; ii++) {
        i = selectionSet[ii];
    
        if ((modalGroupNameCols && isAColumn(modelElements[i])) ||
        (modalGroupNameBeams && isABeam(modelElements[i])) ||
        (modalGroupNameBraces && isABrace(modelElements[i]))) {
    
            if (first) {
                gp = modelElements[i].group;
                first = false;
            }
            else {
                if (gp != modelElements[i].group) {
                    gp = "(various)";
                    break;
                }
            }
        }
    }
  
    gNM.clear();
    if (gp) {
        if (gp == "(various)") 
            gNM.addToSelection({"id": gp, "name": gp}, true)
        else {
            var gp1 = JSON.parse(gp);
            gNM.addToSelection(gp1,true)
        }
    }
}

function pipingCallback1(){
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalPiping();

    $('#modalPiping').modal('show');
};

var pipingCallback = function(target,element){
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalPiping();

    $('#modalPiping').modal('show');
};

function groupCallback1(){
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalGroups();

    $('#modalGroupNames').modal('show');
};

var groupCallback = function(target,element){
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    getModalGroups();

    $('#modalGroupNames').modal('show');
};

function selectCallback1(){
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    $('#modalGroupSelect').modal('show');
};

var selectCallback = function(target,element){
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;

    $('#modalGroupSelect').modal('show');
};

function hideCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    $('#modalHide').modal('show');
};


var hideCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    $('#modalHide').modal('show');
};


function delCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    if (isNodMenu)
        $('#modalNodDel').modal('show');
    else
        $('#modalDel').modal('show');
};

var delCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    if (isNodMenu)
        $('#modalNodDel').modal('show');
    else
        $('#modalDel').modal('show');
};

function renumberCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    
    if (nodSelectionSet.length == 0) 
        $('#renumM').val('(None selected)');
    else {
        if (nodSelectionSet.length == 1) 
            $('#renumM').val(nodSelectionSet[0]);
        else 
            $('#renumM').val('(various)');
    }
    $('#modalRenumber').modal('show');
};

var renumberCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    
    if (nodSelectionSet.length == 0) 
        $('#renumM').val('(None selected)');
    else {
        if (nodSelectionSet.length == 1) 
            $('#renumM').val(nodSelectionSet[0]);
        else 
            $('#renumM').val('(various)');
    }
    $('#modalRenumber').modal('show');
};

function moveCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    
    $('#modalMove').modal('show');
};

var moveCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    
    $('#modalMove').modal('show');
};

function copyCallback1(){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    if (isNodMenu) {
        fromFixedNodes = false;
        $('#nodeDupScreen').modal('show');
    }
    else
        $('#modalCopy').modal('show');
};

var copyCallback = function(target,element){
    //              event.preventDefault();
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    if (isNodMenu) {
        fromFixedNodes = false;
        $('#nodeDupScreen').modal('show');
    }
    else
        $('#modalCopy').modal('show');
};

function breakCallback1(){
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    $('#modalBreak').modal('show');
};

var breakCallback = function(target,element){
    oldLastDownTarget = lastDownTarget;
    lastDownTarget = null;
    $('#modalBreak').modal('show');
};

var menu = {};
menu['nodes']       = { text:'Nodes',click:nodeCallback};
menu['dimensions']    = { text:'Dimensions',click:dimensionCallback};
menu['member']      = {text:'Member',click:memberCallback
    /*                children:{
              W:{text:'W',
                  children:{
                    W4X13:{text:'W4X13',click:memberCallback},
                    W18X35:{text:'W18X35',click:memberCallback}
                  }
              },
              Pipe:{text:'Pipe',
                  children:{
                    Pipe4STD:{text:'Pipe4STD',click:callback},
                    Pipe8STD:{text:'Pipe8STD',click:callback}
                  }
              }
          }  */
};
menu['betaAngle']       = {text:'Beta Angle',click:betaCallback 
};
menu.s1       = '---';
menu.material       = {  text:'Material',click:materialCallback};
menu.memberReleases       = {text:'Member Releases',click:relCallback};
menu.restraints       = {text:'Restraints',click:resCallback};
menu.lengths      = {text:'Code Considerations',click:lenCallback};
menu.stiff      = {text:'Stiffeners',click:stiffCallback};
menu.s2       = '---';
menu.uniform = {
    text: 'Uniform',
    children: {
        uniformDead: {
            text: 'Dead',
            click: unifDeadCallback
        },
        uniformLive: {
            text: 'Live',
            click: unifLiveCallback
        },
        uniformOcc: {
            text: 'Occasional',
            click: unifOccCallback
        }
    }
};
menu.concentrated = {
    text: 'Concentrated',
    children: {
        concDead: {
            text: 'Dead',
            click: concDeadCallback
        },
        concLive: {
            text: 'Live',
            click: concLiveCallback
        },
        concOcc: {
            text: 'Occasional',
            click: concOccCallback
        }
    }
};
menu.piping   = {text:'Piping/HSS Loads',click:pipingCallback};
menu.s2a      = '---';
menu.group    = {text:'Group Name',click:groupCallback};
menu.select   = {text:'Select by Group',click:selectCallback};

menu.s3       = '---';
menu.renumber   = {text:'Renumber',click:renumberCallback};
menu.copy     = {text:'Copy/Array',click:copyCallback};
menu.move     = {text:'Move',click:moveCallback};
menu.brek     = {text:'Break',click:breakCallback};
menu.hide     = {text:'Hide',click:hideCallback};
menu.del      = {text:'Delete',click:delCallback};

// node only menu

  
//          information deemed important for Undo, Redo

var currentState;
var undoQueue = [];
var undoLevel;
var fNodes = [];
var lCases = [];
var lShares = [];

var onFromNode = false;
var onToNode = false;

var allGraphics = true;
var inBoot = false;
var heroActive = false;
var displayLanguage = 'English';

//          units
var defaultUnits = 'English-1';    // new models

var currentUnits = 'English-1';
var uNameForce = 'lb';
var uConstForce = 1.0;
var uNameLength = 'in';
var uConstLength = 1.0;
var uNameMomOut = 'ft-lb';
var uConstMomOut = 1.0/12.0;
var uNameStress = 'psi';
var uConstStress = 1.0;
var uNameUnif = 'lb/in';
var uConstUnif = 1.0;
var uNameWeight = 'lb';
var uConstWeight = 1.0;

var uNameLengthX = 'in';
var uConstLengthX = 1.0;
var uNameWeightX = 'lb';
var uConstWeightX = 1.0;
var uNameForceX = 'lb';
var uConstForceX = 1.0;
var uNameUnifX = 'lb/in';
var uConstUnifX = 1.0;
var uNameStressX = 'psi';
var uConstStressX = 1.0;
var uNameMomOutX = 'ft-lb';
var uConstMomOutX = 1.0 / 12.0;

//          member type defaults

var colMatch = true;
var beamMatch = true;
var braceMatch = true;
var autoBreak = true;

var colType = "W8X24";
var beamType = "W4X13";
var braceType = "2L3X3X1/4X3/4";

var colSplit = 1;
var beamSplit = 4;
var braceSplit = 2;

var colEnd = 0;    // fixed
var beamEnd = 1;    // pinned
var braceEnd = 1;    // pinned

var nodInc = 10;

var englishMem = true;
var metricMem = false;
var englishMem1 = true;
var metricMem1 = false;
var pressStiff = false;

var memW = false;
var memM = false;
var memS = false;
var memHP = false;
var memWB = false;
var memWT = false;
var memMT = false;
var memST = false;
var memL = false;
var mem2L = false;
var memC = false;
var memMC = false;
var memHSS = false;
var memPip = false;

var canWE = true;
var canME = true;
var canSE = true;
var canHPE = true;
var canWBE = true;
var canWTE = true;
var canMTE = true;
var canSTE = true;
var canLE = true;
var can2LE = true;
var canCE = true;
var canMCE = true;
var canHSSE = true;
var canPipE = true;

var canWM = true;
var canMM = true;
var canSM = true;
var canHPM = true;
var canWBM = true;
var canWTM = true;
var canMTM = true;
var canSTM = true;
var canLM = true;
var can2LM = true;
var canCM = true;
var canMCM = true;
var canHSSM = true;
var canPipM = true;

var nodesOn = true;
var gridMode = false;
var drawMode = false;
var ctrlKeyMode = false;
var elSelectMode = false;
var nodSelectMode = false;
var memberDefault = true;
var newMember = false;

var nDupRow = 0;
var nodIter1 = 1;
var nodIter2 = 1;
var nodIter3 = 1;
var nodIncr1 = 0;
var nodIncr2 = 0;
var nodIncr3 = 0;
var nodX1 = 0.0;
var nodX2 = 0.0;
var nodX3 = 0.0;
var nodY1 = 0.0;
var nodY2 = 0.0;
var nodY3 = 0.0;
var nodZ1 = 0.0;
var nodZ2 = 0.0;
var nodZ3 = 0.0;

//            var printLoad = [];
var dispRept = [];
var forceRept = [];
var stressRept = [];
var complyRept = [];
var restRept = [];
var c;
var cLabel;
var container;
var jobName;
var totEls = 0;
var currElmt;
var oldEntries;
var memberTypeArray = ["W4X13","W6X20","W8X24","W10X30","W10X12","W10X45","W12X60","W18X35","2L3X3X1/4X3/4","Pipe4STD","Pipe8STD"];
var materialTypeArray = ["A36","A993"];

var userProfile = {};

var changedMemLib = false;
var loadedGlobalMems = false;

var changedMatLib = false;
var loadedGlobalMats = false;

var ccDOpen = false;
var ccFOpen = false;
var ccMOpen = false;

var ccD;
var ccF;

var passWord;

var memLibrary = memLibrary || (function () {

    var pleaseWaitDiv = $('<div class="modal hide" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"><div class="modal-header"><h3>One moment while list of available members is populated...</h3></div><div class="modal-body"><div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div></div></div>');
    return {
        showPleaseWait: function() {
            pleaseWaitDiv.modal();
        },
        hidePleaseWait: function () {
            pleaseWaitDiv.modal('hide');
        }
    };
})();

var matLibrary = matLibrary || (function () {

    var pleaseWaitDiv = $('<div class="modal hide" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"><div class="modal-header"><h3>One moment while list of available materials is populated...</h3></div><div class="modal-body"><div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div></div></div>');
    return {
        showPleaseWait: function() {
            pleaseWaitDiv.modal();
        },
        hidePleaseWait: function () {
            pleaseWaitDiv.modal('hide');
        }
    };
})();

var userList = ["Public"];
function getUserList() {
    $.ajax({
        type: "POST",
        url: "./php/getUserList.php",
        success: function(data){
            var datArray = csvToArray( data, ',' );
            userList = [];
            for( var i=0; i<datArray.length; i++ ) {
                if (datArray[i][0]) {
                    if (datArray[i][0] != userName ) {
                        userList.push(datArray[i][0]);
                    }
                }
            }
        }, // function
        error: function(msg){
            userList = ["Public"];
        }, // function
        complete: function(msg){
            //                                alert(msg);
        } // function
    }); //ajax
}

function ptq(q) {
    /* parse the query */
    /* semicolons are nonstandard but we accept them */
    var x = q.replace(/;/g, '&').split('&'), i, name, t;
    /* q changes from string version of query to object */
    for (q={}, i=0; i<x.length; i++) {
        t = x[i].split('=', 2);
        name = unescape(t[0]);
        if (!q[name])
            q[name] = [];
        if (t.length > 1) {
            q[name][q[name].length] = unescape(t[1]);
        }
            /* next two lines are nonstandard */
        else
            q[name][q[name].length] = true;
    }
    return q;
}

function param() {
    return ptq(location.search.substring(1).replace(/\+/g, ' '));
}

var modelElements;

function initModElem() {
    modelElements.length = 0;
    
    modelElements = [{},
         { jobName:"Unnamed Job",
             order: 0,
             keyID: 0,
             fromNode: nodInc,
             toNode: 2*nodInc,
             dX: 0.0,
             dY: 0.0,
             dZ: 0.0,
             memberType: memberTypeArray[0],
             betaAngle: 0,
             material: materialTypeArray[0],
             pipOD: 0.0,
             pipTh: 0.0,
             fromFXRest: false,
             fromFYRest: false,
             fromFZRest: false,
             fromMXRest: false,
             fromMYRest: false,
             fromMZRest: false,
             toFXRest: false,
             toFYRest: false,
             toFZRest: false,
             toMXRest: false,
             toMYRest: false,
             toMZRest: false,
             fromFXMemb: false,
             fromFYMemb: false,
             fromFZMemb: false,
             fromMXMemb: false,
             fromMYMemb: false,
             fromMZMemb: false,
             toFXMemb: false,
             toFYMemb: false,
             toFZMemb: false,
             toMXMemb: false,
             toMYMemb: false,
             toMZMemb: false,
             uX: 0.0,                // unlabeled = dead load
             uY: 0.0,
             uZ: 0.0,
             fromFXLoad: 0.0,
             fromFYLoad: 0.0,
             fromFZLoad: 0.0,
             fromMXLoad: 0.0,
             fromMYLoad: 0.0,
             fromMZLoad: 0.0,
             toFXLoad: 0.0,
             toFYLoad: 0.0,
             toFZLoad: 0.0,
             toMXLoad: 0.0,
             toMYLoad: 0.0,
             toMZLoad: 0.0,

             uXL: 0.0,      // live
             uYL: 0.0,
             uZL: 0.0,
             fromFXLoadL: 0.0,
             fromFYLoadL: 0.0,
             fromFZLoadL: 0.0,
             fromMXLoadL: 0.0,
             fromMYLoadL: 0.0,
             fromMZLoadL: 0.0,
             toFXLoadL: 0.0,
             toFYLoadL: 0.0,
             toFZLoadL: 0.0,
             toMXLoadL: 0.0,
             toMYLoadL: 0.0,
             toMZLoadL: 0.0,

             uXO: 0.0,
             uYO: 0.0,
             uZO: 0.0,
             fromFXLoadO: 0.0,
             fromFYLoadO: 0.0,
             fromFZLoadO: 0.0,
             fromMXLoadO: 0.0,
             fromMYLoadO: 0.0,
             fromMZLoadO: 0.0,
             toFXLoadO: 0.0,
             toFYLoadO: 0.0,
             toFZLoadO: 0.0,
             toMXLoadO: 0.0,
             toMYLoadO: 0.0,
             toMZLoadO: 0.0,

             lX: 0.0,
             lY: 0.0,
             lZ: 0.0,
             kX: 0.0,
             kY: 0.0,
             kZ: 0.0,

             cBZ: 0.0,
             cBY: 0.0,

             stable: false,

             stiffDist : 0.0,
             stiffI : 0.0,
             tfaStiff : false,

             pressure : 0.0,
             fluid : 0.0,
         
             group : "",
             hidden : false,

             totEls: 0 } ];

    coords.length = 0;
    coords = [ {},
               { x1:0.0,
                   y1:0.0,
                   z1:0.0,
                   x2:0.0,
                   y2:0.0,
                   z2:0.0 }];
}

//            var loadCaseData = [[]];

var coords = [ {},
               { x1:0.0,
                   y1:0.0,
                   z1:0.0,
                   x2:0.0,
                   y2:0.0,
                   z2:0.0 }];

var userName = "";
var userName1 = "";
var editRights = true;
var temporary = false;

var nodeDisps = [];
var defScale = 5.0;
var deformed = false;
var deformedElementsPresent = false;
var cColor = false;

var totalLoadCases = 0;
var currentLoadCase = 0;

var sTypes = [];
var sType;

var aData1 = [];

var isStatic = true;
var isAnimated = false;
var iAnimate;

var sFact1 = 6.0;
var xDel = -1.0;

function breakElms( newElms ){ // pass numbers of new elements, to be checked against all elements 

    if( !editRights )
        return;
    if( !autoBreak || (newElms.length <= 0) )
        return;
    calcCoords();
    var ii = 1;
    var iTrue = 1;
    var tol = 0.3 * uConstLength;    // 0.3 inch tolerance?  Maybe better to be the sum of 1/2 of width of the two members

    while (iTrue == 1) { 

        var p0 = [coords[ii].x1*uConstLength,coords[ii].y1*uConstLength,coords[ii].z1*uConstLength];
        var u = [modelElements[ii].dX, modelElements[ii].dY, modelElements[ii].dZ ];
        var s = Math.sqrt(u[0]*u[0]+u[1]*u[1]+u[2]*u[2]);
    
        var a = dot(u,u);

        //                var iEls1 = totEls;

        var j = ii+1;
        while ( j<= totEls )  {		// just against later ones

            if( newElms.indexOf(i) < 0 && newElms.indexOf(j) < 0 ) {
                // neither are new, don't bother to check
                j++;
                continue;		// already a match, don't bother
            } 

            if( modelElements[ii].fromNode == modelElements[j].fromNode ||
                modelElements[ii].fromNode == modelElements[j].toNode ||
                modelElements[ii].toNode == modelElements[j].fromNode ||
                modelElements[ii].toNode == modelElements[j].toNode ) {
                j++;
                continue;		// already a match, don't bother
            }

            var x1 = coords[j].x1;
            var y1 = coords[j].y1;
            var z1 = coords[j].z1;
            var x2 = coords[j].x2;
            var y2 = coords[j].y2;
            var z2 = coords[j].z2;

            if( x1 < x2 ) {
                x1 = x1 - tol/uConstLength;
                x2 = x2 + tol/uConstLength;
            }
            else {
                var tem = x1 + tol/uConstLength;
                x1 = x2 - tol/uConstLength;
                x2 = tem;
            }

            if( y1 < y2 ) {
                y1 = y1 - tol/uConstLength;
                y2 = y2 + tol/uConstLength;
            }
            else {
                var tem = y1 + tol/uConstLength;
                y1 = y2 - tol/uConstLength;
                y2 = tem;
            }

            if( z1 < z2 ) {
                z1 = z1 - tol/uConstLength;
                z2 = z2 + tol/uConstLength;
            }
            else {
                var tem = z1 + tol/uConstLength;
                z1 = z2 - tol/uConstLength;
                z2 = tem;
            }

            if( (coords[ii].x1 <= x1 && coords[ii].x2 <= x1) ||
                (coords[ii].x1 >= x2 && coords[ii].x2 >= x2) ||
                (coords[ii].y1 <= y1 && coords[ii].y2 <= y1) ||
                (coords[ii].y1 >= y2 && coords[ii].y2 >= y2) ||
                (coords[ii].z1 <= z1 && coords[ii].z2 <= z1) ||
                (coords[ii].z1 >= z2 && coords[ii].z2 >= z2) ) {
                j++;
                continue; 	// totally outside of range
            }

            var q0 = [coords[j].x1*uConstLength,coords[j].y1*uConstLength,coords[j].z1*uConstLength];
            var v = [modelElements[j].dX, modelElements[j].dY, modelElements[j].dZ ];
            var t = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
      
            var w0 = [p0[0]-q0[0],p0[1]-q0[1],p0[2]-q0[2]];
            var l = Math.sqrt(w0[0]*w0[0]+w0[1]*w0[1]+w0[2]*w0[2]);

            var b = dot(u,v);
            var c = dot(v,v);
            var d = dot(u,w0);
            var e = dot(v,w0);

            var denom = a*c - b*b;
            if( denom != 0.0 ) {
                // not parallel, we might need an intersection

                var sc = (b * e - c * d) / denom;
                var tc = (a * e - b * d) / denom;

                // need to refine the following, because this may not catch true minimum (later)
                // if off the segment, bring back to end point
                if( sc < 0.0 )
                    sc = 0.0;
                else {
                    if( sc > 1.0 )
                        sc = 1.0;
                }
                if( tc < 0.0 )
                    tc = 0.0;
                else {
                    if( tc > 1.0 )
                        tc = 1.0;
                }

                sc *= s;
                tc *= t;

                var p1 = [p0[0]+(sc/s)*u[0],p0[1]+(sc/s)*u[1],p0[2]+(sc/s)*u[2]];
                var q1 = [q0[0]+(tc/t)*v[0],q0[1]+(tc/t)*v[1],q0[2]+(tc/t)*v[2]];
                var dist = Math.sqrt((p1[0]-q1[0])*(p1[0]-q1[0]) + (p1[1]-q1[1])*(p1[1]-q1[1]) + (p1[2]-q1[2])*(p1[2]-q1[2]));

                if( dist < tol ) {
                    // we need to break
                    var newNode1 = 0;
                    if (Math.abs(sc) < tol) 
                        // close enough, just use the from node
                        newNode1 = modelElements[ii].fromNode;
                    else {
                        if (Math.abs(sc - s) < tol) 
                            // close enough, just use the to node
                            newNode1 = modelElements[ii].toNode;
                        else {
            
                            var freeLength = sc;
                            //                          totEls1 = totEls;
                            var dxx = modelElements[ii].dX;
                            var dyy = modelElements[ii].dY;
                            var dzz = modelElements[ii].dZ;
              
                            var len = Math.sqrt(dxx * dxx + dyy * dyy + dzz * dzz);
                            var lxx = modelElements[ii].lX;
                            if (lxx == 0.0) 
                                lxx = len;
                            var lyy = modelElements[ii].lY;
                            if (lyy == 0.0) 
                                lyy = len;
                            var lzz = modelElements[ii].lZ;
                            if (lzz == 0.0) 
                                lzz = len;
              
                            var iSubs = 2;
                            var lengths = [[sc, sc / s, 0.0], [len - sc, 1.0 - sc / s, 0.0]];
                            // move all remaining elements above currElmt up (iSubs - 1) places (get the procedure out of Insert function)
              
                            for (var i = 0; i < newElms.length; i++) {
                                if (newElms[i] > ii) 
                                    newElms[i] += (iSubs - 1);
                            }
                            if (newElms.indexOf(ii) >= 0) 
                                newElms.push(ii + 1);
              
                            for (var i = totEls + iSubs - 1; i > ii + iSubs - 1; i--) {
              
                                modelElements[i] = modelElements[i - iSubs + 1];
                                modelElements[i].order = i;
                                coords[i] = coords[i - iSubs + 1];
                                $.ajax({
                                    type: "POST",
                                    url: "./php/updateElementOrder.php",
                                    data: {
                                        "userName": userName1,
                                        "jobName": jobName,
                                        "keyID": modelElements[i].keyID,
                                        "order": modelElements[i].order
                                    },
                                    completion: function(msg){
                                    }
                                });
                            }
              
                            modelElements[ii].lX = lxx;
                            modelElements[ii].lY = lyy;
                            modelElements[ii].lZ = lzz;
              
                            for (var i = ii + 1; i < ii + iSubs; i++) {
                                modelElements[i] = {
                                    jobName: modelElements[ii].jobName,
                                    order: i,
                                    keyID: randomInteger(10000000),
                                    fromNode: 0,
                                    toNode: 0,
                                    dX: 0.0,
                                    dY: 0.0,
                                    dZ: 0.0,
                                    memberType: modelElements[ii].memberType,
                                    betaAngle: modelElements[ii].betaAngle,
                                    material: modelElements[ii].material,
                                    pipOD: modelElements[ii].pipOD,
                                    pipTh: modelElements[ii].pipTh,
                                    fromFXRest: false,
                                    fromFYRest: false,
                                    fromFZRest: false,
                                    fromMXRest: false,
                                    fromMYRest: false,
                                    fromMZRest: false,
                                    toFXRest: false,
                                    toFYRest: false,
                                    toFZRest: false,
                                    toMXRest: false,
                                    toMYRest: false,
                                    toMZRest: false,
                                    fromFXMemb: false,
                                    fromFYMemb: false,
                                    fromFZMemb: false,
                                    fromMXMemb: false,
                                    fromMYMemb: false,
                                    fromMZMemb: false,
                                    toFXMemb: false,
                                    toFYMemb: false,
                                    toFZMemb: false,
                                    toMXMemb: false,
                                    toMYMemb: false,
                                    toMZMemb: false,
                                    uX: modelElements[ii].uX,
                                    uY: modelElements[ii].uY,
                                    uZ: modelElements[ii].uZ,
                                    fromFXLoad: 0.0,
                                    fromFYLoad: 0.0,
                                    fromFZLoad: 0.0,
                                    fromMXLoad: 0.0,
                                    fromMYLoad: 0.0,
                                    fromMZLoad: 0.0,
                                    toFXLoad: 0.0,
                                    toFYLoad: 0.0,
                                    toFZLoad: 0.0,
                                    toMXLoad: 0.0,
                                    toMYLoad: 0.0,
                                    toMZLoad: 0.0,
                                    uXL: modelElements[ii].uXL,
                                    uYL: modelElements[ii].uYL,
                                    uZL: modelElements[ii].uZL,
                                    fromFXLoadL: 0.0,
                                    fromFYLoadL: 0.0,
                                    fromFZLoadL: 0.0,
                                    fromMXLoadL: 0.0,
                                    fromMYLoadL: 0.0,
                                    fromMZLoadL: 0.0,
                                    toFXLoadL: 0.0,
                                    toFYLoadL: 0.0,
                                    toFZLoadL: 0.0,
                                    toMXLoadL: 0.0,
                                    toMYLoadL: 0.0,
                                    toMZLoadL: 0.0,
                                    uXO: modelElements[ii].uXO,
                                    uYO: modelElements[ii].uYO,
                                    uZO: modelElements[ii].uZO,
                                    fromFXLoadO: 0.0,
                                    fromFYLoadO: 0.0,
                                    fromFZLoadO: 0.0,
                                    fromMXLoadO: 0.0,
                                    fromMYLoadO: 0.0,
                                    fromMZLoadO: 0.0,
                                    toFXLoadO: 0.0,
                                    toFYLoadO: 0.0,
                                    toFZLoadO: 0.0,
                                    toMXLoadO: 0.0,
                                    toMYLoadO: 0.0,
                                    toMZLoadO: 0.0,
                                    lX: lxx,
                                    lY: lyy,
                                    lZ: lzz,
                                    kX: modelElements[ii].kX,
                                    kY: modelElements[ii].kY,
                                    kZ: modelElements[ii].kZ,
                                    cBZ: modelElements[ii].cBZ,
                                    cBY: modelElements[ii].cBY,
                                    stable: modelElements[ii].stable,
                                    stiffDist: modelElements[ii].stiffDist,
                                    stiffI: modelElements[ii].stiffI,
                                    tfaStiff: modelElements[ii].tfaStiff,
                                    pressure: modelElements[ii].pressure,
                                    fluid:  modelElements[ii].fluid,
                                    group: modelElements[ii].group,
                                    hidden: modelElements[ii].hidden,
                                    totEls: modelElements[ii].totEls
                                };
                            }
              
                            if (iSubs > 1) {
                                modelElements[ii].lX = lxx;
                                modelElements[ii].lY = lyy;
                                modelElements[ii].lZ = lzz;
                
                                modelElements[ii + iSubs - 1].toFXRest = modelElements[ii].toFXRest;
                                modelElements[ii + iSubs - 1].toFYRest = modelElements[ii].toFYRest;
                                modelElements[ii + iSubs - 1].toFZRest = modelElements[ii].toFZRest;
                                modelElements[ii + iSubs - 1].toMXRest = modelElements[ii].toMXRest;
                                modelElements[ii + iSubs - 1].toMYRest = modelElements[ii].toMYRest;
                                modelElements[ii + iSubs - 1].toMZRest = modelElements[ii].toMZRest;
                                modelElements[ii + iSubs - 1].toFXMemb = modelElements[ii].toFXMemb;
                                modelElements[ii + iSubs - 1].toFYMemb = modelElements[ii].toFYMemb;
                                modelElements[ii + iSubs - 1].toFZMemb = modelElements[ii].toFZMemb;
                                modelElements[ii + iSubs - 1].toMXMemb = modelElements[ii].toMXMemb;
                                modelElements[ii + iSubs - 1].toMYMemb = modelElements[ii].toMYMemb;
                                modelElements[ii + iSubs - 1].toMZMemb = modelElements[ii].toMZMemb;
                                modelElements[ii + iSubs - 1].toFXLoad = modelElements[ii].toFXLoad;
                                modelElements[ii + iSubs - 1].toFYLoad = modelElements[ii].toFYLoad;
                                modelElements[ii + iSubs - 1].toFZLoad = modelElements[ii].toFZLoad;
                                modelElements[ii + iSubs - 1].toMXLoad = modelElements[ii].toMXLoad;
                                modelElements[ii + iSubs - 1].toMYLoad = modelElements[ii].toMYLoad;
                                modelElements[ii + iSubs - 1].toMZLoad = modelElements[ii].toMZLoad;
                                modelElements[ii + iSubs - 1].toFXLoadL = modelElements[ii].toFXLoadL;
                                modelElements[ii + iSubs - 1].toFYLoadL = modelElements[ii].toFYLoadL;
                                modelElements[ii + iSubs - 1].toFZLoadL = modelElements[ii].toFZLoadL;
                                modelElements[ii + iSubs - 1].toMXLoadL = modelElements[ii].toMXLoadL;
                                modelElements[ii + iSubs - 1].toMYLoadL = modelElements[ii].toMYLoadL;
                                modelElements[ii + iSubs - 1].toMZLoadL = modelElements[ii].toMZLoadL;
                                modelElements[ii + iSubs - 1].toFXLoadO = modelElements[ii].toFXLoadO;
                                modelElements[ii + iSubs - 1].toFYLoadO = modelElements[ii].toFYLoadO;
                                modelElements[ii + iSubs - 1].toFZLoadO = modelElements[ii].toFZLoadO;
                                modelElements[ii + iSubs - 1].toMXLoadO = modelElements[ii].toMXLoadO;
                                modelElements[ii + iSubs - 1].toMYLoadO = modelElements[ii].toMYLoadO;
                                modelElements[ii + iSubs - 1].toMZLoadO = modelElements[ii].toMZLoadO;
                
                                modelElements[ii].toFXRest = false;
                                modelElements[ii].toFYRest = false;
                                modelElements[ii].toFZRest = false;
                                modelElements[ii].toMXRest = false;
                                modelElements[ii].toMYRest = false;
                                modelElements[ii].toMZRest = false;
                                modelElements[ii].toFXMemb = false;
                                modelElements[ii].toFYMemb = false;
                                modelElements[ii].toFZMemb = false;
                                modelElements[ii].toMXMemb = false;
                                modelElements[ii].toMYMemb = false;
                                modelElements[ii].toMZMemb = false;
                                modelElements[ii].toFXLoad = 0.0;
                                modelElements[ii].toFYLoad = 0.0;
                                modelElements[ii].toFZLoad = 0.0;
                                modelElements[ii].toMXLoad = 0.0;
                                modelElements[ii].toMYLoad = 0.0;
                                modelElements[ii].toMZLoad = 0.0;
                                modelElements[ii].toFXLoadL = 0.0;
                                modelElements[ii].toFYLoadL = 0.0;
                                modelElements[ii].toFZLoadL = 0.0;
                                modelElements[ii].toMXLoadL = 0.0;
                                modelElements[ii].toMYLoadL = 0.0;
                                modelElements[ii].toMZLoadL = 0.0;
                                modelElements[ii].toFXLoadO = 0.0;
                                modelElements[ii].toFYLoadO = 0.0;
                                modelElements[ii].toFZLoadO = 0.0;
                                modelElements[ii].toMXLoadO = 0.0;
                                modelElements[ii].toMYLoadO = 0.0;
                                modelElements[ii].toMZLoadO = 0.0;
                            }
              
                            totEls += (iSubs - 1);
                            j += (iSubs - 1);
              
                            newNode1 = modelElements[ii].fromNode;
                            var lastNode = modelElements[ii].toNode;
              
                            for (var j1 = ii; j1 <= ii + iSubs - 1; j1++) {
              
                                if (j1 != ii) 
                                    modelElements[j1].fromNode = modelElements[j1 - 1].toNode;
                                if (j1 == ii + iSubs - 1) 
                                    modelElements[j1].toNode = lastNode;
                                else {
                                    newNode1 = getNewNode(newNode1);
                                    if (newNode1 == lastNode) 
                                        newNode1 = getNewNode(newNode1 + nodInc);
                                    modelElements[j1].toNode = newNode1;
                                }
                
                                modelElements[j1].dX = dxx * lengths[j1 - ii][1];
                                modelElements[j1].dY = dyy * lengths[j1 - ii][1];
                                modelElements[j1].dZ = dzz * lengths[j1 - ii][1];
                
                                $.ajax({
                                    type: "POST",
                                    url: "./php/storeElement.php",
                                    data: {
                                        "userName": userName1,
                                        "jobName": jobName,
                                        "modelEl": modelElements[j1]
                                    },
                  
                                    success: function(msg){
                                        //                                alert(msg);
                                    }, // function
                                    error: function(msg){
                                        //                                alert(msg);
                                    }, // function
                                    complete: function(msg){
                                        //                                alert(msg);
                                    } // function
                                }); //ajax
                                if (j1 != ii) 
                                    coords[j1] = {
                                        x1: coords[j1 - 1].x2,
                                        y1: coords[j1 - 1].y2,
                                        z1: coords[j1 - 1].z2,
                                        x2: coords[j1 - 1].x2 + modelElements[j1].dX / uConstLength,
                                        y2: coords[j1 - 1].y2 + modelElements[j1].dY / uConstLength,
                                        z2: coords[j1 - 1].z2 + modelElements[j1].dZ / uConstLength
                                    };
                                else 
                                    coords[j1] = {
                                        x1: coords[j1].x1,
                                        y1: coords[j1].y1,
                                        z1: coords[j1].z1,
                                        x2: coords[j1].x1 + modelElements[j1].dX / uConstLength,
                                        y2: coords[j1].y1 + modelElements[j1].dY / uConstLength,
                                        z2: coords[j1].z1 + modelElements[j1].dZ / uConstLength
                                    };
                            }
                            //                          mergeNodes(ii, ii + iSubs - 1);
                            // ii changed, need to recalculate
                            p0 = [coords[ii].x1 * uConstLength, coords[ii].y1 * uConstLength, coords[ii].z1 * uConstLength];
                            u = [modelElements[ii].dX, modelElements[ii].dY, modelElements[ii].dZ];
                            s = Math.sqrt(u[0] * u[0] + u[1] * u[1] + u[2] * u[2]);
              
                            a = dot(u, u);
                        }
                    }
                    if (Math.abs(tc) < tol) {
                        // close enough, just use the from node
                        modelElements[j].fromNode = newNode1;

                        $.ajax({
                            type: "POST",
                            url: "./php/storeElement.php",
                            data: {
                                "userName": userName1,
                                "jobName": jobName,
                                "modelEl": modelElements[j]
                            },

                            success: function(msg){
                                //                              alert(msg);
                            }, // function
                            error: function(msg){
                                //                              alert(msg);
                            }, // function
                            complete: function(msg){
                                //                              alert(msg);
                            } // function
                        }); //ajax
                    }
                    else {
                        if (Math.abs(tc - t) < tol) {
                            // close enough, just use the to node
                            modelElements[j].toNode = newNode1;
                
                            $.ajax({
                                type: "POST",
                                url: "./php/storeElement.php",
                                data: {
                                    "userName": userName1,
                                    "jobName": jobName,
                                    "modelEl": modelElements[j]
                                },
                                success: function(msg){
                                    //                                alert(msg);
                                }, // function
                                error: function(msg){
                                    //                                alert(msg);
                                }, // function
                                complete: function(msg){
                                    //                                alert(msg);
                                } // function
                            }); //ajax
                        }
                        else {
                            var freeLength = tc;
                            totEls1 = totEls;
                            var dxx = modelElements[j].dX;
                            var dyy = modelElements[j].dY;
                            var dzz = modelElements[j].dZ;
                
                            var len = Math.sqrt(dxx * dxx + dyy * dyy + dzz * dzz);
                            var lxx = modelElements[j].lX;
                            if (lxx == 0.0) 
                                lxx = len;
                            var lyy = modelElements[j].lY;
                            if (lyy == 0.0) 
                                lyy = len;
                            var lzz = modelElements[j].lZ;
                            if (lzz == 0.0) 
                                lzz = len;
              
                            var iSubs = 2;
                            var lengths = [[tc, tc / t, 0.0], [len - tc, 1.0 - tc / t, 0.0]];
                            // move all remaining elements above currElmt up (iSubs - 1) places (get the procedure out of Insert function)
                
                            for (var i = 0; i < newElms.length; i++ ) {
                                if( newElms[i] > j )
                                    newElms[i] += (iSubs-1);
                            }
                            if( newElms.indexOf(j) >= 0 )
                                newElms.push(j+1);

                            for (var i = totEls + iSubs - 1; i > j + iSubs - 1; i--) {
                                modelElements[i] = modelElements[i - iSubs + 1];
                                modelElements[i].order = i;
                                coords[i] = coords[i - iSubs + 1];
                                $.ajax({
                                    type: "POST",
                                    url: "./php/updateElementOrder.php",
                                    data: {
                                        "userName": userName1,
                                        "jobName": jobName,
                                        "keyID": modelElements[i].keyID,
                                        "order": modelElements[i].order
                                    },
                                    completion: function(msg){
                                    }
                                });
                            }
                
                            modelElements[j].lX = lxx;
                            modelElements[j].lY = lyy;
                            modelElements[j].lZ = lzz;
                
                            for (var i = j + 1; i < j + iSubs; i++) {
                                modelElements[i] = {
                                    jobName: modelElements[j].jobName,
                                    order: i,
                                    keyID: randomInteger(10000000),
                                    fromNode: 0,
                                    toNode: 0,
                                    dX: 0.0,
                                    dY: 0.0,
                                    dZ: 0.0,
                                    memberType: modelElements[j].memberType,
                                    betaAngle: modelElements[j].betaAngle,
                                    material: modelElements[j].material,
                                    pipOD: modelElements[j].pipOD,
                                    pipTh: modelElements[j].pipTh,
                                    fromFXRest: false,
                                    fromFYRest: false,
                                    fromFZRest: false,
                                    fromMXRest: false,
                                    fromMYRest: false,
                                    fromMZRest: false,
                                    toFXRest: false,
                                    toFYRest: false,
                                    toFZRest: false,
                                    toMXRest: false,
                                    toMYRest: false,
                                    toMZRest: false,
                                    fromFXMemb: false,
                                    fromFYMemb: false,
                                    fromFZMemb: false,
                                    fromMXMemb: false,
                                    fromMYMemb: false,
                                    fromMZMemb: false,
                                    toFXMemb: false,
                                    toFYMemb: false,
                                    toFZMemb: false,
                                    toMXMemb: false,
                                    toMYMemb: false,
                                    toMZMemb: false,
                                    uX: modelElements[j].uX,
                                    uY: modelElements[j].uY,
                                    uZ: modelElements[j].uZ,
                                    fromFXLoad: 0.0,
                                    fromFYLoad: 0.0,
                                    fromFZLoad: 0.0,
                                    fromMXLoad: 0.0,
                                    fromMYLoad: 0.0,
                                    fromMZLoad: 0.0,
                                    toFXLoad: 0.0,
                                    toFYLoad: 0.0,
                                    toFZLoad: 0.0,
                                    toMXLoad: 0.0,
                                    toMYLoad: 0.0,
                                    toMZLoad: 0.0,
                                    uXL: modelElements[j].uXL,
                                    uYL: modelElements[j].uYL,
                                    uZL: modelElements[j].uZL,
                                    fromFXLoadL: 0.0,
                                    fromFYLoadL: 0.0,
                                    fromFZLoadL: 0.0,
                                    fromMXLoadL: 0.0,
                                    fromMYLoadL: 0.0,
                                    fromMZLoadL: 0.0,
                                    toFXLoadL: 0.0,
                                    toFYLoadL: 0.0,
                                    toFZLoadL: 0.0,
                                    toMXLoadL: 0.0,
                                    toMYLoadL: 0.0,
                                    toMZLoadL: 0.0,
                                    uXO: modelElements[j].uXO,
                                    uYO: modelElements[j].uYO,
                                    uZO: modelElements[j].uZO,
                                    fromFXLoadO: 0.0,
                                    fromFYLoadO: 0.0,
                                    fromFZLoadO: 0.0,
                                    fromMXLoadO: 0.0,
                                    fromMYLoadO: 0.0,
                                    fromMZLoadO: 0.0,
                                    toFXLoadO: 0.0,
                                    toFYLoadO: 0.0,
                                    toFZLoadO: 0.0,
                                    toMXLoadO: 0.0,
                                    toMYLoadO: 0.0,
                                    toMZLoadO: 0.0,
                                    lX: lxx,
                                    lY: lyy,
                                    lZ: lzz,
                                    kX: modelElements[j].kX,
                                    kY: modelElements[j].kY,
                                    kZ: modelElements[j].kZ,
                                    cBZ: modelElements[j].cBZ,
                                    cBY: modelElements[j].cBY,
                                    stable: modelElements[j].stable,
                                    stiffDist: modelElements[j].stiffDist,
                                    stiffI: modelElements[j].stiffI,
                                    tfaStiff: modelElements[j].tfaStiff,
                                    pressure: modelElements[j].pressure,
                                    fluid:  modelElements[j].fluid,
                                    group: modelElements[j].group,
                                    hidden: modelElements[j].hidden,
                                    totEls: modelElements[j].totEls
                                };

                            }

                            if (iSubs > 1) {
                                modelElements[j].lX = lxx;
                                modelElements[j].lY = lyy;
                                modelElements[j].lZ = lzz;

                                modelElements[j + iSubs - 1].toFXRest = modelElements[j].toFXRest;
                                modelElements[j + iSubs - 1].toFYRest = modelElements[j].toFYRest;
                                modelElements[j + iSubs - 1].toFZRest = modelElements[j].toFZRest;
                                modelElements[j + iSubs - 1].toMXRest = modelElements[j].toMXRest;
                                modelElements[j + iSubs - 1].toMYRest = modelElements[j].toMYRest;
                                modelElements[j + iSubs - 1].toMZRest = modelElements[j].toMZRest;
                                modelElements[j + iSubs - 1].toFXMemb = modelElements[j].toFXMemb;
                                modelElements[j + iSubs - 1].toFYMemb = modelElements[j].toFYMemb;
                                modelElements[j + iSubs - 1].toFZMemb = modelElements[j].toFZMemb;
                                modelElements[j + iSubs - 1].toMXMemb = modelElements[j].toMXMemb;
                                modelElements[j + iSubs - 1].toMYMemb = modelElements[j].toMYMemb;
                                modelElements[j + iSubs - 1].toMZMemb = modelElements[j].toMZMemb;
                                modelElements[j + iSubs - 1].toFXLoad = modelElements[j].toFXLoad;
                                modelElements[j + iSubs - 1].toFYLoad = modelElements[j].toFYLoad;
                                modelElements[j + iSubs - 1].toFZLoad = modelElements[j].toFZLoad;
                                modelElements[j + iSubs - 1].toMXLoad = modelElements[j].toMXLoad;
                                modelElements[j + iSubs - 1].toMYLoad = modelElements[j].toMYLoad;
                                modelElements[j + iSubs - 1].toMZLoad = modelElements[j].toMZLoad;
                                modelElements[j + iSubs - 1].toFXLoadL = modelElements[j].toFXLoadL;
                                modelElements[j + iSubs - 1].toFYLoadL = modelElements[j].toFYLoadL;
                                modelElements[j + iSubs - 1].toFZLoadL = modelElements[j].toFZLoadL;
                                modelElements[j + iSubs - 1].toMXLoadL = modelElements[j].toMXLoadL;
                                modelElements[j + iSubs - 1].toMYLoadL = modelElements[j].toMYLoadL;
                                modelElements[j + iSubs - 1].toMZLoadL = modelElements[j].toMZLoadL;
                                modelElements[j + iSubs - 1].toFXLoadO = modelElements[j].toFXLoadO;
                                modelElements[j + iSubs - 1].toFYLoadO = modelElements[j].toFYLoadO;
                                modelElements[j + iSubs - 1].toFZLoadO = modelElements[j].toFZLoadO;
                                modelElements[j + iSubs - 1].toMXLoadO = modelElements[j].toMXLoadO;
                                modelElements[j + iSubs - 1].toMYLoadO = modelElements[j].toMYLoadO;
                                modelElements[j + iSubs - 1].toMZLoadO = modelElements[j].toMZLoadO;

                                modelElements[j].toFXRest = false;
                                modelElements[j].toFYRest = false;
                                modelElements[j].toFZRest = false;
                                modelElements[j].toMXRest = false;
                                modelElements[j].toMYRest = false;
                                modelElements[j].toMZRest = false;
                                modelElements[j].toFXMemb = false;
                                modelElements[j].toFYMemb = false;
                                modelElements[j].toFZMemb = false;
                                modelElements[j].toMXMemb = false;
                                modelElements[j].toMYMemb = false;
                                modelElements[j].toMZMemb = false;
                                modelElements[j].toFXLoad = 0.0;
                                modelElements[j].toFYLoad = 0.0;
                                modelElements[j].toFZLoad = 0.0;
                                modelElements[j].toMXLoad = 0.0;
                                modelElements[j].toMYLoad = 0.0;
                                modelElements[j].toMZLoad = 0.0;
                                modelElements[j].toFXLoadL = 0.0;
                                modelElements[j].toFYLoadL = 0.0;
                                modelElements[j].toFZLoadL = 0.0;
                                modelElements[j].toMXLoadL = 0.0;
                                modelElements[j].toMYLoadL = 0.0;
                                modelElements[j].toMZLoadL = 0.0;
                                modelElements[j].toFXLoadO = 0.0;
                                modelElements[j].toFYLoadO = 0.0;
                                modelElements[j].toFZLoadO = 0.0;
                                modelElements[j].toMXLoadO = 0.0;
                                modelElements[j].toMYLoadO = 0.0;
                                modelElements[j].toMZLoadO = 0.0;
                            }

                            totEls += (iSubs - 1);

                            var lastNode = modelElements[j].toNode;
              
                            for (var jj = j; jj <= j + iSubs - 1; jj++) {
              
                                if (jj != j) 
                                    modelElements[jj].fromNode = modelElements[jj - 1].toNode;
                                if (jj == j + iSubs - 1) 
                                    modelElements[jj].toNode = lastNode;
                                else 
                                    modelElements[jj].toNode = newNode1;

                                modelElements[jj].dX = dxx * lengths[jj - j][1];
                                modelElements[jj].dY = dyy * lengths[jj - j][1];
                                modelElements[jj].dZ = dzz * lengths[jj - j][1];

                                $.ajax({
                                    type: "POST",
                                    url: "./php/storeElement.php",
                                    data: {
                                        "userName": userName1,
                                        "jobName": jobName,
                                        "modelEl": modelElements[jj]
                                    },

                                    success: function(msg){
                                        //                                  alert(msg);
                                    }, // function
                                    error: function(msg){
                                        //                                  alert(msg);
                                    }, // function
                                    complete: function(msg){
                                        //                                  alert(msg);
                                    } // function
                                }); //ajax

                                if (jj != j) 
                                    coords[jj] = {x1:coords[jj-1].x2,y1:coords[jj-1].y2,z1:coords[jj-1].z2,
                                        x2:coords[jj-1].x2 + modelElements[jj].dX/uConstLength,y2:coords[jj-1].y2 + modelElements[jj].dY/uConstLength,z2:coords[jj-1].z2 + modelElements[jj].dZ/uConstLength};
                                else 
                                    coords[jj] = {x1:coords[jj].x1,y1:coords[jj].y1,z1:coords[jj].z1,
                                        x2:coords[jj].x1 + modelElements[jj].dX/uConstLength,y2:coords[jj].y1 + modelElements[jj].dY/uConstLength,z2:coords[jj].z1 + modelElements[jj].dZ/uConstLength};
                            }
                            //                          mergeNodes(ii, ii + iSubs - 1);

                        }
                    }  
                }
            }
            j++;
        }
        ii++;

        if( ii >= totEls )
            iTrue = 0;
    }
}

function newPopup(url) {
    popupWindow = window.open(
      url,'popUpWindow',
      'height=390,width=1000,left=10,top=10,resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,directories=no,status=yes')
}

function relMouseCoords(event) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = labelCanvas; // this;

    do {
        totalOffsetX += currentElement.offsetLeft /* - currentElement.scrollLeft  */;
        totalOffsetY += currentElement.offsetTop /* - currentElement.scrollTop  */;
    }
    while (currentElement = currentElement.offsetParent)

    //              canvasX = event.pageX - totalOffsetX;
    //              canvasY = event.pageY - totalOffsetY;
    canvasX = event.touches[0].x - totalOffsetX;
    canvasY = event.touches[0].y - totalOffsetY;

    return { x: canvasX, y: canvasY }
}

/* function relMouseCoords(event){
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;
  var currentElement = labelCanvas; // this;

  do{
    totalOffsetX += currentElement.offsetLeft  ;
    totalOffsetY += currentElement.offsetTop ;
  }
  while(currentElement = currentElement.offsetParent);

//              canvasX = event.pageX - totalOffsetX;
//              canvasY = event.pageY - totalOffsetY;
if( isMobile ) {
    canvasX = event.center.x - totalOffsetX;
    canvasY = event.center.y - totalOffsetY;
  }
  else {
    canvasX = event.touches[0].x - totalOffsetX;
    canvasY = event.touches[0].y - totalOffsetY;
  }
  return {x:canvasX, y:canvasY}
}
*/ 

function isPowerOfTwo(i) {
    return (2 * i == (i ^( i - 1)) + 1);
}

function panRight() {
    
    panFunct(new THREE.Vector3(-20,0,0));
}
function panLeft() {

    panFunct(new THREE.Vector3(20,0,0));
}
function panDown() {
    
    panFunct(new THREE.Vector3(0,20,0));
}
function panUp() {
    
    panFunct(new THREE.Vector3(0,-20,0));   
}

function panBack() {
    
    panFunct(new THREE.Vector3(0,0,20));
}

function panForward() {

    panFunct(new THREE.Vector3(0,0,-20));
}

function panFunct(vect) {
    var original = controls.userPanSpeed;
    controls.userPanSpeed = clickPanSpeed;
    controls.pan(vect);
    controls.userPanSpeed = original;
}

function rotateRight() {
    controls.rotateLeft(Math.PI/8);
}
function rotateLeft() {
    controls.rotateRight(Math.PI/8);
}
function rotateDown() {
    controls.rotateUp(Math.PI/8);
}
function rotateUp() {
    controls.rotateDown(Math.PI/8);
}

function smallModel() {
    bigJob = false;
    if (deformed) {
        deformed = false; // draw the original
        drawModel(false,false);
        deformed = true; // draw the deformed
    }
    drawModel(false,false);
}

function zoomOut() {
    if (camera.zoom > 1/3)
        camera.zoom -= 1/3;
    else
        camera.zoom -= camera.zoom/2;
    camera.updateProjectionMatrix();
    adjustSpriteZoom();
}

function zoomIn() {
    
    camera.zoom += 1/3;
    camera.updateProjectionMatrix();
    adjustSpriteZoom();
    
    //var original = controls.userPanSpeed;
    //controls.userPanSpeed = clickPanSpeed;
    //var panVect = new THREE.Vector3(0,0,-20)
    //controls.pan (panVect);
    //controls.userPanSpeed = original;
}

function t3DView() {
    /*change camera position to see the 3D view*/

    var t3Dpos = new THREE.Vector3( 100, 100, 100 );
    reinit_camera(t3Dpos);
    adjustSpriteZoom();
}

function xView() {
    //change the camera position to looking down x axis.
    
    var xPos = new THREE.Vector3(200,0,0);
    reinit_camera(xPos);
    adjustSpriteZoom();
}

function yView() {
    //change the camera position to looking down y axis
    var yPos = new THREE.Vector3(0,200,0);
    reinit_camera(yPos);
    adjustSpriteZoom();

}

function zView() {
    //Change the camera position to looking from z axis
    var zPos = new THREE.Vector3(0,0,200);
    reinit_camera(zPos);
    adjustSpriteZoom();
   
}

function toggleTexture() {
    isTextured = !isTextured;
    if (isTextured)
        $("#textureImage").attr("src", "assets/ico/ico_texture_2.png");
    else
        $("#textureImage").attr("src", "assets/ico/ico_texture.png");

    refreshElements();
    //if (deformed) {
    //    deformed = false; // draw the original
    //    drawModel(false, false);
    //    deformed = true; // draw the deformed
    //}
    //drawModel(false, false);
}

function addShadows() {
    /*add shadows to the objects in the scene
    floor receives shadows, elements cast them*/
    renderer.shadowMapEnabled = true;

    var allElements = scene.getObjectByName('allElements');
    allElements.castShadow = true;

    var floor = scene.getObjectByName('floor');
    floor.receiveShadow = true;

    light.castShadow = true;
    light.shadowDarkness = 0.5;
    light.showCameraVisible = true;


}

function removeShadows(){
    /*remove shadows when toggling away from showcase mode*/

    renderer.shadowMapEnabled = false;
    var allElements = scene.getObjectByName('allElements');
    allElements.castShadow = false;

    var floor = scene.getObjectByName('floor');
    floor.receiveShadow = true;

    light.castShadow = false;
}

var wasTextured, wasNodesOn, startTime;
function toggleShowcaseMode() {
    /*toggle the showcase mode*/    
    showcaseMode = !showcaseMode;
    if (showcaseMode) {

        wasTextured = true;    
        wasNodesOn = false;

        if (!isTextured){
            wasTextured = false;
            toggleTexture();
        }        
        if (nodesOn){
            wasNodesOn = true;
            toggleSprites();
        }
        //renderer.setClearColor ( 0x99ccff, 1 );
        renderer.setClearColor ( 0xffffff, 1 );
        removeFloor();
        addFloor(0xF5EBCC);
        addShadows();
        startTime = Date.now();
        initShowcaseCam();
        
    }
        //turning off showcase mode, return to previous conditions
    else{
        if (!wasTextured){
            toggleTexture();
        }
        if (wasNodesOn){
            toggleSprites();
        }
        renderer.setClearColor ( 0xffffff, 1);
        removeFloor();
        addFloor(0xf0f0f0);
        removeShadows();
        reinit_camera(initial_view);
    }
    
}

var parent;
function initShowcaseCam() {
    /*create perspective camera and firstpersoncontrols*/
    

    camera = new THREE.PerspectiveCamera( 70, width / height, 1, 10000 );
    
    //controls = new THREE.FirstPersonControls( camera, overlayCanvas );
    //controls.movementSpeed = 0;
    //controls.lookSpeed = 0.1;
    controls.object = camera;
}

function dynamicAnimation() {
    if (isStatic)
        return;
    if (isAnimated) {
        isAnimated = false;
        clearInterval(iAnimate);
        $("#animateImage").attr("src", "assets/ico/animate.png");
    }
    else {
        isAnimated = true;
        $("#animateImage").attr("src", "assets/ico/animate_2.png");
        deformed = false; // draw the original first
        
        if (!respondAnim){
            animations = [];
            //spriteAnimations = [];
            animCounter = 0;
            sFact1 = 6.0;
            xDel = -1.0;
            animCounter = 0;
            for (var p = 0; p < 11; p++){
                drawModel(false,false); //store 11 models into animation array
            }
        }
        
        iAnimate = self.setInterval(function () {
            animateModel();
        }, 200);
    }
}

function resetGraph() {

    bigJob = false;
    if (typeof bigTimer != 'undefined')
        window.clearTimeout(bigTimer);

    if (isAnimated) {
        isAnimated = false;
        $("#animateImage").attr("src", "assets/ico/animate.png");
        clearInterval(iAnimate);
    }

    if (stickFigure) {
        stickFigure = false;
        $("#stickFig").attr("src", "assets/ico/centerline.png");
    }

    isTextured = false;
    $("#textureImage").attr("src", "assets/ico/ico_texture.png");

    if (cColor){
        container1.removeChild(complianceCanvas);
        cColor = false;
    }

    drawMode = true;
    elSelectMode = true;
    nodSelectMode = true;
    gridMode = true;
    toggleDrawMode();
    toggleElSelectMode();
    toggleNodeSelectMode();
    toggleGridMode();
    ctrlKeyDown = false;

    elemMenu();

    reinit_camera(initial_view);
    deformed = false;
    drawModel(false,false);
}

function handleKeyUp(event){

    ctrlKeyDown = false;
    keyboard.shift = false;
    keyboard.ctrl = false;
}

function handleKeyDown(event) {

    // keys that are good any where

    ctrlKeyDown = event.ctrlKey;
    keyboard.ctrl = ctrlKeyDown;
    if (event.shiftKey) {
        keyboard.shift = true;
    }


    if( event.keyCode == 33 || event.keyCode == 34 || event.keyCode == 35 || event.keyCode == 36 ||
        (event.keyCode == 89 && event.ctrlKey) || (event.keyCode == 90 && event.ctrlKey)) {
        switch (event.keyCode) {
            case 33: // page up
                if (event.ctrlKey)
                    firstEl(true);
                else
                    prevEl(true);
                break;
            case 34: // page down
                if (event.ctrlKey)
                    lastEl(true);
                else
                    nextEl(true);
                break;
            case 35: // ctrl-end
                if (event.ctrlKey)
                    lastEl(true);
                else
                    return;
                break;
            case 36: // ctrl-home
                if (event.ctrlKey)
                    firstEl(true);
                else
                    return;
                break;
            case 89:
                if (event.ctrlKey)
                    redo();  // ctrl-y, redo
                else
                    return;
                break;
            case 90:
                if (event.ctrlKey)
                    undo();  // ctrl-z, undo
                else
                    return;
                break;
        }
        event.preventDefault();
        return;
    }

    // on canvas only

    if( lastDownTarget !== null ) {    //|| allGraphics
        //                if( lastDownTarget == null )
        //                  lastDownTarget = canvas;
        lastDownTarget = canvas;
        if (allGraphics && !inBoot ) {
            if (event.keyCode == 37 || event.keyCode == 38 || event.keyCode == 39 || event.keyCode == 40 ||
            event.keyCode == 51 ||
            event.keyCode == 65 ||
            event.keyCode == 68 ||
            event.keyCode == 69 ||
            event.keyCode == 78 ||
            event.keyCode == 80 ||
            event.keyCode == 81 ||
            event.keyCode == 82 ||
            event.keyCode == 83 ||
            event.keyCode == 84 ||
            event.keyCode == 85 ||
            event.keyCode == 86 ||
            event.keyCode == 87 ||
            event.keyCode == 88 ||
            event.keyCode == 89 ||
            event.keyCode == 90 ||
            event.keyCode == 107 ||
            event.keyCode == 109) 
                lastDownTarget = canvas;
        }

        if( lastDownTarget == canvas || lastDownTarget.tagName == "IMG" || lastDownTarget == labelCanvas) {
            if( event.keyCode == 37 || event.keyCode == 38 || event.keyCode == 39 || event.keyCode == 40 ||
                event.keyCode == 51 || event.keyCode == 65 || event.keyCode == 67 || event.keyCode == 68 || 
                event.keyCode == 69 ||
                event.keyCode == 78 || event.keyCode == 80 || event.keyCode == 81 || event.keyCode == 82 ||
                event.keyCode == 83 || event.keyCode == 84 || event.keyCode == 85 || event.keyCode == 86 ||
                event.keyCode == 87 || event.keyCode == 88 || event.keyCode == 89 || event.keyCode == 90 ||
                event.keyCode == 107 || event.keyCode == 109 ) {

                event.preventDefault();

                switch (event.keyCode) {
                    case 37: // left arrow
                        rotateLeft();
            
                        if (totEls > bigJobEls) {
                            bigJob = true;
                            if(typeof bigTimer != 'undefined')
                                window.clearTimeout(bigTimer);
                            bigTimer = setTimeout(smallModel, 1.4*totEls );
                        }

                        break;
                    case 38: // up arrow
                        rotateUp();

                        //if (totEls > bigJobEls) {
                        //  bigJob = true;
                        //  if(typeof bigTimer != 'undefined')
                        //    window.clearTimeout(bigTimer);
                        //    bigTimer = setTimeout(smallModel, 1.4*totEls );
                        //}

                        break;
                    case 39: // right arrow
                        rotateRight();

                        //if (totEls > bigJobEls) {
                        //  bigJob = true;
                        //  if(typeof bigTimer != 'undefined')
                        //    window.clearTimeout(bigTimer);
                        //    bigTimer = setTimeout(smallModel, 1.4*totEls );
                        //}

                        break;
                    case 40: // down arrow
                        rotateDown();

                        //if (totEls > bigJobEls) {
                        //  bigJob = true;
                        //  if(typeof bigTimer != 'undefined')
                        //    window.clearTimeout(bigTimer);
                        //    bigTimer = setTimeout(smallModel, 1.4*totEls );
                        //}

                        break;
                    case 51: // 3D
                        t3DView();
                        break;
                    case 81: // Toggle texture
                        isTextured = !isTextured;
                        if( isTextured )
                            $("#textureImage").attr("src","assets/ico/ico_texture_2.png");
                        else
                            $("#textureImage").attr("src","assets/ico/ico_texture.png");
                        break;
                    case 65: // A -- dynamic animation
                        dynamicAnimation();
                        return;  // ???
                        /*            if( isStatic )
                                      return;
                                    if (isAnimated) {
                                      isAnimated = false;
                                      $("#animateImage").attr("src","assets/ico/animate.png");
                                      clearInterval(iAnimate);
                                    }
                                    else {
                                      isAnimated = true;
                                      $("#animateImage").attr("src","assets/ico/animate_2.png");
                                      deformed = false; // draw the original
                                      cColor = false;
                                      iAnimate = self.setInterval(function(){
                                        drawModel(false,false)
                                      }, 100);
                                      return;
                                    }   */
                        break;

                    case 67: // C -- ctrl-key mode
                        if (nodSelectMode || elSelectMode) {
                            ctrlKeyMode = true;
                            if (ctrlKeyMode) {
                                $("#ctrlImage").attr("src", "assets/ico/ico_ctrl_2.png");
                            }
                            else 
                                $("#ctrlImage").attr("src", "assets/ico/ico_ctrl.png");
                        }
                        break;

                    case 68: // D -- turn on (not toggle) draw mode
                        if( !editRights )
                            return;
                        drawMode = false;
                        toggleDrawMode();

                        break;

                    case 69: // E -- turn on (not toggle) element select mode
                        elSelectMode = false;
                        toggleElSelectMode();

                        break;

                    case 78: // N -- turen on (not toggle) node select mode
                        nodSelectMode = false;
                        toggleNodeSelectMode();

                        break;
                    case 80: // P -- put into Pan mode (turn off draw, elem select, node select)
                        elSelectMode = true;
                        nodSelectMode = true;
                        drawMode =true;
                        toggleElSelectMode();
                        toggleNodeSelectMode();
                        toggleDrawMode();

                        break;
                    case 82: // R
                        panRight();
                        if (totEls > bigJobEls) {
                            bigJob = true;
                            if(typeof bigTimer != 'undefined')
                                window.clearTimeout(bigTimer);
                            bigTimer = setTimeout(smallModel, 1.4*totEls );
                        }

                        break;
                    case 83: // S
                        panLeft();
                        if (totEls > bigJobEls) {
                            bigJob = true;
                            if(typeof bigTimer != 'undefined')
                                window.clearTimeout(bigTimer);
                            bigTimer = setTimeout(smallModel, 1.4*totEls );
                        }

                        break;
                    case 84: // T
                        panUp();

                        if (totEls > bigJobEls) {
                            bigJob = true;
                            if(typeof bigTimer != 'undefined')
                                window.clearTimeout(bigTimer);
                            bigTimer = setTimeout(smallModel, 1.4*totEls );
                        }

                        break;
                    case 85: // U
                        panDown();
                        if (totEls > bigJobEls) {
                            bigJob = true;
                            if(typeof bigTimer != 'undefined')
                                window.clearTimeout(bigTimer);
                            bigTimer = setTimeout(smallModel, 1.4*totEls );
                        }

                        break;
                    case 86: // V
                        panForward();
                        if (totEls > bigJobEls) {
                            bigJob = true;
                            if(typeof bigTimer != 'undefined')
                                window.clearTimeout(bigTimer);
                            bigTimer = setTimeout(smallModel, 1.4*totEls );
                        }

                        break;
                    case 87: // W
                        panBack();

                        if (totEls > bigJobEls) {
                            bigJob = true;
                            if(typeof bigTimer != 'undefined')
                                window.clearTimeout(bigTimer);
                            bigTimer = setTimeout(smallModel, 1.4*totEls );
                        }

                        break;
                    case 88: // X
                        xView();
                        break;
                    case 89: // Y
                        yView();
                        break;
                    case 90: // Z
                        zView();
                        break;
                    case 107: // -
                        zoomIn();

                        break;
                    case 109: // +
                        zoomOut();

                        break;
                }
                /*        if (deformed) {
                          deformed = false; // draw the original
                          drawModel(false,false);
                          deformed = true; // draw the deformed
                        }  */
            }
        }
    }
}

// function Text file processing

var oNodeTable;
var oLCTable;
var oShTable;
var oOpTable;
var oMLTable;

var lMemTable;
var gMemTable;

var lMatTable;
var gMatTable;

var nEditing = null;

var cColors = [0];

function updateTable(txt, oTable) {
    var lines = txt.split("\r\n");
    for (var i = 0, len = lines.length; i < len-1; i++)
    {
        var row = lines[i].split(',');
        if( oTable == oTable4 ) {  // compliance, get the plot color
            cColors.push(parseInt(row[6]));
        }
        oTable.fnAddData(row);
    }
}

function updateMemberTable(txt, oTable, str) {
    var lines = txt.split("\r\n");
    for (var i = 0, len = lines.length; i < len-1; i++)
    {
        oTable.fnAddData([lines[i],str]);
    }
}

function editRow ( oTable, nRow, lSave, lLC )
{
    if( !editRights )
        return;
    
    var aData = oTable.fnGetData(nRow);
    var jqTds = $('>td', nRow);
    if (lLC == 0) {   
        jqTds[0].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter the node number corresponding to the fixed coordinates" value="' + aData[0] + '">';
        jqTds[1].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter the fixed X-coordinate of this node" value="' + aData[1] + '">';
        jqTds[2].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter the fixed Y-coordinate of this node" value="' + aData[2] + '">';
        jqTds[3].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter the fixed Z-coordinate of this node" value="' + aData[3] + '">';
        jqTds[4].innerHTML = '<a class="edit" href="" rel="tooltip" title="Click to save the data in this row" >Save</a>';
    
        if (lSave) {
            for (var i = 0; i < 4; i++) 
                aData1[i] = aData[i];
        }
    
    }
    if (lLC == 1) {
        jqTds[1].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter the Multiple for Self-Weight for this Load Case" value="' + aData[1] + '">';
        jqTds[2].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter the Multiple for Dead Loads for this Load Case" value="' + aData[2] + '">';
        jqTds[3].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter the Multiple for Live Loads for this Load Case" value="' + aData[3] + '">';
    
        jqTds[4].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter the Multiple for Occasional Loads for this Load Case" value="' + aData[4] + '">';
        jqTds[5].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter the AISC Code (ASD or LRFD) to be used for for this Load Case" value="' + aData[5] + '">';
        jqTds[6].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter whether non-linear P-Delta effects should be evaluated for this Load Case" value="' + aData[6] + '">';
        jqTds[7].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter (Yes, No) to specify whether Stiffness Reduction should be implemented for elements Contributing to Stability" value="' + aData[7] + '">';
        jqTds[8].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter the value, if any, by which to divide the factored loads for evaluating displacements (1.0 to leave as calculated)" value="' + aData[8] + '">';
        jqTds[9].innerHTML = '<input type="text" class ="input-mini" rel="tooltip" title="Enter (Yes, No) to specify whether warping effects should be calculated on open sections loaded with torsion" value="' + aData[9] + '">';
        jqTds[10].innerHTML = '<a class="edit" href="">Save</a>';

        if (lSave) {
            for (var i = 0; i < 10; i++)
                aData1[i] = aData[i];
        }
    }
    if (lLC == 2) {
    
        jqTds[0].innerHTML = '<input type="text" class ="input-medium lj shares" rel="tooltip" title="Enter Public, or the User Name with whom you would like to share this model" value="' + aData[0] + '">';
        jqTds[2].innerHTML = '<a class="edit" href="">Save</a>';

        $('.shares').typeahead({
            source: function(query, process) {
                return userList;
            },

            highlighter: function(item) {
                return item;
            },
        });

        if (lSave) {
            for (var i = 0; i < 1; i++) 
                aData1[i] = aData[i];
        }
        nRow1 = nRow;
    }
    oldlLC = lLC;
    oTable.fnAdjustColumnSizing(false);
}

function restoreRow(oTable, nRow, lLC){
    if (lLC == oldlLC) { // table hasn't changed, but row has
        oTable.fnUpdate(aData1[0], nRow, 0, false);
        if (lLC == 2) {
            oTable.fnUpdate('<a class="edit" href="">Edit</a>', nRow, 2, false);
        }
        else {
            oTable.fnUpdate(aData1[1], nRow, 1, false);
            oTable.fnUpdate(aData1[2], nRow, 2, false);
            oTable.fnUpdate(aData1[3], nRow, 3, false);
            if (lLC == 1) {
                oTable.fnUpdate(aData1[4], nRow, 4, false);
                oTable.fnUpdate(aData1[5], nRow, 5, false);
                oTable.fnUpdate(aData1[6], nRow, 6, false);
                oTable.fnUpdate(aData1[7], nRow, 7, false);
                oTable.fnUpdate(aData1[8], nRow, 8, false);
                oTable.fnUpdate(aData1[9], nRow, 9, false);
                oTable.fnUpdate('<a class="edit" href="">Edit</a>', nRow, 10, false);
            }
            else 
                oTable.fnUpdate('<a class="edit" href="">Edit</a>', nRow, 4, false);
        }
    }
}

function saveNodeRow ( oTable, nRow )
{
    if( !editRights )
        return;

    var jqInputs = $('input', nRow);
    var node = parseInt(jqInputs[0].value);
    var coord1 = parseFloat(jqInputs[1].value);
    var coord2 = parseFloat(jqInputs[2].value);
    var coord3 = parseFloat(jqInputs[3].value);

    if ((node != node) || isNaN(node) || isNaN(coord1) || isNaN(coord2) || isNaN(coord3)) {
        bootbox.alert("Invalid entry!");
    }
    else {

        oTable.fnUpdate(jqInputs[0].value, nRow, 0, false);
        oTable.fnUpdate(jqInputs[1].value, nRow, 1, false);
        oTable.fnUpdate(jqInputs[2].value, nRow, 2, false);
        oTable.fnUpdate(jqInputs[3].value, nRow, 3, false);
        oTable.fnUpdate('<a class="edit" href="">Edit</a>', nRow, 4, false);

        if ((aData1[0] != jqInputs[0].value) || (aData1[1] != jqInputs[1].value) ||
        (aData1[2] != jqInputs[2].value) || (aData1[3] != jqInputs[3].value)) {
            if (aData1[0] != jqInputs[0].value) {
                // we need to delete the old node's entry
                deleteNode(parseInt(aData1[0]));
            }

            var iNodes = oNodeTable.fnSettings().fnRecordsTotal();
            fNodes.length = [];

            for (var j = 0; j < iNodes; j++) {
                var aData = oNodeTable.fnGetData(j);
                node = parseInt(aData[0]);
                x = parseFloat(aData[1]);
                y = parseFloat(aData[2]);
                z = parseFloat(aData[3]);

                fNodes.push({
                    "node": node,
                    "x": x,
                    "y": y,
                    "z": z
                });
            }

            storeNode(parseInt(jqInputs[0].value), parseFloat(jqInputs[1].value), parseFloat(jqInputs[2].value),
                      parseFloat(jqInputs[3].value));
        }

        gridMode = true;
        $("#gridImage").attr("src","assets/ico/ico_grid_2.png");
    
        if (totEls == 0) {
            tN = parseInt($('#fromNode').val());
            if (isNaN(tN)) 
                tN = nodInc;
            tN += nodInc;
            tN = getNewNode(tN);
            $('#toNode').val(tN)
        }
    }
    oTable.fnDraw();
}

function saveMLRow(oTable, nRow){
}

function saveLCRow ( oTable, nRow )
{
    if( !editRights )
        return;

    var jqInputs = $('input', nRow);
    //              var LC = parseInt(jqInputs[0].value);
    var LC = nRow.rowIndex;
    var mult1 = parseFloat(jqInputs[0].value);
    var mult2 = parseFloat(jqInputs[1].value);
    var mult3 = parseFloat(jqInputs[2].value);
    var mult4 = parseFloat(jqInputs[3].value);
    var code = jqInputs[4].value.trim();
    if( code.charAt(0) == 'L' || code.charAt(0) == 'l')
        code = "LRFD";
    else //              if( code.charAt(0) == 'L' || code.charAt(0) == 'l')
        code = "ASD";
    var pDelta = jqInputs[5].value.trim();
    if( pDelta.charAt(0) == 'Y' || pDelta.charAt(0) == 'y')
        pDelta = "Yes";
    else //
        pDelta = "No";
    var redStiff = jqInputs[6].value.trim();
    if( redStiff.charAt(0) == 'Y' || redStiff.charAt(0) == 'y')
        redStiff = "Yes";
    else //
        redStiff = "No";
    var divBy = parseFloat(jqInputs[7].value);
    if( isNaN(divBy) )
        divBy = 1.0;
    var warpYN = jqInputs[8].value.trim();
    if( warpYN.charAt(0) == 'Y' || warpYN.charAt(0) == 'y')
        warpYN = "Yes";
    else //
        warpYN = "No";

    if (isNaN(mult1) || isNaN(mult2) || isNaN(mult3) || isNaN(mult4) || (code.trim() != "ASD" && code.trim() != "LRFD")) {
        bootbox.alert("Invalid entry!");
    }
    else {
        //                oTable.fnUpdate(jqInputs[0].value, nRow, 0, false);
        oTable.fnUpdate(jqInputs[0].value, nRow, 1, false);
        oTable.fnUpdate(jqInputs[1].value, nRow, 2, false);
        oTable.fnUpdate(jqInputs[2].value, nRow, 3, false);
        oTable.fnUpdate(jqInputs[3].value, nRow, 4, false);
        oTable.fnUpdate(code, nRow, 5, false);
        oTable.fnUpdate(pDelta, nRow, 6, false);
        oTable.fnUpdate(redStiff, nRow, 7, false);
        oTable.fnUpdate(divBy, nRow, 8, false);
        oTable.fnUpdate(warpYN, nRow, 9, false);
        oTable.fnUpdate('<a class="edit" href="">Edit</a>', nRow, 10, false);

        if ((aData1[1] != jqInputs[0].value) ||
         (aData1[2] != jqInputs[1].value) || (aData1[3] != jqInputs[2].value) || (aData1[4] != jqInputs[3].value) ||
         (aData1[5] != jqInputs[4].value) || (aData1[6] != jqInputs[5].value) || (aData1[7] != jqInputs[6].value) ||
         (aData1[8] != jqInputs[7].value) || (aData1[9] != jqInputs[8].value) )  {

            lCases[LC-1] = {"mult1":mult1,"mult2":mult2,"mult3":mult3,"mult4":mult4,"code":code, "pDelta":pDelta,
                "redStiff":redStiff, "divBy": divBy, "warpYN": warpYN };
            $.ajax({
                type: "POST",
                url: "./php/updateLoadCaseData.php",
                data: {"userName": userName1,
                    "jobName": jobName,
                    "loadCase": LC,
                    "weight": mult1,
                    "dead": mult2,
                    "live": mult3,
                    "occ": mult4,
                    "code": code,
                    "pDelta":pDelta,
                    "redStiff":redStiff,
                    "divBy": divBy,
                    "warpYN": warpYN },
                success: function(msg){
                    setUndo(3, 0 );
                },
                error: function(msg){
                    //                                alert(msg);
                }
            });
        }
    }
    oTable.fnDraw();
}

function saveShRow(oTable, nRow){

    if( !editRights )
        return;

    var jqInputs = $('input', nRow);
    if( !jqInputs[0].value.trim() ) {
        bootbox.alert("You must select a User Name (or 'Public') with whom to share this model.");
        return;
    }
    var LC = nRow.rowIndex;
    oTable.fnUpdate(jqInputs[0].value, nRow, 0, false);
    //              oTable.fnUpdate(jqInputs[1].value, nRow, 1, false);
    oTable.fnUpdate('<a class="edit" href="">Edit</a>', nRow, 2, false);

    var iShares = oShTable.fnSettings().fnRecordsTotal();

    var fShares = [];

    for (var j = 0; j < iShares; j++) {
        var aData = oShTable.fnGetData(j);
        user = aData[0].trim();
        permission = aData[1].trim();
        if( permission == 'Can View' )
            permission = 'View';

        fShares[j] = {
            "user": user,
            "permission": permission
        };
    }

    var param = { fSh: fShares };
    var fShare = JSON.stringify(param);

    $.ajax({
        type: "POST",
        url: "./php/updateShares.php",
        data: {"userName": userName,
            "jobName": jobName,
            "fShares": fShare
        },
        success: function(msg){
            setUndo(6, 0 );
        },
        error: function(msg){
        }
    });

    //              oTable.fnDraw();
}

function storeUnits ( )
{
    if( !editRights )
        return;

    var x1 = uConstForce.toString();
    var x2 = uConstLength.toString();
    var x3 = uConstMomOut.toString();
    var x4 = uConstStress.toString();
    var x5 = uConstUnif.toString();
    var x6 = uConstWeight.toString();

    $.ajax({
        type: "POST",
        url: "./php/storeUnits.php",
        data: {"userName": userName1,
            "jobName": jobName,
            "aaSet": currentUnits,
            "nameForce": uNameForce,
            "constForce": x1,
            "nameLength": uNameLength,
            "constLength": x2,
            "nameMomOut": uNameMomOut,
            "constMomOut": x3,
            "nameStress": uNameStress,
            "constStress": x4,
            "nameUnif": uNameUnif,
            "constUnif": x5,
            "nameWeight": uNameWeight,
            "constWeight": x6 },
        success: function(msg){
        },
        error: function(msg){
            bootbox.alert('failure: ' + msg);
        }
    });

}

function csvToArray( strData, strDelimiter ){

    // This will parse a delimited string into an array of
    // arrays. The default delimiter is the comma, but this
    // can be overriden in the second argument.

    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
          // Delimiters.
          "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

          // Quoted fields.
          "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

          // Standard fields.
          "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );

    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if ( strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter) ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );

        }

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            var strMatchedValue = arrMatches[ 2 ].replace( new RegExp( "\"\"", "g" ), "\"" );

        } else {

            // We found a non-quoted value.
            var strMatchedValue = arrMatches[ 3 ];
        }

        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return( arrData );
}

function displayUnitLabels(){
    $('.unitLen').text(uNameLength);
    var len4 = uNameLength + '^4';
    $('.unitLen4').text(len4);
    $('.unitUnif').text(uNameUnif);
    $('.unitFor').text(uNameForce);
    var mom4 = uNameLength + '-' + uNameForce;
    $('.unitMom').text(mom4);
    $('.unitStr').text(uNameStress);
};

// functions -- undo
function initUndo(screen, field){

    // use when switching jobs, stating a new job, or SavingAs

    //            deleteSQLQueue(-1);
    currentState = JSON.stringify({
        "jobName": jobName,
        "totEls": totEls,
        //                  "currElmt": currElmt,
        "fNodes" : fNodes,
        "lCases" : lCases,
        "modelElements": modelElements,
        //                  "selectionSet":selectionSet,
        "currentUnits": currentUnits,
        "jobNotes": jobNotes
    });
    undoQueue = [];
    undoQueue[0] = {"currentState": currentState, "screen":screen, "field":field, "currElmt": currElmt,
        "selectionSet":JSON.stringify(selectionSet), "nodSelectionSet": JSON.stringify(nodSelectionSet) };
    //            undoQueue.length = 1;
    undoLevel = 0;

    if (undoLevel <= 0) {
        $('#undo').addClass('disabled');
        $('#undo1').addClass('disabled');
        $('#undo2').addClass('disabled');
    }
    else {
        $('#undo').removeClass('disabled');
        $('#undo1').removeClass('disabled');
        $('#undo2').removeClass('disabled');
    }

    if (undoLevel >= undoQueue.length - 1) {
        $('#redo').addClass('disabled');
        $('#redo1').addClass('disabled');
        $('#redo2').addClass('disabled');
    }
    else {
        $('#redo').removeClass('disabled');
        $('#redo1').removeClass('disabled');
        $('#redo2').removeClass('disabled');
    }

}

function setUndo(screen, field ) {

    if( !editRights )
        return;

    var str = JSON.stringify({
        "jobName": jobName,
        "totEls": totEls,
        //              "currElmt": currElmt,
        "fNodes" : fNodes,
        "lCases" : lCases,
        "modelElements": modelElements,
        //              "selectionSet":selectionSet,
        "currentUnits": currentUnits,
        "jobNotes": jobNotes
    });

    if( undoLevel < 0 )
        initUndo(screen, field);
    else {
        var str = JSON.stringify({
            "jobName": jobName,
            "totEls": totEls,
            //              "currElmt": currElmt,
            "fNodes" : fNodes,
            "lCases" : lCases,
            "modelElements": modelElements,
            //              "selectionSet":selectionSet,
            "currentUnits": currentUnits,
            "jobNotes": jobNotes
        });
        var ii = str.localeCompare(undoQueue[undoLevel].currentState);
        if ( ii != 0 ) {

            undoLevel++;

            currentState = JSON.stringify({
                "jobName": jobName,
                "totEls": totEls,
                //                  "currElmt": currElmt,
                "fNodes" : fNodes,
                "lCases" : lCases,
                "modelElements": modelElements,
                //                  "selectionSet":selectionSet,
                "currentUnits": currentUnits,
                "jobNotes": jobNotes
            });
            undoQueue[undoLevel] = {"currentState": currentState, "screen":screen, "field":field, "currElmt": currElmt,
                "selectionSet":JSON.stringify(selectionSet), "nodSelectionSet":JSON.stringify(nodSelectionSet) };
            //                                      "sqlUpdateEl":uD1, "sqlUpdateNd":uD2, "sqlUpdateLC":uD3 };

            if (undoQueue.length > undoLevel + 1) {
                //                deleteSQLQueue(undoLevel);
                undoQueue.length = undoLevel + 1;
            }
        }
    };

    if (undoLevel <= 0) {
        $('#undo').addClass('disabled');
        $('#undo1').addClass('disabled');
        $('#undo2').addClass('disabled');
    }
    else {
        $('#undo').removeClass('disabled');
        $('#undo1').removeClass('disabled');
        $('#undo2').removeClass('disabled');
    }

    if (undoLevel >= undoQueue.length - 1) {
        $('#redo').addClass('disabled');
        $('#redo1').addClass('disabled');
        $('#redo2').addClass('disabled');
    }
    else {
        $('#redo').removeClass('disabled');
        $('#redo1').removeClass('disabled');
        $('#redo2').removeClass('disabled');
    }
}

function resetDownload(jobN){

    var dl;
    if( jobN != "Unnamed Job")
        dl = "./php/downLoadCC.php?jobName=" + jobN + "&userName=" + userName1;
    else
        dl = "./php/downLoadCC.php?jobName=Unnamed" + "&userName=" + userName1;

    $('#downloadJob').attr('href', dl);
    $('#downloadJob1').attr('href', dl);
    $('#downloadJob2').attr('href', dl);
}

function undoRedo() {
    currentState = JSON.parse(undoQueue[undoLevel].currentState);
    jobName = currentState.jobName;
    resetDownload(jobName);
    totEls = currentState.totEls;
    //            currElmt = currentState.currElmt;
    fNodes = currentState.fNodes;
    lCases = currentState.lCases;
    currElmt = undoQueue[undoLevel].currElmt;
    modelElements = currentState.modelElements;
    //            selectionSet = currentState.selectionSet;
    selectionSet = JSON.parse(undoQueue[undoLevel].selectionSet);
    nodSelectionSet = JSON.parse(undoQueue[undoLevel].nodSelectionSet);
    if (currentUnits != currentState.currentUnits) {
        currentUnits = currentState.currentUnits;
        setUnits(currentUnits, true, false );
        displayUnitLabels();
    }
    if( jobNotes != currentState.jobNotes ) {
        jobNotes = currentState.jobNotes;
        putNotes(false);
        $('#jobDesc').val(jobNotes);
    }

    var screen = undoQueue[undoLevel].screen;
    var field = undoQueue[undoLevel].field;

    var modelElement = JSON.stringify(modelElements);

    $.ajax({
        type: "POST",
        url: "./php/storeAllElements.php",
        data: { "userName": userName1, "jobName": jobName, "modelElements": modelElement },
        success: function(msg){
            //                 alert(msg);
        }
    });

    var lCase = JSON.stringify(lCases);

    $.ajax({
        type: "POST",
        url: "./php/storeAllLoadCases.php",
        data: { "userName": userName1, "jobName": jobName, "lCases": lCase },
        success: function(msg){
            //                 alert(msg);
        },
        error: function(msg){
            //                 alert(msg);
        }
    });

    var fNode = JSON.stringify(fNodes);

    $.ajax({
        type: "POST",
        url: "./php/storeAllNodes.php",
        data: { "userName": userName1, "jobName": jobName, "fNodes": fNode },
        success: function(msg){
            //                 alert(msg);
        }
    });

    storeUnits();

    setJobName(jobName);
    oNodeTable.fnClearTable();
    oNodeTable.fnSort([]);;

    for (var i = 0; i < fNodes.length; i++)
        oNodeTable.fnAddData([fNodes[i].node, fNodes[i].x, fNodes[i].y, fNodes[i].z, '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>','<a class="duplicate" href="">Array</a>' ]);

    oLCTable.fnClearTable();
    oLCTable.fnSort([]);

    for (var i = 0; i < lCases.length; i++)
        oLCTable.fnAddData([i+1, lCases[i].mult1, lCases[i].mult2, lCases[i].mult3, lCases[i].mult4, lCases[i].code,
                            lCases[i].pDelta, lCases[i].redStiff, lCases[i].divBy, lCases[i].warpYN,  '<a class="edit" href="">Edit</a>',
                            '<a class="delete" href="">Delete</a>']);

    oShTable.fnClearTable();
    oShTable.fnSort([]);

    for (var i = 0; i < lShares.length; i++)
        oShTable.fnAddData([lShares[i].user, lShares[i].permission, '<a class="edit" href="">Edit</a>',
                            '<a class="delete" href="">Delete</a>']);

    displayElement(currElmt);

    onModelingScreen = false;
    switch (screen) {
        case 1 :     // modeling screen
            showScreen("inputScreen");
            onModelingScreen = true;
            switch (field) {
                default: break;
            }
            break;
        case 2 :     // nodes screen
            showScreen("nodalCoords");
            switch (field) {
                default: break;
            }
            break;
        case 3 :     // load cases
            showScreen("loadCaseBuilder");
            switch (field) {
                default: break;
            }
            break;
        case 4 :     // load cases
            showScreen("modelListView");
            switch (field) {
                default: break;
            }
            break;
        case 5 :     // desc/notes
            showScreen("inputDescr");
            switch (field) {
                default: break;
            }
            break;
        case 6 :     // nodes screen
            showScreen("collaborate");
            switch (field) {
                default: break;
            }
            break;
    }
    deformed = false;
    cColor = false;
    drawModel(false,true);

    if (undoLevel == 0) {
        $('#undo').addClass('disabled');
        $('#undo1').addClass('disabled');
        $('#undo2').addClass('disabled');
    }
    else {
        $('#undo').removeClass('disabled');
        $('#undo1').removeClass('disabled');
        $('#undo2').removeClass('disabled');
    }
    if (undoLevel >= undoQueue.length - 1) {
        $('#redo').addClass('disabled');
        $('#redo1').addClass('disabled');
        $('#redo2').addClass('disabled');
    }
    else {
        $('#redo').removeClass('disabled');
        $('#redo1').removeClass('disabled');
        $('#redo2').removeClass('disabled');
    }
}

function undo() {
    if( undoLevel > 0 ) {
        undoLevel--;
        undoRedo();
    }
}

function redo() {
    if( undoLevel < undoQueue.length-1 ) {
        undoLevel++;
        undoRedo();
    }
}

function setUnits(unitName, notX, yesX ){
    if (notX) {
        if (unitName == 'English-1') {
            uNameLength = 'in';
            uConstLength = 1.0;
            uNameWeight = 'lb';
            uConstWeight = 1.0;
            uNameForce = 'lb';
            uConstForce = 1.0;
            uNameUnif = 'lb/in';
            uConstUnif = 1.0;
            uNameStress = 'psi';
            uConstStress = 1.0;
            uNameMomOut = 'ft-lb';
            uConstMomOut = 1.0 / 12.0;
        }
        else
            if (unitName == 'English-2') {
                uNameLength = 'ft';
                uConstLength = 1.0 / 12.0;
                uNameWeight = 'kip';
                uConstWeight = 1.0 / 1000.0;
                uNameForce = 'kip';
                uConstForce = 1.0 / 1000.0;
                uNameUnif = 'kip/ft';
                uConstUnif = 12.0 / 1000.0;
                uNameStress = 'ksi';
                uConstStress = 1.0 / 1000.0;
                uNameMomOut = 'ft-kip';
                uConstMomOut = 1.0 / 12000.0;
            }
            else
                if (unitName == 'Metric-1') {
                    uNameLength = 'cm';
                    uConstLength = 2.54;
                    uNameWeight = 'N';
                    uConstWeight = 4.448221628254617;
                    uNameForce = 'N';
                    uConstForce = 4.448221628254617;
                    uNameUnif = 'N/cm';
                    uConstUnif = 1.751268357580558;
                    uNameStress = 'mPa';
                    uConstStress = 1.0 / 145.037738007;
                    uNameMomOut = 'm-N';
                    uConstMomOut = 0.1129848293576673;
                }
                else
                    if (unitName == 'Metric-2') {
                        uNameLength = 'm';
                        uConstLength = 0.0254;
                        uNameWeight = 'kg';
                        uConstWeight = 0.4535923699997481;
                        uNameForce = 'kg-f';
                        uConstForce = 0.4535923699997481;
                        uNameUnif = 'kg/m';
                        uConstUnif = 17.85796732282473;
                        uNameStress = 'kg/mm2';
                        uConstStress = 0.000703;
                        uNameMomOut = 'm-N';
                        uConstMomOut = 0.1129848293576673;
                    }
    }
  
    if (yesX) {
        if (unitName == 'English-1') {
            uNameLengthX = 'in';
            uConstLengthX = 1.0;
            uNameWeightX = 'lb';
            uConstWeightX = 1.0;
            uNameForceX = 'lb';
            uConstForceX = 1.0;
            uNameUnifX = 'lb/in';
            uConstUnifX = 1.0;
            uNameStressX = 'psi';
            uConstStressX = 1.0;
            uNameMomOutX = 'ft-lb';
            uConstMomOutX = 1.0 / 12.0;
        }
        else
            if (unitName == 'English-2') {
                uNameLengthX = 'ft';
                uConstLengthX = 1.0 / 12.0;
                uNameWeightX = 'kip';
                uConstWeightX = 1.0 / 1000.0;
                uNameForceX = 'kip';
                uConstForceX = 1.0 / 1000.0;
                uNameUnifX = 'kip/ft';
                uConstUnifX = 12.0 / 1000.0;
                uNameStressX = 'ksi';
                uConstStressX = 1.0 / 1000.0;
                uNameMomOutX = 'ft-kip';
                uConstMomOutX = 1.0 / 12000.0;
            }
            else
                if (unitName == 'Metric-1') {
                    uNameLengthX = 'cm';
                    uConstLengthX = 2.54;
                    uNameWeightX = 'N';
                    uConstWeightX = 4.448221628254617;
                    uNameForceX = 'N';
                    uConstForceX = 4.448221628254617;
                    uNameUnifX = 'N/cm';
                    uConstUnifX = 1.751268357580558;
                    uNameStressX = 'mPa';
                    uConstStressX = 1.0 / 145.037738007;
                    uNameMomOutX = 'm-N';
                    uConstMomOutX = 0.1129848293576673;
                }
                else
                    if (unitName == 'Metric-2') {
                        uNameLengthX = 'm';
                        uConstLengthX = 0.0254;
                        uNameWeightX = 'kg';
                        uConstWeightX = 0.4535923699997481;
                        uNameForceX = 'kg-f';
                        uConstForceX = 0.4535923699997481;
                        uNameUnifX = 'kg/m';
                        uConstUnifX = 17.85796732282473;
                        uNameStressX = 'kg/mm2';
                        uConstStressX = 0.000703;
                        uNameMomOutX = 'm-N';
                        uConstMomOutX = 0.1129848293576673;
                    }
    }

}

function isAColumnG(modelElement ) {
    return ((modelElement.dX == 0.0) && (modelElement.dZ == 0.0) && (modelElement.dY != 0.0));
}

function isAColumn(modelElement ) {
    if( modelElement.group ) {
        var gp = JSON.parse(modelElement.group);
        for (var i = 0; i < gp.length; i++) {
            if (gp[i].name == "Column") 
                return true;
        }
  
        for (var i = 0; i < gp.length; i++) {
            if ( gp[i].name == "Beam" )
                return false;
            if ( gp[i].name == "Brace" )
                return false;
        }
    }

    return ((modelElement.dX == 0.0) && (modelElement.dZ == 0.0) && (modelElement.dY != 0.0));
}

function isABeam(modelElement) {
    if( modelElement.group ) {
        var gp = JSON.parse(modelElement.group);
        for (var i = 0; i < gp.length; i++) {
            if (gp[i].name == "Beam") 
                return true;
        }
  
        for (var i = 0; i < gp.length; i++) {
            if ( gp[i].name == "Column" )
                return false;
            if ( gp[i].name == "Brace" )
                return false;
        }
    }
    return ((modelElement.dX != 0.0 || modelElement.dZ != 0.0) && (modelElement.dY == 0.0));
}

function isABrace(modelElement) {
    if( modelElement.group ) {
        var gp = JSON.parse(modelElement.group);
        for (var i = 0; i < gp.length; i++) {
            if (gp[i].name == "Brace") 
                return true;
        }
  
        for (var i = 0; i < gp.length; i++) {
            if ( gp[i].name == "Column" )
                return false;
            if ( gp[i].name == "Beam" )
                return false;
        }
    }
    return ((modelElement.dX != 0.0 || modelElement.dZ != 0.0) && (modelElement.dY != 0.0));
}

// functions -- language

function translate( english ){
    if (!(english in ccStrings))
        return english;
    else {
        var str = ccStrings[english];
        if (str.length > 0)
            return str;
        else
            return english;
    }
}

function convertLanguage(){
    //             $('#slogan').html(translate("<h3>Structural Analysis in the Cloud</h3>"));
    //             $('#slogan1').html(translate("Structural Analysis in the Cloud"));
    $('#inputMenu').html(translate("Input<b class='caret'></b>"));
    $('#analysisMenu').html(translate("Analysis<b class='caret'></b>"));
    $('#outputMenu').html(translate("Output<b class='caret'></b>"));
    $('#toolsMenu').html(translate("Tools<b class='caret'></b>"));
    $('#helpMenu').html(translate("Help<b class='caret'></b>"));
    $('#fileHead').text(translate("File"));
    $('#newJob').html(translate("<i class='icon-file'></i>New"));
    $('#openJob').html(translate("<i class='icon-folder-open'></i>Open"));
    $('#saveAs').html(translate("<i class='icon-ok-sign'></i>SaveAs"));
    $('#uploadJob').html(translate("<i class='icon-upload'></i>Upload"));
    $('#downloadJob').html(translate("<i class='icon-download'></i>Download"));
    if( chinese )
        $("#elemPos").text(" "+currElmt+"/"+totEls+" "+translate("Element "));
    else
        $('#elemPos').text(translate("Element ")+currElmt+"/"+totEls);
    $('#firstEl').html(translate("<i class='icon-fast-backward'></i>First"));
    $('#prevEl').html(translate("<i class='icon-step-backward'></i>Prev"));
    $('#nextEl').html(translate("<i class='icon-step-forward'></i>Next"));
    $('#lastEl').html(translate("<i class='icon-fast-forward'></i>Last"));
    $('#newEl').html(translate("<i class='icon-plus'></i>New"));
    $('#findEl').html(translate("<i class='icon-search'></i>Find"));
    $('#editHead').text(translate("Edit"));
    $('#insertEl').html(translate("<i class='icon-chevron-right'></i>Insert"));
    $('#deleteEl').html(translate("<i class='icon-trash'></i>Delete"));
    $('#undo').html(translate("<img src='assets/ico/ico_undo.png' alt='Undo'>Undo"));
    $('#redo').html(translate("<img src='assets/ico/ico_redo.png' alt='Redo'>Redo"));
    $('#fromLabel').html(translate("From:"));
    $('#toLabel').html(translate("To:"));
    $('#memberLabel').html(translate("Member Type:"));
    $('#betaLabel').html(translate("Beta Angle:"));
    $('#materialLabel').html(translate("Material:"));
    $('#releaseLabel').html(translate("Member Releases"));
    $('#relFromLabel').html(translate("Releases From:"));
    $('#relToLabel').html(translate("Releases To:"));
    $('#restraintLabel').html(translate("Restraints"));
    $('#restFromLabel').html(translate("Restraints From:"));
    $('#restToLabel').html(translate("Restraints To:"));
    $('#uniformLabel').html(translate("Uniform Loads"));
    $('#concentratedLabel').html(translate("Concentrated Loads"));
    $('#concFromLabel').html(translate("From:"));
    $('#concToLabel').html(translate("To:"));
}

function convertToForeignLanguage(data) {
    ccStrings = data;
    convertLanguage();
}


function convertToEnglish() {
    ccStrings = [];
    chinese = false;
    convertLanguage();
}

function convertToChinese() {
    chinese = true;
    $.getJSON('data/chinese.json',convertToForeignLanguage);

}

function convertToSpanish() {
    chinese = false;
    $.getJSON('data/spanish.json',convertToForeignLanguage);
}

// functions -- report, PDF

// Because of security restrictions, getImageFromUrl will
// not load images from other domains.  Chrome has added
// security restrictions that prevent it from loading images
// when running local files.  Run with: chromium --allow-file-access-from-files --allow-file-access
// to temporarily get around this issue.

var getImageFromUrl = function(url, callback) {
    var img = new Image, data, ret={data: null, pending: true};

    img.onError = function() {
        throw new Error('Cannot load image: "'+url+'"');
    }
    img.onload = function() {
        var canvasPDF = document.createElement('canvas');
        document.body.appendChild(canvasPDF);

        canvasPDF.width = img.width;
        canvasPDF.height = img.height;

        var ctx = canvasPDF.getContext('2d');
        ctx.drawImage(img, 0, 0);
        // Grab the image as a jpeg encoded in base64, but only the data
        data = canvasPDF.toDataURL('image/jpeg').slice('data:image/jpeg;base64,'.length);
        // Convert the data to binary form
        data = atob(data)
        document.body.removeChild(canvasPDF);

        ret['data'] = data;
        ret['pending'] = false;
        if (typeof callback === 'function') {
            callback(data);
        }
    }
    img.src = url;

    return ret;
}

function stringy(group) {
  
    var str = "";

    if( group ) {
        var gp = JSON.parse(group);
    
        for (var i=0; i<gp.length; i++) {
            str += gp[i].name;
            if( i < gp.length-1 ) {
                str += ";";
            }
        }
    }
    return str;
}

// Since images are loaded asyncronously, we must wait to create
// the pdf until we actually have the image data.
// If we already had the jpeg image binary data loaded into
// a string, we create the pdf without delay.
var createPDF = function(imgData) {

    var data;

    var TC = [];
    var str = "";
    var str1 = "";
    var str2 = "";

    var iPage = 1;
    var iRept = 0;


    function formatNumber(num,dec,width,thou,pnt,n1,n2,curr1,curr2) {

        // number formatting function
        // copyright Stephen Chapman 24th March 2006, 10th February 2007
        // permission to use this function is granted provided
        // that this copyright notice is retained intact

        var x = Math.round(num * Math.pow(10,dec));
        if (x >= 0) n1=n2='';

        var y = (''+Math.abs(x)).split('');
        var z = y.length - dec;

        if (z<0) z--;

        for(var i = z; i < 0; i++)
            y.unshift('0');

        y.splice(z, 0, pnt);
        if(y[0] == pnt) y.unshift('0');

        while (z > 3)
        {
            z-=3;
            y.splice(z,0,thou);
        }

        var r = curr1+n1+y.join('')+n2+curr2;

        if (width > 0) {
            var str = "";

            for (var i = 0; i < width - r.length - 1; i++)
                str += ' ';
            r = str + r;
        }

        return r;
    }


    function convReleases(fx,fy,fz,mx,my,mz,lower) {
        var str = "";

        if( fx )
            str += 'FX/';
        if( fy )
            str += 'FY/';
        if( fz )
            str += 'FZ/';
        if( mx )
            str += 'MX/';
        if( my )
            str += 'MY/';
        if( mz )
            str += 'MZ/';

        if( lower )
            str = str.toLowerCase();
        str = str.substr(0,str.length-1);
        return str;

    }

    function wordWrap(str, width, iLines, notBeyond, brk, cut){

        function nth_occurrence (strin, cha, nth) {
            var first_index = strin.indexOf(cha);
            var length_up_to_first_index = first_index + 1;

            if (nth == 1) {
                return first_index;
            }
            else {
                var string_after_first_occurrence = strin.slice(length_up_to_first_index);
                var next_occurrence = nth_occurrence(string_after_first_occurrence, cha, nth - 1);

                if (next_occurrence === -1) {
                    return -1;
                } else {
                    return length_up_to_first_index + next_occurrence;
                }
            }
        }

        brk = brk || '\n';
        width = width || 75;
        notBeyond = notBeyond || false;
        cut = cut || false;

        if (!str) {
            return str;
        }

        var regex = '.{1,' + width + '}(\\s|$)' + (cut ? '|.{' + width + '}|.+$' : '|\\S+?(\\s|$)');

        var strM;
        if( notBeyond ) {
            strM = str.substr(0,width+2);
            strM = strM.match(RegExp(regex, 'g')).join(brk);
            if( strM.trim() != str.trim() )
                strM = strM + str.substr(strM.length-1);
        }
        else
            strM = str.match(RegExp(regex, 'g')).join(brk);

        var i = nth_occurrence(strM, "\n", iLines);

        if (i == -1) {
            str1 = strM;
            str2 = "";
        }
        else {
            str1 = strM.substr(0, i - 1);
            str2 = strM.substr(i + 1);
        }
    }

    var doc = new jsPDF();

    doc.addImage(imgData, 'JPEG', 10, 10, 132, 54);

    doc.setFont("courier");
    doc.setFontSize(20);
    doc.text(20, 80, 'Project Name: ' + jobName);
    doc.text(20, 90, 'Engineer:     ' + userName1);
    doc.text(20, 100, 'Checked By:   __________');

    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();

    if(dd<10)
    {dd='0'+dd}
    if(mm<10)
    {mm='0'+mm}
    today = mm+'/'+dd+'/'+yyyy;
    doc.text(20, 110, 'Date:         ' + today);

    doc.text(20, 130, 'Structural Analysis Calculations of Record');

    var canvasCapture = document.getElementById("modelGraphics");
    var width = canvasCapture.width;
    var height = canvasCapture.height;

    data = canvasCapture.toDataURL('image/jpeg').slice('data:image/jpeg;base64,'.length);

    // Convert the data to binary form
    data = atob(data)

    var vScale = 54 / height;
    var hScale = 122 / width;
    if( vScale > hScale )
        vScale = hScale;

    var horDist = vScale * width;
    var hStart = 66 - horDist / 2;
    //              var hEnd = hStart + horDist;
    doc.addImage(data, 'JPEG', hStart, 150, horDist, vScale*height);

    doc.setFontSize(20);
    doc.text(20, 220, 'Job Description/Notes:');

    wordWrap( jobNotes, 65, 12, false );

    doc.setFontSize(12);
    doc.text(20, 230, str1);

    while (str2.length != 0) {
        doc.addPage();
        iPage++;
        doc.setFontSize(10);
        doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

        doc.setFontSize(20);
        doc.text(20, 30, 'Job Description/Notes (continued):');

        wordWrap(str2, 65, 40, false);

        doc.setFontSize(12);
        doc.text(20, 42, str1);
    }

    // input echo here

    doc.addPage();
    iPage++;
    doc.setFontSize(10);
    doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

    doc.setFontSize(18);

    str = 'Summary of Input Data';
    TC[iRept] = [str,iPage];
    iRept++;

    str = 'Summary of Input Data -- Nodal Coordinates';
    doc.text(15, 35, str);
    doc.setFontSize(12);
    doc.text(15, 45, '   Node            CX                CY                CZ');
    doc.text(15, 50, '---------------------------------------------------------------');

    var iNodes = oNodeTable.fnSettings().fnRecordsTotal();

    fNodes.length = [];

    for (var j = 0; j < iNodes; j++) {
        var aData = oNodeTable.fnGetData(j);
        node = parseInt(aData[0]);
        x = parseFloat(aData[1]);
        y = parseFloat(aData[2]);
        z = parseFloat(aData[3]);

        fNodes.push({
            "node": node,
            "x": x,
            "y": y,
            "z": z
        });
    }

    var i = 1;
    var j1 = 0;

    if( iNodes == 0 )
        doc.text(15, 57, ' None');
    else {

        for (i=0; i<iNodes; i++ ) {
            str = "";
            var str1 = " " + fNodes[i].node;

            for (var i1=0;i1<7-str1.length;i1++)
                str += ' ';
            str += str1;

            str1 = formatNumber(fNodes[i].x,3,17,'','.','-','','','');
            str += str1;

            str1 = formatNumber(fNodes[i].y,3,17,'','.','-','','','');
            str += str1;

            str1 = formatNumber(fNodes[i].z,3,17,'','.','-','','','');
            str += str1;

            if( i - j1 >= 30 ) {
                doc.addPage();
                iPage++;
                j1+=30;
                doc.setFontSize(10);
                doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

                doc.setFontSize(18);
                str = 'Summary of Input Data -- Nodal Coordinates (continued)';
                doc.text(15, 35, str);
                doc.setFontSize(12);
                doc.text(15, 45, '   Node             CX               CY               CZ');
                doc.text(15, 50, '---------------------------------------------------------------');
            }
            doc.text(15, 57+(i-j1)*5, str );
        }
    }

    i++;
    var iLine;

    str = 'Summary of Input Data -- Element Data';
    if (i - j1 >= 27) {
        doc.addPage();
        iPage++;
        j1 += 30;
        doc.setFontSize(10);
        doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);
        doc.setFontSize(18);
        doc.text(15, 35, str);
        doc.setFontSize(12);
        doc.text(15, 45, ' From Node  To Node');
        doc.text(15, 50, '---------------------------------------------------------------');
        iLine = 0;

    }
    else {
        i++;
        doc.setFontSize(18);
        doc.text(15, 57+(i-j1)*5, str);
        i++;
        doc.setFontSize(12);
        doc.text(15, 57+(i-j1)*5, 'From Node  To Node');
        i++;
        doc.text(15, 57+(i-j1)*5, '---------------------------------------------------------------');
        iLine = i - j1 + 2;
    }

    for (var j = 1; j <= totEls; j++) {
        str2 = formatNumber(modelElements[j].fromNode,0,9,'','','-','','','');
        str2 += formatNumber(modelElements[j].toNode,0,9,'','','-','','','');
        if( modelElements[j].dX != 0.0 )
            str2 = str2 + '  DX=' + formatNumber(modelElements[j].dX,3,0,'','.','-','','','');
        if( modelElements[j].dY != 0.0 )
            str2 = str2 + '  DY=' + formatNumber(modelElements[j].dY,3,0,'','.','-','','','');
        if( modelElements[j].dZ != 0.0 )
            str2 = str2 + '  DZ=' + formatNumber(modelElements[j].dZ,3,0,'','.','-','','','');
        if( (j==1) || (modelElements[j].memberType != modelElements[j-1].memberType ) )
            str2 = str2 + '  Member=' + modelElements[j].memberType;

        if( ((j==1) || (modelElements[j].memberType != modelElements[j-1].memberType) || 
              (modelElements[j].pipOD != modelElements[j-1].pipOD )) && ( modelElements[j].memberType == 'PipeCustom' ))
            str2 = str2 + '  PipeOD=' + modelElements[j].pipOD;

        if( ((j==1) || (modelElements[j].memberType != modelElements[j-1].memberType) || 
              (modelElements[j].pipTh != modelElements[j-1].pipTh )) && ( modelElements[j].memberType == 'PipeCustom' ))
            str2 = str2 + '  PipeTh=' + modelElements[j].pipTh;

        if( modelElements[j].betaAngle != 0.0 )
            str2 = str2 + '  Beta=' + formatNumber(modelElements[j].betaAngle,1,0,'','.','-','','','');
        if( (j==1) || (modelElements[j].material != modelElements[j-1].material ) ) 
            str2 = str2 + '  Material=' + modelElements[j].material;

        if( modelElements[j].fromFXMemb || modelElements[j].fromFYMemb || modelElements[j].fromFZMemb ||
            modelElements[j].fromMXMemb || modelElements[j].fromMYMemb || modelElements[j].fromMZMemb )
            str2 = str2 + '  Member Releases (From Node)=' + convReleases(modelElements[j].fromFXMemb,
              modelElements[j].fromFYMemb, modelElements[j].fromFZMemb, modelElements[j].fromMXMemb,
              modelElements[j].fromMYMemb, modelElements[j].fromMZMemb,true);
        if( modelElements[j].toFXMemb || modelElements[j].toFYMemb || modelElements[j].toFZMemb ||
            modelElements[j].toMXMemb || modelElements[j].toMYMemb || modelElements[j].toMZMemb )
            str2 = str2 + '  Member Releases (To Node)=' + convReleases(modelElements[j].toFXMemb,
              modelElements[j].toFYMemb, modelElements[j].toFZMemb, modelElements[j].toMXMemb,
              modelElements[j].toMYMemb, modelElements[j].toMZMemb,true);

        if( modelElements[j].fromFXRest || modelElements[j].fromFYRest || modelElements[j].fromFZRest ||
            modelElements[j].fromMXRest || modelElements[j].fromMYRest || modelElements[j].fromMZRest )
            str2 = str2 + '  Restraints (From Node)=' + convReleases(modelElements[j].fromFXRest,
              modelElements[j].fromFYRest, modelElements[j].fromFZRest, modelElements[j].fromMXRest,
              modelElements[j].fromMYRest, modelElements[j].fromMZRest,false);

        if( modelElements[j].toFXRest || modelElements[j].toFYRest || modelElements[j].toFZRest ||
            modelElements[j].toMXRest || modelElements[j].toMYRest || modelElements[j].toMZRest )
            str2 = str2 + '  Restraints (To Node)=' + convReleases(modelElements[j].toFXRest,
              modelElements[j].toFYRest, modelElements[j].toFZRest, modelElements[j].toMXRest,
              modelElements[j].toMYRest, modelElements[j].toMZRest,false);

        if( modelElements[j].lX > 0.0 )
            str2 = str2 + '  lx=' + formatNumber(modelElements[j].lX,2,0,'','.','-','','','');
        if( modelElements[j].lY > 0.0 )
            str2 = str2 + '  ly=' + formatNumber(modelElements[j].lY,2,0,'','.','-','','','');
        if( modelElements[j].lZ > 0.0 )
            str2 = str2 + '  lz=' + formatNumber(modelElements[j].lZ,2,0,'','.','-','','','');

        if( modelElements[j].kX > 0.0 )
            str2 = str2 + '  kx=' + formatNumber(modelElements[j].kX,2,0,'','.','-','','','');
        if( modelElements[j].kY > 0.0 )
            str2 = str2 + '  ky=' + formatNumber(modelElements[j].kY,2,0,'','.','-','','','');
        if( modelElements[j].kZ > 0.0 )
            str2 = str2 + '  kz=' + formatNumber(modelElements[j].kZ,2,0,'','.','-','','','');

        if( modelElements[j].cBZ > 0.0 )
            str2 = str2 + '  CB-x=' + formatNumber(modelElements[j].cBZ,3,0,'','.','-','','','');
        if( modelElements[j].cBY > 0.0 )
            str2 = str2 + '  CB-y=' + formatNumber(modelElements[j].cBY,3,0,'','.','-','','','');
        if( modelElements[j].stable )
            str2 = str2 + '  Contributes to Stability=Yes';

        if( modelElements[j].stiffDist > 0.0 )
            str2 = str2 + '  Distance Between Stiffeners=' + formatNumber(modelElements[j].stiffDist,2,0,'','.','-','','','');
        if( modelElements[j].stiffI > 0.0 )
            str2 = str2 + '  Stiffener Mom of Inertia=' + formatNumber(modelElements[j].stiffI,2,0,'','.','-','','','');
        if( modelElements[j].tfaStiff )
            str2 = str2 + '  Allow Tension Field Action=Yes';

        if( modelElements[j].uX != 0.0 )
            str2 = str2 + '  UX (Dead)=' + formatNumber(modelElements[j].uX,2,0,'','.','-','','','');
        if( modelElements[j].uY != 0.0 )
            str2 = str2 + '  UY (Dead)=' + formatNumber(modelElements[j].uY,2,0,'','.','-','','','');
        if( modelElements[j].uZ != 0.0 )
            str2 = str2 + '  UZ (Dead)=' + formatNumber(modelElements[j].uZ,2,0,'','.','-','','','');

        if( modelElements[j].uXL != 0.0 )
            str2 = str2 + '  UX (Live)=' + formatNumber(modelElements[j].uXL,2,0,'','.','-','','','');
        if( modelElements[j].uYL != 0.0 )
            str2 = str2 + '  UY (Live)=' + formatNumber(modelElements[j].uYL,2,0,'','.','-','','','');
        if( modelElements[j].uZL != 0.0 )
            str2 = str2 + '  UZ (Live)=' + formatNumber(modelElements[j].uZL,2,0,'','.','-','','','');

        if( modelElements[j].uXO != 0.0 )
            str2 = str2 + '  UX (Occ)=' + formatNumber(modelElements[j].uXO,2,0,'','.','-','','','');
        if( modelElements[j].uYO != 0.0 )
            str2 = str2 + '  UY (Occ)=' + formatNumber(modelElements[j].uYO,2,0,'','.','-','','','');
        if( modelElements[j].uZO != 0.0 )
            str2 = str2 + '  UZ (Occ)=' + formatNumber(modelElements[j].uZO,2,0,'','.','-','','','');

        if( modelElements[j].fromFXLoad != 0.0 )
            str2 = str2 + '  From Node FX Load (Dead)=' + formatNumber(modelElements[j].fromFXLoad,2,0,'','.','-','','','');
        if( modelElements[j].fromFYLoad != 0.0 )
            str2 = str2 + '  From Node FY Load (Dead)=' + formatNumber(modelElements[j].fromFYLoad,2,0,'','.','-','','','');
        if( modelElements[j].fromFZLoad != 0.0 )
            str2 = str2 + '  From Node FZ Load (Dead)=' + formatNumber(modelElements[j].fromFZLoad,2,0,'','.','-','','','');
        if( modelElements[j].fromMXLoad != 0.0 )
            str2 = str2 + '  From Node MX Load (Dead)=' + formatNumber(modelElements[j].fromMXLoad,2,0,'','.','-','','','');
        if( modelElements[j].fromMYLoad != 0.0 )
            str2 = str2 + '  From Node MY Load (Dead)=' + formatNumber(modelElements[j].fromMYLoad,2,0,'','.','-','','','');
        if( modelElements[j].fromFZLoad != 0.0 )
            str2 = str2 + '  From Node MZ Load (Dead)=' + formatNumber(modelElements[j].fromMZLoad,2,0,'','.','-','','','');

        if( modelElements[j].toFXLoad != 0.0 )
            str2 = str2 + '  To Node FX Load (Dead)=' + formatNumber(modelElements[j].toFXLoad,2,0,'','.','-','','','');
        if( modelElements[j].toFYLoad != 0.0 )
            str2 = str2 + '  To Node FY Load (Dead)=' + formatNumber(modelElements[j].toFYLoad,2,0,'','.','-','','','');
        if( modelElements[j].toFZLoad != 0.0 )
            str2 = str2 + '  To Node FZ Load (Dead)=' + formatNumber(modelElements[j].toFZLoad,2,0,'','.','-','','','');
        if( modelElements[j].toMXLoad != 0.0 )
            str2 = str2 + '  To Node MX Load (Dead)=' + formatNumber(modelElements[j].toMXLoad,2,0,'','.','-','','','');
        if( modelElements[j].toMYLoad != 0.0 )
            str2 = str2 + '  To Node MY Load (Dead)=' + formatNumber(modelElements[j].toMYLoad,2,0,'','.','-','','','');
        if( modelElements[j].toFZLoad != 0.0 )
            str2 = str2 + '  To Node MZ Load (Dead)=' + formatNumber(modelElements[j].toMZLoad,2,0,'','.','-','','','');

        if( modelElements[j].fromFXLoadL != 0.0 )
            str2 = str2 + '  From Node FX Load (Live)=' + formatNumber(modelElements[j].fromFXLoadL,2,0,'','.','-','','','');
        if( modelElements[j].fromFYLoadL != 0.0 )
            str2 = str2 + '  From Node FY Load (Live)=' + formatNumber(modelElements[j].fromFYLoadL,2,0,'','.','-','','','');
        if( modelElements[j].fromFZLoadL != 0.0 )
            str2 = str2 + '  From Node FZ Load (Live)=' + formatNumber(modelElements[j].fromFZLoadL,2,0,'','.','-','','','');
        if( modelElements[j].fromMXLoadL != 0.0 )
            str2 = str2 + '  From Node MX Load (Live)=' + formatNumber(modelElements[j].fromMXLoadL,2,0,'','.','-','','','');
        if( modelElements[j].fromMYLoadL != 0.0 )
            str2 = str2 + '  From Node MY Load (Live)=' + formatNumber(modelElements[j].fromMYLoadL,2,0,'','.','-','','','');
        if( modelElements[j].fromFZLoadL != 0.0 )
            str2 = str2 + '  From Node MZ Load (Live)=' + formatNumber(modelElements[j].fromMZLoadL,2,0,'','.','-','','','');

        if( modelElements[j].toFXLoadL != 0.0 )
            str2 = str2 + '  To Node FX Load (Live)=' + formatNumber(modelElements[j].toFXLoadL,2,0,'','.','-','','','');
        if( modelElements[j].toFYLoadL != 0.0 )
            str2 = str2 + '  To Node FY Load (Live)=' + formatNumber(modelElements[j].toFYLoadL,2,0,'','.','-','','','');
        if( modelElements[j].toFZLoadL != 0.0 )
            str2 = str2 + '  To Node FZ Load (Live)=' + formatNumber(modelElements[j].toFZLoadL,2,0,'','.','-','','','');
        if( modelElements[j].toMXLoadL != 0.0 )
            str2 = str2 + '  To Node MX Load (Live)=' + formatNumber(modelElements[j].toMXLoadL,2,0,'','.','-','','','');
        if( modelElements[j].toMYLoadL != 0.0 )
            str2 = str2 + '  To Node MY Load (Live)=' + formatNumber(modelElements[j].toMYLoadL,2,0,'','.','-','','','');
        if( modelElements[j].toFZLoadL != 0.0 )
            str2 = str2 + '  To Node MZ Load (Live)=' + formatNumber(modelElements[j].toMZLoadL,2,0,'','.','-','','','');

        if( modelElements[j].fromFXLoadO != 0.0 )
            str2 = str2 + '  From Node FX Load (Occ)=' + formatNumber(modelElements[j].fromFXLoadO,2,0,'','.','-','','','');
        if( modelElements[j].fromFYLoadO != 0.0 )
            str2 = str2 + '  From Node FY Load (Occ)=' + formatNumber(modelElements[j].fromFYLoadO,2,0,'','.','-','','','');
        if( modelElements[j].fromFZLoadO != 0.0 )
            str2 = str2 + '  From Node FZ Load (Occ)=' + formatNumber(modelElements[j].fromFZLoadO,2,0,'','.','-','','','');
        if( modelElements[j].fromMXLoadO != 0.0 )
            str2 = str2 + '  From Node MX Load (Occ)=' + formatNumber(modelElements[j].fromMXLoadO,2,0,'','.','-','','','');
        if( modelElements[j].fromMYLoadO != 0.0 )
            str2 = str2 + '  From Node MY Load (Occ)=' + formatNumber(modelElements[j].fromMYLoadO,2,0,'','.','-','','','');
        if( modelElements[j].fromFZLoadO != 0.0 )
            str2 = str2 + '  From Node MZ Load (Occ)=' + formatNumber(modelElements[j].fromMZLoadO,2,0,'','.','-','','','');

        if( modelElements[j].toFXLoadO != 0.0 )
            str2 = str2 + '  To Node FX Load (Occ)=' + formatNumber(modelElements[j].toFXLoadO,2,0,'','.','-','','','');
        if( modelElements[j].toFYLoadO != 0.0 )
            str2 = str2 + '  To Node FY Load (Occ)=' + formatNumber(modelElements[j].toFYLoadO,2,0,'','.','-','','','');
        if( modelElements[j].toFZLoadO != 0.0 )
            str2 = str2 + '  To Node FZ Load (Occ)=' + formatNumber(modelElements[j].toFZLoadO,2,0,'','.','-','','','');
        if( modelElements[j].toMXLoadO != 0.0 )
            str2 = str2 + '  To Node MX Load (Occ)=' + formatNumber(modelElements[j].toMXLoadO,2,0,'','.','-','','','');
        if( modelElements[j].toMYLoadO != 0.0 )
            str2 = str2 + '  To Node MY Load (Occ)=' + formatNumber(modelElements[j].toMYLoadO,2,0,'','.','-','','','');
        if( modelElements[j].toFZLoadO != 0.0 )
            str2 = str2 + '  To Node MZ Load (Occ)=' + formatNumber(modelElements[j].toMZLoadO,2,0,'','.','-','','','');

        if( modelElements[j].pressure != 0.0 )
            str2 = str2 + '  Pressure=' + formatNumber(modelElements[j].pressure,2,0,'','.','-','','','');
        if( modelElements[j].fluid != 0.0 )
            str2 = str2 + '  Fluid SG=' + formatNumber(modelElements[j].fluid,3,0,'','.','-','','','');

        if( modelElements[j].group ) {
            str2 = str2 + '  Group Name(s)=' + stringy(modelElements[j].group);
        }

        var iWid = 62;
        while (str2.length != 0) {
            wordWrap(str2, iWid, 1, true);
            if( iWid == 45 )
                str1 = '                  ' + str1.trim();
            else
                iWid = 45;

            if (iLine > 40) {
                doc.addPage();
                iPage++;

                doc.setFontSize(10);
                doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);
                doc.setFontSize(18);
                doc.text(15, 35, str + ' (continued)');
                doc.setFontSize(12);
                doc.text(15, 45, ' From Node  To Node');
                doc.text(15, 50, '---------------------------------------------------------------');
                iLine = 0;
            }

            doc.text(15, 57 + iLine * 5, str1);
            iLine++;
        }
    }
    // load cases here

    for (var i=1; i<=totalLoadCases; i++) {
        doc.addPage();
        iPage++;
        doc.setFontSize(10);
        doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

        doc.setFontSize(18);

        str = 'Displacement Report -- Load Case # ' + i;
        TC[iRept] = [str,iPage];
        iRept++;

        doc.text(15, 35, str);
        doc.setFontSize(12);
        doc.text(15, 45, ' Node        DX        DY        DZ        RX        RY        RZ');
        doc.text(15, 50, '-----------------------------------------------------------------');

        var j1 = 0;
        for(var j=0; j< dispRept[i-1].length-1; j++ ) {
            str = "";
            var str1 = dispRept[i-1][j][0];
            for (var i1=0;i1<5-str1.length;i1++)
                str += ' ';
            str += str1;
            for (var k=1; k<7; k++) {
                str1 = dispRept[i-1][j][k];
                for (var i1=0;i1<10-str1.length;i1++)
                    str += ' ';
                str += str1;
            }
            if( j-j1 >= 30 ) {
                doc.addPage();
                iPage++;
                j1+=30;
                doc.setFontSize(10);
                doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

                doc.setFontSize(18);
                doc.text(15, 35, 'Displacement Report -- Load Case # ' + i + " (cont'd)");
                doc.setFontSize(12);
                doc.text(15, 45, ' Node        DX        DY        DZ        RX        RY        RZ');
                doc.text(15, 50, '-----------------------------------------------------------------');

            }
            doc.text(15, 57+(j-j1)*5, str );
        }

        doc.addPage();
        iPage++;
        doc.setFontSize(10);
        doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

        str = 'Element Force Report -- Load Case # ' + i;
        TC[iRept] = [str,iPage];
        iRept++;

        doc.setFontSize(18);
        doc.text(15, 35, str);
        doc.setFontSize(12);
        doc.text(15, 45, '       Element        fx        fy        fz        mx        my        mz');
        doc.text(15, 50, '--------------------------------------------------------------------------');

        var j1 = 0;
        for(var j=0; j< forceRept[i-1].length-1; j++ ) {
            str = "";
            var str1 = forceRept[i-1][j][0];
            for (var i1=0;i1<14-str1.length;i1++)
                str += ' ';
            str += str1;
            for (var k=1; k<7; k++) {
                str1 = forceRept[i-1][j][k];
                for (var i1=0;i1<10-str1.length;i1++)
                    str += ' ';
                str += str1;
            }
            if( j-j1 >= 30 ) {
                doc.addPage();
                iPage++;
                j1+=30;
                doc.setFontSize(10);
                doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

                doc.setFontSize(18);
                doc.text(15, 35, 'Element Force Report -- Load Case # ' + i + "(cont'd)");
                doc.setFontSize(12);
                doc.text(15, 45, '       Element        fx        fy        fz        mx        my        mz');
                doc.text(15, 50, '--------------------------------------------------------------------------');

            }
            doc.text(15, 57+(j-j1)*5, str );
        }

        doc.addPage();
        iPage++;
        doc.setFontSize(10);
        doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

        str = 'Element Stress Report -- Load Case # ' + i;
        TC[iRept] = [str,iPage];
        iRept++;

        doc.setFontSize(18);
        doc.text(15, 35, str);
        doc.setFontSize(12);
        doc.text(15, 45, '       Element      Axial     Bending   Normal   Torsion  Shear-X  Shear-Y');
        doc.text(15, 50, '--------------------------------------------------------------------------');

        var j1 = 0;
        for(var j=0; j< stressRept[i-1].length-1; j++ ) {
            str = "";
            var str1 = stressRept[i-1][j][0];
            for (var i1=0;i1<14-str1.length;i1++)
                str += ' ';
            str += str1;
            for (var k=1; k<7; k++) {
                str1 = stressRept[i-1][j][k];
                for (var i1=0;i1<10-str1.length;i1++)
                    str += ' ';
                str += str1;
            }
            if( j-j1 >= 30 ) {
                doc.addPage();
                iPage++;
                j1+=30;
                doc.setFontSize(10);
                doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

                doc.setFontSize(18);
                doc.text(15, 35, 'Element Stress Report -- Load Case # ' + i + "(cont'd)");
                doc.setFontSize(12);
                doc.text(15, 45, '       Element      Axial     Bending   Normal   Torsion  Shear-X  Shear-Y');
                doc.text(15, 50, '--------------------------------------------------------------------------');

            }
            doc.text(15, 57+(j-j1)*5, str );
        }

        doc.addPage();
        iPage++;
        doc.setFontSize(10);
        doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

        str = 'Code Compliance Report -- Load Case # ' + i;
        TC[iRept] = [str,iPage];
        iRept++;

        doc.setFontSize(18);
        doc.text(15, 35, str);
        doc.setFontSize(12);

        doc.text(15, 45, '       Element  Pass/Fail   Axial    Flexure    Shear    Combined');
        doc.text(15, 50, '-------------------------------------------------------------------');

        var j1 = 0;
        for(var j=0; j< complyRept[i-1].length-1; j++ ) {
            str = "";
            var str1 = complyRept[i-1][j][0];
            for (var i1=0;i1<14-str1.length;i1++)
                str += ' ';
            str += str1;
            for (var k=1; k<6; k++) {
                str1 = complyRept[i-1][j][k];
                for (var i1=0;i1<10-str1.length;i1++)
                    str += ' ';
                str += str1;
            }
            if( j-j1 >= 30 ) {
                doc.addPage();
                iPage++;
                j1+=30;
                doc.setFontSize(10);
                doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

                doc.setFontSize(18);
                doc.text(15, 35, 'Code Compliance Report -- Load Case # ' + i + "(cont'd)");
                doc.setFontSize(12);

                doc.text(15, 45, '       Element  Pass/Fail   Axial    Flexure    Shear    Combined');
                doc.text(15, 50, '-------------------------------------------------------------------');


            }
            doc.text(15, 57+(j-j1)*5, str );
        }

        doc.addPage();
        iPage++;
        doc.setFontSize(10);
        doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

        doc.setFontSize(18);

        str = 'Restraint Report -- Load Case # ' + i;
        TC[iRept] = [str,iPage];
        iRept++;

        doc.text(15, 35, str);
        doc.setFontSize(12);
        doc.text(15, 45, ' Node        FX       FY        FZ        MX        MY        MZ');
        doc.text(15, 50, '-----------------------------------------------------------------');

        var j1 = 0;
        for(var j=0; j< restRept[i-1].length-1; j++ ) {
            str = "";
            var str1 = restRept[i-1][j][0];
            for (var i1=0;i1<5-str1.length;i1++)
                str += ' ';
            str += str1;
            for (var k=1; k<7; k++) {
                str1 = restRept[i-1][j][k];
                for (var i1=0;i1<10-str1.length;i1++)
                    str += ' ';
                str += str1;
            }
            if( j-j1 >= 30 ) {
                doc.addPage();
                iPage++;
                j1+=30;
                doc.setFontSize(10);
                doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

                doc.setFontSize(18);
                doc.text(15, 35, 'Restraint Report -- Load Case # ' + i + " (cont'd)");
                doc.setFontSize(12);
                doc.text(15, 45, ' Node        FX       FY        FZ        MX        MY        MZ');
                doc.text(15, 50, '-----------------------------------------------------------------');

            }
            doc.text(15, 57+(j-j1)*5, str );
        }

    }

    doc.addPage();
    iPage++;
    doc.setFontSize(10);
    doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

    doc.setFontSize(18);
    doc.text(15, 35, 'Table of Contents');
    doc.setFontSize(12);
    doc.text(15, 45, 'Report                                                      Page');
    doc.text(15, 50, '----------------------------------------------------------------');

    var j1 = 0;
    for(var j=0; j< TC.length; j++ ) {
        str = TC[j][0];
        var str1 = ' ' + TC[j][1];
        for (var i1=0;i1<64-TC[j][0].length-str1.length;i1++)
            str += ' ';
        str+=str1;

        if( j-j1 >= 30 ) {
            doc.addPage();
            iPage++;
            j1+=30;
            doc.setFontSize(10);
            doc.text(10, 20, 'Project: ' + jobName + '  Engineer: ' + userName + '  Checked By: __________  Date: ' + today + '  Page ' + iPage);

            doc.text(15, 35, "Table of Contents (cont'd)");
            doc.setFontSize(12);
            doc.text(15, 45, 'Report                                                      Page');
            doc.text(15, 50, '----------------------------------------------------------------');

        }
        doc.text(15, 57+(j-j1)*5, str );
    }

    // Output as Data URI
    doc.output('dataurl');    //  'dataurlnewwindow'
    //              doc.output('dataurlnewwindow');

}

function printReport(){

    for (var i = 1; i <= totalLoadCases; i++) {
        $.ajax({
            //                  type: 'POST',
            url: './data/' + userName + '-' + jobName + '-nodeDisp-' + i + '.txt',
            async: false,
            success: function(data){
                dispRept[i-1] = csvToArray( data, ',' );

                //  need to sort them now

                var arr;
                for (var ii=0; ii<dispRept[i-1].length-2; ii+=1) {
                    for (var i1=0; i1<dispRept[i-1].length-2-ii; i1++) {
                        if( parseInt(dispRept[i-1][i1][0]) > 0 + parseInt(dispRept[i-1][i1+1][0]) ) {
                            arr = dispRept[i-1][i1];
                            dispRept[i-1][i1] = dispRept[i-1][i1+1];
                            dispRept[i-1][i1+1] = arr;
                        }
                    }

                    for (var i1=dispRept[i-1].length-3-ii; i1>ii; i1--) {
                        if( parseInt(dispRept[i-1][i1][0]) > parseInt(dispRept[i-1][i1+1][0]) ) {
                            arr = dispRept[i-1][i1];
                            dispRept[i-1][i1] = dispRept[i-1][i1+1];
                            dispRept[i-1][i1+1] = arr;
                        }
                    }
                }

            }, cache: false}
        );

        $.ajax({
            //                  type: 'POST',
            url: './data/' + userName + '-' + jobName + '-elForce-' + i + '.txt',
            async: false,
            success: function(data){
                forceRept[i-1] = csvToArray( data, ',' );
            }, cache: false}
        );

        $.ajax({
            //                  type: 'POST',
            url: './data/' + userName + '-' + jobName + '-elStress-' + i + '.txt',
            async: false,
            success: function(data){
                stressRept[i-1] = csvToArray( data, ',' );
            }, cache: false}
        );

        $.ajax({
            //                  type: 'POST',
            url: './data/' + userName + '-' + jobName + '-comply-' + i + '.txt',
            async: false,
            success: function(data){
                complyRept[i-1] = csvToArray( data, ',' );
            }, cache: false}
        );

        $.ajax({
            //                  type: 'POST',
            url: './data/' + userName + '-' + jobName + '-restLoad-' + i + '.txt',
            async: false,
            success: function(data){
                restRept[i-1] = csvToArray( data, ',' );
            }, cache: false}
        );

    }

    setCookie("wp", passWord, 0.042) // set password cookie for 1 hr duration

    var uP = JSON.stringify(userProfile);
    setCookie("uP", uP, 0.042) // set password cookie for 1 hr duration

    getImageFromUrl('../assets/img/logo.jpg', createPDF);
    return false;
}

// functions -- AJAX, PHP

function registerJobName(newName){

    jobName = newName;
    userName1 = userName;
    editRights = true;

    $.ajax({
        url: './php/createJobTables.php',
        type: 'POST',
        async: false,          // make sure everything is cleared before we proceed
        data: {
            "userName" : userName,
            "jobName": jobName
        }
    });

    currentUnits = defaultUnits;
    setUnits(currentUnits, true, false );
    displayUnitLabels();

    storeUnits();
}

function getNotes(){
    $.ajax({
        type: "POST",
        url: "./php/getNotes.php",
        data: { "userName": userName1, "jobName": jobName },
        success: function(msg){
            jobNotes = msg;
            $('#jobDesc').val(msg);
        }
    });
}

function putNotes(undd){
    if( !editRights ) 
        return;
    
    $.ajax({
        type: "POST",
        url: "./php/putNotes.php",
        data: { "userName": userName1, "jobName": jobName, "jobNotes": jobNotes },
        success: function(msg){
        }
    });
    if( undd )
        setUndo(5,0);
}

function newJobName(newName){
    if (newName) {
        //                    deleteSQLQueue(-1);

        registerJobName(newName);

        $.ajax({
            type: "POST",
            url: "./php/putUsersJob.php",
            data: {"userName": userName,
                "jobName": newName,
                "userName1": userName1  },
            success: function(msg){
            }
        });
        resetJobData(newName);

        //                    getNotes();

        setJobName(newName);

        deformed = false;
        drawModel(false,true);

        initUndo(0);

    }
}

function deleteNode(node){
    if( !editRights )
        return;

    $.ajax({ type: "POST",
        url: "./php/deleteNode.php",
        data: {
            "userName": userName1,
            "jobName": jobName,
            "Node": node },
        success: function(msg){
        }
    });
}

function getSpecificJobUnits(jName) {

    return $.ajax({
        url: './php/getUnits.php',
        async: false,
        type: 'POST',
        data: {
            "userName": userName1,
            "jobName": jName
        }
    });
}

function buildJobUnits(jobUnits) {
    jobUnits.success(function(data) {

        if (data) {
            var unitsData = csvToArray(data, ',');

            for (var i = 0; i < unitsData.length - 1; i++) {

                if( unitsData[i][0] == 'aaSet' ) {
                    currentUnits = unitsData[i][1].trim();
                }
                else
                    if( unitsData[i][0] == 'Force' ) {
                        uNameForce = unitsData[i][1].trim();
                        uConstForce = parseFloat(unitsData[i][2]);
                    }
                    else
                        if( unitsData[i][0] == 'Length' ) {
                            uNameLength = unitsData[i][1].trim();
                            uConstLength = parseFloat(unitsData[i][2]);
                        }
                        else
                            if( unitsData[i][0] == 'MomOut' ) {
                                uNameMomOut = unitsData[i][1].trim();
                                uConstMomOut = parseFloat(unitsData[i][2]);
                            }
                            else
                                if( unitsData[i][0] == 'Stress' ) {
                                    uNameStress = unitsData[i][1].trim();
                                    uConstStress = parseFloat(unitsData[i][2]);
                                }
                                else
                                    if( unitsData[i][0] == 'Unif' ) {
                                        uNameUnif = unitsData[i][1].trim();
                                        uConstUnif = parseFloat(unitsData[i][2]);
                                    }
                                    else
                                        if( unitsData[i][0] == 'Weight' ) {
                                            uNameWeight = unitsData[i][1].trim();
                                            uConstWeight = parseFloat(unitsData[i][2]);
                                        }
            }
        }
        displayUnitLabels();
    }); // success
};  //buildjobUnits

function getSpecificJobNodeCoords(jName) {

    return $.ajax({
        url: './php/getNodes.php',
        type: 'POST',
        async: false,
        data: {
            "userName" : userName1,
            "jobName": jName
        }
    });
}

function buildJobNodeCoords(jobNodeCoords) {
    jobNodeCoords.success(function(data) {

        oNodeTable.fnClearTable();
        oNodeTable.fnSort([]);

        if (data) {
            var nodeData = csvToArray(data, ',');

            fNodes.length = 0;

            for (var i = 0; i < nodeData.length - 1; i++) {
                oNodeTable.fnAddData([nodeData[i][0], nodeData[i][1], nodeData[i][2], nodeData[i][3], '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>','<a class="duplicate" href="">Array</a>']);
                fNodes.push({"node":nodeData[i][0], "x":nodeData[i][1], "y":nodeData[i][2], "z":nodeData[i][3]});
            }
        }
    }); // success
};  //buildjobNodeCoords

function storeNode(node, x, y, z) {

    if( !editRights )
        return;

    $.ajax({
        type: "POST",
        url: "./php/storeNode.php",
        data: {
            "userName": userName1,
            "jobName": jobName,
            "Node": node,
            "X": x,
            "Y": y,
            "Z": z },
        success: function(msg){
        }
    });
    setUndo(2,0  /* ,2  */);
}

function resetMemberList(libList) {

    var iOrd = 0;

    if (!isMobile && libList) {
        lMemTable.fnClearTable();
        lMemTable.fnSort([[0, 'asc']]);
    }

    $.ajax({
        url: './php/getMemberLibrary.php',
        type: 'POST',
        async: false,
        data: {
            "userName": userName
        },
        success: function(data){
            memberTypeArray = data.split("\n");

            var select = document.getElementById('memberType');
            select.options.length = 0;

            for( i=0; i<memberTypeArray.length; i++ )  {
                memberTypeArray[i].trim();

                var ll = memberTypeArray[i].length;
                if( memberTypeArray[i].substring(ll-1,ll).charCodeAt(0) <= 32 )
                    memberTypeArray[i] = memberTypeArray[i].substring(0,ll-1);

                var opt = memberTypeArray[i];
                if( opt.substring(0,3) == '***') {
                    opt =  opt.substring(3);
                    memberTypeArray[i] = opt;
                    braceType = opt;
                }
                else {
                    if (opt.substring(0, 2) == '**') {
                        opt = opt.substring(2);
                        memberTypeArray[i] = opt;
                        beamType = opt;
                    }
                    else {
                        if (opt.substring(0, 1) == '*') {
                            opt = opt.substring(1);
                            memberTypeArray[i] = opt;
                            colType = opt;
                        }
                    }
                }

                var el = document.createElement('option');
                el.textContent = opt;
                el.value = opt;
                select.appendChild(el);

                if (!isMobile && libList) {
                    var cBmBr;

                    if (opt == colType)
                        cBmBr = '<a class="cBmBr" href="">Col</a>';
                    else {
                        if (opt == beamType)
                            cBmBr = '<a class="cBmBr" href="">Beam</a>';
                        else {
                            if (opt == braceType)
                                cBmBr = '<a class="cBmBr" href="">Brace</a>';
                            else
                                cBmBr = '<a class="cBmBr" href="">---</a>';
                        }
                    }

                    iOrd++;
                    lMemTable.fnAddData([iOrd, opt, cBmBr, '<a class="moveUp" href="">Move Up</a>',
                      '<a class="moveDown" href="">Move Down</a>','<a class="delete" href="">Delete</a>']);
                }
            }

            var select1 = document.getElementById('colMem');
            select1.options.length = 0;

            var el1 = document.createElement('option');
            el1.textContent = '(none)';
            el1.value = '(none)';
            select1.appendChild(el1);

            for( i=0; i<memberTypeArray.length; i++ )  {
                var opt = memberTypeArray[i];
                var el = document.createElement('option');
                el.textContent = opt;
                el.value = opt;
                select1.appendChild(el);
            }

            var select2 = document.getElementById('beamMem');
            select2.options.length = 0;

            var el2 = document.createElement('option');
            el2.textContent = '(none)';
            el2.value = '(none)';
            select2.appendChild(el2);

            for( i=0; i<memberTypeArray.length; i++ )  {
                var opt = memberTypeArray[i];
                var el = document.createElement('option');
                el.textContent = opt;
                el.value = opt;
                select2.appendChild(el);
            }

            var select3 = document.getElementById('braceMem');
            select3.options.length = 0;

            var el3 = document.createElement('option');
            el3.textContent = '(none)';
            el3.value = '(none)';
            select3.appendChild(el3);

            for( i=0; i<memberTypeArray.length; i++ )  {
                var opt = memberTypeArray[i];
                var el = document.createElement('option');
                el.textContent = opt;
                el.value = opt;
                select3.appendChild(el);
            }

            var select4 = document.getElementById('memberTypeM');
            select4.options.length = 0;

            var el = document.createElement('option');
            el.textContent = '(various)';
            el.value ='(various)';
            select4.appendChild(el);

            for( i=0; i<memberTypeArray.length; i++ )  {
                var opt = memberTypeArray[i];
                el = document.createElement('option');
                el.textContent = opt;
                el.value = opt;
                select4.appendChild(el);
            }
        },
        error: function(msg){
            alert(msg);
        },
        cache: false
    });
}

function resetMaterialList(libList ) {
    var iOrd = 0;
    var colType;
    var beamType;
    var braceType;

    function secondTry() {
        $.ajax({
            //                  type: 'POST',
            url: './data/validMaterials.txt',
            async: false,
            success: function(data){
                materialTypeArray = data.split("\n");

                var select = document.getElementById('material');
                select.options.length = 0;

                for( i=0; i<materialTypeArray.length; i++ )  {
                    materialTypeArray[i].trim();

                    var ll = materialTypeArray[i].length;
                    if( materialTypeArray[i].substring(ll-1,ll).charCodeAt(0) <= 32 )
                        materialTypeArray[i] = materialTypeArray[i].substring(0,ll-1);

                    var opt = materialTypeArray[i];
                    if( opt.substring(0,3) == '***') {
                        opt =  opt.substring(3);
                        materialTypeArray[i] = opt;
                        braceType = opt;
                    }
                    else {
                        if (opt.substring(0, 2) == '**') {
                            opt = opt.substring(2);
                            materialTypeArray[i] = opt;
                            beamType = opt;
                        }
                        else {
                            if (opt.substring(0, 1) == '*') {
                                opt = opt.substring(1);
                                materialTypeArray[i] = opt;
                                colType = opt;
                            }
                        }
                    }

                    var el = document.createElement('option');
                    el.textContent = opt;
                    el.value = opt;
                    select.appendChild(el);

                    if (!isMobile && libList) {
                        var cBmBr;

                        if (opt == colType)
                            cBmBr = '<a class="cBmBr" href="">Col</a>';
                        else {
                            if (opt == beamType)
                                cBmBr = '<a class="cBmBr" href="">Beam</a>';
                            else {
                                if (opt == braceType)
                                    cBmBr = '<a class="cBmBr" href="">Brace</a>';
                                else
                                    cBmBr = '<a class="cBmBr" href="">---</a>';
                            }
                        }

                        iOrd++;
                        lMatTable.fnAddData([iOrd, opt, cBmBr, '<a class="moveUp" href="">Move Up</a>',
                          '<a class="moveDown" href="">Move Down</a>','<a class="delete" href="">Delete</a>']);
                    }
                }

                var select4 = document.getElementById('materialM');
                select4.options.length = 0;

                var el = document.createElement('option');
                el.textContent = '(various)';
                el.value ='(various)';
                select4.appendChild(el);

                for( i=0; i<materialTypeArray.length; i++ )  {
                    var opt = materialTypeArray[i];
                    el = document.createElement('option');
                    el.textContent = opt;
                    el.value = opt;
                    select4.appendChild(el);
                }
            },
            cache: false
        });
    }

    if (!isMobile && libList) {
        lMatTable.fnClearTable();
        lMatTable.fnSetColumnVis( 2, false );
        lMatTable.fnSort([[0, 'asc']]);
    }

    var matFile = './data/validMaterials-' + userName + '.txt';
    $.ajax({
        //                  type: 'POST',
        url: matFile,
        async: false,
        success: function(data){
            materialTypeArray = data.split("\n");

            var select = document.getElementById('material');
            select.options.length = 0;

            for( i=0; i<materialTypeArray.length; i++ )  {
                materialTypeArray[i].trim();

                var ll = materialTypeArray[i].length;
                if( materialTypeArray[i].substring(ll-1,ll).charCodeAt(0) <= 32 )
                    materialTypeArray[i] = materialTypeArray[i].substring(0,ll-1);

                var opt = materialTypeArray[i];
                if( opt.substring(0,3) == '***') {
                    opt =  opt.substring(3);
                    materialTypeArray[i] = opt;
                    braceType = opt;
                }
                else {
                    if (opt.substring(0, 2) == '**') {
                        opt = opt.substring(2);
                        materialTypeArray[i] = opt;
                        beamType = opt;
                    }
                    else {
                        if (opt.substring(0, 1) == '*') {
                            opt = opt.substring(1);
                            materialTypeArray[i] = opt;
                            colType = opt;
                        }
                    }
                }

                var el = document.createElement('option');
                el.textContent = opt;
                el.value = opt;
                select.appendChild(el);

                if (!isMobile && libList) {
                    var cBmBr;

                    if (opt == colType)
                        cBmBr = '<a class="cBmBr" href="">Col</a>';
                    else {
                        if (opt == beamType)
                            cBmBr = '<a class="cBmBr" href="">Beam</a>';
                        else {
                            if (opt == braceType)
                                cBmBr = '<a class="cBmBr" href="">Brace</a>';
                            else
                                cBmBr = '<a class="cBmBr" href="">---</a>';
                        }
                    }

                    iOrd++;
                    lMatTable.fnAddData([iOrd, opt, cBmBr, '<a class="moveUp" href="">Move Up</a>',
                      '<a class="moveDown" href="">Move Down</a>','<a class="delete" href="">Delete</a>']);
                }
            }

            var select4 = document.getElementById('materialM');
            select4.options.length = 0;

            var el = document.createElement('option');
            el.textContent = '(various)';
            el.value ='(various)';
            select4.appendChild(el);

            for( i=0; i<materialTypeArray.length; i++ )  {
                var opt = materialTypeArray[i];
                var el = document.createElement('option');
                el.textContent = opt;
                el.value = opt;
                select4.appendChild(el);
            }
        },
        error: function(msg){
            secondTry();
        },
        cache: false
    });

}

function resetGroupLists(groupList) {
    gN.setData(groupList);
  
    gNM.setData(groupList);
  
    gNS.setData(groupList);
}

function mergeNodes(i1,i2) {

    var tol = 0.01;
    // step 1 -- calculate coordinates of all nodes

    calcCoords();

    // check all nodes in elements i2 through i1 (backwards) -- do they share coordinates with another node?

    var changed = [];
  
    for( var i=i2; i>=i1; i-- ) {
        // make sure we check fixed nodes also
        for( var j=0; j<fNodes.length; j++ ) {
            if (modelElements[i].toNode != fNodes[j].node) {
                var xtol = Math.sqrt((coords[i].x2 - fNodes[j].x / uConstLength) * (coords[i].x2 - fNodes[j].x / uConstLength) +
                (coords[i].y2 - fNodes[j].y / uConstLength) * (coords[i].y2 - fNodes[j].y / uConstLength) +
                (coords[i].z2 - fNodes[j].z / uConstLength) * (coords[i].z2 - fNodes[j].z / uConstLength));
                if (xtol < tol) {
                    var iN = modelElements[i].toNode;
                    // if so, replace all occurrences of that node number with other node
          
          
                    for (var k = i1; k < i2; k++) {
                        if (modelElements[k].fromNode == iN) {
                            modelElements[k].fromNode = fNodes[j].node;
                            if( changed.indexOf(k) < 0 )
                                changed.push(k);
                        }
                        if (modelElements[k].toNode == iN) { 
                            modelElements[k].toNode = fNodes[j].node;
                            if( changed.indexOf(k) < 0 )
                                changed.push(k);
                        }
                    }
                }
            }                                          

            if( modelElements[i].fromNode != fNodes[j].node ) {
                var xtol = Math.sqrt((coords[i].x1 - fNodes[j].x / uConstLength) * (coords[i].x1 - fNodes[j].x / uConstLength) +
                (coords[i].y1 - fNodes[j].y / uConstLength) * (coords[i].y1 - fNodes[j].y / uConstLength) +
                (coords[i].z1 - fNodes[j].z / uConstLength) * (coords[i].z1 - fNodes[j].z / uConstLength));
                if (xtol < tol) {
                    var iN = modelElements[i].fromNode;
                    // if so, replace all occurrences of that node number with other node
                    for (var k = i1; k < i2; k++) {
                        if (modelElements[k].fromNode == iN) {
                            modelElements[k].fromNode = fNodes[j].node;
                            if( changed.indexOf(k) < 0 )
                                changed.push(k);
                        }
                        if (modelElements[k].toNode == iN) {
                            modelElements[k].toNode = fNodes[j].node;
                            if( changed.indexOf(k) < 0 )
                                changed.push(k);
                        }
                    }
                }
            }
        }
    
        for (var j = 1; j <= totEls; j++) {
            if (modelElements[i].toNode != modelElements[j].toNode) {
                var xtol = Math.sqrt((coords[i].x2 - coords[j].x2) * (coords[i].x2 - coords[j].x2) +
                (coords[i].y2 - coords[j].y2) * (coords[i].y2 - coords[j].y2) +
                (coords[i].z2 - coords[j].z2) * (coords[i].z2 - coords[j].z2));
                if (xtol < tol) {
                    var iN = modelElements[i].toNode;
                    var jN = modelElements[j].toNode;
                    // if so, replace all occurrences of that node number with other node
                    for (var k = i1; k <= i2; k++) {
                        if (modelElements[k].fromNode == iN) {
                            modelElements[k].fromNode = jN;
                            if( changed.indexOf(k) < 0 )
                                changed.push(k);
                        }
                        if (modelElements[k].toNode == iN) {
                            modelElements[k].toNode = jN;
                            if( changed.indexOf(k) < 0 )
                                changed.push(k);
                        }
                    }
                }
            }
      
            if (modelElements[i].toNode != modelElements[j].fromNode) {
                var xtol = Math.sqrt((coords[i].x2 - coords[j].x1) * (coords[i].x2 - coords[j].x1) +
                (coords[i].y2 - coords[j].y1) * (coords[i].y2 - coords[j].y1) +
                (coords[i].z2 - coords[j].z1) * (coords[i].z2 - coords[j].z1));
                if (xtol < tol) {
                    var iN = modelElements[i].toNode;
                    var jN = modelElements[j].fromNode;
                    // if so, replace all occurrences of that node number with other node
                    for (var k = i1; k <= i2; k++) {
                        if (modelElements[k].fromNode == iN) {
                            modelElements[k].fromNode = jN;
                            if( changed.indexOf(k) < 0 )
                                changed.push(k);
                        }
                        if (modelElements[k].toNode == iN) {
                            modelElements[k].toNode = jN;
                            if( changed.indexOf(k) < 0 )
                                changed.push(k);
                        }
                    }
                }
            }
      
            if (modelElements[i].fromNode != modelElements[j].toNode) {
                var xtol = Math.sqrt((coords[i].x1 - coords[j].x2) * (coords[i].x1 - coords[j].x2) +
                (coords[i].y1 - coords[j].y2) * (coords[i].y1 - coords[j].y2) +
                (coords[i].z1 - coords[j].z2) * (coords[i].z1 - coords[j].z2));
                if (xtol < tol) {
                    var iN = modelElements[i].fromNode;
                    var jN = modelElements[j].toNode;
                    // if so, replace all occurrences of that node number with other node
                    for (var k = i1; k <= i2; k++) {
                        if (modelElements[k].fromNode == iN) {
                            modelElements[k].fromNode = jN;
                            if (changed.indexOf(k) < 0) 
                                changed.push(k);
                        }
                        if (modelElements[k].toNode == iN) {
                            modelElements[k].toNode = jN;
                            if( changed.indexOf(k) < 0 )
                                changed.push(k);
                        }
                    }
                }
            }
      
            if (modelElements[i].fromNode != modelElements[j].fromNode) {
                var xtol = Math.sqrt((coords[i].x1 - coords[j].x1) * (coords[i].x1 - coords[j].x1) +
                (coords[i].y1 - coords[j].y1) * (coords[i].y1 - coords[j].y1) +
                (coords[i].z1 - coords[j].z1) * (coords[i].z1 - coords[j].z1));
                if (xtol < tol) {
                    var iN = modelElements[i].fromNode;
                    var jN = modelElements[j].fromNode;
                    // if so, replace all occurrences of that node number with other node
                    for (var k = i1; k <= i2; k++) {
                        if (modelElements[k].fromNode == iN) {
                            modelElements[k].fromNode = jN;
                            if( changed.indexOf(k) < 0 )
                                changed.push(k);
                        } 
                        if (modelElements[k].toNode == iN) { 
                            modelElements[k].toNode = jN;
                            if( changed.indexOf(k) < 0 )
                                changed.push(k);
                        } 
                    }
                }
            }
        }  
    }

    var syncVar = true; 
    for (var i = 0; i < changed.length; i++) {
        if( i == changed.length - 1)
            syncVar = false;
        $.ajax({
            type: "POST",
            async: syncVar,
            url: "./php/storeElement.php",
            data: {
                "userName": userName1,
                "jobName": jobName,
                "modelEl": modelElements[i]
            },
            success: function(msg){
                //                  alert( "succes: " + msg );
            } // function
        }); //ajax
    }  
  
    if (changed.length > 0) {
        //                setUndo(1, 0 /* ,1 */);
        displayElement(currElmt);
        drawModel(false, true);
    }
}

function storeElement(it0, incr0, it1, inc1, it2, inc2, it3, inc3, lastNode, memEnd, chSelect, sync) {
    if( !editRights )
        return;
    var key;

    var iOldCurr = currElmt;
    if( iOldCurr == 0 )
        iOldCurr++;

    newElms = [];
  
    for (var i3=0; i3<it3; i3++)
    {
        for (var i2=0; i2<it2; i2++)
        {
            for (var i1=0; i1<it1; i1++)
            {
                for (var i0=0; i0<it0; i0++)
                {
                    if( currElmt == 0 )
                        currElmt++;
                    if (currElmt > totEls) { // need to generate a key
                        key = randomInteger(10000000);
                        totEls = currElmt;
                    }    // if
                    else
                        key = modelElements[currElmt].keyID;

                    newElms.push(currElmt);

                    modelElements[currElmt] = getScreenEntries();
                    modelElements[currElmt].keyID = key;

                    if( i0 == 0 ) 
                        modelElements[currElmt].fromNode = modelElements[currElmt].fromNode + i0*incr0 + i1*inc1 + i2*inc2 + i3*inc3;
                    else {
                        modelElements[currElmt].fromNode = modelElements[currElmt-1].toNode;
                    }                    

                    if (i0 == (it0 - 1) && lastNode != 0) 
                        modelElements[currElmt].toNode = lastNode + i1 * inc1 + i2 * inc2 + i3 * inc3;
                    else {
                        if (i0 > 0 || i1 > 0 || i2 > 0 || i3 > 0 ) {
                            var tn = getNewNode(modelElements[currElmt].toNode + i0 * incr0 + i1 * inc1 + i2 * inc2 + i3 * inc3);
                            modelElements[currElmt].toNode = tn;
                        }
                        else 
                            modelElements[currElmt].toNode = modelElements[currElmt].toNode + i0 * incr0 + i1 * inc1 + i2 * inc2 + i3 * inc3;
                    }

                    if ( memEnd != -1 ) {
                        // initialize
                        modelElements[currElmt].fromFXMemb = false;
                        modelElements[currElmt].fromFYMemb = false;
                        modelElements[currElmt].fromFZMemb = false;
                        modelElements[currElmt].fromMXMemb = false;
                        modelElements[currElmt].fromMYMemb = false;
                        modelElements[currElmt].fromMZMemb = false;

                        modelElements[currElmt].toFXMemb = false;
                        modelElements[currElmt].toFYMemb = false;
                        modelElements[currElmt].toFZMemb = false;
                        modelElements[currElmt].toMXMemb = false;
                        modelElements[currElmt].toMYMemb = false;
                        modelElements[currElmt].toMZMemb = false;

                        if( i0 == 0 && memEnd == 1) {    // first is pinned
                            modelElements[currElmt].fromMYMemb = true;
                            modelElements[currElmt].fromMZMemb = true;
                        }
                        if ( i0 == it0-1  && memEnd == 1 ) {  // last is pinned
                            modelElements[currElmt].toMYMemb = true;
                            modelElements[currElmt].toMZMemb = true;
                        }
                    }

                    var syncVar;
                    if( sync && i3 >= (it3-1) && i2 >= (it2-1) && i1 >= (it1-1))
                        syncVar = false;
                    else
                        syncVar = true;

                    $.ajax({
                        type: "POST",
                        async: syncVar,
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[currElmt]
                        } ,
                        success: function(msg){
                            //                                alert( "succes: " + msg );
                        } // function

                    });   //ajax

                    currElmt++;
                    if (chSelect) {
                        selectionSet = [currElmt];
                        nodSelectionSet = [];
                        elemMenu();    // reset context menu to reflect elements
                    }
                }   //for i0
            }   //for i1
        }   //for i2
    }   //for i3

    currElmt--;
    if( currElmt > totEls )
        currElmt = totEls;

    if( it0 > 1 ) 
        mergeNodes(iOldCurr,currElmt);
  

    if( chSelect ) {
        selectionSet = [currElmt];
        nodSelectionSet = [];
        elemMenu();    // reset context menu to reflect elements
    }

    breakElms(newElms);
    setUndo(1,0  /* ,1 */ );    // indicate backup elements SQL table
};

// function -- Model manipulation, data entry, and display

function relStr (f1) {

    if( f1 )
        return 'T';
    else
        return 'F';
}

function populateModelView() {
    oMLTable.fnClearTable();
    oMLTable.fnSort([]);

    for (var i = 1; i <= totEls; i++)
        oMLTable.fnAddData([i, modelElements[i].fromNode, modelElements[i].toNode, modelElements[i].dX,
                            modelElements[i].dY, modelElements[i].dZ, modelElements[i].memberType,
                            modelElements[i].betaAngle, modelElements[i].material,
                            relStr(modelElements[i].fromFXMemb),relStr(modelElements[i].fromFYMemb),
                            relStr(modelElements[i].fromFZMemb),relStr(modelElements[i].fromMXMemb),
                            relStr(modelElements[i].fromMYMemb),relStr(modelElements[i].fromMZMemb),
                            relStr(modelElements[i].toFXMemb),relStr(modelElements[i].toFYMemb),
                            relStr(modelElements[i].toFZMemb),relStr(modelElements[i].toMXMemb),
                            relStr(modelElements[i].toMYRest),relStr(modelElements[i].toMZMemb),
                            relStr(modelElements[i].fromFXRest),relStr(modelElements[i].fromFYRest),
                            relStr(modelElements[i].fromFZRest),relStr(modelElements[i].fromMXRest),
                            relStr(modelElements[i].fromMYRest),relStr(modelElements[i].fromMZRest),
                            relStr(modelElements[i].toFXRest),relStr(modelElements[i].toFYRest),
                            relStr(modelElements[i].toFZRest),relStr(modelElements[i].toMXRest),
                            relStr(modelElements[i].toMYRest),relStr(modelElements[i].toMZRest),

                            modelElements[i].lX,modelElements[i].lY,modelElements[i].lZ,
                            modelElements[i].kX,modelElements[i].kY,modelElements[i].kZ,
                            modelElements[i].cBZ,modelElements[i].cBY,

                            relStr(modelElements[i].stable),modelElements[i].stiffDist,modelElements[i].stiffI,
                            relStr(modelElements[i].tfaStiff),

                            modelElements[i].uX,modelElements[i].uY,modelElements[i].uZ,
                            modelElements[i].uXL,modelElements[i].uYL,modelElements[i].uZL,
                            modelElements[i].uXO,modelElements[i].uYO,modelElements[i].uZO,

                            modelElements[i].fromFXLoad,modelElements[i].fromFYLoad,
                            modelElements[i].fromFZLoad,modelElements[i].fromMXLoad,
                            modelElements[i].fromMYLoad,modelElements[i].fromMZLoad,
                            modelElements[i].toFXLoad,modelElements[i].toFYLoad,
                            modelElements[i].toFZLoad,modelElements[i].toMXLoad,
                            modelElements[i].toMYLoad,modelElements[i].toMZLoad,

                            modelElements[i].fromFXLoadL,modelElements[i].fromFYLoadL,
                            modelElements[i].fromFZLoadL,modelElements[i].fromMXLoadL,
                            modelElements[i].fromMYLoadL,modelElements[i].fromMZLoadL,
                            modelElements[i].toFXLoadL,modelElements[i].toFYLoadL,
                            modelElements[i].toFZLoadL,modelElements[i].toMXLoadL,
                            modelElements[i].toMYLoadL,modelElements[i].toMZLoadL,

                            modelElements[i].fromFXLoadO,modelElements[i].fromFYLoadO,
                            modelElements[i].fromFZLoadO,modelElements[i].fromMXLoadO,
                            modelElements[i].fromMYLoadO,modelElements[i].fromMZLoadO,
                            modelElements[i].toFXLoadO,modelElements[i].toFYLoadO,
                            modelElements[i].toFZLoadO,modelElements[i].toMXLoadO,
                            modelElements[i].toMYLoadO,modelElements[i].toMZLoadO,
                            modelElements[i].pressure,modelElements[i].fluid,
                            stringy(modelElements[i].group),modelElements[i].pipOD,
                            modelElements[i].pipTh ] );  /*,

                           '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>'] );  */
}

function saveMemberLibrary() {

    aData = lMemTable.fnGetData();

    $.ajax({
        type: "POST",
        url: "./php/saveMemberLibrary.php",
        data: {"userName": userName,
            "memData": aData },
        success: function(msg){
            resetMemberList(false);
            changedMemLib = false;
        }
    });
}

function saveMaterialLibrary() {

    aData = lMatTable.fnGetData();

    $.ajax({
        type: "POST",
        url: "./php/saveMaterialLibrary.php",
        data: {"userName": userName,
            "matData": aData },
        success: function(msg){
            resetMaterialList(false);
            changedMatLib = false;
        }
    });
}

function showScreen( screen ) {

    if( screen != "allGraphics" )
        savedScreen = screen;

    // if we are moving out of the member library and some changes have been made, we need to
    // save to library file

    if( !isMobile && changedMemLib && screen != "memberLibraryView")
        saveMemberLibrary();

    if( changedMatLib && screen != "materialLibraryView")
        saveMaterialLibrary();

    if (screen == "signIn") {
        heroActive = false;
        $('#hero').css('background-image', 'url("assets/img/steelstruc.jpg")');
        $('#hero').html('<h1>CloudCalc</h1><h4>Structural Analysis in the Cloud</font></h4>');
        $('#signIn').show();
        $('#topMenu').hide();
        $('#modelContainer').hide();
    }
    else {
        heroActive = true;
        $('#signIn').hide();
        $('#topMenu').show();
        if( isMobile ) {
            $('#hero').hide();
            $('#hero1').show();
        }
        else 
            $('#modelContainer').show();
    }

    if ((screen == "allGraphics" || allGraphics) && (isMobile || screen != "outputScreen") && (isMobile || screen != "signIn") ) {
        $('#inputCol1').hide();
        $('#inputCol2').hide();
        $('#spreadSheet').removeClass('span5').removeClass('span11').removeClass('span7').removeClass('span9').removeClass('span12').addClass('span1');
        $('#menu1').removeClass('span2').removeClass('span1').addClass('span12');
        $('#tableView').hide();
        allGraphics = true;
        if (isMobile) {
            $('#modelContainer').show();
            $('#inputCol1a').hide();

            if (screen == "outputScreen") {
                $('#outputScreen').show();
                $('#outputMenu1').removeClass('span2').addClass('span12');
                $('#hero3').html('<img src="assets/img/right-arrow-1.png">');
                $('#reportScreen').hide();
                $('#inputScreen').hide();
            }
            else {
                $('#inputScreen').show();
                $('#outputScreen').hide();
            }
        }
        else {
            $('#hero').hide();
            $('#hero1').show();
            $('#inputScreen').show();
            $('#outputScreen').hide();
            $('#modelContainer').removeClass('span7').removeClass('span1').removeClass('span3').removeClass('span5').addClass('span11');
        }
        respondCanvas();
        return;

    }
    else
    {
        if( isMobile ) {
            $('#modelContainer').hide();
            $('#spreadSheet').removeClass('span1').removeClass('span11').removeClass('span7').removeClass('span9').addClass('span12');
            $('#menu1').removeClass('span12').removeClass('span1').addClass('span2');
            allGraphics = false;
        }
        else {
            $('#hero1').hide();
            $('#hero').show();
            $('#spreadSheet').removeClass('span1').removeClass('span11').removeClass('span7').removeClass('span9').addClass('span5');
            $('#menu1').removeClass('span12').removeClass('span1').addClass('span2');
            $('#modelContainer').removeClass('span11').removeClass('span1').removeClass('span3').removeClass('span5').addClass('span7');

            if (screen != "signIn")
                respondCanvas();
            allGraphics = false;
        }
    }

    if (screen == "inputScreen") {
        $('#inputScreen').show();
        $('#inputCol1').show();
        if( isMobile )
            $('#inputCol1a').show();
        $('#inputCol2').show();
    }
    else {
        $('#inputScreen').hide();
    }

    if (screen == "outputScreen") {
        if( isMobile ) {
            $('#hero3').html('<h4><img src="assets/img/left-arrow-1.png">CloudCalc</h4>');
            $('#outputMenu1').removeClass('span12').addClass('span2');
            $('#reportScreen').show();
        }
        $('#outputScreen').show();
    }
    else
        $('#outputScreen').hide();

    if ( screen == "loadCaseBuilder" || screen == "nodalCoords" || screen == "modelListView" ||
         screen == "collaborate" || screen == "inputWiz" || screen == "inputDescr" ||
         screen == "memberLibraryView" || screen == "materialLibraryView" || screen == "register" ) {
        $('#tableView').show();
        if (screen == "loadCaseBuilder") {
            $('#loadCaseBuilder').show();
            $('#nodalCoords').hide();
            $('#collaborate').hide();
            $('#modelListView').hide();
            $('#inputWiz').hide();
            $('#inputDescr').hide();
            $('#memberLibraryView').hide();
            $('#materialLibraryView').hide();
            $('#register').hide();
      
            if( !isMobile ) {
                $('#spreadSheet').removeClass('span1').removeClass('span5').removeClass('span11').addClass('span9');
                $('#modelContainer').removeClass('span11').removeClass('span7').removeClass('span1').addClass('span3');
            }
            $('#menu1').removeClass('span12').removeClass('span1').addClass('span2');
            oLCTable.fnAdjustColumnSizing(false);
        }
        else
            if (screen == "nodalCoords") {
                $('#loadCaseBuilder').hide();
                $('#nodalCoords').show();
                $('#collaborate').hide();
                $('#modelListView').hide();
                $('#inputWiz').hide();
                $('#inputDescr').hide();
                $('#memberLibraryView').hide();
                $('#materialLibraryView').hide();
                $('#register').hide();
        
                if( !isMobile ) {
                    $('#spreadSheet').removeClass('span1').removeClass('span5').removeClass('span11').removeClass('span9').addClass('span7');
                    $('#modelContainer').removeClass('span11').removeClass('span3').removeClass('span7').removeClass('span1').addClass('span5');
                }
                $('#menu1').removeClass('span12').removeClass('span1').addClass('span2');
            }
            else
                if (screen == "modelListView") {
                    $('#loadCaseBuilder').hide();
                    $('#nodalCoords').hide();
                    $('#collaborate').hide();
                    populateModelView();
                    $('#modelListView').show();
                    $('#inputWiz').hide();
                    $('#inputDescr').hide();
                    $('#memberLibraryView').hide();
                    $('#materialLibraryView').hide();
                    $('#register').hide();
                    if( !isMobile ) {
                        $('#spreadSheet').removeClass('span1').removeClass('span5').removeClass('span7').removeClass('span9').addClass('span11');
                        $('#modelContainer').removeClass('span11').removeClass('span3').removeClass('span7').removeClass('span5').addClass('span1');
                        $('#modelContainer').hide();
                    }
                    $('#menu1').removeClass('span12').removeClass('span2').addClass('span1');
                }
                else {
                    if (screen == "collaborate") {
                        $('#loadCaseBuilder').hide();
                        $('#nodalCoords').hide();
                        $('#modelListView').hide();
                        $('#collaborate').show();
                        $('#inputWiz').hide();
                        $('#inputDescr').hide();
                        if( !isMobile ) {
                            $('#memberLibraryView').hide();
                            $('#materialLibraryView').hide();
                        }
                        $('#register').hide();
                    }
                    else {
                        if (screen == "inputWiz") {
                            $('#loadCaseBuilder').hide();
                            $('#nodalCoords').hide();
                            $('#collaborate').hide();
                            $('#modelListView').hide();
                            $('#inputWiz').show();
                            $('#inputDescr').hide();
                            $('#memberLibraryView').hide();
                            $('#materialLibraryView').hide();
                            $('#register').hide();
                        }
                        else if (screen == "inputDescr")  { // input descr
                            $('#loadCaseBuilder').hide();
                            $('#nodalCoords').hide();
                            $('#collaborate').hide();
                            $('#modelListView').hide();
                            $('#inputWiz').hide();
                            $('#inputDescr').show();
                            $('#memberLibraryView').hide();
                            $('#materialLibraryView').hide();
                            $('#register').hide();
                        }
                        else if (screen == "memberLibraryView") {
                            //
                            $('#loadCaseBuilder').hide();
                            $('#nodalCoords').hide();
                            $('#collaborate').hide();
                            $('#modelListView').hide();
                            $('#inputWiz').hide();
                            $('#inputDescr').hide();

                            $('#spreadSheet').removeClass('span1').removeClass('span5').removeClass('span7').removeClass('span9').addClass('span11');
                            $('#menu1').removeClass('span12').removeClass('span2').addClass('span1');
                            $('#modelContainer').removeClass('span11').removeClass('span3').removeClass('span7').removeClass('span5').addClass('span1');
                            $('#modelContainer').hide();

                            $('#memberLibraryView').show();
                            $('#materialLibraryView').hide();
                            $('#register').hide();
                        }
                        else {
                            if (screen == "materialLibraryView") {
                                $('#loadCaseBuilder').hide();
                                $('#nodalCoords').hide();
                                $('#collaborate').hide();
                                $('#modelListView').hide();
                                $('#inputWiz').hide();
                                $('#inputDescr').hide();

                                $('#spreadSheet').removeClass('span1').removeClass('span5').removeClass('span7').removeClass('span9').addClass('span11');
                                $('#menu1').removeClass('span12').removeClass('span2').addClass('span1');
                                $('#modelContainer').removeClass('span11').removeClass('span3').removeClass('span7').removeClass('span5').addClass('span1');
                                $('#modelContainer').hide();

                                $('#memberLibraryView').hide();
                                $('#materialLibraryView').show();
                                $('#register').hide();
                            }
                            else {
                                $('#loadCaseBuilder').hide();
                                $('#nodalCoords').hide();
                                $('#collaborate').hide();
                                $('#modelListView').hide();
                                $('#inputWiz').hide();
                                $('#inputDescr').hide();
                                $('#memberLibraryView').hide();
                                $('#materialLibraryView').hide();
                                $('#register').show();
                            }
                        }
                    }
                }
    }
    else
        $('#tableView').hide();
}

function setJobName(newName){
    if (newName) {
        jobName = newName;
        $('a.brand').html(jobName);
        resetDownload(jobName);

        if( jobName == "Unnamed Job" ) {
            $("#fromNode").prop('disabled', true);
            $("#toNode").prop('disabled', true);
            $("#dX").prop('disabled', true);
            $("#dY").prop('disabled', true);
            $("#dZ").prop('disabled', true);
        }
        else {
            $("#fromNode").prop('disabled', false);
            $("#toNode").prop('disabled', false);
            $("#dX").prop('disabled', false);
            $("#dY").prop('disabled', false);
            $("#dZ").prop('disabled', false);
        };

    }
}

function resetJobData(nwNam){

    isStatic = true;
    $('#dispTab').html('Displacements');

/*    var coords = [ {},
                   { x1:0.0,
                       y1:0.0,
                       z1:0.0,
                       x2:0.0,
                       y2:0.0,
                       z2:0.0 }];
*/
    initModElem();
    modelElements.length = 2;
    totEls = 0;
    currElmt = 1;
    selectionSet = [currElmt];
    nodSelectionSet = [];
    prisms= [];
    sprites = [];
    elemMenu();    // reset context menu to reflect elements

    fNodes = [];
    oNodeTable.fnClearTable();
    oNodeTable.fnSort([]);

    oMLTable.fnClearTable();
    oMLTable.fnSort([]);

    jobNotes = "Description/Notes for " + nwNam + ":";
    $('#jobDesc').val(jobNotes);

    oLCTable.fnClearTable();
    oLCTable.fnSort([]);
    oLCTable.fnAddData( [ '1', '1.0', '1.0', '1.0', '1.0','ASD','No','No','1.0','No','<a class="edit" href="">Edit</a>','<a class="delete" href="">Delete</a>'] );

    lCases[0] = {"mult1":"1.0","mult2":"1.0","mult3":"1.0","mult4":"1.0","code":"ASD","pDelta":"No","redStiff":"No","divBy":"1.0","warpYN":"No" };

    oShTable.fnClearTable();
    oShTable.fnSort([]);
    lShares = [];

    oTable1.fnClearTable();
    oTable1.fnSort([]);
    oTableF.fnClearTable();
    oTableF.fnSort([]);
    oTable2.fnClearTable();
    oTable2.fnSort([]);
    oTable3.fnClearTable();
    oTable3.fnSort([]);
    oTable4.fnClearTable();
    oTable4.fnSort([]);
    cColors = [0];
    oTable5.fnClearTable();
    oTable5.fnSort([]);

    undoLevel = -1;
    initUndo(0);

    //              setUndo(1, 0  /* , 0  */ );

    isStatic = true;
    $('#dispTab').html('Displacements');
    $('#freqTab').hide();
    $('#forceTab').show();
    $('#stressTab').show();
    $('#complyTab').show();
    $('#restraintTab').show();

    currentLoadCase = 0;
    totalLoadCases = 0;
    showScreen("inputScreen");
    groupList = ["Column", "Beam", "Brace"];

    displayElement(currElmt);
    deformed = false;
    cColor = false;
    drawModel(false,true);

    // clear graphics
}

function checkNode(field) {
    var ival = parseInt(field.val());
    if (!ival || (ival <= 0) || (ival > 8000000) || isNaN(ival)) {
        field.tooltip('show');
        field.focus();
        return false;
    }
    else {
        field.tooltip('hide');
        field.val(ival);
        return true;
    }
}

function checkDelta(field) {
    var rval = parseFloat(field.val().trim());
    if ((rval != rval) && field.val()) {
        field.tooltip('show');
        field.focus();
        return false;
    }
    else {
        field.tooltip('hide');
        if (field.val()) {
            str = " " + parseInt(field.val());
            rv = parseFloat(str);
            if (rval == rv) { // parseFloat(" " + parseInt(field.val())))
                rval += ".0";
            }
            field.val(rval);
        }
        return true;
    }
}

function checkBeta() {
    var field = $('#betaAngle');
    var rval = parseFloat(field.val());
    if ((rval != rval) || (rval < 0.0) || (rval >= 360.0)) {
        field.tooltip('show');
        field.focus();
        return false;
    }
    else {
        field.tooltip('hide');
        if (field.val()) {
            str = " " + parseInt(field.val());
            rv = parseFloat(str);
            if (rval == rv) { // parseFloat(" " + parseInt(field.val())))
                rval += ".0";
            }
            field.val(rval);
        }
        return true;
    }
}

function checkPipOD() {
    var field = $('#pipeOD');
    var rval = parseFloat(field.val());
    if ((rval != rval) || (rval <= 0.0)) {
        field.tooltip('show');
        field.focus();
        return false;
    }
    else {
        field.tooltip('hide');
        return true;
    }
}

function checkPipTh() {
    var field = $('#pipeTh');
    var rval = parseFloat(field.val());
    if ((rval != rval) || (rval <= 0.0)) {
        field.tooltip('show');
        field.focus();
        return false;
    }
    else {
        field.tooltip('hide');
        return true;
    }
}

function validEntry(checkLast){

    var field = $('#fromNode');
    if (!checkNode(field))
        return false;
    var ival1 = field.val();

    field = $('#toNode');
    if( !checkNode(field) )
        return false;

    if (ival1 == field.val()) {
        bootbox.alert("From Node and To Node cannot be the same!");
        $('#fromNode').focus();
        onFromNode = true;
        onToNode = false;
        return false;
    }

    field = $('#dX');
    if( !checkDelta(field) )
        return false;
    var istr1 = field.val();

    field = $('#dY');
    if( !checkDelta(field) )
        return false;
    var istr2 = field.val();

    field = $('#dZ');
    if( !checkDelta(field) )
        return false;
    var istr3 = field.val();
    if((istr1 == "" || istr1 == 0.0) && (istr2 == "" || istr2 == 0.0) && (istr3 == "" || istr3 == 0.0)) {

        if( !checkLast && currElmt > totEls )     // checkLast is only true for a NextEl() event
            return false;   // just navigate away from a blank extra element

        if( !onModelingScreen )
            return false;   // don't alert if on different screen

        bootbox.alert("All dimensions cannot be blank!");
        $('#dZ').focus();
        return false;
    }

    if (!checkBeta())
        return false;

    return true;
}

function displayElement(currElmt) { 
    if( currElmt == 0 )
        currElmt = 1;
    
    changeBeamColor(currElmt,highlight_color);
    refreshElements();
    if(currElmt > totEls) {
        newMember = true;

        if (currElmt == 1) {
            $('#fromNode').val(nodInc);
            $('#toNode').val(2*nodInc);
            $('#memberType').val(memberTypeArray[0]);
            $('pipeOD').val("");
            $('pipeTh').val("");
            $('#betaAngle').val("0.");

            $('#lX').val("");
            $('#lY').val("");
            $('#lZ').val("");
            $('#kX').val("");
            $('#kY').val("");
            $('#kZ').val("");
            $('#cBZ').val("");
            $('#cBY').val("");
            $('#contributesStability').attr('checked', false);

            $('#uX').val("");
            $('#uY').val("");
            $('#uZ').val("");

            $('#uXL').val("");
            $('#uYL').val("");
            $('#uZL').val("");
            $('#uXO').val("");
            $('#uYO').val("");
            $('#uZO').val("");
            $('#pressureLoad').val("");
            $('#fluidLoad').val("");
                
        }
        else {
            $('#fromNode').val($('#toNode').val());
            var ii = parseInt($('#fromNode').val());
            if (ii != ii) 
                $('#toNode').val("");
            else {
                var tn = getNewNode(ii + nodInc);
                $('#toNode').val(" " + tn); 
            }
            $('#memberType').val(modelElements[currElmt-1].memberType);
      
            if( modelElements[currElmt-1].pipOD == 0.0 )
                $('pipeOD').val("");
            else 
                $('pipeOD').val(modelElements[currElmt-1].pipOD);
        
            if( modelElements[currElmt-1].pipTh == 0.0 )
                $('pipeTh').val("");
            else 
                $('pipeTh').val(modelElements[currElmt-1].pipTh);
            $('#betaAngle').val(modelElements[currElmt-1].betaAngle);

            $('#lX').val("");
            $('#lY').val("");
            $('#lZ').val("");
            $('#kX').val("");
            $('#kY').val("");
            $('#kZ').val("");
            $('#cBZ').val("");
            $('#cBY').val("");

            $('#contributesStability').attr('checked', false);

            if (modelElements[currElmt-1].uX == 0.0 )
                $('#uX').val("");
            else
                $('#uX').val(modelElements[currElmt-1].uX);

            if (modelElements[currElmt-1].uY == 0.0 )
                $('#uY').val("");
            else
                $('#uY').val(modelElements[currElmt-1].uY);

            if (modelElements[currElmt-1].uZ == 0.0 )
                $('#uZ').val("");
            else
                $('#uZ').val(modelElements[currElmt-1].uZ);

            if (modelElements[currElmt-1].uXL == 0.0 )
                $('#uXL').val("");
            else
                $('#uXL').val(modelElements[currElmt-1].uXL);

            if (modelElements[currElmt-1].uYL == 0.0 )
                $('#uYL').val("");
            else
                $('#uYL').val(modelElements[currElmt-1].uYL);

            if (modelElements[currElmt-1].uZL == 0.0 )
                $('#uZL').val("");
            else
                $('#uZL').val(modelElements[currElmt-1].uZL);

            if (modelElements[currElmt-1].uXO == 0.0 )
                $('#uXO').val("");
            else
                $('#uXO').val(modelElements[currElmt-1].uXO);

            if (modelElements[currElmt-1].uYO == 0.0 )
                $('#uYO').val("");
            else
                $('#uYO').val(modelElements[currElmt-1].uYO);

            if (modelElements[currElmt-1].uZO == 0.0 )
                $('#uZO').val("");
            else
                $('#uZO').val(modelElements[currElmt-1].uZO);

            $('#pressureLoad').val(modelElements[currElmt-1].pressure);
            $('#fluidLoad').val(modelElements[currElmt-1].fluid);

        }
        getCoords();
        $('#dX').val("");
        $('#dY').val("");
        $('#dZ').val("");
        $('#material>option:eq(0)').attr('selected', true);
        $('#fromFXRestraint').attr('checked', false);
        $('#fromFYRestraint').attr('checked', false);
        $('#fromFZRestraint').attr('checked', false);
        $('#fromMXRestraint').attr('checked', false);
        $('#fromMYRestraint').attr('checked', false);
        $('#fromMZRestraint').attr('checked', false);
        $('#toFXRestraint').attr('checked', false);
        $('#toFYRestraint').attr('checked', false);
        $('#toFZRestraint').attr('checked', false);
        $('#toMXRestraint').attr('checked', false);
        $('#toMYRestraint').attr('checked', false);
        $('#toMZRestraint').attr('checked', false);
        $('#fromFXMember').attr('checked', false);
        $('#fromFYMember').attr('checked', false);
        $('#fromFZMember').attr('checked', false);
        $('#fromMXMember').attr('checked', false);
        $('#fromMYMember').attr('checked', false);
        $('#fromMZMember').attr('checked', false);
        $('#toFXMember').attr('checked', false);
        $('#toFYMember').attr('checked', false);
        $('#toFZMember').attr('checked', false);
        $('#toMXMember').attr('checked', false);
        $('#toMYMember').attr('checked', false);
        $('#toMZMember').attr('checked', false);
        $('#fromFXLoad').val("");
        $('#fromFYLoad').val("");
        $('#fromFZLoad').val("");
        $('#fromMXLoad').val("");
        $('#fromMYLoad').val("");
        $('#fromMZLoad').val("");
        $('#toFXLoad').val("");
        $('#toFYLoad').val("");
        $('#toFZLoad').val("");
        $('#toMXLoad').val("");
        $('#toMYLoad').val("");
        $('#toMZLoad').val("");

        $('#fromFXLoadL').val("");
        $('#fromFYLoadL').val("");
        $('#fromFZLoadL').val("");
        $('#fromMXLoadL').val("");
        $('#fromMYLoadL').val("");
        $('#fromMZLoadL').val("");
        $('#toFXLoadL').val("");
        $('#toFYLoadL').val("");
        $('#toFZLoadL').val("");
        $('#toMXLoadL').val("");
        $('#toMYLoadL').val("");
        $('#toMZLoadL').val("");

        $('#fromFXLoadO').val("");
        $('#fromFYLoadO').val("");
        $('#fromFZLoadO').val("");
        $('#fromMXLoadO').val("");
        $('#fromMYLoadO').val("");
        $('#fromMZLoadO').val("");
        $('#toFXLoadO').val("");
        $('#toFYLoadO').val("");
        $('#toFZLoadO').val("");
        $('#toMXLoadO').val("");
        $('#toMYLoadO').val("");
        $('#toMZLoadO').val("");
        gN.clear();

        if( chinese )
            $("#elemPos").html(" "+currElmt+"/"+totEls+" "+translate("Element "));
        else
            $('#elemPos').text(translate("Element ")+currElmt+"/"+totEls);
        $('#fromNode').focus();
        onFromNode = true;
        onToNode = false;
    }
    else {

        newMember = false;

        $('#fromNode').val(" "+modelElements[currElmt].fromNode);
        $('#toNode').val(" "+modelElements[currElmt].toNode);
        if( modelElements[currElmt].dX == 0.0 )
            $('#dX').val("");
        else
            $('#dX').val(""+modelElements[currElmt].dX);
        if( modelElements[currElmt].dY == 0.0 )
            $('#dY').val("");
        else
            $('#dY').val(""+modelElements[currElmt].dY);
        if( modelElements[currElmt].dZ == 0.0 )
            $('#dZ').val("");
        else
            $('#dZ').val(""+modelElements[currElmt].dZ);
        $('#memberType').val(modelElements[currElmt].memberType);

        if( modelElements[currElmt].pipOD == 0.0 )
            $('#pipeOD').val("");
        else
            $('#pipeOD').val(""+modelElements[currElmt].pipOD);

        if( modelElements[currElmt].pipTh == 0.0 )
            $('#pipeTh').val("");
        else
            $('#pipeTh').val(""+modelElements[currElmt].pipTh);

        $('#betaAngle').val(modelElements[currElmt].betaAngle);
        //                $('#material>option:eq(0)').attr('selected', true);
        $('#material').val(modelElements[currElmt].material);
        $('#fromFXRestraint').attr('checked', modelElements[currElmt].fromFXRest);
        $('#fromFYRestraint').attr('checked', modelElements[currElmt].fromFYRest);
        $('#fromFZRestraint').attr('checked', modelElements[currElmt].fromFZRest);
        $('#fromMXRestraint').attr('checked', modelElements[currElmt].fromMXRest);
        $('#fromMYRestraint').attr('checked', modelElements[currElmt].fromMYRest);
        $('#fromMZRestraint').attr('checked', modelElements[currElmt].fromMZRest);
        $('#toFXRestraint').attr('checked', modelElements[currElmt].toFXRest);
        $('#toFYRestraint').attr('checked', modelElements[currElmt].toFYRest);
        $('#toFZRestraint').attr('checked', modelElements[currElmt].toFZRest);
        $('#toMXRestraint').attr('checked', modelElements[currElmt].toMXRest);
        $('#toMYRestraint').attr('checked', modelElements[currElmt].toMYRest);
        $('#toMZRestraint').attr('checked', modelElements[currElmt].toMZRest);
        $('#fromFXMember').attr('checked', modelElements[currElmt].fromFXMemb);
        $('#fromFYMember').attr('checked', modelElements[currElmt].fromFYMemb);
        $('#fromFZMember').attr('checked', modelElements[currElmt].fromFZMemb);
        $('#fromMXMember').attr('checked', modelElements[currElmt].fromMXMemb);
        $('#fromMYMember').attr('checked', modelElements[currElmt].fromMYMemb);
        $('#fromMZMember').attr('checked', modelElements[currElmt].fromMZMemb);
        $('#toFXMember').attr('checked', modelElements[currElmt].toFXMemb);
        $('#toFYMember').attr('checked', modelElements[currElmt].toFYMemb);
        $('#toFZMember').attr('checked', modelElements[currElmt].toFZMemb);
        $('#toMXMember').attr('checked', modelElements[currElmt].toMXMemb);
        $('#toMYMember').attr('checked', modelElements[currElmt].toMYMemb);
        $('#toMZMember').attr('checked', modelElements[currElmt].toMZMemb);

        if (modelElements[currElmt].lX == 0.0 )
            $('#lX').val("");
        else
            $('#lX').val(modelElements[currElmt].lX);
        if (modelElements[currElmt].lY == 0.0 )
            $('#lY').val("");
        else
            $('#lY').val(modelElements[currElmt].lY);
        if (modelElements[currElmt].lZ == 0.0 )
            $('#lZ').val("");
        else
            $('#lZ').val(modelElements[currElmt].lZ);

        if (modelElements[currElmt].kX == 0.0 )
            $('#kX').val("");
        else
            $('#kX').val(modelElements[currElmt].kX);
        if (modelElements[currElmt].kY == 0.0 )
            $('#kY').val("");
        else
            $('#kY').val(modelElements[currElmt].kY);
        if (modelElements[currElmt].kZ == 0.0 )
            $('#kZ').val("");
        else
            $('#kZ').val(modelElements[currElmt].kZ);

        if (modelElements[currElmt].cBZ == 0.0 )
            $('#cBZ').val("");
        else
            $('#cBZ').val(modelElements[currElmt].cBZ);

        if (modelElements[currElmt].cBY == 0.0 )
            $('#cBY').val("");
        else
            $('#cBY').val(modelElements[currElmt].cBY);

        $('#contribStability').attr('checked', modelElements[currElmt].stable);

        if (modelElements[currElmt].stiffDist == 0.0 )
            $('#stiffDist').val("");
        else
            $('#stiffDist').val(modelElements[currElmt].stiffDist);

        if (modelElements[currElmt].stiffI == 0.0 )
            $('#stiffI').val("");
        else
            $('#stiffI').val(modelElements[currElmt].stiffI);

        $('#tfaStiff').attr('checked', modelElements[currElmt].tfaStiff);

        if( modelElements[currElmt].uX == 0.0 )
            $('#uX').val("");
        else
            $('#uX').val(modelElements[currElmt].uX);
        if( modelElements[currElmt].uY == 0.0 )
            $('#uY').val("");
        else
            $('#uY').val(modelElements[currElmt].uY);
        if( modelElements[currElmt].uZ == 0.0 )
            $('#uZ').val("");
        else
            $('#uZ').val(modelElements[currElmt].uZ);
        if( modelElements[currElmt].fromFXLoad == 0.0 )
            $('#fromFXLoad').val("");
        else
            $('#fromFXLoad').val(modelElements[currElmt].fromFXLoad);
        if( modelElements[currElmt].fromFYLoad == 0.0 )
            $('#fromFYLoad').val("");
        else
            $('#fromFYLoad').val(modelElements[currElmt].fromFYLoad);
        if( modelElements[currElmt].fromFZLoad == 0.0 )
            $('#fromFZLoad').val("");
        else
            $('#fromFZLoad').val(modelElements[currElmt].fromFZLoad);
        if( modelElements[currElmt].fromMXLoad == 0.0 )
            $('#fromMXLoad').val("");
        else
            $('#fromMXLoad').val(modelElements[currElmt].fromMXLoad);
        if( modelElements[currElmt].fromMYLoad == 0.0 )
            $('#fromMYLoad').val("");
        else
            $('#fromMYLoad').val(modelElements[currElmt].fromMYLoad);
        if( modelElements[currElmt].fromMZLoad == 0.0 )
            $('#fromMZLoad').val("");
        else
            $('#fromMZLoad').val(modelElements[currElmt].fromMZLoad);
        if( modelElements[currElmt].toFXLoad == 0.0 )
            $('#toFXLoad').val("");
        else
            $('#toFXLoad').val(modelElements[currElmt].toFXLoad);
        if( modelElements[currElmt].toFYLoad == 0.0 )
            $('#toFYLoad').val("");
        else
            $('#toFYLoad').val(modelElements[currElmt].toFYLoad);
        if( modelElements[currElmt].toFZLoad == 0.0 )
            $('#toFZLoad').val("");
        else
            $('#toFZLoad').val(modelElements[currElmt].toFZLoad);
        if( modelElements[currElmt].toMXLoad == 0.0 )
            $('#toMXLoad').val("");
        else
            $('#toMXLoad').val(modelElements[currElmt].toMXLoad);
        if( modelElements[currElmt].toMYLoad == 0.0 )
            $('#toMYLoad').val("");
        else
            $('#toMYLoad').val(modelElements[currElmt].toMYLoad);
        if( modelElements[currElmt].toMZLoad == 0.0 )
            $('#toMZLoad').val("");
        else
            $('#toMZLoad').val(modelElements[currElmt].toMZLoad);

        if( modelElements[currElmt].uXL == 0.0 )
            $('#uXL').val("");
        else
            $('#uXL').val(modelElements[currElmt].uXL);
        if( modelElements[currElmt].uYL == 0.0 )
            $('#uYL').val("");
        else
            $('#uYL').val(modelElements[currElmt].uYL);
        if( modelElements[currElmt].uZL == 0.0 )
            $('#uZL').val("");
        else
            $('#uZL').val(modelElements[currElmt].uZL);
        if( modelElements[currElmt].fromFXLoadL == 0.0 )
            $('#fromFXLoadL').val("");
        else
            $('#fromFXLoadL').val(modelElements[currElmt].fromFXLoadL);
        if( modelElements[currElmt].fromFYLoadL == 0.0 )
            $('#fromFYLoadL').val("");
        else
            $('#fromFYLoadL').val(modelElements[currElmt].fromFYLoadL);
        if( modelElements[currElmt].fromFZLoadL == 0.0 )
            $('#fromFZLoadL').val("");
        else
            $('#fromFZLoadL').val(modelElements[currElmt].fromFZLoadL);
        if( modelElements[currElmt].fromMXLoadL == 0.0 )
            $('#fromMXLoadL').val("");
        else
            $('#fromMXLoadL').val(modelElements[currElmt].fromMXLoadL);
        if( modelElements[currElmt].fromMYLoadL == 0.0 )
            $('#fromMYLoadL').val("");
        else
            $('#fromMYLoadL').val(modelElements[currElmt].fromMYLoadL);
        if( modelElements[currElmt].fromMZLoadL == 0.0 )
            $('#fromMZLoadL').val("");
        else
            $('#fromMZLoadL').val(modelElements[currElmt].fromMZLoadL);
        if( modelElements[currElmt].toFXLoadL == 0.0 )
            $('#toFXLoadL').val("");
        else
            $('#toFXLoadL').val(modelElements[currElmt].toFXLoadL);
        if( modelElements[currElmt].toFYLoadL == 0.0 )
            $('#toFYLoadL').val("");
        else
            $('#toFYLoadL').val(modelElements[currElmt].toFYLoadL);
        if( modelElements[currElmt].toFZLoadL == 0.0 )
            $('#toFZLoadL').val("");
        else
            $('#toFZLoadL').val(modelElements[currElmt].toFZLoadL);
        if( modelElements[currElmt].toMXLoadL == 0.0 )
            $('#toMXLoadL').val("");
        else
            $('#toMXLoadL').val(modelElements[currElmt].toMXLoadL);
        if( modelElements[currElmt].toMYLoadL == 0.0 )
            $('#toMYLoadL').val("");
        else
            $('#toMYLoadL').val(modelElements[currElmt].toMYLoadL);
        if( modelElements[currElmt].toMZLoadL == 0.0 )
            $('#toMZLoadL').val("");
        else
            $('#toMZLoadL').val(modelElements[currElmt].toMZLoadL);

        if( modelElements[currElmt].uXO == 0.0 )
            $('#uXO').val("");
        else
            $('#uXO').val(modelElements[currElmt].uXO);
        if( modelElements[currElmt].uYO == 0.0 )
            $('#uYO').val("");
        else
            $('#uYO').val(modelElements[currElmt].uYO);
        if( modelElements[currElmt].uZO == 0.0 )
            $('#uZO').val("");
        else
            $('#uZO').val(modelElements[currElmt].uZO);
        if( modelElements[currElmt].fromFXLoadO == 0.0 )
            $('#fromFXLoadO').val("");
        else
            $('#fromFXLoadO').val(modelElements[currElmt].fromFXLoadO);
        if( modelElements[currElmt].fromFYLoadO == 0.0 )
            $('#fromFYLoadO').val("");
        else
            $('#fromFYLoadO').val(modelElements[currElmt].fromFYLoadO);
        if( modelElements[currElmt].fromFZLoadO == 0.0 )
            $('#fromFZLoadO').val("");
        else
            $('#fromFZLoadO').val(modelElements[currElmt].fromFZLoadO);
        if( modelElements[currElmt].fromMXLoadO == 0.0 )
            $('#fromMXLoadO').val("");
        else
            $('#fromMXLoadO').val(modelElements[currElmt].fromMXLoadO);
        if( modelElements[currElmt].fromMYLoadO == 0.0 )
            $('#fromMYLoadO').val("");
        else
            $('#fromMYLoadO').val(modelElements[currElmt].fromMYLoadO);
        if( modelElements[currElmt].fromMZLoadO == 0.0 )
            $('#fromMZLoadO').val("");
        else
            $('#fromMZLoadO').val(modelElements[currElmt].fromMZLoadO);
        if( modelElements[currElmt].toFXLoadO == 0.0 )
            $('#toFXLoadO').val("");
        else
            $('#toFXLoadO').val(modelElements[currElmt].toFXLoadO);
        if( modelElements[currElmt].toFYLoadO == 0.0 )
            $('#toFYLoadO').val("");
        else
            $('#toFYLoadO').val(modelElements[currElmt].toFYLoadO);
        if( modelElements[currElmt].toFZLoadO == 0.0 )
            $('#toFZLoadO').val("");
        else
            $('#toFZLoadO').val(modelElements[currElmt].toFZLoadO);
        if( modelElements[currElmt].toMXLoadO == 0.0 )
            $('#toMXLoadO').val("");
        else
            $('#toMXLoadO').val(modelElements[currElmt].toMXLoadO);
        if( modelElements[currElmt].toMYLoadO == 0.0 )
            $('#toMYLoadO').val("");
        else
            $('#toMYLoadO').val(modelElements[currElmt].toMYLoadO);
        if( modelElements[currElmt].toMZLoadO == 0.0 )
            $('#toMZLoadO').val("");
        else
            $('#toMZLoadO').val(modelElements[currElmt].toMZLoadO);

        if( modelElements[currElmt].pressure == 0.0 )
            $('#pressureLoad').val("");
        else
            $('#pressureLoad').val(modelElements[currElmt].pressure);
        if( modelElements[currElmt].fluid == 0.0 )
            $('#fluidLoad').val("");
        else
            $('#fluidLoad').val(modelElements[currElmt].fluid);

        gN.clear();
        if( modelElements[currElmt].group ) {
            var gp = JSON.parse(modelElements[currElmt].group);
            if( gp )
                gN.addToSelection(gp,true);
        }

        if( chinese )
            $("#elemPos").html(" "+currElmt+"/"+totEls+" "+translate("Element "));
        else
            $('#elemPos').text(translate("Element ")+currElmt+"/"+totEls);
    }

    var disAble;  
    if( !editRights ||(jobName=='Unnamed Job') )
        disAble = true;
    else
        disAble = false

    $(".innput").prop('disabled', disAble );
    if( disAble )
        $(".innput1").hide();
    else
        $(".innput1").show();

    if( $('#memberType').val() == "PipeCustom" )
        $('#custPipe').show();
    else                  
        $('#custPipe').hide();
       
    if( $('#memberType').val().substring(0, 4) == 'Pipe' || 
      $('#memberType').val().substring(0, 3) == 'HSS' )
        $('#accordionPipe').show();
    else
        $('#accordionPipe').hide();
}

function getScreenEntries() {
    var hid;
    if( !modelElements[currElmt] )
        //              if( currElmt > totEls )
        hid = false;
    else
        hid = modelElements[currElmt].hidden;

    var st = gN.getRawValue();
    if( st ) {
        gN.addToSelection({id: st, name: st});
        if( groupList.indexOf(st) < 0 ) {
            groupList.push(st);
            resetGroupLists(groupList);
        }
    }

    var o = { jobName:jobName,
        order: currElmt,
        keyID: 0,
        fromNode:parseInt($('#fromNode').val()),
        toNode:parseInt($('#toNode').val()),
        dX:parseFloat($('#dX').val()),
        dY:parseFloat($('#dY').val()),
        dZ:parseFloat($('#dZ').val()),
        memberType:($('#memberType').val()),
        pipOD: parseFloat($('#pipeOD').val()),
        pipTh: parseFloat($('#pipeTh').val()),
        betaAngle:parseFloat($('#betaAngle').val()),
        material:($('#material').val()),
        fromFXRest: ($('#fromFXRestraint').is(':checked')),
        fromFYRest: ($('#fromFYRestraint').is(':checked')),
        fromFZRest: ($('#fromFZRestraint').is(':checked')),
        fromMXRest: ($('#fromMXRestraint').is(':checked')),
        fromMYRest: ($('#fromMYRestraint').is(':checked')),
        fromMZRest: ($('#fromMZRestraint').is(':checked')),
        toFXRest: ($('#toFXRestraint').is(':checked')),
        toFYRest: ($('#toFYRestraint').is(':checked')),
        toFZRest: ($('#toFZRestraint').is(':checked')),
        toMXRest: ($('#toMXRestraint').is(':checked')),
        toMYRest: ($('#toMYRestraint').is(':checked')),
        toMZRest: ($('#toMZRestraint').is(':checked')),
        fromFXMemb: ($('#fromFXMember').is(':checked')),
        fromFYMemb: ($('#fromFYMember').is(':checked')),
        fromFZMemb: ($('#fromFZMember').is(':checked')),
        fromMXMemb: ($('#fromMXMember').is(':checked')),
        fromMYMemb: ($('#fromMYMember').is(':checked')),
        fromMZMemb: ($('#fromMZMember').is(':checked')),
        toFXMemb: ($('#toFXMember').is(':checked')),
        toFYMemb: ($('#toFYMember').is(':checked')),
        toFZMemb: ($('#toFZMember').is(':checked')),
        toMXMemb: ($('#toMXMember').is(':checked')),
        toMYMemb: ($('#toMYMember').is(':checked')),
        toMZMemb: ($('#toMZMember').is(':checked')),
        uX: parseFloat($('#uX').val()),
        uY: parseFloat($('#uY').val()),
        uZ: parseFloat($('#uZ').val()),
        fromFXLoad: parseFloat($('#fromFXLoad').val()),
        fromFYLoad: parseFloat($('#fromFYLoad').val()),
        fromFZLoad: parseFloat($('#fromFZLoad').val()),
        fromMXLoad: parseFloat($('#fromMXLoad').val()),
        fromMYLoad: parseFloat($('#fromMYLoad').val()),
        fromMZLoad: parseFloat($('#fromMZLoad').val()),
        toFXLoad: parseFloat($('#toFXLoad').val()),
        toFYLoad: parseFloat($('#toFYLoad').val()),
        toFZLoad: parseFloat($('#toFZLoad').val()),
        toMXLoad: parseFloat($('#toMXLoad').val()),
        toMYLoad: parseFloat($('#toMYLoad').val()),
        toMZLoad: parseFloat($('#toMZLoad').val()),

        uXL: parseFloat($('#uXL').val()),
        uYL: parseFloat($('#uYL').val()),
        uZL: parseFloat($('#uZL').val()),
        fromFXLoadL: parseFloat($('#fromFXLoadL').val()),
        fromFYLoadL: parseFloat($('#fromFYLoadL').val()),
        fromFZLoadL: parseFloat($('#fromFZLoadL').val()),
        fromMXLoadL: parseFloat($('#fromMXLoadL').val()),
        fromMYLoadL: parseFloat($('#fromMYLoadL').val()),
        fromMZLoadL: parseFloat($('#fromMZLoadL').val()),
        toFXLoadL: parseFloat($('#toFXLoadL').val()),
        toFYLoadL: parseFloat($('#toFYLoadL').val()),
        toFZLoadL: parseFloat($('#toFZLoadL').val()),
        toMXLoadL: parseFloat($('#toMXLoadL').val()),
        toMYLoadL: parseFloat($('#toMYLoadL').val()),
        toMZLoadL: parseFloat($('#toMZLoadL').val()),

        uXO: parseFloat($('#uXO').val()),
        uYO: parseFloat($('#uYO').val()),
        uZO: parseFloat($('#uZO').val()),
        fromFXLoadO: parseFloat($('#fromFXLoadO').val()),
        fromFYLoadO: parseFloat($('#fromFYLoadO').val()),
        fromFZLoadO: parseFloat($('#fromFZLoadO').val()),
        fromMXLoadO: parseFloat($('#fromMXLoadO').val()),
        fromMYLoadO: parseFloat($('#fromMYLoadO').val()),
        fromMZLoadO: parseFloat($('#fromMZLoadO').val()),
        toFXLoadO: parseFloat($('#toFXLoadO').val()),
        toFYLoadO: parseFloat($('#toFYLoadO').val()),
        toFZLoadO: parseFloat($('#toFZLoadO').val()),
        toMXLoadO: parseFloat($('#toMXLoadO').val()),
        toMYLoadO: parseFloat($('#toMYLoadO').val()),
        toMZLoadO: parseFloat($('#toMZLoadO').val()),

        lX: parseFloat($('#lX').val()),
        lY: parseFloat($('#lY').val()),
        lZ: parseFloat($('#lZ').val()),
        kX: parseFloat($('#kX').val()),
        kY: parseFloat($('#kY').val()),
        kZ: parseFloat($('#kZ').val()),
        cBZ: parseFloat($('#cBZ').val()),
        cBY: parseFloat($('#cBY').val()),
        stable: $('#contribStability').is(':checked'),

        stiffDist: parseFloat($('#stiffDist').val()),
        stiffI: parseFloat($('#stiffI').val()),
        tfaStiff: $('#tfaStiff').is(':checked'),
            
        pressure: parseFloat($('#pressureLoad').val()),
        fluid: parseFloat($('#fluidLoad').val()),
            
        group: "",
        hidden: hid,  // modelElements[currElmt].hidden,

        totEls:totEls };

    var gp = gN.getSelectedItems();
    var chg = false;
    for (var i=0; i<gp.length; i++ ) {
        if (gp[i].name) {
            if (groupList.indexOf(gp[i].name) < 0) {
                groupList.push(gp[i].name)
                chg = true;
            }
        }
    }
    if( chg )
        resetGroupLists(groupList);

    if( gp )
        o.group = JSON.stringify(gp);
    if( o.group == "[]" )
        o.group = "";
    if( o.dX != o.dX) o.dX = 0.0;
    if( o.dY != o.dY) o.dY = 0.0;
    if( o.dZ != o.dZ) o.dZ = 0.0;
    if( o.uX != o.uX) o.uX = 0.0;
    if( o.uY != o.uY) o.uY = 0.0;
    if( o.uZ != o.uZ) o.uZ = 0.0;
    if( o.pipOD != o.pipOD) o.pipOD = 0.0;
    if( o.pipTh != o.pipTh) o.pipTh = 0.0;
    if( o.fromFXLoad != o.fromFXLoad) o.fromFXLoad = 0.0;
    if( o.fromFYLoad != o.fromFYLoad) o.fromFYLoad = 0.0;
    if( o.fromFZLoad != o.fromFZLoad) o.fromFZLoad = 0.0;
    if( o.fromMXLoad != o.fromMXLoad) o.fromMXLoad = 0.0;
    if( o.fromMYLoad != o.fromMYLoad) o.fromMYLoad = 0.0;
    if( o.fromMZLoad != o.fromMZLoad) o.fromMZLoad = 0.0;
    if( o.toFXLoad != o.toFXLoad) o.toFXLoad = 0.0;
    if( o.toFYLoad != o.toFYLoad) o.toFYLoad = 0.0;
    if( o.toFZLoad != o.toFZLoad) o.toFZLoad = 0.0;
    if( o.toMXLoad != o.toMXLoad) o.toMXLoad = 0.0;
    if( o.toMYLoad != o.toMYLoad) o.toMYLoad = 0.0;
    if( o.toMZLoad != o.toMZLoad) o.toMZLoad = 0.0;

    if( o.uXL != o.uXL) o.uXL = 0.0;
    if( o.uYL != o.uYL) o.uYL = 0.0;
    if( o.uZL != o.uZL) o.uZL = 0.0;
    if( o.fromFXLoadL != o.fromFXLoadL) o.fromFXLoadL = 0.0;
    if( o.fromFYLoadL != o.fromFYLoadL) o.fromFYLoadL = 0.0;
    if( o.fromFZLoadL != o.fromFZLoadL) o.fromFZLoadL = 0.0;
    if( o.fromMXLoadL != o.fromMXLoadL) o.fromMXLoadL = 0.0;
    if( o.fromMYLoadL != o.fromMYLoadL) o.fromMYLoadL = 0.0;
    if( o.fromMZLoadL != o.fromMZLoadL) o.fromMZLoadL = 0.0;
    if( o.toFXLoadL != o.toFXLoadL) o.toFXLoadL = 0.0;
    if( o.toFYLoadL != o.toFYLoadL) o.toFYLoadL = 0.0;
    if( o.toFZLoadL != o.toFZLoadL) o.toFZLoadL = 0.0;
    if( o.toMXLoadL != o.toMXLoadL) o.toMXLoadL = 0.0;
    if( o.toMYLoadL != o.toMYLoadL) o.toMYLoadL = 0.0;
    if( o.toMZLoadL != o.toMZLoadL) o.toMZLoadL = 0.0;

    if( o.uXO != o.uXO) o.uXO = 0.0;
    if( o.uYO != o.uYO) o.uYO = 0.0;
    if( o.uZO != o.uZO) o.uZO = 0.0;
    if( o.fromFXLoadO != o.fromFXLoadO) o.fromFXLoadO = 0.0;
    if( o.fromFYLoadO != o.fromFYLoadO) o.fromFYLoadO = 0.0;
    if( o.fromFZLoadO != o.fromFZLoadO) o.fromFZLoadO = 0.0;
    if( o.fromMXLoadO != o.fromMXLoadO) o.fromMXLoadO = 0.0;
    if( o.fromMYLoadO != o.fromMYLoadO) o.fromMYLoadO = 0.0;
    if( o.fromMZLoadO != o.fromMZLoadO) o.fromMZLoadO = 0.0;
    if( o.toFXLoadO != o.toFXLoadO) o.toFXLoadO = 0.0;
    if( o.toFYLoadO != o.toFYLoadO) o.toFYLoadO = 0.0;
    if( o.toFZLoadO != o.toFZLoadO) o.toFZLoadO = 0.0;
    if( o.toMXLoadO != o.toMXLoadO) o.toMXLoadO = 0.0;
    if( o.toMYLoadO != o.toMYLoadO) o.toMYLoadO = 0.0;
    if( o.toMZLoadO != o.toMZLoadO) o.toMZLoadO = 0.0;

    if( o.lX != o.lX) o.lX = 0.0;
    if( o.lY != o.lY) o.lY = 0.0;
    if( o.lZ != o.lZ) o.lZ = 0.0;
    if( o.kX != o.kX) o.kX = 0.0;
    if( o.kY != o.kY) o.kY = 0.0;
    if( o.kZ != o.kZ) o.kZ = 0.0;

    if( o.cBZ != o.cBZ) o.cBZ = 0.0;
    if( o.cBY != o.cBY) o.cBY = 0.0;

    if( o.stiffDist != o.stiffDist) o.stiffDist = 0.0;
    if( o.stiffI != o.stiffI) o.stiffI = 0.0;
  
    if( o.pressure != o.pressure ) o.pressure = 0.0;
    if( o.fluid != o.fluid ) o.fluid = 0.0;

    return o;
}

function randomInteger(n) {
    var i = Math.random();
    var num = Math.floor(i * n + 1);
    return num;
}

function calcCoords() {
    coords[1] = {
        x1: 0.0,
        y1: 0.0,
        z1: 0.0,
        x2: modelElements[1].dX / uConstLength,
        y2: modelElements[1].dY / uConstLength,
        z2: modelElements[1].dZ / uConstLength
    }

    // initialize all nodes
    for (var i = 1; i <= totEls; i++) {
        coords[i] = {
            x1: 0.001234, // magic number
            y1: 0.001234,
            z1: 0.001234,
            x2: 0.001234,
            y2: 0.001234,
            z2: 0.001234
        };
    }

    // fix nodes that have been defined

    var xmin1 = 0.0;
    var ymin1 = 0.0;
    var zmin1 = 0.0;
    var xmax1 = 1.0;
    var ymax1 = 1.0;
    var zmax1 = 1.0;

    var iNodes = oNodeTable.fnSettings().fnRecordsTotal();
    fNodes.length = 0;

    for (var j = 0; j < iNodes; j++) {
        var aData = oNodeTable.fnGetData(j);
        node = parseInt(aData[0]);
        x = parseFloat(aData[1]);
        y = parseFloat(aData[2]);
        z = parseFloat(aData[3]);

        fNodes.push({
            "node": node,
            "x": x,
            "y": y,
            "z": z
        });

        x /= uConstLength;
        y /= uConstLength;
        z /= uConstLength;

        if (j == 0) {
            var xmin1 = x;
            var ymin1 = y;
            var zmin1 = z;
            var xmax1 = x;
            var ymax1 = y;
            var zmax1 = z;
        }
        else {
            if (x < xmin1)
                xmin1 = x;
            if (x > xmax1)
                xmax1 = x;
            if (y < ymin1)
                ymin1 = y;
            if (y > ymax1)
                ymax1 = y;
            if (z < zmin1)
                zmin1 = z;
            if (z > zmax1)
                zmax1 = z;
        }

        for (var i = 1; i <= totEls; i++) {
            if (modelElements[i].fromNode == node) {
                coords[i].x1 = x;
                coords[i].y1 = y;
                coords[i].z1 = z;
                coords[i].x2 = x + modelElements[i].dX / uConstLength;
                coords[i].y2 = y + modelElements[i].dY / uConstLength;
                coords[i].z2 = z + modelElements[i].dZ / uConstLength;
            }
            else
                if (modelElements[i].toNode == node) {
                    coords[i].x2 = x;
                    coords[i].y2 = y;
                    coords[i].z2 = z;
                    coords[i].x1 = x - modelElements[i].dX / uConstLength;
                    coords[i].y1 = y - modelElements[i].dY / uConstLength;
                    coords[i].z1 = z - modelElements[i].dZ / uConstLength;
                };
        }
    }

    var oldNotDone = 0;
    var notDone = 1;

    xmin = xmin1;
    ymin = ymin1;
    zmin = zmin1;
    xmax = xmax1;
    ymax = ymax1;
    zmax = zmax1;

    while (notDone > 0) {

        oldNotDone = notDone;
        notDone = 0;

        for (var i = 1; i <= totEls; i++) {
            if (coords[i].x1 != 0.001234 && coords[i].x2 == 0.001234) {
                coords[i].x2 = coords[i].x1 + modelElements[i].dX / uConstLength;
                coords[i].y2 = coords[i].y1 + modelElements[i].dY / uConstLength;
                coords[i].z2 = coords[i].z1 + modelElements[i].dZ / uConstLength;
            }
            else
                if (coords[i].x1 == 0.001234 && coords[i].x2 != 0.001234) {
                    coords[i].x1 = coords[i].x2 - modelElements[i].dX / uConstLength;
                    coords[i].y1 = coords[i].y2 - modelElements[i].dY / uConstLength;
                    coords[i].z1 = coords[i].z2 - modelElements[i].dZ / uConstLength;
                }

            if (coords[i].x1 != 0.001234)
                for (var j = 1; j <= totEls; j++) {
                    if (i != j) {
                        if ((modelElements[i].fromNode == modelElements[j].fromNode) &&
                        (coords[j].x1 == 0.001234)) {
                            coords[j].x1 = coords[i].x1;
                            coords[j].y1 = coords[i].y1;
                            coords[j].z1 = coords[i].z1;
                            if (coords[j].x2 == 0.001234) {
                                coords[j].x2 = coords[j].x1 + modelElements[j].dX / uConstLength;
                                coords[j].y2 = coords[j].y1 + modelElements[j].dY / uConstLength;
                                coords[j].z2 = coords[j].z1 + modelElements[j].dZ / uConstLength;
                            }
                        }
                        else
                            if ((modelElements[i].fromNode == modelElements[j].toNode) &&
                            (coords[j].x2 == 0.001234)) {
                                coords[j].x2 = coords[i].x1;
                                coords[j].y2 = coords[i].y1;
                                coords[j].z2 = coords[i].z1;
                                if (coords[j].x1 == 0.001234) {
                                    coords[j].x1 = coords[j].x2 - modelElements[j].dX / uConstLength;
                                    coords[j].y1 = coords[j].y2 - modelElements[j].dY / uConstLength;
                                    coords[j].z1 = coords[j].z2 - modelElements[j].dZ / uConstLength;
                                }
                            }
                    }
                }
            else
                notDone++;

            if (coords[i].x2 != 0.001234)
                for (var j = 1; j <= totEls; j++) {
                    if (i != j) {
                        if ((modelElements[i].toNode == modelElements[j].fromNode) &&
                        (coords[j].x1 == 0.001234)) {
                            coords[j].x1 = coords[i].x2;
                            coords[j].y1 = coords[i].y2;
                            coords[j].z1 = coords[i].z2;
                            if (coords[j].x2 == 0.001234) {
                                coords[j].x2 = coords[j].x1 + modelElements[j].dX / uConstLength;
                                coords[j].y2 = coords[j].y1 + modelElements[j].dY / uConstLength;
                                coords[j].z2 = coords[j].z1 + modelElements[j].dZ / uConstLength;
                            }
                        }
                        else
                            if ((modelElements[i].toNode == modelElements[j].toNode) &&
                            (coords[j].x2 == 0.001234)) {
                                coords[j].x2 = coords[i].x2;
                                coords[j].y2 = coords[i].y2;
                                coords[j].z2 = coords[i].z2;
                                if (coords[j].x1 == 0.001234) {
                                    coords[j].x1 = coords[j].x2 - modelElements[j].dX / uConstLength;
                                    coords[j].y1 = coords[j].y2 - modelElements[j].dY / uConstLength;
                                    coords[j].z1 = coords[j].z2 - modelElements[j].dZ / uConstLength;
                                }
                            }
                    }
                }
            else
                notDone++;

            if (coords[i].x1 < xmin)
                xmin = coords[i].x1;
            if (coords[i].y1 < ymin)
                ymin = coords[i].y1;
            if (coords[i].z1 < zmin)
                zmin = coords[i].z1;
            if (coords[i].x2 > xmax)
                xmax = coords[i].x2;
            if (coords[i].y2 > ymax)
                ymax = coords[i].y2;
            if (coords[i].z2 > zmax)
                zmax = coords[i].z2;
        }

        if (notDone > 0 && notDone == oldNotDone) {
            for (var i = 1; i <= totEls; i++) {
                if (coords[i].x1 == 0.001234) {
                    coords[i].x1 = 0.0;
                    coords[i].y1 = 0.0;
                    coords[i].z1 = 0.0;
                    notDone--;
                    if (coords[i].x2 == 0.001234) {
                        coords[i].x2 = coords[i].x1 + modelElements[i].dX / uConstLength;
                        coords[i].y2 = coords[i].y1 + modelElements[i].dY / uConstLength;
                        coords[i].z2 = coords[i].z1 + modelElements[i].dZ / uConstLength;
                    }
                    notDone--;
                    break;
                }
                else
                    if (coords[i].x2 == 0.001234) {
                        coords[i].x2 = 0.0;
                        coords[i].y2 = 0.0;
                        coords[i].z2 = 0.0;
                        notDone--;
                        break;
                    }
            }
        }
    }
}

var THREEx = THREEx || {};
/**
 * - NOTE: it would be quite easy to push event-driven too
 *   - microevent.js for events handling
 *   - in this._onkeyChange, generate a string from the DOM event
 *   - use this as event name
*/
THREEx.KeyboardState = function () {
    // to store the current state
    
    this.keyCodes = {};
    this.modifiers = {};

    // create callback to bind/unbind keyboard events
    var self = this;
    this._onKeyDown = function (event) { self._onKeyChange(event, true); };
    this._onKeyUp = function (event) { self._onKeyChange(event, false); };

    // bind keyEvents
    //document.addEventListener("keydown", this._onKeyDown, false);
    //document.addEventListener("keyup", this._onKeyUp, false);
}

/**
 * To stop listening of the keyboard events
*/
THREEx.KeyboardState.prototype.destroy = function () {
    // unbind keyEvents
    document.removeEventListener("keydown", this._onKeyDown, false);
    document.removeEventListener("keyup", this._onKeyUp, false);
}

THREEx.KeyboardState.MODIFIERS = ['shift', 'ctrl', 'alt', 'meta'];
THREEx.KeyboardState.ALIAS = {
    'left': 37,
    'up': 38,
    'right': 39,
    'down': 40,
    'space': 32,
    'pageup': 33,
    'pagedown': 34,
    'tab': 9
};

/**
 * to process the keyboard dom event
*/
THREEx.KeyboardState.prototype._onKeyChange = function (event, pressed) {
    // update this.keyCodes
    var keyCode = event.keyCode;
    this.keyCodes[keyCode] = pressed;

    // update this.modifiers
    this.modifiers['shift'] = event.shiftKey;
    this.modifiers['ctrl'] = event.ctrlKey;
    this.modifiers['alt'] = event.altKey;
    this.modifiers['meta'] = event.metaKey;
}

/**
 * query keyboard state to know if a key is pressed of not
 *
 * @param {String} keyDesc the description of the key. format : modifiers+key e.g shift+A
 * @returns {Boolean} true if the key is pressed, false otherwise
*/
THREEx.KeyboardState.prototype.pressed = function (keyDesc) {
    var keys = keyDesc.split("+");
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var pressed;
        if (THREEx.KeyboardState.MODIFIERS.indexOf(key) !== -1) {
            pressed = this.modifiers[key];
        } else if (Object.keys(THREEx.KeyboardState.ALIAS).indexOf(key) != -1) {
            pressed = this.keyCodes[THREEx.KeyboardState.ALIAS[key]];
        } else {
            pressed = this.keyCodes[key.toUpperCase().charCodeAt(0)]
        }
        if (!pressed) return false;
    };
    return true;
}

var data = [], pickingTexture, pickingScene;
var drawnNodes = [], nodeScene;
var clickPanSpeed = 50;
var pickingNodes = [];
//pickingNodes.push([])
var prisms = [];
var objects = [];
var sprites = [];
var spriteGroup = new THREE.Group();
var mouse = new THREE.Vector2();
//var keyboard = new THREEx.KeyboardState();
var keyboard = { shift:false , ctrl:false };
var click = false;
var ctrl_click = false;
var shift_click = false;
var nodeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors })//, shading: THREE.SmoothShadiing})
var pickingMaterial = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
var lineMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
var restraintMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, })
var defaultMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, vertexColors: THREE.VertexColors, shading: THREE.FlatShading });
var metalMaterial = new THREE.MeshPhongMaterial({ color: 0x5d6264, specular: 0x111111, shininess: 5, shading: THREE.FlatShading})
var deformedMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff, vertexColors: THREE.VertexColors, shading: THREE.FlatShading, transparent: true,  opacity: .5 })
var color = new THREE.Color();
var matrix = new THREE.Matrix4();
var quaternion = new THREE.Quaternion();

lambert = true;
if (!lambert) {
    defaultMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, vertexColors: THREE.VertexColors})
    deformedMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff, vertexColors: THREE.VertexColors, shading: THREE.FlatShading, transparent: true, opacity: .5});
    nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors })
}
var group_id = 0;
var last_id = null; //id of last selected item
var camera, controls, scene, renderer, scCam;
var beamNodeColor = 0x000000;
var beam_color = 0xff0000;
var deformed_color = 0x0000ff;
var highlight_color = 0xffff00;
var move_increment = 50;
var rotation_increment = Math.PI / 4;
var initial_view = new THREE.Vector3(50, 50, 50);
var delta_x, delta_y, delta_z;
var delay = 500;
//Box select variables
var nodSelectionSet = new Set([]);
var drag = false;
var elSelectMode = false;
var nodSelectMode = false;
var gridMode = false;
var boxLength, boxHeight, botLeft;
var upLocation, downLocation;
var visibleNodes = false;
var fNodesOnly = false;
var selectListeners = false;
var loadJob = false;
var scene = new THREE.Scene();
var canvas2D;
var overlayCanvas;
var axesCanvas = document.getElementById('axes_canvas');
var complianceCanvas;
var ctx;
var rect = {};
var drawMode = false;
var firstPick = false;
var firstNode = null;
//width = $("#modelGraphics").innerWidth();
//height = $("#modelGraphics").innerHeight();
width = 800;
height = 512;
var NEAR = -1000;
var FAR = 100000;

var animations = [];
var spriteAnimations = [];
var animCounter = 0;
var da;

var prisms = [];
prisms.push([]);
var quaternion = new THREE.Quaternion();
var matrix = new THREE.Matrix4();
var global_pos;

var offset;
var offsetX;
var offsetY;

var hide = false;

//$(canvas).mousedown(getDownCoords);
//$(document).mousemove(drawBox);
//$(document).mouseup(multiSelect);




function doubleSide(face, a, b, c) {
    face.faces.push(new THREE.Face3(a, b, c));
    //face.faces.push(new THREE.Face3(c,b,a));
}
function pushFaces(shape, rest) {
    //Push Faces for a given geometry

    //bot face
    doubleSide(shape, 1, 0, 3);
    doubleSide(shape, 3, 2, 1);
    if (!rest) {
        //right face
        doubleSide(shape, 2, 5, 1);
        doubleSide(shape, 5, 2, 6);
        //backface
        doubleSide(shape, 7, 6, 2);
        doubleSide(shape, 2, 3, 7);
        //top face
        doubleSide(shape, 4, 5, 7);
        doubleSide(shape, 6, 7, 5);
        //front face
        doubleSide(shape, 5, 4, 1);
        doubleSide(shape, 0, 1, 4);
        //left face
        doubleSide(shape, 3, 0, 4);
        doubleSide(shape, 4, 7, 3);
    }

}
var combined = new THREE.Geometry();
var deformedCombined = new THREE.Geometry();
var pickingCombined = new THREE.Geometry();
var restraintsCombined = new THREE.Geometry();
var allNodes = new THREE.Geometry();
var pickNodes = new THREE.Geometry();
var pickingLineGroup = new THREE.Group();
var lineGroup;
var deformedLineGroup; 

function formGeometry(color, vertices, rest){
    /*form the basic Geometry of a prism*/
    //push vertices from data
    geometry = new THREE.Geometry();
    var num = 7;
    if (rest) {
        num = 3
   
    }
    
    for (var i = 0; i <= num; i++) {
        geometry.vertices.push(new THREE.Vector3(vertices[i][0], vertices[i][1], vertices[i][2]));
        
        //pickingGeometry.vertices.push(vertices[i]);
    }
    pushFaces(geometry, rest);
    //geometry.mergeVertices();
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    if (!rest){
        applyVertexColors(geometry, color);
    }
    return geometry
}

function respawnVertices(id, subID) {
    // Draw Basic Prism Geometry

    //access data for specified member
    var data = prisms[id][subID];
    //The following if is unecessary, need to test to make sure
    if (!data.visible){ //only draw object if it's visible
        data.prism = null;
        data.pickingPrism = null;
        return;
    }
    //If the function was called for a pipe structure
    if (data.type == 'pipe') {
        respawnPipe(id, subID);
        return;
    }
    if (data.type == 'stick'){
        respawn_stick(id, subID);
        return;
    }

    //Initialize Variables
    var vertices = prisms[id][subID].vertices;

    //select proper color for shape
    if ( !deformed ) {

        data.prism = formGeometry(data.color, vertices);
    
        data.pickingPrism = formGeometry(data.colorID, vertices);
    }

    if (deformed) 
        vertices = data.deformedVertices;
    data.deformedPrism = formGeometry(deformed_color, vertices);    
}

function convertCanvasToImage(canvas) {
    var image = new Image();
    image.src = canvas.toDataURL("image/png");
    return image;
}

function getFlatFromPositions(startPoint, endPoint) {
    dX = startPoint[0] - endPoint[0];
    dZ = startPoint[2] - endPoint[2];
    return Math.sqrt(dX * dX + dZ * dZ);
}
function createBoxAxes(length){
    /*create more robust axes on our scene*/
    var axes = new THREE.Group();
    var t  = 3; 
    //axes
    var xa = new THREE.BoxGeometry(length,t,t);
    var ya = new THREE.BoxGeometry(t,length,t);
    var za = new THREE.BoxGeometry(t,t,length);
    
    a = [xa,ya,za];
    //materials
    var xaMat = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    var yaMat = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var zaMat = new THREE.MeshBasicMaterial( { color: 0x0000ff } );
    m = [xaMat, yaMat,zaMat];
    
    for (var i = 0; i<3; i++){
        var axis = new THREE.Mesh(a[i],m[i]);
        switch(i){
            case 0:
                axis.position.x = length/2;
                break;
            case 1:
                axis.position.y = length/2;
                break;
            case 2:
                axis.position.z = length/2;
        }
        axes.add(axis);
    }
    return axes;
}
function pushLineVertices(start, end, color){
    /*Create Geometry with given start, end, and color*/
    var lineGeometry = new THREE.Geometry();
    var lmat = new THREE.LineBasicMaterial({color: color})
    lineGeometry.vertices.push(new THREE.Vector3(start[0], start[1], start[2]));
    lineGeometry.vertices.push(new THREE.Vector3(end[0], end[1], end[2]));

    lineGeometry.mergeVertices();
    lineGeometry.computeVertexNormals();
    //applyLineColors(lineGeometry, color);
    //lineMaterial.color.setHex(color);
    var line = new THREE.Line(lineGeometry, lmat);
    return line;
}

function respawn_stick(id, subID){
    /*respawn a stick given the id and subID*/
    
    stickData = prisms[id][subID];
    

    if ( !deformed ) {
        var _start = stickData.start;
        var _end = stickData.end;
        stickData.prism = pushLineVertices( _start, _end, stickData.color);
        stickData.pickingPrism = pushLineVertices( _start, _end,stickData.colorID);
    }
    else {
        var _start = stickData.deformedStart;
        var _end = stickData.deformedEnd;
        stickData.deformedPrism = pushLineVertices( _start , _end , deformed_color );
    }
}
function createStick(id, start, end) {
    /*create a stick given two points*/
    if (cColor)
        var color = getBeamColor(id);
    else
        var color = beam_color;
    if ( !deformed ){
        prisms[id] = [];
        prisms[id][0] = {
            type: 'stick',
            group_id: id,
            rotation: null,
            scale: null,
            color: color,        
            colorID: id * 10,
            start: start,
            end: end,
            visible: true

        }
    }
    else{
        prisms[id][0].deformedStart = start;
        prisms[id][0].deformedEnd = end;
    }
    respawn_stick(id, 0);    

}
var ccG = [[],[],[],[]];

function zero_ccG () {
    /*zero out ccG matrix*/
    for (var i = 0; i < ccG.length; i++) {
        ccG[i].length = 0;
        for (var j = 0; j<=3; j++) {
            ccG[i][j] = 0;
        }
    }
}



function createPrism(x1, y1, z1, x2, y2, z2, ccL, beta, subID) {
    //basic draw prism function. Functions as a basis for creating other prisms
    //position: THREE.vector3: x,y,z position
    //scale:THREE.vector3: length in x,y,z from start
    //rotation: THREE.Euler() global x,y,z

    var start = [x1, y1, z1];
    var end = [x2, y2, z2];
    var dx = x2 - x1;
    var dy = y2 - y1;
    var dz = z2 - z1;

    var isColumn = false;
    if (dz == 0 && dx == 0)
        isColumn = true;
    beta1 = -beta * Math.PI / 180;

    if (isColumn)
        beta1 += Math.PI;

    var length = getLengthFromPositions(start, end);
    var flat = getFlatFromPositions(start, end);
    var phi = Math.asin(dy / length);
    var center = getCenterFromPos(start, end);
    var gamma;

    if (isColumn) {
        gamma = 0;
    }
    else {

        gamma = Math.atan2(dx, dz);
    }
    zero_ccG();
    
    for (var i = 0; i <= 3; i++) {
        var r = Math.sqrt(ccL[i][0] * ccL[i][0] + ccL[i][1] * ccL[i][1]);
        var theta = Math.atan2(ccL[i][0], ccL[i][1]);

        ccG[i][0] = r * Math.sin(theta + beta1) * Math.cos(gamma) - r * Math.cos(theta + beta1) * Math.sin(phi) * Math.sin(gamma);
        ccG[i][1] = r * Math.cos(theta + beta1) * Math.cos(phi);
        ccG[i][2] = -r * Math.sin(theta + beta1) * Math.sin(gamma) - r * Math.cos(theta + beta1) * Math.sin(phi) * Math.cos(gamma);

    }
    
    var vertexPositions = [
                  // Front face
                  [ccG[1][0] + x1, ccG[1][1] + y1, ccG[1][2] + z1], //v0
                  [ccG[0][0] + x1, ccG[0][1] + y1, ccG[0][2] + z1], //v1
                  [ccG[3][0] + x1, ccG[3][1] + y1, ccG[3][2] + z1], //v2
                  [ccG[2][0] + x1, ccG[2][1] + y1, ccG[2][2] + z1], //v3

                  // Back face
                  [ccG[1][0] + x2, ccG[1][1] + y2, ccG[1][2] + z2], //v4
                  [ccG[0][0] + x2, ccG[0][1] + y2, ccG[0][2] + z2], //v5
                  [ccG[3][0] + x2, ccG[3][1] + y2, ccG[3][2] + z2], //v6
                  [ccG[2][0] + x2, ccG[2][1] + y2, ccG[2][2] + z2] //v7
    ];
    if (cColor)
        var color = getBeamColor(group_id);
    else
        color = beam_color;

    //get-free method can apply here
    if (!deformed){
        prisms[group_id][subID] = {
            type: 'prism',
            group_id: group_id,
            color: color,
            colorID: group_id * 10 + subID,
            vertices: vertexPositions,
            deformedVertices: null,
            prism: null,
            pickingPrism: null,
            visible: true
        };        
    }
    else{
        prisms[group_id][subID].deformedVertices = vertexPositions;
    }
    respawnVertices(group_id, subID);
}
function add_fNodes(){
    /*add all nodes in fNodes to the scene*/

    for (var i = 0; i < fNodes.length; i++) {
        //use the division modifier
        drawnNodes[fNodes[i].node] = [];
        addNode(fNodes[i].node, 1, [fNodes[i].x/uConstLength,fNodes[i].y/uConstLength,fNodes[i].z/uConstLength]);
    }
}
function addNode(id, subID, position) {
    /*
    add nodes to canvas at specified location. 
    id represents what element the node represents
    subId indicates whether a node is from or to, or if it is a fixed node
    
    */
    
    nodeArray = (subID == 1) ? drawnNodes : pickingNodes; //if subID is greater than 1 then we're looking at a fixed node

    nodeArray[id][subID] = {
        position: position,
        group_id: id,
        sub_id: subID,
        node: null,
        pickingNode: null,
        colorID: id * 10 + subID,
        color: beamNodeColor,
        visible: null
    }
    respawn_node(id, subID);
}
function addSprite(number, position, nodes, fontsize){
    /*add a text sprite at the given position with the given
    number as the message

    number: node number
    position: position for text sprite
    nodes: Boolean on whether to draw nodes
    */
    var spritey = makeTextSprite(String(number), { fontsize: fontsize });
    spritey.position.set(position[0], position[1], position[2]);
    spritey.name = 'sprite ' + number;
    sprites[number] = spritey;
    spritey.nodes = nodes;
    
    if (!nodes){ //node comes from end of an element; fnodes use a different function
        pickingNodes[number] = [];
        addNode(number, 0, position); //arbitrarily given sub id of 0; use to identify type of node
    }
}
function removeSprite(number){
    num1 = modelElements[number].fromNode;
    num2 = modelElements[number].toNode;
    sprites[num1] = null;
    sprites[num2] = null;
}
function makeTextSprite(message, parameters) {
    /*Making text sprites*/

    if (parameters === undefined) parameters = {};

    var fontface = parameters.hasOwnProperty("fontface") ?
        parameters["fontface"] : "Times New Roman";

    var fontsize = parameters.hasOwnProperty("fontsize") ?
        parameters["fontsize"] : 30;

    var borderThickness = parameters.hasOwnProperty("borderThickness") ?
        parameters["borderThickness"] : 2;

    var borderColor = parameters.hasOwnProperty("borderColor") ?
        parameters["borderColor"] : { r: 0, g: 0, b: 0, a: 1.0 };

    var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
        parameters["backgroundColor"] : { r: 255, g: 255, b: 255, a: 1.0 };

    var textColor = parameters.hasOwnProperty("textColor") ?
        parameters["textColor"] : { r: 0, g: 0, b: 0, a: 1.0 };

    //var spriteAlignment = THREE.SpriteAlignment.topLeft;

    var textCanvas = document.createElement('canvas');
    
    var context = textCanvas.getContext('2d');

    //getting size data
    var metrics = context.measureText(message); //where is .measureText coming from?
    var textWidth = metrics.width;

    addspace = 4 - message.length
    while (addspace>0){
        message = "  " + message;
        addspace -= 1;
    }
    context.font = fontsize + 'px ' + fontface;
    context.fillText(message, 75, fontsize+20);
    
    var texture = new THREE.Texture(textCanvas);
    texture.minFilter = THREE.LinearFilter
    //console.log(texture.mipmap)

    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial({ map: texture, useScreenCoordinates: false });
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(80, 40, 100);
    return sprite;
}
function isOdd(num){
    /*simple method to tell if number is odd*/
    return num & 1

}

function node_addition(input_scene, id, subID, color, material, data) {
    /*modular function for adding node to any scene*/

    var node = new THREE.Geometry();
    
    if (input_scene == scene){ //drawn nodes will be smaller than behind the scene nodes
        var sphere = new THREE.BoxGeometry(5, 5, 5);
    }
    else{
        var sphere = new THREE.BoxGeometry (12,12,12);
    }
    var position = new THREE.Vector3(data.position[0], data.position[1], data.position[2]);
    var scale = new THREE.Vector3(1, 1, 1);
    var rotation = new THREE.Euler(0, 0, 0);
    quaternion.setFromEuler(rotation, false);
    matrix.compose(position, quaternion, scale)
    applyVertexColors(sphere, color);

    node.merge(sphere, matrix)

    //var node = new THREE.Mesh(sphere, material);
    //node.position.set(data.position[0], data.position[1], data.position[2]);
    //node.name = "(" + id + "," + data.direction + ")";
    ////input_scene.add(node);
    return node;
}

function respawn_node(id, subID) {
    /*draw node on the scene*/

    nodeArray = (subID == 1) ? drawnNodes : pickingNodes;
    nodeData = nodeArray[id][subID]

    if (subID == 1){ //subID of 2 indicates node is a fixed node and can be drawn
        nodeData.node = node_addition(scene, id, subID, nodeData.color, nodeMaterial, nodeData);
    }
    //add to node picking scene
    nodeData.pickingNode = node_addition(nodeScene, id, subID, nodeData.colorID, pickingMaterial, nodeData);
    
    // think about treating all of the picking scene as one mesh
    //var node = new THREE.Mesh(pickingNode, pickingMaterial);
    //node.name = '(' + id + ',' + subID + ')';
    //nodeScene.add(node);
    //nodeData.pickingNode = node;
    

}
var ccL = [[],[],[],[]];

function drawW(i, x1, y1, z1, x2, y2, z2, tf, flange_width, depth, tw, beta, scale, xave, yave, zave, width, height) {
    /*Construct the three prisms the make a wide flange
    
    ARGS:
    input_position: xyz
    depth: distance from outside of one flange to outside of other
    length: length of overall structure
    web_thickness : thickness of middle member
    flange_thickness: thickness of each flange piece
    flange_width: distance across the face of the flange
    beta angle*/


    //New entry in prisms for new item

    start = [x1, y1, z1];
    end = [x2, y2, z2];
    initializeNewElement(i, start, end);
    //draw 2 flanges
    for (var j = 0; j < 2; j++) {
        var base;

        //Account for different position of flanges
        if (j == 0) {
            base = depth / 2.0 - tf;
        }
        else {
            base = -depth / 2.0;
        }
        //What is ccL?
        var idk = [
            [-flange_width / 2.0, base + tf, 0.0],
            [flange_width / 2.0, base + tf, 0.0],
            [flange_width / 2.0, base, 0.0],
            [-flange_width / 2.0, base, 0.0]
        ];
        //Create Flange
        createPrism(x1, y1, z1, x2, y2, z2, idk, beta, j);
    }
    //draw web
    var idk = [
        [-tw / 2.0, (depth - 2 * tf) / 2.0, 0.0],
        [tw / 2.0, (depth - 2 * tf) / 2.0, 0.0],
        [tw / 2.0, -(depth - 2 * tf) / 2.0, 0.0],
        [-tw / 2.0, -(depth - 2 * tf) / 2.0, 0.0]
    ];
    //create Web
    createPrism(x1, y1, z1, x2, y2, z2, idk, beta, 2)

}
function initializeNewElement(id, start, end) {
    /*initial modifications to global arrays when initializing new element*/
    group_id = id;
    if (!deformed){
        prisms[id] = [];
    }
    //prisms.push([]);
    //fNodes.push([]);
    //pickingNodes[group_id] = [];
    //addNode(group_id, 0, start);
    //addNode(group_id, 1, end);
}
function drawH(i, x1, y1, z1, x2, y2, z2, tf, fWidth, depth, tw, beta, scale, xave, yave, zave, width, height) {
    //Create an H
    start = [x1, y1, z1];
    end = [x2, y2, z2];
    initializeNewElement(i, start, end);
    for (var ii = 0; ii <= 1; ii++) {
        // calculate vertex coordinates
        var base;
        if (ii == 0)
            base = depth / 2.0 - tf;
        else
            base = -depth / 2.0;
        var idk = [
            [-fWidth / 2.0, base + tf, 0.0],
            [fWidth / 2.0, base + tf, 0.0],
            [fWidth / 2.0, base, 0.0],
            [-fWidth / 2.0, base, 0.0]
        ];
        createPrism(x1, y1, z1, x2, y2, z2, idk, beta, ii);
    }
    for (var ii = 0; ii <= 1; ii++) {
        var base;
        if (ii == 0) {
            base = -fWidth / 2.0;
            var ccL = [
           [base, depth / 2.0 - tf, 0.0],
           [base + tw, depth / 2.0 - tf, 0.0],
           [base + tw, -depth / 2.0 + tf, 0.0],
           [base, -depth / 2.0 + tf, 0.0]
            ];
        }
        else {
            base = fWidth / 2.0 - tw;

            var ccL = [
                [base, depth / 2.0 - tf, 0.0],
                [base + tw, depth / 2.0 - tf, 0.0],
                [base + tw, -depth / 2.0 + tf, 0.0],
                [base, -depth / 2.0 + tf, 0.0]
            ];
        }
        createPrism(x1, y1, z1, x2, y2, z2, ccL, beta, ii + 2);
    }
}
function drawT(i, x1, y1, z1, x2, y2, z2, tf, fWidth, depth, tw, yOff, beta, scale, xave, yave, zave, width, height) {
    //create Tbeam
    start = [x1, y1, z1];
    end = [x2, y2, z2];
    initializeNewElement(i, start, end);
    //drawFlange
    var idk = [
        [-fWidth / 2.0, yOff, 0.0],
        [fWidth / 2.0, yOff, 0.0],
        [fWidth / 2.0, yOff - tf, 0.0],
        [-fWidth / 2.0, yOff - tf, 0.0]
    ];
    createPrism(x1, y1, z1, x2, y2, z2, idk, beta, 0);

    // Draw web
    // calculate vertex coordinates
    var idk = [[-tw / 2.0, yOff - tf, 0.0],
        [tw / 2.0, yOff - tf, 0.0],
        [tw / 2, yOff - depth, 0.0],
        [-tw / 2, yOff - depth, 0.0]
    ];
    createPrism(x1, y1, z1, x2, y2, z2, idk, beta, 1);
}

function drawC(i, x1, y1, z1, x2, y2, z2, tf, fWidth, depth, tw, xOff, beta, scale, xave, yave, zave, width, height) {
    //Create Channel
    start = [x1, y1, z1];
    end = [x2, y2, z2];
    initializeNewElement(i, start, end);
    // Draw flanges   
    for (var ii = 0; ii <= 1; ii++) {
        // calculate vertex coordinates
        var base;
        if (ii == 0)
            base = depth / 2.0 - tf;
        else
            base = -depth / 2.0;
        var ccL = [
            [xOff, base + tf, 0.0],
            [xOff - fWidth, base + tf, 0.0],
            [xOff - fWidth, base, 0.0],
            [xOff, base, 0.0]
        ];
        createPrism(x1, y1, z1, x2, y2, z2, ccL, beta, ii);
    }
    var ccL = [
        [xOff, (depth - 2 * tf) / 2.0, 0.0],
        [xOff - tw, (depth - 2 * tf) / 2.0, 0.0],
        [xOff - tw, -(depth - 2 * tf) / 2.0, 0.0],
        [xOff, -(depth - 2 * tf) / 2.0, 0.0]
    ];
    createPrism(x1, y1, z1, x2, y2, z2, ccL, beta, 2);
}

function drawLL(i, x1, y1, z1, x2, y2, z2, tf, fWidth, depth, tw, b2b, yOff, beta, xave, yave, zave, width, height) {
    //create n 'Double Angle' Beam, which is back to back right angles
    //b2b is offset space between double angles
    //yoff is the vertical distance from the outermost point of the flange to the center line

    //group_id++;
    start = [x1, y1, z1];
    end = [x2, y2, z2];
    initializeNewElement(i, start, end);
    //flanges
    for (var ii = 0; ii <= 1; ii++) {
        // calculate vertex coordinates
        var base;
        if (ii == 0)
            base = -(fWidth + b2b / 2.0);
        else
            base = b2b / 2.0;
        var ccL = [
            [base, yOff, 0.0],
            [base + fWidth, yOff, 0.0],
            [base + fWidth, yOff - tw, 0.0],
            [base, yOff - tw, 0.0]
        ];
        createPrism(x1, y1, z1, x2, y2, z2, ccL, beta, ii);
    }
    //webs
    for (var ii = 0; ii <= 1; ii++) {
        // calculate vertex coordinates
        var base;
        if (ii == 0)
            base = -(tw + b2b / 2.0);
        else
            base = b2b / 2.0;
        var ccL = [[base, yOff - tw, 0.0],
            [base + tw, yOff - tw, 0.0],
            [base + tw, yOff - depth, 0.0],
            [base, yOff - depth, 0.0]
        ];
        createPrism(x1, y1, z1, x2, y2, z2, ccL, beta, ii + 2);
    }
}

function drawL(i,x1, y1, z1, x2, y2, z2, tf, fWidth, depth, tw, xOff, yOff, beta) {
    //Create an 'angle' beam.
    //yoff is the vertical distance from the outermost point of the vlange to the centerline
    //xoff is the horizontal distance from the outermost point of the web to the centerline
    start = [x1, y1, z1];
    end = [x2, y2, z2];
    initializeNewElement(i, start, end);
    //web
    var ccL = [
        [xOff, fWidth - yOff, 0.0],
        [xOff - tf, fWidth - yOff, 0.0],
        [xOff - tf, -yOff, 0.0],
        [xOff, -yOff, 0.0]
    ];
    createPrism(x1, y1, z1, x2, y2, z2, ccL, beta, 0);

    //flange
    var ccL = [
        [xOff - tf, tw - yOff, 0.0],
        [xOff - depth, tw - yOff, 0.0],
        [xOff - depth, -yOff, 0.0],
        [xOff - tf, -yOff, 0.0]
    ];
    createPrism(x1, y1, z1, x2, y2, z2, ccL, beta, 1);
}

function getRotationFromPositions(start, end) {
    //solve for rotation vector given the start and end points as arrays
    var deltaX = end[0] - start[0];
    var deltaY = end[1] - start[1];
    var deltaZ = end[2] - start[2];
    //theta x = atan(2norm(deltax, deltaz) /deltay       THETA Z CONTROLS THETA
    if (deltaX == 0 && deltaZ == 0) {
        thetaX = 0;
    }
    else if (deltaY == 0) {
        thetaX = Math.PI / 2;
    }
    else {
        if (deltaX > 0 && deltaZ == 0) {
            thetaX = -1 * Math.atan2(Math.sqrt(deltaX * deltaX + deltaZ * deltaZ), deltaY);
        }
        else if (deltaX < 0 && deltaZ == 0) {
            thetaX = Math.atan2(Math.sqrt(deltaX * deltaX + deltaZ * deltaZ), deltaY);
        }
        else if (deltaZ > 0 && deltaX == 0) {
            thetaX = Math.atan2(Math.sqrt(deltaX * deltaX + deltaZ * deltaZ), deltaY);
        }
        else if (deltaZ < 0 && deltaX == 0) {
            thetaX = -1 * Math.atan2(Math.sqrt(deltaX * deltaX + deltaZ * deltaZ), deltaY);
        }
        else if (deltaZ >= deltaX) {
            thetaX = Math.atan2(Math.sqrt(deltaX * deltaX + deltaZ * deltaZ), deltaY);
        }
        else if (deltaZ < deltaX) {
            thetaX = -1 * Math.atan2(Math.sqrt(deltaX * deltaX + deltaZ * deltaZ), deltaY);
        }
    }


    //theta Z = atan(delta z /delta x) aka phi THIS IS ACTUALLY THETA  THETA X CONTROLS PHI
    if (deltaX == 0) {
        thetaZ = 0;
    }
    else if (deltaZ == 0) {
        thetaZ = -1 * Math.PI / 2;
    }
    else {
        thetaZ = -1 * Math.atan2(deltaX, deltaZ);
    }

    angles = {
        x: thetaX,
        y: 0,
        z: thetaZ
    };

    return angles;
}

function getLengthFromPositions(start, end) {
    var deltaX = end[0] - start[0];
    var deltaY = end[1] - start[1];
    var deltaZ = end[2] - start[2];

    var length = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
    return length;

}
function getCenterFromPos(start, end) {
    var x = (start[0] + end[0]) / 2;
    var y = (start[1] + end[1]) / 2;
    var z = (start[2] + end[2]) / 2;
    return [x, y, z];
}
function getRotationBooleansFromPosition(start, end) {
    /*get boolean values for whether a coordinate changed (dx, dy, dz)*/
    return {
        x: Boolean(start[0] - end[0]),
        y: Boolean(start[1] - end[1]),
        z: Boolean(start[2] - end[2])
    }
}

function drawPipe(i, x1, y1, z1, x2, y2, z2, rad1, thick1, rad2, thick2) {
    //draw a pipe and put in prisms
    var startPoint = [x1, y1, z1];
    var endPoint = [x2, y2, z2];
    initializeNewElement(i, startPoint, endPoint);



    var position = [(x2 + x1) / 2, (y2 + y1) / 2, (z2 + z1) / 2];
    var length = getLengthFromPositions(startPoint, endPoint);
    var rotations = getRotationFromPositions(startPoint, endPoint);
    var center = getCenterFromPos(startPoint, endPoint);
    var rotationBooleans = getRotationBooleansFromPosition(startPoint, endPoint);

    if ( !deformed ) {
        prisms[i][0] = {
            type: 'pipe',
            group_id: i,
            start: startPoint,
            end:endPoint,
            rotation: rotations,
            color: beam_color,
            colorID: group_id * 10,
            prism: null,
            rad1: rad1,
            rad2: rad2,
            prism: null,
            rotationBooleans: rotationBooleans
        };
        prisms[i][1] = {
            type: 'pipe',
            group_id: i,
            start: startPoint,
            end: endPoint,
            rotation: rotations,
            color: 0xffffff,
            colorID: group_id * 10 + 1,
            rad1: rad1 - thick1,
            rad2: rad2 - thick2,
            prism: null,
            rotationBooleans: rotationBooleans
        };
    }
    else {
        for ( var j = 0; j <= 1; j ++){
            var entry = prisms [i][j];
            entry.deformedStart = startPoint;
            entry.deformedEnd = endPoint;
            entry.deformedRotations = rotations;
        }
    }
    respawnPipe(group_id, 0);
    respawnPipe(group_id, 1);
}
var rstv1, rstv2;
function drawRestraint(i, size1, size2) {
    /* draw restraints perpendicular to element */
    
    //get start points, and dx dy dz
    el = modelElements[i];
    points = coords[i]

    start = [points.x1, points.y1, points.z1];
    change = [el.dX, el.dY, el.dZ];
    end = [points.x2, points.y2, points.z2];
    //get restraint vertices
    //from restraint 
    var from, to;
    if( el.fromFXRest || el.fromFYRest || el.fromFZRest ||
                    el.fromMXRest || el.fromMYRest || el.fromMZRest ) {
        rstv1 = getRestraintVertices(start, change, el.betaAngle, size1);
        var rst1 = formGeometry (0x00ff00, rstv1, true);
        from = true;
    }
    
    if( el.toFXRest || el.toFYRest || el.toFZRest ||
                    el.toMXRest || el.toMYRest || el.toMZRest ) {
        rstv2 = getRestraintVertices(end, change, el.betaAngle, size2);
        var rst2 = formGeometry (0x00ff00, rstv2, true);
        to = true;
    }
    el.restraints = [];
    if (from){
        el.restraints[0] = rst1;
    }
    if (to) {
        el.restraints[1] = rst2;
    }
}
    


function getRestraintVertices ( start , change , beta1 , size) {
    /*get restraint vertices
    beta - degree (out of 360)
    */

    var x1 = start[0]; var y1 = start[1]; var z1 = start[2];
    var dX = change[0]; var dY = change[1]; var dZ = change[2];

    var x2 = x1 + dX;
    var y2 = y1 + dY;
    var z2 = z1 + dZ;

    var beta = beta1 * Math.PI / 180.0;

    var y1a = y1;
    var y2a = y2;
    var z1a = z1;
    var z2a = z2;

    var len = Math.sqrt((x1-x2)*(x1-x2)+(y1a-y2a)*(y1a-y2a)+(z1a-z2a)*(z1a-z2a));
    var hor = Math.sqrt((x1-x2)*(x1-x2)+(z1a-z2a)*(z1a-z2a));
    var phi = Math.asin((y2a-y1a)/len);
    var gamma;    
    if( Math.abs(hor/len) <= 0.02 )
        gamma = 0.0;
    else
        gamma = Math.atan2(x2-x1,z2-z1);

    var ccL = [[-size, size, 0.0], [size, size, 0.0], [size, -size, 0.0], [-size, -size, 0.0]];

    zero_ccG();

    for (var i = 0; i <= 3; i++) {
        var r = Math.sqrt(ccL[i][0] * ccL[i][0] + ccL[i][1] * ccL[i][1]);
        var theta = Math.atan2(ccL[i][0],ccL[i][1]);

        ccG[i][0] =  r * Math.sin(theta + beta) * Math.cos(gamma) - r * Math.cos(theta + beta) * Math.sin(phi) * Math.sin(gamma);
        ccG[i][1] =  r * Math.cos(theta + beta) * Math.cos(phi);
        ccG[i][2] = -r * Math.sin(theta + beta) * Math.sin(gamma) - r * Math.cos(theta + beta) * Math.sin(phi) * Math.cos(gamma);
    }
    
    var vertexPositions = [

                      [ccG[1][0] + x1, ccG[1][1] + y1a, ccG[1][2] + z1a], //v0
                      [ccG[0][0] + x1, ccG[0][1] + y1a, ccG[0][2] + z1a], //v1
                      [ccG[3][0] + x1, ccG[3][1] + y1a, ccG[3][2] + z1a], //v2
                      [ccG[2][0] + x1, ccG[2][1] + y1a, ccG[2][2] + z1a]  //v3
    ];
    return vertexPositions;
}

function addPipeToScene(id, subID, color) {
    /*add pipe to specified scene*/


    var data = prisms[id][subID]
    var cylGeometry = new THREE.CylinderGeometry(data.rad1, data.rad2, data.length, 32, 1, false);
    if (!deformed) {
        pointX = new THREE.Vector3(data.start[0], data.start[1], data.start[2]);
        pointY = new THREE.Vector3(data.end[0], data.end[1], data.end[2]);
    }
    else {
        pointX = new THREE.Vector3(data.deformedStart[0], data.deformedStart[1], data.deformedStart[2])
        pointY = new THREE.Vector3(data.deformedEnd[0], data.deformedEnd[1], data.deformedEnd[2])
    }
    // edge from X to Y
    var direction = new THREE.Vector3().subVectors( pointY, pointX );
    var arrow = new THREE.ArrowHelper( direction.clone().normalize(), pointX , direction.length(), 0x000000);
    
    
    var quat = new THREE.Quaternion();
    quat.copy(arrow.quaternion);
    var position = new THREE.Vector3().addVectors( pointX, direction.multiplyScalar(0.5) )
    var scale = new THREE.Vector3(1,1,1);

    var matr = new THREE.Matrix4();
    matr.compose(position, quat, scale);
    var matrCyl = new THREE.Geometry();

    matrCyl.merge(edgeGeometry, matr);
    applyVertexColors(matrCyl, color);

    return matrCyl;
    

}
function respawnPipe(id, subID) {
    //draw the cylinder given the address in prisms where the data is held

    var pipeData = prisms[id][subID];
    if ( !deformed ){
        
        // if pipe is on the inside, always color it white
        var scenePipe = addPipeToScene(id, subID, (subID) ? 0xffffff : pipeData.color) 
        pipeData.prism = scenePipe;

        var pickingPipe = addPipeToScene(id, subID, pipeData.colorID);
        pipData.pickingPrism = pickingPipe;
    }
    else {
        var deformedPipe = addPipeToScene(id,subID, deformed_color);
        pipeData.deformedPrism = deformedPipe;
    }
}

function toggleObjectVisibility(groupID, visible){
    /*toggle an objects visibility*/
    if (prisms[groupID] != []){
        for (var i = 0; i < prisms[groupID].length; i++){
            prisms[groupID][i].visible = visible;
            respawnVertices(groupID, i);
        }
        if (!visible){
            removeSprite(groupID);
        }
        else{
            addSprite(modelElements[groupID].fromNode, [coords[groupID].x1, coords[groupID].y1, coords[groupID].z1], false, 50/Math.pow(camera.zoom, 1/2));
            addSprite(modelElements[groupID].toNode, [coords[groupID].x2, coords[groupID].y2, coords[groupID].z2], false, 50/Math.pow(camera.zoom, 1/2));
        }
    }
}
function applyLineColors(g, c){
    for (var i = 0; i < g.vertices.length; i++){
        g.colors[i] = c;
    }
}

function getBeamColor(elementID){
    /*get the beam color depending on whether 
    an element meets the compliance code*/
    var complianceColors  = [0x00ff00, 0x0000ff, 0xff0000];
    
    return complianceColors[cColors[elementID - 1]] //cColors determines if an element meets a compliance code or not
}
function applyVertexColors(g, c) {
    g.faces.forEach(function (f) {
        f.color.setHex(c);
        //f.materials = [ new THREE.MeshLambertMaterial({color:color.setHex(c)})];

    });
}

function clearSticks() {
    /*clear all sticks from the scene*/
    var selectedStick = scene.getObjectByName('stick');
    scene.remove(selectedStick);
}
function remove_object(groupID, subID) {


    var selected_object = scene.getObjectByName('(' + groupID + ',' + subID + ')');
    scene.remove(selected_object);

    var picked_object = pickingScene.getObjectByName('(' + groupID + ',' + subID + ')');
    pickingScene.remove(picked_object);
}


function respawn_all() {
    for (var i = 1; i < prisms.length; i++) {
        for (var j = 0; j < prisms[i].length; j++) {
            if (prisms[i][j].type == 'pipe') {
                remove_object(i,j);
                respawnPipe(i, j);
            }
            else {
                remove_object(i,j);
                respawnVertices(i, j);
            }
        }
    }
}
var past_rot;
var respond;
var respondAnim;
var scrollY;

function respondCanvas() {

    //Resize canvas to fit screen
    //console.log('width, height before: ' + [width, height]);
    

    respond = true;
    var containerWidth = $(container1).width();
    var containerOffset = $(container1).offset();
    var adjustedHeight = window.innerHeight - containerOffset.top - 50;
    if (mobileDevice){
        adjustedHeight = window.innerHeight;
    }

    $(canvas).attr('width', containerWidth);
    $(canvas2D).attr('width', containerWidth);
    width = containerWidth;
    $(canvas).attr('height', adjustedHeight);
    $(canvas2D).attr('height', adjustedHeight);

    height = adjustedHeight;
    offset = canvas.getBoundingClientRect();
    console.log(offset);
    offsetX = offset.left;
    offsetY = offset.top;
    scrollY = $(document).scrollTop();
    console.log("offset , scroll " + [offsetY, scrollY] )
    //console.log('width, height' + [width,height]);
    //render();
    offsetY += scrollY;
    //camera.aspect = width/height;
    renderer.setSize(width, height);
    //renderer.setPixelRatio(width/height);
    renderer.setPixelRatio(16/9);
    renderer.canvas = canvas;

   

    pickingTexture.width = width;
    pickingTexture.height = height;
    pickingTexture.canvas = canvas;
    
    container1.removeChild(axesCanvas);
    container1.removeChild(overlayCanvas);
    
    update_camera(camera.position)
    update_scene();
    update_window();

    refreshScene();

    respond = false;
    respondAnim = true;

    if (isAnimated){       
        dynamicAnimation();
        //dynamicAnimation();
    }
    respondAnim = false;
    //var lineGeometry = new THREE.Geometry();
    //lineGeometry.vertices.push(new THREE.Vector3(0,0,0));
    //lineGeometry.vertices.push(new THREE.Vector3(0,200,0));
    //var line = new THREE.Line(lineGeometry, lineMaterial);
    //scene.add(line);

    
}

function setOverlayCanvas(){
    /*overlay a canvas for constant behavior for all
    listener function */
    
    //createCanvas
    overlayCanvas = document.createElement('canvas');
    overlayCanvas.style.position = 'absolute';
    overlayCanvas.style.left = 0 +'px';
    overlayCanvas.style.top = 0 + 'px';  
    overlayCanvas.style.backgroundColor = 'transparent';
    overlayCanvas.width = width + '';
    overlayCanvas.height = height + '';
    overlayCanvas.style.height = height + 'px';
    overlayCanvas.style.width = width + 'px';    
    overlayCanvas.style.zIndex = 10;
    //temporary
    //overlayCanvas.style.border = "solid #000000";
    //overlayCanvas.style.border = "solid #000000";        
    container1.appendChild(overlayCanvas);

    
    overlayCanvas.addEventListener('dblclick', onMouseCommand);
    
    overlayCanvas.addEventListener('DOMMouseScroll', wheelFix, false); //firefox //change to canvas overlay
    overlayCanvas.addEventListener('mousewheel', wheelFix, false); //change to canvas overlay
    
}
function testing(){
    console.log('testing');

}


function adjustSpriteZoom(){
    /*adjust sprite size for appropriate zoom size
    a zoom of 1 corresponds to 30. function should be 
    proportional to fontsize/zoom*/

    
    for (var i = 0; i<sprites.length; i++){
        if ( sprites[i] != null) {
            addSprite(i, [sprites[i].position.x, sprites[i].position.y, sprites[i].position.z], sprites[i].nodes, 50/Math.pow(camera.zoom, 1/2));
        }
    }
    refreshSprites();
}
var zoomDebounce = debounce( adjustSpriteZoom, 100 );



function debounce(func, wait, immediate) {
    
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        }
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    }
}

function reinit_camera(view){

    //if (mobileDevice){
    //    panBool = controls.noPan;
    //    rotateBool = controls.noRotate;
    //}
    //else{
    panBool = controls.userPan;
    rotateBool = controls.userRotate;
    //}
    setOverlayCanvas();
    
    camera = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/-2, NEAR, FAR);
    camera.position.x = view.x;
    camera.position.y = view.y;
    camera.position.z = view.z;
    
    //controls for manipulating camera
    
    controls = new THREE.OrbitControls(camera, overlayCanvas);
    
    controls.rotateSpeed = 1.0*2;
    controls.zoomSpeed = 1.2 * 2;
    controls.panSpeed = 0.2 ;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    if ( false ){ //mobile device edit
        panBool = controls.noPan;
        rotateBool = controls.noRotate;
    }
    else {
        controls.userPan = panBool;
        controls.userRotate = rotateBool;
    }
    setVariableView();
}
function getCameraDirection(){
    /*get the current direction that the camera is looking*/
    
    var vector = new THREE.Vector3( 0, 0, -1 );
    vector.applyQuaternion( camera.quaternion );
    var point = new THREE.Vector3(0,0,0);
    point.x = vector.x + camera.position.x;
    point.y = vector.y + camera.position.y;
    point.z = vector.z + camera.position.z;
    return point
    
}
function update_camera(view){
    /*update the camera without taking away the current state*/
    panBool = controls.userPan;
    rotateBool = controls.userRotate;
    old_center = controls.center;
    setOverlayCanvas();
    //camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    //camera = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/-2, NEAR, FAR);
    if ( xmin ){
        diag = Math.sqrt(Math.pow(xmax-xmin, 2) + Math.pow(zmax-zmin, 2))
        NEAR = -diag/2 - 250;
        FAR = diag/2 + 250;
    }

    var point = getCameraDirection();
    camera.top = height/2;
    camera.bottom = -height/2;
    camera.left = width/-2;
    camera.right = width/2;
    //camera.lookAt(point);
    camera.position.set(view.x,view.y,view.z);
    
    
    //camera.lookAt(point);

    camera.updateProjectionMatrix();

    //controls for manipulating camera
    if (false) { //mobile device 
        console.log('mobile')
        controls = new THREE.TrackballControls(camera, overlayCanvas);
    }
    else{
        controls = new THREE.OrbitControls(camera, overlayCanvas);
    }
    //controls.object = camera;
    //controls.domElement = overlayCanvas;
    controls.rotateSpeed = 1.0*2;
    controls.zoomSpeed = 1.2 * 2;
    controls.panSpeed = 0.2 ;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.userPan = panBool;
    controls.userRotate = rotateBool;
    
    //camera.lookAt(old_center);
    controls.center = old_center;
    
    
}
function init_camera(init_view) {
    //Inialize the camera
    setOverlayCanvas();
    //camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/-2, NEAR, FAR);
    camera.position.x = init_view.x;
    camera.position.y = init_view.y;
    camera.position.z = init_view.z;

    //controls for manipulating camera
    if ( false ) { //mobile device edit
        console.log('mobile')
        controls = new THREE.TrackballControls(camera, overlayCanvas);
    }
    else{
        controls = new THREE.OrbitControls(camera, overlayCanvas);
    }
    controls.rotateSpeed = 1.0*2;
    controls.zoomSpeed = 1.2 * 2;
    controls.panSpeed = 0.2 ;
    controls.noRotate = false;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
}
var renderer2;
var scene2;
var camera2;

var aCANVAS_HEIGHT = 100;
var aCANVAS_WIDTH = 100;
if ( !mobileDevice ){
    aCANVAS_HEIGHT += 100;
    aCANVAS_WIDTH += 100;
}
var CAM_DISTANCE = 300;
var axes2;
// var CHILDREN_NUMBER = container1.childNodes.length;

function addAxes(){
    /*Add 3D axes to bottom corner of screen. Use a 
    second transparent canvas and the previously established
    camera. */

    //createCanvas
    axesCanvas = document.createElement('canvas');
    axesCanvas.style.position = 'absolute';
    axesCanvas.style.left = 0 +'px';
    axesCanvas.style.top = height - aCANVAS_HEIGHT + 'px';  
    axesCanvas.style.backgroundColor = 'transparent';
    axesCanvas.width = aCANVAS_WIDTH + '';
    axesCanvas.height = aCANVAS_HEIGHT + '';
    axesCanvas.style.height = aCANVAS_WIDTH + 'px';
    axesCanvas.style.width = aCANVAS_HEIGHT + 'px';    
    axesCanvas.style.zIndex = 1;
    //temporary
    //axesCanvas.style.border = "solid #000000";        
    container1.appendChild(axesCanvas);

    //renderer
    renderer2 = new THREE.WebGLRenderer({ canvas: axesCanvas, alpha: true });
    renderer2.setPixelRatio(aCANVAS_WIDTH / aCANVAS_HEIGHT);//Sets resolution and dictates speed
    renderer2.setSize(aCANVAS_WIDTH, aCANVAS_HEIGHT);//Sets size of window
    renderer2.sortObjects = false;

    //scene
    scene2 = new THREE.Scene();

    //camera
    camera2 = new THREE.PerspectiveCamera(50, aCANVAS_WIDTH/aCANVAS_HEIGHT, 1, 1000);
    //camera2 = new THREE.OrthographicCamera(aCANVAS_WIDTH / -2, aCANVAS_WIDTH / 2, aCANVAS_HEIGHT/2, aCANVAS_HEIGHT/-2, NEAR, FAR)
    camera2.up = camera.up;

    //add axes
    var axes1 = createBoxAxes(100);
    axes2 = new THREE.AxisHelper( 1000 );
    
    scene2.add( axes1 );
    //scene2.add( axes2 );
    
    var axesLabels = ['x', 'y', 'z'];
    var labelPositions = [
        [100,0,0],
        [0,100,0],
        [0,0,100]
    ];
    
    for (var i = 0; i < axesLabels.length; i++){
        var spritey = makeTextSprite(axesLabels[i], { fontsize: 75 });
        spritey.position.set(labelPositions[i][0], labelPositions[i][1], labelPositions[i][2]);
        scene2.add(spritey);
    }
    
    var box = new THREE.BoxGeometry(25,25,25);
    var org = new THREE.Mesh(box, pickingMaterial);
    //scene2.add(org)
}
function avgGlobalPos(){
    /*get average position of strucutre using maxes and mins*/
    if (xmax){
        return [( xmin + xmax )/ 2,( ymin + ymax )/ 2,( zmin + zmax )/ 2];
    }
    else{
        return [0,0,0]
    }
}
function update_scene(){
    /*update the parameters of the scene*/

    pickingTexture = new THREE.WebGLRenderTarget( width, height, { canvas: canvas });
    addAxes();
    var avgs = avgGlobalPos();
    light.position.set(200 + avgs[0], 800 + avgs[1], 500 + avgs[2]);

}
var light;
function init_scene() {
    pickingScene = new THREE.Scene();
    scene = new THREE.Scene();
    nodeScene = new THREE.Scene();
    
    pickingTexture = new THREE.WebGLRenderTarget(width, height, { canvas: canvas });

    // Set ambient light color
    scene.add(new THREE.AmbientLight(0x555555));
    
    // Set spotlight color
    light = new THREE.SpotLight(0xffffff, 1.5);
    
 
    
    scene.add(light);

    removeFloor();
    addFloor(0xf0f0f0);
    

    addAxes();
}
function toggleFloor(){
    /*toggle the floor on or off for the model */
    var floor = scene.getObjectByName('floor');
    showFloor = !showFloor;
    if (showFloor) {
        floor.visible = true;
    }
    else {
        floor.visible = false;
    }
}

function addFloor(color){

    //Add Ground
    var xa, ya, za, avgs, tempymin;
    avgs = avgGlobalPos();
    //adjust position of floor based on bounding box of model
    if ( xmax > -1000000  ){
        xa = avgs[0]; ya = avgs[1]; za = avgs[2];
        tempymin = ymin;
        var xdif = xmax - xmin;
        var zdif = zmax-zmin;
    }
    else{
        xa = 0;
        ya = 0;
        za = 0;
        tempymin = 0;
        var xdif = 0;
        var zdif = 0;
    }

    var plane = new THREE.PlaneBufferGeometry( xdif + 1000, zdif + 1000);
    var floorMaterial = new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide});
    var floor = new THREE.Mesh(plane,floorMaterial);
    floor.rotation.x = Math.PI/2;
    floor.position.set( xa, tempymin, za );
    scene.add(floor);
    if (!showFloor){
        floor.visible = false;
    }
    floor.name = 'floor';

}

function removeFloor(){
    var floor = scene.getObjectByName('floor');
    scene.remove(floor);
}

function update_window(){
    renderer.canvas = canvas;
    //renderer.setPixelRatio(width/height);
    renderer.setPixelRatio(16/9);
    renderer.setSize(width, height);
    renderer.sortObjects=false;
}
function init_window() {
    //initialize window
    //use canvas in our html div
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setClearColor(0xffffff);//Sets background color
    //renderer.setPixelRatio(width / height); //Sets resolution and dictates speed
    renderer.setPixelRatio(16/9);
    renderer.setSize(width, height);//Sets size of window
    renderer.sortObjects = false;
    //Get performance stats
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    //container.appendChild( stats.domElement );
    // Listens for mouse events. Such as 'mousemove' or 'click'
    //change to overlay canvas
}
function onMouseCommand(e) {
    mouse.x = e.pageX;
    mouse.y = e.pageY;
    

    click = true;
    if (keyboard.ctrl) {
        ctrl_click = true;
    }
}

function findBottomOffset() {
    /*find the offset of the window from the bottom
    of the page*/

    var bottom = $(window).height() - offsetY - height;
    
    return bottom;
}
var bottomOffset = findBottomOffset();

function changeNodeColor(groupID, newColor) {
    //change node color to given color
    
    subID = 1;
        
    //nodeArray = (isOdd(colorID)) ? drawnNodes : pickingNodes; // will always be odd
    var node = nodeArray[groupID][subID];
    node.color = newColor;    
    //remove_object(groupID,node.direction);
    respawn_node(groupID, subID);
    
    
}
function changeBeamColor(id, newColor) {
    //Change the beam color to given color
    
    if (prisms[id] != [] && prisms[id] != 'undefined' && id < prisms.length){
        for (var i = 0; i < prisms[id].length; i++) {
           
            prisms[id][i].color = newColor;
            //recolor geometry
            respawnVertices(id, i);                        
        }
    }

}
function hideElement(groupID, visible){
    /*hide the specified element
    group ID indicates the element
    visible is boolean indicating whether element is 
    visible or not*/

    for (var i = 0; i < prisms[groupID].length; i++){
        prisms[groupID][i].prism.visible = visible;
    }

}

function wheelFix(e){
    //intended to prevent scrolling while cursor on canvas
    e.preventDefault();
}
function findBotLeft(down, up){
    /*Helper function for finding the bottom left
    of our selection box*/
    var startX, startY;

    startX = (down[0] < up[0]) ? down[0] : up[0];
    startY = (down[1] > up[1]) ? down[1] : up[1];
    
    return [startX, startY];
}
console.log(offsetY)
function drawBox(e){
    /*draw box given the down coordinates and the mouse coordinates*/
    if (drag == false)
        return;
    
    //set width and hight of rectangle based on mouse postion

    console.log ("box " + offsetY);
    rect.w = (e.pageX - offsetX) - rect.startX;
    rect.h = (e.pageY - offsetY) - rect.startY;

    
    //clear any previous figures
    ctx.clearRect(0,0, width, height)
    
    
    //draw
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = '1'
    //draw rectangle
    ctx.rect(rect.startX, rect.startY, rect.w, rect.h);
    ctx.stroke();

}
function addCanvas(inputWidth, inputHeight, left, top, zIndex){
    /*add a canvas to the scene with the given inputs*/
    complianceCanvas = document.createElement('canvas');
    complianceCanvas.style.position = 'absolute';
    complianceCanvas.style.left = left +'px';
    complianceCanvas.style.top = top + 'px';  
    complianceCanvas.style.backgroundColor = 'transparent';
    complianceCanvas.width = inputWidth + '';
    complianceCanvas.height = inputHeight + '';
    complianceCanvas.style.height = inputHeight + 'px';
    complianceCanvas.style.width = inputWidth + 'px';    
    complianceCanvas.style.zIndex = zIndex;
    //complianceCanvas.style.border = "solid #000000";
    container1.appendChild(complianceCanvas);
}
function addComplianceLabels(){
    addCanvas(300, 100, 0,0, 9);
    var fontsize = 15;
    fontface = 'Helvetica';
    labelContext = complianceCanvas.getContext('2d');
    //labelContext.fillText("hello world", 50,20);
    labelContext.font = fontsize + 'px ' + fontface;
    labelContext.fillStyle = "#FF0000";
    labelContext.fillRect(5, 5, 35, 15);
    //                labelContext.font = "normal normal normal 16px Helvetica";
    labelContext.fillText("Compliance ratio >= 1.0", 50, 16);
    labelContext.fillStyle = "#0000FF";
    labelContext.fillRect(5, 30, 35, 15);
    labelContext.fillText("0.85< Compliance ratio < 1.0", 50, 41);
    labelContext.fillStyle = "#00FF00";
    labelContext.fillRect(5, 55, 35, 15);
    labelContext.fillText("Compliance ratio <= 0.85", 50, 66);
}

function create2DCanvas(inputWidth, inputHeight, left, top){ //input canvas
    /*create a transparent 2d canvas of input width and height, 
    at location left and top*/
    canvas2D = document.createElement('canvas');
    canvas2D.style.position = 'absolute';
    canvas2D.style.left = left +'px';
    canvas2D.style.top = top + 'px';  
    canvas2D.style.backgroundColor = 'transparent';
    canvas2D.width = inputWidth + '';
    canvas2D.height = inputHeight + '';
    canvas2D.style.height = inputHeight + 'px';
    canvas2D.style.width = inputWidth + 'px';    
    canvas2D.style.zIndex = 11;
    //temporary
    canvas2D.style.border = "solid #000000";
        
    container1.appendChild(canvas2D);
    ctx = canvas2D.getContext('2d');
    canvas2D.addEventListener('mouseup', multiSelect, false); //change to overlay canvas

    

}
function getDownCoords(event){
    /* Get the mouse coordinates of the click
    and create the secondary canvas for drawing the 
    selection box*/

    if (drag){
        return;
    }
    //if box selection mode or node selection mode is not turned on, this is not our function of choice
    if (elSelectMode == false && nodSelectMode == false){
        return;
    }
    downLocation = [event.pageX, event.pageY];
    console.log(downLocation);  
    //create canvas to draw rectangle for highlight box
    create2DCanvas(width, height, 0,0);
    


    //initialize rectangle
    rect.startX = event.pageX - offsetX;
    rect.startY = event.pageY - offsetY;
    drag = true;

    
}

function multiSelect(event){
    /*Use the down location and up location of the selected box 
    to add all items in the box to our selection set*/
    
    //clearInterval(timeout)
    
    if (!drag)
        return;

    canvas2D.removeEventListener('mouseup', multiSelect, false); //overlay canvas
    upLocation = [ event.pageX, event.pageY ];
    
    botLeft = findBotLeft(downLocation, upLocation);
    boxLength = Math.abs(downLocation[0] - upLocation[0]) + 1;
    boxHeight = Math.abs(downLocation[1] - upLocation[1]) + 1;

    drag = false;
        
    container1.removeChild(canvas2D);
        


    if (keyboard.shift) {
        shift_click = true;
    }
    if (keyboard.ctrl) {
        ctrl_click = true;
    }
    
    if (nodSelectMode == true){
        nodeSelect(event);
        return;
    }
    if (elSelectMode == true){
        elementSelect(event);
        return;
    }
    
}
function toScreenXY( position, input_camer) {
    var pos = position.clone();
    projScreenMat = new THREE.Matrix4();
    projScreenMat.multiply( input_camer.projectionMatrix, input_camer.matrixWorldInverse );
    projScreenMat.multiplyVector3( pos );

    

    return { x: ( pos.x + 1 ) * width / 2 + offsetX,
        y: ( - pos.y + 1) * height / 2 + offsetY };
}
function selectionSphere(position){
    /*draw circle at specified 3d location and project onto 2d screen space*/
   
    var ballGeometry = new THREE.SphereGeometry(10,32,32);
    selectMaterial = new THREE.MeshBasicMaterial({color: 0xcae30f, transparent: true, opacity: .6})
    var selectSphere = new THREE.Mesh(ballGeometry, selectMaterial);
    selectSphere.position.set(position[0], position[1], position[2]);
    scene.add(selectSphere);
    selectSphere.name = 'selectSphere';


}
function enlargeNodes(factor) {//needs fix
    /*Increase the radius of all nodes in the
    node picking scene to get a click tolerance*/

    for (var i = 1; i < drawnNodes.length; i++){
        for (var j = 0; j< drawnNodes[i].length; j++){
            node = drawnNodes[i][j];
            node.pickingNode.scale.set(factor,factor,factor);
        }
    }
    
}
function pickNode1(){
    /*pick node that have been selected by user
     node picked should be shown with circle around it
    */
    //console.log(drawnNodes);
    //restore all elements to original color
    for (var i = 0; i < nodSelectionSet.length; i++) {
        changeNodeColor(nodSelectionSet[i],beamNodeColor);
    }
    nodSelectionSet = [];
    for (var i = 0; i < selectionSet.length; i++) {
        changeBeamColor(selectionSet[i], beam_color);
    }
        
    refreshElements();
    refreshNodes();

    selectionSet = [];
    renderer.render(nodeScene, camera, pickingTexture);
    var gl = renderer.getContext();
    var pixelBuffer = new Uint8Array(4) //4 unit 8 arrays (R G B A) are needed for each pixel 
    
    offsets = getPickOffsets();

    gl.readPixels(offsets[0], offsets[1], 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);
    var id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2]);
    console.log(id);

        
    groupID = Math.floor(id/10);
    subID = id%10;
        
    var nodeArray = (isOdd(id)) ? drawnNodes : pickingNodes;//fix the subID

    if (groupID > 0 && groupID < nodeArray.length){//needs fix
        console.log(id);        
        $('#fromNode').val(groupID);
        getCoords();
        $('#toNode').focus();
        nodSelectionSet.push(groupID);
        clearSticks();
        firstPick = true;
        firstNode = nodeArray[groupID][subID];//needs fix
        selectionSphere(firstNode.position);
        console.log(nodSelectionSet);
    }
    
}
function pickNode2(){
    /*Pick the second node and draw a stick between
    the first node and the second node*/
    renderer.render(nodeScene, camera, pickingTexture);
    var gl = renderer.getContext();
    var pixelBuffer = new Uint8Array(4) //4 unit 8 arrays (R G B A) are needed for each pixel 
    offsets = getPickOffsets();
    gl.readPixels(offsets[0], offsets[1], 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);
    var id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2]);
    
    groupID = Math.floor(id/10);
    subID = id%10;

    var nodeArray = (isOdd(id)) ? drawnNodes : pickingNodes;

    if (groupID > 0 && groupID < nodeArray.length && id != firstNode.colorID) {        
        
        nodSelectionSet.push(groupID);
        $('#toNode').val(groupID);
        getCoords();
        $('#dX').focus();
        //onFromNode = false;
        console.log(nodSelectionSet);
        var secondNode = nodeArray[groupID][subID];//needsfix 
        createStick(0,firstNode.position, secondNode.position); //put stick in first index of prisms
        //restore conditions
        firstNode = null;
        firstPick = false;
        removeHighlightSphere();
        addSelectionStick();
    }
}
function addSelectionStick(){
    /*add selection stick while using draw mode*/
    var line = prisms[0][0].prism;
    scene.add(line);
    line.name = 'stick'
}
function removeHighlightSphere() {
    /*remove highlighted sphere*/
    var highlightSphere = scene.getObjectByName('selectSphere');
    scene.remove(highlightSphere);
}

function restoreNodePickConditions() {
    /*restore node conditions after second pick is successfully made*/
    firstNode = null;
    firstPick = false;
    nodSelectionSet = [];
    removeHighlightSphere();
    clearSticks();
}
function nodeSelect(event){
    /*select nodes with a drawn box
    Represent their selection by changing their color
    and add them to the selection set*/
    
   
    var change = false;
    
    //restore beams to original colors
    for (var i = 0; i < selectionSet.length; i++){
        changeBeamColor(selectionSet[i], beam_color);
    }
    
    renderer.render(nodeScene, camera, pickingTexture);
    
    var gl = renderer.getContext();

    var offsets = getBoxOffsets();

    var pixelBuffer = new Uint8Array(4 * boxLength * boxHeight) //4 unit 8 arrays (R G B A) are needed for each pixel 
    gl.readPixels(offsets[0], offset[1], boxLength, boxHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);
    var boxSet = new Set([])
    //iterate through all pixels, adding selected to selection set
    for (var i = 0; i < pixelBuffer.length; i += 4){
        
        //get array for each pixel
        //var pixel = pixelBuffer.slice(i, i+4);
        var id = (pixelBuffer[0+i] << 16) | (pixelBuffer[1+i] << 8) | (pixelBuffer[2+i]);
        var subID = id%10;
        var groupID = Math.floor(id / 10);
        
        var nodeArray = (isOdd(id)) ? drawnNodes : pickingNodes //find array to which the node belongs

        //add all ids contained in the box to the set of selected items
        if (groupID > 0 && groupID < nodeArray.length){ //needs fix
            change = true;
            boxSet.add(groupID);
            //last_id = id;                           //This line needs attention
        }
    }
    console.log('boxset');
    console.log(boxSet);

    if (ctrl_click == true){
        console.log('ctrl_click true?');
        //for (member of boxSet){
        //    nodSelectionSet.push(member);
        var boxArray = makeArrayFromSet(boxSet);
        for (var i = 0; i < boxArray.length; i++){
            nodSelectionSet.push(boxSet[i])
        }
        ctrl_click = false;
    }
    else{
        console.log('ctrl not clicked');
        //Restore colors of nodes in nodSelectionSet back to normal
        if (nodSelectionSet.length != 0)
            change = true;
        for (var i = 0; i < nodSelectionSet.length; i++){
            changeNodeColor(nodSelectionSet[i], beamNodeColor);
        }
        //assign selection set as those selected by the box
        nodSelectionSet = makeArrayFromSet(boxSet);
    }
    for (var i = 0; i < nodSelectionSet.length; i++){
        changeNodeColor(nodSelectionSet[i], highlight_color);
                
    }

    if (change){
        console.log('redrawing nodes');
        refreshNodes();
    }

}
function getBoxOffsets(){

    var yoffset, xoffset;
    if (mobileDevice){
        yoffset = window.innerHeight - botLeft[1] + offsetY;
    }
    else{
        yoffset = window.innerHeight - botLeft[1] - offsetY;
    }
    
    xoffset = botLeft[0] - offsetX;
    
    return [xoffset, yoffset];
}
function elementSelect (event){
    /*Select elements with a draw box*/
    //Set up pixel buffer to include everything in rectangle

    

    for (var i = 0; i< nodSelectionSet.length; i++){
        changeNodeColor(nodSelectionSet[i], beamNodeColor);
    }
    renderer.render(pickingScene, camera, pickingTexture);
    var gl = renderer.getContext();
   
    var offsets = getBoxOffsets();
    
    var pixelBuffer = new Uint8Array(4 * boxLength * boxHeight) //4 unit 8 prismss (R G B A) are needed for each pixel 
    gl.readPixels(offsets[0], offsets[1], boxLength, boxHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);
    var boxSet = new Set([])
    var slice;
    if (ctrl_click) {
        for (var i =0; i < selectionSet.length; i++) {
            toggleObjectVisibility(selectionSet[i], false)
        }
        refreshPickingScene();
    }

    //iterate through all pixels, adding selected to selection set
    for (var i = 0; i < pixelBuffer.length; i += 4){
        slice = [pixelBuffer[i], pixelBuffer[i+1], pixelBuffer[i+2], pixelBuffer[i+3]];
        while (!(slice[0] == 255 && slice[1] == 255 && slice[2] == 255 && slice[3] == 255)){
            //var id = (slice[i] << 16) | (slice[1+i] << 8) | (slice[2+i]);
            var id = (pixelBuffer[i] << 16) | (pixelBuffer[1+i] << 8) | (pixelBuffer[2+i]);
            subID = id%10;
            id = Math.floor(id/10);
            if ( id > 0 && id < prisms.length ) {
                boxSet.add(id);
                last_id = id;
            }
            toggleObjectVisibility(id,false);
            refreshPickingScene(); //write this function
            renderer.render(pickingScene,camera,pickingTexture);
            gl.readPixels(offsets[0], offsets[1], boxLength, boxHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);

            slice = [pixelBuffer[i], pixelBuffer[i+1], pixelBuffer[i+2], pixelBuffer[i+3]]
        }
        
        //get prisms for each pixel
        //var pixel = pixelBuffer.slice(i, i+4);
        
    }

    boxArray = makeArrayFromSet(boxSet);

    var colorArray =[];
    
    for (var i = 0; i< selectionSet.length; i++){
        colorArray[selectionSet[i]] = (cColor) ? getBeamColor(selectionSet[i]) : beam_color;
    }

    if (ctrl_click == true){
        console.log('ctrl_click true');
        for (var i = 0; i < boxArray.length; i++){
            selectionSet.push(boxArray[i]);
        }
        ctrl_click = false;
    }
    else{
        //turn elements back to original color
        console.log('ctrl not clicked');
        for (var i = 0; i < selectionSet.length; i++){
            changeBeamColor(selectionSet[i], colorArray[selectionSet[i]]);
        }
        //move objects in boxArray to selectionSet
        selectionSet.length = 0;
        for (var i = 0; i < boxArray.length; i++){
            selectionSet.push(boxArray[i]);
        }
        
    }
    //add the hidden picking objects back to the scene
    for (var i = 0; i < selectionSet.length; i++) {
        toggleObjectVisibility(selectionSet[i], true);
    }
    refreshPickingScene();

    //Change color of objects on screen
    for (var i =0; i < boxArray.length; i++){
        changeBeamColor(boxArray[i], highlight_color);
    }
    console.log('multiselectSelectionSet');
    console.log(selectionSet);

    refreshElements();
}

function refreshPickingScene() {
    removePickingScene();
    redrawPickingScene();
}
function removePickingScene() {
    var pickingElements = pickingScene.getObjectByName('pickingElements');
    pickingScene.remove(pickingElements);
}
function updatePickingScene() {
        
    if ( stickFigure ) {
        pickingLineGroup = new THREE.Group();
    }
    else{
        //disposeGeometries();
        pickingCombined = new THREE.Geometry();        
    }

    for (var i in prisms) {
        for (var j = 0; j < prisms[i].length; j++){
            if (prisms[i][j].prism != null){
                if (prisms[i][0].visible){
                    if (!stickFigure){
                        pickingCombined.merge(prisms[i][j].pickingPrism);     
                    }
                    else{
                        pickingLineGroup.add(prisms[i][j].pickingPrism);
                    }
                }
            }
        }
    }
}
function redrawPickingScene() {
    
    updatePickingScene();

    if (stickFigure){
        var pickingElements = pickingLineGroup;
        }
    else{
        var pickingElements = new THREE.Mesh(pickingCombined, pickingMaterial);
    }
    pickingScene.add(pickingElements);
    pickingElements.name = 'pickingElements';
}

function animate(){
    
    requestAnimationFrame( animate );
    controls.update();
    render();

    if (showcaseMode){
        cameraAnimationSequence();
    }
    //var timer = Date.now() * 0.0001;

    //camera.position.x = Math.cos( timer ) * 200;
    //camera.position.z = Math.sin( timer ) * 200;
    //camera.lookAt( scene.position );
    //if (showcaseMode){
    //    scene.rotation.y += .005;
    //}

    
}
var newT;
var currentPos;
var avgPos;
function cameraAnimationSequence(){
    /*when animated, progress on the sequence*/
    t = (Date.now() - startTime) * .001;
    twoPi = 2 * Math.PI
    var r, slowFactor;
    avgPos = new THREE.Vector3 ( xmax - xmin, ymax - ymin, zmax - zmin);
    avgPos.multiplyScalar(1/2);
    if (t < twoPi ){
        camera.zoom = 1;
        camera.updateProjectionMatrix();
        r = Math.max(avgPos.x, avgPos.z) + 400;
        camera.position.x =  -avgPos.x + Math.cos(t) * r;
        camera.position.z =  -avgPos.z + Math.sin(t) * r;
        camera.position.y = ymax + 50 - t * 25;
        camera.lookAt ( avgPos );
    }
    else if (t < twoPi + Math.PI/2 ){
        slowFactor = twoPi / t         
        newT = t - twoPi;
        r = Math.max(avgPos.x, avgPos.z) + 400 - 50 * ( newT );
        //r = 400;
        camera.position.x = - avgPos.x + Math.cos(slowFactor * newT + twoPi) * r;
        camera.position.z = - avgPos.z + Math.sin(slowFactor * newT + twoPi) * r;
        //camera.zoom += newT/50;
        camera.lookAt ( avgPos );
        //camera.updateProjectionMatrix();
        //camera.position.y = (ymax + ymin) / 2
    }
    else if (t < twoPi + twoPi){
        newT = t - twoPi - Math.PI/2;
        camera.position.z -= newT;
        camera.position.x -= newT
        camera.updateProjectionMatrix();
        currentPos = camera.position;
        
    }
    else if (t < twoPi*2 + Math.PI){
        newT = t - twoPi * 2;
        dx = (400 - currentPos.x) / Math.PI;
        dz = (0 - currentPos.z) / Math.PI;
        camera.position.x += dx
        camera.position.z += dz;
        camera.lookAt (avgPos);
        
        
    }
}

function getPickOffsets(){
    /*get pick offsets depending on device*/
    var xoffset, yoffset;
    if (mobileDevice){
        yoffset = window.innerHeight - mouse.y + offsetY;
    }
    else{
        yoffset = window.innerHeight - offsetY - mouse.y;
    }
    xoffset = mouse.x - offsetX;
    return [xoffset, yoffset];
}
function pick() {
    //FUNCTIONS TO FIND IF USER PICKS AN ITEM ^.^

    
    //for picking first node
    if (drawMode && onFromNode){
        pickNode1();
    }//for picking second node
    else if (drawMode && onToNode){
        pickNode2();
    }
    else
        pickIndividual();
}
function pickIndividual() {
    /*pick individual elments from the scrren*/

    var change = false;
    


    for (i = 0; i< nodSelectionSet.length; i++){ //Remove nodes from selection set
        changeNodeColor(nodSelectionSet[i], beamNodeColor);
    }
    //render the picking scene off-screen
    renderer.render(pickingScene, camera, pickingTexture);
    var gl = renderer.getContext();

    //read the pixel under the mouse from the texture
    var pixelBuffer = new Uint8Array(4);
    offsets = getPickOffsets();
    gl.readPixels(offsets[0], offsets[1], 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);

    //interpret the pixel as an ID
    var id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2]);

    console.log(pixelBuffer);
    id = Math.floor(id / 10);
    var object_data = prisms[id];

    if (id < prisms.length && id != 0) { //if we clicked on a valid object
        
        if ( cColor ){
            var original_color = getBeamColor();
        }
        else{
            var original_color = beam_color;
        }
        
        if ((last_id != id) || (selectionSet.size == 0)) {
            click = false;
                        
            if ((last_id != null) && (ctrl_click == false)) {   // Return color to beam color of unselected object
                change = true;
                changeBeamColor(last_id, original_color);
            }
        }
    
        
        //clear selected if we click and ctrl isn't held down
        if (ctrl_click == true) {
            ctrl_click = false;
        }
        else {
            for (i = 0; i < selectionSet.length; i++){ // change color back to beam color
                changeBeamColor(selectionSet[i],original_color);
                change = true;
            }
            selectionSet = [];
        }

        //Add prism to selection set
        last_id = id
        selectionSet.push(last_id);

        //change color of selection set
        //for (i = 0; i < selectionSet.length; i++) {
        //    changeBeamColor(selectionSet[i], highlight_color);
        //    change = true;
        //}
     

        console.log(selectionSet);

        if (!_.isEqual(modelElements[currElmt], getScreenEntries()) || (currElmt > totEls)) { //not sure about this if statement

            //if (validEntry(false)) {
            //    storeElement(1, 1, 1, 1, 1, 1, 1, 1, 0, -1, true);
            //    drawModel(false, true);
            //}
            currElmt = last_id;
            displayElement(currElmt);
            //selectionSet = [iEl]; //is this necessary for updataing menu?
            elemMenu();    // reset context menu to reflect elements
        }

        if (deformed){
            launchDetailSheet(id);
        }
    }
        

    else if (selectionSet.length > 0) {
        if ( cColor ){
            var original_color = getBeamColor();
        }
        else{
            var original_color = beam_color;
        }
        if (!ctrl_click){
            for (i = 0; i < selectionSet.length-1; i++) {
                changeBeamColor(selectionSet[i], original_color);
            }
            refreshElements();
        }
    }
}
function disposeGeometries() {
    combined.dispose();
    pickingCombined.dispose();
    deformedCombined.dispose();
    restraintsCombined.dispose();

}
function updateCombined(){
    /*update our mesh variable 'combined'*/
    
    //Remove the new declarations here
    if ( stickFigure ) {

        lineGroup = new THREE.Group();
        pickingLineGroup = new THREE.Group();
        deformedLineGroup = new THREE.Group();
    }

    else{
        //disposeGeometries();
        combined = new THREE.Geometry();
        pickingCombined = new THREE.Geometry();
        deformedCombined = new THREE.Geometry();
        restraintsCombined = new THREE.Geometry();
    }

    for (var i in prisms) {
        for (var j = 0; j < prisms[i].length; j++){
            if (prisms[i][j].prism != null){
                if (!stickFigure){
                    combined.merge(prisms[i][j].prism);
                    pickingCombined.merge(prisms[i][j].pickingPrism);     
                }
                else{
                    lineGroup.add(prisms[i][j].prism);
                    pickingLineGroup.add(prisms[i][j].pickingPrism);
                }
                //add restraints
                if (j == 0) {
                    if (modelElements[i].hasOwnProperty('restraints') && !modelElements[i].hidden) { //if model is hidden don't draw restraint
                        if (typeof(modelElements[i].restraints[0]) == 'object')
                            restraintsCombined.merge(modelElements[i].restraints[0]);
                        if (typeof(modelElements[i].restraints[1]) == 'object')
                            restraintsCombined.merge(modelElements[i].restraints[1]);
                    }
                }
            }
            if (prisms[i][j].deformedPrism != null && deformed){
                if (!stickFigure){
                    deformedCombined.merge(prisms[i][j].deformedPrism);
                }
                else{
                    deformedLineGroup.add(prisms[i][j].deformedPrism);
                }
            }
        }
    }
}


function updateNodesMesh(){
    /*update our mesh of all nodes*/
    allNodes = new THREE.Geometry();
    pickNodes = new THREE.Geometry();
    for ( var i = 0; i < drawnNodes.length; i++ ){ 
        if (drawnNodes[i] != null){
            allNodes.merge( drawnNodes[i][1].node );        //add all nodes to a single mesh
            pickNodes.merge(drawnNodes[i][1].pickingNode);
        }
    }
    if (!nodSelectMode){
        for ( var i in pickingNodes ){
            if (pickingNodes[i] != null){
                pickNodes.merge(pickingNodes[i][0].pickingNode)
            }
        }
    }
}
function redrawAllElements(){
    /*redraw all elements (not nodes) in the scene as one object*/
    updateCombined();

    if (stickFigure){
        var allElements = lineGroup;
        var pickingElements = pickingLineGroup;
        if ( deformed ){
            var deformedElements = deformedLineGroup
        }
    }
    else{
        if (!isTextured){
            var allElements = new THREE.Mesh(combined,defaultMaterial);
        }        
        else{
            var allElements = new THREE.Mesh(combined, metalMaterial);
        }
        if (deformed){
            deformedElements = new THREE.Mesh(deformedCombined, deformedMaterial)           
        }
        var pickingElements = new THREE.Mesh(pickingCombined, pickingMaterial);
    }
    var allRestraints = new THREE.Mesh(restraintsCombined, restraintMaterial);
    var allRestraints = new THREE.Mesh(restraintsCombined, restraintMaterial);
    if (isAnimated && !respond){
        animations.push(allElements);
    }
    else{
        scene.add(allElements);
        allElements.name = "allElements";
        scene.add(allRestraints);
        allRestraints.name = "allRestraints";
        pickingScene.add(pickingElements);
        pickingElements.name = 'pickingElements';
        if ( deformed ) {
            deformedElementsPresent = true;
            scene.add(deformedElements);
            deformedElements.name = 'deformedElements';
        }
    }
}
function redrawAllRestraints() {
    /*draw all restraints, nothing else*/
    updateCombined();
    if (!isTextured) {
        var allRestraints = new THREE.Mesh(restraintsCombined, defaultMaterial);
    }
    else {
        var allRestraints = new THREE.Mesh(restraintsCombined, metalMaterial);
    }

    if (!isAnimated || respond) {
        scene.add(allRestraints);
        allRestraints.name = 'allRestraints';
    }
    
}

function redrawAllNodes(){
    /*redraw all nodes*/
    
    updateNodesMesh(); //update the mesh of nodes
    if (gridMode){
        var nodes = new THREE.Mesh(allNodes,defaultMaterial);
        scene.add(nodes); //add mesh of all nodes to scene
        nodes.name = "allNodes"    
    }
    
    var pN = new THREE.Mesh(pickNodes, pickingMaterial);
    nodeScene.add(pN);
    pN.name = 'pickingNodes';
    
}
function removeAllNodes(){
    /*remove visible nodes from the scene*/
    var allNodes = scene.getObjectByName('allNodes');
    scene.remove(allNodes);
    var pN = nodeScene.getObjectByName('pickingNodes');
    nodeScene.remove(pN);
}
function redrawAllSprites() {
    //Add sprites to the scene
    spriteGroup = new THREE.Group();
    if (nodesOn){
        for (var i in sprites ){
            if (sprites[i] != null){
                spriteGroup.add(sprites[i]);
            }
        }
        //if (isAnimated && !respond){
        //spriteAnimations.push(spriteGroup);
        //}
        //else{
        spriteGroup.name = 'spriteGroup'
        scene.add(spriteGroup);
        //}
    }
}

function removeAllElements(){
    /*remove all elements from the visible scene*/
    if (!isAnimated || respond){
        var allElements = scene.getObjectByName("allElements");
        scene.remove(allElements);
        var pickingElements = pickingScene.getObjectByName('pickingElements');
        pickingScene.remove(pickingElements);
        removeAllRestraints();
    }
    if (deformedElementsPresent){
        var dE = scene.getObjectByName('deformedElements');
        scene.remove(dE);
    }
}
function removeAllSprites(){
    /*remove sprites from the scene*/    
    var allSprites = scene.getObjectByName('spriteGroup');
    scene.remove(allSprites);
    
}
function removeAllRestraints() {
    var allRestraints = scene.getObjectByName('allRestraints');
    scene.remove(allRestraints);
}
function redrawAllObjects(){
    /*redraw all elements in the current scene*/
    redrawAllElements();
    redrawAllNodes();
    redrawAllSprites();
}
function removeSceneObjects(){
   
    scene = new THREE.Scene();
    // Set ambient light color
    scene.add(new THREE.AmbientLight(0x555555));
    // Set spotlight color
    var light = new THREE.SpotLight(0x000000, 2.5);
    light.position.set(0, -700, 500);
    scene.add(light);

    //Add Ground
    var plane = new THREE.PlaneBufferGeometry(1000,1000);
    var floorMaterial = new THREE.MeshBasicMaterial({color: 0xf0f0f0, side: THREE.DoubleSide});
    var floor = new THREE.Mesh(plane,floorMaterial);
    floor.rotation.x = Math.PI/2;
    scene.add(floor);
}
function refreshScene(){
    
    refreshSprites();
    refreshElements();
    refreshNodes();
}
function refreshSprites(){
    removeAllSprites();
    redrawAllSprites();
    
}
function refreshElements(){
    //address picking scene
    //respawn_all();
    //address physical scene
    removeAllElements();
    redrawAllElements();
    
}
function refreshNodes(){
    removeAllNodes();
    redrawAllNodes();
    
}
function refreshRestraints() {
    removeAllRestraints();
    redrawAllRestraints();
}
function animateModel(){
    /*animate the model with structures given in the array animations
    function should be called every tenth of a second to draw a new 
    frame of the structure*/

    allEls = scene.getObjectByName('allElements');
    scene.remove(allEls);
    newFrame = animations[animCounter];
    scene.add(newFrame);
    newFrame.name = 'allElements';

    //if (nodesOn){
    //    //allSpr = scene.getObjectByName('spriteGroup');
    //    //scene.remove(allSpr);
    //    //render();
    //    newSpr = spriteAnimations[animCounter];
    //    scene.add(newSpr);
    //    render();
    //    newSpr.name = 'spriteGroup';
    //}

    modifyAnimCounter();
}

function modifyAnimCounter(){
    /*modify the animation counter to iterate through 
    the given animations*/
    if (animCounter == 0){
        da = 1;
    }
    if (animCounter == animations.length - 1) {
        da = -1;
    }
    animCounter += da;
}
    

function render() {

    //requestAnimationFrame(render);
        
    
    //controls.update();
    //stats.update();

    camera2.position.copy( camera.position );    
    camera2.position.sub( controls.center);
    camera2.position.setLength( CAM_DISTANCE );
    camera2.lookAt (scene2.position );

    if (click) {
        pick();
        click = false;
    }
    //light.position.copy (camera.position);
    
    renderer.render(scene, camera);
    renderer2.render(scene2, camera2);
}

function normalize ( pos, dist ) {
    /* provide a position for the axes camera based on the distance
    of the scene camera
    pos - THREE.Vector3
    dist - scalar val*/
    var newpos = new THREE.Vector3(pos.x, pos.y, pos.z)
    newpos.normalize().multiplyScalar( dist );
    //console.log (pos)
    //console.log(newpos);
    //console.log('end');
    return newpos
}
//start button functions here 
function toggleDrawMode(){
    
    lastDownTarget = canvas;
    drawMode = !drawMode;
    if (drawMode) {
        //enable controls
        controls.userRotate = true;
        controls.userPan = true;
        
        //change images and modes
        $("#drawImage").attr("src", "assets/ico/ico_select_2.png");
        elSelectMode = false;
        nodSelectMode = false;
        $("#elSelectImage").attr("src", "assets/ico/ico_selectels.png");
        $("#nodSelectImage").attr("src", "assets/ico/ico_selectnods.png");
        elemMenu();
            
    }
    else{
        $("#drawImage").attr("src", "assets/ico/ico_select.png");
        restoreNodePickConditions();
    }
}

function toggleElSelectMode(){
    lastDownTarget = canvas;
    elSelectMode = !elSelectMode;
        
    if (elSelectMode){
        controls.userRotate = false;
        controls.userPan = false;

        $("#elSelectImage").attr("src", "assets/ico/ico_selectels_2.png");
        nodSelectMode = false;   // shoudln't have both selection modes on simultaneously
        $("#nodSelectImage").attr("src", "assets/ico/ico_selectnods.png");
        drawMode = false;
        $("#drawImage").attr("src", "assets/ico/ico_select.png");
        restoreNodePickConditions();
        elemMenu();
            
    }
    else{
        //unlock controls
        controls.userRotate = true;
        controls.userPan = true;
        //change icon image
        $("#elSelectImage").attr("src", "assets/ico/ico_selectels.png");
        
        
    }
}

function toggleNodeSelectMode(){
    lastDownTarget = canvas;
    nodSelectMode = !nodSelectMode;
    if (nodSelectMode) {
        //lock controls
        controls.userRotate = false;
        controls.userPan = false;

        $("#nodSelectImage").attr("src", "assets/ico/ico_selectnods_2.png");
        elSelectMode = false;   // shoudln't have both selection modes on simultaneously
        $("#elSelectImage").attr("src", "assets/ico/ico_selectels.png");
        drawMode = false;
        $("#drawImage").attr("src", "assets/ico/ico_select.png");
        restoreNodePickConditions();
        fNodesOnly = true; //mask non fnodes
        refreshNodes();
        nodMenu();
    }
    else{
        //unlock controls
        controls.userRotate = true;
        controls.userPan = true;
        //change icon image
        $("#nodSelectImage").attr("src", "assets/ico/ico_selectnods.png");
        fNodesOnly = false; //unmask non fnodes
        refreshNodes();
        elemMenu();
    }
}

function toggleGridMode(){
    lastDownTarget = canvas;
    gridMode = !gridMode;
    if(gridMode){
        visibleNodes = true;
        add_fNodes();
        refreshNodes();
        $("#gridImage").attr("src", "assets/ico/ico_grid_2.png");
    }
    else{
        visibleNodes = false;
        removeAllNodes();
        $("#gridImage").attr("src", "assets/ico/ico_grid.png");
    }
}

function toggleSprites(){
    lastDownTarget = canvas;
    nodesOn = !nodesOn;
    if (!nodesOn){
        $("#nodesOnImage").attr("src", "assets/ico/ico_nodesOn_2.png");
        removeAllSprites();
    }
    else{
        $("#nodesOnImage").attr("src", "assets/ico/ico_nodesOn.png");
        redrawAllSprites();
    }
    //
}

function drawModel(nodesOnly,recalc){

    if (recalc)
        calcCoords();
  

    var scale = 1.0;    // placeholder, not used

    if (!nodesOnly) {
        if (isAnimated) {

            sFact1 += xDel;

            if (sFact1 == -6.0) {
                sFact1 = -4.0;
                xDel = 1.0;
            }
            else
                if (sFact1 == 6.0) {
                    sFact1 = 4.0;
                    xDel = -1.0;
                }
        }
        else
            sFact1 = 1.0;

        /*   if (bigJob) {
             if (deformed)
               return; // don't need to draw this twice
            labelCanvas = document.getElementById("labelCanvas");
            labelContext = labelCanvas.getContext("2d");
            labelContext.clearRect(0, 0, cWidth, cHeight);
            labelContext.strokeStyle = "red";
            for (var i = 1; i <= totEls; i++) {
              if (!modelElements[i].hidden)
                plotSkeleton(coords[i].x1 + xCenter - xmax, coords[i].y1 + yCenter - ymax, coords[i].z1 + zCenter - zmax, coords[i].x2 + xCenter - xmax, coords[i].y2 + yCenter - ymax, coords[i].z2 + zCenter - zmax, cWidth, cHeight);
            }
            labelContext.strokeStyle = "black";
          }
          else {  */

        //DRAWING ELEMENTS
        if (!deformed){
            prisms.length = 0;
            prisms.push([]);
            sprites.length = 0;
        }

        for (var i = 1; i <= totEls; i++) {

            if (!modelElements[i].hidden) {
                if (modelElements[i].fromNode != 0 && modelElements[i].toNode != 0) {
                    if (sTypes[modelElements[i].memberType] == undefined) {

                        $.ajax({
                            type: "POST",
                            url: "./php/getMemberData.php",
                            async: false,
                            data: {
                                mType: modelElements[i].memberType
                            },
                            datatype: "json",
                            success: function(data, msg){
                                sType = $.parseJSON(data);
                                sTypes[modelElements[i].memberType] = sType;
                                //                          alert (msg);
                            },
                        });
                    }
                    else
                        sType = sTypes[modelElements[i].memberType];

                    if ((deformed || isAnimated)) {

                        var xf = 0.0;
                        var xt = 0.0;
                        var yf = 0.0;
                        var yt = 0.0;
                        var zf = 0.0;
                        var zt = 0.0;

                        var iLen = nodeDisps.length;

                        // adjust the coordinates by the scaled displacements

                        for (var ii = 0; ii < iLen; ii++) {
                            if (parseInt(nodeDisps[ii][0]) == modelElements[i].fromNode) {
                                xf = sFact1 * defScale * parseFloat(nodeDisps[ii][1]) / uConstLength;
                                yf = sFact1 * defScale * parseFloat(nodeDisps[ii][2]) / uConstLength;
                                zf = sFact1 * defScale * parseFloat(nodeDisps[ii][3]) / uConstLength;
                            }

                            if (parseInt(nodeDisps[ii][0]) == modelElements[i].toNode) {
                                xt = sFact1 * defScale * parseFloat(nodeDisps[ii][1]) / uConstLength;
                                yt = sFact1 * defScale * parseFloat(nodeDisps[ii][2]) / uConstLength;
                                zt = sFact1 * defScale * parseFloat(nodeDisps[ii][3]) / uConstLength;
                            }

                            if (((xf != 0.0) || (yf != 0.0) || (zf != 0.0)) &&
                            ((xt != 0.0) || (yt != 0.0) || (zt != 0.0)))
                                break;
                        }

                        coords[i].x1 += xf;
                        coords[i].y1 += yf;
                        coords[i].z1 += zf;
                        coords[i].x2 += xt;
                        coords[i].y2 += yt;
                        coords[i].z2 += zt;
                    }

                    var resSize1 = 5.0; // nominal
                    var resSize2 = 5.0; // nominal
                    if (stickFigure) {
                        createStick(i, [coords[i].x1, coords[i].y1, coords[i].z1], [coords[i].x2, coords[i].y2, coords[i].z2]);
                    }
                    else 
                        if (sType.shapeType == "W" || sType.shapeType == "S" || sType.shapeType == "M" || sType.shapeType == "WB") {
                            if (!drawW(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.tFlange, sType.wFlange, sType.depth, sType.tWeb, modelElements[i].betaAngle, scale, (xmax - xmin) / 2.0, (ymax - ymin) / 2.0, (zmax - zmin) / 2.0, c.width(), c.height()))
                                drawW(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.tFlange, sType.wFlange, sType.depth, sType.tWeb, modelElements[i].betaAngle, scale, (xmax - xmin) / 2.0, (ymax - ymin) / 2.0, (zmax - zmin) / 2.0, c.width(), c.height());
                            resSize1 = sType.depth;
                            resSize2 = sType.depth;
                        }
                        else {
                            if (sType.shapeType == "C") {
                                if (!drawC(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.tFlange, sType.wFlange, sType.depth, sType.tWeb, sType.xOff, modelElements[i].betaAngle, scale, (xmax - xmin) / 2.0, (ymax - ymin) / 2.0, (zmax - zmin) / 2.0, c.width(), c.height()))
                                    drawC(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.tFlange, sType.wFlange, sType.depth, sType.tWeb, sType.xOff, modelElements[i].betaAngle, scale, (xmax - xmin) / 2.0, (ymax - ymin) / 2.0, (zmax - zmin) / 2.0, c.width(), c.height());
                                resSize1 = sType.depth;
                                resSize2 = sType.depth;
                            }
                            else {
                                if (sType.shapeType == "2L") {
                                    if (!drawLL(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.lThick, sType.lFlange, sType.depth, sType.lThick, sType.b2b, sType.yOff, modelElements[i].betaAngle, scale, (xmax - xmin) / 2.0, (ymax - ymin) / 2.0, (zmax - zmin) / 2.0, c.width(), c.height()))
                                        drawLL(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.lThick, sType.lFlange, sType.depth, sType.lThick, sType.b2b, sType.yOff, modelElements[i].betaAngle, scale, (xmax - xmin) / 2.0, (ymax - ymin) / 2.0, (zmax - zmin) / 2.0, c.width(), c.height());
                                    resSize1 = sType.depth;
                                    resSize2 = sType.depth;
                                }
                                else {
                                    if (sType.shapeType == "L") {
                                        if (!drawL(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.lThick, sType.lFlange, sType.depth, sType.lThick, sType.xOff, sType.yOff, modelElements[i].betaAngle, scale, (xmax - xmin) / 2.0, (ymax - ymin) / 2.0, (zmax - zmin) / 2.0, c.width(), c.height()))
                                            drawL(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.lThick, sType.lFlange, sType.depth, sType.lThick, sType.xOff, sType.yOff, modelElements[i].betaAngle, scale, (xmax - xmin) / 2.0, (ymax - ymin) / 2.0, (zmax - zmin) / 2.0, c.width(), c.height());
                                        resSize1 = sType.depth;
                                        resSize2 = sType.depth;
                                    }
                                    else {
                                        if (sType.shapeType == "WT" || sType.shapeType == "ST" || sType.shapeType == "MT") {
                                            if (!drawT(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.tFlange, sType.wFlange, sType.depth, sType.tWeb, sType.yOff, modelElements[i].betaAngle, scale, (xmax - xmin) / 2.0, (ymax - ymin) / 2.0, (zmax - zmin) / 2.0, c.width(), c.height()))
                                                drawT(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.tFlange, sType.wFlange, sType.depth, sType.tWeb, sType.yOff, modelElements[i].betaAngle, scale, (xmax - xmin) / 2.0, (ymax - ymin) / 2.0, (zmax - zmin) / 2.0, c.width(), c.height());

                                            resSize1 = sType.depth;
                                            resSize2 = sType.depth;
                                        }
                                        else {
                                            if (sType.shapeType == "HSS") {
                                                if (!drawH(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.tFlange, sType.wFlange, sType.depth, sType.tWeb, modelElements[i].betaAngle, scale, (xmax - xmin) / 2.0, (ymax - ymin) / 2.0, (zmax - zmin) / 2.0, c.width(), c.height()))
                                                    drawH(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.tFlange, sType.wFlange, sType.depth, sType.tWeb, modelElements[i].betaAngle, scale, (xmax - xmin) / 2.0, (ymax - ymin) / 2.0, (zmax - zmin) / 2.0, c.width(), c.height());
                                                resSize1 = sType.depth;
                                                resSize2 = sType.depth;
                                            }
                                            else {
                                                if ((sType.shapeType == "PIP") || (sType.shapeType == "HSR")) {
                                                    /*  valves * /
                                                    if (i == 2) { // bd part 1
                                                     var nSeg = 9;
                                                     for (var ii = 0; ii < nSeg; ii++) {
                                                       var radius = coords[i].y2 - coords[i].y1;
                                                       var ang = (Math.PI / 4.0) / nSeg;
                                                       if (!drawPipe(i, coords[i].x1 + radius * (1 - Math.cos(ii * ang)), coords[i].y1 + radius * Math.sin(ii * ang), coords[i].z1, coords[i].x1 + radius * (1 - Math.cos((ii + 1) * ang)), coords[i].y1 + radius * Math.sin((ii + 1) * ang), coords[i].z2, sType.oD, sType.tnom, sType.oD, sType.tnom))
                                                           drawPipe(i, coords[i].x1 + radius * (1 - Math.cos(ii * ang)), coords[i].y1 + radius * Math.sin(ii * ang), coords[i].z1, coords[i].x1 + radius * (1 - Math.cos((ii + 1) * ang)), coords[i].y1 + radius * Math.sin((ii + 1) * ang), coords[i].z2, sType.oD, sType.tnom, sType.oD, sType.tnom);
                                                       }
                                                     }
                                                   else {
                                                     if (i == 3) { // bd part 2
                                                       var nSeg = 9;
                                                       for (var ii = 0; ii < nSeg; ii++) {
                                                         var radius = coords[i].x2 - coords[i].x1;
                                                         var ang1 = (Math.PI / 4.0) / nSeg;
                                                         if (!drawPipe(i, coords[i].x2 - radius * Math.cos((nSeg + ii) * ang), coords[i].y2 - radius * (1 - Math.sin((nSeg + ii) * ang)), coords[i].z1, coords[i].x2 - radius * Math.cos((nSeg + ii + 1) * ang), coords[i].y2 - radius * (1 - Math.sin((nSeg + ii + 1) * ang)), coords[i].z2, sType.oD, sType.tnom, sType.oD, sType.tnom))
                                                             drawPipe(i, coords[i].x2 - radius * Math.cos((nSeg + ii) * ang), coords[i].y2 - radius * (1 - Math.sin((nSeg + ii) * ang)), coords[i].z1, coords[i].x2 - radius * Math.cos((nSeg + ii + 1) * ang), coords[i].y2 - radius * (1 - Math.sin((nSeg + ii + 1) * ang)), coords[i].z2, sType.oD, sType.tnom, sType.oD, sType.tnom);
                                                         }
                                                     }
                                                     else {
                                                       if (i == 6) { // vv
                                                         if (!drawPipe(i, coords[i].x1, coords[i].y1, coords[i].z1, (coords[i].x1 + coords[i].x2) / 2.0, (coords[i].y1 + coords[i].y2) / 2.0, (coords[i].z1 + coords[i].z2) / 2.0, 2.0 * sType.oD, sType.tnom, 2.0 * sType.tnom, sType.tnom))
                                                           drawPipe(i, coords[i].x1, coords[i].y1, coords[i].z1, (coords[i].x1 + coords[i].x2) / 2.0, (coords[i].y1 + coords[i].y2) / 2.0, (coords[i].z1 + coords[i].z2) / 2.0, 2.0 * sType.oD, sType.tnom, 2.0 * sType.tnom, sType.tnom);
                                                         if (!drawPipe(i, (coords[i].x1 + coords[i].x2) / 2.0, (coords[i].y1 + coords[i].y2) / 2.0, (coords[i].z1 + coords[i].z2) / 2.0, coords[i].x2, coords[i].y2, coords[i].z2, 2.0 * sType.tnom, sType.tnom, 2.0 * sType.oD, sType.tnom))
                                                           drawPipe(i, (coords[i].x1 + coords[i].x2) / 2.0, (coords[i].y1 + coords[i].y2) / 2.0, (coords[i].z1 + coords[i].z2) / 2.0, coords[i].x2, coords[i].y2, coords[i].z2, 2.0 * sType.tnom, sType.tnom, 2.0 * sType.oD, sType.tnom);
                                                       }
                                                       else {
                                                         if (i == 8) { // rr
                                                           if (!drawPipe(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.oD, sType.tnom, 4.5, 0.232))
                                                           drawPipe(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.oD, sType.tnom, 4.5, 0.232);
                                                         }
                                                         else {
                                  / * valves     */
                                                    if (modelElements[i].memberType != 'PipeCustom') {
                                                        if (!drawPipe(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.oD, sType.tnom, sType.oD, sType.tnom)) 
                                                            drawPipe(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, sType.oD, sType.tnom, sType.oD, sType.tnom);
                                                        resSize1 = sType.oD;
                                                        resSize2 = sType.oD;
                                                    }
                                                    else {
                                                        if (!drawPipe(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, modelElements[i].pipOD, modelElements[i].pipTh, modelElements[i].pipOD, modelElements[i].pipTh)) 
                                                            drawPipe(i, coords[i].x1, coords[i].y1, coords[i].z1, coords[i].x2, coords[i].y2, coords[i].z2, modelElements[i].pipOD, modelElements[i].pipTh, modelElements[i].pipOD, modelElements[i].pipTh);
                                                        resSize1 = modelElements[i].pipOD;
                                                        resSize2 = modelElements[i].pipOD;
                                                    }
                              
                                                    /* valves * /                                         }
                                       }
                                       }
                                       }
                          / * valves                         */
                                                    //                                      }
                                                }
                                                else {
                                                    // draw something else
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                }

                // Draw restraint, if any
                //                    if ( !bigJob  )
                drawRestraint(i, resSize1, resSize2);

                if ((deformed || isAnimated)) {
                    // readjust the coordinates by the scaled displacements

                    coords[i].x1 -= xf;
                    coords[i].y1 -= yf;
                    coords[i].z1 -= zf;
                    coords[i].x2 -= xt;
                    coords[i].y2 -= yt;
                    coords[i].z2 -= zt;
                }
            }
        }
    }
    // }

    if( bigJob )
        return;

    /* labelCanvas = document.getElementById("labelCanvas");
    labelContext = labelCanvas.getContext("2d");  */

    if (isAnimated && !nodesOnly) {
        // labelContext.clearRect(0, 0, cWidth, cHeight);
    }
    else {
        //  if (!nodesOn) {
        ////    labelContext.clearRect(0, 0, cWidth, cHeight);
        //  }
        //  else {
        //    if (nodesOn && !deformed) {
        ////      labelContext.clearRect(0, 0, cWidth, cHeight);
      
        //      if (!isTextured) {
        ///*        labelContext.fillStyle = "black";
        //        labelContext.font = "normal normal normal 16px Helvetica";    */
        
        for (var i = 1; i <= totEls; i++) {
            if (!modelElements[i].hidden) {
                for (var i = 1; i <= totEls; i++) {
                    if (!modelElements[i].hidden) {
                        addSprite(modelElements[i].fromNode, [coords[i].x1, coords[i].y1, coords[i].z1], false, 50/Math.pow(camera.zoom, 1/2)); //adjust for zoom
                        addSprite(modelElements[i].toNode, [coords[i].x2, coords[i].y2, coords[i].z2], false, 50/Math.pow(camera.zoom, 1/2)); //adjust for zoom
                        //plotNodeNumber(i, viewProjectionMatrix, 1.0, -1.0, 0.0, 0.0, modelElements[i].fromNode, coords[i].x1 + xCenter - xmax, coords[i].y1 + yCenter - ymax, coords[i].z1 + zCenter - zmax, cWidth, cHeight);
                        //plotNodeNumber(i, viewProjectionMatrix, 1.0, -1.0, 0.0, 0.0, modelElements[i].toNode, coords[i].x2 + xCenter - xmax, coords[i].y2 + yCenter - ymax, coords[i].z2 + zCenter - zmax, cWidth, cHeight);
                    }
                    else{
                        removeSprite(i)
                    }
                    //}
                    //}
                    //}
        
                    /*        if (drawCirc) {
                              var viewProjectionMatrix = mat4.create();
                              mat4.multiply(pwgl.projectionMatrix, pwgl.modelViewMatrix, viewProjectionMatrix);
                                  
                              var pt3D = vec3.create([xCirc + xCenter - xmax, yCirc + yCenter - ymax, zCirc + zCenter - zmax]);
                              var pt3Dx = vec3.create();
                                  
                              mat4.multiplyVec3(viewProjectionMatrix, pt3D, pt3Dx);
                                  
                              var x1 = Math.round(((pt3Dx[0] + 1) / 2.0) * cWidth);
                              var y1 = Math.round(((1.0 - pt3Dx[1]) / 2.0) * cHeight);
                    
                              labelContext.beginPath();
                              labelContext.arc(x1, y1, 20, 0, 2 * Math.PI, false);
                              labelContext.stroke();
                            }   */
                }
            }
        }
    
        /*  if( currElmt > totEls ) {
            var n1 = $('#fromNode').val();
            var n2 = $('#toNode').val();
            if (!isNaN(n1) && !isNaN(n2)) {
              var dxx = parseFloat($('#dX').val());
              if( isNaN(dxx) )
                dxx = 0.0;
              else
                dxx/=uConstLength;
              var dyy = parseFloat($('#dY').val());
              if( isNaN(dyy) )
                dyy = 0.0;
              else
                dyy/=uConstLength;
              var dzz = parseFloat($('#dZ').val());
              if( isNaN(dzz) )
                dzz = 0.0;
              else
                dzz/=uConstLength;
        
              var xx1 = 0.0;
              var xx2 = dxx;
              var yy1 = 0.0;
              var yy2 = dyy;
              var zz1 = 0.0;
              var zz2 = dzz;
        
              if (dxx != 0.0 || dyy != 0.0 || dzz != 0.0) {
        
                // fix nodes that have been defined
        
                var iNodes = oNodeTable.fnSettings().fnRecordsTotal();
        
                for (var j = 0; j < iNodes; j++) {
                  var aData = oNodeTable.fnGetData(j);
                  node = parseInt(aData[0]);
                  x = parseFloat(aData[1])/uConstLength;
                  y = parseFloat(aData[2])/uConstLength;
                  z = parseFloat(aData[3])/uConstLength;
        
                  if (n1 == node) {
                    xx1 = x;
                    xx2 = x + dxx;
                    yy1 = y;
                    yy2 = yy1 + dyy;
                    zz1 = z;
                    zz2 = zz1 + dzz;
                    break;
                  }
                  else
                    if (n2 == node) {
                      xx1 = x;
                      xx2 = x - dxx;
                      yy1 = y;
                      yy2 = yy1 - dyy;
                      zz1 = z;
                      zz2 = zz1 - dzz;
                      break;
                    }
                }
        
                if (n1 != node && n2 != node) {
                  for (var i = 1; i <= totEls; i++)
                    if (n1 == modelElements[i].fromNode) {
                      xx1 = coords[i].x1;
                      xx2 = xx1 + dxx;
                      yy1 = coords[i].y1;
                      yy2 = yy1 + dyy;
                      zz1 = coords[i].z1;
                      zz2 = zz1 + dzz;
                      break;
                    }
                    else
                      if (n1 == modelElements[i].toNode) {
                        xx1 = coords[i].x2;
                        xx2 = xx1 + dxx;
                        yy1 = coords[i].y2;
                        yy2 = yy1 + dyy;
                        zz1 = coords[i].z2;
                        zz2 = zz1 + dzz;
                        break;
                      }
                      else
                        if (n2 == modelElements[i].fromNode) {
                          xx1 = coords[i].x1;
                          xx2 = xx1 - dxx;
                          yy1 = coords[i].y1;
                          yy2 = yy1 - dyy;
                          zz1 = coords[i].z1;
                          zz2 = zz1 - dzz;
                          break;
                        }
                        else
                          if (n2 == modelElements[i].toNode) {
                            xx1 = coords[i].x2;
                            xx2 = xx1 - dxx;
                            yy1 = coords[i].y2;
                            yy2 = yy1 - dyy;
                            zz1 = coords[i].z2;
                            zz2 = zz1 - dzz;
                            break;
                          }
                  }
                  if( xx1 != xx2 || yy1 != yy2 || zz1 != zz2 )
                    plotSkeleton(xx1+xCenter-xmax,yy1+yCenter-ymax,zz1+zCenter-zmax,
                                 xx2+xCenter-xmax,yy2+yCenter-ymax,zz2+zCenter-zmax,cWidth,cHeight);
                }
              }
            }   */

    }

    // put the grid

    if (gridMode) {
      

        for (var i = 0; i < fNodes.length; i++) {            
            addSprite(fNodes[i].node, [fNodes[i].x/uConstLength,fNodes[i].y/uConstLength,fNodes[i].z/uConstLength], true, 50/Math.pow(camera.zoom, 1/2)); //adjust for zoom size
        }
        refreshNodes();
    }
    changeBeamColor(currElmt,highlight_color)
    
    refreshSprites();
    refreshElements();
    refreshNodes();    
    if (loadJob) {
        setVariableView();
    }
    //setInterval(function() {animate();}, 6000);
    
} // end draw


function getCoords1(frNode,toNode,dxx,dyy,dzz) {

    var fromCoord = {};
    var toCoord = {};
    var foundFrom = false;
    var foundTo = false;

    for (var i = 0; i < fNodes.length; i++) {
        if( !foundFrom ){
            if (frNode == fNodes[i].node) {
                foundFrom = true;
                fromCoord = {
                    x: fNodes[i].x / uConstLength,
                    y: fNodes[i].y / uConstLength,
                    z: fNodes[i].z / uConstLength
                };
            }
        }
        if( !foundTo ){
            if (toNode == fNodes[i].node) {
                foundTo = true;
                toCoord = {
                    x: fNodes[i].x / uConstLength,
                    y: fNodes[i].y / uConstLength,
                    z: fNodes[i].z / uConstLength
                };
            }
        }
        if( foundFrom && foundTo )
            break;
    }

    if( !foundFrom || !foundTo ) {
        for (var i = 1; i < totEls; i++) {
            if (i != currElmt) {
                if (!foundFrom) {
                    if (modelElements[i].fromNode == frNode) {
                        foundFrom = true;
                        fromCoord = {
                            x: coords[i].x1,
                            y: coords[i].y1,
                            z: coords[i].z1
                        };
                    }
                    else
                        if (modelElements[i].toNode == frNode) {
                            foundFrom = true;
                            fromCoord = {
                                x: coords[i].x2,
                                y: coords[i].y2,
                                z: coords[i].z2
                            };
                        }
                }
                if (!foundTo) {
                    if (modelElements[i].fromNode == toNode) {
                        foundTo = true;
                        toCoord = {
                            x: coords[i].x1,
                            y: coords[i].y1,
                            z: coords[i].z1
                        };
                    }
                    else
                        if (modelElements[i].toNode == toNode) {
                            foundTo = true;
                            toCoord = {
                                x: coords[i].x2,
                                y: coords[i].y2,
                                z: coords[i].z2
                            };
                        }
                }
                if (foundFrom && foundTo)
                    break;
            }
        }
    }

    if (foundFrom && foundTo) {
        coords[totEls] = {
            x1: fromCoord.x,
            y1: fromCoord.y,
            z1: fromCoord.z,
            x2: toCoord.x,
            y2: toCoord.y,
            z2: toCoord.z
        }

        return [(toCoord.x - fromCoord.x) * uConstLength, (toCoord.y - fromCoord.y) * uConstLength,
                (toCoord.z - fromCoord.z) * uConstLength];
    }
    else {
        if (foundFrom) {
            coords[totEls] = {
                x1: fromCoord.x,
                y1: fromCoord.y,
                z1: fromCoord.z,
                x2: fromCoord.x + dxx / uConstLength,
                y2: fromCoord.y + dyy / uConstLength,
                z2: fromCoord.z + dzz / uConstLength
            }
        }
        else {
            if (foundTo) {
                coords[totEls] = {
                    x2: toCoord.x,
                    y2: toCoord.y,
                    z2: toCoord.z,
                    x1: toCoord.x - dxx / uConstLength,
                    y1: toCoord.y - dyy / uConstLength,
                    z1: toCoord.z - dzz / uConstLength
                }
            }
            else {
                coords[totEls] = {
                    x1: 0.0,
                    y1: 0.0,
                    z1: 0.0,
                    x2: dxx / uConstLength,
                    y2: dyy / uConstLength,
                    z2: dzz / uConstLength
                }
            }
        }

        return [dxx, dyy, dzz];
    }
}

function getCoords() {

    var fromCoord = {};
    var toCoord = {};
    var foundFrom = false;
    var foundTo = false;

    var frNode = parseInt($('#fromNode').val());
    var toNode = parseInt($('#toNode').val());
    if( isNaN(frNode) || isNaN(toNode) ) {
        $('#dX').removeAttr("disabled");
        $('#dY').removeAttr("disabled");
        $('#dZ').removeAttr("disabled");
        return;
    }

    for (var i = 0; i < fNodes.length; i++) {
        if( !foundFrom ){
            if (frNode == fNodes[i].node) {
                foundFrom = true;
                fromCoord = {
                    x: fNodes[i].x / uConstLength,
                    y: fNodes[i].y / uConstLength,
                    z: fNodes[i].z / uConstLength
                };
            }
        }
        if( !foundTo ){
            if (toNode == fNodes[i].node) {
                foundTo = true;
                toCoord = {
                    x: fNodes[i].x / uConstLength,
                    y: fNodes[i].y / uConstLength,
                    z: fNodes[i].z / uConstLength
                };
            }
        }
        if( foundFrom && foundTo )
            break;
    }

    if( !foundFrom || !foundTo ) {
        for (var i = 1; i <= totEls; i++) {
            if (i != currElmt) {
                if (!foundFrom) {
                    if (modelElements[i].fromNode == frNode) {
                        foundFrom = true;
                        fromCoord = {
                            x: coords[i].x1,
                            y: coords[i].y1,
                            z: coords[i].z1
                        };
                    }
                    else
                        if (modelElements[i].toNode == frNode) {
                            foundFrom = true;
                            fromCoord = {
                                x: coords[i].x2,
                                y: coords[i].y2,
                                z: coords[i].z2
                            };
                        }
                }
                if (!foundTo) {
                    if (modelElements[i].fromNode == toNode) {
                        foundTo = true;
                        toCoord = {
                            x: coords[i].x1,
                            y: coords[i].y1,
                            z: coords[i].z1
                        };
                    }
                    else
                        if (modelElements[i].toNode == toNode) {
                            foundTo = true;
                            toCoord = {
                                x: coords[i].x2,
                                y: coords[i].y2,
                                z: coords[i].z2
                            };
                        }
                }
                if (foundFrom && foundTo)
                    break;
            }
        }
    }

    if( foundFrom && foundTo ) {
        if( toCoord.x-fromCoord.x == 0.0 )
            $('#dX').val("");
        else
            $('#dX').val(" "+(toCoord.x-fromCoord.x)*uConstLength);
        if (newMember)
            $('#dX').attr("disabled", "disabled");

        if( toCoord.y-fromCoord.y == 0.0 )
            $('#dY').val("");
        else
            $('#dY').val(" "+(toCoord.y-fromCoord.y)*uConstLength);
        if (newMember)
            $('#dY').attr("disabled", "disabled");

        if( toCoord.z-fromCoord.z == 0.0 )
            $('#dZ').val("");
        else
            $('#dZ').val(" "+(toCoord.z-fromCoord.z)*uConstLength);
        if (newMember)
            $('#dZ').attr("disabled", "disabled");

        drawModel(true,true);    // not sure about this yet

    }
    else  if (jobName != "Unnamed Job") {
        $('#dX').removeAttr("disabled");
        $('#dY').removeAttr("disabled");
        $('#dZ').removeAttr("disabled");
    }
}

// function that requests job name returns a promise:

function getUserJob(userName) {
    return $.ajax({
        url: './php/getUsersJob.php',
        type: 'POST',
        data: {
            "userName": userName
        }
    });
}

function displayPassedJobName(jobName, owner) {
    jobName = jQuery.trim(jobName);
    userName1 = jQuery.trim(owner);
      
    editRights = false;
    setJobName(jobName);

}

// function that expects a promise as an argument:
function displayJobName(job) {
    job.success(function(data) {
        userObj = JSON.parse(data);
        jobName = jQuery.trim(userObj.JobName);
        if( !userObj.UserName1 )
            userName1 = userName;
        else 
            userName1 = jQuery.trim(userObj.UserName1);
      
        if( userName1 != userName )
            editRights = false;
        else
            editRights = true;
      
        setJobName(jobName);

        defScale = userObj.DefScale;
        displayLanguage = userObj.DisplayLanguage;
        if( displayLanguage == 'Chinese' )
            convertToChinese();
        else
            if( displayLanguage == 'Spanish' ) {
                convertToSpanish();
            }

        defaultUnits = userObj.DefaultUnits;
        colMatch = int2Bool(userObj.ColMatch);
        autoBreak = int2Bool(userObj.AutoBreak);
        colType = jQuery.trim(userObj.ColMem);
        colSplit = userObj.ColElem;
        colEnd = userObj.ColEnd;
        beamMatch = int2Bool(userObj.BeamMatch);
        beamType = jQuery.trim(userObj.BeamMem);
        beamSplit = userObj.BeamElem;
        beamEnd = userObj.BeamEnd;
        braceMatch = int2Bool(userObj.BraceMatch);
        braceType = jQuery.trim(userObj.BraceMem);
        braceSplit = userObj.BraceElem;
        braceEnd = userObj.BraceEnd;
        englishMem = int2Bool(userObj.EnglishMem);
        metricMem = int2Bool(userObj.MetricMem);
        englishMem1 = englishMem;
        metricMem1 = metricMem;
        pressStiff = userObj.PressStiff;
        if (!pressStiff)
            pressStiff = 0;
        pressStiff = int2Bool(pressStiff);
        nodInc = parseInt(userObj.NodIncr);
        if( !nodInc )
            nodInc = 10;

        if (jobName == "Unnamed Job") {
            $('#newbyMessage').show();
            $('#modalQuickStart').modal('show');
        }
        return jobName;

    });
}

function getSpecificJob(jName) {

    return $.ajax({
        url: './php/goGetJob.php',
        type: 'POST',
        data: {
            "userName": userName1,
            "jobName": jName
        }
    });
}

function getSpecificJobLoadCases(jName) {

    return $.ajax({
        url: './php/goGetLoadCases.php',
        type: 'POST',
        data: {
            "userName": userName1,
            "jobName": jName
        }
    });
}

function getSpecificJobShares(jName) {

    return $.ajax({
        url: './php/goGetShares.php',
        type: 'POST',
        data: {
            "userName": userName1,
            "jobName": jName
        }
    });
}

function returnAvailableJobs() {
    return $.ajax({
        url: './php/getAllJobs.php',
        type: 'POST',
        data: {
            "userName": userName
        }
    });
}

// function that expects a promise as an argument:
function selectJob2Open(jobs) {

    jobs.success(function(data) {

        $('#showShared').prop('checked', showShared);

        var jobs = csvToArray( data, ',' );
    
        for( var i = 0; i < jobs.length-1; i++) {
            if( !showShared && jobs[i][1] != '---' ) 
                jobs[i][0] = '';
            if( jobs[i][0] != '' ) {  
                for (var j = i + 1; j < jobs.length; j++) {
                    if (jobs[i][0] == jobs[j][0] && jobs[i][1] == jobs[j][1]) { // has access via more than one grant
                        if (jobs[i][2] == 'Edit') 
                            jobs[j][0] = ''; // don't need both, keep the one with greater rights
                        else {
                            jobs[i][0] = '';
                            break;
                        }
                    }
                }
            }
        }
        oOpTable.fnClearTable();
        oOpTable.fnSort([]);
        for (var i = 0; i < jobs.length; i++) {
            if( jobs[i][0].trim() != '' ) {
                if( jobs[i][1] == '---' )
                    oOpTable.fnAddData([jobs[i][0], jobs[i][1], jobs[i][2], '---', '<a class="delete" href="">Delete</a>', '<a class="open" href="">Open</a>']);
                else
                    oOpTable.fnAddData([jobs[i][0], jobs[i][1], jobs[i][2], '<a class="copy" href="">Copy</a>', '---', '<a class="open" href="">Open</a>']);
            }
        }
                      
        $('#selectJob').modal('show');
    });
}

// function that expects a promise as an argument:
function buildJobArrays(jobData) {
    jobData.success(function(data) {

        var littleQ;
        var boot;
    
        if( temporary ) {
            bootbox.alert("<h3>Welcome to CloudCalc!</h3><h4>You are currently using CloudCalc as a guest.  You may view this model or Analyze it, but editing commands are disabled.<br><br>If you would like to do anything else -- make changes, create your own models, etc. -- you will first have to Log In or Register (use Log In button at upper right).  CloudCalc costs nothing to register or use!<br><br>Welcome aboard!</h4>");
        }
        else {
            if( userName != userName1 ) { 
                bootbox.alert("<h3>Note:</h3><h4>You are accessing this model in View-Only mode.  You may view it or Analyze it , but all editing commands are disabled, unless you save a copy under your own User Name <strong>(use File->SaveAs)</strong></h4>.",
                  function() {  clearTimeout(littleQ);});
                littleQ = setTimeout(function(){
                    bootbox.hideAll();
                }, 8000); // 10 seconds expressed in milliseconds
            }
        }
      
        currElmt = 1;
        selectionSet = [currElmt];
        nodSelectionSet = [];

        if( data == "Array") {      // sometimes sent back if there are no elements

            totEls = 0;
            elemMenu();    // reset context menu to reflect elements
            currentLoadCase = 0;
            totalLoadCases = 0;
            showScreen("inputScreen");
            initUndo(0);
            //                  setUndo(1,0  /* ,0  */ );

            displayElement(currElmt);
            deformed = false;
            cColor = false;
            drawModel(false,true);
            return;
        }

        var objs = $.parseJSON(data);
        totEls = objs.length;
        elemMenu();    // reset context menu to reflect elements

        $.each( objs, function( index ) {
            modelElements[index+1] = { jobName:jobName,
                order: parseInt(objs[index].iOrder),
                keyID: parseInt(objs[index].KeyID),
                fromNode: parseInt(objs[index].FromNode),
                toNode: parseInt(objs[index].ToNode),
                dX: parseFloat(objs[index].dX),
                dY: parseFloat(objs[index].dY),
                dZ: parseFloat(objs[index].dZ),
                memberType: objs[index].MemberID,
                pipOD:  parseFloat(objs[index].PipOD),
                pipTh:  parseFloat(objs[index].PipTh),
                betaAngle: parseFloat(objs[index].Beta),
                material: objs[index].MaterialID,
                fromFXRest: Boolean(parseInt(objs[index].FromFXRest)),
                fromFYRest: Boolean(parseInt(objs[index].FromFYRest)),
                fromFZRest: Boolean(parseInt(objs[index].FromFZRest)),
                fromMXRest: Boolean(parseInt(objs[index].FromMXRest)),
                fromMYRest: Boolean(parseInt(objs[index].FromMYRest)),
                fromMZRest: Boolean(parseInt(objs[index].FromMZRest)),
                toFXRest: Boolean(parseInt(objs[index].ToFXRest)),
                toFYRest: Boolean(parseInt(objs[index].ToFYRest)),
                toFZRest: Boolean(parseInt(objs[index].ToFZRest)),
                toMXRest: Boolean(parseInt(objs[index].ToMXRest)),
                toMYRest: Boolean(parseInt(objs[index].ToMYRest)),
                toMZRest: Boolean(parseInt(objs[index].ToMZRest)),
                fromFXMemb: Boolean(parseInt(objs[index].FromFXMemb)),
                fromFYMemb: Boolean(parseInt(objs[index].FromFYMemb)),
                fromFZMemb: Boolean(parseInt(objs[index].FromFZMemb)),
                fromMXMemb: Boolean(parseInt(objs[index].FromMXMemb)),
                fromMYMemb: Boolean(parseInt(objs[index].FromMYMemb)),
                fromMZMemb: Boolean(parseInt(objs[index].FromMZMemb)),
                toFXMemb: Boolean(parseInt(objs[index].ToFXMemb)),
                toFYMemb: Boolean(parseInt(objs[index].ToFYMemb)),
                toFZMemb: Boolean(parseInt(objs[index].ToFZMemb)),
                toMXMemb: Boolean(parseInt(objs[index].ToMXMemb)),
                toMYMemb: Boolean(parseInt(objs[index].ToMYMemb)),
                toMZMemb: Boolean(parseInt(objs[index].ToMZMemb)),
                uX: parseFloat(objs[index].UX),
                uY: parseFloat(objs[index].UY),
                uZ: parseFloat(objs[index].UZ),
                fromFXLoad: parseFloat(objs[index].FromFXLoad),
                fromFYLoad: parseFloat(objs[index].FromFYLoad),
                fromFZLoad: parseFloat(objs[index].FromFZLoad),
                fromMXLoad: parseFloat(objs[index].FromMXLoad),
                fromMYLoad: parseFloat(objs[index].FromMYLoad),
                fromMZLoad: parseFloat(objs[index].FromMZLoad),
                toFXLoad: parseFloat(objs[index].ToFXLoad),
                toFYLoad: parseFloat(objs[index].ToFYLoad),
                toFZLoad: parseFloat(objs[index].ToFZLoad),
                toMXLoad: parseFloat(objs[index].ToMXLoad),
                toMYLoad: parseFloat(objs[index].ToMYLoad),
                toMZLoad: parseFloat(objs[index].ToMZLoad),

                uXL: parseFloat(objs[index].UXL),
                uYL: parseFloat(objs[index].UYL),
                uZL: parseFloat(objs[index].UZL),
                fromFXLoadL: parseFloat(objs[index].FromFXLoadL),
                fromFYLoadL: parseFloat(objs[index].FromFYLoadL),
                fromFZLoadL: parseFloat(objs[index].FromFZLoadL),
                fromMXLoadL: parseFloat(objs[index].FromMXLoadL),
                fromMYLoadL: parseFloat(objs[index].FromMYLoadL),
                fromMZLoadL: parseFloat(objs[index].FromMZLoadL),
                toFXLoadL: parseFloat(objs[index].ToFXLoadL),
                toFYLoadL: parseFloat(objs[index].ToFYLoadL),
                toFZLoadL: parseFloat(objs[index].ToFZLoadL),
                toMXLoadL: parseFloat(objs[index].ToMXLoadL),
                toMYLoadL: parseFloat(objs[index].ToMYLoadL),
                toMZLoadL: parseFloat(objs[index].ToMZLoadL),

                uXO: parseFloat(objs[index].UXO),
                uYO: parseFloat(objs[index].UYO),
                uZO: parseFloat(objs[index].UZO),
                fromFXLoadO: parseFloat(objs[index].FromFXLoadO),
                fromFYLoadO: parseFloat(objs[index].FromFYLoadO),
                fromFZLoadO: parseFloat(objs[index].FromFZLoadO),
                fromMXLoadO: parseFloat(objs[index].FromMXLoadO),
                fromMYLoadO: parseFloat(objs[index].FromMYLoadO),
                fromMZLoadO: parseFloat(objs[index].FromMZLoadO),
                toFXLoadO: parseFloat(objs[index].ToFXLoadO),
                toFYLoadO: parseFloat(objs[index].ToFYLoadO),
                toFZLoadO: parseFloat(objs[index].ToFZLoadO),
                toMXLoadO: parseFloat(objs[index].ToMXLoadO),
                toMYLoadO: parseFloat(objs[index].ToMYLoadO),
                toMZLoadO: parseFloat(objs[index].ToMZLoadO),

                lX: parseFloat(objs[index].LX),
                lY: parseFloat(objs[index].LY),
                lZ: parseFloat(objs[index].LZ),

                kX: parseFloat(objs[index].KX),
                kY: parseFloat(objs[index].KY),
                kZ: parseFloat(objs[index].KZ),

                cBZ: parseFloat(objs[index].CBZ),
                cBY: parseFloat(objs[index].CBY),

                stable: Boolean(parseInt(objs[index].Stable)),

                stiffDist: parseFloat(objs[index].StiffDist),
                stiffI: parseFloat(objs[index].StiffI),

                tfaStiff: Boolean(parseInt(objs[index].TFAStiff)),

                pressure: parseFloat(objs[index].Pressure),
                fluid: parseFloat(objs[index].Fluid),

                group: "", 

                hidden: false,      // or send back from SQL?

                totEls: totEls };

            if( !modelElements[index+1].pressure )    // null,NaN, undefined, 0
                modelElements[index+1].pressure = 0.0;
                                       
            if( !modelElements[index+1].fluid )    // null,NaN, undefined, 0
                modelElements[index+1].fluid = 0.0;
                                   
            if( !modelElements[index+1].pipOD )    // null,NaN, undefined, 0
                modelElements[index+1].pipOD = 0.0;

            if( !modelElements[index+1].pipTh )    // null,NaN, undefined, 0
                modelElements[index+1].pipTh = 0.0;

            if (objs[index].GroupName && (objs[index].GroupName != "[]" )) {
                modelElements[index + 1].group = objs[index].GroupName;
                                     
                var ob = JSON.parse(objs[index].GroupName);
                for (var i=0; i<ob.length; i++) {
                    if( ob[i].name ) {
                        if (groupList.indexOf(ob[i].name) < 0) {
                            groupList.push(ob[i].name)
                        }
                    }
                }
            }
        });

  
        currentLoadCase = 0;
        totalLoadCases = 0;

        resetGroupLists(groupList)

        showScreen("inputScreen");
        initUndo(0);
        //                setUndo(1,0  /* ,0  */ );

        displayElement(currElmt);
        deformed = false;
        cColor = false;
        loadJob = true;
        drawModel(false,true);
        last_id = null;
        loadJob = false;
    }); // success
};  //buildjobarrays

// function that expects a promise as an argument:
function buildJobLoadCases(jobLoadCases) {
    jobLoadCases.success(function(data) {

        oLCTable.fnClearTable();
        oLCTable.fnSort([]);
        lCases.length = 0;

        var loadCaseData = csvToArray( data, ',' );


        for (var i = 0; i < loadCaseData.length - 1; i++) {
            oLCTable.fnAddData([loadCaseData[i][0], loadCaseData[i][1], loadCaseData[i][2], loadCaseData[i][3], loadCaseData[i][4], loadCaseData[i][5], loadCaseData[i][6], loadCaseData[i][7], loadCaseData[i][8], loadCaseData[i][9], '<a class="edit" href="">Edit</a>',
                               '<a class="delete" href="">Delete</a>']);
            lCases.push({"mult1":loadCaseData[i][1],"mult2":loadCaseData[i][2],"mult3":loadCaseData[i][3],"mult4":loadCaseData[i][4],"code":loadCaseData[i][5],
                "pDelta":loadCaseData[i][6],"redStiff":loadCaseData[i][7],"divBy":loadCaseData[i][8],"warpYN":loadCaseData[i][9]})
        }
    }); // success
};  //buildjobLoadCases

// function that expects a promise as an argument:
function buildShareArrays(jobShares) {
    jobShares.success(function(data) {

        oShTable.fnClearTable();
        oShTable.fnSort([]);
        lShares = [];

        var sharesData = csvToArray( data, ',' );
        var sh = sharesData[0][0];
        if( sh.trim() == "No Shares" )
            return;

        var iPub = -1;
        for (var i = 0; i < sharesData.length - 1; i++) {
            if( sharesData[i][1] == 'View' )
                sharesData[i][1] = 'Can View';
            lShares.push({
                "user": sharesData[i][0],
                "permission": sharesData[i][1]
            })
            if (lShares.user == "Public") 
                iPub = i;
        }
    
        if( iPub > 0 ) {
            var temp = lShares[iPub];
            for (var j = iPub; j--; j>0 )
                lShares[j] = lShares[j-1];
            lShares[0] = temp;
        }

        for (var i = 0; i < sharesData.length - 1; i++)
            oShTable.fnAddData([sharesData[i][0], sharesData[i][1], '<a class="edit" href="">Edit</a>',
                               '<a class="delete" href="">Delete</a>']);
    }); // success
};  //buildjobLoadCases


function goGetPassedJob(job,owner) {
    jobName = job;
    userName1 = owner;
  
    var jn = jQuery.trim(jobName);
    resetJobData(jn);
    if(jn != "Unnamed Job") {
        var jobUnits = getSpecificJobUnits(jn);
        buildJobUnits(jobUnits);
        getNotes();
        var jobNodeCoords = getSpecificJobNodeCoords(jn);
        buildJobNodeCoords(jobNodeCoords);
        var jobLoadCases = getSpecificJobLoadCases(jn);
        buildJobLoadCases(jobLoadCases);
        var jobData = getSpecificJob(jn);
        buildJobArrays(jobData);
        var shareData = getSpecificJobShares(jn);
        buildShareArrays(shareData);
    }
}

function goGetJob(job) {
    job.success(function(data) {
        var jn = jQuery.trim(userObj.JobName);
        resetJobData(jn);
        if(jn != "Unnamed Job") {
            var jobUnits = getSpecificJobUnits(jn);
            buildJobUnits(jobUnits);
            getNotes();
            var jobNodeCoords = getSpecificJobNodeCoords(jn);
            buildJobNodeCoords(jobNodeCoords);
            var jobLoadCases = getSpecificJobLoadCases(jn);
            buildJobLoadCases(jobLoadCases);
            var jobData = getSpecificJob(jn);
            buildJobArrays(jobData);
            var shareData = getSpecificJobShares(jn);
            buildShareArrays(shareData);
        }
    });
}

function isEqual1(a, b ) {
  
    if( !a || !b )
        return false;

    if( a.fromNode != b.fromNode || a.toNode != b.toNode || a.dX != b.dX || a.dY != b.dY || a.dZ != b.dZ ||
        a.memberType != b.memberType || a.pipOD != b.pipOD || a.pipTh != b.pipTh || a.betaAngle != b.betaAngle || a.material != b.material ||
        a.fromFXRest != b.fromFXRest || a.fromFYRest != b.fromFYRest || a.fromFZRest != b.fromFZRest ||
        a.fromMXRest != b.fromMXRest || a.fromMYRest != b.fromMYRest || a.fromMZRest != b.fromMZRest ||
        a.toFXRest != b.toFXRest || a.toFYRest != b.toFYRest || a.toFZRest != b.toFZRest || 
        a.toMXRest != b.toMXRest || a.toMYRest != b.toMYRest || a.toMZRest != b.toMZRest ||
        a.fromFXMemb != b.fromFXMemb || a.fromFYMemb != b.fromFYMemb || a.fromFZMemb != b.fromFZMemb ||
        a.fromMXMemb != b.fromMXMemb || a.fromMYMemb != b.fromMYMemb || a.fromMZMemb != b.fromMZMemb || 
        a.toFXMemb != b.toFXMemb || a.toFYMemb != b.toFYMemb || a.toFZMemb != b.toFZMemb || 
        a.toMXMemb != b.toMXMemb || a.toMYMemb != b.toMYMemb || a.toMZMemb != b.toMZMemb || a.uX != b.uX ||
        a.uY != b.uY || a.uZ != b.uZ || a.fromFXLoad != b.fromFXLoad || a.fromFYLoad != b.fromFYLoad ||
        a.fromFZLoad != b.fromFZLoad || a.fromMXLoad != b.fromMXLoad || a.fromMYLoad != b.fromMYLoad ||
        a.fromMZLoad != b.fromMZLoad || a.toFXLoad != b.toFXLoad || a.toFYLoad != b.toFYLoad ||
        a.toFZLoad != b.toFZLoad || a.toMXLoad != b.toMXLoad || a.toMYLoad != b.toMYLoad || 
        a.toMZLoad != b.toMZLoad || a.uXL != b.uXL || a.uYL != b.uYL || a.uZL != b.uZL || 
        a.fromFXLoadL != b.fromFXLoadL || a.fromFYLoadL != b.fromFYLoadL || a.fromFZLoadL != b.fromFZLoadL ||
        a.fromMXLoadL != b.fromMXLoadL || a.fromMYLoadL != b.fromMYLoadL || a.fromMZLoadL != b.fromMZLoadL ||
        a.toFXLoadL != b.toFXLoadL || a.toFYLoadL != b.toFYLoadL || a.toFZLoadL != b.toFZLoadL || 
        a.toMXLoadL != b.toMXLoadL ||a.toMYLoadL != b.toMYLoadL || a.toMZLoadL != b.toMZLoadL || 
        a.uXO != b.uXO || a.uYO != b.uYO || a.uZO != b.uZO || a.fromFXLoadO != b.fromFXLoadO || 
        a.fromFYLoadO != b.fromFYLoadO || a.fromFZLoadO != b.fromFZLoadO || a.fromMXLoadO != b.fromMXLoadO ||
        a.fromMYLoadO != b.fromMYLoadO || a.fromMZLoadO != b.fromMZLoadO || a.toFXLoadO != b.toFXLoadO || 
        a.toFYLoadO != b.toFYLoadO || a.toFZLoadO != b.toFZLoadO || a.toMXLoadO != b.toMXLoadO || 
        a.toMYLoadO != b.toMYLoadO || a.toMZLoadO != b.toMZLoadO || a.lX != b.lX || a.lY != b.lY ||
        a.lZ != b.lZ || a.kX != b.kX || a.kY != b.kY || a.kZ != b.kZ || a.cBZ != b.cBZ || a.cBY != b.cBY ||
        a.stable != b.stable || a.stiffDist != b.stiffDist || a.stiffI != b.stiffI || 
        a.tfaStiff != b.tfaStiff || a.pressure != b.pressure || a.fluid != b.fluid || a.group != b.group )
        return false;
    
    return true; 
}


function prevEl(send) {

/*    if (send && TogetherJS.running) {
        TogetherJS.send({
            type: 'firstEl'
        });
    }
*/
    if (currElmt > totEls) { // may have been inadvertent PgDn push
        var istr1 = $('#dX').val();
        var istr2 = $('#dY').val();
        var istr3 = $('#dZ').val();

        if ((istr1 == "" || istr1 == 0.0) && (istr2 == "" || istr2 == 0.0) && (istr3 == "" || istr3 == 0.0)) {
            if (currElmt > 1) {
                revertColor();
                currElmt--;

                displayElement(currElmt);
                selectionSet = [currElmt];
                nodSelectionSet = [];
                elemMenu();    // reset context menu to reflect elements
                //if( highLight)
                //    drawModel(false,true);
            }
            return;
        }
    }

    if (editRights) {
  
        if (!isEqual1(modelElements[currElmt], getScreenEntries()) || (currElmt > totEls)) {
            if (validEntry(false)) {
      
                if (memberDefault && newMember) {
                    var iSav = currElmt;
                    nextEl(true);
                    currElmt = iSav;
                }
                else {
                    storeElement(1, 1, 1, 1, 1, 1, 1, 1, 0, -1, true, false);
                    if (deformed) {
                        deformed = false; // draw the original
                        drawModel(false, true);
                        deformed = true; // draw the deformed
                    }
                    drawModel(false, !deformed);
                }
            }
            else {
                return;
            }
        }
        else {
            if (currElmt > totEls) 
                totEls = currElmt;
        }
    }

    if( currElmt > 1 ) {
        revertColor();
        currElmt--;
    }

    displayElement(currElmt);
    selectionSet = [currElmt];
    nodSelectionSet = [];
    elemMenu();    // reset context menu to reflect elements
}

function lastEl(send) {
/*    if (send && TogetherJS.running) {
        TogetherJS.send({
            type: 'lastEl'
        });
    }
*/
    if (editRights) {
        if (!isEqual1(modelElements[currElmt], getScreenEntries()) || (currElmt > totEls)) {
            if (validEntry(false)) {
                if (memberDefault && newMember) {
                    var iSav = currElmt;
                    nextEl(true);
                    currElmt = iSav;
                    
                }
                else {
                    storeElement(1, 1, 1, 1, 1, 1, 1, 1, 0, -1, true, false);
                    if (deformed) {
                        deformed = false; // draw the original
                        drawModel(false, true);
                        deformed = true; // draw the deformed
                    }
                    drawModel(false, !deformed);
                }
            }
            else {
                return false;
            }
        }
        
        else {
            if (currElmt > totEls) 
                totEls = currElmt;
        }
    }
    if (currElmt != totEls) {
        revertColor(); 
        currElmt = totEls;
        displayElement(currElmt);
        selectionSet.length = 0;
        selectionSet[0] = currElmt;
        nodSelectionSet.length = 0;
        elemMenu();    // reset context menu to reflect elements
    }
}

function newEl(send) {

/*    if (send && TogetherJS.running) {
        TogetherJS.send({
            type: 'newEl'
        });
    }
*/
    if (!editRights) 
        return;
    //              if( !heroActive )
    if (!isEqual1(modelElements[currElmt], getScreenEntries()) || (currElmt > totEls)) {
        if (validEntry(false)) {

            var it0 = 1;
            var inc0 = 1;
            var memEnd = -1;

            lastNode = parseInt($("#toNode").val());

            it1 = 1;
            inc1 = nodInc;
            it2 = 1;
            inc2 = nodInc;
            it3 = 1;
            inc3 = nodInc;

            if (memberDefault && newMember) {

                var dx = $('#dX').val();
                if (isNaN(dx))
                    dx = 0.0;
                var dy = $('#dY').val();
                if (isNaN(dy))
                    dy = 0.0;
                var dz = $('#dZ').val();
                if (isNaN(dz))
                    dz = 0.0;

                if (dx == 0.0 && dy == 0.0 && dz == 0.0)
                    return;

                var truLen = Math.sqrt(dx*dx + dy*dy + dz*dz);
                var lX = parseFloat($('#lX').val());
                if( isNaN(lX) )
                    lX = 0.0;
                var lY = parseFloat($('#lY').val());
                if( isNaN(lY) )
                    lY = 0.0;
                var lZ = parseFloat($('#lZ').val());
                if( isNaN(lZ) )
                    lZ = 0.0;

                var isCol = false;
                var isBem = false;
                var isBrc = false;

                var incr;
        
                if (colSplit > 0 && dx == 0.0 && dy != 0.0 && dz == 0.0 && colMatch) {
                    isCol = true;

                    if (colSplit > 1) {
                        incr = parseInt(($("#toNode").val() - $("#fromNode").val()) / colSplit);
                        if( Math.abs(incr) < 1 ) 
                            incr = 1;
                        var tn = getNewNode(parseInt($("#fromNode").val()) + incr);
            
                        if( tn == lastNode )
                            tn = getNewNode(tn + 1);
                        $("#toNode").val(tn);

                        $('#dX').val(dx / colSplit);
                        $('#dY').val(dy / colSplit);
                        $('#dZ').val(dz / colSplit);

                        if( lX == 0.0 )
                            $('#lX').val(truLen);
                        if( lY == 0.0 )
                            $('#lY').val(truLen);
                        if( lZ == 0.0 )
                            $('#lZ').val(truLen);
              
                        it0 = colSplit;
                        inc0 = incr;
                        memEnd = colEnd;
                    }

                    if (colType != "(none)")
                        $('#memberType').val(colType);

                }
                else
                    if (beamSplit > 0 && (dx != 0.0 || dz != 0.0) && dy == 0.0 && beamMatch) {
                        isBem = true;

                        if (beamSplit > 1) {
                            incr = parseInt(($("#toNode").val() - $("#fromNode").val()) / beamSplit);
                            if( Math.abs(incr) < 1 ) 
                                incr = 1;

                            var tn = getNewNode(parseInt($("#fromNode").val()) + incr);
                            if( tn == lastNode )
                                tn = getNewNode(tn + 1);

                            $("#toNode").val(tn);

                            $('#dX').val(dx / beamSplit);
                            $('#dY').val(dy / beamSplit);
                            $('#dZ').val(dz / beamSplit);

                            if( lX == 0.0 )
                                $('#lX').val(truLen);
                            if( lY == 0.0 )
                                $('#lY').val(truLen);
                            if( lZ == 0.0 )
                                $('#lZ').val(truLen);
                            it0 = beamSplit;
                            inc0 = incr;
                            memEnd = beamEnd;
                        }
                        if (beamType != "(none)")
                            $('#memberType').val(beamType);

                    }
                    else
                        if (braceSplit > 0 && (dx != 0.0 || dz != 0.0) && dy != 0.0 && braceMatch) {
                            isBrc = true;

                            if (braceSplit > 1) {
                                incr = parseInt(($("#toNode").val() - $("#fromNode").val()) / braceSplit);
                                if( Math.abs(incr) < 1 ) 
                                    incr = 1;

                                var tn = getNewNode(parseInt($("#fromNode").val()) + incr);
                                if( tn == lastNode )
                                    tn = getNewNode(tn + 1);

                                $("#toNode").val(tn);

                                $('#dX').val(dx / braceSplit);
                                $('#dY').val(dy / braceSplit);
                                $('#dZ').val(dz / braceSplit);

                                if( lX == 0.0 )
                                    $('#lX').val(truLen);
                                if( lY == 0.0 )
                                    $('#lY').val(truLen);
                                if( lZ == 0.0 )
                                    $('#lZ').val(truLen);
                  
                                it0 = braceSplit;
                                inc0 = incr;
                                memEnd = braceEnd;
                            }
                            if (braceType != "(none)")
                                $('#memberType').val(braceType);
                        }
            }

            storeElement(it0, inc0, it1, inc1, it2, inc2, it3, inc3, lastNode, memEnd, true, false);

            $("#toNode").val(lastNode);
            if (deformed) {
                deformed = false; // draw the original
                drawModel(false,true);
                deformed = true; // draw the deformed
            }
            drawModel(false,!deformed);

            //                  storeElement(1, 1, 1, 1, 1, 1, 1, 1, 0, -1, true, false);
        }
        else {
            return false;
        }
    }
    else {
        if (currElmt > totEls)
            totEls = currElmt;
    }
    revertColor(); 
    currElmt = totEls + 1;
    displayElement(currElmt);
    selectionSet.length = 0;
    selectionSet[0] = currElmt;
    nodSelectionSet = [];
    elemMenu();    // reset context menu to reflect elements

    $('#fromNode').focus();    // make sure we're on the right field
    onFromNode = true;
    onToNode = false;

    if (deformed) {
        deformed = false; // draw the original
        drawModel(false,true);
        deformed = true; // draw the deformed
    }
    drawModel(false,!deformed);

}

function firstEl(send) {

/*    if (send && TogetherJS.running) {
        TogetherJS.send({
            type: 'firstEl'
        });
    }
*/
    if (currElmt > totEls) { // may have been inadvertent PgDn push
        var istr1 = $('#dX').val();
        var istr2 = $('#dY').val();
        var istr3 = $('#dZ').val();

        if ((istr1 == "" || istr1 == 0.0) && (istr2 == "" || istr2 == 0.0) && (istr3 == "" || istr3 == 0.0)) {
            revertColor(); 
            currElmt = 1;
            displayElement(currElmt);
            selectionSet = [currElmt];
            nodSelectionSet = [];
            elemMenu();    // reset context menu to reflect elements

            //if( highLight)
            //    drawModel(false,false);
            return;
        }
    }

    if (editRights) {
        if (!isEqual1(modelElements[currElmt], getScreenEntries()) || (currElmt > totEls)) {
            if (validEntry(false)) {
                if (memberDefault && newMember) {
                    var iSav = currElmt;
                    nextEl(true);
                    currElmt = iSav;
                }
                else {
                    storeElement(1, 1, 1, 1, 1, 1, 1, 1, 0, -1, true, false);
                    if (deformed) {
                        deformed = false; // draw the original
                        drawModel(false, true);
                        deformed = true; // draw the deformed
                    }
                }
                drawModel(false,!deformed);
            }
            else {
                return;
            }
        }  
        else {
            if (currElmt > totEls)
                totEls = currElmt;
        }
    } 
    revertColor(); 
    currElmt = 1;
    displayElement(currElmt);
    selectionSet = [currElmt];
    nodSelectionSet = [];
    elemMenu();    // reset context menu to reflect elements

    //if( highLight)
    //    drawModel(false,false);
}

function getXYZ(node) {
    for( var i=1; i<=totEls; i++ ) {
        if( modelElements[i].fromNode == node ) 
            return [coords[i].x1, coords[i].y1, coords[i].z1];
        if( modelElements[i].toNode == node ) 
            return [coords[i].x2, coords[i].y2, coords[i].z2]; 
    }
}

function getNewNode(node  /* , c  */ ) {
  
    // just make sure the node number hasn't been used elsewhere

    var node1 = node;
  
    done = false;
    while ( !done ) {
        done = true;
    
        for( var i=0; i<fNodes.length; i++ ) {
            if (fNodes[i].node == node1)  {
                //                    node1++;
                node1 += nodInc;
                done = false;
                break;
            }
        }
        if (done) {
            for (var i = 1; i <= totEls; i++) {
                if ((modelElements[i].fromNode == node1) || (modelElements[i].toNode == node1)) {
                    //                      node1++;
                    node1 += nodInc;
                    done = false;
                    break;
                }
            }
        }
    }
    return node1;
}
function revertColor() {
    /* return previously selected element's beam color */
    for (var i =0 ; i < selectionSet.length; i++) {
        changeBeamColor(selectionSet[i], beam_color);
    }
}
function nextEl(send) {

/*    if (send && TogetherJS.running) {
        TogetherJS.send({
            type: 'nextEl'
        });
    }
*/
    if (editRights) {
        if (!isEqual1(modelElements[currElmt], getScreenEntries()) || (currElmt > totEls)) {
            if (validEntry(true)) {
      
                var it0 = 1;
                var inc0 = 1;
                var memEnd = -1;
        
                lastNode = parseInt($("#toNode").val());
        
                it1 = 1;
                inc1 = nodInc;
                it2 = 1;
                inc2 = nodInc;
                it3 = 1;
                inc3 = nodInc;
        
                if (memberDefault && newMember) {
        
                    var dx = $('#dX').val();
                    if (isNaN(dx)) 
                        dx = 0.0;
                    var dy = $('#dY').val();
                    if (isNaN(dy)) 
                        dy = 0.0;
                    var dz = $('#dZ').val();
                    if (isNaN(dz)) 
                        dz = 0.0;
          
                    if (dx == 0.0 && dy == 0.0 && dz == 0.0) 
                        return;
          
                    var truLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    var lX = parseFloat($('#lX').val());
                    if (isNaN(lX)) 
                        lX = 0.0;
                    var lY = parseFloat($('#lY').val());
                    if (isNaN(lY)) 
                        lY = 0.0;
                    var lZ = parseFloat($('#lZ').val());
                    if (isNaN(lZ)) 
                        lZ = 0.0;
          
                    var isCol = false;
                    var isBem = false;
                    var isBrc = false;
          
                    var incr;
          
                    if (colSplit > 0 && dx == 0.0 && dy != 0.0 && dz == 0.0 && colMatch) {
                        isCol = true;
            
                        if (colSplit > 1) {
                            incr = parseInt(($("#toNode").val() - $("#fromNode").val()) / colSplit);
                            if (Math.abs(incr) < 1) 
                                incr = 1;
              
                            var tn = getNewNode(parseInt($("#fromNode").val()) + incr);
                            if (tn == lastNode) 
                                tn = getNewNode(tn + 1);
                            $("#toNode").val(tn);
              
                            $('#dX').val(dx / colSplit);
                            $('#dY').val(dy / colSplit);
                            $('#dZ').val(dz / colSplit);
              
                            if (lX == 0.0) 
                                $('#lX').val(truLen);
                            if (lY == 0.0) 
                                $('#lY').val(truLen);
                            if (lZ == 0.0) 
                                $('#lZ').val(truLen);
              
                            it0 = colSplit;
                            inc0 = incr;
                            memEnd = colEnd;
                        }
            
                        if (colType != "(none)") 
                            $('#memberType').val(colType);
            
                    }
                    else 
                        if (beamSplit > 0 && (dx != 0.0 || dz != 0.0) && dy == 0.0 && beamMatch) {
                            isBem = true;
              
                            if (beamSplit > 1) {
                                incr = parseInt(($("#toNode").val() - $("#fromNode").val()) / beamSplit);
                                if (Math.abs(incr) < 1) 
                                    incr = 1;
                
                                var tn = getNewNode(parseInt($("#fromNode").val()) + incr);
                                if (tn == lastNode) 
                                    tn = getNewNode(tn + 1);
                                //                          var tn = parseInt(("#fromNode").val()) + incr;
                
                                $("#toNode").val(tn);
                
                                $('#dX').val(dx / beamSplit);
                                $('#dY').val(dy / beamSplit);
                                $('#dZ').val(dz / beamSplit);
                
                                if (lX == 0.0) 
                                    $('#lX').val(truLen);
                                if (lY == 0.0) 
                                    $('#lY').val(truLen);
                                if (lZ == 0.0) 
                                    $('#lZ').val(truLen);
                
                                it0 = beamSplit;
                                inc0 = incr;
                                memEnd = beamEnd;
                            }
                            if (beamType != "(none)") 
                                $('#memberType').val(beamType);
              
                        }
                        else 
                            if (braceSplit > 0 && (dx != 0.0 || dz != 0.0) && dy != 0.0 && braceMatch) {
                                isBrc = true;
                
                                if (braceSplit > 1) {
                                    incr = parseInt(($("#toNode").val() - $("#fromNode").val()) / braceSplit);
                                    if (Math.abs(incr) < 1) 
                                        incr = 1;
                  
                                    var tn = getNewNode(parseInt($("#fromNode").val()) + incr);
                                    if (tn == lastNode) 
                                        tn = getNewNode(tn + 1);
                  
                                    $("#toNode").val(tn);
                  
                                    $('#dX').val(dx / braceSplit);
                                    $('#dY').val(dy / braceSplit);
                                    $('#dZ').val(dz / braceSplit);
                  
                                    if (lX == 0.0) 
                                        $('#lX').val(truLen);
                                    if (lY == 0.0) 
                                        $('#lY').val(truLen);
                                    if (lZ == 0.0) 
                                        $('#lZ').val(truLen);
                  
                                    it0 = braceSplit;
                                    inc0 = incr;
                                    memEnd = braceEnd;
                                }
                                if (braceType != "(none)") 
                                    $('#memberType').val(braceType);
                            }
                }
        
                storeElement(it0, inc0, it1, inc1, it2, inc2, it3, inc3, lastNode, memEnd, true, false);
                $("#toNode").val(lastNode);
        
                if (deformed) {
                    deformed = false; // draw the original
                    drawModel(false, true);
                    deformed = true; // draw the deformed
                }
                drawModel(false, !deformed);
            }
            else {
                return;
            }
        }
        else {
            if (currElmt > totEls) 
                totEls = currElmt;
        }
    }
    revertColor();
    currElmt += 1;
    displayElement(currElmt);
    selectionSet = [currElmt];
    nodSelectionSet = [];
    elemMenu();    // reset context menu to reflect elements

    //if (highLight) 
    //    drawModel(false, false);

    if( !heroActive && currElmt > totEls ) {
        $('#fromNode').focus();    // make sure we're on the right field if modeling graphically
        onFromNode = true;
        onToNode = false;
    }
}

function findEl(fromN, toN){

    if (isNaN(fromN)) // we don't really consider these as from and to nodes, rather either node in the element
        fromN = 0;

    if (isNaN(toN))
        toN = 0;

    if (fromN < 0 || toN < 0 || (fromN <= 0 && toN <= 0))
        bootbox.alert("Invalid node number(s) specified.");
    else {

        var ifound = 0;
        for (var i = currElmt + 1; i <= totEls; i++) {
            if ((modelElements[i].fromNode == fromN || modelElements[i].toNode == fromN || fromN == 0) &&
            (modelElements[i].fromNode == toN || modelElements[i].toNode == toN || toN == 0)) {
                ifound = i;
                break;
            }
        }

        if (ifound == 0) {
            for (var i = 1; i <= currElmt; i++) {
                if ((modelElements[i].fromNode == fromN || modelElements[i].toNode == fromN || fromN == 0) &&
                (modelElements[i].fromNode == toN || modelElements[i].toNode == toN || toN == 0)) {
                    ifound = i;
                    break;
                }
            }
        }

        if (ifound == 0)
            bootbox.alert("No element found with that/those node number(s).");
        else {
            if (currElmt > totEls) { // may have been inadvertent PgDn push
                var istr1 = $('#dX').val();
                var istr2 = $('#dY').val();
                var istr3 = $('#dZ').val();

                if ((istr1 == "" || istr1 == 0.0) && (istr2 == "" || istr2 == 0.0) && (istr3 == "" || istr3 == 0.0)) {
                    revertColor();
                    currElmt = ifound;
                    displayElement(currElmt);
                    selectionSet = [currElmt];
                    nodSelectionSet = [];
                    elemMenu();    // reset context menu to reflect elements

                    //if (highLight)
                    //    drawModel(false,false);
                    return;
                }
            }

            if (editRights) {
                if (!isEqual1(modelElements[currElmt], getScreenEntries()) || (currElmt > totEls)) {
                    if (validEntry(false)) {
                        if (memberDefault && newMember) {
                            var iSav = currElmt;
                            nextEl(true);
                            currElmt = iSav;
                        }
                        else {
                            storeElement(1, 1, 1, 1, 1, 1, 1, 1, 0, -1, true, false);
                            if (deformed) {
                                deformed = false; // draw the original
                                drawModel(false, true);
                                deformed = true; // draw the deformed
                            }
                            drawModel(false, !deformed);
                        }
                    }
                    else {
                        return;
                    }
                }
                else {
                    if (currElmt > totEls) 
                        totEls = currElmt;
                }
            }
            revertColor();
            currElmt = ifound;
            displayElement(currElmt);
            selectionSet = [currElmt];
            nodSelectionSet = [];
            elemMenu();    // reset context menu to reflect elements

        }
    }
}

function findEl1(send){
/*    if (send && TogetherJS.running) {
        TogetherJS.send({
            type: 'findEl1'
        });
    }
*/
    bBox = bootbox.form({
        title: 'Enter Node Number(s) you wish to find:',
        fields: {
            fromN: {
                label: 'Node 1',
                value: '',
                type: 'text'
            },
            toN: {
                label: 'Node 2',
                value: '',
                type: 'text'
            }
        },
        callback: function(values){
            if (values != null) {
/*                if (send && TogetherJS.running) {
                    TogetherJS.send({
                        type: 'findEl',
                        fromN: values.fromN,
                        toN: values.toN
                    });
                }
*/
                findEl(parseInt(values.fromN), parseInt(values.toN));
            }
        }
    })
}

function saveAs() {
    if( temporary ) {
        if( !modalSignIn() )
            return;
    }
      
    if (editRights) {
        if (!isEqual1(modelElements[currElmt], getScreenEntries()) || (currElmt > totEls)) {
            if (validEntry(false)) {
      
                var it0 = 1;
                var inc0 = 1;
                var memEnd = -1;
        
                lastNode = parseInt($("#toNode").val());
        
                it1 = 1;
                inc1 = nodInc;
                it2 = 1;
                inc2 = nodInc;
                it3 = 1;
                inc3 = nodInc;
        
                if (memberDefault && newMember) {
        
                    var dx = $('#dX').val();
                    if (isNaN(dx)) 
                        dx = 0.0;
                    var dy = $('#dY').val();
                    if (isNaN(dy)) 
                        dy = 0.0;
                    var dz = $('#dZ').val();
                    if (isNaN(dz)) 
                        dz = 0.0;
          
                    if (dx == 0.0 && dy == 0.0 && dz == 0.0) 
                        return;
          
                    var truLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    var lX = parseFloat($('#lX').val());
                    if (isNaN(lX)) 
                        lX = 0.0;
                    var lY = parseFloat($('#lY').val());
                    if (isNaN(lY)) 
                        lY = 0.0;
                    var lZ = parseFloat($('#lZ').val());
                    if (isNaN(lZ)) 
                        lZ = 0.0;
          
                    var isCol = false;
                    var isBem = false;
                    var isBrc = false;
          
                    var incr;
          
                    if (colSplit > 0 && dx == 0.0 && dy != 0.0 && dz == 0.0) {
                        isCol = true;
            
                        if (colSplit > 1) {
                            incr = parseInt(($("#toNode").val() - $("#fromNode").val()) / colSplit);
                            if (Math.abs(incr) == 0) 
                                incr = 1;
              
                            var tn = getNewNode(parseInt($("#fromNode").val()) + incr);
                            if (tn == lastNode) 
                                tn = getNewNode(tn + 1);
              
                            $("#toNode").val(tn);
              
                            $('#dX').val(dx / colSplit);
                            $('#dY').val(dy / colSplit);
                            $('#dZ').val(dz / colSplit);
              
                            if (lX == 0.0) 
                                $('#lX').val(truLen);
                            if (lY == 0.0) 
                                $('#lY').val(truLen);
                            if (lZ == 0.0) 
                                $('#lZ').val(truLen);
              
                            it0 = colSplit;
                            inc0 = incr;
                            memEnd = colEnd;
                        }
            
                        if (colType != "(none)") 
                            $('#memberType').val(colType);
                    }
                    else {
                        if (beamSplit > 0 && (dx != 0.0 || dz != 0.0) && dy == 0.0) {
                            isBem = true;
              
                            if (beamSplit > 1) {
                                incr = parseInt(($("#toNode").val() - $("#fromNode").val()) / beamSplit);
                                if (Math.abs(incr) == 0) 
                                    incr = 1;
                
                                var tn = getNewNode(parseInt($("#fromNode").val()) + incr);
                                if (tn == lastNode) 
                                    tn = getNewNode(tn + 1);
                
                                $("#toNode").val(tn);
                
                                $('#dX').val(dx / beamSplit);
                                $('#dY').val(dy / beamSplit);
                                $('#dZ').val(dz / beamSplit);
                
                                if (lX == 0.0) 
                                    $('#lX').val(truLen);
                                if (lY == 0.0) 
                                    $('#lY').val(truLen);
                                if (lZ == 0.0) 
                                    $('#lZ').val(truLen);
                
                                it0 = beamSplit;
                                inc0 = incr;
                                memEnd = beamEnd;
                            }
              
                            if (beamType != "(none)") 
                                $('#memberType').val(beamType);
              
                        }
                        else {
                            if (braceSplit > 0 && (dx != 0.0 || dz != 0.0) && dy != 0.0) {
                                isBrc = true;
                
                                if (braceSplit > 1) {
                                    incr = parseInt(($("#toNode").val() - $("#fromNode").val()) / braceSplit);
                                    if (Math.abs(incr) == 0) 
                                        incr = 1;
                  
                                    var tn = getNewNode(parseInt($("#fromNode").val()) + incr);
                                    if (tn == lastNode) 
                                        tn = getNewNode(tn + 1);
                  
                                    $("#toNode").val(tn);
                  
                                    $('#dX').val(dx / braceSplit);
                                    $('#dY').val(dy / braceSplit);
                                    $('#dZ').val(dz / braceSplit);
                  
                                    if (lX == 0.0) 
                                        $('#lX').val(truLen);
                                    if (lY == 0.0) 
                                        $('#lY').val(truLen);
                                    if (lZ == 0.0) 
                                        $('#lZ').val(truLen);
                  
                                    it0 = braceSplit;
                                    inc0 = incr;
                                    memEnd = braceEnd;
                                }
                                if (braceType != "(none)") 
                                    $('#memberType').val(braceType);
                            }
                        }
            
                        storeElement(it0, inc0, it1, inc1, it2, inc2, it3, inc3, lastNode, memEnd, true);
                        $("#toNode").val(lastNode);
                        if (deformed) {
                            deformed = false; // draw the original
                            drawModel(false, true);
                            deformed = true; // draw the deformed
                        }
                        drawModel(false, !deformed);
            
                        initUndo(0);
            
                        if (currElmt == 0) 
                            currElmt = 1;
                        displayElement(currElmt);
                        selectionSet = [currElmt];
                        nodSelectionSet = [];
                        elemMenu(); // reset context menu to reflect elements
                        if (highLight) 
                            drawModel(false, false);
            
                        if (!heroActive && currElmt > totEls) {
                            $('#fromNode').focus(); // make sure we're on the right field if modeling graphically
                            onFromNode = true;
                            onToNode = false;
                        }
                    }
                }
            }
        }
    }

    inBoot = true;
    bootbox.prompt("Enter new Job Name:", function(result){

        if (result) {

            $.ajax({
                type: "POST",
                url: "./php/copyJob.php",
                data: {
                    "userName": userName,
                    "oldName": jobName,
                    "newName": result,
                    "userName1": userName1
                },
                success: function(msg){
                }
            });

            if( userName != userName1 ) {
                userName1 = userName;
                editRights = true;
                setJobName(result);
                displayElement(currElmt);
            }
            else 
                setJobName(result);

            $.ajax({
                type: "POST",
                url: "./php/putUsersJob.php",
                data: {"userName": userName,
                    "jobName": jobName,
                    "userName1": userName1 },
                success: function(msg){
                }
            });
        }    
    });
      
    inBoot = false;
}  

// cis2

function startCIS2Import(){
    document.getElementById('cis2ImportProcess').style.visibility = 'visible';
    document.getElementById('cis2ImportForm').style.visibility = 'hidden';
    return true;
}

function stopCIS2Import(success){
    var result = '';

    getNotes();
    var jobUnits = getSpecificJobUnits(jobName);
    buildJobUnits(jobUnits);
    var jobNodeCoords = getSpecificJobNodeCoords(jobName);
    buildJobNodeCoords(jobNodeCoords);
    var jobLoadCases = getSpecificJobLoadCases(jobName);
    buildJobLoadCases(jobLoadCases);
    var jobData = getSpecificJob(jobName);
    buildJobArrays(jobData);
    var shareData = getSpecificJobShares(jobName);
    buildShareArrays(shareData);


    document.getElementById('cis2ImportProcess').style.visibility = 'hidden';
    //              document.getElementById('cis2ImportForm').innerHTML = '<input type="text" class="input-small rj" name="importJob" id="importJob" style="width:0;height:0;border:0px solid #fff;" ><input type="file" name="file" id="file"><br><label><input type="submit" name="submitBtn" class="btn btn-primary" value="Import" /></label>';
    document.getElementById('cis2ImportForm').innerHTML = '<br/><input type="text" class="input-small rj" name="importJob" id="importJob" style="width:0;height:0;border:0px solid #fff;" ><input type="file" name="file" id="file"><br><input type="hidden" name="cIS2UserName" id="cIS2UserName" ><input type="hidden" name="cIS2JobName" id="cIS2JobName" ><input type="hidden" name="cIS2Units" id="cIS2Units" ><label><input type="submit" name="submitBtn" class="btn btn-primary" value="Import" /></label>'
    //              document.getElementById('cis2ImportForm').innerHTML = '<br/><input type="text" class="input-small rj" name="importJob" id="importJob" ><input type="file" name="file" id="file"><br><input type="text" name="cIS2UserName" id="cIS2UserName" ><input type="text" name="cIS2JobName" id="cIS2JobName" ><label><input type="submit" name="submitBtn" class="btn btn-primary" value="Import" /></label>'
    //              $('#importJob').val(jobName);
    $('#cIS2SelectScreen').modal('hide');
    //              document.getElementById('cis2ImportForm').style.visibility = 'visible';

    return true;
}

/*  temp out
// cis2

function startCIS2Import(){
  document.getElementById('cis2ImportProcess').style.visibility = 'visible';
  document.getElementById('cis2ImportForm').style.visibility = 'hidden';
  return true;
}

function stopCIS2Import(success){
  var result = '';

  getNotes();
  var jobUnits = getSpecificJobUnits(jobName);
  buildJobUnits(jobUnits);
  var jobNodeCoords = getSpecificJobNodeCoords(jobName);
  buildJobNodeCoords(jobNodeCoords);
  var jobLoadCases = getSpecificJobLoadCases(jobName);
  buildJobLoadCases(jobLoadCases);
  var jobData = getSpecificJob(jobName);
  buildJobArrays(jobData);


  document.getElementById('cis2ImportProcess').style.visibility = 'hidden';
  document.getElementById('cis2ImportForm').innerHTML = '<input type="text" class="input-small rj" name="importJob" id="importJob" style="width:0;height:0;border:0px solid #fff;" ><input type="file" name="file" id="file"><br><label><input type="submit" name="submitBtn" class="btn btn-primary" value="Import" /></label>';
//              $('#importJob').val(jobName);
  $('#cIS2SelectScreen').modal('hide');
//              document.getElementById('cis2ImportForm').style.visibility = 'visible';

  return true;
}
temp out */
function startUploadJob(){
    document.getElementById('uploadJobProcess').style.visibility = 'visible';
    document.getElementById('uploadJobForm').style.visibility = 'hidden';
    return true;
}

function setSelectedValue(selectObj, valueToSet) {
    for (var i = 0; i < selectObj.options.length; i++) {
        if (selectObj.options[i].text== valueToSet) {
            selectObj.options[i].selected = true;
            return;
        }
    }
}

function stopUploadJob(success){
    var result = '';

    getNotes();
    var jobUnits = getSpecificJobUnits(jobName);
    buildJobUnits(jobUnits);
    var jobNodeCoords = getSpecificJobNodeCoords(jobName);
    buildJobNodeCoords(jobNodeCoords);
    var jobLoadCases = getSpecificJobLoadCases(jobName);
    buildJobLoadCases(jobLoadCases);
    var jobData = getSpecificJob(jobName);
    buildJobArrays(jobData);
    var shareData = getSpecificJobShares(jobName);
    buildShareArrays(shareData);

    document.getElementById('uploadJobProcess').style.visibility = 'hidden';
    //              document.getElementById('uploadJobForm').innerHTML = '<input type="text" class="input-small rj" name="uploadJob" id="uploadJob" style="width:0;height:0;border:0px solid #fff;" ><input type="file" name="uploadFile" id="uploadFile"><br><label><input type="submit" name="ulSubmitBtn" class="btn btn-primary" value="Import" /></label>';
    document.getElementById('uploadJobForm').innerHTML = "<br/><input type='text'  rel='tooltip' title='Select a .CCM file (CloudCalc neutral file) from your local device, then click 'Import' class='input-small rj' name='uploadJob' id='uploadJobB' style='width:0;height:0;border:0px solid #fff;'><input type='file' name='uploadFile' id='uploadFile' rel='tooltip' title='Select a .CCM file (CloudCalc neutral file) from your local devicecomputer, then click <Import>'><br><input type='hidden' name='uploadUserName' id='uploadUserName'><input type='hidden' name='uploadJobName' id='uploadJobName'><input type='hidden' name='MAX_FILE_SIZE' value='5900000' /><label><input type='submit' rel='tooltip' title='Click to convert the neutral file to CloudCalc model (OVERWRITING THE CURRENT MODEL)' name='ulSubmitBtn' class='btn btn-primary' value='Import' /></label>";
    $('#uploadJobScreen').modal('hide');

    return true;
}

function int2Bool(innt){
    if (innt == 0 || innt == false )
        return false;
    else
        return true;
}

function bool2Int(boool){
    if (boool == 0 || !boool )
        return 0;
    else
        return 1;
}

function getCookie(cname)
{
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++)
    {
        var c = ca[i].trim();
        if (c.indexOf(name)==0) return c.substring(name.length,c.length);
    }
    return "";
}

function deleteCookie( name ) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function getUserPW() {

    if( !isMobile ) 
        showScreen("inputScreen");

    userName = jQuery.trim(getCookie("username"));
    userName1 = userName;

    passWord = jQuery.trim(getCookie("wp"));

    if( userName == "" || passWord == "" )
        return false;

    //              if (pw != "") {

    resetMaterialList(true);
    resetMemberList(true);

    var uP = getCookie("uP");

    userProfile = JSON.parse(uP);

    undoLevel = -1; // initialize
    ctrlKeyDown = false;

    var job = getUserJob(userName);
    displayJobName(job);
    goGetJob(job);

    if( isMobile ) 
        allGraphics = true;
    else
        allGraphics = false;

    return true;
}

function populateMetricMembers() {
    $.ajax({
        url: './php/getGlobalMembers.php',
        type: 'POST',
        data: {
            "englishMem": 0,
            "metricMem": 1,
            "w": bool2Int(memW&&canWM),
            "m": bool2Int(memM&&canMM),
            "s": bool2Int(memS&&canSM),
            "hp": bool2Int(memHP&&canHPM),
            "wb": bool2Int(memWB&&canWBM),
            "wt": bool2Int(memWT&&canWTM),
            "mt": bool2Int(memMT&&canMTM),
            "st": bool2Int(memST&&canSTM),
            "l": bool2Int(memL&&canLM),
            "2l": bool2Int(mem2L&&can2LM),
            "c": bool2Int(memC&&canCM),
            "mc": bool2Int(memMC&&canMCM),
            "hss": bool2Int(memHSS&&canHSSM),
            "pip": bool2Int(memPip&&canPipM)
        },
        success: function(data){
            updateMemberTable(data, gMemTable,'<a class="addLocal" href="">Add to Local</a>');
            memLibrary.hidePleaseWait();
            loadedglobalmems = true;
        },
        error: function(msg){
            alert(msg);
            memLibrary.hidePleaseWait();
            loadedglobalmems = true;
        }
    });
    if( memW )
        canWM = false;
    if( memM )
        canMM = false;
    if( memS )
        canSM = false;
    if( memHP )
        canHPM = false;
    if( memWB )
        canWBM = false;
    if( memWT )
        canWTM = false;
    if( memMT )
        canMTM = false;
    if( memST )
        canSTM = false;
    if( memL )
        canLM = false;
    if( mem2L )
        can2LM = false;
    if( memC )
        canCM = false;
    if( memMC )
        canMCM = false;
    if( memHSS )
        canHSSM = false;
    if( memPip )
        canPipM = false;
}

function populateGlobalMemberTable() {

    if (!loadedGlobalMems) {

        memLibrary.showPleaseWait();

        if (englishMem1) {
            $.ajax({
                url: './php/getGlobalMembers.php',
                type: 'POST',
                data: {
                    "englishMem": 1,
                    "metricMem": 0,
                    "w": bool2Int(memW&&canWE),
                    "m": bool2Int(memM&&canME),
                    "s": bool2Int(memS&&canSE),
                    "hp": bool2Int(memHP&&canHPE),
                    "wb": bool2Int(memWB&&canWBE),
                    "wt": bool2Int(memWT&&canWTE),
                    "mt": bool2Int(memMT&&canMTE),
                    "st": bool2Int(memST&&canSTE),
                    "l": bool2Int(memL&&canLE),
                    "2l": bool2Int(mem2L&&can2LE),
                    "c": bool2Int(memC&&canCE),
                    "mc": bool2Int(memMC&&canMCE),
                    "hss": bool2Int(memHSS&&canHSSE),
                    "pip": bool2Int(memPip&&canPipE)
                },
                success: function(data){

                    updateMemberTable(data, gMemTable,'<a class="addLocal" href="">Add to Local</a>');

                    if( metricMem1) {
                        populateMetricMembers();
                    }
                    else {
                        memLibrary.hidePleaseWait();
                        loadedglobalmems = true;
                    }
                },
                error: function(msg){
                    alert(msg);
                    if (metricMem1) {
                        populateMetricMembers();
                    }
                    else {
                        memLibrary.hidePleaseWait();
                        loadedglobalmems = true;
                    }
                }
            });

            if( memW )
                canWE = false;
            if( memM )
                canME = false;
            if( memS )
                canSE = false;
            if( memHP )
                canHPE = false;
            if( memWB )
                canWBE = false;
            if( memWT )
                canWTE = false;
            if( memMT )
                canMTE = false;
            if( memST )
                canSTE = false;
            if( memL )
                canLE = false;
            if( mem2L )
                can2LE = false;
            if( memC )
                canCE = false;
            if( memMC )
                canMCE = false;
            if( memHSS )
                canHSSE = false;
            if( memPip )
                canPipE = false;

        }
        else {
            if (metricMem1) {
                populateMetricMembers();
            }
            else {
                memLibrary.hidePleaseWait();
                loadedglobalmems = true;
            }
        }
    }
}

function populateGlobalMaterialTable() {

    if (!loadedGlobalMats) {

        matLibrary.showPleaseWait();

        gMatTable.fnClearTable();
        //                gMatTable.fnSort([0, 'asc']);

        $.ajax({
            url: './php/getGlobalMaterials.php',
            type: 'POST',
            success: function(data){
                var objs = $.parseJSON(data);

                $.each( objs, function( index ) {
                    var name = objs[index].MaterialSpec;
                    gMatTable.fnAddData([name, '<a class="addLocal" href="">Add to Local</a>']);
                });
                matLibrary.hidePleaseWait();
                loadedGlobalMats = true;
            }
        });
    }
}

function errorFree() {
    // do some basic error checking here (must be at least one restraint, no zero lenght elements

    var restExist = false;
    var str;

    for (var i = 1; i <= totEls; i++) {

        if (modelElements[i].fromNode <= 0 || modelElements[i].toNode <= 0 ||
            modelElements[i].fromNode == modelElements[i].toNode ) {
            str = "ERROR: Element " + i + " has invalid node numbers.  Please correct.";
            bootbox.alert(str);
            currElmt = i;
            return false;
        }

        if (modelElements[i].dX == 0.0 && modelElements[i].dY == 0.0 && modelElements[i].dZ == 0.0) {
            str = "ERROR: Element " + i + " is zero length.  Please correct.";
            bootbox.alert(str);
            currElmt = i;
            return false;
        }
    
        if (modelElements[i].memberType == 'PipeCustom' && (modelElements[i].pipOD <= 0.0 || modelElements[i].pipTh <= 0.0) ) {
            str = "ERROR: Element " + i + " is a Custom Pipe and has an incorrectly specified OD/thickness.  Please correct.";
            bootbox.alert(str);
            currElmt = i;
            return false;
        }

        if (modelElements[i].lX < 0.0 || modelElements[i].lY < 0.0 || modelElements[i].lZ < 0.0 ||
        modelElements[i].kX < 0.0 ||
        modelElements[i].kY < 0.0 ||
        modelElements[i].kZ < 0.0) {
            str = "ERROR: Element " + i + " has invalid l- or k-value (equivalent length).  Please correct.";
            bootbox.alert(str);
            currElmt = i;
            return false;
        }

        if (modelElements[i].cBZ < 0.0 || modelElements[i].cBY < 0.0) {
            str = "ERROR: Element " + i + " has invalid CB-value (cannot be negative).  Please correct.";
            bootbox.alert(str);
            currElmt = i;
            return false;
        }

        if (modelElements[i].stiffDist < 0.0 || modelElements[i].stiffI < 0.0) {
            str = "ERROR: Element " + i + " has invalid stiffener value (cannot be negative).  Please correct.";
            bootbox.alert(str);
            currElmt = i;
            return false;
        }

        if ((modelElements[i].fromFXMemb && modelElements[i].toFXMemb) || (modelElements[i].fromFYMemb &&
             modelElements[i].toFYMemb) || (modelElements[i].fromFZMemb && modelElements[i].toFZMemb) ||
            (modelElements[i].fromMXMemb && modelElements[i].toMXMemb) || (modelElements[i].fromMYMemb &&
             modelElements[i].toMYMemb && (modelElements[i].fromFZMemb || modelElements[i].toFZMemb)) ||
            (modelElements[i].fromMZMemb && modelElements[i].toMZMemb && (modelElements[i].fromFYMemb || modelElements[i].toFYMemb)) ) {
            str = "ERROR: Element " + i + " has an unstable set of Member Releases.  Please correct.";
            bootbox.alert(str);
            currElmt = i;
            return false;
        }

        if (!restExist) {
            if (modelElements[i].fromFXRest || modelElements[i].fromFYRest || modelElements[i].fromFZRest ||
                modelElements[i].fromMXRest || modelElements[i].fromMYRest || modelElements[i].fromMZRest ||
                modelElements[i].toFXRest || modelElements[i].toFYRest || modelElements[i].toFZRest ||
                modelElements[i].toMXRest || modelElements[i].toMYRest || modelElements[i].toMZRest) {
                restExist = true;
            }
        }
    }

    if( !restExist )
        bootbox.alert("ERROR: There must be at least one restraint defined in the model.");
    return restExist;

}

function forumSignIn(){

    var success = false;
    var forumString;

    $.ajax({
        type: 'POST',
        url: './php/forumLogin.php',
        async: false,
        data: {
            "userName": userName
        },
        success: function(msg){
            var il = msg.length;
            if (msg.substring(il - 16, il) == "Login Successful") {
                i1 = msg.indexOf("http");
                var i2 = msg.indexOf("border") - 2;
                forumString = msg.substring(i1, i2);
                //                    success = true;
                //                    if (success)
                ccF = window.open(forumString, "forumwindow", "scrollbars=yes,resizable=yes,left=500,width=900,height=1000"); //left=400,top=400, width=400, height=400
                ccFOpen = true;
            }
            else
                bootbox.alert(msg);
        },
        error: function(msg){
            bootbox.alert(msg);
        }
    });

}

function forumLogout(){

    if( !ccFOpen )
        return;

    var success = false;
    var forumString;

    $.ajax({
        type: 'POST',
        url: './php/forumLogout.php',
        async: false,
        success: function(msg){
            var il = msg.length;
            i1 = msg.indexOf("http");
            var i2 = msg.indexOf("border") - 2;
            forumString = msg.substring(i1, i2);
            //                  success = true;
            //                  if (success) {
            ccF = window.open("", "forumwindow", "width=1,height=1,left=1000,top=1000");
            if (ccF != undefined)
                ccF.close();
            ccFOpen = false;
        },
        error: function(msg){
            bootbox.alert(msg);
            ccF = window.open("", "forumwindow", "width=1,height=1,left=1000,top=1000");
            if (ccF != undefined)
                ccF.close();
            ccFOpen = false;
        }
    });
}

function hasWhiteSpace(s) {
    return /\s/g.test(s);
}

function isValid(str){
    str.trim();
    if (str.length < 5 || str.length > 25) {
        bootbox.alert("User Name/Password must be between 5 and 25 characters long.");
        return false;
    }
    else {
        if( hasWhiteSpace(str) )
            bootbox.alert("User Name/Password cannot have imbedded spaces.");
        else
            return true;
    }
}

function isValid1(str){
    str.trim();
    if (str.length < 5 || str.length > 25) {
        $('.wrnMsg').text("User Name/Password must be between 5 and 25 characters long.");
        return false;
    }
    else {
        if( hasWhiteSpace(str) )
            $('.wrnMsg').text("User Name/Password cannot have imbedded spaces.");
        else
            return true;
    }
}

function setCookie(cname,cvalue,exdays)
{
    var d = new Date();
    d.setTime(d.getTime()+(exdays*24*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = cname+"="+cvalue+"; "+expires;
}

function showProfile(){
    registering = false;

    $("#regUserName").val(userName);
    $("#regPW1").val(passWord);
    $("#regPW2").val(passWord);
    $("#regEmail1").val(userProfile.Email);
    //              $("#regEmail2").val(userProfile.Email);
    $("#regFirst").val(userProfile.FirstName);
    $("#regLast").val(userProfile.LastName);
    $("#regCompany").val(userProfile.Company);
    /*              $("#regAdd1").val(userProfile.Addr1);
      $("#regAdd2").val(userProfile.Addr2);
      $("#regCity").val(userProfile.City);
      $("#regState").val(userProfile.StateName);
      $("#regZip").val(userProfile.Zip);
    */              $("#regCountry").val(userProfile.Country);

    if (userProfile.OptOut == 1)
        $('#regOptOut').prop('checked', true);
    else
        $('#regOptOut').prop('checked', false);

    $("").val(userProfile.OptOut);

    showScreen("register");
}

function updateProfile(){

    var registering = false;

    var worked = false;
    var regPW1 = $("#regPW1").val();
    var regPW2 = $("#regPW2").val();
    var regEmail1 = $("#regEmail1").val();
    //              var regEmail2 = $("#regEmail2").val();
    var regFirst = $("#regFirst").val();
    var regLast = $("#regLast").val();
    var regCompany = $("#regCompany").val();

    var regEmail2 = regEmail1;
    var regAdd1 = userProfile.Addr1;
    var regAdd2 = userProfile.Addr2;
    var regCity = userProfile.City;
    var regState = userProfile.StateName;
    var regZip = userProfile.Zip;

    /*              var regAdd1 = $("#regAdd1").val();
      var regAdd2 = $("#regAdd2").val();
      var regCity = $("#regCity").val();
      var regState = $("#regState").val();
      var regZip = $("#regZip").val();
    */              var regCountry = $("#regCountry").val();
    var checkOpt = $("#regOptOut:checked").val();
    if (checkOpt == "on")
        regOptOut = 1;
    else
        regOptOut = 0;

    if (regPW1.trim() != regPW2.trim())
        bootbox.alert("Passwords do not match.  Please correct.")
    else {
        if (!isValid(regPW1)) {
        }
        else { // Username, PW are OK
            if (regEmail1.trim() != regEmail2.trim())
                bootbox.alert("Email addresses do not match.  Please correct.")
            else {
                if ((regEmail1.trim().length == 0) || hasWhiteSpace(regEmail1))
                    bootbox.alert("Invalid email address.  Please correct.")
                else {
                    var ii = regEmail1.indexOf("@");
                    if (ii < 1)
                        bootbox.alert("Invalid email address.  Please correct.")
                    else {
                        var iii = regEmail1.lastIndexOf(".");
                        if (iii < ii || iii > regEmail1.length - 3)
                            bootbox.alert("Invalid email address.  Please correct.")
                        else { // Email is OK
                            /*                          if (regFirst.trim().length == 0)
                                            bootbox.alert("First Name is a required field.")
                                          else { // First Name is OK    
                                            if (regLast.trim().length == 0)
                                              bootbox.alert("Last Name is a required field.")
                                            else { // Last name is OK
                                              if (regCompany.trim().length == 0)
                                                bootbox.alert("Company is a required field.")
                                              else { // Company name is OK    
                                                if (regAdd1.trim().length == 0)
                                                  bootbox.alert("Address Line #1 is a required field.")
                                                else { // Address1 is OK
                                                  if (regCity.trim().length == 0)
                                                    bootbox.alert("City is a required field.")
                                                  else { // City is OK
                            */                        if (regCountry.trim().length == 0 || regCountry == "none" )
                                bootbox.alert("Country is a required field.")
                            else { // Country is OK
                                /*                                    if (regCountry.trim() == "United States" && regState.trim().length == 0)
                                                            bootbox.alert("State is required for US users.")
                                                          else { // State is OK
                                                            if (regCountry.trim() == "United States" && regZip.trim().length == 0)
                                                              bootbox.alert("Postal Code (Zip) is required for US users.")
                                                            else { // Zip (and everything else) is OK
                                */                          regReg = 0;

                                $.ajax({
                                    type: 'POST',
                                    async: false,
                                    url: './php/registerUser.php',
                                    data: {
                                        "registering": regReg,
                                        "userName": userName,
                                        "passWord": passWord,
                                        "newPW": regPW1,
                                        "eMail": regEmail1,
                                        "first": regFirst,
                                        "last": regLast,
                                        "company": regCompany,
                                        "address1": regAdd1,
                                        "address2": regAdd2,
                                        "city": regCity,
                                        "state": regState,
                                        "zip": regZip,
                                        "country": regCountry,
                                        "optOut": regOptOut
                                    },
                                    success: function(msg){
                                        if (msg.substring(0, 19) == "Duplicate user name")
                                            bootbox.alert("Sorry that User Name is already taken, try another.");
                                        else {
                                            if (msg.substring(0, 16) == "Invalid Password")
                                                bootbox.alert("Invalid Password, please login again before updating profile.");
                                            else {
                                                if (msg.substring(0, 34) == "A Username with that email address")
                                                    bootbox.alert(msg);
                                                else {
                                                    if (msg.substring(0, 2) == "OK") {
                                                        bootbox.alert("User Profile updated.")
                                                        worked = true;
                                                    }
                                                    else {
                                                        bootbox.alert("Error occurred updating.  Please try again.");
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    error: function(msg){
                                        bootbox.alert("Error occurred updating/registering.  Please try again.");
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    if( worked ) {

        passWord = regPW1;
        userProfile = {
            Addr1: regAdd1,
            Addr2: regAdd2,
            City: regCity,
            Company: regCompany,
            Country: regCountry,
            Email: regEmail1,
            FirstName: regFirst,
            LastName: regLast,
            OptOut: regOptOut,
            StateName: regState,
            Zip: regZip
        };
    }
}

function processFreeForm1(deltas1, freeForm1, nodIter1, index){

    freeForm1 = freeForm1.toUpperCase();
    freeForm1 = freeForm1.replace(/ +?/g, '');

    // format should be N1@XXX.XX,N2@XXX.XX,...
    // Where:
    //   N1, N2, etc are integers, indicating the number of repeated deltas with this value
    //     N1@, etc is optional (assumed = 1 if N1@ is missing)
    //     N1+N2+N3+... must add up to nodIter1-1 (if not, start adjusting from the back end)

    if( nodIter1 == 0 )
        return;

    var i = 0;
    var ind = 0;

    var num1 = "";
    var num2 = "";

    var ii = 1;
    var ff = 0.0;

    var badParse = false;

    var isCheckingNum1 = true;

    // accumulate numbers until we hit '@', ',', or end of line

    while (i < freeForm1.length) {
        if (freeForm1.charAt(i) == '@') {
            // done building num1
            isCheckingNum1 = false;
        }
        else {
            if (freeForm1.charAt(i) == ',' || freeForm1.charAt(i) == ';' ) {
                // done building num2
                if (isCheckingNum1) {
                    // this means there was no @, so num1 = 1
                    num2 = num1;
                    num1 = '1';
                }
                else
                    isCheckingNum1 = true;

                ii = parseInt(num1);
                if (ii != ii) {
                    ii = 1;
                    //                      if (num1 != '')
                    badParse = true;
                }
                ff = parseFloat(num2);
                if (ff != ff) {
                    ff = 0.0;
                    //                      if (num2 != '')
                    badParse = true;
                }

                for (var j = 0; j < ii; j++)
                    if (ind + j < nodIter1)
                        deltas1[ind + j][index] = ff;
                ind += ii;

                num1 = "";
                num2 = "";

            }
            else {
                if (((freeForm1.charAt(i) < '0') || (freeForm1.charAt(i) > '9')) &&
                (freeForm1.charAt(i) != '-') &&
                (freeForm1.charAt(i) != '.'))
                    badParse = true;
                else {
                    if (isCheckingNum1)
                        num1 += freeForm1.charAt(i); // part of the @
                    else
                        num2 += freeForm1.charAt(i); // part of the delta
                }
            }
        }
        i++;
    }

    if (isCheckingNum1) {
        // this means there was no @, so num1 = 1
        num2 = num1;
        num1 = '1';
    }

    ii = parseInt(num1);
    if (ii != ii) {
        ii = 1;
        if (num1 != '')
            badParse = true;
    }

    ff = parseFloat(num2);
    if (ff != ff) {
        ff = 0.0;
        if (num2 != '')
            badParse = true;
    }

    for ( var j=0; j<ii; j++ )
        if( ind + j < nodIter1 )
            deltas1[ind + j][index] = ff;
    ind += ii;

    // fill out to nodIter1 with last know value if not done yet

    for ( var j=ind; j<nodIter1; j++ )
        deltas1[j][index] = ff;

    return !badParse;
}

var signingIn = true;

function checkCookie(){
    var user = getCookie("username");
  
    var rememberMeChecked = getCookie("rememberCheck");
    if (rememberMeChecked == "on" && user != "") 
        $("#userLogInM").val(user);
    else 
        $("#userLogInM").val("");
}

function modalSignIn() {
    signingIn = true;
    checkCookie();  
    $('#signInOnlyM').show();
    $('#registerOnlyM').hide();
    $('#forgotM').hide();
    $('.wrnMsg').text('');
    $('#modalSignIn').modal('show');
    return false;
} 

function modalRegister() {
    signingIn = false;
    $('#signInOnlyM').hide();
    $('.wrnMsg').text('');
    $('#registerOnlyM').show();
    //              $('#modalSignInOK').text('Register');
} 

function isValidEmail(emailAddress) {
    var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
    return pattern.test(emailAddress);
};

function modalSign() {
    undoLevel = -1;    // initialize
    ctrlKeyDown = false;

    userLogIn = jQuery.trim($('#userLogInM').val());
    passWord = jQuery.trim($('#userPWM').val());

    var worked = false;
    // need to assign rights here too 
  
    if (signingIn) {
        if (isValid1(userLogIn) && isValid1(passWord)) {
            $.ajax({
                type: 'POST',
                async: false,
                url: './php/loginUserLong.php',
                data: {
                    "userName": userLogIn,
                    "passWord": passWord
                },
                success: function(msg){
                    if (msg.substring(0, 17) == "Invalid User Name") {
                        $('.wrnMsg').text("Invalid User Name.  Please register if you have not already.");
                        return;
                    }
                    else {
                        if (msg.substring(0, 16) == "Invalid Password") {
                            $('.wrnMsg').text("Invalid Password, try again.");
                            return;
                        }
                        else {
                            userName = jQuery.trim(userLogIn);
                            //                          userName1 = userName;
                            if (userName == userName1) 
                                editRights = true;
                            else 
                                editRights = false;
              
                            var userObj = JSON.parse(msg);
              
                            userProfile = {
                                Addr1: userObj.Addr1,
                                Addr2: userObj.Addr2,
                                City: userObj.City,
                                Company: userObj.Company,
                                Country: userObj.Country,
                                Email: userObj.Email,
                                FirstName: userObj.FirstName,
                                LastName: userObj.LastName,
                                OptOut: userObj.OptOut,
                                StateName: userObj.StateName,
                                Zip: userObj.Zip
                            };

                            defScale = userObj.DefScale;
                            displayLanguage = userObj.DisplayLanguage;
                            if( displayLanguage == 'Chinese' )
                                convertToChinese();
                            else
                                if( displayLanguage == 'Spanish' ) {
                                    convertToSpanish();
                                }

                            defaultUnits = userObj.DefaultUnits;
                            colMatch = int2Bool(userObj.ColMatch);
                            autoBreak = int2Bool(userObj.AutoBreak);
                            colType = jQuery.trim(userObj.ColMem);
                            colSplit = userObj.ColElem;
                            colEnd = userObj.ColEnd;
                            beamMatch = int2Bool(userObj.BeamMatch);
                            beamType = jQuery.trim(userObj.BeamMem);
                            beamSplit = userObj.BeamElem;
                            beamEnd = userObj.BeamEnd;
                            braceMatch = int2Bool(userObj.BraceMatch);
                            braceType = jQuery.trim(userObj.BraceMem);
                            braceSplit = userObj.BraceElem;
                            braceEnd = userObj.BraceEnd;
                            englishMem = int2Bool(userObj.EnglishMem);
                            metricMem = int2Bool(userObj.MetricMem);
                            englishMem1 = englishMem;
                            metricMem1 = metricMem;
                            pressStiff = userObj.PressStiff;
                            if (!pressStiff)
                                pressStiff = 0;
                            pressStiff = int2Bool(pressStiff);
                            nodInc = parseInt(userObj.NodIncr);
                            if( !nodInc )
                                nodInc = 10;
              
                            worked = true;
              
                        }
                    }
                },
                error: function(msg){
                    $('.wrnMsg').text("Invalid User Name.  Please register if you have not already.");
                    return;
                }
            });
        }
    }
    else {
        var regUserName = userLogIn;
        var regPW1 = passWord;
        if (!isValid1(regUserName) || !isValid1(regPW1)) { 
            return;
        }
        var regEmail1 = $("#emailM").val();
        if (!isValidEmail(regEmail1)) {
            $('.wrnMsg').text("Invalid email address.");
            return;
        }
    
        var regFirst = "";
        var regLast = "";
        var regCompany = "";
    
        var regAdd1 = "";
        var regAdd2 = "";
        var regCity = "";
        var regState = "";
        var regZip = "";
    
        var regCountry = $("#countryM").val();
    
        regCountry.trim();
        if (!regCountry || regCountry == "Country" || regCountry == "None" || regCountry == "" ) {
            $('.wrnMsg').text("Invalid/no country selected.");
            return;
        }
    
        regOptOut = 0; // default to no opt out
        var regReg = 1;
    
        $.ajax({
            type: 'POST',
            async: false,
            url: 'new/php/registerUser.php',
            data: {
                "registering": regReg,
                "userName": regUserName,
                "passWord": regPW1,
                "newPW": regPW1,
                "eMail": regEmail1,
                "first": regFirst,
                "last": regLast,
                "company": regCompany,
                "address1": regAdd1,
                "address2": regAdd2,
                "city": regCity,
                "state": regState,
                "zip": regZip,
                "country": regCountry,
                "optOut": regOptOut
            },
            success: function(msg){
                if (msg.substring(0, 19) == "Duplicate user name, choose another.") {
                    $('.wrnMsg').text("Invalid/no country selected.");
                    return;
                }
                else {
                    if (msg.substring(0, 34) == "A Username with that email address") {
                        $('.wrnMsg').text("A User Name with that email address already existes -- sign in under that User Name.");
                        return;
                    }
                    else {
                        if (msg.substring(0, 2) == "OK") {
                            worked = true;
                        }
                        else {
                            $('.wrnMsg').text("Error registering, try again.");
                            return;
                        }
                    }
                }
            },
            error: function(msg){
                $('.wrnMsg').text("Error registering, try again.");
                return;
            }
        });
    
        if (worked) {
            forumRegister(regUserName, regPW1, regEmail1, regFirst + " " + regLast);
      
            userName = regUserName;
            userLogIn = regUserName;
            passWord = regPW1;
            userProfile = {
                Addr1: regAdd1,
                Addr2: regAdd2,
                City: regCity,
                Company: regCompany,
                Country: regCountry,
                Email: regEmail1,
                FirstName: regFirst,
                LastName: regLast,
                OptOut: regOptOut,
                StateName: regState,
                Zip: regZip
            };
        }
    }

    if (worked) {
        validLogin = true;
        temporary = false;
        $('#logIn').hide();
        $('#signOut').text("Log Out");
        if (!signingIn) 
            setCookie("rememberCheck", "on", 1000);
      
        setCookie("username", userLogIn, 1000);
        
        setCookie("wp", passWord, 0.042) // set password cookie for 1 hr duration
        var uP = JSON.stringify(userProfile);
        setCookie("uP", uP, 0.042) // set password cookie for 1 hr duration
        resetMaterialList(true);
        resetMemberList(true);
        displayElement(currElmt);
        elemMenu();
        
        $.ajax({
            type: "POST",
            url: "./php/putUsersJob.php",
            data: {
                "userName": userName,
                "jobName": jobName,
                "userName1": userName1
            },
            success: function(msg){
            }
        });

        $.ajax({
            type: "POST",
            url: "./php/addShare.php",
            data: {"grantee": userName,
                "grantor": userName1,
                "jobName": jobName,
                "permission": "View"
            },
            success: function(msg){
            },
            error: function(msg){
            }
        });

        $('#modalSignIn').modal('hide');
    }
}

function makeLink() {
    // get id 
    if( temporary ) {
        if( !modalSignIn() )
            return;
    }
      
    if( !editRights ) 
        return;
  
    var link = "";
    $.ajax({
        type: 'POST',
        url: './php/makeLink.php',
        data: {
            "grantor": userName,
            "jobName": jobName
        },
        success: function(msg){
            link = msg;
            bootbox.alert("Email link for this model is: <strong>www.cloudcalc.com?id=" + link + "</strong>");
        },
        error: function(msg){
        }
    });
}

function setVariableView() {
    /*set the variable view and zoom level
    based on the bounding prism of the item*/
    maxMins = {
        xmin: xmin, 
        ymin: ymin, 
        zmin: zmin,
        xmax: xmax,
        ymax: ymax,
        zmax: zmax
    };

    //Find Average position
    avgPos = new THREE.Vector3 ( xmax + xmin, ymax + ymin, zmax + zmin);
    avgPos.multiplyScalar(1/2);
    //Find max difference from average
    maxDem = Math.max.apply(Math, [ 
        Math.max (Math.abs(xmax - avgPos.x), Math.abs(xmin - avgPos.x)),
        Math.max (Math.abs(ymax - avgPos.y), Math.abs(ymin - avgPos.y)),
        Math.max (Math.abs(zmax - avgPos.z), Math.abs(zmin - avgPos.z))
    ]);
    //look at average position
    scene.position.copy( avgPos.multiplyScalar(-1));
    pickingScene.position.copy ( scene. position );
    //camera.lookAt ( avgPos );
    //render();
    
    
    //adjust zoom to appropriate level
    if (maxDem > 120) {
        camera.zoom = 240 / maxDem;
        camera.updateProjectionMatrix();
    }
    adjustSpriteZoom();
    removeFloor();
    addFloor(0xf0f0f0)

}

function init(){

    //Run function when browser resizes
    canvas = document.getElementById('modelGraphics');
    
    canvas.label = 'loaded';
    container1 = document.getElementById('modelContainer');
  
    offset = canvas.getBoundingClientRect();
    offsetX = offset.left;
    offsetY = offset.top;

    init_window();
    init_camera(initial_view);
    init_scene();
    render();
    animate();

    initModElem();

    var mobile = function(){
        return {
            detect:function(){
                var uagent = navigator.userAgent.toLowerCase();
                var list = this.mobiles;
                var ismobile = false;
                for(var d=0;d<list.length;d+=1){
                    if(uagent.indexOf(list[d])!=-1){
                        ismobile = true;
                    }
                }
                return ismobile;
            },
            mobiles:[
              "midp","240x320","blackberry","netfront","nokia","panasonic",
              "portalmmm","sharp","sie-","sonyericsson","symbian",
              "windows ce","benq","mda","mot-","opera mini",
              "philips","pocket pc","sagem","samsung","sda",
              "sgh-","vodafone","xda","palm","iphone",
              "ipod","android","webos","iemobile","opera mini"
            ]
        };
    }();

    if(mobile.detect()){
        isMobile = true;
        //                  alert('You are using a mobile phone to view this page..');
    }
    else{
        isMobile = false;
        //                  alert('You are using a desktop browser to view this page..');
    }

    if( !isMobile ) {
        lMemTable = $('#localMemLibTable').dataTable(  );

        gMemTable = $('#globalMemLibTable').dataTable();
        gMemTable.fnClearTable();

        lMatTable = $('#localMatLibTable').dataTable(  );

        gMatTable = $('#globalMatLibTable').dataTable();
    }

    oNodeTable = $('#nodalCoordTable').dataTable();

    oMLTable = $('#modelListTable').dataTable();

    oLCTable = $('#loadCaseTable').dataTable();
    oLCTable.fnSettings().oScroll.sX = "100%";

    oShTable = $('#collaborateTable').dataTable();
    oOpTable = $('#openTable').dataTable();
  
    oTable1 = $('#dispTable').dataTable();
    oTableF = $('#freqTable').dataTable();
    oTable2 = $('#forceTable').dataTable();
    oTable3 = $('#stressTable').dataTable();
    oTable4 = $('#complyTable').dataTable();
    oTable5 = $('#reactTable').dataTable();

    gN = $('#groupName').magicSuggest({
        useCommaKey: true,
        data: 'Column,Beam,Brace'
    });

    gNM = $('#groupNameM').magicSuggest({    // modal
        useCommaKey: true,
        data: 'Column,Beam,Brace'
    });
    
    gNS = $('#groupSelectM').magicSuggest({    // group select
        useCommaKey: true,
        allowFreeEntries: false,
        data: 'Column,Beam,Brace'
    });

    //Get the canvas & context
    c = $('#modelGraphics');
    cLabel = $('#labelCanvas');
    container = $(c).parent();

    q = param();
  
    if( q.hasOwnProperty("id") ) {
    
        var linkKey = q["id"][0];
        linkJob = {};
        $.ajax({
            url: './php/getLink.php',
            async: false,
            type: 'POST',
            data: {
                "linkKey": linkKey
            },
            success: function(data){
                if( data )
                    linkJob = JSON.parse(data);
            },
            error: function(data){
                window.open("index.html", "_self");
            }
        });

        if( !linkJob["JobName"] || !linkJob["Grantor"] )  
            window.open("index.html", "_self");

        // they came in via link, don't make them sign in

        temporary = true;
        $('#logIn').show();
        $('#signOut').text("Exit");
        editRights = false;
    
        userName = "TemporaryGuest54321";
        jobName = jQuery.trim(linkJob["JobName"]);
        userName1 = linkJob["Grantor"];

        passWord = "password";

        resetMaterialList(true);
        resetMemberList(true);

        undoLevel = -1; // initialize
        ctrlKeyDown = false;


        //                getPassedJob(jobName, userName1);
        displayPassedJobName(jobName,userName1);
        goGetPassedJob(jobName,userName1);

        if( isMobile ) 
            allGraphics = true;
        else
            allGraphics = false;
    }
    else {
        allGraphics = true;
        if( isMobile )
            showScreen("allGraphics");
        temporary = false;
        $('#logIn').hide();
        $('#signOut').text("Log Out");
    
        if( !getUserPW() )
            showScreen("signIn");
    }

    $('#showShared').click(function(e){
        showShared = ($('#showShared').is(':checked'));
        var jobs = returnAvailableJobs();
        selectJob2Open(jobs);
    });

    $('#printReport').click(function(e){
        printReport();
    });

    $('div.hero-unit').click(function(e){
        if (heroActive) {
            allGraphics = true;
            showScreen("allGraphics");
        }
    });

    $('#hero1').click(function(e){
        if( isMobile ) {
            if (allGraphics) {
                allGraphics = false;
                $('#hero1').html('<h4><img src="assets/img/left-arrow-1.png">CloudCalc</h4>');
                showScreen(savedScreen);
            }
            else {
                allGraphics = true;
                $('#hero1').html('<img src="assets/img/right-arrow-1.png">');
                showScreen("allGraphics");
            }
        }
        else { 
            allGraphics = false;
            showScreen(savedScreen);
        }
    });

    if( isMobile ) {
        $('#hero2').click(function(e){
            allGraphics = true;
            $('#hero1').html('<img src="assets/img/right-arrow-1.png">');
            showScreen(savedScreen);
        });

        $('#hero3').click(function(e){
            if (allGraphics) {
                allGraphics = false;
                $('#hero3').html('<h4><img src="assets/img/left-arrow-1.png">CloudCalc</h4>');
            }
            else {
                allGraphics = true;
                $('#hero1').html('<img src="assets/img/right-arrow-1.png">');
            }
            showScreen(savedScreen);
        });
    }

    /*  $('#deleteJob').click(function(e){
        e.preventDefault();
        var job = jobList.options[jobList.selectedIndex].text;
        if (job == jobName)
          bootbox.alert("Cannot delete an open job.");
        else {
          bootbox.confirm("Deleting " + job + " -- Are you sure?", function(result){
    //                    event.preventDefault();
            if (result) {
    //                      $('#mySelect :selected').remove();
              $("#jobList :selected").remove();
              $.ajax({
                url: './php/deleteJobTables.php',
                type: 'POST',
                data: {
                  "userName": userName1,
                  "jobName": job
                },
                success: function(msg){
                }
              });
            }
          });
        }
      });
    */
    $('#openJob').click(function(e){
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
      
        var jobs = returnAvailableJobs();
        selectJob2Open(jobs);
    });

    $('#configuration').click(function(e){
        $('#defScale').val(defScale);
        $('#nodInc').val(nodInc);
        $('#language').val(displayLanguage);
        $('#defaultUnits').val(defaultUnits);

        $('#autoBreak').attr('checked', autoBreak);

        $('#colMatch').attr('checked', colMatch);
        //                $('#colMem').val(colType);

        //Get select object
        var objSelect = document.getElementById("colMem");
        //Set selected
        setSelectedValue(objSelect, colType);

        $('#colElem').val(colSplit);
        if( colEnd == 0 )
            $('#colEnd').val('Fixed');
        else if( colEnd == 1 )
            $('#colEnd').val('Pinned');
        else
            $('#colEnd').val('(none)');

        $('#beamMatch').attr('checked', beamMatch);
        //                $('#beamMem').val(beamType);

        //Get select object
        objSelect = document.getElementById("beamMem");
        //Set selected
        setSelectedValue(objSelect, beamType);

        $('#beamElem').val(beamSplit);
        if( beamEnd == 0 )
            $('#beamEnd').val('Fixed');
        else if( beamEnd == 1 )
            $('#beamEnd').val('Pinned');
        else
            $('#beamEnd').val('(none)');

        $('#braceMatch').attr('checked', braceMatch);
        //                $('#braceMem').val(braceType);

        //Get select object
        objSelect = document.getElementById("braceMem");
        //Set selected
        setSelectedValue(objSelect, braceType);

        $('#braceElem').val(braceSplit);
        if( braceEnd == 0 )
            $('#braceEnd').val('Fixed');
        else if( braceEnd == 1 )
            $('#braceEnd').val('Pinned');
        else
            $('#braceEnd').val('(none)');

        $('#englishMem').attr('checked', englishMem);
        $('#metricMem').attr('checked', metricMem);

        $('#pressStiff').attr('checked', pressStiff);

        $('#configurationScreen').modal('show');
    });

    $('#saveConfig').click(function(e){
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
      
        defScale = $('#defScale').val();
        displayLanguage = $('#language').val();

        if( displayLanguage == 'English' )
            convertToEnglish();
        if( displayLanguage == 'Chinese' )
            convertToChinese();
        else
            if( displayLanguage == 'Spanish' ) {
                convertToSpanish();
            }
        defaultUnits = $('#defaultUnits').val();

        autoBreak = ($('#autoBreak').is(':checked'))

        colMatch = ($('#colMatch').is(':checked'))
        colType = $('#colMem').val();
        colSplit = parseInt($('#colElem').val());
        if( $('#colEnd').val() == 'Fixed')
            colEnd = 0;
        else if( $('#colEnd').val() == 'Pinned')
            colEnd = 1;
        else
            colEnd = -1;

        beamMatch = ($('#beamMatch').is(':checked'))
        beamType = $('#beamMem').val();
        beamSplit = parseInt($('#beamElem').val());
        if( $('#beamEnd').val() == 'Fixed')
            beamEnd = 0;
        else if( $('#beamEnd').val() == 'Pinned')
            beamEnd = 1;
        else
            beamEnd = -1;

        braceMatch = ($('#braceMatch').is(':checked'))
        braceType = $('#braceMem').val();
        braceSplit = parseInt($('#braceElem').val());
        if( $('#braceEnd').val() == 'Fixed')
            braceEnd = 0;
        else if( $('#braceEnd').val() == 'Pinned')
            braceEnd = 1;
        else
            braceEnd = -1;

        englishMem = ($('#englishMem').is(':checked'))
        metricMem = ($('#metricMem').is(':checked'))

        englishMem1 = englishMem;
        metricMem1 = metricMem;
    
        pressStiff = ($('#pressStiff').is(':checked'))

        nodInc = parseInt($('#nodInc').val());

        if (totEls == 0) {
            tN = nodInc;
            $('#fromNode').val(tN)
            tN += nodInc;
            tN = getNewNode(tN);
            $('#toNode').val(tN)
        }

        $.ajax({
            url: './php/putConfig.php',
            type: 'POST',
            data: {
                "userName": userName,
                "jobName": jobName,
                "defScale": defScale,
                "displayLanguage": displayLanguage,
                "defaultUnits": defaultUnits,
                "autoBreak": bool2Int(autoBreak),
                "colMatch": bool2Int(colMatch),
                "colMem": colType,
                "colElem": colSplit,
                "colEnd": colEnd,
                "beamMatch": bool2Int(beamMatch),
                "beamMem": beamType,
                "beamElem": beamSplit,
                "beamEnd": beamEnd,
                "braceMatch": bool2Int(braceMatch),
                "braceMem": braceType,
                "braceElem": braceSplit,
                "braceEnd": braceEnd,
                "englishMem": bool2Int(englishMem),
                "metricMem": bool2Int(metricMem),
                "pressStiff": bool2Int(pressStiff),
                "nodInc": nodInc
            },
            success: function(msg){
                //                      alert(msg);
            },
            error: function(msg){
                //                      alert(msg);
            }
        });

        $('#configurationScreen').modal('hide');

    });

    function showUnits() {

        $('#unitSet').val(unitSet);

        var uTable = $('#unitsTable').dataTable();
        uTable.fnClearTable();
        uTable.fnSort([]);

        var row;

        setUnits(unitSet, false, true );

        row = ['Force', uNameForceX, uConstForceX];
        uTable.fnAddData(row);
        row = ['Length', uNameLengthX, uConstLengthX];
        uTable.fnAddData(row);
        row = ['Moment Out', uNameMomOutX, uConstMomOutX];
        uTable.fnAddData(row);
        row = ['Stress', uNameStressX, uConstStressX];
        uTable.fnAddData(row);
        row = ['Uniform Load', uNameUnifX, uConstUnifX];
        uTable.fnAddData(row);
        row = ['Weight', uNameWeightX, uConstWeightX];
        uTable.fnAddData(row);

    }

    $('#units').click(function(e){
        unitSet = currentUnits;
        showUnits();
        $('#unitsScreen').modal('show');
    });

    $('#unitSet').change(function() {

        unitSet = $('#unitSet').val();
        showUnits();
    });

    $('#convertUnits').click(function(e) {
        if( !editRights )
            return;

        for (i = 1; i <= totEls; i++) {
            modelElements[i].dX *= (uConstLengthX / uConstLength);
            modelElements[i].dY *= (uConstLengthX / uConstLength);
            modelElements[i].dZ *= (uConstLengthX / uConstLength);
            modelElements[i].uX *= (uConstUnifX / uConstUnif);
            modelElements[i].uY *= (uConstUnifX / uConstUnif);
            modelElements[i].uZ *= (uConstUnifX / uConstUnif);
            modelElements[i].fromFXLoad *= (uConstForceX / uConstForce);
            modelElements[i].fromFYLoad *= (uConstForceX / uConstForce);
            modelElements[i].fromFZLoad *= (uConstForceX / uConstForce);
            modelElements[i].fromMXLoad *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].fromMYLoad *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].fromMZLoad *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].toFXLoad *= (uConstForceX / uConstForce);
            modelElements[i].toFYLoad *= (uConstForceX / uConstForce);
            modelElements[i].toFZLoad *= (uConstForceX / uConstForce);
            modelElements[i].toMXLoad *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].toMYLoad *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].toMZLoad *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));

            modelElements[i].uXL *= (uConstUnifX / uConstUnif);
            modelElements[i].uYL *= (uConstUnifX / uConstUnif);
            modelElements[i].uZL *= (uConstUnifX / uConstUnif);
            modelElements[i].fromFXLoadL *= (uConstForceX / uConstForce);
            modelElements[i].fromFYLoadL *= (uConstForceX / uConstForce);
            modelElements[i].fromFZLoadL *= (uConstForceX / uConstForce);
            modelElements[i].fromMXLoadL *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].fromMYLoadL *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].fromMZLoadL *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].toFXLoadL *= (uConstForceX / uConstForce);
            modelElements[i].toFYLoadL *= (uConstForceX / uConstForce);
            modelElements[i].toFZLoadL *= (uConstForceX / uConstForce);
            modelElements[i].toMXLoadL *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].toMYLoadL *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].toMZLoadL *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));

            modelElements[i].uXO *= (uConstUnifX / uConstUnif);
            modelElements[i].uYO *= (uConstUnifX / uConstUnif);
            modelElements[i].uZO *= (uConstUnifX / uConstUnif);
            modelElements[i].fromFXLoadO *= (uConstForceX / uConstForce);
            modelElements[i].fromFYLoadO *= (uConstForceX / uConstForce);
            modelElements[i].fromFZLoadO *= (uConstForceX / uConstForce);
            modelElements[i].fromMXLoadO *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].fromMYLoadO *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].fromMZLoadO *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].toFXLoadO *= (uConstForceX / uConstForce);
            modelElements[i].toFYLoadO *= (uConstForceX / uConstForce);
            modelElements[i].toFZLoadO *= (uConstForceX / uConstForce);
            modelElements[i].toMXLoadO *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].toMYLoadO *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));
            modelElements[i].toMZLoadO *= (uConstForceX * uConstLengthX / (uConstForce * uConstLength));

            modelElements[i].lX *= (uConstLengthX / uConstLength);
            modelElements[i].lY *= (uConstLengthX / uConstLength);
            modelElements[i].lZ *= (uConstLengthX / uConstLength);
      
            modelElements[i].stiffDist *= (uConstLengthX / uConstLength);
            modelElements[i].stiffI *= ((uConstLengthX / uConstLength) * (uConstLengthX / uConstLength) *
                                           (uConstLengthX / uConstLength) * (uConstLengthX / uConstLength));
            modelElements[i].pressure *= (uConstStressX / uConstStress );
            modelElements[i].pipOD *= (uConstLengthX / uConstLength );
            modelElements[i].pipTh *= (uConstLengthX / uConstLength );
        }

        var modelElement = JSON.stringify(modelElements);

        $.ajax({
            type: "POST",
            url: "./php/storeAllElements.php",
            data: { "userName": userName1, "jobName": jobName, "modelElements": modelElement },
            success: function(msg){
                //                   alert(msg);
            }
        });

        oNodeTable.fnClearTable();
        oNodeTable.fnSort([]);

        for( i=0; i<fNodes.length; i++ ) {
            fNodes[i].x *= (uConstLengthX/uConstLength);
            fNodes[i].y *= (uConstLengthX/uConstLength);
            fNodes[i].z *= (uConstLengthX/uConstLength);
            oNodeTable.fnAddData([fNodes[i].node, fNodes[i].x, fNodes[i].y, fNodes[i].z, '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>','<a class="duplicate" href="">Array</a>']);
        }

        if (fNodes.length != 0) {
            var fNode = JSON.stringify(fNodes);

            $.ajax({
                type: "POST",
                url: "./php/storeAllNodes.php",
                data: {
                    "userName": userName1,
                    "jobName": jobName,
                    "fNodes": fNode
                },
                success: function(msg){
                    //                     alert(msg);
                }
            });
        }

        currentUnits = unitSet;
        setUnits(currentUnits, true, false);

        displayUnitLabels();

        setUndo(0, 0 /* , 3 */ );

        storeUnits();
        displayElement(currElmt);
        populateModelView();

        //                $('#unitsScreen').modal('hide');
    });

    $('#cIS2').click(function(e){
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
      
        $('#cIS2UserName').val(userName);
        $('#cIS2JobName').val(jobName);
        $('#cIS2Units').val(defaultUnits);
        document.getElementById('cis2ImportProcess').style.visibility = 'hidden';
        document.getElementById('cis2ImportForm').style.visibility = 'visible';
        $('#importJob').val(jobName);
        $('#cIS2SelectScreen').modal('show');
    });

    $('#cIS2OK').click(function(e){
        getNotes();
        var jobUnits = getSpecificJobUnits(jobName);
        buildJobUnits(jobUnits);
        var jobNodeCoords = getSpecificJobNodeCoords(jobName);
        buildJobNodeCoords(jobNodeCoords);
        var jobLoadCases = getSpecificJobLoadCases(jobName);
        buildJobLoadCases(jobLoadCases);
        var jobData = getSpecificJob(jobName);
        buildJobArrays(jobData);
        var shareData = getSpecificJobShares(jobName);
        buildShareArrays(shareData);

        $('#cIS2SelectScreen').modal('hide');
    });

    $('#portalTemplate').click(function(e) {
        $('#modalPortal').modal('show');
    });

    $('#kneeBraceTemplate').click(function(e) {
        $('#modalKneeBrace').modal('show');
    });

    $('#modalPortalOK').click(function(e) {
        userName1 = userName;
        editRights = true;
        var a = parseFloat($('#a_Dim_1').val());
        if( isNaN(a) )
            a = 100;    // pick a number
        var b = -parseFloat($('#b_Dim_1').val());
        if( isNaN(b) )
            b = -100;    // pick a number
      
        resetJobData(jobName);
        modelElements = [{},
                         { jobName:jobName,
                             order: 1,
                             keyID: randomInteger(10000000),
                             fromNode: 10,
                             toNode: 20,
                             dX: 0.0,
                             dY: a,
                             dZ: 0.0,
                             memberType: colType,
                             pipOD: 0.0,
                             pipTh: 0.0,
                             betaAngle: 0,
                             material: materialTypeArray[0],
                             fromFXRest: true,
                             fromFYRest: true,
                             fromFZRest: true,
                             fromMXRest: true,
                             fromMYRest: true,
                             fromMZRest: true,
                             toFXRest: false,
                             toFYRest: false,
                             toFZRest: false,
                             toMXRest: false,
                             toMYRest: false,
                             toMZRest: false,
                             fromFXMemb: false,
                             fromFYMemb: false,
                             fromFZMemb: false,
                             fromMXMemb: false,
                             fromMYMemb: false,
                             fromMZMemb: false,
                             toFXMemb: false,
                             toFYMemb: false,
                             toFZMemb: false,
                             toMXMemb: false,
                             toMYMemb: false,
                             toMZMemb: false,
                             uX: 0.0,
                             uY: 0.0,
                             uZ: 0.0,
                             fromFXLoad: 0.0,
                             fromFYLoad: 0.0,
                             fromFZLoad: 0.0,
                             fromMXLoad: 0.0,
                             fromMYLoad: 0.0,
                             fromMZLoad: 0.0,
                             toFXLoad: 0.0,
                             toFYLoad: 0.0,
                             toFZLoad: 0.0,
                             toMXLoad: 0.0,
                             toMYLoad: 0.0,
                             toMZLoad: 0.0,

                             uXL: 0.0,
                             uYL: 0.0,
                             uZL: 0.0,
                             fromFXLoadL: 0.0,
                             fromFYLoadL: 0.0,
                             fromFZLoadL: 0.0,
                             fromMXLoadL: 0.0,
                             fromMYLoadL: 0.0,
                             fromMZLoadL: 0.0,
                             toFXLoadL: 0.0,
                             toFYLoadL: 0.0,
                             toFZLoadL: 0.0,
                             toMXLoadL: 0.0,
                             toMYLoadL: 0.0,
                             toMZLoadL: 0.0,

                             uXO: 0.0,
                             uYO: 0.0,
                             uZO: 0.0,
                             fromFXLoadO: 0.0,
                             fromFYLoadO: 0.0,
                             fromFZLoadO: 0.0,
                             fromMXLoadO: 0.0,
                             fromMYLoadO: 0.0,
                             fromMZLoadO: 0.0,
                             toFXLoadO: 0.0,
                             toFYLoadO: 0.0,
                             toFZLoadO: 0.0,
                             toMXLoadO: 0.0,
                             toMYLoadO: 0.0,
                             toMZLoadO: 0.0,

                             lX: 0.0,
                             lY: 0.0,
                             lZ: 0.0,
                             kX: 0.0,
                             kY: 0.0,
                             kZ: 0.0,

                             cBZ: 0.0,
                             cBY: 0.0,
                             stable: false,

                             stiffDist: 0.0,
                             stiffI: 0.0,
                             tfaStiff: false,
                             pressure: 0.0,
                             fluid: 0.0,
                             group: "",
                             hidden: false,

                             totEls: 6 },
                         { jobName:jobName,
                             order: 2,
                             keyID: randomInteger(10000000),
                             fromNode: 20,
                             toNode: 30,
                             dX: 0.0,
                             dY: a,
                             dZ: 0.0,
                             memberType: colType,
                             pipOD: 0.0,
                             pipTh: 0.0,
                             betaAngle: 0,
                             material: materialTypeArray[0],
                             fromFXRest: false,
                             fromFYRest: false,
                             fromFZRest: false,
                             fromMXRest: false,
                             fromMYRest: false,
                             fromMZRest: false,
                             toFXRest: false,
                             toFYRest: false,
                             toFZRest: false,
                             toMXRest: false,
                             toMYRest: false,
                             toMZRest: false,
                             fromFXMemb: false,
                             fromFYMemb: false,
                             fromFZMemb: false,
                             fromMXMemb: false,
                             fromMYMemb: false,
                             fromMZMemb: false,
                             toFXMemb: false,
                             toFYMemb: false,
                             toFZMemb: false,
                             toMXMemb: false,
                             toMYMemb: false,
                             toMZMemb: false,
                             uX: 0.0,
                             uY: 0.0,
                             uZ: 0.0,
                             fromFXLoad: 0.0,
                             fromFYLoad: 0.0,
                             fromFZLoad: 0.0,
                             fromMXLoad: 0.0,
                             fromMYLoad: 0.0,
                             fromMZLoad: 0.0,
                             toFXLoad: 0.0,
                             toFYLoad: 0.0,
                             toFZLoad: 0.0,
                             toMXLoad: 0.0,
                             toMYLoad: 0.0,
                             toMZLoad: 0.0,

                             uXL: 0.0,
                             uYL: 0.0,
                             uZL: 0.0,
                             fromFXLoadL: 0.0,
                             fromFYLoadL: 0.0,
                             fromFZLoadL: 0.0,
                             fromMXLoadL: 0.0,
                             fromMYLoadL: 0.0,
                             fromMZLoadL: 0.0,
                             toFXLoadL: 0.0,
                             toFYLoadL: 0.0,
                             toFZLoadL: 0.0,
                             toMXLoadL: 0.0,
                             toMYLoadL: 0.0,
                             toMZLoadL: 0.0,

                             uXO: 0.0,
                             uYO: 0.0,
                             uZO: 0.0,
                             fromFXLoadO: 0.0,
                             fromFYLoadO: 0.0,
                             fromFZLoadO: 0.0,
                             fromMXLoadO: 0.0,
                             fromMYLoadO: 0.0,
                             fromMZLoadO: 0.0,
                             toFXLoadO: 0.0,
                             toFYLoadO: 0.0,
                             toFZLoadO: 0.0,
                             toMXLoadO: 0.0,
                             toMYLoadO: 0.0,
                             toMZLoadO: 0.0,

                             lX: 0.0,
                             lY: 0.0,
                             lZ: 0.0,
                             kX: 0.0,
                             kY: 0.0,
                             kZ: 0.0,

                             cBZ: 0.0,
                             cBY: 0.0,

                             stable: false,

                             stiffDist: 0.0,
                             stiffI: 0.0,
                             tfaStiff: false,
                             pressure: 0.0,
                             fluid: 0.0,
                             group: "",
                             hidden: false,

                             totEls: 6 },
                         { jobName:jobName,
                             order: 3,
                             keyID: randomInteger(10000000),
                             fromNode: 110,
                             toNode: 120,
                             dX: 0.0,
                             dY: a,
                             dZ: 0.0,
                             memberType: colType,
                             pipOD: 0.0,
                             pipTh: 0.0,
                             betaAngle: 0,
                             material: materialTypeArray[0],
                             fromFXRest: true,
                             fromFYRest: true,
                             fromFZRest: true,
                             fromMXRest: true,
                             fromMYRest: true,
                             fromMZRest: true,
                             toFXRest: false,
                             toFYRest: false,
                             toFZRest: false,
                             toMXRest: false,
                             toMYRest: false,
                             toMZRest: false,
                             fromFXMemb: false,
                             fromFYMemb: false,
                             fromFZMemb: false,
                             fromMXMemb: false,
                             fromMYMemb: false,
                             fromMZMemb: false,
                             toFXMemb: false,
                             toFYMemb: false,
                             toFZMemb: false,
                             toMXMemb: false,
                             toMYMemb: false,
                             toMZMemb: false,
                             uX: 0.0,
                             uY: 0.0,
                             uZ: 0.0,
                             fromFXLoad: 0.0,
                             fromFYLoad: 0.0,
                             fromFZLoad: 0.0,
                             fromMXLoad: 0.0,
                             fromMYLoad: 0.0,
                             fromMZLoad: 0.0,
                             toFXLoad: 0.0,
                             toFYLoad: 0.0,
                             toFZLoad: 0.0,
                             toMXLoad: 0.0,
                             toMYLoad: 0.0,
                             toMZLoad: 0.0,

                             uXL: 0.0,
                             uYL: 0.0,
                             uZL: 0.0,
                             fromFXLoadL: 0.0,
                             fromFYLoadL: 0.0,
                             fromFZLoadL: 0.0,
                             fromMXLoadL: 0.0,
                             fromMYLoadL: 0.0,
                             fromMZLoadL: 0.0,
                             toFXLoadL: 0.0,
                             toFYLoadL: 0.0,
                             toFZLoadL: 0.0,
                             toMXLoadL: 0.0,
                             toMYLoadL: 0.0,
                             toMZLoadL: 0.0,

                             uXO: 0.0,
                             uYO: 0.0,
                             uZO: 0.0,
                             fromFXLoadO: 0.0,
                             fromFYLoadO: 0.0,
                             fromFZLoadO: 0.0,
                             fromMXLoadO: 0.0,
                             fromMYLoadO: 0.0,
                             fromMZLoadO: 0.0,
                             toFXLoadO: 0.0,
                             toFYLoadO: 0.0,
                             toFZLoadO: 0.0,
                             toMXLoadO: 0.0,
                             toMYLoadO: 0.0,
                             toMZLoadO: 0.0,

                             lX: 0.0,
                             lY: 0.0,
                             lZ: 0.0,
                             kX: 0.0,
                             kY: 0.0,
                             kZ: 0.0,

                             cBZ: 0.0,
                             cBY: 0.0,

                             stable: false,

                             stiffDist: 0.0,
                             stiffI: 0.0,
                             tfaStiff: false,
                             pressure: 0.0,
                             fluid: 0.0,
                             group: "",
                             hidden: false,

                             totEls: 6 },
                         { jobName:jobName,
                             order: 4,
                             keyID: randomInteger(10000000),
                             fromNode: 120,
                             toNode: 130,
                             dX: 0.0,
                             dY: a,
                             dZ: 0.0,
                             memberType: colType,
                             pipOD: 0.0,
                             pipTh: 0.0,
                             betaAngle: 0,
                             material: materialTypeArray[0],
                             fromFXRest: false,
                             fromFYRest: false,
                             fromFZRest: false,
                             fromMXRest: false,
                             fromMYRest: false,
                             fromMZRest: false,
                             toFXRest: false,
                             toFYRest: false,
                             toFZRest: false,
                             toMXRest: false,
                             toMYRest: false,
                             toMZRest: false,
                             fromFXMemb: false,
                             fromFYMemb: false,
                             fromFZMemb: false,
                             fromMXMemb: false,
                             fromMYMemb: false,
                             fromMZMemb: false,
                             toFXMemb: false,
                             toFYMemb: false,
                             toFZMemb: false,
                             toMXMemb: false,
                             toMYMemb: false,
                             toMZMemb: false,
                             uX: 0.0,
                             uY: 0.0,
                             uZ: 0.0,
                             fromFXLoad: 0.0,
                             fromFYLoad: 0.0,
                             fromFZLoad: 0.0,
                             fromMXLoad: 0.0,
                             fromMYLoad: 0.0,
                             fromMZLoad: 0.0,
                             toFXLoad: 0.0,
                             toFYLoad: 0.0,
                             toFZLoad: 0.0,
                             toMXLoad: 0.0,
                             toMYLoad: 0.0,
                             toMZLoad: 0.0,

                             uXL: 0.0,
                             uYL: 0.0,
                             uZL: 0.0,
                             fromFXLoadL: 0.0,
                             fromFYLoadL: 0.0,
                             fromFZLoadL: 0.0,
                             fromMXLoadL: 0.0,
                             fromMYLoadL: 0.0,
                             fromMZLoadL: 0.0,
                             toFXLoadL: 0.0,
                             toFYLoadL: 0.0,
                             toFZLoadL: 0.0,
                             toMXLoadL: 0.0,
                             toMYLoadL: 0.0,
                             toMZLoadL: 0.0,

                             uXO: 0.0,
                             uYO: 0.0,
                             uZO: 0.0,
                             fromFXLoadO: 0.0,
                             fromFYLoadO: 0.0,
                             fromFZLoadO: 0.0,
                             fromMXLoadO: 0.0,
                             fromMYLoadO: 0.0,
                             fromMZLoadO: 0.0,
                             toFXLoadO: 0.0,
                             toFYLoadO: 0.0,
                             toFZLoadO: 0.0,
                             toMXLoadO: 0.0,
                             toMYLoadO: 0.0,
                             toMZLoadO: 0.0,

                             lX: 0.0,
                             lY: 0.0,
                             lZ: 0.0,
                             kX: 0.0,
                             kY: 0.0,
                             kZ: 0.0,

                             cBZ: 0.0,
                             cBY: 0.0,

                             stable: false,

                             stiffDist: 0.0,
                             stiffI: 0.0,
                             tfaStiff: false,
                             pressure: 0.0,
                             fluid: 0.0,
                             group: "",
                             hidden: false,

                             totEls: 6 },
                         { jobName:jobName,
                             order: 5,
                             keyID: randomInteger(10000000),
                             fromNode: 20,
                             toNode: 120,
                             dX: 0.0,
                             dY: 0.0,
                             dZ: b,
                             memberType: beamType,
                             pipOD: 0.0,
                             pipTh: 0.0,
                             betaAngle: 0,
                             material: materialTypeArray[0],
                             fromFXRest: false,
                             fromFYRest: false,
                             fromFZRest: false,
                             fromMXRest: false,
                             fromMYRest: false,
                             fromMZRest: false,
                             toFXRest: false,
                             toFYRest: false,
                             toFZRest: false,
                             toMXRest: false,
                             toMYRest: false,
                             toMZRest: false,
                             fromFXMemb: false,
                             fromFYMemb: false,
                             fromFZMemb: false,
                             fromMXMemb: false,
                             fromMYMemb: false,
                             fromMZMemb: false,
                             toFXMemb: false,
                             toFYMemb: false,
                             toFZMemb: false,
                             toMXMemb: false,
                             toMYMemb: false,
                             toMZMemb: false,
                             uX: 0.0,
                             uY: 0.0,
                             uZ: 0.0,
                             fromFXLoad: 0.0,
                             fromFYLoad: 0.0,
                             fromFZLoad: 0.0,
                             fromMXLoad: 0.0,
                             fromMYLoad: 0.0,
                             fromMZLoad: 0.0,
                             toFXLoad: 0.0,
                             toFYLoad: 0.0,
                             toFZLoad: 0.0,
                             toMXLoad: 0.0,
                             toMYLoad: 0.0,
                             toMZLoad: 0.0,

                             uXL: 0.0,
                             uYL: 0.0,
                             uZL: 0.0,
                             fromFXLoadL: 0.0,
                             fromFYLoadL: 0.0,
                             fromFZLoadL: 0.0,
                             fromMXLoadL: 0.0,
                             fromMYLoadL: 0.0,
                             fromMZLoadL: 0.0,
                             toFXLoadL: 0.0,
                             toFYLoadL: 0.0,
                             toFZLoadL: 0.0,
                             toMXLoadL: 0.0,
                             toMYLoadL: 0.0,
                             toMZLoadL: 0.0,

                             uXO: 0.0,
                             uYO: 0.0,
                             uZO: 0.0,
                             fromFXLoadO: 0.0,
                             fromFYLoadO: 0.0,
                             fromFZLoadO: 0.0,
                             fromMXLoadO: 0.0,
                             fromMYLoadO: 0.0,
                             fromMZLoadO: 0.0,
                             toFXLoadO: 0.0,
                             toFYLoadO: 0.0,
                             toFZLoadO: 0.0,
                             toMXLoadO: 0.0,
                             toMYLoadO: 0.0,
                             toMZLoadO: 0.0,

                             lX: 0.0,
                             lY: 0.0,
                             lZ: 0.0,
                             kX: 0.0,
                             kY: 0.0,
                             kZ: 0.0,

                             cBZ: 0.0,
                             cBY: 0.0,

                             stable: false,

                             stiffDist: 0.0,
                             stiffI: 0.0,
                             tfaStiff: false,
                             pressure: 0.0,
                             fluid: 0.0,
                             group: "",
                             hidden: false,

                             totEls: 6 },
                         { jobName:jobName,
                             order: 6,
                             keyID: randomInteger(10000000),
                             fromNode: 30,
                             toNode: 130,
                             dX: 0.0,
                             dY: 0.0,
                             dZ: b,
                             memberType: beamType,
                             pipOD: 0.0,
                             pipTh: 0.0,
                             betaAngle: 0,
                             material: materialTypeArray[0],
                             fromFXRest: false,
                             fromFYRest: false,
                             fromFZRest: false,
                             fromMXRest: false,
                             fromMYRest: false,
                             fromMZRest: false,
                             toFXRest: false,
                             toFYRest: false,
                             toFZRest: false,
                             toMXRest: false,
                             toMYRest: false,
                             toMZRest: false,
                             fromFXMemb: false,
                             fromFYMemb: false,
                             fromFZMemb: false,
                             fromMXMemb: false,
                             fromMYMemb: false,
                             fromMZMemb: false,
                             toFXMemb: false,
                             toFYMemb: false,
                             toFZMemb: false,
                             toMXMemb: false,
                             toMYMemb: false,
                             toMZMemb: false,
                             uX: 0.0,
                             uY: 0.0,
                             uZ: 0.0,
                             fromFXLoad: 0.0,
                             fromFYLoad: 0.0,
                             fromFZLoad: 0.0,
                             fromMXLoad: 0.0,
                             fromMYLoad: 0.0,
                             fromMZLoad: 0.0,
                             toFXLoad: 0.0,
                             toFYLoad: 0.0,
                             toFZLoad: 0.0,
                             toMXLoad: 0.0,
                             toMYLoad: 0.0,
                             toMZLoad: 0.0,

                             uXL: 0.0,
                             uYL: 0.0,
                             uZL: 0.0,
                             fromFXLoadL: 0.0,
                             fromFYLoadL: 0.0,
                             fromFZLoadL: 0.0,
                             fromMXLoadL: 0.0,
                             fromMYLoadL: 0.0,
                             fromMZLoadL: 0.0,
                             toFXLoadL: 0.0,
                             toFYLoadL: 0.0,
                             toFZLoadL: 0.0,
                             toMXLoadL: 0.0,
                             toMYLoadL: 0.0,
                             toMZLoadL: 0.0,

                             uXO: 0.0,
                             uYO: 0.0,
                             uZO: 0.0,
                             fromFXLoadO: 0.0,
                             fromFYLoadO: 0.0,
                             fromFZLoadO: 0.0,
                             fromMXLoadO: 0.0,
                             fromMYLoadO: 0.0,
                             fromMZLoadO: 0.0,
                             toFXLoadO: 0.0,
                             toFYLoadO: 0.0,
                             toFZLoadO: 0.0,
                             toMXLoadO: 0.0,
                             toMYLoadO: 0.0,
                             toMZLoadO: 0.0,

                             lX: 0.0,
                             lY: 0.0,
                             lZ: 0.0,
                             kX: 0.0,
                             kY: 0.0,
                             kZ: 0.0,

                             cBZ: 0.0,
                             cBY: 0.0,

                             stable: false,

                             stiffDist: 0.0,
                             stiffI: 0.0,
                             tfaStiff: false,
                             pressure: 0.0,
                             fluid: 0.0,
                             group: "",
                             hidden: false,

                             totEls: 6 } ];
        totEls = 6;
        currElmt = 1;
        selectionSet = [1];
        nodSelectionSet = [];
        elemMenu();    // reset context menu to reflect elements
        setUndo(1, 0);

        $('#modalPortal').modal('hide');
        showScreen("allGraphics");
        drawModel(false,true);
        displayElement(currElmt);

        for (var i=1; i<=totEls; i++ ) {
            $.ajax({
                type: "POST",
                url: "./php/storeElement.php",
                data: {
                    "userName": userName1,
                    "jobName": jobName,
                    "modelEl": modelElements[i]
                } ,
                //                      data: modelElements[i],
                success: function(msg){
                } // function
            });   //ajax
        }
    });

    $('#modalKneeBraceOK').click(function(e) {
        userName1 = userName;
        editRights = true;

        var a = parseFloat($('#a_Dim_2').val());
        if( isNaN(a) )
            a = 100;    // pick a number
        var b = -parseFloat($('#b_Dim_2').val());
        if( isNaN(b) )
            b = -100;    // pick a number
        var c = -parseFloat($('#c_Dim_2').val());
        if( isNaN(b) )
            c = -25;    // pick a number

        resetJobData(jobName);
        modelElements = [{},
                         { jobName:jobName,
                             order: 1,
                             keyID: randomInteger(10000000),
                             fromNode: 10,
                             toNode: 20,
                             dX: 0.0,
                             dY: 0.0,
                             dZ: b,
                             memberType: beamType,
                             pipOD: 0.0,
                             pipTh: 0.0,
                             betaAngle: 0,
                             material: materialTypeArray[0],
                             fromFXRest: true,
                             fromFYRest: true,
                             fromFZRest: true,
                             fromMXRest: true,
                             fromMYRest: true,
                             fromMZRest: true,
                             toFXRest: false,
                             toFYRest: false,
                             toFZRest: false,
                             toMXRest: false,
                             toMYRest: false,
                             toMZRest: false,
                             fromFXMemb: false,
                             fromFYMemb: false,
                             fromFZMemb: false,
                             fromMXMemb: false,
                             fromMYMemb: false,
                             fromMZMemb: false,
                             toFXMemb: false,
                             toFYMemb: false,
                             toFZMemb: false,
                             toMXMemb: false,
                             toMYMemb: false,
                             toMZMemb: false,
                             uX: 0.0,
                             uY: 0.0,
                             uZ: 0.0,
                             fromFXLoad: 0.0,
                             fromFYLoad: 0.0,
                             fromFZLoad: 0.0,
                             fromMXLoad: 0.0,
                             fromMYLoad: 0.0,
                             fromMZLoad: 0.0,
                             toFXLoad: 0.0,
                             toFYLoad: 0.0,
                             toFZLoad: 0.0,
                             toMXLoad: 0.0,
                             toMYLoad: 0.0,
                             toMZLoad: 0.0,

                             uXL: 0.0,
                             uYL: 0.0,
                             uZL: 0.0,
                             fromFXLoadL: 0.0,
                             fromFYLoadL: 0.0,
                             fromFZLoadL: 0.0,
                             fromMXLoadL: 0.0,
                             fromMYLoadL: 0.0,
                             fromMZLoadL: 0.0,
                             toFXLoadL: 0.0,
                             toFYLoadL: 0.0,
                             toFZLoadL: 0.0,
                             toMXLoadL: 0.0,
                             toMYLoadL: 0.0,
                             toMZLoadL: 0.0,

                             uXO: 0.0,
                             uYO: 0.0,
                             uZO: 0.0,
                             fromFXLoadO: 0.0,
                             fromFYLoadO: 0.0,
                             fromFZLoadO: 0.0,
                             fromMXLoadO: 0.0,
                             fromMYLoadO: 0.0,
                             fromMZLoadO: 0.0,
                             toFXLoadO: 0.0,
                             toFYLoadO: 0.0,
                             toFZLoadO: 0.0,
                             toMXLoadO: 0.0,
                             toMYLoadO: 0.0,
                             toMZLoadO: 0.0,

                             lX: 0.0,
                             lY: 0.0,
                             lZ: 0.0,
                             kX: 0.0,
                             kY: 0.0,
                             kZ: 0.0,

                             cBZ: 0.0,
                             cBY: 0.0,

                             stable: false,

                             stiffDist: 0.0,
                             stiffI: 0.0,
                             tfaStiff: false,
                             pressure: 0.0,
                             fluid: 0.0,
                             group: "",
                             hidden: false,

                             totEls: 3 },
                         { jobName:jobName,
                             order: 2,
                             keyID: randomInteger(10000000),
                             fromNode: 20,
                             toNode: 30,
                             dX: 0.0,
                             dY: 0.0,
                             dZ: c,
                             memberType: beamType,
                             pipOD: 0.0,
                             pipTh: 0.0,
                             betaAngle: 0,
                             material: materialTypeArray[0],
                             fromFXRest: false,
                             fromFYRest: false,
                             fromFZRest: false,
                             fromMXRest: false,
                             fromMYRest: false,
                             fromMZRest: false,
                             toFXRest: false,
                             toFYRest: false,
                             toFZRest: false,
                             toMXRest: false,
                             toMYRest: false,
                             toMZRest: false,
                             fromFXMemb: false,
                             fromFYMemb: false,
                             fromFZMemb: false,
                             fromMXMemb: false,
                             fromMYMemb: false,
                             fromMZMemb: false,
                             toFXMemb: false,
                             toFYMemb: false,
                             toFZMemb: false,
                             toMXMemb: false,
                             toMYMemb: false,
                             toMZMemb: false,
                             uX: 0.0,
                             uY: 0.0,
                             uZ: 0.0,
                             fromFXLoad: 0.0,
                             fromFYLoad: 0.0,
                             fromFZLoad: 0.0,
                             fromMXLoad: 0.0,
                             fromMYLoad: 0.0,
                             fromMZLoad: 0.0,
                             toFXLoad: 0.0,
                             toFYLoad: 0.0,
                             toFZLoad: 0.0,
                             toMXLoad: 0.0,
                             toMYLoad: 0.0,
                             toMZLoad: 0.0,

                             uXL: 0.0,
                             uYL: 0.0,
                             uZL: 0.0,
                             fromFXLoadL: 0.0,
                             fromFYLoadL: 0.0,
                             fromFZLoadL: 0.0,
                             fromMXLoadL: 0.0,
                             fromMYLoadL: 0.0,
                             fromMZLoadL: 0.0,
                             toFXLoadL: 0.0,
                             toFYLoadL: 0.0,
                             toFZLoadL: 0.0,
                             toMXLoadL: 0.0,
                             toMYLoadL: 0.0,
                             toMZLoadL: 0.0,

                             uXO: 0.0,
                             uYO: 0.0,
                             uZO: 0.0,
                             fromFXLoadO: 0.0,
                             fromFYLoadO: 0.0,
                             fromFZLoadO: 0.0,
                             fromMXLoadO: 0.0,
                             fromMYLoadO: 0.0,
                             fromMZLoadO: 0.0,
                             toFXLoadO: 0.0,
                             toFYLoadO: 0.0,
                             toFZLoadO: 0.0,
                             toMXLoadO: 0.0,
                             toMYLoadO: 0.0,
                             toMZLoadO: 0.0,

                             lX: 0.0,
                             lY: 0.0,
                             lZ: 0.0,
                             kX: 0.0,
                             kY: 0.0,
                             kZ: 0.0,

                             cBZ: 0.0,
                             cBY: 0.0,

                             stable: false,

                             stiffDist: 0.0,
                             stiffI: 0.0,
                             tfaStiff: false,
                             pressure: 0.0,
                             fluid: 0.0,
                             group: "",
                             hidden: false,

                             totEls: 3 },
                         { jobName:jobName,
                             order: 3,
                             keyID: randomInteger(10000000),
                             fromNode: 40,
                             toNode: 20,
                             dX: 0.0,
                             dY: a,
                             dZ: b,
                             memberType: braceType,
                             pipOD: 0.0,
                             pipTh: 0.0,
                             betaAngle: 0,
                             material: materialTypeArray[0],
                             fromFXRest: true,
                             fromFYRest: true,
                             fromFZRest: true,
                             fromMXRest: true,
                             fromMYRest: true,
                             fromMZRest: true,
                             toFXRest: false,
                             toFYRest: false,
                             toFZRest: false,
                             toMXRest: false,
                             toMYRest: false,
                             toMZRest: false,
                             fromFXMemb: false,
                             fromFYMemb: false,
                             fromFZMemb: false,
                             fromMXMemb: false,
                             fromMYMemb: false,
                             fromMZMemb: false,
                             toFXMemb: false,
                             toFYMemb: false,
                             toFZMemb: false,
                             toMXMemb: false,
                             toMYMemb: false,
                             toMZMemb: false,
                             uX: 0.0,
                             uY: 0.0,
                             uZ: 0.0,
                             fromFXLoad: 0.0,
                             fromFYLoad: 0.0,
                             fromFZLoad: 0.0,
                             fromMXLoad: 0.0,
                             fromMYLoad: 0.0,
                             fromMZLoad: 0.0,
                             toFXLoad: 0.0,
                             toFYLoad: 0.0,
                             toFZLoad: 0.0,
                             toMXLoad: 0.0,
                             toMYLoad: 0.0,
                             toMZLoad: 0.0,

                             uXL: 0.0,
                             uYL: 0.0,
                             uZL: 0.0,
                             fromFXLoadL: 0.0,
                             fromFYLoadL: 0.0,
                             fromFZLoadL: 0.0,
                             fromMXLoadL: 0.0,
                             fromMYLoadL: 0.0,
                             fromMZLoadL: 0.0,
                             toFXLoadL: 0.0,
                             toFYLoadL: 0.0,
                             toFZLoadL: 0.0,
                             toMXLoadL: 0.0,
                             toMYLoadL: 0.0,
                             toMZLoadL: 0.0,

                             uXO: 0.0,
                             uYO: 0.0,
                             uZO: 0.0,
                             fromFXLoadO: 0.0,
                             fromFYLoadO: 0.0,
                             fromFZLoadO: 0.0,
                             fromMXLoadO: 0.0,
                             fromMYLoadO: 0.0,
                             fromMZLoadO: 0.0,
                             toFXLoadO: 0.0,
                             toFYLoadO: 0.0,
                             toFZLoadO: 0.0,
                             toMXLoadO: 0.0,
                             toMYLoadO: 0.0,
                             toMZLoadO: 0.0,

                             lX: 0.0,
                             lY: 0.0,
                             lZ: 0.0,
                             kX: 0.0,
                             kY: 0.0,
                             kZ: 0.0,

                             cBZ: 0.0,
                             cBY: 0.0,

                             stable: false,

                             stiffDist: 0.0,
                             stiffI: 0.0,
                             tfaStiff: false,
                             pressure: 0.0,
                             fluid: 0.0,
                             group: "",
                             hidden: false,

                             totEls: 3 } ];
        totEls = 3;
        currElmt = 1;
        selectionSet = [1];
        nodSelectionSet = [];
        elemMenu();    // reset context menu to reflect elements
        setUndo(1, 0);

        $('#modalKneeBrace').modal('hide');
        showScreen("allGraphics");
        drawModel(false,true);
        displayElement(currElmt);

        for (var i=1; i<=totEls; i++ )
            $.ajax({
                type: "POST",
                url: "./php/storeElement.php",
                data: {
                    "userName": userName1,
                    "jobName": jobName,
                    "modelEl": modelElements[i]
                } ,
                //                      data: modelElements[i],
                success: function(msg){
                } // function
            });   //ajax
    });

    $('#modalNodeOK').click(function(e){
        if( !editRights )
            return;

        var fromM = $('#fromM').val();
        if (fromM != '(various)') {
            fromM = parseInt(fromM);
            if (isNaN(fromM))
                fromM = 0.0;
        }
        var toM = $('#toM').val();
        if (toM != '(various)') {
            toM = parseInt(toM);
            if (isNaN(toM))
                toM = 0.0;
        }

        if (fromM != '(various)' || toM != '(various)') {
            var modalNodeCols = ($('#modalNodeCols').is(':checked'));
            var modalNodeBeams = ($('#modalNodeBeams').is(':checked'));
            var modalNodeBraces = ($('#modalNodeBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];
                if ((modalNodeCols && isAColumn(modelElements[i])) ||
                    (modalNodeBeams && isABeam(modelElements[i])) ||
                    (modalNodeBraces && isABrace(modelElements[i]))) {

                    if (fromM != '(various)' )
                        modelElements[i].fromNode = fromM;
                    if (toM != '(various)')
                        modelElements[i].toNode = toM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                        data: modelElements[i],
                        success: function(msg){
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,true);
        }

        lastDownTarget = oldLastDownTarget;

        $('#modalNode').modal('hide');
    });

    $('#modalNodeCols').click(getModalNodes);
    $('#modalNodeBeams').click(getModalNodes);
    $('#modalNodeBraces').click(getModalNodes);

    $('#modalRenumOK').click(function(e){
        if( !editRights )
            return;
        var newNod = parseInt($('#renumM').val());
        if (newNod > 0) {
            var changed = [];
            for (var i=0; i<nodSelectionSet.length; i++ ) {
                for (var j=1; j<=totEls; j++ ) {
                    if (modelElements[j].fromNode == nodSelectionSet[i] && modelElements[j].fromNode != newNod ) {
                        modelElements[j].fromNode = newNod;
                        if( changed.indexOf(j) < 0 )
                            changed.push(j);
                    }

                    if (modelElements[j].toNode == nodSelectionSet[i] && modelElements[j].toNode != newNod ) {
                        modelElements[j].toNode = newNod;
                        if( changed.indexOf(j) < 0 )
                            changed.push(j);
                    }
                }
                var chg = false;
                for (var j=0; j<fNodes.length; j++ ) {
                    if (fNodes[j].node == nodSelectionSet[i]) {
                        deleteNode(fNodes[j].node);
                        fNodes[j].node = newNod;
                        storeNode(fNodes[j].node, fNodes[j].x, fNodes[j].y,
                                  fNodes[j].z);
                        chg = true;
                        break;
                    }
                } 
       
                if( chg ) {
                    oNodeTable.fnClearTable();
                    for (var j = 0; j < fNodes.length; j++)
                        oNodeTable.fnAddData([fNodes[j].node, fNodes[j].x, fNodes[j].y, fNodes[j].z, '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>','<a class="duplicate" href="">Array</a>' ]);
                }
            }

            var syncVar = true; 
            for (var i = 0; i < changed.length; i++) {
                if( i == changed.length - 1)
                    syncVar = false;
                var ii = changed[i];
                $.ajax({
                    type: "POST",
                    async: syncVar,
                    url: "./php/storeElement.php",
                    data: {
                        "userName": userName1,
                        "jobName": jobName,
                        "modelEl": modelElements[ii]
                    },
                    success: function(msg){
                        //                  alert( "succes: " + msg );
                    }, // function
                }); //ajax
            }  

            if (changed.length > 0) {
                setUndo(1, 0 /* ,1 */);
                displayElement(currElmt);
                drawModel(false, true);
            }
        }

        lastDownTarget = oldLastDownTarget;

        $('#modalRenumber').modal('hide');
    });

    $('#modalMoveOK').click(function(e){
        if( !editRights )
            return;
        var moveX = parseFloat($('#moveX').val());
        if (isNaN(moveX) )
            moveX = 0.0;
        var moveY = parseFloat($('#moveY').val());
        if (isNaN(moveY) )
            moveY = 0.0;
        var moveZ = parseFloat($('#moveZ').val());
        if (isNaN(moveZ) )
            moveZ = 0.0;
      
        var chg = false;
        for (var i = 0; i < nodSelectionSet.length; i++) {
            var chg1 = false;
            for (var j = 0; j < fNodes.length; j++) {
                if (fNodes[j].node == nodSelectionSet[i]) {
                    fNodes[j].x += moveX;
                    fNodes[j].y += moveY;
                    fNodes[j].z += moveZ;
                    chg = true;
                    chg1 = true;
                }
            }
            if( !chg1 ) {
                // node wasn't found in fixed nodes -- are it's coords 0,0,0?  If so, then we have to create a new fixed node entry
                for (var j=1; j<=totEls; j++ ) {
                    if( modelElements[j].fromNode == nodSelectionSet[i] ) { 
                        if( coords[j].x1 == 0.0 && coords[j].y1 == 0.0 && coords[j].z1 == 0.0 ) {
                            fNodes.push ( { node: nodSelectionSet[i],
                                x: moveX,
                                y: moveY,
                                z: moveZ });
                            chg = true;
                        }
                        break;
                    }
                    if( modelElements[j].toNode == nodSelectionSet[i] ) {
                        if( coords[j].x2 == 0.0 && coords[j].y2 == 0.0 && coords[j].z2 == 0.0 ) {
                            fNodes.push ( { node: nodSelectionSet[i],
                                x: moveX,
                                y: moveY,
                                z: moveZ });
                            chg = true;
                        }
                        break;
                    }
                }
            }
        }

        newElms = [];
    
        for (var j=1; j<=totEls; j++ ) {
            if( (nodSelectionSet.indexOf(modelElements[j].fromNode) < 0 &&
                 nodSelectionSet.indexOf(modelElements[j].toNode) >= 0) ||
                (nodSelectionSet.indexOf(modelElements[j].fromNode) >= 0 &&
                 nodSelectionSet.indexOf(modelElements[j].toNode) < 0) ) {    // need to change the length
                newElms.push(j);

                if (nodSelectionSet.indexOf(modelElements[j].fromNode) >= 0 ) {
                    modelElements[j].dX -= moveX;
                    modelElements[j].dY -= moveY;
                    modelElements[j].dZ -= moveZ;
                }
                else {
                    modelElements[j].dX += moveX;
                    modelElements[j].dY += moveY;
                    modelElements[j].dZ += moveZ;
                }
                $.ajax({
                    type: "POST",
                    url: "./php/storeElement.php",
                    data: {
                        "userName": userName1,
                        "jobName": jobName,
                        "modelEl": modelElements[j]
                    },
                    success: function(msg){
                        //                  alert( "succes: " + msg );
                    }, // function
                }); //ajax
            }
        }

        if( chg ) {
            oNodeTable.fnClearTable();
            for (var j = 0; j < fNodes.length; j++)
                oNodeTable.fnAddData([fNodes[j].node, fNodes[j].x, fNodes[j].y, fNodes[j].z, '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>','<a class="duplicate" href="">Array</a>' ]);
        }

        if( newElms.length > 0 )
            breakElms(newElms);
        setUndo(1, 0 /* ,1 */);
        displayElement(currElmt);
        drawModel(false, true);

        lastDownTarget = oldLastDownTarget;
        $('#modalMove').modal('hide');
    });

    $('#modalDimensionOK').click(function(e){
        if( !editRights )
            return;
        var dXM = $('#dXM').val();
        if (dXM != '(various)') {
            dXM = parseFloat(dXM);
            if (isNaN(dXM))
                dXM = 0.0;
        }
        var dYM = $('#dYM').val();
        if (dYM != '(various)') {
            dYM = parseFloat(dYM);
            if (isNaN(dYM))
                dYM = 0.0;
        }
        var dZM = $('#dZM').val();
        if (dZM != '(various)') {
            dZM = parseFloat(dZM);
            if (isNaN(dZM))
                dZM = 0.0;
        }

        newElms = [];
    
        if (dXM != '(various)' || dYM != '(various)' || dZM != '(various)') {
            var modalDimensionCols = ($('#modalDimensionCols').is(':checked'));
            var modalDimensionBeams = ($('#modalDimensionBeams').is(':checked'));
            var modalDimensionBraces = ($('#modalDimensionBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalDimensionCols && isAColumn(modelElements[i])) ||
                (modalDimensionBeams && isABeam(modelElements[i])) ||
                (modalDimensionBraces && isABrace(modelElements[i]))) {


                    newElms.push(i);
                    if (dXM != '(various)' )
                        modelElements[i].dX = dXM;
                    if (dYM != '(various)' )
                        modelElements[i].dY = dYM;
                    if (dZM != '(various)' )
                        modelElements[i].dZ = dZM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                      data: modelElements[i],
                        success: function(msg){
                        } // function
                    }); //ajax
                }
            }
      
            breakElms(newElms);
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,true);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalDimension').modal('hide');
    });

    $('#modalDimensionCols').click(getModalDimensions);
    $('#modalDimensionBeams').click(getModalDimensions);
    $('#modalDimensionBraces').click(getModalDimensions);

    $('#modalMemberOK').click(function(e){
        if( !editRights )
            return;
        var memberTypeM = $('#memberTypeM').val();
        var pipOD = $('#pipeODM').val();
        if (pipOD != '(various)') {
            pipOD = parseFloat(pipOD);
            if (isNaN(pipOD)) 
                pipOD == 0.0;
        }

        var pipTh = $('#pipeThM').val();
        if (pipTh != '(various)') {
            pipTh = parseFloat(pipTh);
            if (isNaN(pipTh)) 
                pipTh == 0.0;
        }

        if (memberTypeM != '(various)') {
            var modalMemberCols = ($('#modalMemberCols').is(':checked'));
            var modalMemberBeams = ($('#modalMemberBeams').is(':checked'));
            var modalMemberBraces = ($('#modalMemberBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalMemberCols && isAColumn(modelElements[i])) ||
                (modalMemberBeams && isABeam(modelElements[i])) ||
                (modalMemberBraces && isABrace(modelElements[i]))) {

                    modelElements[i].memberType = memberTypeM;
                    if( modelElements[i].memberType == "PipeCustom" ) {
                        if( pipOD != '(various)' ) 
                            modelElements[i].pipOD = pipOD;
                        if( pipTh != '(various)' ) 
                            modelElements[i].pipTh = pipTh;
            
                    }

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                        data: modelElements[i],
                        success: function(msg){
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalMember').modal('hide');
    });

    $('#modalMemberCols').click(getModalMember);
    $('#modalMemberBeams').click(getModalMember);
    $('#modalMemberBraces').click(getModalMember);

    $('#modalBetaOK').click(function(e){
        if( !editRights )
            return;
        var betaM = $('#betaM').val();
        if (betaM != '(various)') {
            parseFloat($('#betaM').val());
            if (isNaN(betaM))
                betaM = 0.0;

            var modalBetaCols = ($('#modalBetaCols').is(':checked'));
            var modalBetaBeams = ($('#modalBetaBeams').is(':checked'));
            var modalBetaBraces = ($('#modalBetaBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalBetaCols && isAColumn(modelElements[i])) ||
                (modalBetaBeams && isABeam(modelElements[i])) ||
                (modalBetaBraces && isABrace(modelElements[i]))) {

                    modelElements[i].betaAngle = betaM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                      data: modelElements[i],
                        success: function(msg){
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalBeta').modal('hide');
    });

    $('#modalBetaCols').click(getModalBeta);
    $('#modalBetaBeams').click(getModalBeta);
    $('#modalBetaBraces').click(getModalBeta);

    $('#modalMaterialOK').click(function(e){
        if( !editRights )
            return;
        materialM = $('#materialM').val();

        if (materialM != '(various)') {
            var modalMaterialCols = ($('#modalMaterialCols').is(':checked'));
            var modalMaterialBeams = ($('#modalMaterialBeams').is(':checked'));
            var modalMaterialBraces = ($('#modalMaterialBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalMaterialCols && isAColumn(modelElements[i])) ||
                (modalMaterialBeams && isABeam(modelElements[i])) ||
                (modalMaterialBraces && isABrace(modelElements[i]))) {

                    modelElements[i].material = materialM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                        data: modelElements[i],
                        success: function(msg){
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalMaterial').modal('hide');
    });

    $('#modalMaterialCols').click(getModalMaterial);
    $('#modalMaterialBeams').click(getModalMaterial);
    $('#modalMaterialBraces').click(getModalMaterial);

    $('#modalReleaseOK').click(function(e){
        if( !editRights )
            return;
        var fromFXRelM = ($('#fromFXReleaseM').is(':checked'));
        var fromFYRelM = ($('#fromFYReleaseM').is(':checked'));
        var fromFZRelM = ($('#fromFZReleaseM').is(':checked'));
        var fromMXRelM = ($('#fromMXReleaseM').is(':checked'));
        var fromMYRelM = ($('#fromMYReleaseM').is(':checked'));
        var fromMZRelM = ($('#fromMZReleaseM').is(':checked'));
        var toFXRelM = ($('#toFXReleaseM').is(':checked'));
        var toFYRelM = ($('#toFYReleaseM').is(':checked'));
        var toFZRelM = ($('#toFZReleaseM').is(':checked'));
        var toMXRelM = ($('#toMXReleaseM').is(':checked'));
        var toMYRelM = ($('#toMYReleaseM').is(':checked'));
        var toMZRelM = ($('#toMZReleaseM').is(':checked'));

        var ffx = $('#ffx1').text();
        var ffy = $('#ffy1').text();
        var ffz = $('#ffz1').text();
        var fmx = $('#fmx1').text();
        var fmy = $('#fmy1').text();
        var fmz = $('#fmz1').text();

        var tfx = $('#tfx1').text();
        var tfy = $('#tfy1').text();
        var tfz = $('#tfz1').text();
        var tmx = $('#tmx1').text();
        var tmy = $('#tmy1').text();
        var tmz = $('#tmz1').text();


        if (ffx != ' (various)' || ffy != ' (various)' || ffz != ' (various)' ||
            fmx != ' (various)' || fmy != ' (various)' || fmz != ' (various)' ||
            tfx != ' (various)' || tfy != ' (various)' || tfz != ' (various)' ||
            tmx != ' (various)' || tmy != ' (various)' || tmz != ' (various)') {

            var modalReleaseCols = ($('#modalReleaseCols').is(':checked'));
            var modalReleaseBeams = ($('#modalReleaseBeams').is(':checked'));
            var modalReleaseBraces = ($('#modalReleaseBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalReleaseCols && isAColumn(modelElements[i])) ||
                (modalReleaseBeams && isABeam(modelElements[i])) ||
                (modalReleaseBraces && isABrace(modelElements[i]))) {

                    if (ffx != ' (various)')
                        modelElements[i].fromFXMemb = fromFXRelM;
                    if (ffy != ' (various)')
                        modelElements[i].fromFYMemb = fromFYRelM;
                    if (ffz != ' (various)')
                        modelElements[i].fromFZMemb = fromFZRelM;
                    if (fmx != ' (various)')
                        modelElements[i].fromMXMemb = fromMXRelM;
                    if (fmy != ' (various)')
                        modelElements[i].fromMYMemb = fromMYRelM;
                    if (fmz != ' (various)')
                        modelElements[i].fromMZMemb = fromMZRelM;
                    if (ffx != ' (various)')
                        modelElements[i].toFXMemb = toFXRelM;
                    if (tfy != ' (various)')
                        modelElements[i].toFYMemb = toFYRelM;
                    if (tfz != ' (various)')
                        modelElements[i].toFZMemb = toFZRelM;
                    if (tmx != ' (various)')
                        modelElements[i].toMXMemb = toMXRelM;
                    if (tmy != ' (various)')
                        modelElements[i].toMYMemb = toMYRelM;
                    if (tmz != ' (various)')
                        modelElements[i].toMZMemb = toMZRelM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                        data: modelElements[i],
                        success: function(msg){
                            //                              alert( "Data Saved: " + msg );
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalRelease').modal('hide');
    });

    $('#modalReleaseCols').click(getModalReleases);
    $('#modalReleaseBeams').click(getModalReleases);
    $('#modalReleaseBraces').click(getModalReleases);

    $('#fromFXReleaseM').click(function() {
        $("#ffx1").text('');
    });

    $('#fromFYReleaseM').click(function() {
        $("#ffy1").text('');
    });

    $('#fromFZReleaseM').click(function() {
        $("#ffz1").text('');
    });

    $('#fromMXReleaseM').click(function() {
        $("#fmx1").text('');
    });

    $('#fromMYReleaseM').click(function() {
        $("#fmy1").text('');
    });

    $('#fromMZReleaseM').click(function() {
        $("#fmz1").text('');
    });

    $('#toFXReleaseM').click(function() {
        $("#tfx1").text('');
    });

    $('#toFYReleaseM').click(function() {
        $("#tfy1").text('');
    });

    $('#toFZReleaseM').click(function() {
        $("#tfz1").text('');
    });

    $('#toMXReleaseM').click(function() {
        $("#tmx1").text('');
    });

    $('#toMYReleaseM').click(function() {
        $("#tmy1").text('');
    });

    $('#toMZReleaseM').click(function() {
        $("#tmz1").text('');
    });

    $('#modalRestOK').click(function(e){
        if( !editRights )
            return;
        var fromFXRestM = ($('#fromFXRestraintM').is(':checked'));
        var fromFYRestM = ($('#fromFYRestraintM').is(':checked'));
        var fromFZRestM = ($('#fromFZRestraintM').is(':checked'));
        var fromMXRestM = ($('#fromMXRestraintM').is(':checked'));
        var fromMYRestM = ($('#fromMYRestraintM').is(':checked'));
        var fromMZRestM = ($('#fromMZRestraintM').is(':checked'));
        var toFXRestM = ($('#toFXRestraintM').is(':checked'));
        var toFYRestM = ($('#toFYRestraintM').is(':checked'));
        var toFZRestM = ($('#toFZRestraintM').is(':checked'));
        var toMXRestM = ($('#toMXRestraintM').is(':checked'));
        var toMYRestM = ($('#toMYRestraintM').is(':checked'));
        var toMZRestM = ($('#toMZRestraintM').is(':checked'));

        var ffx = $('#ffx2').text();
        var ffy = $('#ffy2').text();
        var ffz = $('#ffz2').text();
        var fmx = $('#fmx2').text();
        var fmy = $('#fmy2').text();
        var fmz = $('#fmz2').text();

        var tfx = $('#tfx2').text();
        var tfy = $('#tfy2').text();
        var tfz = $('#tfz2').text();
        var tmx = $('#tmx2').text();
        var tmy = $('#tmy2').text();
        var tmz = $('#tmz2').text();

        if (ffx != ' (various)' || ffy != ' (various)' || ffz != ' (various)' ||
        fmx != ' (various)' ||
        fmy != ' (various)' ||
        fmz != ' (various)' ||
        tfx != ' (various)' ||
        tfy != ' (various)' ||
        tfz != ' (various)' ||
        tmx != ' (various)' ||
        tmy != ' (various)' ||
        tmz != ' (various)') {

            var modalRestCols = ($('#modalRestCols').is(':checked'));
            var modalRestBeams = ($('#modalRestBeams').is(':checked'));
            var modalRestBraces = ($('#modalRestBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalRestCols && isAColumn(modelElements[i])) ||
                (modalRestBeams && isABeam(modelElements[i])) ||
                (modalRestBraces && isABrace(modelElements[i]))) {

                    if (ffx != ' (various)')
                        modelElements[i].fromFXRest = fromFXRestM;
                    if (ffy != ' (various)')
                        modelElements[i].fromFYRest = fromFYRestM;
                    if (ffz != ' (various)')
                        modelElements[i].fromFZRest = fromFZRestM;
                    if (fmx != ' (various)')
                        modelElements[i].fromMXRest = fromMXRestM;
                    if (fmy != ' (various)')
                        modelElements[i].fromMYRest = fromMYRestM;
                    if (fmz != ' (various)')
                        modelElements[i].fromMZRest = fromMZRestM;
                    if (tfx != ' (various)')
                        modelElements[i].toFXRest = toFXRestM;
                    if (tfy != ' (various)')
                        modelElements[i].toFYRest = toFYRestM;
                    if (tfz != ' (various)')
                        modelElements[i].toFZRest = toFZRestM;
                    if (tmx != ' (various)')
                        modelElements[i].toMXRest = toMXRestM;
                    if (tmy != ' (various)')
                        modelElements[i].toMYRest = toMYRestM;
                    if (tmz != ' (various)')
                        modelElements[i].toMZRest = toMZRestM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                        data: modelElements[i],
                        success: function(msg){
                            //                              alert( "Data Saved: " + msg );
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalRestraints').modal('hide');
    });

    $('#modalRestCols').click(getModalRestraints);
    $('#modalRestBeams').click(getModalRestraints);
    $('#modalRestBraces').click(getModalRestraints);

    $('#fromFXRestraintM').click(function() {
        $("#ffx2").text('');
    });

    $('#fromFYRestraintM').click(function() {
        $("#ffy2").text('');
    });

    $('#fromFZRestraintM').click(function() {
        $("#ffz2").text('');
    });

    $('#fromMXRestraintM').click(function() {
        $("#fmx2").text('');
    });

    $('#fromMYRestraintM').click(function() {
        $("#fmy2").text('');
    });

    $('#fromMZRestraintM').click(function() {
        $("#fmz2").text('');
    });

    $('#toFXRestraintM').click(function() {
        $("#tfx2").text('');
    });

    $('#toFYRestraintM').click(function() {
        $("#tfy2").text('');
    });

    $('#toFZRestraintM').click(function() {
        $("#tfz2").text('');
    });

    $('#toMXRestraintM').click(function() {
        $("#tmx2").text('');
    });

    $('#toMYRestraintM').click(function() {
        $("#tmy2").text('');
    });

    $('#toMZRestraintM').click(function() {
        $("#tmz2").text('');
    });

    $('#modalLengthOK').click(function(e){
        if( !editRights )
            return;
        var lXM = $('#lXM').val();
        if (lXM != '(various)') {
            lXM = parseFloat(lXM);
            if (isNaN(lXM))
                lXM = 0.0;
        }
        var lYM = $('#lYM').val();
        if (lYM != '(various)') {
            lYM = parseFloat(lYM);
            if (isNaN(lYM))
                lYM = 0.0;
        }
        var lZM = $('#lZM').val();
        if (lZM != '(various)') {
            lZM = parseFloat(lZM);
            if (isNaN(lZM))
                lZM = 0.0;
        }

        var kXM = $('#kXM').val();
        if (kXM != '(various)') {
            kXM = parseFloat(kXM);
            if (isNaN(kXM))
                kXM = 0.0;
        }
        var kYM = $('#kYM').val();
        if (kYM != '(various)') {
            kYM = parseFloat(kYM);
            if (isNaN(kYM))
                kYM = 0.0;
        }
        var kZM = $('#kZM').val();
        if (kZM != '(various)') {
            kZM = parseFloat(kZM);
            if (isNaN(kZM))
                kZM = 0.0;
        }

        var cBZM = $('#cBZM').val();
        if (cBZM != '(various)') {
            cBZM = parseFloat(cBZM);
            if (isNaN(cBZM))
                cBZM = 0.0;
        }

        var cBYM = $('#cBYM').val();
        if (cBYM != '(various)') {
            cBYM = parseFloat(cBYM);
            if (isNaN(cBYM))
                cBYM = 0.0;
        }

        var stableM = ($('#contribStabilityM').is(':checked'));
        var stable = $('#stab').text();

        if ((lXM != '(various)') || (lYM != '(various)') || (lZM != '(various)') ||
        (kXM != '(various)') ||
        (kYM != '(various)') ||
        (kZM != '(various)') ||
        (cBZM != '(various)') ||
        (cBXM != '(various)') ||
        (stable != ' (various)')) {

            var modalLenCols = ($('#modalLenCols').is(':checked'));
            var modalLenBeams = ($('#modalLenBeams').is(':checked'));
            var modalLenBraces = ($('#modalLenBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalLenCols && isAColumn(modelElements[i])) ||
                (modalLenBeams && isABeam(modelElements[i])) ||
                (modalLenBraces && isABrace(modelElements[i]))) {
                    if (lXM != '(various)')
                        modelElements[i].lX = lXM;
                    if (lYM != '(various)')
                        modelElements[i].lY = lYM;
                    if (lZM != '(various)')
                        modelElements[i].lZ = lZM;
                    if (kXM != '(various)')
                        modelElements[i].kX = kXM;
                    if (kYM != '(various)')
                        modelElements[i].kY = kYM;
                    if (kZM != '(various)')
                        modelElements[i].kZ = kZM;
                    if (cBZM != '(various)')
                        modelElements[i].cBZ = cBZM;
                    if (cBYM != '(various)')
                        modelElements[i].cBY = cBYM;
                    if (stable != ' (various)')
                        modelElements[i].stable = stableM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                      data: modelElements[i],
                        success: function(msg){
                            //                              alert( "Data Saved: " + msg );
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalLengths').modal('hide');
    });

    $('#modalLenCols').click(getModalLengths);
    $('#modalLenBeams').click(getModalLengths);
    $('#modalLenBraces').click(getModalLengths);

    $('#contribStabilityM').click(function() {
        $("#stab").text('');
    });

    $('#modalStiffOK').click(function(e){
        if( !editRights )
            return;
        var stiffDistM = $('#stiffDistM').val();
        if (stiffDistM != '(various)') {
            stiffDistM = parseFloat(stiffDistM);
            if (isNaN(stiffDistM))
                stiffDistM = 0.0;
        }
        var stiffIM = $('#stiffIM').val();
        if (stiffDistM != '(various)') {
            stiffIM = parseFloat(stiffIM);
            if (isNaN(stiffIM))
                stiffIM = 0.0;
        }

        var tfaStiffM = ($('#tfaStiffM').is(':checked'));
        var tfal = $('#tfal').text()

        if( (stiffDistM != '(various)') || (stiffIM != '(various)') ||
            (tfal != ' (various)') ) {

            var modalStiffCols = ($('#modalStiffCols').is(':checked'));
            var modalStiffBeams = ($('#modalStiffBeams').is(':checked'));
            var modalStiffBraces = ($('#modalStiffBraces').is(':checked'));

            for( var ii=0; ii<selectionSet.length; ii++ ) {
                i = selectionSet[ii];

                if ((modalStiffCols && isAColumn(modelElements[i])) ||
                    (modalStiffBeams && isABeam(modelElements[i])) ||
                    (modalStiffBraces && isABrace(modelElements[i]))) {

                    if( stiffDistM != '(various)' )
                        modelElements[i].stiffDist = stiffDistM;
                    if( stiffIM != '(various)' )
                        modelElements[i].stiffI = stiffIM;
                    if( tfal != ' (various) ')
                        modelElements[i].tfaStiff = tfaStiffM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        } ,
                        //                      data: modelElements[i],
                        success: function(msg){
                            //                              alert( "Data Saved: " + msg );
                        } // function
                    }); //ajax
                }
            }
            setUndo(1,0  /* ,1 */ );
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalStiff').modal('hide');
    });

    $('#modalStiffCols').click(getModalStiffs);
    $('#modalStiffBeams').click(getModalStiffs);
    $('#modalStiffBraces').click(getModalStiffs);

    $('#tfaStiffM').click(function() {
        $("#tfal").text('');
    });

    $('#modalUnifDeadOK').click(function(e){
        if( !editRights )
            return;
        var uXM = $('#uXM').val();
        if (uXM != '(various)') {
            uXM = parseFloat(uXM);
            if (isNaN(uXM))
                uXM = 0.0;
        }
        var uYM = $('#uYM').val();
        if (uYM != '(various)') {
            uYM = parseFloat(uYM);
            if (isNaN(uYM))
                uYM = 0.0;
        }
        var uZM = $('#uZM').val();
        if (uZM != '(various)') {
            uZM = parseFloat(uZM);
            if (isNaN(uZM))
                uZM = 0.0;
        }

        if (uXM != '(various)' || uYM != '(various)' || uZM != '(various)') {
            var modalUnifCols = ($('#modalUnifCols').is(':checked'));
            var modalUnifBeams = ($('#modalUnifBeams').is(':checked'));
            var modalUnifBraces = ($('#modalUnifBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalUnifCols && isAColumn(modelElements[i])) ||
                    (modalUnifBeams && isABeam(modelElements[i])) ||
                    (modalUnifBraces && isABrace(modelElements[i]))) {
                    if( uXM != '(various)')
                        modelElements[i].uX = uXM;
                    if( uYM != '(various)')
                        modelElements[i].uY = uYM;
                    if( uZM != '(various)')
                        modelElements[i].uZ = uZM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                      data: modelElements[i],
                        success: function(msg){
                            //                              alert( "Data Saved: " + msg );
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalUniformDead').modal('hide');
    });

    $('#modalUnifCols').click(getModalUnifDead);
    $('#modalUnifBeams').click(getModalUnifDead);
    $('#modalUnifBraces').click(getModalUnifDead);

    $('#modalConcDeadOK').click(function(e){
        if( !editRights )
            return;
        var fromFXLoadM = $('#fromFXLoadM').val();
        if (fromFXLoadM != '(various)') {
            fromFXLoadM = parseFloat(fromFXLoadM);
            if (isNaN(fromFXLoadM))
                fromFXLoadM = 0.0;
        }
        var fromFYLoadM = $('#fromFYLoadM').val();
        if (fromFYLoadM != '(various)') {
            fromFYLoadM = parseFloat(fromFYLoadM);
            if (isNaN(fromFYLoadM))
                fromFYLoadM = 0.0;
        }
        var fromFZLoadM = $('#fromFZLoadM').val();
        if (fromFZLoadM != '(various)') {
            fromFZLoadM = parseFloat(fromFZLoadM);
            if (isNaN(fromFZLoadM))
                fromFZLoadM = 0.0;
        }
        var fromMXLoadM = $('#fromMXLoadM').val();
        if (fromMXLoadM != '(various)') {
            fromMXLoadM = parseFloat(fromMXLoadM);
            if (isNaN(fromMXLoadM))
                fromMXLoadM = 0.0;
        }
        var fromMYLoadM = $('#fromMYLoadM').val();
        if (fromMYLoadM != '(various)') {
            fromMYLoadM = parseFloat(fromMYLoadM);
            if (isNaN(fromMYLoadM))
                fromMYLoadM = 0.0;
        }
        var fromMZLoadM = $('#fromMZLoadM').val();
        if (fromMZLoadM != '(various)') {
            fromMZLoadM = parseFloat(fromMZLoadM);
            if (isNaN(fromMZLoadM))
                fromMZLoadM = 0.0;
        }
        var toFXLoadM = $('#toFXLoadM').val();
        if (toFXLoadM != '(various)') {
            toFXLoadM = parseFloat(toFXLoadM);
            if (isNaN(toFXLoadM))
                toFXLoadM = 0.0;
        }
        var toFYLoadM = $('#toFYLoadM').val();
        if (toFYLoadM != '(various)') {
            toFYLoadM = parseFloat(toFYLoadM);
            if (isNaN(toFYLoadM))
                toFYLoadM = 0.0;
        }
        var toFZLoadM = $('#toFZLoadM').val();
        if (toFZLoadM != '(various)') {
            toFZLoadM = parseFloat(toFZLoadM);
            if (isNaN(toFZLoadM))
                toFZLoadM = 0.0;
        }
        var toMXLoadM = $('#toMXLoadM').val();
        if (toMXLoadM != '(various)') {
            toMXLoadM = parseFloat(toMXLoadM);
            if (isNaN(toMXLoadM))
                toMXLoadM = 0.0;
        }
        var toMYLoadM = $('#toMYLoadM').val();
        if (toMYLoadM != '(various)') {
            toMYLoadM = parseFloat(toMYLoadM);
            if (isNaN(toMYLoadM))
                toMYLoadM = 0.0;
        }
        var toMZLoadM = $('#toMZLoadM').val();
        if (toMZLoadM != '(various)') {
            toMZLoadM = parseFloat(toMZLoadM);
            if (isNaN(toMZLoadM))
                toMZLoadM = 0.0;
        }

        if (fromFXLoadM != '(various)' || fromFYLoadM != '(various)' || fromFZLoadM != '(various)' ||
        fromMXLoadM != '(various)' ||
        fromMYLoadM != '(various)' ||
        fromMZLoadM != '(various)' ||
        toFXLoadM != '(various)' ||
        toFYLoadM != '(various)' ||
        toFZLoadM != '(various)' ||
        toMXLoadM != '(various)' ||
        toMYLoadM != '(various)' ||
        toMZLoadM != '(various)') {
            var modalConcCols = ($('#modalConcCols').is(':checked'));
            var modalConcBeams = ($('#modalConcBeams').is(':checked'));
            var modalConcBraces = ($('#modalConcBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalConcCols && isAColumn(modelElements[i])) ||
                (modalConcBeams && isABeam(modelElements[i])) ||
                (modalConcBraces && isABrace(modelElements[i]))) {

                    if( fromFXLoadM != '(various)' )
                        modelElements[i].fromFXLoad = fromFXLoadM;
                    if( fromFYLoadM != '(various)' )
                        modelElements[i].fromFYLoad = fromFYLoadM;
                    if( fromFZLoadM != '(various)' )
                        modelElements[i].fromFZLoad = fromFZLoadM;
                    if( fromMXLoadM != '(various)' )
                        modelElements[i].fromMXLoad = fromMXLoadM;
                    if( fromMYLoadM != '(various)' )
                        modelElements[i].fromMYLoad = fromMYLoadM;
                    if( fromMZLoadM != '(various)' )
                        modelElements[i].fromMZLoad = fromMZLoadM;
                    if( toFXLoadM != '(various)' )
                        modelElements[i].toFXLoad = toFXLoadM;
                    if( toFYLoadM != '(various)' )
                        modelElements[i].toFYLoad = toFYLoadM;
                    if( toFZLoadM != '(various)' )
                        modelElements[i].toFZLoad = toFZLoadM;
                    if( toMXLoadM != '(various)' )
                        modelElements[i].toMXLoad = toMXLoadM;
                    if( toMYLoadM != '(various)' )
                        modelElements[i].toMYLoad = toMYLoadM;
                    if( toMZLoadM != '(various)' )
                        modelElements[i].toMZLoad = toMZLoadM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                      data: modelElements[i],
                        success: function(msg){
                            //                              alert( "Data Saved: " + msg );
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalConcDead').modal('hide');
    });

    $('#modalConcCols').click(getModalConcDead);
    $('#modalConcBeams').click(getModalConcDead);
    $('#modalConcBraces').click(getModalConcDead);

    $('#modalUnifLiveOK').click(function(e){
        if( !editRights )
            return;
        var uXM = $('#uXML').val();
        if (uXM != '(various)') {
            uXM = parseFloat(uXM);
            if (isNaN(uXM))
                uXM = 0.0;
        }
        var uYM = $('#uYML').val();
        if (uYM != '(various)') {
            uYM = parseFloat(uYM);
            if (isNaN(uYM))
                uYM = 0.0;
        }
        var uZM = $('#uZML').val();
        if (uZM != '(various)') {
            uZM = parseFloat(uZM);
            if (isNaN(uZM))
                uZM = 0.0;
        }

        if (uXM != '(various)' || uYM != '(various)' || uZM != '(various)') {
            var modalUnifCols = ($('#modalUnifLCols').is(':checked'));
            var modalUnifBeams = ($('#modalUnifLBeams').is(':checked'));
            var modalUnifBraces = ($('#modalUnifLBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalUnifCols && isAColumn(modelElements[i])) ||
                    (modalUnifBeams && isABeam(modelElements[i])) ||
                    (modalUnifBraces && isABrace(modelElements[i]))) {
                    if( uXM != '(various)')
                        modelElements[i].uXL = uXM;
                    if( uYM != '(various)')
                        modelElements[i].uYL = uYM;
                    if( uZM != '(various)')
                        modelElements[i].uZL = uZM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                      data: modelElements[i],
                        success: function(msg){
                            //                              alert( "Data Saved: " + msg );
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalUniformLive').modal('hide');
    });

    $('#modalUnifLCols').click(getModalUnifLive);
    $('#modalUnifLBeams').click(getModalUnifLive);
    $('#modalUnifLBraces').click(getModalUnifLive);

    $('#modalConcLiveOK').click(function(e){
        if( !editRights )
            return;
        var fromFXLoadM = $('#fromFXLoadML').val();
        if (fromFXLoadM != '(various)') {
            fromFXLoadM = parseFloat(fromFXLoadM);
            if (isNaN(fromFXLoadM))
                fromFXLoadM = 0.0;
        }
        var fromFYLoadM = $('#fromFYLoadML').val();
        if (fromFYLoadM != '(various)') {
            fromFYLoadM = parseFloat(fromFYLoadM);
            if (isNaN(fromFYLoadM))
                fromFYLoadM = 0.0;
        }
        var fromFZLoadM = $('#fromFZLoadML').val();
        if (fromFZLoadM != '(various)') {
            fromFZLoadM = parseFloat(fromFZLoadM);
            if (isNaN(fromFZLoadM))
                fromFZLoadM = 0.0;
        }
        var fromMXLoadM = $('#fromMXLoadML').val();
        if (fromMXLoadM != '(various)') {
            fromMXLoadM = parseFloat(fromMXLoadM);
            if (isNaN(fromMXLoadM))
                fromMXLoadM = 0.0;
        }
        var fromMYLoadM = $('#fromMYLoadML').val();
        if (fromMYLoadM != '(various)') {
            fromMYLoadM = parseFloat(fromMYLoadM);
            if (isNaN(fromMYLoadM))
                fromMYLoadM = 0.0;
        }
        var fromMZLoadM = $('#fromMZLoadML').val();
        if (fromMZLoadM != '(various)') {
            fromMZLoadM = parseFloat(fromMZLoadM);
            if (isNaN(fromMZLoadM))
                fromMZLoadM = 0.0;
        }
        var toFXLoadM = $('#toFXLoadML').val();
        if (toFXLoadM != '(various)') {
            toFXLoadM = parseFloat(toFXLoadM);
            if (isNaN(toFXLoadM))
                toFXLoadM = 0.0;
        }
        var toFYLoadM = $('#toFYLoadML').val();
        if (toFYLoadM != '(various)') {
            toFYLoadM = parseFloat(toFYLoadM);
            if (isNaN(toFYLoadM))
                toFYLoadM = 0.0;
        }
        var toFZLoadM = $('#toFZLoadML').val();
        if (toFZLoadM != '(various)') {
            toFZLoadM = parseFloat(toFZLoadM);
            if (isNaN(toFZLoadM))
                toFZLoadM = 0.0;
        }
        var toMXLoadM = $('#toMXLoadML').val();
        if (toMXLoadM != '(various)') {
            toMXLoadM = parseFloat(toMXLoadM);
            if (isNaN(toMXLoadM))
                toMXLoadM = 0.0;
        }
        var toMYLoadM = $('#toMYLoadML').val();
        if (toMYLoadM != '(various)') {
            toMYLoadM = parseFloat(toMYLoadM);
            if (isNaN(toMYLoadM))
                toMYLoadM = 0.0;
        }
        var toMZLoadM = $('#toMZLoadML').val();
        if (toMZLoadM != '(various)') {
            toMZLoadM = parseFloat(toMZLoadM);
            if (isNaN(toMZLoadM))
                toMZLoadM = 0.0;
        }

        if (fromFXLoadM != '(various)' || fromFYLoadM != '(various)' || fromFZLoadM != '(various)' ||
        fromMXLoadM != '(various)' ||
        fromMYLoadM != '(various)' ||
        fromMZLoadM != '(various)' ||
        toFXLoadM != '(various)' ||
        toFYLoadM != '(various)' ||
        toFZLoadM != '(various)' ||
        toMXLoadM != '(various)' ||
        toMYLoadM != '(various)' ||
        toMZLoadM != '(various)') {
            var modalConcCols = ($('#modalConcLCols').is(':checked'));
            var modalConcBeams = ($('#modalConcLBeams').is(':checked'));
            var modalConcBraces = ($('#modalConcLBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalConcCols && isAColumn(modelElements[i])) ||
                (modalConcBeams && isABeam(modelElements[i])) ||
                (modalConcBraces && isABrace(modelElements[i]))) {

                    if( fromFXLoadM != '(various)' )
                        modelElements[i].fromFXLoadL = fromFXLoadM;
                    if( fromFYLoadM != '(various)' )
                        modelElements[i].fromFYLoadL = fromFYLoadM;
                    if( fromFZLoadM != '(various)' )
                        modelElements[i].fromFZLoadL = fromFZLoadM;
                    if( fromMXLoadM != '(various)' )
                        modelElements[i].fromMXLoadL = fromMXLoadM;
                    if( fromMYLoadM != '(various)' )
                        modelElements[i].fromMYLoadL = fromMYLoadM;
                    if( fromMZLoadM != '(various)' )
                        modelElements[i].fromMZLoadL = fromMZLoadM;
                    if( toFXLoadM != '(various)' )
                        modelElements[i].toFXLoadL = toFXLoadM;
                    if( toFYLoadM != '(various)' )
                        modelElements[i].toFYLoadL = toFYLoadM;
                    if( toFZLoadM != '(various)' )
                        modelElements[i].toFZLoadL = toFZLoadM;
                    if( toMXLoadM != '(various)' )
                        modelElements[i].toMXLoadL = toMXLoadM;
                    if( toMYLoadM != '(various)' )
                        modelElements[i].toMYLoadL = toMYLoadM;
                    if( toMZLoadM != '(various)' )
                        modelElements[i].toMZLoadL = toMZLoadM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                      data: modelElements[i],
                        success: function(msg){
                            //                              alert( "Data Saved: " + msg );
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalConcLive').modal('hide');
    });

    $('#modalConcLCols').click(getModalConcLive);
    $('#modalConcLBeams').click(getModalConcLive);
    $('#modalConcLBraces').click(getModalConcLive);

    $('#modalUnifOccOK').click(function(e){
        if( !editRights )
            return;
        var uXM = $('#uXMO').val();
        if (uXM != '(various)') {
            uXM = parseFloat(uXM);
            if (isNaN(uXM))
                uXM = 0.0;
        }
        var uYM = $('#uYMO').val();
        if (uYM != '(various)') {
            uYM = parseFloat(uYM);
            if (isNaN(uYM))
                uYM = 0.0;
        }
        var uZM = $('#uZMO').val();
        if (uZM != '(various)') {
            uZM = parseFloat(uZM);
            if (isNaN(uZM))
                uZM = 0.0;
        }

        if (uXM != '(various)' || uYM != '(various)' || uZM != '(various)') {
            var modalUnifCols = ($('#modalUnifOCols').is(':checked'));
            var modalUnifBeams = ($('#modalUnifOBeams').is(':checked'));
            var modalUnifBraces = ($('#modalUnifOBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalUnifCols && isAColumn(modelElements[i])) ||
                    (modalUnifBeams && isABeam(modelElements[i])) ||
                    (modalUnifBraces && isABrace(modelElements[i]))) {
                    if( uXM != '(various)')
                        modelElements[i].uXO = uXM;
                    if( uYM != '(various)')
                        modelElements[i].uYO = uYM;
                    if( uZM != '(various)')
                        modelElements[i].uZO = uZM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                      data: modelElements[i],
                        success: function(msg){
                            //                              alert( "Data Saved: " + msg );
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalUniformOcc').modal('hide');
    });

    $('#modalUnifOCols').click(getModalUnifOcc);
    $('#modalUnifOBeams').click(getModalUnifOcc);
    $('#modalUnifOBraces').click(getModalUnifOcc);

    $('#modalConcOccOK').click(function(e){
        if( !editRights )
            return;
        var fromFXLoadM = $('#fromFXLoadMO').val();
        if (fromFXLoadM != '(various)') {
            fromFXLoadM = parseFloat(fromFXLoadM);
            if (isNaN(fromFXLoadM))
                fromFXLoadM = 0.0;
        }
        var fromFYLoadM = $('#fromFYLoadMO').val();
        if (fromFYLoadM != '(various)') {
            fromFYLoadM = parseFloat(fromFYLoadM);
            if (isNaN(fromFYLoadM))
                fromFYLoadM = 0.0;
        }
        var fromFZLoadM = $('#fromFZLoadMO').val();
        if (fromFZLoadM != '(various)') {
            fromFZLoadM = parseFloat(fromFZLoadM);
            if (isNaN(fromFZLoadM))
                fromFZLoadM = 0.0;
        }
        var fromMXLoadM = $('#fromMXLoadMO').val();
        if (fromMXLoadM != '(various)') {
            fromMXLoadM = parseFloat(fromMXLoadM);
            if (isNaN(fromMXLoadM))
                fromMXLoadM = 0.0;
        }
        var fromMYLoadM = $('#fromMYLoadMO').val();
        if (fromMYLoadM != '(various)') {
            fromMYLoadM = parseFloat(fromMYLoadM);
            if (isNaN(fromMYLoadM))
                fromMYLoadM = 0.0;
        }
        var fromMZLoadM = $('#fromMZLoadMO').val();
        if (fromMZLoadM != '(various)') {
            fromMZLoadM = parseFloat(fromMZLoadM);
            if (isNaN(fromMZLoadM))
                fromMZLoadM = 0.0;
        }
        var toFXLoadM = $('#toFXLoadMO').val();
        if (toFXLoadM != '(various)') {
            toFXLoadM = parseFloat(toFXLoadM);
            if (isNaN(toFXLoadM))
                toFXLoadM = 0.0;
        }
        var toFYLoadM = $('#toFYLoadMO').val();
        if (toFYLoadM != '(various)') {
            toFYLoadM = parseFloat(toFYLoadM);
            if (isNaN(toFYLoadM))
                toFYLoadM = 0.0;
        }
        var toFZLoadM = $('#toFZLoadMO').val();
        if (toFZLoadM != '(various)') {
            toFZLoadM = parseFloat(toFZLoadM);
            if (isNaN(toFZLoadM))
                toFZLoadM = 0.0;
        }
        var toMXLoadM = $('#toMXLoadMO').val();
        if (toMXLoadM != '(various)') {
            toMXLoadM = parseFloat(toMXLoadM);
            if (isNaN(toMXLoadM))
                toMXLoadM = 0.0;
        }
        var toMYLoadM = $('#toMYLoadMO').val();
        if (toMYLoadM != '(various)') {
            toMYLoadM = parseFloat(toMYLoadM);
            if (isNaN(toMYLoadM))
                toMYLoadM = 0.0;
        }
        var toMZLoadM = $('#toMZLoadMO').val();
        if (toMZLoadM != '(various)') {
            toMZLoadM = parseFloat(toMZLoadM);
            if (isNaN(toMZLoadM))
                toMZLoadM = 0.0;
        }

        if (fromFXLoadM != '(various)' || fromFYLoadM != '(various)' || fromFZLoadM != '(various)' ||
        fromMXLoadM != '(various)' ||
        fromMYLoadM != '(various)' ||
        fromMZLoadM != '(various)' ||
        toFXLoadM != '(various)' ||
        toFYLoadM != '(various)' ||
        toFZLoadM != '(various)' ||
        toMXLoadM != '(various)' ||
        toMYLoadM != '(various)' ||
        toMZLoadM != '(various)') {
            var modalConcCols = ($('#modalConcOCols').is(':checked'));
            var modalConcBeams = ($('#modalConcOBeams').is(':checked'));
            var modalConcBraces = ($('#modalConcOBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalConcCols && isAColumn(modelElements[i])) ||
                (modalConcBeams && isABeam(modelElements[i])) ||
                (modalConcBraces && isABrace(modelElements[i]))) {

                    if( fromFXLoadM != '(various)' )
                        modelElements[i].fromFXLoadO = fromFXLoadM;
                    if( fromFYLoadM != '(various)' )
                        modelElements[i].fromFYLoadO = fromFYLoadM;
                    if( fromFZLoadM != '(various)' )
                        modelElements[i].fromFZLoadO = fromFZLoadM;
                    if( fromMXLoadM != '(various)' )
                        modelElements[i].fromMXLoadO = fromMXLoadM;
                    if( fromMYLoadM != '(various)' )
                        modelElements[i].fromMYLoadO = fromMYLoadM;
                    if( fromMZLoadM != '(various)' )
                        modelElements[i].fromMZLoadO = fromMZLoadM;
                    if( toFXLoadM != '(various)' )
                        modelElements[i].toFXLoadO = toFXLoadM;
                    if( toFYLoadM != '(various)' )
                        modelElements[i].toFYLoadO = toFYLoadM;
                    if( toFZLoadM != '(various)' )
                        modelElements[i].toFZLoadO = toFZLoadM;
                    if( toMXLoadM != '(various)' )
                        modelElements[i].toMXLoadO = toMXLoadM;
                    if( toMYLoadM != '(various)' )
                        modelElements[i].toMYLoadO = toMYLoadM;
                    if( toMZLoadM != '(various)' )
                        modelElements[i].toMZLoadO = toMZLoadM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                      data: modelElements[i],
                        success: function(msg){
                            //                              alert( "Data Saved: " + msg );
                        } // function
                    }); //ajax
                }
            }
            setUndo(1, 0 /* ,1 */);
            displayElement(currElmt);
            drawModel(false,false);
        }
        lastDownTarget = oldLastDownTarget;
        $('#modalConcOcc').modal('hide');
    });

    $('#modalConcOCols').click(getModalConcOcc);
    $('#modalConcOBeams').click(getModalConcOcc);
    $('#modalConcOBraces').click(getModalConcOcc);

    $('#modalPipingOK').click(function(e){

        if( !editRights )
            return;
        var pressM = $('#pressureLoadM').val();
        if (pressM != '(various)') {
            pressM = parseFloat(pressM);
            if (isNaN(pressM))
                pressM = 0.0;
        }
        var fluidM = $('#fluidLoadM').val();
        if (fluidM != '(various)') {
            fluidM = parseFloat(fluidM);
            if (isNaN(fluidM))
                fluidM = 0.0;
        }
    
        if (pressM != '(various)' || fluidM != '(various)' ) {
            var modalPipingCols = ($('#modalPipingCols').is(':checked'));
            var modalPipingBeams = ($('#modalPipingBeams').is(':checked'));
            var modalPipingBraces = ($('#modalPipingBraces').is(':checked'));

            for (var ii = 0; ii < selectionSet.length; ii++) {
                i = selectionSet[ii];

                if ((modalPipingCols && isAColumn(modelElements[i])) ||
                (modalPipingBeams && isABeam(modelElements[i])) ||
                (modalPipingBraces && isABrace(modelElements[i]))) {

                    if (pressM != '(various)' )
                        modelElements[i].pressure = pressM;
                    if (fluidM != '(various)' )
                        modelElements[i].fluid = fluidM;

                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        success: function(msg){
                        } // function
                    }); //ajax
                }
            }
      
            setUndo(1, 0 );
            displayElement(currElmt);
            drawModel(false,true);
        }  
        lastDownTarget = oldLastDownTarget;
        $('#modalPiping').modal('hide'); 
    });

    $('#modalPipingCols').click(getModalPiping);
    $('#modalPipingBeams').click(getModalPiping);
    $('#modalPipingBraces').click(getModalPiping);

    $('#modalGroupNameOK').click(function(e){

        if( !editRights )
            return;
        var st = gNM.getRawValue();
        if( st ) 
            gNM.addToSelection({id: st, name: st});

        var modalGroupNameCols = ($('#modalGroupNameCols').is(':checked'));
        var modalGroupNameBeams = ($('#modalGroupNameBeams').is(':checked'));
        var modalGroupNameBraces = ($('#modalGroupNameBraces').is(':checked'));

        var addTo = false;
        var gp = gNM.getSelectedItems();
        for (var i=0; i<gp.length; i++ ) {
            if (gp[i].name == "(various)" ) 
                addTo = true;
            else {
                if( groupList.indexOf(gp[i].name) < 0 ) 
                    groupList.push(gp[i].name);
            }
        }
        var gp1 = JSON.stringify(gp);
        resetGroupLists(groupList);
    
        for (var ii = 0; ii < selectionSet.length; ii++) {
            i = selectionSet[ii];
            var chg = false;

            if ((modalGroupNameCols && isAColumn(modelElements[i])) ||
              (modalGroupNameBeams && isABeam(modelElements[i])) ||
              (modalGroupNameBraces && isABrace(modelElements[i]))) {
                if (!addTo) {
                    if (modelElements[i].group != gp1) {
                        chg = true;
                        modelElements[i].group = gp1;
                    }
                }
                else {
                    var gp2 = [];
                    if (modelElements[i].group) 
                        gp2 = JSON.parse(modelElements[i].group);
                    for (var i1 = 0; i1 < gp.length; i1++) {
                        if (gp[i1].name != "(various)") {
                            var found = false;
                            for (var i2 = 0; i2 < gp2.length; i2++) {
                                if (gp2[i2].name == gp[i1].name) {
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                gp2.push({
                                    "id": gp[i1].name,
                                    "name": gp[i1].name
                                });
                                chg = true;
                            }
                        }
                    }
                    modelElements[i].group = JSON.stringify(gp2);
                }
        
                if (chg) {
                    $.ajax({
                        type: "POST",
                        url: "./php/storeElement.php",
                        data: {
                            "userName": userName1,
                            "jobName": jobName,
                            "modelEl": modelElements[i]
                        },
                        //                      data: modelElements[i],
                        success: function(msg){
                            //                              alert( "Data Saved: " + msg );
                        } // function
                    }); //ajax
                }
            }
        }
        setUndo(1, 0 /* ,1 */);
        displayElement(currElmt);
        lastDownTarget = oldLastDownTarget;
    });

    $('#modalGroupNameCols').click(getModalGroups);
    $('#modalGroupNameBeams').click(getModalGroups);
    $('#modalGroupNameBraces').click(getModalGroups);

    $('#modalGroupSelectOK').click(function(e){  

        if( !editRights )
            return;
        var st = gNS.getRawValue();
        if (st) {
            if (groupList.indexOf(st) >= 0) 
                gNS.addToSelection({
                    id: st,
                    name: st
                });
            else
                return
        }
        var gp = gNS.getSelectedItems();

        var modalSelectAction = $('input[name=selectAction]:checked').val();

        var modalSelectCols = ($('#modalGroupSelectCols').is(':checked'));
        var modalSelectBeams = ($('#modalGroupSelectBeams').is(':checked'));
        var modalSelectBraces = ($('#modalGroupSelectBraces').is(':checked'));

        if( modalSelectAction == "Replace" ) 
            selectionSet = [];
      
        for (var i = 1; i <= totEls; i++) {
            if ((modalSelectCols && isAColumn(modelElements[i])) ||
                (modalSelectBeams && isABeam(modelElements[i])) ||
                (modalSelectBraces && isABrace(modelElements[i]))) {

                var gp1 = [];
                if( modelElements[i].group ) 
                    gp1 = JSON.parse(modelElements[i].group);

                var found = true;
                for (var ii=0; ii< gp.length; ii++ ) {
                    found = false;
                    for (var jj=0; jj< gp1.length; jj++ ) {
                        if( gp1[jj].name == gp[ii].name) {
                            found = true;
                            break;
                        }
                    }
                    if( !found ) 
                        break;
                }
                if( found ) {
                    if( selectionSet.indexOf(i) < 0 )
                        selectionSet.push(i);
                }
            }
        }

        if (deformed) {
            deformed = false; // draw the original
            drawModel(false,false);
            deformed = true; // draw the deformed
        }
        drawModel(false,false);
    });

    function round(value, decimals) {
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    $('#modalCopyOK').click(function(e){

        if( !editRights )
            return;

        if (!isEqual1(modelElements[currElmt], getScreenEntries()) || (currElmt > totEls)) {

            // save any unprocessed changes
            if (validEntry(false)) {
                if (memberDefault && newMember) {
                    var iSav = currElmt;
                    nextEl(true);
                    currElmt = iSav;
                }
                else {
                    storeElement(1, 1, 1, 1, 1, 1, 1, 1, 0, -1, false, true);
                }
            }
        }

        var newElms = [];
        var dist1 = true;
        var dist2 = true;
        var dist3 = true;

        var nod1 = true;
        var nod2 = true;
        var nod3 = true;
    
        var it1 = parseInt($('#iter1X').val());
        if( isNaN(it1) || it1 <= 0)
            it1 = 1;

        var inc1 = parseInt($('#iter1Incr').val());
        if (isNaN(inc1) || inc1 <= 0) {
            inc1 = nodInc;
            nod1 = false;
        }

        var freeFormX = $('#elemDupX1').val();
        var freeFormY = $('#elemDupY1').val();
        var freeFormZ = $('#elemDupZ1').val();

        var deltas1 = [];
        for (var i = 0; i < it1; i++) {
            deltas1[i] = [0.0, 0.0, 0.0];
        }

        if( !(freeFormX + freeFormY + freeFormZ) )
            dist1 = false;
        else {
            var freeForm = freeFormX;
            if( !processFreeForm1(deltas1, freeFormX, it1, 0) ) {
                bootbox.alert("Invalid Iteration1 X-variation specification: '" + freeForm +
                              "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
                return;
            }

            freeForm = freeFormY;
            if( !processFreeForm1(deltas1, freeFormY, it1, 1) ) {
                bootbox.alert("Invalid Iteration1 Y-variation specification: '" + freeForm +
                              "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
                return;
            }

            freeForm = freeFormZ;
            if( !processFreeForm1(deltas1, freeFormZ, it1, 2) ) {
                bootbox.alert("Invalid Iteration1 Z-variation specification: '" + freeForm +
                              "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
                return;
            }
        }                
    
        var it2 = parseInt($('#iter2X').val());
        if (isNaN(it2) || it2 <= 0)
            it2 = 1;
        var inc2 = parseInt($('#iter2Incr').val());
        if (isNaN(inc2) || inc2 <= 0) {
            inc2 = nodInc;
            nod2 = false;
        }

        freeFormX = $('#elemDupX2').val();
        freeFormY = $('#elemDupY2').val();
        freeFormZ = $('#elemDupZ2').val();

        var deltas2 = [];
        for (var i = 0; i < it2; i++) {
            deltas2[i] = [0.0, 0.0, 0.0];
        }

        if (!(freeFormX + freeFormY + freeFormZ)) 
            dist2 = false;
        else {
            freeForm = freeFormX;
            if (!processFreeForm1(deltas2, freeFormX, it2, 0)) {
                bootbox.alert("Invalid Iteration2 X-variation specification: '" + freeForm +
                "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
                return;
            }
      
            freeForm = freeFormY;
            if (!processFreeForm1(deltas2, freeFormY, it2, 1)) {
                bootbox.alert("Invalid Iteration2 Y-variation specification: '" + freeForm +
                "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
                return;
            }
      
            freeForm = freeFormZ;
            if (!processFreeForm1(deltas2, freeFormZ, it2, 2)) {
                bootbox.alert("Invalid Iteration2 Z-variation specification: '" + freeForm +
                "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
                return;
            }
        }

        var it3 = parseInt($('#iter3X').val());
        if (isNaN(it3) || it3 <= 0)
            it3 = 1;
        var inc3 = parseInt($('#iter3Incr').val());
        if (isNaN(inc3) || inc3 <= 0) {
            inc3 = nodInc;
            nod3 = false;
        }

        freeFormX = $('#elemDupX3').val();
        freeFormY = $('#elemDupY3').val();
        freeFormZ = $('#elemDupZ3').val();

        var deltas3 = [];
        for (var i = 0; i < it3; i++) {
            deltas3[i] = [0.0, 0.0, 0.0];
        }

        if (!(freeFormX + freeFormY + freeFormZ)) 
            dist3 = false;
        else {
            freeForm = freeFormX;
            if (!processFreeForm1(deltas3, freeFormX, it3, 0)) {
                bootbox.alert("Invalid Iteration3 X-variation specification: '" + freeForm +
                "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
                return;
            }
      
            freeForm = freeFormY;
            if (!processFreeForm1(deltas3, freeFormY, it3, 1)) {
                bootbox.alert("Invalid Iteration3 Y-variation specification: '" + freeForm +
                "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
                return;
            }
      
            freeForm = freeFormZ;
            if (!processFreeForm1(deltas3, freeFormZ, it3, 2)) {
                bootbox.alert("Invalid Iteration3 Z-variation specification: '" + freeForm +
                "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
                return;
            }
        }

        if( (!dist1 && !nod1 && it1 > 1) || (!dist2 && !nod2 && it2 > 1) || (!dist3 && !nod3 && it3 > 1)) {
            bootbox.alert("Increment and distance cannot both be blank.");
            return;
        }

        var modalCopyCols = ($('#modalCopyCols').is(':checked'));
        var modalCopyBeams = ($('#modalCopyBeams').is(':checked'));
        var modalCopyBraces = ($('#modalCopyBraces').is(':checked'));

        var modalIgnore = ($('#modalIgnore').is(':checked'));
    
        if (!dist1 && !dist2 && !dist3) {
            if( (!nod1 && it1 > 1) || (!nod2 && it2 > 1) || (!nod3 && it3 > 1) )
                modalIgnore = false;    // we specified some iteration but not the node increment, so disable any "Ignore" switch 

            var totEls1 = totEls;
            for (var i3 = 0; i3 < it3; i3++) {
                for (var i2 = 0; i2 < it2; i2++) {
                    for (var i1 = 0; i1 < it1; i1++) {
                        if (i1 > 0 || i2 > 0 || i3 > 0) {
                            for (var i = 1; i <= totEls1; i++) { // we want to preserve order
                                if (selectionSet.indexOf(i) != -1) {
                                    if ((modalCopyCols && isAColumn(modelElements[i])) ||
                                    (modalCopyBeams && isABeam(modelElements[i])) ||
                                    (modalCopyBraces && isABrace(modelElements[i]))) {
                  
                                        totEls++;
                    
                                        var dxx = modelElements[i].dX;
                                        var dyy = modelElements[i].dY;
                                        var dzz = modelElements[i].dZ;
                    
                                        if (modalIgnore) {
                                            var pt = getCoords1(modelElements[i].fromNode + i1 * inc1 + i2 * inc2 + i3 * inc3, modelElements[i].toNode + i1 * inc1 + i2 * inc2 + i3 * inc3, dxx, dyy, dzz);
                                            if ((pt[0] != 0.0) || (pt[1] != 0.0) || (pt[2] != 0.0)) {
                                                dxx = pt[0];
                                                dyy = pt[1];
                                                dzz = pt[2];
                                            }
                                            else {
                                                coords[totEls].x2 = dxx / uConstLength;
                                                coords[totEls].y2 = dyy / uConstLength;
                                                coords[totEls].z2 = dzz / uConstLength;
                                            }
                                        }
                    
                                        newElms.push(totEls);
                    
                                        modelElements[totEls] = {
                                            jobName: modelElements[i].jobName,
                                            order: totEls,
                                            keyID: randomInteger(10000000),
                                            fromNode: modelElements[i].fromNode + i1 * inc1 + i2 * inc2 + i3 * inc3,
                                            toNode: modelElements[i].toNode + i1 * inc1 + i2 * inc2 + i3 * inc3,
                                            dX: dxx,
                                            dY: dyy,
                                            dZ: dzz,
                                            memberType: modelElements[i].memberType,
                                            pipOD:  modelElements[i].pipOD,
                                            pipTh: modelElements[i].pipTh,
                                            betaAngle: modelElements[i].betaAngle,
                                            material: modelElements[i].material,
                                            fromFXRest: modelElements[i].fromFXRest,
                                            fromFYRest: modelElements[i].fromFYRest,
                                            fromFZRest: modelElements[i].fromFZRest,
                                            fromMXRest: modelElements[i].fromMXRest,
                                            fromMYRest: modelElements[i].fromMYRest,
                                            fromMZRest: modelElements[i].fromMZRest,
                                            toFXRest: modelElements[i].toFXRest,
                                            toFYRest: modelElements[i].toFYRest,
                                            toFZRest: modelElements[i].toFZRest,
                                            toMXRest: modelElements[i].toMXRest,
                                            toMYRest: modelElements[i].toMYRest,
                                            toMZRest: modelElements[i].toMZRest,
                                            fromFXMemb: modelElements[i].fromFXMemb,
                                            fromFYMemb: modelElements[i].fromFYMemb,
                                            fromFZMemb: modelElements[i].fromFZMemb,
                                            fromMXMemb: modelElements[i].fromMXMemb,
                                            fromMYMemb: modelElements[i].fromMYMemb,
                                            fromMZMemb: modelElements[i].fromMZMemb,
                                            toFXMemb: modelElements[i].toFXMemb,
                                            toFYMemb: modelElements[i].toFYMemb,
                                            toFZMemb: modelElements[i].toFZMemb,
                                            toMXMemb: modelElements[i].toMXMemb,
                                            toMYMemb: modelElements[i].toMYMemb,
                                            toMZMemb: modelElements[i].toMZMemb,
                                            uX: modelElements[i].uX,
                                            uY: modelElements[i].uY,
                                            uZ: modelElements[i].uZ,
                                            fromFXLoad: modelElements[i].fromFXLoad,
                                            fromFYLoad: modelElements[i].fromFYLoad,
                                            fromFZLoad: modelElements[i].fromFZLoad,
                                            fromMXLoad: modelElements[i].fromMXLoad,
                                            fromMYLoad: modelElements[i].fromMYLoad,
                                            fromMZLoad: modelElements[i].fromMZLoad,
                                            toFXLoad: modelElements[i].toFXLoad,
                                            toFYLoad: modelElements[i].toFYLoad,
                                            toFZLoad: modelElements[i].toFZLoad,
                                            toMXLoad: modelElements[i].toMXLoad,
                                            toMYLoad: modelElements[i].toMYLoad,
                                            toMZLoad: modelElements[i].toMZLoad,
                      
                                            uXL: modelElements[i].uXL,
                                            uYL: modelElements[i].uYL,
                                            uZL: modelElements[i].uZL,
                                            fromFXLoadL: modelElements[i].fromFXLoadL,
                                            fromFYLoadL: modelElements[i].fromFYLoadL,
                                            fromFZLoadL: modelElements[i].fromFZLoadL,
                                            fromMXLoadL: modelElements[i].fromMXLoadL,
                                            fromMYLoadL: modelElements[i].fromMYLoadL,
                                            fromMZLoadL: modelElements[i].fromMZLoadL,
                                            toFXLoadL: modelElements[i].toFXLoadL,
                                            toFYLoadL: modelElements[i].toFYLoadL,
                                            toFZLoadL: modelElements[i].toFZLoadL,
                                            toMXLoadL: modelElements[i].toMXLoadL,
                                            toMYLoadL: modelElements[i].toMYLoadL,
                                            toMZLoadL: modelElements[i].toMZLoadL,
                      
                                            uXO: modelElements[i].uXO,
                                            uYO: modelElements[i].uYO,
                                            uZO: modelElements[i].uZO,
                                            fromFXLoadO: modelElements[i].fromFXLoadO,
                                            fromFYLoadO: modelElements[i].fromFYLoadO,
                                            fromFZLoadO: modelElements[i].fromFZLoadO,
                                            fromMXLoadO: modelElements[i].fromMXLoadO,
                                            fromMYLoadO: modelElements[i].fromMYLoadO,
                                            fromMZLoadO: modelElements[i].fromMZLoadO,
                                            toFXLoadO: modelElements[i].toFXLoadO,
                                            toFYLoadO: modelElements[i].toFYLoadO,
                                            toFZLoadO: modelElements[i].toFZLoadO,
                                            toMXLoadO: modelElements[i].toMXLoadO,
                                            toMYLoadO: modelElements[i].toMYLoadO,
                                            toMZLoadO: modelElements[i].toMZLoadO,
                      
                                            lX: modelElements[i].lX,
                                            lY: modelElements[i].lY,
                                            lZ: modelElements[i].lZ,
                                            kX: modelElements[i].kX,
                                            kY: modelElements[i].kY,
                                            kZ: modelElements[i].kZ,
                      
                                            cBZ: modelElements[i].cBZ,
                                            cBY: modelElements[i].cBY,
                                            stable: modelElements[i].stable,
                      
                                            stiffDist: modelElements[i].stiffDist,
                                            stiffI: modelElements[i].stiffI,
                                            tfaStiff: modelElements[i].tfaStiff,
                                            pressure: modelElements[i].pressure,
                                            fluid: modelElements[i].fluid,
                                            group: modelElements[i].group,
                                            hidden: false, // it seems to make sense to not hide the new elements
                                            totEls: totEls
                                        };
                    
                                        $.ajax({
                                            type: "POST",
                                            url: "./php/storeElement.php",
                                            data: {
                                                "userName": userName1,
                                                "jobName": jobName,
                                                "modelEl": modelElements[totEls]
                                            },
                                            //                                  data: modelElements[totEls],
                                            success: function(msg){
                                            }, // function
                                            error: function(msg){
                                            }, // function
                                            complete: function(msg){
                                            } // function
                                        }); //ajax
                                    } // if right type of element
                                } // if in selection set
                            } //for i
                        } //if not original element
                    } //for i1
                } //for i2
            } //for i3
        }
        else { 
            if ((dist1 || it1 <= 1) && (dist2 || it2 <= 1) && (dist3 || it3 <= 1)) {
                // this branch is for copying by distance
        
                // figure out which ones will need fixed nodes
        
                var fxNd = [];      //{ el: 0, tf: "f" }

                for (var i1 = 0; i1 < selectionSet.length; i1++) { // we want to preserve order
                    var i = selectionSet[i1];
                    if ((modalCopyCols && isAColumn(modelElements[i])) ||
                        (modalCopyBeams && isABeam(modelElements[i])) ||
                        (modalCopyBraces && isABrace(modelElements[i]))) {
            
                        fxNd.push({
                            "el": i,
                            "tf": "f"
                        });
                    }
                }
        

                var totEls1 = totEls;
        
                var oldNodes = fNodes.length;

                var incrr = 0;
                var xi3 = 0.0;
                var yi3 = 0.0;
                var zi3 = 0.0;
                for (var i3 = 0; i3 < it3; i3++) {
                    if (i3 > 0) {
                        xi3 += deltas3[i3 - 1][0];
                        yi3 += deltas3[i3 - 1][1];
                        zi3 += deltas3[i3 - 1][2];
                    }

                    var xi2 = 0.0;
                    var yi2 = 0.0;
                    var zi2 = 0.0;
                    for (var i2 = 0; i2 < it2; i2++) {
                        if (i2 > 0) {
                            xi2 += deltas2[i2 - 1][0];
                            yi2 += deltas2[i2 - 1][1];
                            zi2 += deltas2[i2 - 1][2];
                        }

                        var xi1 = 0.0;
                        var yi1 = 0.0;
                        var zi1 = 0.0;
                        for (var i1 = 0; i1 < it1; i1++) {
                            if (i1 > 0) {
                                xi1 += deltas1[i1 - 1][0];
                                yi1 += deltas1[i1 - 1][1];
                                zi1 += deltas1[i1 - 1][2];
                            }

                            if (i1 > 0 || i2 > 0 || i3 > 0) {
                                for (var i = 1; i <= totEls1; i++) { // we want to preserve order
                                    if (selectionSet.indexOf(i) != -1) {
                                        if ((modalCopyCols && isAColumn(modelElements[i])) ||
                                            (modalCopyBeams && isABeam(modelElements[i])) ||
                                            (modalCopyBraces && isABrace(modelElements[i]))) {
                    
                                            var xx1 = coords[i].x1 * uConstLength + xi1 + xi2 + xi3;
                                            var yy1 = coords[i].y1 * uConstLength + yi1 + yi2 + yi3;
                                            var zz1 = coords[i].z1 * uConstLength + zi1 + zi2 + zi3;
                      
                                            var xx2 = coords[i].x2 * uConstLength + xi1 + xi2 + xi3;
                                            var yy2 = coords[i].y2 * uConstLength + yi1 + yi2 + yi3;
                                            var zz2 = coords[i].z2 * uConstLength + zi1 + zi2 + zi3;
                      
                                            var dxx = xx2 - xx1;
                                            var dyy = yy2 - yy1;
                                            var dzz = zz2 - zz1;
                      
                                            coords[totEls+1] = { 
                                                x1: xx1 / uConstLength,
                                                y1: yy1 / uConstLength,
                                                z1: zz1 / uConstLength,
                                                x2: xx2 / uConstLength,
                                                y2: yy2 / uConstLength,
                                                z2: zz2 / uConstLength
                                            };
                      
                                            var fFound = false;
                                            var tFound = false;
                                            var fN = 0;
                                            var tN = 0;
                                            xtol = 0.05;
                                            for (var j=0; j<fNodes.length; j++ ) {
                                                if( !fFound && Math.abs(fNodes[j].x - xx1) < xtol &&
                                                  Math.abs(fNodes[j].y - yy1) < xtol && 
                                                  Math.abs(fNodes[j].z - zz1) < xtol ) {
                                                    fN = fNodes[j].node;
                                                    fFound = true;
                                                }
                                                if( !tFound && Math.abs(fNodes[j].x - xx2) < xtol &&
                                                  Math.abs(fNodes[j].y - yy2) < xtol && 
                                                  Math.abs(fNodes[j].z - zz2) < xtol ) {
                                                    tN = fNodes[j].node;
                                                    tFound = true;
                                                }
                                                if( fFound && tFound ) 
                                                    break;
                                            }
                      
                                            for (var j=1; j<=totEls; j++ ) {
                                                if( !fFound && Math.abs(coords[j].x1 - xx1/uConstLength) < xtol &&
                                                  Math.abs(coords[j].y1 - yy1/uConstLength) < xtol && 
                                                  Math.abs(coords[j].z1 - zz1/uConstLength) < xtol ) {
                                                    fN = modelElements[j].fromNode;
                                                    fFound = true;
                                                }

                                                if( !fFound && Math.abs(coords[j].x2 - xx1/uConstLength) < xtol &&
                                                  Math.abs(coords[j].y2 - yy1/uConstLength) < xtol && 
                                                  Math.abs(coords[j].z2 - zz1/uConstLength) < xtol ) {
                                                    fN = modelElements[j].toNode;
                                                    fFound = true;
                                                }

                                                if( !tFound && Math.abs(coords[j].x1 - xx2/uConstLength) < xtol &&
                                                  Math.abs(coords[j].y1 - yy2/uConstLength) < xtol && 
                                                  Math.abs(coords[j].z1 - zz2/uConstLength) < xtol ) {
                                                    tN = modelElements[j].fromNode;
                                                    tFound = true;
                                                }

                                                if( !tFound && Math.abs(coords[j].x2 - xx2/uConstLength) < xtol &&
                                                  Math.abs(coords[j].y2 - yy2/uConstLength) < xtol && 
                                                  Math.abs(coords[j].z2 - zz2/uConstLength) < xtol ) {
                                                    tN = modelElements[j].toNode;
                                                    tFound = true;
                                                }
                                                if( fFound && tFound ) 
                                                    break;
                                            }

                      
                                            if( !fFound )
                                                fN = getNewNode(modelElements[i].fromNode + i1 * inc1 + i2 * inc2 + i3 * inc3);
                                            if (!tFound) {
                                                tN = getNewNode(modelElements[i].toNode + i1 * inc1 + i2 * inc2 + i3 * inc3);
                                                if (tN == fN) {
                                                    tN += nodInc;
                                                    tN = getNewNode(tN);
                                                }
                                            }
                                            totEls++;
                      
                                            // do we need a fixed node?
                      
                                            if ( !(fFound || tFound) ) {
                                                for( var k=0; k<fxNd.length; k++ ) {
                                                    if( fxNd[k].el == i && fxNd[k].tf == "f" ){
                                                        if (!fFound) {
                                                            fNodes.push({
                                                                "node": fN,
                                                                "x": xx1,
                                                                "y": yy1,
                                                                "z": zz1
                                                            });
                                                            $.ajax({
                                                                type: "POST",
                                                                url: "./php/storeNode.php",
                                                                data: {
                                                                    "userName": userName1,
                                                                    "jobName": jobName,
                                                                    "Node": fN,
                                                                    "X": xx1,
                                                                    "Y": yy1,
                                                                    "Z": zz1
                                                                },
                                                            });
                                                        }
                                                        break;
                                                    }

                                                    if( fxNd[k].el == i && fxNd[k].tf == "t" ){
                                                        if (!tFound) {
                                                            fNodes.push({
                                                                "node": tN,
                                                                "x": xx2,
                                                                "y": yy2,
                                                                "z": zz2
                                                            });
                                                            $.ajax({
                                                                type: "POST",
                                                                url: "./php/storeNode.php",
                                                                data: {
                                                                    "userName": userName1,
                                                                    "jobName": jobName,
                                                                    "Node": tN,
                                                                    "X": xx2,
                                                                    "Y": yy2,
                                                                    "Z": zz2
                                                                },
                                                            });
                                                        }
                                                        break;
                                                    }
                                                }
                                            }

                                            newElms.push(totEls);
                    
                                            modelElements[totEls] = {
                                                jobName: modelElements[i].jobName,
                                                order: totEls,
                                                keyID: randomInteger(10000000),
                                                fromNode: fN,
                                                toNode: tN,
                                                dX: dxx,
                                                dY: dyy,
                                                dZ: dzz,
                                                memberType: modelElements[i].memberType,
                                                pipOD:  modelElements[i].pipOD,
                                                pipTh: modelElements[i].pipTh,
                                                betaAngle: modelElements[i].betaAngle,
                                                material: modelElements[i].material,
                                                fromFXRest: modelElements[i].fromFXRest,
                                                fromFYRest: modelElements[i].fromFYRest,
                                                fromFZRest: modelElements[i].fromFZRest,
                                                fromMXRest: modelElements[i].fromMXRest,
                                                fromMYRest: modelElements[i].fromMYRest,
                                                fromMZRest: modelElements[i].fromMZRest,
                                                toFXRest: modelElements[i].toFXRest,
                                                toFYRest: modelElements[i].toFYRest,
                                                toFZRest: modelElements[i].toFZRest,
                                                toMXRest: modelElements[i].toMXRest,
                                                toMYRest: modelElements[i].toMYRest,
                                                toMZRest: modelElements[i].toMZRest,
                                                fromFXMemb: modelElements[i].fromFXMemb,
                                                fromFYMemb: modelElements[i].fromFYMemb,
                                                fromFZMemb: modelElements[i].fromFZMemb,
                                                fromMXMemb: modelElements[i].fromMXMemb,
                                                fromMYMemb: modelElements[i].fromMYMemb,
                                                fromMZMemb: modelElements[i].fromMZMemb,
                                                toFXMemb: modelElements[i].toFXMemb,
                                                toFYMemb: modelElements[i].toFYMemb,
                                                toFZMemb: modelElements[i].toFZMemb,
                                                toMXMemb: modelElements[i].toMXMemb,
                                                toMYMemb: modelElements[i].toMYMemb,
                                                toMZMemb: modelElements[i].toMZMemb,
                                                uX: modelElements[i].uX,
                                                uY: modelElements[i].uY,
                                                uZ: modelElements[i].uZ,
                                                fromFXLoad: modelElements[i].fromFXLoad,
                                                fromFYLoad: modelElements[i].fromFYLoad,
                                                fromFZLoad: modelElements[i].fromFZLoad,
                                                fromMXLoad: modelElements[i].fromMXLoad,
                                                fromMYLoad: modelElements[i].fromMYLoad,
                                                fromMZLoad: modelElements[i].fromMZLoad,
                                                toFXLoad: modelElements[i].toFXLoad,
                                                toFYLoad: modelElements[i].toFYLoad,
                                                toFZLoad: modelElements[i].toFZLoad,
                                                toMXLoad: modelElements[i].toMXLoad,
                                                toMYLoad: modelElements[i].toMYLoad,
                                                toMZLoad: modelElements[i].toMZLoad,
                        
                                                uXL: modelElements[i].uXL,
                                                uYL: modelElements[i].uYL,
                                                uZL: modelElements[i].uZL,
                                                fromFXLoadL: modelElements[i].fromFXLoadL,
                                                fromFYLoadL: modelElements[i].fromFYLoadL,
                                                fromFZLoadL: modelElements[i].fromFZLoadL,
                                                fromMXLoadL: modelElements[i].fromMXLoadL,
                                                fromMYLoadL: modelElements[i].fromMYLoadL,
                                                fromMZLoadL: modelElements[i].fromMZLoadL,
                                                toFXLoadL: modelElements[i].toFXLoadL,
                                                toFYLoadL: modelElements[i].toFYLoadL,
                                                toFZLoadL: modelElements[i].toFZLoadL,
                                                toMXLoadL: modelElements[i].toMXLoadL,
                                                toMYLoadL: modelElements[i].toMYLoadL,
                                                toMZLoadL: modelElements[i].toMZLoadL,
                        
                                                uXO: modelElements[i].uXO,
                                                uYO: modelElements[i].uYO,
                                                uZO: modelElements[i].uZO,
                                                fromFXLoadO: modelElements[i].fromFXLoadO,
                                                fromFYLoadO: modelElements[i].fromFYLoadO,
                                                fromFZLoadO: modelElements[i].fromFZLoadO,
                                                fromMXLoadO: modelElements[i].fromMXLoadO,
                                                fromMYLoadO: modelElements[i].fromMYLoadO,
                                                fromMZLoadO: modelElements[i].fromMZLoadO,
                                                toFXLoadO: modelElements[i].toFXLoadO,
                                                toFYLoadO: modelElements[i].toFYLoadO,
                                                toFZLoadO: modelElements[i].toFZLoadO,
                                                toMXLoadO: modelElements[i].toMXLoadO,
                                                toMYLoadO: modelElements[i].toMYLoadO,
                                                toMZLoadO: modelElements[i].toMZLoadO,
                        
                                                lX: modelElements[i].lX,
                                                lY: modelElements[i].lY,
                                                lZ: modelElements[i].lZ,
                                                kX: modelElements[i].kX,
                                                kY: modelElements[i].kY,
                                                kZ: modelElements[i].kZ,
                        
                                                cBZ: modelElements[i].cBZ,
                                                cBY: modelElements[i].cBY,
                                                stable: modelElements[i].stable,
                        
                                                stiffDist: modelElements[i].stiffDist,
                                                stiffI: modelElements[i].stiffI,
                                                tfaStiff: modelElements[i].tfaStiff,
                                                pressure: modelElements[i].pressure,
                                                fluid: modelElements[i].fluid,
                                                group: modelElements[i].group,
                                                hidden: false, // it seems to make sense to not hide the new elements
                                                totEls: totEls
                                            };
                      
                                            $.ajax({
                                                type: "POST",
                                                url: "./php/storeElement.php",
                                                data: {
                                                    "userName": userName1,
                                                    "jobName": jobName,
                                                    "modelEl": modelElements[totEls]
                                                },
                                                //                                  data: modelElements[totEls],
                                                success: function(msg){
                                                }, // function
                                                error: function(msg){
                                                }, // function
                                                complete: function(msg){
                                                } // function
                                            }); //ajax
                                        } // if right type of element
                                    } // if in selection set
                                } //for i
                            } //if not original element
                        } //for i1
                    } //for i2
                } //for i3
            }

            oNodeTable.fnClearTable();
            oNodeTable.fnSort([]);;

            for (var i = 0; i < fNodes.length; i++)
                oNodeTable.fnAddData([fNodes[i].node, fNodes[i].x, fNodes[i].y, fNodes[i].z, '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>','<a class="duplicate" href="">Array</a>' ]);
        
            mergeNodes(totEls1,totEls);
        }

        breakElms(newElms);
        setUndo(1,0 );
        displayElement(currElmt);
        drawModel(false,true);
        lastDownTarget = oldLastDownTarget;
        $('#modalCopy').modal('hide');
    });

    $('#modalBreakOK').click(function(e){

        if( !editRights )
            return;
        if (!isEqual1(modelElements[currElmt], getScreenEntries()) || (currElmt > totEls)) {

            // save any unprocessed changes
            if (validEntry(false)) {
                if (memberDefault && newMember) {
                    var iSav = currElmt;
                    nextEl(true);
                    currElmt = iSav;
                }
                else {
                    storeElement(1, 1, 1, 1, 1, 1, 1, 1, 0, -1, false, true);
                }
            }
        }

        var breakNum = parseInt($('#breakNum').val());
        if( isNaN(breakNum) || breakNum <= 0)
            breakNum = 0;

        var freeLength = $('#breakLength').val();

        var lengths = [];
        for (var i = 0; i < 50; i++) {    // i need some kind of upper limit
            lengths[i] = [0.0, 0.0, 0.0];
        }

        if( freeLength && breakNum <= 1 ) {
            var freeForm = freeLength;
            freeLength += ',10000000.0';    // really big number, bigger than any length, hopefully
            if( !processFreeForm1(lengths, freeLength, 50, 0) ) {
                bootbox.alert("Invalid length specification: '" + freeForm +
                              "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
                return;
            }
        }                

        if( breakNum <= 0 && !freeLength) {
            bootbox.alert("Enter either a Number or a Length(s).");
            return;
        }

        var modalBreakCols = ($('#modalBreakCols').is(':checked'));
        var modalBreakBeams = ($('#modalBreakBeams').is(':checked'));
        var modalBreakBraces = ($('#modalBreakBraces').is(':checked'));

        totEls1 = totEls;
        //                for (var i1 = 0; i1 < selectionSet.length; i1++) {
        for (var ii = totEls1; ii > 0; ii--) {
            if( selectionSet.indexOf(ii) >= 0 ) {
                //                    var ii = selectionSet[i1];
      
                if ((modalBreakCols && isAColumn(modelElements[ii])) ||
                (modalBreakBeams && isABeam(modelElements[ii])) ||
                (modalBreakBraces && isABrace(modelElements[ii]))) {
        
                    var dxx = modelElements[ii].dX;
                    var dyy = modelElements[ii].dY;
                    var dzz = modelElements[ii].dZ;
          
                    var len = Math.sqrt(dxx * dxx + dyy * dyy + dzz * dzz);
                    var lxx = modelElements[ii].lX;
                    if (lxx == 0.0) 
                        lxx = len;
                    var lyy = modelElements[ii].lY;
                    if (lyy == 0.0) 
                        lyy = len;
                    var lzz = modelElements[ii].lZ;
                    if (lzz == 0.0) 
                        lzz = len;
          
                    var iSubs = 50;
                    if (breakNum > 1) {
                        iSubs = breakNum;
                        for (var j = 0; j < iSubs; j++) {
                            lengths[j][1] = (1.0 / iSubs);
                        }
                    }
                    else {
                        var len1 = 0.0;
                        var ll = 1.0;
                        for (var j = 0; j < 50; j++) {
                            len1 += lengths[j][0];
                            if (len1 > len) {
                                iSubs = j + 1;
                                lengths[j][1] = round(ll, 4);
                                break;
                            }
                            lengths[j][1] = (lengths[j][0] / len);
                            ll -= lengths[j][1];
                        }
                    }
          
                    // move all remaining elements above currElmt up (iSubs - 1) places (get the procedure out of Insert function)
          
                    for (var i = totEls + iSubs - 1; i > ii + iSubs - 1; i--) {
          
                        modelElements[i] = modelElements[i - iSubs + 1];
                        modelElements[i].order = i;
                        coords[i] = coords[i - iSubs + 1]
            
                        $.ajax({
                            type: "POST",
                            url: "./php/updateElementOrder.php",
                            data: {
                                "userName": userName1,
                                "jobName": jobName,
                                "keyID": modelElements[i].keyID,
                                "order": modelElements[i].order
                            },
                            completion: function(msg){
                            }
                        });
                    }
          
                    modelElements[ii].lX = lxx;
                    modelElements[ii].lY = lyy;
                    modelElements[ii].lZ = lzz;
          
                    for (var i = ii + 1; i < ii + iSubs; i++) {
                        modelElements[i] = {
                            jobName: modelElements[ii].jobName,
                            order: i,
                            keyID: randomInteger(10000000),
                            fromNode: 0,
                            toNode: 0,
                            dX: 0.0,
                            dY: 0.0,
                            dZ: 0.0,
                            memberType: modelElements[ii].memberType,
                            pipOD:  modelElements[ii].pipOD,
                            pipTh: modelElements[ii].pipTh,
                            betaAngle: modelElements[ii].betaAngle,
                            material: modelElements[ii].material,
                            fromFXRest: false,
                            fromFYRest: false,
                            fromFZRest: false,
                            fromMXRest: false,
                            fromMYRest: false,
                            fromMZRest: false,
                            toFXRest: false,
                            toFYRest: false,
                            toFZRest: false,
                            toMXRest: false,
                            toMYRest: false,
                            toMZRest: false,
                            fromFXMemb: false,
                            fromFYMemb: false,
                            fromFZMemb: false,
                            fromMXMemb: false,
                            fromMYMemb: false,
                            fromMZMemb: false,
                            toFXMemb: false,
                            toFYMemb: false,
                            toFZMemb: false,
                            toMXMemb: false,
                            toMYMemb: false,
                            toMZMemb: false,
                            uX: modelElements[ii].uX,
                            uY: modelElements[ii].uY,
                            uZ: modelElements[ii].uZ,
                            fromFXLoad: 0.0,
                            fromFYLoad: 0.0,
                            fromFZLoad: 0.0,
                            fromMXLoad: 0.0,
                            fromMYLoad: 0.0,
                            fromMZLoad: 0.0,
                            toFXLoad: 0.0,
                            toFYLoad: 0.0,
                            toFZLoad: 0.0,
                            toMXLoad: 0.0,
                            toMYLoad: 0.0,
                            toMZLoad: 0.0,
                            uXL: modelElements[ii].uXL,
                            uYL: modelElements[ii].uYL,
                            uZL: modelElements[ii].uZL,
                            fromFXLoadL: 0.0,
                            fromFYLoadL: 0.0,
                            fromFZLoadL: 0.0,
                            fromMXLoadL: 0.0,
                            fromMYLoadL: 0.0,
                            fromMZLoadL: 0.0,
                            toFXLoadL: 0.0,
                            toFYLoadL: 0.0,
                            toFZLoadL: 0.0,
                            toMXLoadL: 0.0,
                            toMYLoadL: 0.0,
                            toMZLoadL: 0.0,
                            uXO: modelElements[ii].uXO,
                            uYO: modelElements[ii].uYO,
                            uZO: modelElements[ii].uZO,
                            fromFXLoadO: 0.0,
                            fromFYLoadO: 0.0,
                            fromFZLoadO: 0.0,
                            fromMXLoadO: 0.0,
                            fromMYLoadO: 0.0,
                            fromMZLoadO: 0.0,
                            toFXLoadO: 0.0,
                            toFYLoadO: 0.0,
                            toFZLoadO: 0.0,
                            toMXLoadO: 0.0,
                            toMYLoadO: 0.0,
                            toMZLoadO: 0.0,
                            lX: lxx,
                            lY: lyy,
                            lZ: lzz,
                            kX: modelElements[ii].kX,
                            kY: modelElements[ii].kY,
                            kZ: modelElements[ii].kZ,
                            cBZ: modelElements[ii].cBZ,
                            cBY: modelElements[ii].cBY,
                            stable: modelElements[ii].stable,
                            stiffDist: modelElements[ii].stiffDist,
                            stiffI: modelElements[ii].stiffI,
                            tfaStiff: modelElements[ii].tfaStiff,
                            pressure: modelElements[ii].pressure,
                            fluid:  modelElements[ii].fluid,
                            group: modelElements[ii].group,
                            hidden: modelElements[ii].hidden,
                            totEls: modelElements[ii].totEls
                        };
            
            
                        coords[i] = { // dummy coords
                            x1: 0.0,
                            y1: -12.345,
                            z1: -12.345,
                            x2: -12.345,
                            y2: -12.345,
                            z2: -12.345
                        };
                    }
          
                    if (iSubs > 1) {
                        modelElements[ii].lX = lxx;
                        modelElements[ii].lY = lyy;
                        modelElements[ii].lZ = lzz;
            
                        modelElements[ii + iSubs - 1].toFXRest = modelElements[ii].toFXRest;
                        modelElements[ii + iSubs - 1].toFYRest = modelElements[ii].toFYRest;
                        modelElements[ii + iSubs - 1].toFZRest = modelElements[ii].toFZRest;
                        modelElements[ii + iSubs - 1].toMXRest = modelElements[ii].toMXRest;
                        modelElements[ii + iSubs - 1].toMYRest = modelElements[ii].toMYRest;
                        modelElements[ii + iSubs - 1].toMZRest = modelElements[ii].toMZRest;
                        modelElements[ii + iSubs - 1].toFXMemb = modelElements[ii].toFXMemb;
                        modelElements[ii + iSubs - 1].toFYMemb = modelElements[ii].toFYMemb;
                        modelElements[ii + iSubs - 1].toFZMemb = modelElements[ii].toFZMemb;
                        modelElements[ii + iSubs - 1].toMXMemb = modelElements[ii].toMXMemb;
                        modelElements[ii + iSubs - 1].toMYMemb = modelElements[ii].toMYMemb;
                        modelElements[ii + iSubs - 1].toMZMemb = modelElements[ii].toMZMemb;
                        modelElements[ii + iSubs - 1].toFXLoad = modelElements[ii].toFXLoad;
                        modelElements[ii + iSubs - 1].toFYLoad = modelElements[ii].toFYLoad;
                        modelElements[ii + iSubs - 1].toFZLoad = modelElements[ii].toFZLoad;
                        modelElements[ii + iSubs - 1].toMXLoad = modelElements[ii].toMXLoad;
                        modelElements[ii + iSubs - 1].toMYLoad = modelElements[ii].toMYLoad;
                        modelElements[ii + iSubs - 1].toMZLoad = modelElements[ii].toMZLoad;
                        modelElements[ii + iSubs - 1].toFXLoadL = modelElements[ii].toFXLoadL;
                        modelElements[ii + iSubs - 1].toFYLoadL = modelElements[ii].toFYLoadL;
                        modelElements[ii + iSubs - 1].toFZLoadL = modelElements[ii].toFZLoadL;
                        modelElements[ii + iSubs - 1].toMXLoadL = modelElements[ii].toMXLoadL;
                        modelElements[ii + iSubs - 1].toMYLoadL = modelElements[ii].toMYLoadL;
                        modelElements[ii + iSubs - 1].toMZLoadL = modelElements[ii].toMZLoadL;
                        modelElements[ii + iSubs - 1].toFXLoadO = modelElements[ii].toFXLoadO;
                        modelElements[ii + iSubs - 1].toFYLoadO = modelElements[ii].toFYLoadO;
                        modelElements[ii + iSubs - 1].toFZLoadO = modelElements[ii].toFZLoadO;
                        modelElements[ii + iSubs - 1].toMXLoadO = modelElements[ii].toMXLoadO;
                        modelElements[ii + iSubs - 1].toMYLoadO = modelElements[ii].toMYLoadO;
                        modelElements[ii + iSubs - 1].toMZLoadO = modelElements[ii].toMZLoadO;
            
                        modelElements[ii].toFXRest = false;
                        modelElements[ii].toFYRest = false;
                        modelElements[ii].toFZRest = false;
                        modelElements[ii].toMXRest = false;
                        modelElements[ii].toMYRest = false;
                        modelElements[ii].toMZRest = false;
                        modelElements[ii].toFXMemb = false;
                        modelElements[ii].toFYMemb = false;
                        modelElements[ii].toFZMemb = false;
                        modelElements[ii].toMXMemb = false;
                        modelElements[ii].toMYMemb = false;
                        modelElements[ii].toMZMemb = false;
                        modelElements[ii].toFXLoad = 0.0;
                        modelElements[ii].toFYLoad = 0.0;
                        modelElements[ii].toFZLoad = 0.0;
                        modelElements[ii].toMXLoad = 0.0;
                        modelElements[ii].toMYLoad = 0.0;
                        modelElements[ii].toMZLoad = 0.0;
                        modelElements[ii].toFXLoadL = 0.0;
                        modelElements[ii].toFYLoadL = 0.0;
                        modelElements[ii].toFZLoadL = 0.0;
                        modelElements[ii].toMXLoadL = 0.0;
                        modelElements[ii].toMYLoadL = 0.0;
                        modelElements[ii].toMZLoadL = 0.0;
                        modelElements[ii].toFXLoadO = 0.0;
                        modelElements[ii].toFYLoadO = 0.0;
                        modelElements[ii].toFZLoadO = 0.0;
                        modelElements[ii].toMXLoadO = 0.0;
                        modelElements[ii].toMYLoadO = 0.0;
                        modelElements[ii].toMZLoadO = 0.0;
                    }
          
                    totEls += (iSubs - 1);
          
                    var innc = parseInt((modelElements[ii].toNode - modelElements[ii].fromNode) / iSubs);
                    if (Math.abs(innc) < 1) 
                        innc = 1;
                    var lastNode = modelElements[ii].toNode;
                    for (var j = ii; j <= ii + iSubs - 1; j++) {
                        if (j != ii) 
                            modelElements[j].fromNode = modelElements[j - 1].toNode;
                        if (j == ii + iSubs - 1) 
                            modelElements[j].toNode = lastNode;
                        else {
                            var tn = getNewNode(modelElements[j].fromNode + innc);
                            if (tn == lastNode) 
                                tn = getNewNode(tn + nodInc);
                            modelElements[j].toNode = tn;
                        }
            
                        modelElements[j].dX = dxx * lengths[j - ii][1];
                        modelElements[j].dY = dyy * lengths[j - ii][1];
                        modelElements[j].dZ = dzz * lengths[j - ii][1];
            
                        $.ajax({
                            type: "POST",
                            url: "./php/storeElement.php",
                            data: {
                                "userName": userName1,
                                "jobName": jobName,
                                "modelEl": modelElements[j]
                            },
              
                            //                                  data: modelElements[totEls],
                            success: function(msg){
                                //                            alert(msg);
                            }, // function
                            error: function(msg){
                                //                            alert(msg);
                            }, // function
                            complete: function(msg){
                                //                            alert(msg);
                            } // function
                        }); //ajax
                    }
                    mergeNodes(ii, ii + iSubs - 1);
          
                    for (var ix = totEls; ix > ii; ix--) {
                        var ip = selectionSet.indexOf(ix);
                        if (ip >= 0) {
                            selectionSet.splice(ip, 1);
                            selectionSet.push(ix + iSubs - 1);
                        }
                    }
          
                    for (var ix = ii + 1; ix <= ii + iSubs - 1; ix++) {
                        selectionSet.push(ix);
                    }
                }
            }
        }

        setUndo(1,0 );
        displayElement(currElmt);
        drawModel(false,true);
        lastDownTarget = oldLastDownTarget;
        $('#modalBreak').modal('hide');
    })

    $('#modalNodDelOK').click(function(e){

        if( !editRights )
            return;
        var wasDeleted = false;

        for (var i=0; i<nodSelectionSet.length; i++ ) {
            for (var j=0; j<fNodes.length; j++) {
                if( fNodes[j].node == nodSelectionSet[i] ) {
                    fNodes.splice(j, 1);
                    deleteNode(nodSelectionSet[i]);
                    wasDeleted = true;
                    break;
                }
            }
        }

        nodSelectionSet = [];

        if (wasDeleted) {
            oNodeTable.fnClearTable();
            oNodeTable.fnSort([]);
            ;

            for (var i = 0; i < fNodes.length; i++)
                oNodeTable.fnAddData([fNodes[i].node, fNodes[i].x, fNodes[i].y, fNodes[i].z, '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>', '<a class="duplicate" href="">Array</a>']);
            drawModel(true,false);

        }
        setUndo(2,0  /* ,2  */);

        $('#modalNodDel').modal('hide');
    });

    $('#modalHideOK').click(function(e){

        var modalHideAction = $('input[name=hideAction]:checked').val();

        var modalHideCols = ($('#modalHideCols').is(':checked'));
        var modalHideBeams = ($('#modalHideBeams').is(':checked'));
        var modalHideBraces = ($('#modalHideBraces').is(':checked'));

        if (modalHideAction == "Unhide") {
            for (var i = 1; i <= totEls; i++) {
                if ((modalHideCols && isAColumn(modelElements[i])) ||
                (modalHideBeams && isABeam(modelElements[i])) ||
                (modalHideBraces && isABrace(modelElements[i]))) {
                    modelElements[i].hidden = false;
                    toggleObjectVisibility(i, true);
                }
            }
        }
        else {
            if (modalHideAction == "Invert") {
                for (var i = 1; i <= totEls; i++) {
                    if ((modalHideCols && isAColumn(modelElements[i])) ||
                    (modalHideBeams && isABeam(modelElements[i])) ||
                    (modalHideBraces && isABrace(modelElements[i]))) {
                        modelElements[i].hidden = !modelElements[i].hidden;
                        toggleObjectVisibility(i, !modelElements[i].hidden)
                    }
                }
            }
            else {
                if (modalHideAction == "HideUnSel") {
                    for (var i = 1; i <= totEls; i++) {
                        if ((modalHideCols && isAColumn(modelElements[i])) ||
                        (modalHideBeams && isABeam(modelElements[i])) ||
                        (modalHideBraces && isABrace(modelElements[i]))) {
                            if (selectionSet.indexOf(i) == -1) {
                                modelElements[i].hidden = true;
                                toggleObjectVisibility(i, false)
                            }
                            /*                          else 
                                            modelElements[i].hidden = false;
                            */                        }
                    }
                }
                else {
                    for (var ii = 0; ii < selectionSet.length; ii++) {
                        var i = selectionSet[ii];
                        if ((modalHideCols && isAColumn(modelElements[i])) ||
                            (modalHideBeams && isABeam(modelElements[i])) ||
                            (modalHideBraces && isABrace(modelElements[i]))){
                            changeBeamColor(i,beam_color);
                            modelElements[i].hidden = true;
                            toggleObjectVisibility(i, false)
                        }
                    }
                }
            }
        }

        setUndo(1,0  /* ,1 */ );
        displayElement(currElmt);
        //drawModel(false,true);
        refreshScene();
        lastDownTarget = oldLastDownTarget;
        $('#modalHide').modal('hide');
    });

    $('#modalDelOK').click(function(e){

        if( !editRights )
            return;
        var modalDelCols = ($('#modalDelCols').is(':checked'));
        var modalDelBeams = ($('#modalDelBeams').is(':checked'));
        var modalDelBraces = ($('#modalDelBraces').is(':checked'));

        var iFirst = 1000000;
        var iDel = 0;
        for( var ii=0; ii<selectionSet.length; ii++ ) {
            i = selectionSet[ii];

            if ((modalDelCols && isAColumn(modelElements[i])) ||
                (modalDelBeams && isABeam(modelElements[i])) ||
                (modalDelBraces && isABrace(modelElements[i]))) {

                if( i < iFirst )
                    iFirst = i;

                $.ajax({
                    type: "POST",
                    url: "./php/deleteElement.php",
                    data: {
                        "userName": userName1,
                        "jobName": jobName,
                        "keyID": modelElements[i].keyID
                    },
                    completion: function(msg){
                    }
                });

                selectionSet[ii] = null;
                modelElements[i] = null;
                iDel++;

            }
        }

        var tempStorage = [];
        tempStorage.push([]);
        for (var i = 1; i <= totEls; i++){
            if ( modelElements[i] != null ) {
                tempStorage.push(modelElements[i]);
            }
        }
        modelElements = $.extend(true, [], tempStorage);
        //modelElements[totEls] = {};
        totEls -= iDel;

        for( var i=iFirst; i<=totEls; i++ ) {
            $.ajax({
                type: "POST",
                url: "./php/updateElementOrder.php",
                data: {
                    "userName": userName1,
                    "jobName": jobName,
                    "keyID": modelElements[i].keyID,
                    "order": i // modelElements[i].order
                },
                completion: function(msg){
                }
            });
        }

        if (currElmt >= totEls)
            currElmt = totEls;

        //change color for everything left in selection set
        var something = false;
        for ( var i = 0; i < selectionSet.length; i++ ){
            if ( selectionSet[i] != null ){
                changeBeamColor(selectionSet[i], beam_color);
                something = true;
            }
        }

        if( !something )
            selectionSet = [currElmt];
        nodSelectionSet = [];
        elemMenu();    // reset context menu to reflect elements

        setUndo(1,0  /* ,1 */ );
        displayElement(currElmt);
        drawModel(false,true);
        lastDownTarget = oldLastDownTarget;
        $('#modalDel').modal('hide');
    });

    $('#openJob1').click(function(e){
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
      
        var jobs = returnAvailableJobs();
        selectJob2Open(jobs);
    });

    $('#openJob2').click(function(e){
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
      
        var jobs = returnAvailableJobs();
        selectJob2Open(jobs);
    });

    $('#openSelectedJob').click(function() {
        jobName = jobList.options[jobList.selectedIndex].text;
        setJobName(jobName);
        getNotes();
        var jobUnits = getSpecificJobUnits(jobName);
        buildJobUnits(jobUnits);
        var jobNodeCoords = getSpecificJobNodeCoords(jobName);
        buildJobNodeCoords(jobNodeCoords);
        var jobLoadCases = getSpecificJobLoadCases(jobName);
        buildJobLoadCases(jobLoadCases);
        var jobData = getSpecificJob(jobName);
        buildJobArrays(jobData);
        var shareData = getSpecificJobShares(jobName);
        buildShareArrays(shareData);

        $('#selectJob').modal('hide');
        $.ajax({
            type: "POST",
            url: "./php/putUsersJob.php",
            data: {"userName": userName,
                "jobName": jobName,
                "userName1": userName1 },
            success: function(msg){
            }
        });
    });

    $(function () {
        var isIE = navigator.sayswho.substr(0, 2);
        if (isIE == 'IE') {
            //Remove Fade Feature if browser is IE
            $(".modal.fade").removeClass("fade");
        }                  
    });

    $('#newJob').click(function(e){
        e.preventDefault();
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
      
        inBoot = true;
        bootbox.prompt("Enter new Job Name:", function(result){
            newJobName(result);
        });
        inBoot = false;
    });

    $('#newJob1').click(function(e){
        e.preventDefault();
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
    
        inBoot = true;
        bootbox.prompt("Enter new Job Name:", function(result){
            newJobName(result);
        });
        inBoot = false;
    });

    $('#newJob2').click(function(e){
        e.preventDefault();
        inBoot = true;
        bootbox.prompt("Enter new Job Name:", function(result){
            newJobName(result);
        });
        inBoot = false;
    });

    $('#findEl').click(function(e){
        e.preventDefault();
        findEl1(true);
    });

    $('#saveAs').click(function(){
        saveAs();
    });

    $('#saveAs1').click(function(){
        saveAs();
    });

    $('#saveAs2').click(function(){
        saveAs();
    });

    $('#nextEl').click(function(e){
        nextEl(true);
    });

    $('#firstLoadCase').click(function(e){
        if( currentLoadCase > 1) {
            currentLoadCase = 1;
            displayOutputReports(false);
            $('#loadCase').html('Load Case ' + currentLoadCase + '/' + totalLoadCases);
        }
    });

    $('#prevLoadCase').click(function(e){
        if( currentLoadCase > 1) {
            currentLoadCase--;
            displayOutputReports(false);
            $('#loadCase').html('Load Case ' + currentLoadCase + '/' + totalLoadCases);
        }
    });

    $('#nextLoadCase').click(function(e){
        if( currentLoadCase < totalLoadCases) {
            currentLoadCase++;
            displayOutputReports(false);
            $('#loadCase').html('Load Case ' + currentLoadCase + '/' + totalLoadCases);
        }
    });

    $('#lastLoadCase').click(function(e){
        if( currentLoadCase < totalLoadCases) {
            currentLoadCase = parseInt(totalLoadCases);
            displayOutputReports(false);
            $('#loadCase').html('Load Case ' + currentLoadCase + '/' + totalLoadCases);
        }
    });

    $('#deleteEl').click(function () {

        if( !editRights )
            return;

        // need to do four things: (1) delete this element from graphics,
        // (2) delete this element from SQL database (if it needs it), (3) move up (and change Order)
        // of all subsequent elements in array, and (4) update Order in SQL database, (5) update hidden
        // list if need be
        // For the moment, do #1 last (and in a heavy handed manner, by redrawing everything).

        if (currElmt <= totEls) {
            if (modelElements[currElmt].keyID != 0)
                $.ajax({
                    type: "POST",
                    url: "./php/deleteElement.php",
                    data: {
                        "userName": userName1,
                        "jobName": jobName,
                        "keyID": modelElements[currElmt].keyID
                    },
                    completion: function(msg){
                    }
                });

            for (var i = currElmt; i < totEls; i++) {
                modelElements[i] = modelElements[i + 1];
                modelElements[i].order = i;

                $.ajax({
                    type: "POST",
                    url: "./php/updateElementOrder.php",
                    data: {
                        "userName": userName1,
                        "jobName": jobName,
                        "keyID": modelElements[i].keyID,
                        "order": modelElements[i].order
                    },
                    completion: function(msg){
                    }
                });
            }

            if (currElmt >= totEls && currElmt > 1)
                currElmt--;
            selectionSet = [currElmt];
            nodSelectionSet = [];
            elemMenu();    // reset context menu to reflect elements

            if (totEls > 0)
                totEls--;
            if (deformed) {
                deformed = false; // draw the original
                drawModel(false,true);
                deformed = true; // draw the deformed
            }
            drawModel(false,!deformed);
        }
        else
            if (currElmt > 1) {
                currElmt--;
                selectionSet = [currElmt];
                nodSelectionSet = [];
                elemMenu();    // reset context menu to reflect elements
                if( highLight)
                    drawModel(false,false);
            }

        displayElement(currElmt);
        setUndo(1,0  /* ,1 */ );
    });

    $('#insertEl').click(function () {

        if( !editRights )
            return;

        // we will define this as "insert before" the current element
        if (currElmt > totEls)
            return;

        // need to do four things: (1) move back (and change Order) of all subsequent elements in array,
        // (2) update Order of everything in SQL database, (3) add a blank element to array, (4) adjust the
        // hidden list

        for ( var i=totEls+1; i>currElmt; i--) {

            modelElements[i] = modelElements[i - 1];
            modelElements[i].order = i;

            $.ajax({
                type: "POST",
                url: "./php/updateElementOrder.php",
                data: {
                    "userName": userName1,
                    "jobName": jobName,
                    "keyID": modelElements[i].keyID,
                    "order": modelElements[i].order
                },
                completion: function(msg){
                }
            });
        }

        totEls++;

        modelElements[currElmt] = {};

        modelElements[currElmt].jobName = modelElements[currElmt+1].jobName;
        modelElements[currElmt].keyID = randomInteger(10000000);
        modelElements[currElmt].fromNode = 0;
        modelElements[currElmt].toNode = 0;
        modelElements[currElmt].dX = 0.0;
        modelElements[currElmt].dY = 0.0;
        modelElements[currElmt].dZ = 0.0;

        modelElements[currElmt].memberType = modelElements[currElmt+1].memberType;
        modelElements[currElmt].material = modelElements[currElmt+1].material;

        modelElements[currElmt].fromFXRest = false;
        modelElements[currElmt].fromFYRest = false;
        modelElements[currElmt].fromFZRest = false;
        modelElements[currElmt].fromMXRest = false;
        modelElements[currElmt].fromMYRest = false;
        modelElements[currElmt].fromMZRest = false;
        modelElements[currElmt].toFXRest = false;
        modelElements[currElmt].toFYRest = false;
        modelElements[currElmt].toFZRest = false;
        modelElements[currElmt].toMXRest = false;
        modelElements[currElmt].toMYRest = false;
        modelElements[currElmt].toMZRest = false;
        modelElements[currElmt].fromFXMemb = false;
        modelElements[currElmt].fromFYMemb = false;
        modelElements[currElmt].fromFZMemb = false;
        modelElements[currElmt].fromMXMemb = false;
        modelElements[currElmt].fromMYMemb = false;
        modelElements[currElmt].fromMZMemb = false;
        modelElements[currElmt].toFXMemb = false;
        modelElements[currElmt].toFYMemb = false;
        modelElements[currElmt].toFZMemb = false;
        modelElements[currElmt].toMXMemb = false;
        modelElements[currElmt].toMYMemb = false;
        modelElements[currElmt].toMZMemb = false;
        modelElements[currElmt].uX = 0.0;                // unlabeled = dead load
        modelElements[currElmt].uY = 0.0;
        modelElements[currElmt].uZ = 0.0;
        modelElements[currElmt].fromFXLoad = 0.0;
        modelElements[currElmt].fromFYLoad = 0.0;
        modelElements[currElmt].fromFZLoad = 0.0;
        modelElements[currElmt].fromMXLoad = 0.0;
        modelElements[currElmt].fromMYLoad = 0.0;
        modelElements[currElmt].fromMZLoad = 0.0;
        modelElements[currElmt].toFXLoad = 0.0;
        modelElements[currElmt].toFYLoad = 0.0;
        modelElements[currElmt].toFZLoad = 0.0;
        modelElements[currElmt].toMXLoad = 0.0;
        modelElements[currElmt].toMYLoad = 0.0;
        modelElements[currElmt].toMZLoad = 0.0;

        modelElements[currElmt].uXL = 0.0;      // live
        modelElements[currElmt].uYL = 0.0;
        modelElements[currElmt].uZL = 0.0;
        modelElements[currElmt].fromFXLoadL = 0.0;
        modelElements[currElmt].fromFYLoadL = 0.0;
        modelElements[currElmt].fromFZLoadL = 0.0;
        modelElements[currElmt].fromMXLoadL = 0.0;
        modelElements[currElmt].fromMYLoadL = 0.0;
        modelElements[currElmt].fromMZLoadL = 0.0;
        modelElements[currElmt].toFXLoadL = 0.0;
        modelElements[currElmt].toFYLoadL = 0.0;
        modelElements[currElmt].toFZLoadL = 0.0;
        modelElements[currElmt].toMXLoadL = 0.0;
        modelElements[currElmt].toMYLoadL = 0.0;
        modelElements[currElmt].toMZLoadL = 0.0;

        modelElements[currElmt].uXO = 0.0;
        modelElements[currElmt].uYO = 0.0;
        modelElements[currElmt].uZO = 0.0;
        modelElements[currElmt].fromFXLoadO = 0.0;
        modelElements[currElmt].fromFYLoadO = 0.0;
        modelElements[currElmt].fromFZLoadO = 0.0;
        modelElements[currElmt].fromMXLoadO = 0.0;
        modelElements[currElmt].fromMYLoadO = 0.0;
        modelElements[currElmt].fromMZLoadO = 0.0;
        modelElements[currElmt].toFXLoadO = 0.0;
        modelElements[currElmt].toFYLoadO = 0.0;
        modelElements[currElmt].toFZLoadO = 0.0;
        modelElements[currElmt].toMXLoadO = 0.0;
        modelElements[currElmt].toMYLoadO = 0.0;
        modelElements[currElmt].toMZLoadO = 0.0;

        modelElements[currElmt].lX = 0.0;
        modelElements[currElmt].lY = 0.0;
        modelElements[currElmt].lZ = 0.0;
        modelElements[currElmt].kX = 0.0;
        modelElements[currElmt].kY = 0.0;
        modelElements[currElmt].kZ = 0.0;

        modelElements[currElmt].cBZ = 0.0;
        modelElements[currElmt].cBY = 0.0;

        modelElements[currElmt].stable = false;

        modelElements[currElmt].stiffDist = 0.0;
        modelElements[currElmt].stiffI = 0.0;
        modelElements[currElmt].tfaStiff = false;
        modelElements[currElmt].group = "";
        modelElements[currElmt].hidden = false;

        modelElements[currElmt].totEls = totEls;

        selectionSet = [currElmt];
        nodSelectionSet = [];
        elemMenu();    // reset context menu to reflect elements

        if (deformed) {
            deformed = false; // draw the original
            drawModel(false,true);
            deformed = true; // draw the deformed
        }
        drawModel(false,!deformed);

        displayElement(currElmt);
        setUndo(1,0);
    });

    $('#firstEl').click(function(e){
        firstEl(true);
    });

    $('#prevEl').click(function(e){
        prevEl(true);
    });

    $('#lastEl').click(function(e){
        lastEl(true);
    });

    $('#newEl').click(function(e){
        newEl(true);
    });

    $('#undo').click(function () {
        undo();
    });

    $('#undo1').click(function () {
        undo();
    });

    $('#undo2').click(function () {
        undo();
    });

    $('#redo').click(function () {
        redo();
    });

    $('#redo1').click(function () {
        redo();
    });

    $('#redo2').click(function () {
        redo();
    });

    $('#panLeft').click(function(e) {
        lastDownTarget = canvas;
        panLeft();
    });

    $('#panRight').click(function(e) {
        lastDownTarget = canvas;
        panRight();
    });

    $('#panUp').click(function(e) {
        lastDownTarget = canvas;
        panUp();
    });

    $('#panDown').click(function(e) {
        lastDownTarget = canvas;
        panDown();
    });

    $('#panForward').click(function(e) {
        lastDownTarget = canvas;
        panForward();
    });

    $('#panBack').click(function(e) {
        lastDownTarget = canvas;
        panBack();
    });

    $('#rotateLeft').click(function(e) {
        lastDownTarget = canvas;
        rotateLeft();
    });

    $('#rotateRight').click(function(e) {
        lastDownTarget = canvas;
        rotateRight();
    });

    $('#rotateUp').click(function(e) {
        lastDownTarget = canvas;
        rotateUp();
    });

    $('#rotateDown').click(function(e) {
        lastDownTarget = canvas;
        rotateDown();
    });

    $('#zoomOut').click(function(e) {
        lastDownTarget = canvas;
        zoomOut();
    });

    $('#zoomIn').click(function(e) {
        lastDownTarget = canvas;
        zoomIn();
    });

    $('#drawMode').click(function (e) {
        if( !editRights )
            return;
        lastDownTarget = canvas;
        toggleDrawMode();
    });

    $('#elSelectMode').click(function (e) {
        lastDownTarget = canvas;
        toggleElSelectMode();
    });

    $('#nodSelectMode').click(function (e) {
        lastDownTarget = canvas;
        toggleNodeSelectMode();
    });

    $('#gridMode').click(function (e) {
        lastDownTarget = canvas;
        toggleGridMode();
    });

    $('#t3DView').click(function (e) {
        lastDownTarget = canvas;
        t3DView();
    });

    $('#xView').click(function (e) {
        lastDownTarget = canvas;
        xView();
    });

    $('#yView').click(function (e) {
        lastDownTarget = canvas;
        yView();
    });

    $('#zView').click(function (e) {
        lastDownTarget = canvas;
        zView();
    });

    $('#ctrlKeyMode').click(function(e) {
        lastDownTarget = canvas;
        if (nodSelectMode || elSelectMode) {
            ctrlKeyMode = !ctrlKeyMode;
            if (ctrlKeyMode) {
                $("#ctrlImage").attr("src", "assets/ico/ico_ctrl_2.png");
            }
            else 
                $("#ctrlImage").attr("src", "assets/ico/ico_ctrl.png");
        }
    });

    $('#toggleTexture').click(function(e) {
        lastDownTarget = canvas;
        toggleTexture();
    });

    $('#nodesOn').click(function(e) {
        lastDownTarget = canvas;
        toggleSprites();

        /*      if (deformed) {
              deformed = false; // draw the original
              drawModel(false,false);
              deformed = true; // draw the deformed
            }
            drawModel(true,false);  
        //                  drawModel(false);  */
    });

    $('#dynamicAnimation').click(function(e) {
        lastDownTarget = canvas;
        dynamicAnimation();
    });

    $('#stickFigure').click(function(e) {
        var wasAnimated = false;
        lastDownTarget = canvas;
        if (isAnimated){
            dynamicAnimation();
            wasAnimated = true;
        }
        stickFigure = !stickFigure;
        if (stickFigure)
            $("#stickFig").attr("src", "assets/ico/centerline_2.png");
        else
            $("#stickFig").attr("src", "assets/ico/centerline.png");

    
        if (wasAnimated){
            dynamicAnimation();
        }
        else
            if (deformed) {
                deformed = false;
                drawModel(false, false);
                deformed = true;
            }
        drawModel(false, false);
    });

    $('#resetGraph').click(function(e) {
        lastDownTarget = canvas;
        resetGraph();
    });

    $('#floorOnOff').click(function (e) {
        lastDownTarget = canvas;
        toggleFloor();
    })

    $('a#signOut').click(function(){
        //                   deleteSQLQueue(-1);
        
        if (isSharing) {
          stopSharing();
          isSharing = false;
        }

        forumLogout();

        if (ccDOpen) {
            ccD = window.open("", "docswindow", "width=1,height=1,left=1000,top=1000");
            if (ccD != undefined)
                ccD.close();
            ccDOpen = false;
        }

        if (ccMOpen) {
            var ccM = window.open("", "mywindow", "width=1,height=1,left=1000,top=1000"); 
            if (ccM != undefined)
                ccM.close();
            ccMOpen = false;
        }

        deleteCookie( "wp" );

        window.open("index.html", "_self");
        //                  open(location, '_self').close();

        showScreen("signIn");

    });

    $('#analysisStatic').click(function(e){

        var istr1 = $('#dX').val();
        var istr2 = $('#dY').val();
        var istr3 = $('#dZ').val(); // may have been inadvertent PgDn push

        if (currElmt > totEls && ((istr1 == "" || istr1 == 0.0) && (istr2 == "" || istr2 == 0.0) && (istr3 == "" || istr3 == 0.0))) {
            if (currElmt > 1) {
                currElmt--;
                displayElement(currElmt);
                selectionSet = [currElmt];
                nodSelectionSet = [];
                elemMenu(); // reset context menu to reflect elements
                if (highLight) {
                    deformed = false; // draw the original
                    isAnimated = false;
                    drawModel(false, false);
                }
            }
        }
        else {
            if (editRights) {
                if (!isEqual1(modelElements[currElmt], getScreenEntries()) || (currElmt > totEls)) {
                    if (validEntry(false)) {
                        if (memberDefault && newMember) {
                            var iSav = currElmt;
                            nextEl(true);
                            currElmt = iSav;
                        }
                        else {
                            storeElement(1, 1, 1, 1, 1, 1, 1, 1, 0, -1, true, true);
                            if (highLight) {
                                deformed = false; // draw the original
                                cColor = false;
                                isAnimated = false;
                            }
                        }
                        drawModel(false, true);
                        displayElement(currElmt);
                    }
                }
                else {
                    if (currElmt > totEls) 
                        totEls = currElmt;
                    if (highLight) {
                        deformed = false; // draw the original
                        cColor = false;
                        isAnimated = false;
                        drawModel(false, false);
                    }
                }
            }
      
            if (!errorFree()) {
                displayElement(currElmt);
                return;
            }
        }
    
        $('#dx').html('DX (' + uNameLength + ')');
        $('#dy').html('DY (' + uNameLength + ')');
        $('#dz').html('DZ (' + uNameLength + ')');
        $('#ax').html('Axial (' + uNameForce + ')');
        $('#shY').html('Shear-X (' + uNameForce + ')');
        $('#shZ').html('Shear-Y (' + uNameForce + ')');
        $('#tors').html('Torsion (' + uNameMomOut + ')');
        $('#bendY').html('Bending-X (' + uNameMomOut + ')');
        $('#bendZ').html('Bending-Y (' + uNameMomOut + ')');
        $('#axS').html('Axial (' + uNameStress + ')');
        $('#bendS').html('Bending (' + uNameStress + ')');
        $('#normS').html('Normal (' + uNameStress + ')');
        $('#torsS').html('Torsion (' + uNameStress + ')');
        $('#shYS').html('Shear-X (' + uNameStress + ')');
        $('#shZS').html('Shear-Y (' + uNameStress + ')');
        $('#rfx').html('FX (' + uNameForce + ')');
        $('#rfy').html('FY (' + uNameForce + ')');
        $('#rfz').html('FZ (' + uNameForce + ')');
        $('#rmx').html('MX (' + uNameMomOut + ')');
        $('#rmy').html('MY (' + uNameMomOut + ')');
        $('#rmz').html('MZ (' + uNameMomOut + ')');

        isStatic = true;
        $('#dispTab').html('Displacements');
        $('#forceTab').show();
        $('#stressTab').show();
        $('#complyTab').show();
        $('#restraintTab').show();
        $('#freqTab').hide();

        $.ajax({
            type: "POST",
            url: "./php/runcalc.php",
            data: {
                "userName": userName,
                "jobName": jobName,
                "userName1": userName1
            },
            success: function(data){

                totalLoadCases = data;
                //                          var oTable1 = $('#dispTable').dataTable();
                oTable1.fnClearTable();
                oTable1.fnSort([]);

                $.ajax({url: "./data/" + userName + '-' + jobName + "-nodeDisp-1.txt", success: function(data){
                    updateTable(data, oTable1);
                    nodeDisps = csvToArray( data, ',' );
                    if( activeTab == null ) {
                        deformed = true;
                        drawModel(false,false);    // deformed
                    }
                    else {
                        if( activeTab.id == 'dispTab' ) {
                            deformed = true;
                            drawModel(false,false);    // deformed
                        }
                    }
                }, cache: false});

                //                          var oTable2 = $('#forceTable').dataTable();
                oTable2.fnClearTable();
                oTable2.fnSort([]);

                $.ajax({url: "./data/" + userName + '-' + jobName + "-elForce-1.txt", success: function(data){
                    updateTable(data, oTable2);
                }, cache: false});

                //                          var oTable3 = $('#stressTable').dataTable();
                oTable3.fnClearTable();
                oTable3.fnSort([]);

                $.ajax({url: "./data/" + userName + '-' + jobName + "-elStress-1.txt", success: function(data){
                    updateTable(data, oTable3);
                }, cache: false});

                //                          var oTable4 = $('#complyTable').dataTable();
                oTable4.fnClearTable();
                oTable4.fnSort([]);
                cColors = [0];
            
                $.ajax({url: "./data/" + userName + '-' + jobName + "-comply-1.txt", success: function(data){
                    updateTable(data, oTable4);
                    if (activeTab != null) {
                        if (activeTab.id == 'complyTab') {
                            cColor = true;
                            drawModel(false, false); // deformed
                        }
                    }

                }, cache: false});

                //                          var oTable5 = $('#reactTable').dataTable();
                oTable5.fnClearTable();
                oTable5.fnSort([]);

                $.ajax({url: "./data/" + userName + '-' + jobName + "-restLoad-1.txt", success: function(data){
                    updateTable(data, oTable5);
                }, cache: false});
                if( isMobile )
                    allGraphics = false;
                showScreen("outputScreen");

                currentLoadCase = 1;
                $('#loadCase').html('Load Case ' + currentLoadCase + '/' + totalLoadCases);
            }
        });
    });

    function displayOutputReports( show ) {
        if (currentLoadCase > 0) {
            //                    var oTable1 = $('#dispTable').dataTable();
            oTable1.fnClearTable();
            oTable1.fnSort([]);

            if (isStatic) {

                oTableF.fnClearTable();

                var fileName = "./data/" + userName + '-' + jobName + "-nodeDisp-" + currentLoadCase + ".txt";
                $.get(fileName, function(data){
                    updateTable(data, oTable1);
                    nodeDisps = csvToArray(data, ',');
                    if( activeTab == null ) {
                        cColor = true;
                        drawModel(false, false); // deformed
                        deformed = false; // draw the original
                        cColor = false;
                        drawModel(false, false);
                        deformed = true; // draw the deformed
                        drawModel(false, false);
                    }
                    else {
                        if( activeTab.id == 'dispTab' ) {
                            cColor = true;
                            drawModel(false, false); // deformed
                            deformed = false; // draw the original
                            cColor = false;
                            drawModel(false, false);
                            deformed = true; // draw the deformed
                            drawModel(false, false);
                        }
                    }
                });

                //                      var oTable2 = $('#forceTable').dataTable();
                oTable2.fnClearTable();
                oTable2.fnSort([]);
                fileName = "./data/" + userName + '-' + jobName + "-elForce-" + currentLoadCase + ".txt";
                $.get(fileName, function(data){
                    updateTable(data, oTable2);
                });

                //                      var oTable3 = $('#stressTable').dataTable();
                oTable3.fnClearTable();
                oTable3.fnSort([]);
                fileName = "./data/" + userName + '-' + jobName + "-elStress-" + currentLoadCase + ".txt";
                $.get(fileName, function(data){
                    updateTable(data, oTable3);
                });

                //                      var oTable4 = $('#complyTable').dataTable();
                oTable4.fnClearTable();
                oTable4.fnSort([]);
                cColors = [0];
                fileName = "./data/" + userName + '-' + jobName + "-comply-" + currentLoadCase + ".txt";
                $.get(fileName, function(data){
                    updateTable(data, oTable4);
                    if (activeTab != null) {
                        if (activeTab.id == 'complyTab') {
                            cColor = true;
                            drawModel(false, false); // deformed
                        }
                    }
                });

                //                      var oTable5 = $('#reactTable').dataTable();
                oTable5.fnClearTable();
                oTable5.fnSort([]);
                fileName = "./data/" + userName + '-' + jobName + "-restLoad-" + currentLoadCase + ".txt";
                $.get(fileName, function(data){
                    updateTable(data, oTable5);
                });
            }
            else {
                var fileName = "./data/" + userName + '-' + jobName + "-eigen-" + currentLoadCase + ".txt";
                $.get(fileName, function(data){
                    updateTable(data, oTable1);
                    nodeDisps = csvToArray( data, ',' );
                    deformed = false; // draw the original
                    cColor = false;
                    drawModel(false,false);
                });

                /*                      oTableF.fnClearTable();
                        oTableF.fnSort([]);
                        fileName = "./data/" + userName + '-' + jobName + "-freqs.txt";
                        $.get(fileName, function(data){
                          updateTable(data, oTableF);
                        });
                */                  }

            if ( !isMobile || show || !allGraphics ) {
                allGraphics = false;
                showScreen("outputScreen");
            }
        }
    }

    $('#outputReports').click( function(e){
        displayOutputReports();
    });

    $('#analysisDynamic').click(function(e){

        var istr1 = $('#dX').val();
        var istr2 = $('#dY').val();
        var istr3 = $('#dZ').val(); // may have been inadvertent PgDn push

        if (currElmt > totEls && ((istr1 == "" || istr1 == 0.0) && (istr2 == "" || istr2 == 0.0) && (istr3 == "" || istr3 == 0.0))) {
            if (currElmt > 1) {
                currElmt--;
                displayElement(currElmt);
                selectionSet = [currElmt];
                nodSelectionSet = [];
                elemMenu();    // reset context menu to reflect elements
                if (highLight) {
                    deformed = false; // draw the original
                    cColor = false;
                    isAnimated = false;
                    drawModel(false,false);
                }
            }
        }
        else {
      
            if (editRights) {
                if (!isEqual1(modelElements[currElmt], getScreenEntries()) || (currElmt > totEls)) {
                    if (validEntry(false)) {
                        if (memberDefault && newMember) {
                            var iSav = currElmt;
                            nextEl(true);
                            currElmt = iSav;
                        }
                        else {
                            storeElement(1, 1, 1, 1, 1, 1, 1, 1, 0, -1, true, true);
                            if (highLight) {
                                deformed = false; // draw the original
                                cColor = false;
                                isAnimated = false;
                            }
                            drawModel(false, true);
                            displayElement(currElmt);
                        }
                    }
                }
                else {
                    if (currElmt > totEls) 
                        totEls = currElmt;
                    if (highLight) {
                        deformed = false; // draw the original
                        cColor = false;
                        isAnimated = false;
                        drawModel(false, false);
                    }
                }
            }
        }

        if (!errorFree()) {
            displayElement(currElmt);
            return;
        }

        isStatic = false;
        $('#dispTab').html('Mode Shapes');
        $('#forceTab').hide();
        $('#stressTab').hide();
        $('#complyTab').hide();
        $('#restraintTab').hide();
        $('#freqTab').show();
        $('a[href="#freqReport"]').tab('show');
        $('a[href="#dispReport"]').tab('show');

        $.ajax({
            type: "POST",
            url: "./php/rundyn.php",
            data: {
                "userName": userName,
                "jobName": jobName,
                "userName1": userName1 
            },
            success: function(data){

                totalLoadCases = data;
                //                            var oTable1 = $('#dispTable').dataTable();
                oTable1.fnClearTable();
                oTable1.fnSort([]);

                $.ajax({url: "./data/" + userName + '-' + jobName + "-eigen-1.txt", success: function(data){
                    updateTable(data, oTable1);
                    nodeDisps = csvToArray( data, ',' );
                    deformed = false;
                    cColor = false;
                    drawModel(false,false);    // original
                }, cache: false});

                $.get("./data/" + userName + '-' + jobName + "-freqs.txt", function(data){
                    oTableF.fnClearTable();
                    oTableF.fnSort([]);
                    updateTable(data, oTableF);
                });

                if( isMobile )
                    allGraphics = false;
                showScreen("outputScreen");

                currentLoadCase = 1;
                totalLoadCases = 5;
                $('#loadCase').html('Load Case ' + currentLoadCase + '/' + totalLoadCases);
            }
        });
    });

    $('#inputModeling').click(function(e){
        allGraphics = false;
        deformed = false;
        cColor = false;
        if( isMobile )
            $('#hero1').html('<h4><img src="assets/img/left-arrow-1.png">CloudCalc</h4>');
        showScreen("inputScreen");
        //                  drawModel(false,false);
    });

    $('#inputLoadCases').click(function(e){
        allGraphics = false;
        deformed = false;
        cColor = false;
        showScreen("loadCaseBuilder");
        //                  drawModel(false,false);
    });

    $('#inputGraphics').click(function(e){
        allGraphics = true;
        showScreen("allGraphics");
    });

    $('#inputWizard').click(function(e){
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
    
        allGraphics = false;
        deformed = false;
        cColor = false;
        showScreen("inputWiz");
        drawModel(false,false);
    });

    $('#inputDesc').click(function(e){
        allGraphics = false;
        deformed = false;
        cColor = false;
        showScreen("inputDescr");
        drawModel(false,false);
    });

    $('#userProfile').click(function(e){
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
    
        allGraphics = false;
        showProfile();
        //                  deformed = false;
        //                  drawModel(false);
    });

    $('#registerButton').click(function(e){
        updateProfile();
    });

    $('#inputNodalCoordinates').click(function(e){
        allGraphics = false;
        deformed = false;
        cColor = false;
        showScreen("nodalCoords");
        //                  drawModel(false);
    });

    $('#collaboration').click(function(e){
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
    
        getUserList();
        allGraphics = false;
        showScreen("collaborate");
    });

    $('#listView').click(function(e){
        allGraphics = false;
        deformed = false;
        cColor = false;
        showScreen("modelListView");
        //                  drawModel(false);
    });

    if( !isMobile ) 
        $('#resetGlobalMems').click(function(e){
            gMemTable.fnClearTable();
            canWE = true;
            canME = true;
            canSE = true;
            canHPE = true;
            canWBE = true;
            canWTE = true;
            canMTE = true;
            canSTE = true;
            canLE = true;
            can2LE = true;
            canCE = true;
            canMCE = true;
            canHSSE = true;
            canPipE = true;

            canWM = true;
            canMM = true;
            canSM = true;
            canHPM = true;
            canWBM = true;
            canWTM = true;
            canMTM = true;
            canSTM = true;
            canLM = true;
            can2LM = true;
            canCM = true;
            canMCM = true;
            canHSSM = true;
            canPipM = true;

            loadedGlobalMems = false;
        });

    $('#getGlobalCatalog').click(function(e){

        var oldengMem1 = englishMem1;
        var oldmetricMem1 = metricMem1;
        var oldmemW = memW;
        var oldmemM = memM;
        var oldmemS = memS;
        var oldmemHP = memHP;
        var oldmemWB = memWB;
        var oldmemWT = memWT;
        var oldmemMT = memMT;
        var oldmemST = memST;
        var oldmemL = memL;
        var oldmem2L = mem2L;
        var oldmemC = memC;
        var oldmemMC = memMC;
        var oldmemHSS = memHSS;
        var oldmemPip = memPip;

        englishMem1 = ($('#engMem').is(':checked'));
        metricMem1 = ($('#metMem').is(':checked'));
        memW = ($('#w').is(':checked'));
        memM = ($('#m').is(':checked'));
        memS = ($('#s').is(':checked'));
        memHP = ($('#hp').is(':checked'));
        memWB = ($('#wb').is(':checked'));
        memWT = ($('#wt').is(':checked'));
        memMT = ($('#mt').is(':checked'));
        memST = ($('#st').is(':checked'));
        memL = ($('#l').is(':checked'));
        mem2L = ($('#l2').is(':checked'));
        memC = ($('#c').is(':checked'));
        memMC = ($('#mc').is(':checked'));
        memHSS = ($('#hss').is(':checked'));
        memPip = ($('#pip').is(':checked'));

        if( (oldengMem1 != englishMem1) || (oldmetricMem1 != metricMem1) ||
            (oldmemW != memW) || (oldmemM != memM) ||(oldmemS != memS) ||
            (oldmemHP != memHP) || (oldmemWB != memWB) || (oldmemWT != memWT) ||
            (oldmemMT != memMT) || (oldmemST != memST) || (oldmemL != memL) ||
            (oldmem2L != mem2L) || (oldmemC != memC) || (oldmemMC != memMC) ||
            (oldmemHSS != memHSS) || (oldmemPip = memPip) )
            loadedglobalmems = false;

        populateGlobalMemberTable();
    });

    $('#memberLibrary').click(function(e){
        $('#engMem').attr('checked', englishMem1);
        $('#metMem').attr('checked', metricMem1);
        $('#populateMembersScreen').modal('show');
        allGraphics = false;
        showScreen("memberLibraryView");
    });

    $('#matLibrary').click(function(e){
        populateGlobalMaterialTable();
        allGraphics = false;
        deformed = false;
        showScreen("materialLibraryView");
        //                  drawModel(false);
    });

    $("#logIn1").click(function(){

        undoLevel = -1;    // initialize
        ctrlKeyDown = false;

        userLogIn = jQuery.trim($('#userLogIn').val());
        passWord = jQuery.trim($('#userPW').val());

        if (isValid(userLogIn) && isValid(passWord)) {
            $.ajax({
                type: 'POST',
                async: false,
                url: './php/loginUser.php',
                data: {
                    "userName": userLogIn,
                    "passWord": passWord
                },
                success: function(msg){
                    if (msg.substring(0,17) == "Invalid User Name")
                        bootbox.alert("Invalid User Name.  Please register if you have not already.");
                    else {
                        if (msg.substring(0,16) == "Invalid Password")
                            bootbox.alert("Invalid Password, try again.");
                        else {
                            userName = jQuery.trim(userLogIn);
                            userName1 = userName;
              
                            editRights = true;
                            userProfile = JSON.parse(msg);
                            setCookie("username", userLogIn, 1000);
                            //                              setCookie("rememberCheck", rememberMe, 1000);
                            //                              validLogin = true;

                            setCookie("wp", passWord, 0.042) // set password cookie for 1 hr duration

                            var uP = JSON.stringify(userProfile);
                            setCookie("uP", uP, 0.042) // set password cookie for 1 hr duration

                            resetMaterialList(true);
                            resetMemberList(true);

                            var job = getUserJob(userName);
                            displayJobName(job);
                            goGetJob(job);

                            $('#hero').css('background-image', 'url("assets/img/steelstruc-r1.png")');
                            $('#hero').html('<h1>CloudCalc</h1>');

                            if (isMobile) {
                                allGraphics = true;
                                showScreen("allGraphics");
                            }
                            else {
                                allGraphics = false;
                                showScreen("inputScreen");
                            }
                        }
                    }
                },
                error: function(msg){
                    bootbox.alert("Invalid User Name.  Please register if you have not already.");
                }
            });
        }
    });

    $('#fromNode').focusin(function() {
        onFromNode = true;
        onToNode = false;
    });

    $('#fromNode').blur(function() {
        checkNode($('#fromNode'));
        getCoords();
    });

    $('#toNode').focusin(function() {
        onFromNode = false;
        onToNode = true;
    });

    $('#toNode').blur(function() {
        checkNode($('#toNode'));
        getCoords();
    });

    $('#dX').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('#dY').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('#dZ').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('#memberType').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('#pipeOD').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('#pipeTh').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('#betaAngle').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('#material').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFXMember').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFYMember').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFZMember').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMXMember').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMYMember').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMZMember').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFXMember').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFYMember').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFZMember').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMXMember').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMYMember').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMZMember').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFXRestraint').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFYRestraint').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFZRestraint').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMXRestraint').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMYRestraint').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMZRestraint').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFXRestraint').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFYRestraint').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFZRestraint').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMXRestraint').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMYRestraint').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMZRestraint').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('lX').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('lY').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('lZ').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('kX').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('kY').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('kZ').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('cBZ').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('cBY').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('stiffDist').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('stiffI').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('tfaStiff').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('uX').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('uY').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('uZ').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFXLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFYLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFZLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMXLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMYLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMZLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFXLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFYLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFZLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMXLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMYLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMZLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('uXL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('uYL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('uZL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFXLoadL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFYLoadL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFZLoadL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMXLoadL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMYLoadL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMZLoadL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFXLoadL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFYLoadL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFZLoadL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMXLoadL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMYLoadL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMZLoadL').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('uXO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('uYO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('uZO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFXLoadO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFYLoadO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromFZLoadO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMXLoadO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMYLoadO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fromMZLoadO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFXLoadO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFYLoadO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toFZLoadO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMXLoadO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMYLoadO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('toMZLoadO').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('pressureLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('fluidLoad').focusin(function() {
        onFromNode = false;
        onToNode = false;
    });

    $('#dX').blur(function() {
        checkDelta($('#dX'));
        drawModel(true,true);
    });

    $('#dY').blur(function() {
        checkDelta($('#dY'));
        drawModel(true,true);
    });

    $('#dZ').blur(function() {
        checkDelta($('#dZ'));
        drawModel(true,true);
    });

    $('#pipeOD').blur(function() {
        checkPipOD();
    });

    $('#pipeTh').blur(function() {
        checkPipTh();
    });

    $('#betaAngle').blur(function() {
        checkBeta();
    });

    $('#jobDesc').focusin(function() {
        jobNotes = $('#jobDesc').val();
    });

    $('#jobDesc').blur(function() {
        jobNotes1 = $('#jobDesc').val();
        if (jobNotes1 != jobNotes) {
            jobNotes = jobNotes1;
            putNotes(true);
        }
    });

    $('#tabs').tab();  // tvl

    $('#uploadJob').click(function(e){
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
    
        $('#uploadUserName').val(userName);
        $('#uploadJobName').val(jobName);
        document.getElementById('uploadJobProcess').style.visibility = 'hidden';
        document.getElementById('uploadJobForm').style.visibility = 'visible';
        $('#uploadJob').val(jobName);
        $('#uploadJobScreen').modal('show');
    });

    $('#loadCase').html('Load Case ' + currentLoadCase + '/' + totalLoadCases);

    if( jobName == "Unnamed Job" ) {
        $("#fromNode").prop('disabled', true);
        $("#toNode").prop('disabled', true);
        $("#dX").prop('disabled', true);
        $("#dY").prop('disabled', true);
        $("#dZ").prop('disabled', true);
    };

    $('#nodalCoordTable a.edit').live('click', function (e) {
        if( !editRights )
            return;
        e.preventDefault();

        /* Get the row as a parent of the link that was clicked on */
        var nRow = $(this).parents('tr')[0];

        if ( nEditing !== null && nEditing != nRow ) {
            /* A different row is being edited - the edit should be cancelled and this row edited */
            restoreRow( oNodeTable, nEditing, 0 );
            editRow( oNodeTable, nRow, true, 0);
            nEditing = nRow;
        }
        else if ( nEditing == nRow && this.innerHTML == "Save" ) {
            /* This row is being edited and should be saved */
            saveNodeRow( oNodeTable, nEditing );
            nEditing = null;
        }
        else {
            /* No row currently being edited */
            editRow( oNodeTable, nRow, true, 0);
            nEditing = nRow;
        }
    } );

    $('#newNodeCoord').click( function (e) {
        if( !editRights )
            return;
        e.preventDefault();
        if( nEditing != null )
            restoreRow( oNodeTable, nEditing, 0 );

        var aiNew = oNodeTable.fnAddData( [ nodInc, '0.0', '0.0', '0.0',
            '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>','<a class="duplicate" href="">Array</a>' ] );
        aData1[0] = -1;
        var nRow = oNodeTable.fnGetNodes( aiNew[0] );
        editRow( oNodeTable, nRow, false, 0);
        nEditing = nRow;
    } );

    $('#openTable a.open').live('click', function (e) {
        e.preventDefault();

        var nRow = $(this).parents('tr')[0];
        var aData = oOpTable.fnGetData(nRow);
    
        var jobName = aData[0];
        var owner = aData[1];
        if (owner != '---') {
            userName1 = owner;
            editRights = false;
        }
        else {
            userName1 = userName;
            editRights = true;
        }
    
        setJobName(jobName);
        resetJobData(jobName);
        getNotes();
        var jobUnits = getSpecificJobUnits(jobName);
        buildJobUnits(jobUnits);
        var jobNodeCoords = getSpecificJobNodeCoords(jobName);
        buildJobNodeCoords(jobNodeCoords);
        var jobLoadCases = getSpecificJobLoadCases(jobName);
        buildJobLoadCases(jobLoadCases);
        var jobData = getSpecificJob(jobName);
        buildJobArrays(jobData);
        var shareData = getSpecificJobShares(jobName);
        buildShareArrays(shareData);

        $('#selectJob').modal('hide');
        $.ajax({
            type: "POST",
            url: "./php/putUsersJob.php",
            data: {"userName": userName,
                "jobName": jobName,
                "userName1": userName1 },
            success: function(msg){
            }
        });
    });

    $('#openTable a.delete').live('click', function (e) {
        e.preventDefault();

        var nRow = $(this).parents('tr')[0];
    
        //                  var target_row = $(this).closest("tr").get(0); // this line did the trick
        var aPos = oOpTable.fnGetPosition(nRow); 

        var aData = oOpTable.fnGetData(nRow);
    
        var job = aData[0];
        if (job == jobName) 
            bootbox.alert("Cannot delete an open job.");
        else {
            bootbox.confirm("Deleting " + job + " -- Are you sure?", function(result){
                if (result) {
                    $.ajax({
                        url: './php/deleteJobTables.php',
                        type: 'POST',
                        data: {
                            "userName": userName1,
                            "jobName": job
                        },
                        success: function(msg){
                        }
                    });
                    oOpTable.fnDeleteRow(aPos);
                }
            });
        }
    });

    $('#openTable a.copy').live('click', function (e) {
        e.preventDefault();

        var nRow = $(this).parents('tr')[0];
        var aData = oOpTable.fnGetData(nRow);
    
        var jobName = aData[0];
        var userName1 = aData[1];   // copy only appears on a shared document

        inBoot = true;
        bootbox.prompt("Enter new Job Name:", function(result){

            if (result) {

                $.ajax({
                    type: "POST",
                    url: "./php/copyJob.php",
                    data: {
                        "userName": userName,
                        "oldName": jobName,
                        "newName": result,
                        "userName1": userName1
                    },
                    success: function(msg){
                        showShared = true;
                        var jobs = returnAvailableJobs();
                        selectJob2Open(jobs);
                    }
                });
            }    
        });
    
        inBoot = false;
    });

    $('#nodalCoordTable a.delete').live('click', function (e) {
        if( !editRights )
            return;
        e.preventDefault();

        nEditing = null;
        var nRow = $(this).parents('tr')[0];
        aData = oNodeTable.fnGetData(nRow);
        deleteNode(parseInt(aData[0]));
        oNodeTable.fnDeleteRow( nRow );

        var iNodes = oNodeTable.fnSettings().fnRecordsTotal();
        fNodes.length = [];

        for (var j = 0; j < iNodes; j++) {
            var aData = oNodeTable.fnGetData(j);
            node = parseInt(aData[0]);
            x = parseFloat(aData[1]);
            y = parseFloat(aData[2]);
            z = parseFloat(aData[3]);

            fNodes.push({
                "node": node,
                "x": x,
                "y": y,
                "z": z
            });
        }
        setUndo(2,0  /* ,2  */ );

        gridMode = true;
        $("#gridImage").attr("src","assets/ico/ico_grid_2.png");

        if (totEls == 0) {
            tN = parseInt($('#fromNode').val());
            if (isNaN(tN)) 
                tN = nodInc;
            tN += nodInc;
            tN = getNewNode(tN);
            $('#toNode').val(tN)
        }
    } );


    $('#nodalCoordTable a.duplicate').live('click', function (e) {
        if( !editRights )
            return;
        e.preventDefault();

        fromFixedNodes = true;

        nDupRow = $(this).parents('tr')[0];

        $('#nodeDupScreen').modal('show');

    } );

    $('#saveNodDups').click(function(e){
        if( !editRights )
            return;

        gridMode = true;
        $("#gridImage").attr("src","assets/ico/ico_grid_2.png");

        nodIter1 = parseInt($('#nodDupIter1').val());
        if (isNaN(nodIter1))
            nodIter1 = 1;
        nodIncr1 = parseInt($('#nodDupIncr1').val());
        if (isNaN(nodIncr1))
            nodIncr1 = nodInc;

        var freeFormX = $('#nodDupX1').val();
        var freeFormY = $('#nodDupY1').val();
        var freeFormZ = $('#nodDupZ1').val();

        var deltas1 = [];
        for (var i = 0; i < nodIter1; i++) {
            deltas1[i] = [0.0, 0.0, 0.0];
        }

        var freeForm = freeFormX;
        if( !processFreeForm1(deltas1, freeFormX, nodIter1, 0) ) {
            bootbox.alert("Invalid Iteration1 X-variation specification: '" + freeForm +
                          "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
            return;
        }

        freeForm = freeFormY;
        if( !processFreeForm1(deltas1, freeFormY, nodIter1, 1) ) {
            bootbox.alert("Invalid Iteration1 Y-variation specification: '" + freeForm +
                          "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
            return;
        }

        freeForm = freeFormZ;
        if( !processFreeForm1(deltas1, freeFormZ, nodIter1, 2) ) {
            bootbox.alert("Invalid Iteration1 Z-variation specification: '" + freeForm +
                          "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
            return;
        }

        nodIter2 = parseInt($('#nodDupIter2').val());
        if (isNaN(nodIter2))
            nodIter2 = 1;
        nodIncr2 = parseInt($('#nodDupIncr2').val());
        if (isNaN(nodIncr2))
            nodIncr2 = nodInc;

        freeFormX = $('#nodDupX2').val();
        freeFormY = $('#nodDupY2').val();
        freeFormZ = $('#nodDupZ2').val();

        var deltas2 = [];
        for (var i = 0; i < nodIter2; i++) {
            deltas2[i] = [0.0, 0.0, 0.0];
        }

        freeForm = freeFormX;
        if( !processFreeForm1(deltas2, freeFormX, nodIter2, 0) ) {
            bootbox.alert("Invalid Iteration2 X-variation specification: '" + freeForm +
                          "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
            return;
        }

        freeForm = freeFormY;
        if( !processFreeForm1(deltas2, freeFormY, nodIter2, 1) ) {
            bootbox.alert("Invalid Iteration2 Y-variation specification: '" + freeForm +
                          "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
            return;
        }

        freeForm = freeFormZ;
        if( !processFreeForm1(deltas2, freeFormZ, nodIter2, 2) ) {
            bootbox.alert("Invalid Iteration2 Z-variation specification: '" + freeForm +
                          "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
            return;
        }

        nodIter3 = parseInt($('#nodDupIter3').val());
        if (isNaN(nodIter3))
            nodIter3 = 1;
        nodIncr3 = parseInt($('#nodDupIncr3').val());
        if (isNaN(nodIncr3))
            nodIncr3 = nodInc;

        freeFormX = $('#nodDupX3').val();
        freeFormY = $('#nodDupY3').val();
        freeFormZ = $('#nodDupZ3').val();

        var deltas3 = [];
        for (var i = 0; i < nodIter3; i++) {
            deltas3[i] = [0.0, 0.0, 0.0];
        }

        freeForm = freeFormX;
        if( !processFreeForm1(deltas3, freeFormX, nodIter3, 0) ) {
            bootbox.alert("Invalid Iteration3 X-variation specification: '" + freeForm +
                          "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
            return;
        }

        freeForm = freeFormY;
        if( !processFreeForm1(deltas3, freeFormY, nodIter3, 1) ) {
            bootbox.alert("Invalid Iteration3 Y-variation specification: '" + freeForm +
                          "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
            return;
        }

        freeForm = freeFormZ;
        if( !processFreeForm1(deltas3, freeFormZ, nodIter3, 2) ) {
            bootbox.alert("Invalid Iteration3 Z-variation specification: '" + freeForm +
                          "'; format must be 'N@XXX.XX,N@XXX.XX,...' (where 'N@' is optional).");
            return;
        }

        if ((nodIter1 <= 1 || nodIncr1 == 0) && (nodIter2 <= 1 || nodIncr2 == 0) &&
          (nodIter3 <= 1 || nodIncr3 == 0))
            return;

        if( !fromFixedNodes ) {
            // let's make sure that all nodes selected for duplication are in the fixed node list

            var found;
            for (var i = 0; i < nodSelectionSet.length; i++) {
                found = false;
                for (var j = 0; j < fNodes.length; j++) {
                    if (fNodes[j].node == nodSelectionSet[i]) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    // get its coordinates

                    var nodd = nodSelectionSet[i];
                    var xx;
                    var yy;
                    var zz;

                    for (var j=1; j<= totEls; j++) {
                        if( modelElements[j].fromNode == nodd ) {
                            xx = coords[j].x1 * uConstLength;
                            yy = coords[j].y1 * uConstLength;
                            zz = coords[j].z1 * uConstLength;

                            oNodeTable.fnAddData([nodd, xx, yy, zz, '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>', '<a class="duplicate" href="">Array</a>']);

                            fNodes.push({
                                "node": nodd,
                                "x": xx,
                                "y": yy,
                                "z": zz
                            });

                            $.ajax({
                                type: "POST",
                                url: "./php/storeNode.php",
                                data: {
                                    "userName": userName1,
                                    "jobName": jobName,
                                    "Node": nodd,
                                    "X": xx,
                                    "Y": yy,
                                    "Z": zz
                                },
                                success: function(msg){
                                }
                            });
                            break;
                        }
                        else {
                            if( modelElements[j].toNode == nodd ) {
                                xx = coords[j].x2 * uConstLength;
                                yy = coords[j].y2 * uConstLength;
                                zz = coords[j].z2 * uConstLength;

                                oNodeTable.fnAddData([nodd, xx, yy, zz, '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>', '<a class="duplicate" href="">Array</a>']);

                                fNodes.push({
                                    "node": nodd,
                                    "x": xx,
                                    "y": yy,
                                    "z": zz
                                });

                                $.ajax({
                                    type: "POST",
                                    url: "./php/storeNode.php",
                                    data: {
                                        "userName": userName1,
                                        "jobName": jobName,
                                        "Node": nodd,
                                        "X": xx,
                                        "Y": yy,
                                        "Z": zz
                                    },
                                    success: function(msg){
                                    }
                                });
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (fromFixedNodes) {
            var aData = oNodeTable.fnGetData(nDupRow);
            var node = parseInt(aData[0]);
            if (isNaN(node))
                return;
            var x1 = parseFloat(aData[1]);
            if (isNaN(x1))
                x1 = 0.0;
            var y1 = parseFloat(aData[2]);
            if (isNaN(y1))
                y1 = 0.0;
            var z1 = parseFloat(aData[3]);
            if (isNaN(z1))
                z1 = 0.0;
        }

        var incrr = 0;
        var xi3 = 0.0;
        var yi3 = 0.0;
        var zi3 = 0.0;
        for (var i3 = 0; i3 < nodIter3; i3++) {
            if (i3 > 0) {
                xi3 += deltas3[i3 - 1][0];
                yi3 += deltas3[i3 - 1][1];
                zi3 += deltas3[i3 - 1][2];
            }

            var xi2 = 0.0;
            var yi2 = 0.0;
            var zi2 = 0.0;
            for (var i2 = 0; i2 < nodIter2; i2++) {
                if (i2 > 0) {
                    xi2 += deltas2[i2 - 1][0];
                    yi2 += deltas2[i2 - 1][1];
                    zi2 += deltas2[i2 - 1][2];
                }

                var xi1 = 0.0;
                var yi1 = 0.0;
                var zi1 = 0.0;
                for (var i1 = 0; i1 < nodIter1; i1++) {
                    if (i1 > 0) {
                        xi1 += deltas1[i1 - 1][0];
                        yi1 += deltas1[i1 - 1][1];
                        zi1 += deltas1[i1 - 1][2];
                    }
                    if (i1 != 0 || i2 != 0 || i3 != 0) {
                        if (fromFixedNodes) { 

                            var nodd = getNewNode(node + i3 * nodIncr3 + i2 * nodIncr2 + i1 * nodIncr1);
                            var xx = x1 + xi3 + xi2 + xi1;
                            var yy = y1 + yi3 + yi2 + yi1;
                            var zz = z1 + zi3 + zi2 + zi1;
                            oNodeTable.fnAddData([nodd, xx, yy, zz, '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>', '<a class="duplicate" href="">Array</a>']);

                            fNodes.push({
                                "node": nodd,
                                "x": xx,
                                "y": yy,
                                "z": zz
                            });

                            $.ajax({
                                type: "POST",
                                url: "./php/storeNode.php",
                                data: {
                                    "userName": userName1,
                                    "jobName": jobName,
                                    "Node": nodd,
                                    "X": xx,
                                    "Y": yy,
                                    "Z": zz
                                },
                                success: function(msg){
                                }
                            });
                        }
                        else {
                            for (var i=0; i< nodSelectionSet.length; i++ ) {
                                for (var j=0; j<fNodes.length; j++ ) {
                                    if (fNodes[j].node == nodSelectionSet[i]) {
                                        var nodd = getNewNode(nodSelectionSet[i] + i3 * nodIncr3 + i2 * nodIncr2 + i1 * nodIncr1);

                                        for (var k = 0; k < fNodes.length; k++) {
                                            if( nodd == fNodes[k].node ) {    // don't want to recreate this node
                                                nodd = -1;
                                                break;
                                            }
                                        }

                                        if (nodd > 0) {
                                            var xx = fNodes[j].x + xi3 + xi2 + xi1;
                                            var yy = fNodes[j].y + yi3 + yi2 + yi1;
                                            var zz = fNodes[j].z + zi3 + zi2 + zi1;

                                            oNodeTable.fnAddData([nodd, xx, yy, zz, '<a class="edit" href="">Edit</a>', '<a class="delete" href="">Delete</a>', '<a class="duplicate" href="">Array</a>']);

                                            fNodes.push({
                                                "node": nodd,
                                                "x": xx,
                                                "y": yy,
                                                "z": zz
                                            });

                                            $.ajax({
                                                type: "POST",
                                                url: "./php/storeNode.php",
                                                data: {
                                                    "userName": userName1,
                                                    "jobName": jobName,
                                                    "Node": nodd,
                                                    "X": xx,
                                                    "Y": yy,
                                                    "Z": zz
                                                },
                                                success: function(msg){
                                                }
                                            });
                                        }

                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (!fromFixedNodes)
            drawModel(true,true);

        setUndo(2,0  /* ,2  */);

        $('#nodeDupScreen').modal('hide');

        if (totEls == 0) {
            tN = parseInt($('#fromNode').val());
            if (isNaN(tN)) 
                tN = nodInc;
            tN += nodInc;
            tN = getNewNode(tN);
            $('#toNode').val(tN)
        }
    });

    $('#modelListTable a.edit').live('click', function (e) {
        if( !editRights )
            return;
        e.preventDefault();

        /* Get the row as a parent of the link that was clicked on */
        var nRow = $(this).parents('tr')[0];

        if ( nEditing !== null && nEditing != nRow ) {
            /* A different row is being edited - the edit should be cancelled and this row edited */
            restoreRow( oMLTable, nEditing, 2 );
            editRow( oMLTable, nRow, true, 2);
            nEditing = nRow;
        }
        else if ( nEditing == nRow && this.innerHTML == "Save" ) {
            /* This row is being edited and should be saved */
            saveMLRow( oMLTable, nEditing );
            nEditing = null;
        }
        else {
            /* No row currently being edited */
            editRow( oMLTable, nRow, true, 2);
            nEditing = nRow;
        }
    } );

    /*                $('#newListElem').click( function (e) {
        e.preventDefault();
    
        bootbox.alert("Editing of this list has not yeat been enabled.");
    
        var aiNew = oMLTable.fnAddData( [totEls+1, '20', '30', '0.0', '120.0', '0.0', memberTypeArray[0],
               '0', 'A992', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F',
                            'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F',
               '0', '0', '0', '0', '0', '0', '0', '0', 'F', '0', '0', 'F',
               '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0',
               '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0',
               '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0',
               '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0', '0.0',
               '0.0', '0.0', '0.0', '0.0', '0.0'] );
        aData1[0] = -1;
        var nRow = oMLTable.fnGetNodes( aiNew[0] );
        editRow( oMLTable, nRow, false, 2);
        nEditing = nRow;
      } );
    
      $('#modelListTable a.delete').live('click', function (e) {
        e.preventDefault();
    
        var nRow = $(this).parents('tr')[0];
        aData = oMLTable.fnGetData(nRow);
        oMLTable.fnDeleteRow( nRow );
    
        setUndo(2,0 );
      } );
    */
    if( !isMobile ) {
        $('#localMemLibTable a.delete').live('click', function (e) {
            e.preventDefault();

            var nRow = $(this).parents('tr')[0];
            lMemTable.fnDeleteRow( nRow );

            aData = lMemTable.fnGetData();

            for (var index=0; index<aData.length; index++) {
                lMemTable.fnUpdate(index+1, index, 0, false);
            }

            changedMemLib = true;

        } );

        $('#localMemLibTable a.cBmBr').live('click', function (e) {
            e.preventDefault();

            var nRow = $(this).parents('tr')[0];

            aData = lMemTable.fnGetData(nRow);

            if( aData[2] == '<a class="cBmBr" href="">---</a>' )
                aData[2] = '<a class="cBmBr" href="">Col</a>';
            else {
                if( aData[2] == '<a class="cBmBr" href="">Col</a>' )
                    aData[2] = '<a class="cBmBr" href="">Beam</a>';
                else {
                    if( aData[2] == '<a class="cBmBr" href="">Beam</a>' )
                        aData[2] = '<a class="cBmBr" href="">Brace</a>';
                    else {
                        aData[2] = '<a class="cBmBr" href="">---</a>';
                    }
                }
            }

            lMemTable.fnUpdate(aData[2], nRow, 2, false);
            changedMemLib = true;

        } );

        $('#localMemLibTable a.moveUp').live('click', function (e) {
            e.preventDefault();

            var nRow = $(this).parents('tr')[0];

            aData = lMemTable.fnGetData(nRow);

            if( aData[0] > 1 ) {
                aData[0]--;

                aData1 = lMemTable.fnGetData();
                for (var index=0; index<aData1.length; index++) {
                    if( aData1[index][0] == aData[0] ) {

                        var aDat0 = aData1[index][0]+1;
                        var aDat1 = aData1[index][1];
                        var aDat2 = aData1[index][2];

                        lMemTable.fnUpdate(aData[0], index, 0, false);
                        lMemTable.fnUpdate(aData[1], index, 1, false);
                        lMemTable.fnUpdate(aData[2], index, 2, false);

                        lMemTable.fnUpdate(aDat0, index+1, 0, false);
                        lMemTable.fnUpdate(aDat1, index+1, 1, false);
                        lMemTable.fnUpdate(aDat2, index+1, 2, false);
                        break;
                    }
                }
            }

            changedMemLib = true;

        } );

        $('#localMemLibTable a.moveDown').live('click', function (e) {
            e.preventDefault();

            var nRow = $(this).parents('tr')[0];

            aData = lMemTable.fnGetData(nRow);

            if( aData[0] < aData.length-1 ) {
                aData[0]++;

                aData1 = lMemTable.fnGetData();
                for (var index=aData1.length-1; index>=0; index--) {
                    if( aData1[index][0] == aData[0] ) {

                        var aDat0 = aData1[index][0]-1;
                        var aDat1 = aData1[index][1];
                        var aDat2 = aData1[index][2];

                        lMemTable.fnUpdate(aData[0], index, 0, false);
                        lMemTable.fnUpdate(aData[1], index, 1, false);
                        lMemTable.fnUpdate(aData[2], index, 2, false);

                        lMemTable.fnUpdate(aDat0, index-1, 0, false);
                        lMemTable.fnUpdate(aDat1, index-1, 1, false);
                        lMemTable.fnUpdate(aDat2, index-1, 2, false);
                        break;
                    }
                }
            }

            changedMemLib = true;

        } );

        $('#globalMemLibTable a.addLocal').live('click', function (e) {
            e.preventDefault();

            var nRow = $(this).parents('tr')[0];

            aData = gMemTable.fnGetData(nRow);

            aData1 = lMemTable.fnGetData();

            for( var i=0; i<aData1.length; i++ ) {
                if( aData1[i][1].trim() == aData[0].trim() ) {
                    bootbox.alert('This member is already in the local library.');
                    return;
                }
            }

            iOrd = aData1.length + 1;
            var cBmBr = '<a class="cBmBr" href="">---</a>';

            lMemTable.fnAddData([iOrd, aData[0].trim(),cBmBr,
              '<a class="moveUp" href="">Move Up</a>','<a class="moveDown" href="">Move Down</a>',
              '<a class="delete" href="">Delete</a>']);
            changedMemLib = true;

        } );

        $('#localMatLibTable a.delete').live('click', function (e) {
            e.preventDefault();

            var nRow = $(this).parents('tr')[0];
            lMatTable.fnDeleteRow( nRow );

            aData = lMatTable.fnGetData();

            for (var index=0; index<aData.length; index++) {
                lMatTable.fnUpdate(index+1, index, 0, false);
            }

            changedMatLib = true;

        } );

        $('#localMatLibTable a.cBmBr').live('click', function (e) {
            e.preventDefault();

            var nRow = $(this).parents('tr')[0];

            aData = lMatTable.fnGetData(nRow);

            if( aData[2] == '<a class="cBmBr" href="">---</a>' )
                aData[2] = '<a class="cBmBr" href="">Col</a>';
            else {
                if( aData[2] == '<a class="cBmBr" href="">Col</a>' )
                    aData[2] = '<a class="cBmBr" href="">Beam</a>';
                else {
                    if( aData[2] == '<a class="cBmBr" href="">Beam</a>' )
                        aData[2] = '<a class="cBmBr" href="">Brace</a>';
                    else {
                        aData[2] = '<a class="cBmBr" href="">---</a>';
                    }
                }
            }

            lMatTable.fnUpdate(aData[2], nRow, 2, false);
            changedMatLib = true;

        } );

        $('#localMatLibTable a.moveUp').live('click', function (e) {
            e.preventDefault();

            var nRow = $(this).parents('tr')[0];

            aData = lMatTable.fnGetData(nRow);

            if( aData[0] > 1 ) {
                aData[0]--;

                aData1 = lMatTable.fnGetData();
                for (var index=0; index<aData1.length; index++) {
                    if( aData1[index][0] == aData[0] ) {

                        var aDat0 = aData1[index][0]+1;
                        var aDat1 = aData1[index][1];
                        var aDat2 = aData1[index][2];

                        lMatTable.fnUpdate(aData[0], index, 0, false);
                        lMatTable.fnUpdate(aData[1], index, 1, false);
                        lMatTable.fnUpdate(aData[2], index, 2, false);

                        lMatTable.fnUpdate(aDat0, index+1, 0, false);
                        lMatTable.fnUpdate(aDat1, index+1, 1, false);
                        lMatTable.fnUpdate(aDat2, index+1, 2, false);
                        break;
                    }
                }
            }

            changedMatLib = true;

        } );

        $('#localMatLibTable a.moveDown').live('click', function (e) {
            e.preventDefault();

            var nRow = $(this).parents('tr')[0];

            aData = lMatTable.fnGetData(nRow);

            if( aData[0] < aData.length-1 ) {
                aData[0]++;

                aData1 = lMatTable.fnGetData();
                for (var index=aData1.length-1; index>=0; index--) {
                    if( aData1[index][0] == aData[0] ) {

                        var aDat0 = aData1[index][0]-1;
                        var aDat1 = aData1[index][1];
                        var aDat2 = aData1[index][2];

                        lMatTable.fnUpdate(aData[0], index, 0, false);
                        lMatTable.fnUpdate(aData[1], index, 1, false);
                        lMatTable.fnUpdate(aData[2], index, 2, false);

                        lMatTable.fnUpdate(aDat0, index-1, 0, false);
                        lMatTable.fnUpdate(aDat1, index-1, 1, false);
                        lMatTable.fnUpdate(aDat2, index-1, 2, false);
                        break;
                    }
                }
            }

            changedMatLib = true;

        } );

        $('#globalMatLibTable a.addLocal').live('click', function (e) {
            e.preventDefault();

            var nRow = $(this).parents('tr')[0];

            aData = gMatTable.fnGetData(nRow);

            aData1 = lMatTable.fnGetData();

            for( var i=0; i<aData1.length; i++ ) {
                if( aData1[i][1].trim() == aData[0].trim() ) {
                    bootbox.alert('This material is already in the local library.');
                    return;
                }
            }

            iOrd = aData1.length + 1;
            var cBmBr = '<a class="cBmBr" href="">---</a>';

            lMatTable.fnAddData([iOrd, aData[0].trim(),cBmBr,
              '<a class="moveUp" href="">Move Up</a>','<a class="moveDown" href="">Move Down</a>',
              '<a class="delete" href="">Delete</a>']);
            changedMatLib = true;

        } );
    }

    $('#newLoadCase').click( function (e) {
        if( !editRights )
            return;
        e.preventDefault();

        if( nEditing != null )
            restoreRow( oLCTable, nEditing, 1 );

        var lCases = oLCTable.fnGetData();

        if( lCases.length >= 4 ) {
            bootbox.alert("Already at the maximum number of permitted load cases (4).");
            return;
        }

        var lc = " " + (lCases.length + 1);

        var aInew = oLCTable.fnAddData( [ lc.trim(), '1.0', '1.0', '1.0', '1.0','ASD','No','No','1.0','No','<a class="edit" href="">Edit</a>','<a class="delete" href="">Delete</a>'] );

        var nRow = oLCTable.fnGetNodes( aInew[0] );
        editRow( oLCTable, nRow, false, 1);
        nEditing = nRow;
    } );

    $('#loadCaseTable a.edit').live('click', function (e) {
        if( !editRights )
            return;
        e.preventDefault();

        /* Get the row as a parent of the link that was clicked on */
        var nRow = $(this).parents('tr')[0];

        if ( nEditing !== null && nEditing != nRow ) {
            /* A different row is being edited - the edit should be cancelled and this row edited */
            restoreRow( oLCTable, nEditing, 1 );
            editRow( oLCTable, nRow, true, 1);
            nEditing = nRow;
        }
        else if ( nEditing == nRow && this.innerHTML == "Save" ) {
            /* This row is being edited and should be saved */
            saveLCRow( oLCTable, nEditing );
            nEditing = null;
        }
        else {
            /* No row currently being edited */
            editRow( oLCTable, nRow, true, 1);
            nEditing = nRow;
        }
    } );

    $('#loadCaseTable a.delete').live('click', function (e) {
        if( !editRights )
            return;
        e.preventDefault();

        nEditing = null;
        var nRow = $(this).parents('tr')[0];
        aData = oLCTable.fnGetData(nRow);
        oLCTable.fnDeleteRow( nRow );

        var aData1 = oLCTable.fnGetData();

        lCases = [];

        for (var index=0; index<aData1.length; index++ ) {
            aData1[index][0] = ' ' + (index+1);
            aData1[index][0].trim();
            oLCTable.fnUpdate(aData1[index][0], index, 0, false);

            var mult1 = parseFloat(aData1[index][1]);
            var mult2 = parseFloat(aData1[index][2]);
            var mult3 = parseFloat(aData1[index][3]);
            var mult4 = parseFloat(aData1[index][4]);

            var code = aData1[index][5].trim();
            if( code.charAt(0) == 'L' || code.charAt(0) == 'l')
                code = "LRFD";
            else
                code = "ASD";

            var pDelta = aData1[index][6].trim();
            if( pDelta.charAt(0) == 'Y' || pDelta.charAt(0) == 'y')
                pDelta = "Yes";
            else //
                pDelta = "No";

            var redStiff = aData1[index][7].trim();
            if( redStiff.charAt(0) == 'Y' || redStiff.charAt(0) == 'y')
                redStiff = "Yes";
            else //
                redStiff = "No";

            var divBy = parseFloat(aData1[index][8]);
            if( isNaN(divBy) )
                divBy = 1.0;

            var warpYN = aData1[index][9].trim();
            if( warpYN.charAt(0) == 'Y' || warpYN.charAt(0) == 'y')
                warpYN = "Yes";
            else //
                warpYN = "No";

            lCases[index] = {"mult1":mult1,"mult2":mult2,"mult3":mult3,
                "mult4":mult4,"code":code, "pDelta":pDelta,
                "redStiff":redStiff, "divBy": divBy, "warpYN": warpYN };
        }

        var lCase = JSON.stringify(lCases);

        $.ajax({
            type: "POST",
            url: "./php/storeAllLoadCases.php",
            data: { "userName": userName1, "jobName": jobName, "lCases": lCase },
            success: function(msg){
                //                     alert(msg);
            },
            error: function(msg){
                //                     alert(msg);
            }
        });

        setUndo(3, 0 /* , 3 */ );
    } );

    $('#newJobShare').click( function (e) {
        e.preventDefault();

        if( nEditing != null )
            restoreRow( oShTable, nEditing, 2 );

        var aInew = oShTable.fnAddData( [ '', 'Can View','<a class="edit" href="">Edit</a>','<a class="delete" href="">Delete</a>'] );
        var nRow = oShTable.fnGetNodes( aInew[0] );
        editRow( oShTable, nRow, false, 2);
        nEditing = nRow;
    } );

    $('#collaborateTable a.edit').live('click', function (e) {  
        if( !editRights )
            return;
        e.preventDefault();

        /* Get the row as a parent of the link that was clicked on */
        var nRow = $(this).parents('tr')[0];

        if ( nEditing !== null && nEditing != nRow ) {
            /* A different row is being edited - the edit should be cancelled and this row edited */
            restoreRow( oShTable, nEditing, 2 );
            editRow( oShTable, nRow, true, 2);
            nEditing = nRow;
        }
        else if ( nEditing == nRow && this.innerHTML == "Save" ) {
            /* This row is being edited and should be saved */
            saveShRow( oShTable, nEditing );
            nEditing = null;
        }
        else {
            /* No row currently being edited */
            editRow( oShTable, nRow, true, 2);
            nEditing = nRow;
        }
    } );

    $('#collaborate a.delete').live('click', function (e) {
        if( !editRights )
            return;
        e.preventDefault();

        nEditing = null;
        var nRow = $(this).parents('tr')[0];
        aData = oShTable.fnGetData(nRow);
        oShTable.fnDeleteRow( nRow );

        var aData1 = oShTable.fnGetData();

        var iShares = oShTable.fnSettings().fnRecordsTotal();

        var fShares = [];

        for (var j = 0; j < iShares; j++) {
            var aData = oShTable.fnGetData(j);
            user = aData[0].trim();
            permission = aData[1].trim();
            if( permission == 'Can View' )
                permission = 'View';

            fShares[j] = {
                "user": user,
                "permission": permission
            };
        }

        var param = { fSh: fShares };
        var fShare = JSON.stringify(param);

        $.ajax({
            type: "POST",
            url: "./php/updateShares.php",
            data: {"userName": userName,
                "jobName": jobName,
                "fShares": fShare
            },
            success: function(msg){
                setUndo(6, 0 );
            },
            error: function(msg){
            }
        });
    } );

    /*                oTable1 = $('#dispTable').dataTable();
      oTableF = $('#freqTable').dataTable();
      oTable2 = $('#forceTable').dataTable();
      oTable3 = $('#stressTable').dataTable();
      oTable4 = $('#complyTable').dataTable();
      oTable5 = $('#reactTable').dataTable();
    */
    $("#memberType").change(function()
    { 

        if (($(this).val().substring(0, 4) == 'Pipe') ||
        ($(this).val().substring(0, 3) == 'HSS')) {
            $('#accordionPipe').show();
            if ($(this).val() == "PipeCustom") 
                $('#custPipe').show();
            else 
                $('#custPipe').hide();
        }
        else {
            $('#accordionPipe').hide();
            $('#custPipe').hide();
        }
    });

    $("#memberTypeM").change(function()
    { 
        if ($(this).val() == "PipeCustom") 
            $('#custPipeM').show();
        else 
            $('#custPipeM').hide();
    });

    $('#graphNodes').click(function() {
        nodeCallback();
    });
    $('#graphDims').click(function() {
        dimensionCallback();
    })
    $('#graphMems').click(function() {
        memberCallback();
    });
    $('#graphBeta').click(function() {
        betaCallback();
    })
    $('#graphMats').click(function() {
        materialCallback();
    })
    $('#graphRels').click(function() {
        relCallback();
    })
    $('#graphRests').click(function() {
        resCallback();
    })
    $('#graphCodes').click(function() {
        lenCallback();
    })
    $('#graphStiff').click(function() {
        stiffCallback();
    })
    $('#graphUnifD').click(function() {
        unifDeadCallback();
    })
    $('#graphUnifL').click(function() {
        unifLiveCallback();
    })
    $('#graphUnifO').click(function() {
        unifOccCallback();
    })
    $('#graphConcD').click(function() {
        concDeadCallback();
    })
    $('#graphConcL').click(function() {
        concLiveCallback();
    })
    $('#graphConcO').click(function() {
        concOccCallback();
    })
    $('#graphPiping').click(function() {
        pipingCallback();
    })
    $('#graphGroup').click(function() {
        groupCallback();
    })
    $('#graphSelGroup').click(function() {
        selectCallback();
    })
    $('#graphRenum').click(function() {
        renumberCallback();
    });
    $('#graphMove').click(function() {
        moveCallback();
    });
    $('#graphBrek').click(function() {
        breakCallback();
    })
    $('#graphHide').click(function() {
        hideCallback();
    })
    $('#graphCopy').click(function() {
        copyCallback();
    })
    $('#graphDel').click(function() {
        delCallback();
    })

    $('#suppForum').click(function(){
        forumSignIn();
        //          window.open("http://forums.cloudcalc.com","forumwindow","scrollbars=yes,resizable=yes,left=500,width=900,height=1000");  //left=400,top=400, width=400, height=400
    });

    $('#userDocs').click(function(){
        ccDOpen = true;
        ccD = window.open("cloudcalcdocs.htm","docswindow","scrollbars=yes,resizable=yes,left=500,width=900,height=1000");  //left=400,top=400, width=400, height=400
    });

    $('#tourApp1').click(function(){
        if( !isMobile ) {
            allGraphics = false;
            showScreen("inputScreen");
        }
        introHelp(3);
    });

    $('#tourDataScreen').click(function(){
        if (!isMobile && allGraphics) {
            allGraphics = false;
            showScreen("inputScreen");
        }
        introHelp(4);
    });

    $('#wizHelp').click(function(){
        introHelp(6);
    });

    $('#nodeHelp').click(function(){
        introHelp(7);
    });

    $('#listHelp').click(function(){
        introHelp(8);
    });

    $('#loadHelp').click(function(){
        introHelp(9);
    });

    $('#tourApp2').click(function(){
        if( !isMobile ) {
            allGraphics = false;
            showScreen("inputScreen");
        }
        introHelp(3);
    });

    $('#graphHelp').click(function(){
        if (!isMobile && allGraphics) {
            allGraphics = false;
            showScreen("inputScreen");
        }
        introHelp(2);
    });

    $('#modalQuickStart0').click(function(){
        introHelp(1);
    });

    $('#quickHelp').click(function(){
        introHelp(1);
    });

    $('#modalQuickStart1').click(function(){
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
    
        lastDownTarget = null;
        quick = true;

        inBoot = true;
        bootbox.prompt("Enter new Job Name:", function(result){
            if (result) {
                newJobName(result);

                jobName = result;
                userName1 = userName;
                editRights = true;

                $.ajax({
                    type: "POST",
                    url: "./php/copyPrebuiltJob.php",
                    data: {"userName": userName,
                        "jobName": jobName },
                    success: function(msg){
                        setJobName(jobName);
                        getNotes();
                        var jobUnits = getSpecificJobUnits(jobName);
                        buildJobUnits(jobUnits);
                        var jobNodeCoords = getSpecificJobNodeCoords(jobName);
                        buildJobNodeCoords(jobNodeCoords);
                        var jobLoadCases = getSpecificJobLoadCases(jobName);
                        buildJobLoadCases(jobLoadCases);
                        var jobData = getSpecificJob(jobName);
                        buildJobArrays(jobData);
                        var shareData = getSpecificJobShares(jobName);
                        buildShareArrays(shareData);

                        $.ajax({
                            type: "POST",
                            url: "./php/putUsersJob.php",
                            data: {"userName": userName,
                                "jobName": jobName,
                                "userName1": userName1 },
                            success: function(msg){
                            }
                        });
                        setUndo(1, 0);
                        allGraphics = true;
                        deformed = false;
                        cColor = false;
                        drawModel(false, false);
                        introHelp(5);
                    },
                    error: function(msg){
                    }
                });
            }
        });
        inBoot = false;
    });

    $('#modalQuickStart2').click(function(){
        //                  e.preventDefault();
        if( temporary ) {
            if( !modalSignIn() )
                return;
        }
    
        lastDownTarget = null;
        inBoot = true;
        quick = true;
        bootbox.prompt("Enter new Job Name:", function(result){
            if (result) {
                newJobName(result);
                allGraphics = false;
                deformed = false;
                cColor = false;
                showScreen("inputWiz");
                drawModel(false, false);
                introHelp(5);
            }
        });
        inBoot = false;
    });

    $('#tutorial').click(function(){
        ccDOpen = true;
        ccD = window.open("tutorial.htm","docswindow","scrollbars=yes,resizable=yes,left=500,width=900,height=1000");  //left=400,top=400, width=400, height=400
    });

    $('#modalQuickStart3').click(function(){
        ccDOpen = true;
        ccD = window.open("tutorial.htm","docswindow","scrollbars=yes,resizable=yes,left=500,width=900,height=1000");  //left=400,top=400, width=400, height=400
        //                  intro4.start();
    });

    $('#quickStart').click(function(){
        $('#newbyMessage').hide();
        $('#modalQuickStart').modal('show');
    });

    if( !isMobile )
        $('#modelContainer').contextMenu(menu);

    $(".accordion-group").on("shown",".collapse",function() {
        $(this).css("overflow","visible");
    });

    $(".accordion-group").on("hidden",".collapse",function() {
        $(this).css("overflow","hidden");
    });

    $(gN).on('blur', function(c){
        var st = gN.getRawValue();
        if( st )
            gN.addToSelection({id: st, name: st});
      
        var gp = gN.getSelectedItems();
        var chg = false;
        for (var i=0; i<gp.length; i++ ) {
            if (gp[i].name) {
                if (groupList.indexOf(gp[i].name) < 0) {
                    groupList.push(gp[i].name)
                    chg = true;
                }
            }
        }
        if ( chg )
            resetGroupLists(groupList);
    });

    $('#complyTab').click(function(e){
        cColor = true;
        deformed = false;
        addComplianceLabels();
        drawModel(false,false);
      
    });

    $('#dispTab').click(function(e){
        if (!deformed) {
            if (cColor){
                container1.removeChild(complianceCanvas)
            }
            cColor = false;
            drawModel(false, false);
            deformed = true; // draw the deformed
            drawModel(false, false);
        }
    });

    $('#forceTab').click(function(e){
        if (cColor || deformed) {
            if (cColor){
                container1.removeChild(complianceCanvas)
            }
            cColor = false;
            deformed = false;
            drawModel(false, false);
        }
    });

    $('#stressTab').click(function(e){
        if (cColor || deformed) {
            if (cColor){
                container1.removeChild(complianceCanvas)
            }
            cColor = false;
            deformed = false;
            drawModel(false, false);
        }
    });

    $('#restraintTab').click(function(e){
        if (cColor || deformed) {
            if (cColor){
                container1.removeChild(complianceCanvas)
            }
            cColor = false;
            deformed = false;
            drawModel(false, false);
        }
    });

    $('a[data-toggle="tab"]').on('shown', function (e) {
        activeTab = e.target;
    })

    HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

    $('.tAndC').click(function(){
        window.open("new/news/terms&conditions.pdf","mywindow","scrollbars=yes,resizable=yes,left=500,width=900,height=1000");  //left=400,top=400, width=400, height=400
        ccMOpen = true;
    });

    $('#noAcctM').click(function() {
        $('#userLogInM').val("");
        modalRegister();
    });
  
    $('.modalSignInOK').click(function(event) {
        event.preventDefault();
        modalSign();
    });
  
    $('#makeLink').click(function() {
        makeLink();
    });
  
    $("#forgotName").click(function(e){
        $("#forgotM").show();     
    });

    $("#forgotButton").click(function(e){

        var forgotEmail = $("#forgotEmailM").val(); 
        if( !isValidEmail(forgotEmail) ) {
            $('.wrnMsg').text("Error! Invalid email, please try again.");
            return;
        }
        else {
            $.ajax({
                type: 'POST',
                async: false,
                url: './php/forgotLogin.php',
                data: {
                    "forgotEmail": forgotEmail
                },
                success: function(msg){
                    if (msg.substring(0,15) == "Email not found") 
                        $('.wrnMsg').html("Error trying to email User Name and Password to that address.  Please contact <a href='mailto:techsupport@cloudcalc.com'>Technical Support</a>.");
                        //                          $('.wrnMsg').text("No User Account found with that email.  Are you sure you have registered?");
                    else {                      
                        if (msg.substring(0,10) == "Email sent") {
                            $('.wrnMsg').text("Your User Name and a temporary Password have been emailed to the requested address.  Make sure that CloudCalc.com has been whitelisted in your spam filter.");
                        }
                        else {
                            $('.wrnMsg').text("Error trying to email User Name and Password to that address.  Please contact <a href='mailto:techsupport@cloudcalc.com'>Technical Support</a>.");
                        }
                    }            
                },
                error: function(msg){
                    $('.wrnMsg').text("Error trying to email User Name and Password to that address.  Please contact <a href='mailto:techsupport@cloudcalc.com'>Technical Support</a>.");
                }
            });
        }
    });
  
    $("#logIn").click(function(e){
        modalSignIn() 
    });

    ccDOpen = false;
    ccFOpen = false;
    ccMOpen = false;

    if( isMobile ) 
        $('#hero1').html('<img src="assets/img/right-arrow-1.png">');

    setVariableView();
  
    $("#shareScreen").click(function(e){
        if( isSharing ) 
          stopSharing();
        else 
          startSharing();
        isSharing = !isSharing;
    });

/*    TogetherJS.hub.on('firstEl', function (msg) {
        if (!msg.sameUrl) {
            return;
        }
        firstEl(false);
    });

    TogetherJS.hub.on('prevEl', function (msg) {
        if (!msg.sameUrl) {
            return;
        }
        prevEl(false);
    });

    TogetherJS.hub.on('nextEl', function (msg) {
        if (!msg.sameUrl) {
            return;
        }
        nextEl(false);
    });

    TogetherJS.hub.on('lastEl', function (msg) {
        if (!msg.sameUrl) {
            return;
        }
        lastEl(false);
    });


    TogetherJS.hub.on('lastEl', function (msg) {
        if (!msg.sameUrl) {
            return;
        }
        lastEl(false);
    });

    TogetherJS.hub.on('newEl', function (msg) {
        if (!msg.sameUrl) {
            return;
        }
        newEl(false);
    });

    TogetherJS.hub.on('findEl1', function (msg) {
        if (!msg.sameUrl) {
            return;
        }
        findEl1(false);
    });
  
    TogetherJS.hub.on('findEl', function (msg) {
        if (!msg.sameUrl) {
            return;
        }
  
        bBox.modal('hide');
        findEl(parseInt(msg.fromN), parseInt(msg.toN));
    });  */
};

function makeArrayFromSet(s){
    /*turn a Set into an array. Returns array*/
    var a = [];
    for (v of s){
        a.push(v);
    }
return a;
}

/*  function handleBrowserCloseButton(event) { 
   if (($(window).width() - window.event.clientX) < 35 && window.event.clientY < 0) 
    {
      //Call method by Ajax call
      alert('Browser close button clicked');    
    } 
} */

$(init);

console.log("run")