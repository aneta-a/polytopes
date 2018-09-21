/**
* @author Anna Alekseeva
*/


var PolyGroup = function(scene, poly, styleParameters, type) {
	this.group = new THREE.Group();
	this.setStyle(styleParameters);
	
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

	}
	
	scene.add(this.group);
	
	if (poly) this.update(poly);
}

PolyGroup.style = {};
PolyGroup.style.numbers = {scale3D: 10, linesBufferLength: 300,  ballsBufferLength: 50}
PolyGroup.style.meshMaterialData = {color: 0xc8761e, opacity: 0.8, transparent: true, side: THREE.DoubleSide};
PolyGroup.style.lineMaterialData = {color: 0x993333, linewidth: 3};
PolyGroup.defaultType = {faces: true, edges: true, vertices: false, sticks: false};
PolyGroup.style.vertexBallGeometry = {size: 0.25}
PolyGroup.style.vertexBallMaterialData = { color: 0x888888};
PolyGroup.style.edgeStickGeometry = {size: 0.1};
PolyGroup.style.edgeStickMaterialData = {color: 0x66cc66};

PolyGroup.prototype = {
	constructor: PolyGroup,
	update: function (logicalPolyhedron) {
		function updateWireFrame(lines, curPoly, sc) {
			var newGeoms = curPoly.getEdgeGeometries(sc, false);
			for (var i = 0; i < newGeoms.length; i++) {
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
		if (this.type.faces) updateBufferPoly(this.bufferPolyhedron, logicalPolyhedron, this.style.numbers.scale3D/2);
		if (this.type.sticks) { updateSticks(this.sticks, logicalPolyhedron, this.style.numbers.scale3D/2) }
		else if (this.type.edges) { updateWireFrame(this.lines, logicalPolyhedron, this.style.numbers.scale3D/2); }
		if (this.type.vertices) updateVertBalls(this.verts, logicalPolyhedron, this.style.numbers.scale3D/2); 
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
	}
	
}
console.log("PolyGroup loaded");

