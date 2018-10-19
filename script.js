/**
* @author Anna Alekseeva
*/


var sliderPhi, sliderTheta, sliderH;
var sliderPhi4d, sliderTheta4d, sliderChi4d, sliderH4d;

var normalOutput4d;

var normalInputOutput, normalInputOutput4d;


var curPoly, curSection, curProjection;
var cur4Poly, cur4Section, cur4Projection;
var curDir4d, curSectionHP4d;
var solids = {}, solids4d = {};

function init()
{
	setStrings();
	createInfo();
	solids = {	
		Tetrahedron: tetrahedron, 
		Cube: cube,
		Octahedron: octahedron,
		Dodecahedron: dodecahedron,
		Icosahedron: icosahedron
	};
	curPoly = icosahedron;
	solids4d = {	
		Simplex: simplex, 
		Tesseract: tesseract,
		Hyperoctahedron: hyperoctahedron,
		C24: cells24, 
		C10: c10
	};
	
	cur4Poly = simplex;
	curDir4d = Utils.dirIdentical4; 
	cur4Projection = simplex.getProjection(curDir4d);
	curSectionHP4d = new HyperPlane(curDir4d, 0);
	
	function createViewHead (parent, content) {
		var h2 = document.createElement("h2");
		h2.innerHTML = content;
		h2.setAttribute("class", "view-head");
		parent.appendChild(h2);
	}
	
	var view3d = document.getElementById("view3d");
	createViewHead(view3d, strings.Head3d);
	
	canvas3d = createCanvasBlock(view3d, strings.Main3d, "main3d");
	canvas2D = createCanvasBlock(view3d, strings.Proj3d, "proj3d");
	stereoCanvas2D = createCanvasBlock(view3d, strings.Stereo3d, "stereo3d");
	
	initControls(view3d);
	
	var view4d = document.getElementById("view4d");
	createViewHead(view4d, strings.Head4d);
	
	canvas4d = createCanvasBlock(view4d, strings.Main4d, "main4d");
	canvas4dstereo = createCanvasBlock(view4d, strings.Stereo4d, "stereo4d");
	
	initControls4D(view4d);
	
	initCanvas3D(view3d);
	initCanvas4D(view4d);
	
	window.addEventListener("resize", onWindowResize);
	updateDirection();
  	animate();
}

function createInfo() {
	function setP(id, contentName) {
		document.getElementById(id).innerHTML = strings[contentName];
	}
	
	setP("mainhead", "Interactive_Polytopes");
	setP("info-common", "About1");
	setP("info3d", "About2");
	setP("info4d", "About3");
	setP("thnx", "Thanks");
	setP("contact", "Mail");
	setP("signature", "Sign");
	
	document.getElementById("contact").innerHTML += " <img id=\"imgmail\" src=\"a.png\"/>"
}

function onWindowResize(ev) {
	resizeCanvas(canvas2D);
	resizeCanvas(stereoCanvas2D);
	resizeCanvas(ctx3d);
	resizeCanvas(ctx4d);
	resizeCanvas(ctx4dstereo);
	updateDirection();
	    //updateThreeContext(ctx3d);
    //updateThreeContext(ctx4d); 
    //updateThreeContext(ctx4dstereo); 

}

function onSolidChange (ev) {
	var curPolyName = getRBSelectedValue("solid");
	if (solids.hasOwnProperty(curPolyName)) {
		curPoly = solids[curPolyName];
		updatePolyhedron();
		updateDirection();
		pts3d.clear();
	}
}
function onSolid4dChange (ev) {
	var curPolyName = getRBSelectedValue("solid4d");
	if (solids4d.hasOwnProperty(curPolyName)) {
		cur4Poly = solids4d[curPolyName];
		updatePolytope();
		pts4d.clear();
	}

}

function initControls(parent) {
	var selectSolid = createRadioGroup (solids, "solid", "Icosahedron", onSolidChange, parent, strings);
	
	var controlsBlock = createDiv("controlblock");
	
	var sliderTableElement = createDiv("sliders-block");

	sliderPhi = setSlider("&phi;", -1, 1, "-&pi;", "&pi;", 0, "&pi;", sliderTableElement);
	sliderTheta = setSlider("&theta;", 0, 1, "0", "&pi;", 0, "&pi;", sliderTableElement);
	sliderH = setSlider("h", -2, 2, "-2", "2", 0, "", sliderTableElement);
	controlsBlock.appendChild(sliderTableElement);
	
	
	normalInputOutput = setNormalInput("normalInput3d", 3, controlsBlock); 
	parent.appendChild(controlsBlock);

	sliderPhi.addEventListener("change", updateDirection);
	sliderTheta.addEventListener("change", updateDirection);
	sliderH.addEventListener("change", updateDirection);

	
	

}

function initControls4D(parent) {
	var selectSolid4d = createRadioGroup (solids4d, "solid4d", "Simplex", onSolid4dChange, parent, strings);
	
	var controlsBlock = createDiv("controlblock");
	
	var sliderTableElement = createDiv("sliders-block");

	
	
	sliderPhi4d = setSlider("&phi;", -1, 1, "-&pi;", "&pi;", 0, "&pi;", sliderTableElement);
	sliderTheta4d = setSlider("&theta;", 0, 1, "0", "&pi;", 0, "&pi;", sliderTableElement);
	sliderChi4d = setSlider("&chi;", 0, 1, "0", "&pi;", 0, "&pi;", sliderTableElement);
	sliderH4d = setSlider("h", -2, 2, "-2", "2", 0, "", sliderTableElement);
	controlsBlock.appendChild(sliderTableElement);
	
	normalInputOutput4d = setNormalInput("normalInput4d", 4, controlsBlock);
	parent.appendChild(controlsBlock);
	
	sliderPhi4d.addEventListener("change", updateDirection4d);
	sliderTheta4d.addEventListener("change", updateDirection4d);
	sliderChi4d.addEventListener("change", updateDirection4d);
	sliderH4d.addEventListener("change", updateDirection4d);

}

