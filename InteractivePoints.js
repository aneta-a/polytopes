/**
* @author Anna Alekseeva
*/


var InteractivePoints = function(context, dim = 3, style = {}) {
	this.context = context;
	this.dim = dim;
	this.style = {};
	this.canvas = context.renderer.domElement;
	copyObject(InteractivePoints.style, this.style);
	copyObject(style, this.style);
	
	this.hp = new HyperPlane(dim);
	
	this.group = new THREE.Group();
	this.balls = new Array(dim);
	var scope = this;
	
	function createBall() {
		var geom = new THREE.SphereBufferGeometry(scope.style.size, 16, 16);
		var mat = new THREE.MeshLambertMaterial(scope.style.materialData);
		var ball = new THREE.Mesh(geom, mat);
		ball.visible = false;
		return ball;
	}
	
	for (var i = 0; i < dim; i++) {
		this.balls[i] = createBall();
		this.balls[i].userData.indexIntPoint = i;
		this.group.add(this.balls[i]);
	}
	this.context.scene.add(this.group);
	
	this.dispatchEvent = function() {
		if (!this.silent)
			this.canvas.dispatchEvent(new CustomEvent("pointschange", {detail: this.getLogical()}));
	}
	
	this.activePoints = new Array(this.dim);
	
}

InteractivePoints.prototype = {
	constructor: InteractivePoints,
	addPoint: function (posObj){
		var firstFree = -1;
		var i = 0;
		while (i < this.dim && firstFree < 0) {
			if (!this.balls[i].visible) firstFree = i;
			i++
		}
		if (firstFree < 0) {
			this.removePoint(this.dim - 1);
			firstFree = this.dim - 1;
		}
		var ind = firstFree;
		this.balls[ind].visible = true;
		var p = posObj.displayPoint;
		this.balls[ind].position.set(p.x, p.y, p.z);
		this.activePoints[ind] = {logicalPoint: posObj.logicalPoint.clone(), type: posObj.type, index: posObj.index, dim: this.dim};
		this.dispatchEvent()
	},
	getCount: function () {
		var res = 0;
		for (var i = 0; i < this.dim; i++) {
			if (this.activePoints[i]) res++;
		}
		return res;
	},
	removePoint: function (point) {
		var ind, p;
		if (point.isMesh) {
			ind = point.userData.indexIntPoint;
			p = point;
		} else {
			ind = point;
			p = this.balls[ind];
		}
		p.visible = false; 
		this.activePoints[ind] = null;
		this.dispatchEvent();

	},
	startDrag: function (intrObject) {
		this.dragPointIndex = intrObject.object.userData.indexIntPoint;
		return this.activePoints[this.dragPointIndex];
	},
	movePoint: function (newPosObj) {
		if (this.dragPointIndex >= 0) {
			this.activePoints[this.dragPointIndex].logicalPoint = newPosObj.logicalPoint.clone();
			//??Should we change type and index here?
			var p = newPosObj.displayPoint.clone();
			this.balls[this.dragPointIndex].position.set(p.x, p.y, p.z);
			this.dispatchEvent();
		}
	},
	stopDrag: function () {
		this.dragPointIndex = -1;
	},
	getLogical: function () {
		var res = [];
		for (var i = 0; i < this.dim; i++) {
			if (this.activePoints[i])
				res.push(this.activePoints[i].logicalPoint.clone());
		}
		return res;
	},
	set: function (newPosObjs, mode, preserveTypes = false) {
		var oldSilent = this.silent;
		this.silent = true;
		if (preserveTypes) {
			for (var i = 0; i < newPosObjs.length; i++) {
				if (this.activePoints[i]) {
					newPosObjs[i].type = this.activePoints[i].type;
					newPosObjs[i].index = this.activePoints[i].index;
				}
			}
		}
		this.clear();
		for (var i = 0; i < Math.min(this.dim, newPosObjs.length); i++) {
			this.addPoint(newPosObjs[i]);
		}
		if (!(mode == "silent")) this.silent = oldSilent;
		this.dispatchEvent();
		this.silent = oldSilent;
	},
	clear: function () {
		var oldSilent = this.silent;
		this.silent = true;
		for (var i = 0; i < this.dim; i++)
			this.removePoint(i);
		this.silent = oldSilent;
		this.dispatchEvent();
	},
	handleDoubleClick: function (intersects) {
		if (intersects.length > 0) {
			this.silent = true;
			for (var i = 0; i < intersects.length; i++) {
				var ind = intersects[i].object.userData.indexIntPoint;
				if (ind >= 0)
					this.removePoint(ind);
			}
			this.silent = false;
			this.dispatchEvent();
		}
	}, 
	reproject: function (newPoly) {}// implement LogicalPolyhedron projectToFace
	
	
}

InteractivePoints.style = {
	scale: PolyGroup.style.numbers.scale3D/2,
	size: .2,
	materialData: {color: 0xcc3333}
}

