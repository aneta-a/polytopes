/**
* @author Anna Alekseeva
*/

var canvas2D, context2D;
var stereoCanvas2D, steroContext2D;
var ctx3d, ctx4d, ctx4dstereo;
var dirVector;
var poly3, poly3sec, poly4;
var pts3d;

var canvasScale2D = 0.32;
var canvasScale3D = 0.32;
var canvasScale4D = 0.48;


//-------------2d-------------------
var bkgColor2D = "#eeeeee";
var projLineColor = "#5F915F";
var projLineWidth = 3;
var secLineColor = "#993333";
var secLineWidth = 2;
var secFillStyle = "rgba(249, 169, 83, 0.5)";
var stereoLineColor = "#6699cc";
var stereoLineWidth = 3;
var maxRadius = 2;

//-----------------3d--------------------
var rendererBkgColor = 0x666666;
var dirVectorColor = 0x333399;
var faceColor = 0x8D89E1;
var edgeColor = 0x5F915F;
var secLineColor3d = 0x993333;

//----------------4d-----------------
var stereoColor4d = 0x6699cc; 
var projColor4d = 0x66cc66;
var sectionFaceColor4d = 0xc8761e;
var sectionEdgeColor4d = 0x993333;





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
	renderer.setSize (size.w, size.h);
	parent.appendChild (renderer.domElement);

	var scene = new THREE.Scene();

 	var camera = new THREE.PerspectiveCamera (45, size.w/size.h, 1, 10000);
	camera.position.y = 30;
	camera.position.z = 10;
	camera.lookAt (new THREE.Vector3(0,0,0));

  	var controls = new THREE.OrbitControls (camera, renderer.domElement);
  	controls.enableKeys = false;
	initLights(scene);
	
	controls.enableZoom = false;
	
	renderer.domElement.addEventListener("click", function (ev) {controls.enableZoom = true});
	renderer.domElement.addEventListener("mouseout", function (ev) {controls.enableZoom = false});
	
	
 	
  	return {renderer: renderer, scene: scene, camera: camera, controls: controls};

}

var updateThreeContext = function (ctxObj) {
	ctxObj.controls.update();
	ctxObj.renderer.render(ctxObj.scene, ctxObj.camera);
}

var initCanvas3D = function () {
	
	ctx3d = createThreeContext();
	poly3 = new PolyGroup(ctx3d.scene, curPoly, {meshMaterialData: {color: faceColor}, lineMaterialData: {color: edgeColor}, sticksMaterialData: {color: projColor4d}}, {faces: true, sticks: false, vertices: false});
	poly3sec = new PolyGroup(ctx3d.scene, 
							curPoly.getSection3D(Utils.dirIdentical3, 0), 
							{lineMaterialData: {color: secLineColor3d}}, 
							{faces: false, edges: true});
	initDirVector();
	pts3d = new InteractivePoints(ctx3d);
	InteractivePoints.setClickManager(ctx3d, pts3d, [poly3]);
	ctx3d.renderer.domElement.addEventListener("pointschange", onPointsChange3d);
	return createCanvasBlock(ctx3d, "Polyhedron");

}

var onPointsChange3d = function (ev) {
	var planeObj = new HyperPlane(ev.detail);//Utils.pointsToPlane(ev.detail);
	if (!planeObj.error) {
		setSlidersValue(planeObj.dir, sliderPhi, sliderTheta)
		sliderH.value = planeObj.h;
		sliderH.updateValueOutput();
		updateDirection();

	}
}
var onPointsChange4d = function (ev) {
	var planeObj = new HyperPlane(ev.detail);//Utils.pointsToPlane(ev.detail);
	if (!planeObj.error) {
		setSlidersValue(planeObj.dir, sliderPhi4d, sliderTheta4d, sliderChi4d)
		sliderH4d.value = planeObj.h;
		sliderH4d.updateValueOutput();
		updateDirection4d();

	}
}



var initCanvas4D = function () {

/*
var stereoColor4d = 0x6699cc; 
var projColor4d = 0x66cc66;
var sectionFaceColor4d = 0xc8761e;
var sectionEdgeColor4d = 0x993333;
var rendererBkgColor4d = 0x666666;
var rendererBkgColorStereo4d = 0x666666;

*/
	ctx4d = createThreeContext(document.body, {w: window.innerWidth*0.45, h: window.innerWidth*0.45});
	ctx4dstereo = createThreeContext(document.body, {w: window.innerWidth*0.45, h: window.innerWidth*0.45});
	
	poly4 =       new PolyGroup(ctx4d.scene, 
					  		    cur4Poly.getSection(curDir4d, 0.1), 
							    {meshMaterialData: {color: sectionFaceColor4d}, lineMaterialData: {color: sectionEdgeColor4d}});
	poly4proj =   new PolyGroup(ctx4d.scene, 
	                            cur4Poly.getProjection(curDir4d), 
			                    {lineMaterialData: {color: projColor4d}, edgeStickMaterialData: {color: projColor4d}}, 
			                    {faces: false, sticks: true, edges: true, vertices: true});
	poly4stereo = new PolyGroup(ctx4dstereo.scene, 
								cur4Poly.getStereoProjection(), 
								{lineMaterialData: {color: stereoColor4d}, edgeStickMaterialData: {color: stereoColor4d}}, 
								{faces: false, edges: true, sticks: true, vertices: true});

	pts4d = new InteractivePoints(ctx4d, 4);
	InteractivePoints.setClickManager(ctx4d, pts4d, [poly4proj]);
	ctx4d.renderer.domElement.addEventListener("pointschange", onPointsChange4d);

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