function updateDirection(ev) {
	var newDir = {
		theta: sliderTheta.value*Math.PI,
		phi: sliderPhi.value*Math.PI
	}
	curProjection = curPoly.getProjection(newDir);
	poly3sec.update(curPoly.getSection3D(newDir, sliderH.value));
	v = Utils.dirToVector(newDir)
	updateDirVector(v);
	v.setLength(sliderH.value);
	curSection = curPoly.getSection2D(newDir, sliderH.value);
	clearContext(context2D);
	drawSection(context2D, curSection);
	drawPolygon(context2D, curProjection);
	clearContext(stereoContext2D);

	drawPolygon(stereoContext2D, curPoly.getStereoProjection(), false, stereoLineWidth, stereoLineColor, null, true);
	normalInputOutput.inputx.value = v.x.toFixed(3);
	normalInputOutput.inputy.value = v.y.toFixed(3);
	normalInputOutput.inputz.value = v.z.toFixed(3);
}
function updateDirection4d(arg) {
	var argType = "";
	if (!arg || (arg.target && arg.target.type == "range")) {
		
		curDir4d = {
			theta: sliderTheta4d.value*Math.PI,
			phi: sliderPhi4d.value*Math.PI,
			chi: sliderChi4d.value*Math.PI
		}	
		curSectionHP4d = new HyperPlane(curDir4d, sliderH4d.value);
		argType = "event";
	} else if (arg && arg.isVector4) {
		curSectionHP4d = new HyperPlane(arg);
		curDir4d = curSectionHP4d.dir;
		argType = "vector";
	} else if (arg && arg.isHyperPlane) {
		curSectionHP4d = arg;
		curDir4d = curSectionHP4d.dir;
		argType = "hp"
	}
	if (argType != "event") {
		setSlidersValue(curDir4d, sliderPhi4d, sliderTheta4d, sliderChi4d);
		sliderH4d.value = curSectionHP4d.h;
		sliderH4d.updateValueOutput();
	}
	if (argType != "vector") {
		v = curSectionHP4d.orthoCenter.clone();
		normalInputOutput4d.inputx.value = v.x.toFixed(3);
		normalInputOutput4d.inputy.value = v.y.toFixed(3);
		normalInputOutput4d.inputz.value = v.z.toFixed(3);
		normalInputOutput4d.inputw.value = v.w.toFixed(3);
	}
	
	cur4Projection = cur4Poly.getProjection(curDir4d);

	ctx4d.renderer.domElement.dispatchEvent(new CustomEvent("hpchange", {detail: curSectionHP4d}));
	updatePolytope();
}


function setNormalInput(name, dim = 3, parent = document.body) {
	var res = document.createElement("span");
	res.setAttribute("class", "vector-input");
	res.setAttribute("name", name);
	res.appendChild(document.createTextNode("n = ("));
	var compNames = ["x", "y", "z", "w"];
	for (var i = 0; i < dim; i++) {
		var input = document.createElement("input");
		input.setAttribute("type", "text");
		input.setAttribute("class", "vector-input-field");
		input.setAttribute("size", 6);
		input.value = "0.000";
		res.appendChild(input);
		res.appendChild(document.createTextNode(i == dim-1 ? ")" : ", "));
		res["input" + compNames[i]] = input;
		input.addEventListener("change", function (ev) {onDirVectorInput(name);});
		
	}
	res.getVector = function () {
		var vect = dim == 4 ? new THREE.Vector4(0, 0, 0, 0) : new THREE.Vector3();
		for (var j = 0; j < dim; j++) {
			vect.setComponent(j, Number(res["input" + compNames[j]].value));
		}
		return vect;
	}
	var inputBlock = createDiv("inputblock");
	inputBlock.appendChild(res);
	parent.appendChild(inputBlock);
	return res;
}

function onDirVectorInput(name) {
	var inputEl = document.getElementsByName(name)[0];
	var v = inputEl.getVector();
	var dir = Utils.vectorToDir(v);
	if (name == "normalInput4d") {
		updateDirection4d(v);
	} else {
		setSlidersValue(dir, sliderPhi, sliderTheta)
		sliderH.value = v.length();
		sliderH.updateValueOutput();
		updateDirection();
	}
	
}

function setSlidersValue(dir, phis, thetas, chis) {
	phis.value = dir.phi/Math.PI;
	phis.updateValueOutput();
	thetas.value = dir.theta/Math.PI;
	thetas.updateValueOutput();
	if (dir.hasOwnProperty("chi")){
		chis.value = dir.chi/Math.PI;
		chis.updateValueOutput();
	}
}

function clearCanvas2D () {
	clearContext(context2D);
}

function createCanvasBlock(parent, name, id) {
	var canvas = document.createElement("canvas");
	if (id) 
		canvas.setAttribute("id", id + "canvas");
	var cell = createDiv("canvasblock");
	if (id)
		cell.setAttribute("id", id + "block");
	var h = document.createElement("h3");
	h.setAttribute("class", "canvas-head");
	cell.appendChild(h);
	h.innerHTML = name;
	var c = createDiv("direct-canvas-container");
	c.appendChild(canvas);
	cell.appendChild(c);
	parent.appendChild(cell);
	
	
	return canvas;
}

function animate()
{
    requestAnimationFrame ( animate ); 
    updateThreeContext(ctx3d);
    updateThreeContext(ctx4d); 
    updateThreeContext(ctx4dstereo); 
	//controls.update();
	//renderer.render (scene, camera);
}


console.log("script loaded");