InteractivePoints.addEventTypes = ["dblclick"];
InteractivePoints.startEventTypes = ["mousedown", "touchstart"];
InteractivePoints.stopEventTypes = ["mouseup", "touchend"];
InteractivePoints.moveEventTypes = ["mousemove", "touchmove"];
InteractivePoints.setClickManager = function (context, points, objects) {
	var rc = new THREE.Raycaster();
	var canvas = context.renderer.domElement;
	var eventTypes = InteractivePoints.addEventTypes;
	function setRC (ev) {
		var ev_;
		if (ev.touches) {
			if (ev.touches.length > 0) 
				ev_ = ev.touches[0];
			else return;
		} else ev_ = ev;
		var pos2 = getMousePos(canvas, ev_); //UIUtils
		var x = ( pos2.x / canvas.width ) * 2 - 1;
    	var y = -( pos2.y / canvas.height ) * 2 + 1;
    	rc.setFromCamera(new THREE.Vector2(x, y), context.camera);
	}
	function getPointObj (polytopeElement = null) {
		
		if (polytopeElement && polytopeElement.dim == 4) {
			var pg = objects[0];
			if (polytopeElement.type == "edge") {
				var seg = pg.getEdgeSegment(polytopeElement.index);
				var rPoint = new THREE.Vector3();
				var edgePoint = new THREE.Vector3();                                           
				var d = rc.ray.distanceSqToSegment(seg.v1, seg.v2, rPoint, edgePoint);
				var dv = new THREE.Vector3().subVectors(seg.v2, seg.v1);
				var dd = new THREE.Vector3().subVectors(edgePoint, seg.v1).dot(dv);
				var alpha = dd/dv.lengthSq();
				alpha = Math.min(1, Math.max(0, alpha));
				var lp = polytopeElement.dim == 4 ? cur4Poly : curPoly;
				return {
					logicalPoint: lp.getPointOnEdge(polytopeElement.index, alpha),
					displayPoint: edgePoint.clone(),
					type: "edge",
					index: polytopeElement.index
				}
			
			} else if(polytopeElement.type == "vertex"){
				var lp = polytopeElement.dim == 4 ? cur4Poly : curPoly;
				return {
					logicalPoint: lp.vertices[polytopeElemet.index],
					displayPoint: pg.getVertex(polytopeElemet.index),
					type: "vertex",
					index: polytopeElement.index
				}
			}
		}
		var intersectsObjects = [];
		for (var j = 0; j < objects.length; j++) {
			var pg = objects[j];
			
			var curObj = pg.getIntersect(rc, points.dim == 4 ? curSectionHP4d : null);
			intersectsObjects.push(curObj);
		}
		if (intersectsObjects.length > 0) {
			var finalObj, minDist = 100000;
			for (var i = 0; i < intersectsObjects.length; i++) {
				if (intersectsObjects[i] && intersectsObjects[i].distance < minDist) {
					finalObj = intersectsObjects[i];
					minDist = finalObj.distance;
				}
			}
			return finalObj;
		}
		return null
	}
	function eventHandler(ev) {
		setRC(ev);
		var intersectsPoints = rc.intersectObject(points.group, true);
		if (intersectsPoints.length > 0) points.handleDoubleClick(intersectsPoints);
		else {
			var polyObj = getPointObj();
			if (polyObj) {
				points.addPoint(polyObj);
				
			}
		}
	}
	var curDragPoint = null;
	function startDragEventHandler(ev) {
		context.controls.enableRotate = true;
		ev.preventDefault();
		
		setRC(ev);
		var intersectsPoints = rc.intersectObject(points.group, true);
		if (intersectsPoints.length > 0) {
			curDragPoint = points.startDrag(intersectsPoints[0]);
			
			addEvents(InteractivePoints.moveEventTypes, moveHandler, true);
			addEvents(InteractivePoints.stopEventTypes, stopDragEventHandler, true);
			document.addEventListener("mouseup", docStopDrag, false);
			context.controls.enabled = false
		}
		
	}
	function moveHandler (ev) {
		
		setRC(ev);
		var polyObj;
		if (points.dim == 4 && curDragPoint) {
			polyObj = getPointObj(curDragPoint);
		}
		else polyObj = getPointObj();
		if (polyObj) points.movePoint(polyObj);
	}
	
	function docStopDrag(ev) {
		stopDragEventHandler(ev);
		context.controls.enableRotate = false;
		
	}
	function stopDragEventHandler(ev) {
		points.stopDrag(); 
		curDragPoint = null;             
		addEvents(InteractivePoints.moveEventTypes, moveHandler, false);
		addEvents(InteractivePoints.stopEventTypes, stopDragEventHandler, false);
		document.removeEventListener("mouseup", docStopDrag, false);
		context.controls.enabled = true;
	}
	function addEvents(eventTypes_, handler_, add=true) {
		for (var i = 0; i < eventTypes_.length; i++) {
			if (add) {
				canvas.addEventListener(eventTypes_[i], handler_, false);
				}
			else
				canvas.removeEventListener(eventTypes_[i], handler_);
		}
	}
	for (var i = 0; i < eventTypes.length; i++) {
		canvas.addEventListener(eventTypes[i], eventHandler, false);
	}
	addEvents(InteractivePoints.startEventTypes, startDragEventHandler, true);
	
	function updateHp (ev) {
		//In 4d, when projection plane changes, the points change their positions. 
		var hp = ev.detail;
		if (hp && hp.isHyperPlane && hp.dim == 4 && points.dim == 4) {
			var lPoints = points.getLogical();
			var objs = [];
			var pg = objects[0];
			for (var i = 0; i < lPoints.length; i++) {
				
				objs.push({logicalPoint: lPoints[i], displayPoint: pg.logicalToDisplay (lPoints[i], hp)});
			}
			points.set(objs, "silent", true);
		}
	}
	addSingleTapListener(eventHandler, canvas); //UIUtils
	addSingleClickListener(eventHandler, canvas); //UIUtils
	canvas.addEventListener("hpchange", updateHp, false);
}


