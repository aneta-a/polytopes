/**
* @author Anna Alekseeva
*/

var canvas2D, context2D;
var stereoCanvas2D, steroContext2D;
var canvasScale2D = 0.32;

var bkgColor2D = "#eeeeee";
var projLineColor = "#996666";
var projLineWidth = 2;
var secLineColor = "#666699";
var secLineWidth = 2;
var secFillStyle = "rgba(200, 60, 60, 0.3)";
var maxRadius = 2;


var canvasScale3D = 0.32;
var canvasScale4D = 0.48;
var rendererBkgColor = 0x666666;
var dirVectorColor = 0x339933;

var ctx3d, ctx4d, ctx4dstereo;
var dirVector;
var poly3, poly3sec, poly4;



//-----------2D--------------------------------------------------------------------------
var drawPolygon = function(ctx, polygon, fill = false, lineWidth = projLineWidth, lineColor = projLineColor, fillStyle = null, adjust=false) {
	var w = ctx.canvas.width;
	var h = ctx.canvas.height;
	var x0 = w/2;
	var y0 = h/2;
	var scale;
	if (adjust) {
		var minX = maxX = minY = maxY = 0;
		for (var i = 0; i < polygon.vertices.length; i++) {
			var x = polygon.vertices[i].x;
			var y = polygon.vertices[i].y;
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
		var invScale = Math.max(Math.abs(minX)/w, maxX/w, Math.abs(minY)/h, maxY/h);
		scale = 0.48/invScale;
	} else {
		scale = Math.min(w, h)/2/maxRadius;
	}
	ctx.strokeStyle=lineColor;
	ctx.lineWidth=lineWidth;
	ctx.beginPath();
	if (polygon.edges && polygon.edges.length) {
		for (var i = 0; i < polygon.edges.length; i++) {
			var v1 = polygon.vertices[polygon.edges[i][0]];
			var v2 = polygon.vertices[polygon.edges[i][1]];
			ctx.moveTo(x0 + v1.x*scale, y0 + v1.y*scale);
			ctx.lineTo(x0 + v2.x*scale, y0 + v2.y*scale);
		}
	} else if (polygon.vertices.length){
		var v = polygon.vertices[0];
		ctx.moveTo(x0 + v.x*scale, y0 + v.y*scale);
		for (var j = 0; j < polygon.vertices.length; j++) {
			v = polygon.vertices[(j+1)%polygon.vertices.length];
			ctx.lineTo(x0 + v.x*scale, y0 + v.y*scale);
		}
	}
	if (fill) {
		ctx.fillStyle = fillStyle;
		ctx.fill();
	}
	ctx.stroke();	
	
}

var drawSection = function (ctx, polygon) {
	drawPolygon(ctx, polygon, true, secLineWidth, secLineColor, secFillStyle);
}



var clearContext = function (ctx) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fillStyle = bkgColor2D;
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

var initCanvas2D = function(size = {w: window.innerWidth*canvasScale2D, h: window.innerWidth*canvasScale2D}) {
	canvas2D = document.createElement("canvas");
	canvas2D.setAttribute("width", size.w); 
	canvas2D.setAttribute("height", size.h); 
	canvas2D.setAttribute("border", 1); 
	context2D = canvas2D.getContext("2d");
	clearCanvas2D();
	return createCanvasBlock(canvas2D, "Section and projection");

}
var initStereoCanvas2D = function(size = {w: window.innerWidth*canvasScale2D, h: window.innerWidth*canvasScale2D}) {
	stereoCanvas2D = document.createElement("canvas");
	stereoCanvas2D.setAttribute("width", size.w); 
	stereoCanvas2D.setAttribute("height", size.h); 
	stereoCanvas2D.setAttribute("border", 1); 
	stereoContext2D = stereoCanvas2D.getContext("2d");
	clearContext(stereoContext2D);
	return createCanvasBlock(stereoCanvas2D, "Stereographic projection");
	

}

//-------------------------------3D------------------------------------------------------------
var createThreeContext = function (parent = document.body, size= {w: window.innerWidth*canvasScale3D, h: window.innerWidth*canvasScale3D}) {
	var renderer = new THREE.WebGLRenderer( {antialias:true, alpha:true} );
  	renderer.setClearColor(rendererBkgColor);
	//var width = window.innerWidth;
	//var height = window.innerHeight;
	renderer.setSize (size.w, size.h);
	parent.appendChild (renderer.domElement);

	var scene = new THREE.Scene();

 	var camera = new THREE.PerspectiveCamera (45, size.w/size.h, 1, 10000);
	camera.position.y = 30;
	camera.position.z = 10;
	camera.lookAt (new THREE.Vector3(0,0,0));

  	var controls = new THREE.OrbitControls (camera, renderer.domElement);
	initLights(scene);
 	
  	return {renderer: renderer, scene: scene, camera: camera, controls: controls};

}

var updateThreeContext = function (ctxObj) {
	ctxObj.controls.update();
	ctxObj.renderer.render(ctxObj.scene, ctxObj.camera);
}

var initCanvas3D = function () {
	
	ctx3d = createThreeContext();
	poly3 = new PolyGroup(ctx3d.scene, curPoly);
	poly3sec = new PolyGroup(ctx3d.scene, 
							curPoly.getSection3D(Utils.dirIdentical3, 0), 
							{lineMaterialData: {color: 0x3333ff}}, 
							{faces: false, edges: true});
	initDirVector();
	return createCanvasBlock(ctx3d, "Polyhedron");

}

var initCanvas4D = function () {

	ctx4d = createThreeContext(document.body, {w: window.innerWidth*0.45, h: window.innerWidth*0.45});
	ctx4dstereo = createThreeContext(document.body, {w: window.innerWidth*0.45, h: window.innerWidth*0.45});
	poly4 = new PolyGroup(ctx4d.scene, cur4Poly.getSection(curDir4d, 0.1));
	poly4proj = new PolyGroup(ctx4d.scene, cur4Poly.getProjection(curDir4d), {lineMaterialData: {color: 0x339933}}, {faces: false, edges: true});
	poly4stereo = new PolyGroup(ctx4dstereo.scene, 
								cur4Poly.getStereoProjection(), 
								{lineMaterialData: {color: 0x99ccff}}, 
								{faces: false, edges: true});
}



function initLights(scene) {
  	var pointLight = new THREE.PointLight (0xffffff);
	pointLight.position.set (0,30,10);
	scene.add(pointLight);
	var light = new THREE.AmbientLight( 0x999999 ); // soft white light
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
	directionalLight.position.set( -2, 1, 0.5 );
	scene.add( directionalLight );
	var directionalLight1 = new THREE.DirectionalLight( 0xffffff, 0.6 );
	directionalLight1.position.set( 2, -1, 0.5 );
	scene.add( directionalLight1 );
	scene.add( light );

}


var updatePolyhedron = function () {
	poly3.update(curPoly);
	
}

var updatePolytope = function () {
	poly4proj.update(cur4Poly.getProjection(curDir4d));
	poly4.update(cur4Poly.getSection(curDir4d, sliderH4d.value));
	poly4stereo.update(cur4Poly.getStereoProjection());
}


var initDirVector = function() {

	var material = new THREE.LineBasicMaterial({
		color: dirVectorColor, linewidth: 2
	});

	var geometry = new THREE.Geometry();
	geometry.vertices.push(
		new THREE.Vector3( 0, 0, 0 ),
		new THREE.Vector3( 0, 0, PolyGroup.style.numbers.scale3D )
	);

	dirVector = new THREE.Line( geometry, material );
	ctx3d.scene.add( dirVector );
}

var updateDirVector = function (v) {
	var liveV = v.clone().normalize ().multiplyScalar(PolyGroup.style.numbers.scale3D);
	dirVector.geometry.vertices[1].copy(liveV);
	dirVector.geometry.verticesNeedUpdate = true;
	dirVector.geometry.buffersNeedUpdate = true;
}
console.log("display loaded");

