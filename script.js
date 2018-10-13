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
	
	document.body.appendChild(document.createElement("h2")).innerHTML = "Regular polyhedra"
	
	var c3d = initCanvas3D();
	var c2d = initCanvas2D();
	var c2ds = initStereoCanvas2D();
	var cRow = document.body.appendChild(document.createElement("table")).appendChild(document.createElement("tr"));
	var td1 = document.createElement("td");
	td1.appendChild(c3d);
	cRow.appendChild(td1);
	var td2 = document.createElement("td");
	td2.appendChild(c2d);
	cRow.appendChild(td2);
	var td3 = document.createElement("td");
	td3.appendChild(c2ds);
	cRow.appendChild(td3);
	initControls();

	document.body.appendChild(document.createElement("h2")).innerHTML = "Some regular and semiregular polytopes"
	
	initCanvas4D();
	var c4d =  createCanvasBlock(ctx4d, "Section and Projection");
	var c4ds =  createCanvasBlock(ctx4dstereo, "Stereographic Projection");
	var cRow = document.body.appendChild(document.createElement("table")).appendChild(document.createElement("tr"));
	var td1 = document.createElement("td");
	td1.appendChild(c4d);
	cRow.appendChild(td1);
	var td2 = document.createElement("td");
	td2.appendChild(c4ds);
	cRow.appendChild(td2);
	initControls4D();
	
	updateDirection();
  	animate();
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

function initControls() {
	//createRadioGroup (object, name, defaultValueName = null, parent = document.body, layout="horizontal")
	var selectSolid = createRadioGroup (solids, "solid", "Icosahedron", onSolidChange);
	var sliderTableElement = document.createElement("table");
	
	sliderPhi = setSlider("&phi;", -1, 1, "-&pi;", "&pi;", 0, "&pi;", sliderTableElement);
	sliderTheta = setSlider("&theta;", 0, 1, "0", "&pi;", 0, "&pi;", sliderTableElement);
	sliderH = setSlider("h", -2, 2, "-2", "2", 0, "", sliderTableElement);
	document.body.appendChild(sliderTableElement);

	normalInputOutput = setNormalInput("normalInput3d"); 

	sliderPhi.addEventListener("change", updateDirection);
	sliderTheta.addEventListener("change", updateDirection);
	sliderH.addEventListener("change", updateDirection);

	document.body.appendChild (document.createElement("br"));
	

}

function initControls4D() {
	var selectSolid4d = createRadioGroup (solids4d, "solid4d", "Simplex", onSolid4dChange);
	
	sliderPhi4d = setSlider("&phi;", -1, 1, "-&pi;", "&pi;", 0, "&pi;");
	sliderTheta4d = setSlider("&theta;", 0, 1, "0", "&pi;", 0, "&pi;");
	sliderChi4d = setSlider("&chi;", 0, 1, "0", "&pi;", 0, "&pi;");
	sliderH4d = setSlider("h", -2, 2, "-2", "2", 0, "");
	
	normalInputOutput4d = setNormalInput("normalInput4d", 4)
	
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
	res.setAttribute("name", name);
	res.appendChild(document.createTextNode("n = ("));
	var compNames = ["x", "y", "z", "w"];
	for (var i = 0; i < dim; i++) {
		var input = document.createElement("input");
		input.setAttribute("type", "text");
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
	parent.appendChild(res);
	return res;
}

function onDirVectorInput(name) {
	var inputEl = document.getElementsByName(name)[0];
	var v = inputEl.getVector();
	var dir = Utils.vectorToDir(v);
	if (name == "normalInput4d") {
		//setSlidersValue(dir, sliderPhi4d, sliderTheta4d, sliderChi4d);
		//sliderH4d.value = v.length();
		//sliderH4d.updateValueOutput();
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

function createCanvasBlock(element, name, parent = document.body) {
	var cell = document.createElement("table");
	var h = cell.appendChild(document.createElement("tr")).appendChild(document.createElement("th"));
	h.innerHTML = name;
	var c = cell.appendChild(document.createElement("tr")).appendChild(document.createElement("td"));
	if (element.hasOwnProperty("renderer")) element = element.renderer.domElement;
	c.appendChild(element);
	parent.appendChild(cell);
	return cell;
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

