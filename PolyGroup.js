/**
* @author Anna Alekseeva
*/


var PolyGroup = function(scene, poly, styleParameters, type) {
	this.group = new THREE.Group();
	this.setStyle(styleParameters);
	this.scale = this.style.numbers.scale3D/2;
	
	this.type = {};
	for (var f in PolyGroup.defaultType) {
		if (PolyGroup.defaultType.hasOwnProperty(f))
			this.type[f] = PolyGroup.defaultType[f];
	}
	if (type) { 
		for (var f in type) {
			if (type.hasOwnProperty(f))
				this.type[f] = type[f];
		} 
	}

	if (this.type.faces) {
		this.bufferPolyhedron = new THREE.Mesh();
		var bGeo = new THREE.BufferGeometry;
		this.bufferPolyhedron.geometry = bGeo;
		this.bufferPolyhedron.material = new THREE.MeshLambertMaterial (this.style.meshMaterialData);
		this.bufferPolyhedron.userData.livePoly = true;
		this.group.add(this.bufferPolyhedron);
	}
	if (this.type.sticks) {
		var stickGeo = new THREE.CylinderBufferGeometry(this.style.edgeStickGeometry.size, //radius top
														this.style.edgeStickGeometry.size, //radius bottom
															1, //height
															16, //radial segments
															1 //height segments
															);
		var stickMat = new THREE.MeshLambertMaterial(this.style.edgeStickMaterialData);
		this.sticks = new Array(this.style.numbers.linesBufferLength);
		for (var i = 0; i < this.sticks.length; i++) {
			this.sticks[i] = new THREE.Mesh( stickGeo, stickMat );
			this.sticks[i].matrixAutoUpdate = false;
			this.group.add( this.sticks[i] );	
		}

	}else if (this.type.edges) {
		var geometries = new Array(this.style.numbers.linesBufferLength);
		var linesMaterial = new THREE.LineBasicMaterial(this.style.lineMaterialData);
		this.lines = new Array(this.style.numbers.linesBufferLength);
		for (var i = 0; i < this.lines.length; i++) {
			geometries[i] = new THREE.Geometry();
			this.lines[i] = new THREE.Line( geometries[i], linesMaterial );
			this.group.add( this.lines[i] );	
		}
	}
	
	if (this.type.vertices) {
		var ballGeo = new THREE.SphereBufferGeometry(this.style.vertexBallGeometry.size, 16, 16);
		var ballMat = new THREE.MeshLambertMaterial(this.style.vertexBallMaterialData);
		this.verts = new Array(this.style.numbers.ballsBufferLength);
		for (var i = 0; i < this.verts.length; i++) {
			this.verts[i] = new THREE.Mesh( ballGeo, ballMat );
			this.group.add( this.verts[i] );	
		}

	};
	
	this.getIntersect = function(raycaster, hp) {
		if (hp && hp.dim == 4) {
			var tol = this.style.numbers.tolerance; 
			var r = raycaster.ray;
			var toltol = tol*tol;
			var minDist = 10000;
			var vertex = null;
			var edgeObj = null;
			var edgePoint = new THREE.Vector3();
			if (this.type.vertices) {
				
				for (var i = 0; i < this.verts.length; i ++) {
					var rPoint = new THREE.Vector3();
					if (this.verts[i].visible) {
						var d = r.distanceSqToPoint(this.verts[i].position);
						if (d < toltol) {
							var l = r.origin.distanceToSquared(this.verts[i].position);
							if (l < minDist) {
								minDist = l;
								vertex = {index: i, position: this.verts[i].position.clone()}
							}
						}
					}
				}
			}
			if (vertex) {
				return {logicalPoint: cur4Poly.vertices[vertex.index].clone(), 
					displayPoint: this.verts[vertex.index].position.clone(), 
					type: "vertex", 
					distance: Math.sqrt(minDist), 
					index: vertex.index};
			}
			if (this.type.edges || this.type.sticks) {
				minDist = 10000;
				
				var rPoint = new THREE.Vector3();
				for (var i = 0; i < this.logicalPoly.edges.length; i++) {
					var seg = this.getEdgeSegment(i);
					var d = r.distanceSqToSegment(seg.v1, seg.v2, rPoint, edgePoint);
					if (d < toltol) {
						var l = r.origin.distanceToSquared(edgePoint);
						if (l < minDist) {
							minDist = l;
							edgeObj = {index: i, position: edgePoint.clone()};
						}
					}
				}
			}
			if (edgeObj) {				
				return {logicalPoint: this.displayToLogical(edgeObj.position, hp, "edge", edgeObj.index), 
					displayPoint: edgeObj.position.clone(), 
					type: "edge", 
					distance: Math.sqrt(minDist), 
					index: edgeObj.index};
				
			}
		} else {
			var intersects = raycaster.intersectObject(this.group, true);
			var i = 0; 
			var found = false;
			var o, p, d, f;
			while (i < intersects.length && !found) {
				o = intersects[i].object;
				if (o.userData.livePoly  || o.userData.polyEdgeIndex >= 0 || o.userData.polyVertIndex >= 0) {
					found = true;
					p = intersects[i].point;
					d = intersects[i].distance;
					if (o.userData.livePoly)
						f = intersects[i].faceIndex;
				}
				i++;
			}
			if (o && o.userData.livePoly) {
				var face = this.geoFaceIndices[f/3];
				var plog = this.logicalPoly.projectToFace(p.clone().multiplyScalar(1/this.scale), face);
			
				return {logicalPoint: plog, 
						displayPoint: plog.clone().multiplyScalar(this.scale), 
						type: "face", 
						distance: d, 
						index: face};
			} else if (o && o.userData.polyEdgeIndex >= 0) {
			
				var plog= this.logicalPoly.projectToEdge(p.clone().multiplyScalar(1/this.scale), o.userData.polyEdgeIndex);
				return {logicalPoint: plog, 
						displayPoint: plog.clone().multiplyScalar(this.scale), 
						type: "edge", 
						distance: d, 
						index: o.userData.polyEdgeIndex};

			} else if (o && o.userData.polyVertIndex >= 0) {
				var plog = this.logicalPoly.vertices[o.userData.polyVertIndex];
				return {logicalPoint: plog, 
						displayPoint: plog.clone().multiplyScalar(this.scale), 
						type: "vertex", 
						distance: d, 
						index: o.userData.polyVertIndex};

			}
		}
		return null; 
	}

	scene.add(this.group);
	
	if (poly) this.update(poly);
}

