/**
* @author Anna Alekseeva
*/


var PolyGroup = function(scene, poly, styleParameters, type = {faces: true, edges: true}) {
	this.group = new THREE.Group();
	this.setStyle(styleParameters);
	this.type = type;
	if (this.type.faces) {
		this.bufferPolyhedron = new THREE.Mesh();
		var bGeo = new THREE.BufferGeometry;
		this.bufferPolyhedron.geometry = bGeo;
		this.bufferPolyhedron.material = new THREE.MeshLambertMaterial (this.style.meshMaterialData);
		this.group.add(this.bufferPolyhedron);
	}
	
	if (this.type.edges) {
		var geometries = new Array(this.style.numbers.linesBufferLength);
		var linesMaterial = new THREE.LineBasicMaterial(this.style.lineMaterialData);
		this.lines = new Array(this.style.numbers.linesBufferLength);
		for (var i = 0; i < this.lines.length; i++) {
			geometries[i] = new THREE.Geometry();
			this.lines[i] = new THREE.Line( geometries[i], linesMaterial );
			this.group.add( this.lines[i] );	
		}
	}
	
	scene.add(this.group);
	
	if (poly) this.update(poly);
}

PolyGroup.style = {};
PolyGroup.style.numbers = {scale3D: 10, linesBufferLength: 300 }
PolyGroup.style.meshMaterialData = {color: 0xc8761e, opacity: 0.8, transparent: true, side: THREE.DoubleSide};
PolyGroup.style.lineMaterialData = {color: 0x993333, linewidth: 3};

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
		function updateBufferPoly (mesh, lpoly, sc) {
			var bGeo = lpoly.getGeometry(sc, false);
			mesh.geometry = bGeo;
			mesh.geometry.needsUpdate = true;
		}
		if (this.type.faces) updateBufferPoly(this.bufferPolyhedron, logicalPolyhedron, this.style.numbers.scale3D/2);
		if (this.type.edges) updateWireFrame(this.lines, logicalPolyhedron, this.style.numbers.scale3D/2); 
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