PolyGroup.style = {};
PolyGroup.style.numbers = {scale3D: 10, linesBufferLength: 300,  ballsBufferLength: 50, tolerance: 0.3}
PolyGroup.style.meshMaterialData = {color: 0xc8761e, opacity: 0.8, transparent: true, side: THREE.DoubleSide};
PolyGroup.style.lineMaterialData = {color: 0x993333, linewidth: 4};
PolyGroup.defaultType = {faces: true, edges: true, vertices: false, sticks: false};
PolyGroup.style.vertexBallGeometry = {size: 0.25}
PolyGroup.style.vertexBallMaterialData = { color: 0x888888};
PolyGroup.style.edgeStickGeometry = {size: 0.1};
PolyGroup.style.edgeStickMaterialData = {color: 0x66cc66};

PolyGroup.prototype = {
	constructor: PolyGroup,
	update: function (logicalPolyhedron) {
		this.logicalPoly = logicalPolyhedron;
		function updateWireFrame(lines, curPoly, sc) {
			var newGeoms = curPoly.getEdgeGeometries(sc, false);
			for (var i = 0; i < newGeoms.length; i++) {
				lines[i].userData.polyEdgeIndex = i;
				lines[i].geometry = newGeoms[i];
				lines[i].visible = true;
				lines[i].geometry.needsUpdate = true;
			}
			for (var i = newGeoms.length; i < lines.length; i++) {
				lines[i].visible = false;
			}

		}
		function updateSticks(lines, curPoly, sc) {
			if (lines.length < curPoly.edges.length)
				console.warn("Insufficient edge sticks buffer: " + lines.length + ", need " + curPoly.edges.length);
			var visibleSticks = Math.min(curPoly.edges.length, lines.length);
			for (var i = 0; i < visibleSticks; i++) {
				lines[i].visible = true;
				lines[i].userData.polyEdgeIndex = i;
				var m = Utils.edgeTransformMatrix (curPoly.vertices[curPoly.edges[i][0]], curPoly.vertices[curPoly.edges[i][1]], sc);
				lines[i].matrix.copy(m);
				lines[i].matrixAutoUpdate = false;

			}
			for (var i = visibleSticks; i < lines.length; i++) {
				lines[i].visible = false;
			}

		}
		function updateVertBalls(balls, curPoly, sc) {
			if (balls.length < curPoly.vertices.length) 
				console.warn("Insufficient vertex balls buffer: " + balls.length + ", need " + curPoly.vertices.length);
			var visibleVerts = Math.min(curPoly.vertices.length, balls.length);
			for (var i = 0; i < visibleVerts; i++) {
				var pos = curPoly.vertices[i].clone().multiplyScalar(sc);
				balls[i].userData.polyVertIndex = i;
				balls[i].visible = true;
				balls[i].position.set(pos.x, pos.y, pos.z);
				
			}
			for (var i = visibleVerts; i < balls.length; i++) {
				balls[i].visible = false;
			}

		}
		function updateBufferPoly (mesh, lpoly, sc) {
			var bGeo = lpoly.getGeometry(sc, false);
			mesh.geometry = bGeo;
			mesh.geometry.needsUpdate = true;
		}
		if (this.type.faces) {
			updateBufferPoly(this.bufferPolyhedron, logicalPolyhedron, this.scale);
			this.geoFaceIndices = logicalPolyhedron.geomFaces.slice();
		}
		if (this.type.sticks) { updateSticks(this.sticks, logicalPolyhedron, this.scale) }
		else if (this.type.edges) { updateWireFrame(this.lines, logicalPolyhedron, this.scale); }
		if (this.type.vertices) updateVertBalls(this.verts, logicalPolyhedron, this.scale); 
	},
	setStyle: function (style) {
		this.style = {};
		for (var f in PolyGroup.style) 
			if (PolyGroup.style.hasOwnProperty(f)) {
				this.style[f] = {};
				for (var g in PolyGroup.style[f]) 
					if (PolyGroup.style[f].hasOwnProperty(g))
						this.style[f][g] = PolyGroup.style[f][g];
				if (style && style.hasOwnProperty(f)) {
					for (var g in style[f]) 
						if (style[f].hasOwnProperty(g))
							this.style[f][g] = style[f][g];
					
				}
			}
		return this.style;
	},
	displayToLogical: function (disp, hp, type, index) {
		var p = disp.clone().multiplyScalar(1/this.scale);
		if (hp && hp.isHyperPlane && hp.dim == 4) {
			if (type.charAt(0) == "v") {
				return cur4Poly.vertices[index].clone();
			} else if (type.charAt(0) == "e") {
				var v1 = cur4Poly.vertices[this.logicalPoly.edges[index][0]].clone();
				var v2 = cur4Poly.vertices[this.logicalPoly.edges[index][1]].clone();
				var v1_ = hp.projectFlat(v1);
				var v2_ = hp.projectFlat(v2);
				var dv_ = new THREE.Vector3().subVectors(v2_, v1_);
				var alpha = v2_.sub(p).dot(dv_)/dv_.lengthSq();
				return new THREE.Vector4().lerpVectors(v2, v1, alpha);
				
			} else {
				return new hp.unproject(p);
			}
			
		}
		return p;
	},
	getEdgeSegment: function (index) {
		return {
					v1: this.logicalPoly.vertices[this.logicalPoly.edges[index][0]].clone().multiplyScalar(this.scale),
					v2: this.logicalPoly.vertices[this.logicalPoly.edges[index][1]].clone().multiplyScalar(this.scale)
		}
	}, 
	getVertex: function (index) {
		return this.logicalPoly.vertices[index].clone().multiplyScalar(this.scale);
	},
	logicalToDisplay: function (logp, hp) {
		if (logp.isVector4 && hp && hp.dim == 4) {
			var p = hp.project(logp);
			p.applyMatrix4(hp.matrix);
			var p3 = new THREE.Vector3(p.x, p.y, p.z);
			return p3.multiplyScalar(this.scale);
		
		} else {
			return logp.clone().multiplyScalar(this.scale);
		}
	},
	getVertexPprojections: function(camera){
		if (this.type.vertices) {
			var res = [];
			for (var i in this.verts){
				if (this.verts[i].position && this.verts[i].visible) {
					res.push (this.verts[i].position.clone().project(camera));
				}
			}
			return res;
		} return null
	}
	
}


console.log("PolyGroup loaded");

